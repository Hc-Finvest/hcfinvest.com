import express from 'express'
import alltickApiService from '../services/alltickApiService.js'
import storageService from '../services/storageService.js'
import { requireOpsAuth } from '../middleware/opsAuth.js'
import { opsRateLimit, getOpsRateLimitStats } from '../middleware/opsRateLimit.js'
import OpsActionLog from '../models/OpsActionLog.js'
import redisClient from '../services/redisClient.js'
import { aggregateToTimeframe, fillGaps, validateContinuity } from '../utils/candleAggregator.js'
import { normalizeSymbol as canonicalizeSymbol, getSymbolMetadata } from '../config/symbols.js'

const router = express.Router()

const OPS_AUDIT_LOG_ENABLED = (process.env.OPS_AUDIT_LOG_ENABLED || 'true').toLowerCase() !== 'false'

const getIpAddress = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || ''
}

const writeOpsAudit = async (req, action, status, payload = null, reason = '') => {
  if (!OPS_AUDIT_LOG_ENABLED) return

  try {
    await OpsActionLog.create({
      action,
      route: req.originalUrl || req.path || '/api/prices',
      method: req.method || 'POST',
      status,
      ipAddress: getIpAddress(req),
      reason,
      payload
    })
  } catch (error) {
    console.error('[PricesAPI] Failed to write ops audit log:', error.message)
  }
}

const toEpochMs = (raw) => {
  if (!raw) return 0
  if (raw instanceof Date) return raw.getTime()
  if (typeof raw === 'number') return raw > 10000000000 ? raw : raw * 1000
  const parsed = Date.parse(raw)
  return Number.isFinite(parsed) ? parsed : 0
}

const getFeedStateFromFreshness = ({ isConnected, freshness = 'degraded', degraded = false, quoteAgeMs = null }) => {
  if (!isConnected) return 'reconnecting'
  if (degraded) return 'degraded'
  if (Number.isFinite(quoteAgeMs) && quoteAgeMs > 90_000) return 'stale'
  if (freshness === 'stale') return 'stale'
  if (freshness === 'degraded') return 'degraded'
  return 'live'
}

const getQuoteAgeMs = (quote) => {
  if (!quote?.time) return null
  const quoteTimeMs = toEpochMs(quote.time)
  if (!quoteTimeMs) return null
  return Math.max(0, Date.now() - quoteTimeMs)
}

const normalizeHistoryCachePayload = (payload, symbol, timeframe) => {
  if (Array.isArray(payload)) {
    return {
      success: true,
      symbol,
      timeframe,
      candles: payload,
      count: payload.length,
      provider: 'storage-cache',
      source: 'redis_history_response',
      freshness: 'cached',
      degraded: false
    }
  }

  return {
    success: true,
    symbol,
    timeframe,
    ...payload,
    source: payload.source || 'redis_history_response',
    freshness: payload.freshness || 'cached',
    degraded: payload.degraded === true
  }
}

const isWeekendClosedBucket = (timeMs) => {
  const date = new Date(timeMs)
  const day = date.getUTCDay()
  const hour = date.getUTCHours()

  if (day === 5 && hour >= 22) return true
  if (day === 6) return true
  if (day === 0 && hour < 22) return true
  return false
}

const isDailyMaintenanceBreakBucket = (symbol, timeMs) => {
  const metadata = getSymbolMetadata(symbol)
  if (!metadata || !['commodity', 'index'].includes(metadata.type)) return false

  const date = new Date(timeMs)
  const day = date.getUTCDay()
  const hour = date.getUTCHours()

  return day >= 1 && day <= 5 && hour === 21
}

const isTradableBucket = (symbol, timeMs) => {
  if (isWeekendClosedBucket(timeMs)) return false
  if (isDailyMaintenanceBreakBucket(symbol, timeMs)) return false
  return true
}

const filterCandlesToRequestedWindow = (candles, startTime, endTime) => {
  if (!Array.isArray(candles) || candles.length === 0) return []

  const startMs = Number.isFinite(Number(startTime))
    ? (Number(startTime) > 10000000000 ? Number(startTime) : Number(startTime) * 1000)
    : null
  const endMs = Number.isFinite(Number(endTime))
    ? (Number(endTime) > 10000000000 ? Number(endTime) : Number(endTime) * 1000)
    : null

  return candles.filter((candle) => {
    const time = Number(candle?.time)
    if (!Number.isFinite(time) || time <= 0) return false
    if (startMs && time < startMs) return false
    if (endMs && time >= endMs) return false
    return true
  })
}

