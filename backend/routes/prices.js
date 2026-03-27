import express from 'express'
import alltickApiService from '../services/alltickApiService.js'
import storageService from '../services/storageService.js'
import { requireOpsAuth } from '../middleware/opsAuth.js'
import { opsRateLimit, getOpsRateLimitStats } from '../middleware/opsRateLimit.js'
import OpsActionLog from '../models/OpsActionLog.js'
import redisClient from '../services/redisClient.js'
import { aggregateToTimeframe, fillGaps, validateContinuity } from '../utils/candleAggregator.js'

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

// GET /api/prices/status - Get market data service status
router.get('/status', async (req, res) => {
  try {
    const status = { connected: alltickApiService.isConnected, provider: 'alltick' }
    const livePersistence = storageService.getLivePersistenceStats()
    const syncStats = storageService.getSyncStats()
    const lockStatus = await storageService.getLockStatus()
    const opsRateLimit = getOpsRateLimitStats()
    res.json({ success: true, status, livePersistence, syncStats, lockStatus, opsRateLimit })
  } catch (error) {
    console.error('Error fetching status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/time - Get authoritative server time for candle countdown
router.get('/time', (req, res) => {
  res.json({ success: true, time: Math.floor(Date.now() / 1000) });
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

  // 🎯 Map resolution to AllTick native timeframes
  const resolutionMap = {
    '1': '1m', '1m': '1m', '5': '5m', '5m': '5m', '15': '15m', '15m': '15m',
    '30': '30m', '30m': '30m', '60': '1h', '1h': '1h', '240': '4h', '4h': '4h',
    'D': '1d', '1D': '1d', 'W': '1w', '1W': '1w', 'M': '1M', '1M': '1M'
  };
  
  const resolutionToMinutes = {
    '1': 1, '1m': 1, '5': 5, '5m': 5, '15': 15, '15m': 15,
    '30': 30, '30m': 30, '60': 60, '1h': 60, '120': 120, '240': 240, '4h': 240,
    'D': 1440, '1D': 1440, '1d': 1440, 
    'W': 10080, '1W': 10080, '1w': 10080, 
    'M': 43200, '1M': 43200, '1m': 1
  };

  // 🛡️ ELITE: Always normalize symbol to UPPERCASE for internal consistency
  const cleanSymbol = String(symbol).toUpperCase();
  const timeframe = resolutionMap[resolution] || '1m';
  const targetMinutes = resolutionToMinutes[resolution] || parseInt(resolution) || 1;
  const isPreferLive = preferLive === '1' || preferLive === 'true';
  const requestLimit = limit ? Math.min(parseInt(limit), 2000) : 1000;
  
  // 🛡️ ELITE: Always use Server Time Authority for "current" requests
  const serverNow = Math.floor(Date.now() / 1000);
  const startTime = from ? parseInt(from) : undefined;
  const endTime = to ? parseInt(to) : (isPreferLive ? serverNow : undefined);

  console.log(`[History] Elite Request: ${cleanSymbol} (${resolution} → ${timeframe}) from=${from} to=${endTime} limit=${requestLimit}`);

  if (!alltickApiService.isSymbolSupported(cleanSymbol)) {
    return res.status(404).json({ success: false, message: `Symbol ${cleanSymbol} is not supported` });
  }

  // 🛡️ ELITE: Caching Key optimized for timeframe and range
  // Always use 'latest' for the end if not specified, to match live tier-sync
  const cacheSuffix = isPreferLive ? 'live' : 'std';
  const effectiveEnd = (isPreferLive && !to) ? 'latest' : (endTime || 'latest');
  const cacheKey = `hist:${cleanSymbol}:${timeframe}:start:${effectiveEnd}:1000:${cacheSuffix}`;
  
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const candles = JSON.parse(cached);
      console.log(`[History] ⚡ Served ${candles.length} candles from Redis Cache`);
      return res.json({ success: true, symbol, timeframe, candles, count: candles.length, provider: 'alltick (cached)' });
    }
  } catch (e) {}

  try {
    // 🚀 STEP 1: Direct Native Fetch (Fast & Accurate)
    // We fetch the requested resolution directly from AllTick instead of aggregating 1m candles manually.
    const result = await alltickApiService.getHistoricalCandles(symbol, timeframe, startTime, endTime, requestLimit, isPreferLive);
    
    if (!result.success || !result.candles || result.candles.length === 0) {
      console.warn(`[History] ⚠️ No native data found for ${symbol} @ ${timeframe}. Faking empty response.`);
      return res.json({ success: true, symbol, timeframe, candles: [], count: 0, provider: 'alltick' });
    }

    let finalCandles = result.candles;

    // 🚀 ELITE PIPELINE: Clean -> Fill -> Validate
    
    // 1. Sort (Clean)
    finalCandles.sort((a, b) => a.time - b.time);

    // 2. Fill Gaps (PRO Tier Continuity)
    if (finalCandles.length > 5 && targetMinutes <= 1440) {
       const prevCount = finalCandles.length;
       finalCandles = fillGaps(finalCandles, targetMinutes);
       if (finalCandles.length > prevCount) {
         console.log(`[History] 🔗 Continuity Fix: Filled ${finalCandles.length - prevCount} gaps in ${timeframe} data`);
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
    if (finalCandles.length > 0) {
      await redisClient.set(cacheKey, JSON.stringify(finalCandles), 'EX', 300);
    }

    res.json({
      success: true,
      symbol,
      timeframe,
      candles: finalCandles,
      count: finalCandles.length,
      provider: 'alltick (production+)'
    });

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
    const price = alltickApiService.getPrice(symbol)
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
    
    const prices = {}
    
    // Get all prices from AllTick api service
    for (const symbol of symbols) {
      if (alltickApiService.isSymbolSupported(symbol)) {
        const price = alltickApiService.getPrice(symbol)
        const symbolInfo = alltickApiService.getSymbolInfo(symbol)
        if (price && price.bid) {
          prices[symbol] = {
            bid: price.bid,
            ask: price.ask,
            spread: price.spread,
            time: price.time,
            ...symbolInfo
          }
        }
      }
    }
    
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