const fillGapsSessionAware = (candles, intervalMinutes, until, symbol) => {
  if (!Array.isArray(candles) || candles.length === 0) return candles

  const intervalMs = intervalMinutes * 60 * 1000
  const filled = []
  const sorted = [...candles].sort((a, b) => a.time - b.time)

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i]
    const next = sorted[i + 1]
    filled.push(current)

    const currentTime = Number(current.time)
    const nextTime = Number(next.time)
    const gapMs = nextTime - currentTime

    if (gapMs > intervalMs * 1.5 && gapMs < (12 * 60 * 60 * 1000)) {
      const nextBucket = Math.floor(nextTime / intervalMs) * intervalMs
      let fillTime = Math.floor(currentTime / intervalMs) * intervalMs + intervalMs

      while (fillTime < nextBucket) {
        if (isTradableBucket(symbol, fillTime)) {
          filled.push({
            time: fillTime,
            open: current.close,
            high: current.close,
            low: current.close,
            close: current.close,
            volume: 0.0001,
            isFilled: true
          })
        }
        fillTime += intervalMs
      }
    }
  }

  const lastReal = sorted[sorted.length - 1]
  filled.push(lastReal)

  if (until && Number.isFinite(until)) {
    const untilMs = until < 10000000000 ? until * 1000 : until
    const lastBucket = Math.floor(lastReal.time / intervalMs) * intervalMs
    const untilBucket = Math.floor(untilMs / intervalMs) * intervalMs
    const maxPadding = 2 * 60 * 60 * 1000
    const actualUntil = Math.min(untilBucket, lastBucket + maxPadding)

    let fillTime = lastBucket + intervalMs
    while (fillTime <= actualUntil) {
      if (isTradableBucket(symbol, fillTime)) {
        filled.push({
          time: fillTime,
          open: lastReal.close,
          high: lastReal.close,
          low: lastReal.close,
          close: lastReal.close,
          volume: 0.0001,
          isFilled: true,
          isPadding: true
        })
      }
      fillTime += intervalMs
    }
  }

  return filled
}

// GET /api/prices/status - Get market data service status
router.get('/status', async (req, res) => {
  try {
    const status = { connected: alltickApiService.isConnected, provider: 'alltick' }
    const livePersistence = storageService.getLivePersistenceStats()
    const syncStats = storageService.getSyncStats()
    const historyHealth = storageService.getHistoryHealthStats()
    const lockStatus = await storageService.getLockStatus()
    const opsRateLimit = getOpsRateLimitStats()
    const feedHealth = {
      state: alltickApiService.isConnected ? 'live' : 'reconnecting',
      provider: 'alltick'
    }
    res.json({ success: true, status, feedHealth, livePersistence, syncStats, historyHealth, lockStatus, opsRateLimit })
  } catch (error) {
    console.error('Error fetching status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/time - Get authoritative server time for candle countdown
router.get('/time', (req, res) => {
  res.json({ success: true, time: Math.floor(Date.now() / 1000) });
})

//Sanket v2.0 - Returns the currently running (in-progress) candle from backend live state
//Sanket v2.0 - Also returns recent CLOSED candles from Redis ZSET rolling buffer (last 30 min)
//Sanket v2.0 - recentClosed fills the gap between stale AllTick history and the current bar
//Sanket v2.0 - Without recentClosed the frontend gap-fill uses flat placeholder bars → blank visual gap
// GET /api/prices/current-candle?symbol=XAUUSD&resolution=1m
router.get('/current-candle', async (req, res) => {
  try {
    const { symbol, resolution } = req.query;
    if (!symbol || !resolution) {
      return res.status(400).json({ success: false, message: 'symbol and resolution required' });
    }

    const cleanSymbol = canonicalizeSymbol(symbol);
    const serverNow = Date.now();
    const timeframeMs = storageService.timeframeToSeconds(resolution) * 1000;
    const currentBucketStart = Math.floor(serverNow / timeframeMs) * timeframeMs;
    const latestQuote = await alltickApiService.getPrice(cleanSymbol);
    const quoteAgeMs = getQuoteAgeMs(latestQuote);

    // ── Current open bar from in-memory liveBars ──
    const barKey = `${cleanSymbol}|${resolution}`;
    const liveBar = storageService.liveBars.get(barKey);
    let currentCandle = null;
    let authority = 'live_bar';
    let source = 'storage_live_bar';
    if (liveBar && liveBar.timeMs >= currentBucketStart) {
      currentCandle = {
        time: liveBar.timeMs,
        open: liveBar.open,
        high: liveBar.high,
        low: liveBar.low,
        close: liveBar.close,
        volume: liveBar.volume || 0,
        isClosed: false
      };
    }

    //Sanket v2.0 - Fetch recent CLOSED candles from Redis ZSET (last 30 min, up to current bucket)
    //Sanket v2.0 - These are tick-accurate bars built by storageService.ingestTick → pushToRedisRolling
    //Sanket v2.0 - They are missing from AllTick history due to 5-minute Redis response cache lag
    const fromSec = Math.floor((serverNow - 30 * 60 * 1000) / 1000);
    const toSec = Math.floor(serverNow / 1000);
    const rawRecent = await storageService.getCandlesFromRedis(cleanSymbol, resolution, fromSec, toSec, 120);
    const recentBars = rawRecent
      .map(b => {
        const t = b.time instanceof Date ? b.time.getTime() : Number(b.time);
        return { time: t, open: Number(b.open), high: Number(b.high), low: Number(b.low), close: Number(b.close), volume: Number(b.volume) || 0 };
      })
      .filter(b => Number.isFinite(b.time) && b.time > 0 && Number.isFinite(b.close) && b.close > 0);
    const recentClosed = recentBars.filter(b => b.time < currentBucketStart);
    const redisCurrentBar = [...recentBars].reverse().find(b => b.time >= currentBucketStart);

    if (!currentCandle && redisCurrentBar) {
      currentCandle = {
        ...redisCurrentBar,
        isClosed: false
      };
      authority = 'redis_rolling';
      source = 'storage_redis_rolling';
    }

    let bootstrap = null;
    if (!currentCandle) {
      const latestStored = await storageService.getLatestCloseQuote(cleanSymbol, resolution);
      if (latestStored && Number(latestStored.close) > 0) {
        const latestTimeMs = toEpochMs(latestStored.time);
        bootstrap = {
          time: latestTimeMs,
          close: Number(latestStored.close),
          source: latestStored.source || 'storage_latest_close'
        };

        if (latestTimeMs >= currentBucketStart) {
          currentCandle = {
            time: currentBucketStart,
            open: Number(latestStored.close),
            high: Number(latestStored.close),
            low: Number(latestStored.close),
            close: Number(latestStored.close),
            volume: 0,
            isClosed: false,
            synthesized: true
          };
          authority = 'stored_close_bootstrap';
          source = latestStored.source || 'storage_latest_close';
        }
      }
    }

    const freshnessResult = storageService.estimateSeriesFreshness(
      currentCandle ? [currentCandle] : recentClosed,
      resolution
    );
    const degraded = !currentCandle && recentClosed.length === 0 && !bootstrap;
    const feedState = getFeedStateFromFreshness({
      isConnected: alltickApiService.isConnected,
      freshness: freshnessResult.freshness,
      degraded,
      quoteAgeMs
    });
    const effectiveAuthority = currentCandle ? authority : (bootstrap ? 'stored_close_reference' : 'none');
    const effectiveSource = currentCandle ? source : (bootstrap?.source || 'none');

    return res.json({
      success: true,
      candle: currentCandle,
      recentClosed,
      authority: effectiveAuthority,
      source: effectiveSource,
      freshness: freshnessResult.freshness,
      degraded,
      feedState,
      quoteAgeMs,
      bootstrap,
      serverTime: Math.floor(serverNow / 1000)
    });
  } catch (error) {
    console.error('[current-candle] error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
})

// GET /api/prices/live-persistence - Get real-time candle persistence health
router.get('/live-persistence', async (req, res) => {
  try {
    const stats = storageService.getLivePersistenceStats()
    res.json({ success: true, stats })
  } catch (error) {
    console.error('Error fetching live persistence stats:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/live-persistence/flush - Force immediate flush of pending live candle writes
router.post('/live-persistence/flush', requireOpsAuth, opsRateLimit, async (req, res) => {
  try {
    const stats = await storageService.flushNow()
    writeOpsAudit(req, 'LIVE_PERSISTENCE_FLUSH', 'accepted', {
      pendingAfter: stats.pendingLiveBarOps,
      writes: stats.livePersistedWrites
    })
    res.json({ success: true, message: 'Live persistence flush completed', stats })
  } catch (error) {
    writeOpsAudit(req, 'LIVE_PERSISTENCE_FLUSH', 'failed', null, error.message)
    console.error('Error flushing live persistence queue:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/sync - Force immediate sync of all historical data
router.post('/sync', requireOpsAuth, opsRateLimit, async (req, res) => {
  try {
    const syncStats = storageService.getSyncStats()
    if (syncStats.isSyncing) {
      writeOpsAudit(req, 'HISTORY_SYNC', 'skipped', syncStats, 'sync already in progress')
      return res.status(202).json({
        success: true,
        message: 'Sync already in progress',
        stats: syncStats
      })
    }

    console.log('[PricesAPI] 🔄 Manual sync triggered');
    // Trigger sync in background (don't wait)
    storageService.syncAllSymbols().catch(err => {
      console.error('[PricesAPI] Sync error:', err.message);
    });
    writeOpsAudit(req, 'HISTORY_SYNC', 'accepted', { started: true })
    
    res.json({ 
      success: true, 
      message: 'Sync triggered. Check backend logs for progress.',
      info: 'Syncing all symbols now...'
    });
  } catch (error) {
    writeOpsAudit(req, 'HISTORY_SYNC', 'failed', null, error.message)
    console.error('Error triggering sync:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prices/backfill - Backfill missing historical data for a symbol
router.post('/backfill', requireOpsAuth, opsRateLimit, async (req, res) => {
  try {
    const { symbol, days = 7 } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required' });
    }
    
    const parsedDays = Number(days)
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      return res.status(400).json({ success: false, message: 'days must be a positive number' })
    }
    if (parsedDays > 365) {
      return res.status(400).json({ success: false, message: 'days cannot exceed 365' })
    }

    if (!alltickApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ success: false, message: `Symbol ${symbol} is not supported` });
    }
    
    console.log(`[PricesAPI] 🔙 Backfill triggered for ${symbol} (${parsedDays} days)`);
    
    // Run backfill in background
    const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];
    
    // Queue backfills for all timeframes
    Promise.all(timeframes.map(tf => 
      storageService.backfill(symbol, tf, parsedDays).catch(err => {
        console.error(`[PricesAPI] Backfill error for ${symbol} ${tf}:`, err.message);
      })
    )).then(() => {
      console.log(`[PricesAPI] ✅ Backfill completed for ${symbol}`);
    });
    writeOpsAudit(req, 'HISTORY_BACKFILL', 'accepted', { symbol, days: parsedDays, timeframes })
    
    res.json({ 
      success: true, 
      message: `Backfill started for ${symbol} (${parsedDays} days, all timeframes). Check backend logs for progress.`
    });
  } catch (error) {
    writeOpsAudit(req, 'HISTORY_BACKFILL', 'failed', null, error.message)
    console.error('Error triggering backfill:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prices/gaps - Detect candle gaps for a symbol/timeframe
router.get('/gaps', async (req, res) => {
  try {
    const { symbol, resolution, hours } = req.query
    if (!symbol) return res.status(400).json({ success: false, message: 'symbol is required' })
    if (!alltickApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ success: false, message: `Symbol ${symbol} is not supported` })
    }
    const timeframe = resolution || '1h'
    const fromHours = Math.min(Math.max(Number(hours) || 24, 1), 168) // clamp 1–168 h
    const gaps = await storageService.getGaps(symbol, timeframe, fromHours)
    res.json({ success: true, symbol, timeframe, fromHours, gapCount: gaps.length, gaps })
  } catch (error) {
    console.error('Error detecting gaps:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/gaps/repair - Repair a specific candle gap
router.post('/gaps/repair', requireOpsAuth, opsRateLimit, async (req, res) => {
  try {
    const { symbol, resolution, gapStart, gapEnd } = req.body
    if (!symbol || !gapStart || !gapEnd) {
      return res.status(400).json({ success: false, message: 'symbol, gapStart and gapEnd are required' })
    }
    if (!alltickApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ success: false, message: `Symbol ${symbol} is not supported` })
    }
    const timeframe = resolution || '1h'
    const start = new Date(gapStart)
    const end = new Date(gapEnd)
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ success: false, message: 'gapStart and gapEnd must be valid ISO dates with gapStart < gapEnd' })
    }
    console.log(`[PricesAPI] 🔧 Gap repair triggered: ${symbol} ${timeframe} ${gapStart}→${gapEnd}`)
    const candles = await storageService.repairGap(symbol, timeframe, start, end)
    writeOpsAudit(req, 'GAP_REPAIR', 'accepted', { symbol, timeframe, gapStart, gapEnd, fetched: candles?.length ?? 0 })
    res.json({ success: true, message: `Gap repair completed for ${symbol} ${timeframe}`, candlesFetched: candles?.length ?? 0 })
  } catch (error) {
    writeOpsAudit(req, 'GAP_REPAIR', 'failed', null, error.message)
    console.error('Error repairing gap:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/symbols - Get all supported symbols
router.get('/symbols', async (req, res) => {
  try {
    const symbols = alltickApiService.getSupportedSymbols()
    res.json({ success: true, symbols })
  } catch (error) {
    console.error('Error fetching symbols:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/categories - Get all categories with symbols and prices
router.get('/categories', async (req, res) => {
  try {
    const categories = alltickApiService.getPricesByCategory()
    res.json({ 
      success: true, 
      categories,
      provider: 'alltick'
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/history - Get historical OHLC candles
// NOTE: This must be defined BEFORE /:symbol route to avoid matching 'history' as a symbol
// GET /api/prices/history - Get historical OHLC candles
// NOTE: This must be defined BEFORE /:symbol route to avoid matching 'history' as a symbol
router.get('/history', async (req, res) => {
  const { symbol, resolution, from, to, limit, preferLive } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ success: false, message: 'symbol is required' });
  }

  //Sanket v2.0 - Added 120/2h mapping for 2-hour timeframe support
  const resolutionMap = {
    '1': '1m', '1m': '1m', '5': '5m', '5m': '5m', '15': '15m', '15m': '15m',
    '30': '30m', '30m': '30m', '60': '1h', '1h': '1h', '120': '2h', '2h': '2h', '240': '4h', '4h': '4h',
    'D': '1d', '1D': '1d', 'W': '1w', '1W': '1w', 'M': '1M', '1M': '1M'
  };
  
  //Sanket v2.0 - Removed duplicate '1m' key that was at the end
  const resolutionToMinutes = {
    '1': 1, '1m': 1, '5': 5, '5m': 5, '15': 15, '15m': 15,
    '30': 30, '30m': 30, '60': 60, '1h': 60, '120': 120, '2h': 120, '240': 240, '4h': 240,
    'D': 1440, '1D': 1440, '1d': 1440, 
    'W': 10080, '1W': 10080, '1w': 10080, 
    'M': 43200, '1M': 43200
  };

  //Sanket v2.0 - Strip .i suffix and uppercase for consistent symbol lookup
  const cleanSymbol = String(symbol).toUpperCase().replace(/\.I$/i, '');
  const timeframe = resolutionMap[resolution] || '1m';
  const targetMinutes = resolutionToMinutes[resolution] || parseInt(resolution) || 1;
  const isPreferLive = preferLive === '1' || preferLive === 'true';
  const requestLimit = limit ? Math.min(parseInt(limit), 2000) : 1000;

  const normalizeToBucketSeries = (candles, intervalMinutes) => {
    if (!Array.isArray(candles) || candles.length === 0) return []
    const intervalMs = intervalMinutes * 60 * 1000
    const sorted = [...candles].sort((a, b) => Number(a.time) - Number(b.time))
    const byBucket = new Map()

    sorted.forEach((raw) => {
      const rawTime = Number(raw.time)
      if (!Number.isFinite(rawTime) || rawTime <= 0) return

      const tMs = rawTime < 10000000000 ? rawTime * 1000 : rawTime
      const bucket = Math.floor(tMs / intervalMs) * intervalMs

      const open = Number(raw.open)
      const high = Number(raw.high)
      const low = Number(raw.low)
      const close = Number(raw.close)
      const volume = Number.isFinite(Number(raw.volume)) ? Number(raw.volume) : 0

      if (![open, high, low, close].every(Number.isFinite)) return

      const existing = byBucket.get(bucket)
      if (!existing) {
        byBucket.set(bucket, {
          time: bucket,
          open,
          high,
          low,
          close,
          volume
        })
        return
      }

      existing.high = Math.max(existing.high, high)
      existing.low = Math.min(existing.low, low)
      existing.close = close
      existing.volume = (existing.volume || 0) + volume
    })

    return [...byBucket.values()].sort((a, b) => a.time - b.time)
  }

  const buildStorageFallbackCandles = async () => {
    const fallbackCandles = []

    try {
      const rolling = await storageService.getCandlesFromRedis(cleanSymbol, timeframe, startTime, endTime, requestLimit)
      if (Array.isArray(rolling)) {
        rolling.forEach((bar) => {
          const time = bar?.time instanceof Date ? bar.time.getTime() : toEpochMs(bar?.time)
          const open = Number(bar?.open)
          const high = Number(bar?.high)
          const low = Number(bar?.low)
          const close = Number(bar?.close)
          const volume = Number.isFinite(Number(bar?.volume)) ? Number(bar.volume) : 0
          if (![time, open, high, low, close].every(Number.isFinite) || time <= 0) return
          fallbackCandles.push({ time, open, high, low, close, volume })
        })
      }
    } catch {}

    const liveBar = storageService.liveBars.get(`${cleanSymbol}|${timeframe}`)
    if (liveBar && Number.isFinite(liveBar.timeMs) && Number(liveBar.close) > 0) {
      fallbackCandles.push({
        time: Number(liveBar.timeMs),
        open: Number(liveBar.open),
        high: Number(liveBar.high),
        low: Number(liveBar.low),
        close: Number(liveBar.close),
        volume: Number(liveBar.volume) || 0
      })
    }

    if (fallbackCandles.length === 0) {
      try {
        const latestStored = await storageService.getLatestCloseQuote(cleanSymbol, timeframe)
        if (latestStored && Number(latestStored.close) > 0) {
          const time = toEpochMs(latestStored.time)
          if (time > 0) {
            const close = Number(latestStored.close)
            fallbackCandles.push({
              time,
              open: close,
              high: close,
              low: close,
              close,
              volume: 0
            })
          }
        }
      } catch {}
    }

    return fallbackCandles
  }

  const getHistoryJumpThresholdPct = (sym = '') => {
    const upper = String(sym).toUpperCase()
    if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('BNB') || upper.includes('SOL') || upper.includes('XRP') || upper.includes('ADA') || upper.includes('DOGE') || upper.includes('LTC')) {
      return 25
    }
    if (upper.includes('XAU') || upper.includes('XAG') || upper.includes('OIL') || upper.includes('NGAS') || upper.includes('COPPER') || upper.includes('US30') || upper.includes('US100') || upper.includes('US500') || upper.includes('UK100') || upper.includes('ES35')) {
      return 8
    }
    return 3
  }

  const sanitizeHistoricalSeries = (candles, intervalMinutes, sym) => {
    if (!Array.isArray(candles) || candles.length === 0) return []
    const intervalMs = intervalMinutes * 60 * 1000
    const maxJumpPct = getHistoryJumpThresholdPct(sym)
    const sanitized = []

    for (const raw of candles) {
      const time = Number(raw?.time)
      const open = Number(raw?.open)
      const high = Number(raw?.high)
      const low = Number(raw?.low)
      const close = Number(raw?.close)
      const volume = Number.isFinite(Number(raw?.volume)) ? Number(raw.volume) : 0

      if (![time, open, high, low, close].every(Number.isFinite) || time <= 0) continue

      const fixedHigh = Math.max(high, open, close, low)
      const fixedLow = Math.min(low, open, close, high)
      const normalized = { time, open, high: fixedHigh, low: fixedLow, close, volume }

      const prev = sanitized[sanitized.length - 1]
      if (!prev || !Number.isFinite(prev.close) || prev.close <= 0) {
        sanitized.push(normalized)
        continue
      }

      const elapsedMs = Math.max(0, time - prev.time)
      const jumpPct = Math.abs((normalized.close - prev.close) / prev.close) * 100
      const isLongGap = elapsedMs > Math.max(intervalMs * 6, 45 * 60 * 1000)

      if (!isLongGap && jumpPct > maxJumpPct) {
        sanitized.push({
          time,
          open: prev.close,
          high: prev.close,
          low: prev.close,
          close: prev.close,
          volume: 0,
          isSanitized: true
        })
        continue
      }

      sanitized.push(normalized)
    }

    return sanitized
  }
  
  // 🛡️ ELITE: Always use Server Time Authority for "current" requests
  const serverNow = Math.floor(Date.now() / 1000);
  const startTime = from ? parseInt(from) : undefined;
  const endTime = to ? parseInt(to) : (isPreferLive ? serverNow : undefined);
  const liveFallbackWindowSec = Math.max(targetMinutes * 60 * 3, 15 * 60);
  const canUseLiveFallback = isPreferLive || !Number.isFinite(endTime) || (serverNow - endTime) <= liveFallbackWindowSec;

  console.log(`[History] Elite Request: ${cleanSymbol} (${resolution} → ${timeframe}) from=${from} to=${endTime} limit=${requestLimit}`);

  if (!alltickApiService.isSymbolSupported(cleanSymbol)) {
    return res.status(404).json({ success: false, message: `Symbol ${cleanSymbol} is not supported` });
  }

  // 🛡️ ELITE: Caching Key optimized for timeframe and range
  // Always use 'latest' for the end if not specified, to match live tier-sync
  const cacheSuffix = isPreferLive ? 'live' : 'std';
  const effectiveEnd = (isPreferLive && !to) ? 'latest' : (endTime || 'latest');
  const cacheKey = `hist:${cleanSymbol}:${timeframe}:end:${effectiveEnd}:${requestLimit}:${cacheSuffix}:v3`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const cachedPayload = normalizeHistoryCachePayload(JSON.parse(cached), symbol, timeframe);
      const candles = Array.isArray(cachedPayload.candles) ? cachedPayload.candles : [];
      const candleCount = candles.length;
      console.log(`[History] cache hit ${cleanSymbol} ${timeframe}: ${candleCount} candles`);
      console.log(`[History] ⚡ Served ${candles.length} candles from Redis Cache`);
      return res.json({
        ...cachedPayload,
        count: candleCount,
        cachedResponse: true,
        feedState: getFeedStateFromFreshness({
          isConnected: alltickApiService.isConnected,
          freshness: cachedPayload.freshness,
          degraded: cachedPayload.degraded
        })
      });
    }
  } catch (e) {}

  try {
    // 🚀 STEP 1: Direct Native Fetch (Fast & Accurate)
    // We fetch the requested resolution directly from AllTick instead of aggregating 1m candles manually.
    const historyResult = await storageService.getCandlesWithMetadata(
      cleanSymbol,
      timeframe,
      startTime,
      endTime,
      requestLimit,
      { refreshOnSparse: true, preferLive: isPreferLive }
    );
    const latestQuote = await alltickApiService.getPrice(cleanSymbol);
    const quoteAgeMs = getQuoteAgeMs(latestQuote);
    
    if ((!historyResult.candles || historyResult.candles.length === 0) && canUseLiveFallback) {
      const storageFallback = await buildStorageFallbackCandles()
      if (storageFallback.length > 0) {
        historyResult.candles = storageFallback
        historyResult.source = historyResult.source ? `${historyResult.source}_storage_fallback` : 'storage_fallback'
        historyResult.freshness = storageService.estimateSeriesFreshness(storageFallback, timeframe).freshness
        historyResult.degraded = historyResult.degraded === true
        historyResult.lastCandleTimeMs = toEpochMs(storageFallback[storageFallback.length - 1]?.time)
        console.log(`[History] ✅ Bootstrapped ${storageFallback.length} candles for ${cleanSymbol} ${timeframe} from storage fallback`)
      } else {
        console.warn(`[History] ⚠️ No native data found for ${symbol} @ ${timeframe}. Faking empty response.`);
        return res.json({
          success: true,
          symbol,
          timeframe,
          candles: [],
          count: 0,
          provider: historyResult.refreshedFromProvider ? 'alltick' : 'storage',
          source: historyResult.source,
          freshness: historyResult.freshness || 'degraded',
          degraded: true,
          lastCandleTimeMs: historyResult.lastCandleTimeMs || null,
          ageMs: historyResult.ageMs ?? null,
          refreshedFromProvider: historyResult.refreshedFromProvider === true,
          quoteAgeMs,
          feedState: getFeedStateFromFreshness({
            isConnected: alltickApiService.isConnected,
            freshness: historyResult.freshness,
            degraded: true,
            quoteAgeMs
          })
        });
      }
    }

    if (!historyResult.candles || historyResult.candles.length === 0) {
      return res.json({
        success: true,
        symbol,
        timeframe,
        candles: [],
        count: 0,
        provider: historyResult.refreshedFromProvider ? 'alltick' : 'storage',
        source: historyResult.source,
        freshness: historyResult.freshness || 'degraded',
        degraded: true,
        lastCandleTimeMs: historyResult.lastCandleTimeMs || null,
        ageMs: historyResult.ageMs ?? null,
        refreshedFromProvider: historyResult.refreshedFromProvider === true,
        quoteAgeMs,
        feedState: getFeedStateFromFreshness({
          isConnected: alltickApiService.isConnected,
          freshness: historyResult.freshness,
          degraded: true,
          quoteAgeMs
        })
      });
    }

    let finalCandles = normalizeToBucketSeries(historyResult.candles, targetMinutes);
    finalCandles = sanitizeHistoricalSeries(finalCandles, targetMinutes, cleanSymbol);
    finalCandles = filterCandlesToRequestedWindow(finalCandles, startTime, endTime)
    if (targetMinutes <= 1440) {
      finalCandles = finalCandles.filter((candle) => isTradableBucket(cleanSymbol, Number(candle.time)))
    }

    // 🚀 ELITE PIPELINE: Clean -> Fill -> Validate
    
    // 1. Sort (Clean)
    finalCandles.sort((a, b) => a.time - b.time);

    if (finalCandles.length > 0 && targetMinutes <= 1440) {
       const prevCount = finalCandles.length;
       finalCandles = fillGapsSessionAware(finalCandles, targetMinutes, endTime, cleanSymbol);
       if (finalCandles.length > prevCount) {
         console.log(`[History] 🔗 Continuity Fix: Filled ${finalCandles.length - prevCount} gaps in ${timeframe} data (until=${endTime})`);
       }
    }

    // 3. Validate Continuity
    validateContinuity(finalCandles, targetMinutes);

    // 4. Density Check
    if (finalCandles.length < 200) {
      console.warn(`[History] ⚠️ Low density data for ${symbol} @ ${timeframe}: only ${finalCandles.length} candles`);
    }

    // 🏆 STEP 3: Return & Cache
    // We cache for 5 minutes (standard for historical requests)
    const responsePayload = {
        success: true,
        symbol,
        timeframe,
        candles: finalCandles,
        count: finalCandles.length,
        provider: historyResult.refreshedFromProvider ? 'alltick' : 'storage',
        source: historyResult.source,
        freshness: historyResult.freshness || storageService.estimateSeriesFreshness(finalCandles, timeframe).freshness,
        degraded: historyResult.degraded || finalCandles.length === 0,
        lastCandleTimeMs: historyResult.lastCandleTimeMs || (finalCandles.length > 0 ? toEpochMs(finalCandles[finalCandles.length - 1].time) : null),
        ageMs: historyResult.ageMs ?? null,
        refreshedFromProvider: historyResult.refreshedFromProvider === true,
        quoteAgeMs,
        feedState: getFeedStateFromFreshness({
          isConnected: alltickApiService.isConnected,
          freshness: historyResult.freshness,
          degraded: historyResult.degraded || finalCandles.length === 0,
          quoteAgeMs
        })
      };
    if (finalCandles.length > 0) {
      const cacheTtlSeconds = responsePayload.freshness === 'live' ? 60 : 300;
      await redisClient.set(cacheKey, JSON.stringify(responsePayload), 'EX', cacheTtlSeconds);
    }

    res.json(responsePayload);

  } catch (error) {
    console.error(`[PricesAPI] Error in history route:`, error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prices/:symbol - Get single symbol price
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params
    
    // Check if symbol is supported
    if (!alltickApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ 
        success: false, 
        message: `Symbol ${symbol} is not supported` 
      })
    }
    
    // Get price from AllTick api service
    const price = await alltickApiService.getPrice(symbol)
    const symbolInfo = alltickApiService.getSymbolInfo(symbol)
    
    if (price && price.bid) {
      res.json({ 
        success: true, 
        price: {
          bid: price.bid,
          ask: price.ask,
          spread: price.spread,
          time: price.time,
          ...symbolInfo
        },
        provider: 'alltick'
      })
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Price not available yet. Market data is streaming.' 
      })
    }
  } catch (error) {
    console.error('Error fetching price:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/batch - Get multiple symbol prices
router.post('/batch', async (req, res) => {
  try {
    const { symbols } = req.body
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ success: false, message: 'symbols array required' })
    }
    
    const toEpochMs = (raw) => {
      if (!raw) return 0
      if (typeof raw === 'number') return raw > 100000000000 ? raw : raw * 1000
      const parsed = Date.parse(raw)
      return Number.isFinite(parsed) ? parsed : 0
    }

    const getQuoteFreshness = (timeMs) => {
      const ageMs = Date.now() - timeMs
      if (!Number.isFinite(ageMs) || ageMs < 0) return 'UNKNOWN'
      if (ageMs <= 30_000) return 'LIVE'
      if (ageMs <= 6 * 60 * 60 * 1000) return 'STALE'
      return 'OLD'
    }

    const getFallbackFromCachedHistory = async (symbol) => {
      const clean = String(symbol || '').toUpperCase().replace(/\.I$/i, '')

      try {
        const rolling = await storageService.getCandlesFromRedis(clean, '1m', null, null, 2)
        const lastRolling = Array.isArray(rolling) && rolling.length > 0 ? rolling[rolling.length - 1] : null
        if (lastRolling && Number(lastRolling.close) > 0) {
          const close = Number(lastRolling.close)
          const timeMs = toEpochMs(lastRolling.time)
          return {
            bid: close,
            ask: close,
            spread: 0,
            time: timeMs ? new Date(timeMs).toISOString() : new Date().toISOString(),
            marketState: 'CLOSED',
            quoteFreshness: 'STALE',
            source: 'redis_rolling_1m_close'
          }
        }
      } catch {}

      const histKeys = [
        `hist:${clean}:1m:end:latest:1000:live`,
        `hist:${clean}:1m:end:latest:1000:std`
      ]

      for (const key of histKeys) {
        try {
          const payload = await redisClient.get(key)
          if (!payload) continue
          const candles = JSON.parse(payload)
          const last = Array.isArray(candles) && candles.length > 0 ? candles[candles.length - 1] : null
          if (!last || Number(last.close) <= 0) continue
          const close = Number(last.close)
          const timeMs = toEpochMs(last.time)
          return {
            bid: close,
            ask: close,
            spread: 0,
            time: timeMs ? new Date(timeMs).toISOString() : new Date().toISOString(),
            marketState: 'CLOSED',
            quoteFreshness: 'STALE',
            source: `redis_history:${key}`
          }
        } catch {}
      }

      try {
        const latestStored = await storageService.getLatestCloseQuote(clean, '1m')
        if (latestStored && Number(latestStored.close) > 0) {
          const close = Number(latestStored.close)
          const timeMs = toEpochMs(latestStored.time)
          return {
            bid: close,
            ask: close,
            spread: 0,
            time: timeMs ? new Date(timeMs).toISOString() : new Date().toISOString(),
            marketState: 'CLOSED',
            quoteFreshness: 'STALE',
            source: latestStored.source || 'storage_latest_close'
          }
        }
      } catch {}

      return null
    }

    const prices = {}
    
    // Return every requested symbol with either live or fallback quote.
    await Promise.all(symbols.map(async (symbol) => {
      const symbolInfo = alltickApiService.getSymbolInfo(symbol)

      if (!alltickApiService.isSymbolSupported(symbol)) {
        prices[symbol] = {
          bid: 0,
          ask: 0,
          spread: 0,
          time: null,
          marketState: 'CLOSED',
          quoteFreshness: 'EMPTY',
          source: 'unsupported',
          ...symbolInfo
        }
        return
      }

      const live = await alltickApiService.getPrice(symbol)
      const liveBid = Number(live?.bid)
      const liveAsk = Number(live?.ask)

      if (Number.isFinite(liveBid) && liveBid > 0 && Number.isFinite(liveAsk) && liveAsk > 0) {
        const timeMs = toEpochMs(live?.receivedAt || live?.time)
        prices[symbol] = {
          bid: liveBid,
          ask: liveAsk,
          spread: Number(live?.spread) || Math.abs(liveAsk - liveBid),
          time: live?.time || (timeMs ? new Date(timeMs).toISOString() : new Date().toISOString()),
          marketState: 'OPEN',
          quoteFreshness: getQuoteFreshness(timeMs || Date.now()),
          source: 'live',
          ...symbolInfo
        }
        return
      }

      const fallback = await getFallbackFromCachedHistory(symbol)
      if (fallback) {
        prices[symbol] = {
          ...fallback,
          ...symbolInfo
        }
        return
      }

      prices[symbol] = {
        bid: 0,
        ask: 0,
        spread: 0,
        time: null,
        marketState: 'CLOSED',
        quoteFreshness: 'EMPTY',
        source: 'no_quote',
        ...symbolInfo
      }
    }))
    
    res.json({ 
      success: true, 
      prices,
      provider: 'metaapi',
      count: Object.keys(prices).length
    })
  } catch (error) {
    console.error('Error fetching batch prices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/all - Get all current prices
router.get('/', async (req, res) => {
  try {
    const [prices, categories] = await Promise.all([
      alltickApiService.getAllPrices(),
      alltickApiService.getPricesByCategory()
    ]);
    res.json({ 
      success: true, 
      prices,
      categories,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Error fetching all prices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router

