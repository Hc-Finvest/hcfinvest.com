/**
 * //sanket - Storage Service for caching market data
 * This service periodically fetches historical candles from MetaAPI
 * and stores them in MongoDB for fast retrieval and to prevent API rate limits.
 */

import { EventEmitter } from 'events';
import alltickApiService from './alltickApiService.js';
import Candle from '../models/Candle.js'; // //sanket - Generic model handles all symbols
import leaderLock from './leaderLock.js'; // Distributed leader lock for multi-instance safety
import redisClient from './redisClient.js';

// //sanket - All symbols use the generic Candle model for simplicity and consistency
// The Candle model has proper indexes for fast queries across all symbols
const getModelForSymbol = (symbol) => {
  return Candle;
};

class StorageService extends EventEmitter {
  constructor() {
    super();
    this.syncInterval = null;
    this.isSyncing = false;
    this.inflightSyncTasks = new Map();
    this.inflightBackfillTasks = new Map();
    this.inflightHistoryRequests = new Map();
    this.liveBars = new Map();
    //Sanket v2.0 - Added '2h' and '1M' so candleUpdate events fire for all supported timeframes
    this.realtimeTimeframes = ['1m', '5m', '15m', '30m', '1h', '2h', '4h', '1d', '1w', '1M'];
    this.livePersistedTicks = 0;
    this.livePersistedWrites = 0;
    this.livePersistErrors = 0;
    this.lastLivePersistAt = null;
    this.lastLivePersistError = null;
    this.lastLiveFlushAt = null;
    this.liveFlushCount = 0;
    this.liveFlushSkipped = 0;
    this.isFlushingLiveBars = false;
    this.pendingLiveBarOps = new Map();
    this.flushIntervalMs = parseInt(process.env.LIVE_PERSIST_FLUSH_MS || '1000', 10);
    this.maxFlushOps = parseInt(process.env.LIVE_PERSIST_MAX_OPS || '1000', 10);
    this.maxBatchesPerFlush = parseInt(process.env.LIVE_PERSIST_MAX_BATCHES_PER_FLUSH || '3', 10);
    this.maxPendingLiveBarOps = parseInt(process.env.LIVE_PERSIST_MAX_PENDING_OPS || '20000', 10);
    this.liveFlushTimer = null;
    this.livePersistDroppedOps = 0;
    
    // Production Backfill Queue
    this.backfillQueue = [];
    this.isProcessingBackfill = false;

    this.startLiveFlushWorker();
  }

  /**
   * ✅ Elite Performance: Push a candle to the Redis rolling buffer (ZSET)
   */
  async pushToRedisRolling(symbol, timeframe, candle) {
    const key = `candles:${symbol}:${timeframe}`;
    const score = Math.floor(candle.timeMs / 1000); // Unix timestamp in seconds
    const value = JSON.stringify({
      t: candle.timeMs,
      o: candle.open,
      h: candle.high,
      l: candle.low,
      c: candle.close,
      v: candle.volume
    });

    try {
      // Add to sorted set with timestamp as score (ZADD replaces if score/member matches)
      // Since we stringify with exact data, we first REMOVE any existing bar at this EXACT score 
      // to handle candle UPDATES (not just increments)
      const multi = redisClient.multi();
      multi.zremrangebyscore(key, score, score);
      multi.zadd(key, score, value);
      multi.zremrangebyrank(key, 0, -2001); // Capacity limit: 2000 bars
      await multi.exec();
    } catch (err) {
      // log suppressed to avoid flooding
    }
  }

  /**
   * ✅ Elite Performance: Get fast candles from Redis
   */
  async getCandlesFromRedis(symbol, timeframe, from, to, limit) {
    const key = `candles:${symbol}:${timeframe}`;
    const min = from ? parseInt(from) : '-inf';
    const max = to ? parseInt(to) : '+inf';

    try {
      const rawBars = await redisClient.zrangebyscore(key, min, max, 'LIMIT', 0, limit || 2000);
      return rawBars.map(b => {
        const p = JSON.parse(b);
        return {
          time: new Date(p.t),
          open: p.o,
          high: p.h,
          low: p.l,
          close: p.c,
          volume: p.v
        };
      });
    } catch (err) {
      return [];
    }
  }

  startLiveFlushWorker() {
    if (this.liveFlushTimer) return;

    this.liveFlushTimer = setInterval(() => {
      this.flushLiveBarUpdates().catch(err => {
        this.livePersistErrors += 1;
        this.lastLivePersistError = err.message;
      });
    }, this.flushIntervalMs);

    // Do not keep the process alive just for this timer.
    if (typeof this.liveFlushTimer.unref === 'function') {
      this.liveFlushTimer.unref();
    }
  }

  stopLiveFlushWorker() {
    if (!this.liveFlushTimer) return;
    clearInterval(this.liveFlushTimer);
    this.liveFlushTimer = null;
  }

  async flushLiveBarUpdates() {
    if (this.isFlushingLiveBars) {
      this.liveFlushSkipped += 1;
      return;
    }

    if (this.pendingLiveBarOps.size === 0) return;

    this.isFlushingLiveBars = true;

    try {
      for (let batchIndex = 0; batchIndex < this.maxBatchesPerFlush; batchIndex += 1) {
        if (this.pendingLiveBarOps.size === 0) break;

        const opEntries = [...this.pendingLiveBarOps.entries()].slice(0, this.maxFlushOps);
        const operations = opEntries.map(([, payload]) => ({
          updateOne: {
            filter: {
              symbol: payload.symbol,
              timeframe: payload.timeframe,
              time: new Date(payload.timeMs)
            },
            update: {
              $set: {
                open: payload.open,
                high: payload.high,
                low: payload.low,
                close: payload.close,
                volume: payload.volume,
                tickVolume: payload.volume
              }
            },
            upsert: true
          }
        }));

        if (operations.length === 0) break;

        await Candle.bulkWrite(operations, { ordered: false });
        this.livePersistedWrites += operations.length;
        this.liveFlushCount += 1;
        this.lastLivePersistAt = Date.now();
        this.lastLiveFlushAt = this.lastLivePersistAt;
        this.lastLivePersistError = null;

        opEntries.forEach(([opKey]) => this.pendingLiveBarOps.delete(opKey));
      }
    } catch (error) {
      this.livePersistErrors += 1;
      this.lastLivePersistError = error.message;
      throw error;
    } finally {
      this.isFlushingLiveBars = false;
    }
  }

  getTaskKey(symbol, timeframe, from = null, to = null, limit = null) {
    return `${symbol}|${timeframe}|${from ?? 'na'}|${to ?? 'na'}|${limit ?? 'na'}`;
  }

  getSyncStats() {
    return {
      isSyncing: this.isSyncing,
      inflightSyncTasks: this.inflightSyncTasks.size,
      inflightBackfillTasks: this.inflightBackfillTasks.size,
      inflightHistoryRequests: this.inflightHistoryRequests.size
    };
  }

  /** Return the distributed lock status for the history-sync lock. */
  async getLockStatus() {
    try {
      return await leaderLock.inspect(StorageService.SYNC_LOCK_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Detect gaps in candle data for a symbol/timeframe over the last `fromHours` hours.
   * A gap is any interval between consecutive candles that exceeds 1.5× the timeframe duration.
   * Returns: Array of { gapStart, gapEnd, missingCandles }
   */
  async getGaps(symbol, timeframe, fromHours = 24) {
    const resolvedSymbol = this.resolveStorageSymbol(symbol);
    const tfSecs = this.timeframeToSeconds(timeframe);
    const maxGapMs = tfSecs * 1000 * 1.5;
    const fromDate = new Date(Date.now() - fromHours * 3600 * 1000);
    const toDate = new Date();

    const candles = await Candle.find({
      symbol: resolvedSymbol,
      timeframe,
      time: { $gte: fromDate, $lte: toDate }
    }).sort({ time: 1 }).lean();

    const gaps = [];

    if (candles.length === 0) {
      gaps.push({
        gapStart: fromDate,
        gapEnd: toDate,
        missingCandles: Math.floor((toDate - fromDate) / (tfSecs * 1000))
      });
      return gaps;
    }

    // Gap before first candle
    if (candles[0].time - fromDate > maxGapMs) {
      gaps.push({
        gapStart: fromDate,
        gapEnd: candles[0].time,
        missingCandles: Math.floor((candles[0].time - fromDate) / (tfSecs * 1000))
      });
    }

    // Gaps between consecutive candles
    for (let i = 1; i < candles.length; i++) {
      const diff = candles[i].time - candles[i - 1].time;
      if (diff > maxGapMs) {
        gaps.push({
          gapStart: candles[i - 1].time,
          gapEnd: candles[i].time,
          missingCandles: Math.floor(diff / (tfSecs * 1000)) - 1
        });
      }
    }

    return gaps;
  }

  /**
   * Fetch and cache candles to fill a detected gap.
   * @param {string} symbol
   * @param {string} timeframe
   * @param {Date|string} gapStart
   * @param {Date|string} gapEnd
   */
  async repairGap(symbol, timeframe, gapStart, gapEnd) {
    const resolvedSymbol = this.resolveStorageSymbol(symbol);
    const from = Math.floor(new Date(gapStart).getTime() / 1000);
    const to = Math.floor(new Date(gapEnd).getTime() / 1000);
    return this.fetchAndCacheCandles(resolvedSymbol, timeframe, from, to, 1000);
  }

  /**
   * After a full sync cycle, scan the last 6h of data on key timeframes for gaps
   * and automatically repair them. Runs silently — errors are logged but not thrown.
   */
  async autoRepairGaps() {
    const symbols = alltickApiService.isConnected 
      ? alltickApiService.prioritySymbols.slice(0, 20)
      : []; 
    const timeframes = ['1m', '5m', '15m', '30m'];
    
    let totalGaps = 0;
    let repairedGaps = 0;

    for (const symbol of symbols) {
      for (const tf of timeframes) {
        try {
          const gaps = await this.getGaps(symbol, tf, 6);
          for (const gap of gaps) {
            if (gap.missingCandles < 1) continue;
            totalGaps++;
            try {
              await this.repairGap(symbol, tf, gap.gapStart, gap.gapEnd);
              repairedGaps++;
            } catch (repairErr) {
              console.warn(`[StorageService] Gap repair failed ${symbol} ${tf}:`, repairErr.message);
            }
          }
        } catch (err) {
          console.warn(`[StorageService] Gap detection failed ${symbol} ${tf}:`, err.message);
        }
      }
    }

    if (totalGaps > 0) {
      console.log(`[StorageService] Gap repair: found=${totalGaps} repaired=${repairedGaps}`);
    }
    return { totalGaps, repairedGaps };
  }

  resolveStorageSymbol(symbol) {
    if (!symbol) return symbol;
    
    // Use AllTick resolution
    if (typeof alltickApiService.resolveSymbolForAccount === 'function') {
      return alltickApiService.resolveSymbolForAccount(symbol) || symbol;
    }
    return symbol;
  }

  mapDbCandles(dbCandles) {
    return dbCandles.map(c => ({
      time: Math.floor(c.time.getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }));
  }

  async getLatestCloseQuote(symbol, timeframe = '1m') {
    try {
      const resolvedSymbol = this.resolveStorageSymbol(symbol);

      const redisBars = await this.getCandlesFromRedis(resolvedSymbol, timeframe, null, null, 1);
      const redisLast = Array.isArray(redisBars) && redisBars.length > 0 ? redisBars[redisBars.length - 1] : null;
      if (redisLast && Number(redisLast.close) > 0) {
        return {
          symbol: resolvedSymbol,
          close: Number(redisLast.close),
          time: redisLast.time,
          source: 'storage_redis_rolling'
        };
      }

      const Model = getModelForSymbol(resolvedSymbol);
      if (!Model) return null;

      const lastCandle = await Model.findOne({ symbol: resolvedSymbol, timeframe })
        .sort({ time: -1 })
        .lean();

      if (!lastCandle || Number(lastCandle.close) <= 0) return null;

      return {
        symbol: resolvedSymbol,
        close: Number(lastCandle.close),
        time: lastCandle.time,
        source: 'storage_mongo_latest'
      };
    } catch (error) {
      return null;
    }
  }

  async queryCandles(Model, symbol, timeframe, from, to, limit) {
    const query = { symbol, timeframe };
    let sortOrder = { time: 1 };

    if (from || to) {
      query.time = {};
      if (from) query.time.$gte = new Date(from * 1000);
      if (to) query.time.$lte = new Date(to * 1000);
    } else {
      sortOrder = { time: -1 };
    }

    const dbCandles = await Model.find(query)
      .sort(sortOrder)
      .limit(limit || 500)
      .lean();

    if (dbCandles.length > 0 && sortOrder.time === -1) {
      dbCandles.reverse();
    }

    return dbCandles;
  }

  async fetchAndCacheCandles(symbol, timeframe, from, to, limit) {
    if (Date.now() < alltickApiService.restCooldownUntil) {
       return [];
    }

    const taskKey = this.getTaskKey(symbol, timeframe, from, to, limit);
    if (this.inflightHistoryRequests.has(taskKey)) {
      return this.inflightHistoryRequests.get(taskKey);
    }

    const task = (async () => {
      return new Promise((resolve) => {
        this.backfillQueue.push({ symbol, timeframe, from, to, limit, resolve });
        this.processBackfillQueue();
      });
    })();

    this.inflightHistoryRequests.set(taskKey, task);
    try {
      return await task;
    } finally {
      this.inflightHistoryRequests.delete(taskKey);
    }
  }

  async processBackfillQueue() {
    if (this.isProcessingBackfill || this.backfillQueue.length === 0) return;
    this.isProcessingBackfill = true;

    try {
      while (this.backfillQueue.length > 0) {
        if (Date.now() < alltickApiService.restCooldownUntil) {
          const item = this.backfillQueue.shift();
          if (item) item.resolve([]);
          continue;
        }

        const item = this.backfillQueue.shift();
        if (!item) break;

        const { symbol, timeframe, from, to, limit, resolve } = item;
        try {
          const result = await alltickApiService.getHistoricalCandles(symbol, timeframe, from, to, limit);
          const candles = result.candles || [];
          if (candles.length > 0) {
            await this.storeCandles(symbol, timeframe, candles);
          }
          resolve(candles || []);
        } catch (err) {
          console.error(`[StorageService] Queue fetch failed for ${symbol}:`, err.message);
          resolve([]);
        }

        // Wait 600ms between any AllTick REST calls in production (safe balance)
        await new Promise(r => setTimeout(r, 600));
      }
    } finally {
      this.isProcessingBackfill = false;
    }
  }

  timeframeToSeconds(timeframe) {
    const map = {
      '1m':  60,
      '5m':  5  * 60,
      '15m': 15 * 60,
      '30m': 30 * 60,
      '1h':  60 * 60,
      '2h':  2  * 60 * 60,
      '4h':  4  * 60 * 60,
      '1d':  24 * 60 * 60,
      '1w':  7  * 24 * 60 * 60,
      '1M':  30 * 24 * 60 * 60
    };
    return map[timeframe] || 60;
  }

  getAggregationSourceTimeframe(timeframe) {
    //Sanket v2.0 - Added 2h->1h aggregation source
    const sourceMap = {
      '30m': '1m',
      '2h': '1h',
      '4h': '1h',
      '1w': '1d'
    };
    return sourceMap[timeframe] || null;
  }

  async aggregateCandlesFromSource(Model, symbol, targetTimeframe, from, to, limit = 500) {
    const sourceTimeframe = this.getAggregationSourceTimeframe(targetTimeframe);
    if (!sourceTimeframe) return [];

    const targetSec = this.timeframeToSeconds(targetTimeframe);
    const sourceSec = this.timeframeToSeconds(sourceTimeframe);
    const ratio = Math.max(1, Math.ceil(targetSec / sourceSec));
    const sourceLimit = Math.min(20000, Math.max((limit || 500) * ratio * 2, 1000));

    const sourceCandles = await this.queryCandles(Model, symbol, sourceTimeframe, from, to, sourceLimit);
    if (!sourceCandles || sourceCandles.length === 0) return [];

    const buckets = new Map();
    for (const c of sourceCandles) {
      const timeSec = Math.floor(new Date(c.time).getTime() / 1000);
      const bucketSec = Math.floor(timeSec / targetSec) * targetSec;
      const existing = buckets.get(bucketSec);

      if (!existing) {
        buckets.set(bucketSec, {
          time: bucketSec,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume || 0
        });
      } else {
        existing.high = Math.max(existing.high, c.high);
        existing.low = Math.min(existing.low, c.low);
        existing.close = c.close;
        existing.volume += c.volume || 0;
      }
    }

    let aggregated = Array.from(buckets.values()).sort((a, b) => a.time - b.time);
    if (!from && !to && limit && aggregated.length > limit) {
      aggregated = aggregated.slice(-limit);
    }

    return aggregated;
  }

  getBucketStartMs(timestampMs, timeframe) {
    const timeframeMs = this.timeframeToSeconds(timeframe) * 1000;
    return Math.floor(timestampMs / timeframeMs) * timeframeMs;
  }

  parseTickTimestamp(timeValue) {
    if (typeof timeValue === 'number') {
      return timeValue < 10000000000 ? timeValue * 1000 : timeValue;
    }
    if (typeof timeValue === 'string') {
      const parsed = new Date(timeValue).getTime();
      return Number.isNaN(parsed) ? Date.now() : parsed;
    }
    return Date.now();
  }

  async ingestTick(symbol, priceData) {
    if (!symbol || !priceData) return;

    const resolvedSymbol = this.resolveStorageSymbol(symbol);
    const bid = Number(priceData.bid);
    const ask = Number(priceData.ask);
    const close = Number.isFinite(bid) && Number.isFinite(ask)
      ? (bid + ask) / 2
      : Number.isFinite(bid)
        ? bid
        : Number.isFinite(ask)
          ? ask
          : null;

    if (!Number.isFinite(close) || close <= 0) return;

    // ✅ FIX: Use bid/ask range for HIGH/LOW (like TradingView frontend does)
    // This ensures backend-built candles match frontend real-time candles
    const tickHigh = Math.max(bid, ask);
    const tickLow = Math.min(bid, ask);

    const tickTimeMs = this.parseTickTimestamp(priceData.time);
    for (const timeframe of this.realtimeTimeframes) {
      const bucketStartMs = this.getBucketStartMs(tickTimeMs, timeframe);
      const barKey = `${resolvedSymbol}|${timeframe}`;
      const existing = this.liveBars.get(barKey);

      let bar;
      if (!existing || existing.timeMs !== bucketStartMs) {
        // ✅ ELITE: SNAP OPEN TO PREVIOUS CLOSE
        // This eliminates visual "gap-ups" between 1m candles by ensuring perfect continuity.
        const previousClose = (existing && existing.close > 0) ? existing.close : close;
        bar = {
          timeMs: bucketStartMs,
          open: previousClose,
          high: Math.max(previousClose, tickHigh),
          low: Math.min(previousClose, tickLow),
          close: close,
          volume: 1
        };
      } else {
        bar = {
          ...existing,
          high: Math.max(existing.high, tickHigh),    // ← Roll up using actual bid/ask range
          low: Math.min(existing.low, tickLow),       // ← Roll up using actual bid/ask range
          close: close,
          volume: (existing.volume || 0) + 1
        };
      }

      this.liveBars.set(barKey, bar);

      // ✅ Elite Performance: Push to Redis rolling buffer for pre-aggregation
      this.pushToRedisRolling(symbol, timeframe, bar);

      // ✅ Emit authoritative candle update for listeners (e.g., Socket.io bridge)
      this.emit('candleUpdate', {
        symbol: resolvedSymbol,
        originalSymbol: symbol,
        timeframe,
        candle: {
          time: bar.timeMs,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume
        }
      });

      const opKey = `${resolvedSymbol}|${timeframe}|${bar.timeMs}`;
      const hasExisting = this.pendingLiveBarOps.has(opKey);
      if (!hasExisting && this.pendingLiveBarOps.size >= this.maxPendingLiveBarOps) {
        this.livePersistDroppedOps += 1;
        continue;
      }

      this.pendingLiveBarOps.set(opKey, {
        symbol: resolvedSymbol,
        timeframe,
        timeMs: bar.timeMs,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume
      });
    }

    this.livePersistedTicks += 1;

    if (this.pendingLiveBarOps.size >= Math.floor(this.maxPendingLiveBarOps * 0.8)) {
      // Trigger an immediate async flush when queue pressure is high.
      this.flushLiveBarUpdates().catch(err => {
        this.livePersistErrors += 1;
        this.lastLivePersistError = err.message;
      });
    }
  }

  async shutdown() {
    this.stopLiveFlushWorker();

    // Drain pending operations in bounded rounds.
    for (let i = 0; i < 10; i += 1) {
      if (this.pendingLiveBarOps.size === 0) break;
      await this.flushLiveBarUpdates();
    }

    return this.getLivePersistenceStats();
  }

  async flushNow() {
    await this.flushLiveBarUpdates();
    return this.getLivePersistenceStats();
  }

  getLivePersistenceStats() {
    const activeSymbols = new Set();
    this.liveBars.forEach((_, key) => {
      const [symbol] = key.split('|');
      if (symbol) activeSymbols.add(symbol);
    });

    const pendingRatio = this.maxPendingLiveBarOps > 0
      ? this.pendingLiveBarOps.size / this.maxPendingLiveBarOps
      : 0;
    const health = this.livePersistErrors > 0
      ? (pendingRatio > 0.7 ? 'unhealthy' : 'degraded')
      : (pendingRatio > 0.7 ? 'degraded' : 'healthy');

    // ---- Alerting thresholds ----
    const alertMessages = [];
    const warnMessages = [];

    if (this.livePersistErrors > 0) {
      alertMessages.push(`${this.livePersistErrors} flush error(s) — last: ${this.lastLivePersistError || 'unknown'}`);
    }
    if (this.livePersistDroppedOps > 0) {
      warnMessages.push(`${this.livePersistDroppedOps} op(s) dropped due to full queue`);
    }
    if (pendingRatio > 0.5) {
      warnMessages.push(`Pending queue at ${Math.round(pendingRatio * 100)}% capacity`);
    }
    if (this.liveFlushSkipped > 100) {
      warnMessages.push(`Flush worker skipped ${this.liveFlushSkipped} times — flush may be slow`);
    }

    const alertState = {
      level: alertMessages.length > 0 ? 'alert' : (warnMessages.length > 0 ? 'warn' : 'ok'),
      alerts: alertMessages,
      warnings: warnMessages
    };

    return {
      health,
      alertState,
      realtimeTimeframes: this.realtimeTimeframes,
      activeBars: this.liveBars.size,
      activeSymbols: activeSymbols.size,
      inflightHistoryRequests: this.inflightHistoryRequests.size,
      inflightSyncTasks: this.inflightSyncTasks.size,
      livePersistedTicks: this.livePersistedTicks,
      livePersistedWrites: this.livePersistedWrites,
      livePersistErrors: this.livePersistErrors,
      lastLivePersistAt: this.lastLivePersistAt,
      lastLivePersistError: this.lastLivePersistError,
      pendingLiveBarOps: this.pendingLiveBarOps.size,
      isFlushingLiveBars: this.isFlushingLiveBars,
      flushIntervalMs: this.flushIntervalMs,
      maxFlushOps: this.maxFlushOps,
      maxBatchesPerFlush: this.maxBatchesPerFlush,
      maxPendingLiveBarOps: this.maxPendingLiveBarOps,
      liveFlushCount: this.liveFlushCount,
      liveFlushSkipped: this.liveFlushSkipped,
      lastLiveFlushAt: this.lastLiveFlushAt,
      livePersistDroppedOps: this.livePersistDroppedOps
    };
  }

  /**
   * //sanket - Start the background synchronization process
   */
  start() {
    console.log('[StorageService] Starting background sync...');
    
    // Initial sync
    this.syncAllSymbols();

    // Sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.syncAllSymbols();
    }, 5 * 60 * 1000);
  }

  /**
   * //sanket - Stop the background synchronization process
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    console.log('[StorageService] Stopped background sync.');
  }

  // TTL for the history-sync distributed lock: 45 min (generous for large symbol sets).
  static SYNC_LOCK_KEY = 'lock:history-sync';
  static SYNC_LOCK_TTL_MS = 45 * 60 * 1000;
  // Renew the sync lock every 10 min so long syncs don't auto-expire.
  static SYNC_LOCK_RENEW_MS = 10 * 60 * 1000;

  /**
   * //sanket - Sync all supported symbols for multiple timeframes
   * Uses a distributed leader lock so only one instance runs the sync in multi-node deployments.
   */
  async syncAllSymbols() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    
    console.log('[StorageService] 🔄 Starting slow sync for all symbols...');
    
    try {
      const symbols = alltickApiService.getSupportedSymbols();
      const timeframes = ['1m', '5m', '15m', '1h', '1d'];
      
      for (const symbol of symbols) {
        for (const tf of timeframes) {
          // Check if we hit cooldown during sync
          if (Date.now() < alltickApiService.restCooldownUntil) {
            console.warn('[StorageService] ❄️ Sync paused due to Cooldown');
            await new Promise(r => setTimeout(r, 10000));
            continue;
          }
          
          await this.syncCandles(symbol, tf);
          // Wait 5s between symbols in background sync to prioritize chart requests
          await new Promise(r => setTimeout(r, 5000));
        }
      }
      console.log('[StorageService] ✅ Slow sync cycle completed.');
    } catch (err) {
      console.error('[StorageService] Sync Error:', err.message);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * //sanket - Fetch candles from MetaAPI and upsert into MongoDB
   * Logic: Fetches the last 300 candles and uses MongoDB bulkWrite with upsert 
   * to ensure no duplicates while keeping data fresh.
   */
  async syncCandles(symbol, timeframe) {
    const Model = getModelForSymbol(symbol);
    if (!Model) return;

    const taskKey = this.getTaskKey(symbol, timeframe);
    if (this.inflightSyncTasks.has(taskKey)) {
      return this.inflightSyncTasks.get(taskKey);
    }

    const task = (async () => {
      try {
        const resolvedSymbol = this.resolveStorageSymbol(symbol);
        
        // Elite Performance: Find the last known candle in DB
        const lastCandle = await Model.findOne({ symbol: resolvedSymbol, timeframe })
          .sort({ time: -1 })
          .lean();

        let from = null;
        let to = Math.floor(Date.now() / 1000);
        let limit = 300;

        if (lastCandle && lastCandle.time) {
          // Sync from the last candle time + 1 second
          from = Math.floor(lastCandle.time.getTime() / 1000) + 1;
          
          // If we are already caught up (within 1 minute), skip the sync to save API
          if (to - from < 60) {
            return;
          }
          
          // Request up to 1000 missing candles
          limit = 1000;
          console.log(`[StorageService] 🔄 Incremental sync for ${symbol} ${timeframe} (from: ${new Date(from * 1000).toISOString()})`);
        } else {
          console.log(`[StorageService] 🆕 Initial sync for ${symbol} ${timeframe}`);
        }

        // Use AllTick for history sync
        const result = await alltickApiService.getHistoricalCandles(symbol, timeframe, from, to, limit);
        const candles = result.candles || [];
        
        if (candles.length === 0) {
          return;
        }

        await this.storeCandles(symbol, timeframe, candles);
        
        // ✅ Feed the Redis rolling buffer with the new discovery
        if (candles.length < 500) {
          for (const c of candles) {
            this.pushToRedisRolling(symbol, timeframe, {
              timeMs: Math.floor(new Date(c.time).getTime() / 1000) * 1000,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume
            });
          }
        }

        console.log(`[StorageService] ✅ ${symbol} ${timeframe}: stored ${candles.length} candles (Incremental)`);
      } catch (err) {
        console.error(`[StorageService] ❌ Error syncing ${symbol} ${timeframe}:`, err.message);
      }
    })();

    this.inflightSyncTasks.set(taskKey, task);
    try {
      await task;
    } finally {
      this.inflightSyncTasks.delete(taskKey);
    }
  }

  /**
   * //sanket - Fetch candles from local database with fallback to API
   */
  async getCandles(symbol, timeframe, from, to, limit) {
    console.log(`[StorageService] getCandles: ${symbol} ${timeframe} from=${from} to=${to} limit=${limit}`);
    try {
      // ✅ Elite Performance: Try Redis Rolling Buffer FIRST
      // This is the "Sub-Millisecond" path for live chart data
      const redisCandles = await this.getCandlesFromRedis(symbol, timeframe, from, to, limit);
      if (redisCandles.length > 0) {
        // If we found enough candles to satisfy a "recent" request, return them
        const requestedLimit = limit || 500;
        // Logic: If we found > 20% of requested limit OR it's a small recent request, serve it.
        if (redisCandles.length >= Math.min(requestedLimit, 100)) {
           console.log(`[StorageService] ⚡ Redis Fast-Path: Returning ${redisCandles.length} candles for ${symbol}`);
           return redisCandles;
        }
      }

      const Model = getModelForSymbol(symbol);
      if (!Model) {
        return await alltickApiService.getHistoricalCandles(symbol, timeframe, from, to, limit);
      }

      const resolvedSymbol = this.resolveStorageSymbol(symbol);

      // Try DB if Redis was insufficient
      let dbCandles = await this.queryCandles(Model, resolvedSymbol, timeframe, from, to, limit);

    const requestedLimit = limit || 500;
    //Sanket - "Treat request as bounded window only when both from and to are valid and ordered."
    const hasBoundedWindow = Number.isFinite(from) && Number.isFinite(to) && to > from;
    //Sanket - "Convert timeframe to seconds for expected candle count and continuity checks."
    const timeframeSeconds = this.timeframeToSeconds(timeframe);
    //Sanket - "Apply strict quality guards on intraday chart timeframes where dot-candle artifacts were observed."
    const intradayTf = ['1m', '5m', '15m', '30m', '1h'].includes(timeframe);
    const expectedWindowCandles = hasBoundedWindow
      ? Math.max(1, Math.floor((to - from) / timeframeSeconds))
      : null;
    const sparseWindowThreshold = hasBoundedWindow
      ? Math.max(30, Math.floor(expectedWindowCandles * 0.6))
      : null;

    if (dbCandles.length > 0) {
      //Sanket - "For sparse bounded 1m windows, refill exact window from provider to prevent dot-like refresh candles."
      if (
        timeframe === '1m' &&
        hasBoundedWindow &&
        sparseWindowThreshold &&
        dbCandles.length < sparseWindowThreshold
      ) {
        const refillLimit = Math.max(requestedLimit, expectedWindowCandles || 0, 500);
        // Do NOT await here - background the refill so chart loads immediately
        this.fetchAndCacheCandles(resolvedSymbol, timeframe, from, to, refillLimit).catch(() => {});
        // Proceed with current dbCandles
      }

      //Sanket - "Reject low-quality bounded windows by coverage, continuity, and volume; then refill from provider."
      if (hasBoundedWindow && dbCandles.length > 0) {
        const expected = expectedWindowCandles || dbCandles.length;
        const coverageRatio = expected > 0 ? (dbCandles.length / expected) : 1;

        let oneStepTransitions = 0;
        for (let i = 1; i < dbCandles.length; i += 1) {
          const prev = Math.floor(new Date(dbCandles[i - 1].time).getTime() / 1000);
          const curr = Math.floor(new Date(dbCandles[i].time).getTime() / 1000);
          if ((curr - prev) === timeframeSeconds) {
            oneStepTransitions += 1;
          }
        }
        const totalTransitions = Math.max(1, dbCandles.length - 1);
        const continuityRatio = oneStepTransitions / totalTransitions;

        const totalVolume = dbCandles.reduce((acc, c) => acc + (Number(c.volume || c.tickVolume || 0) || 0), 0);
        const avgVolume = dbCandles.length > 0 ? totalVolume / dbCandles.length : 0;

        const lowQualityIntraday = intradayTf && avgVolume <= 2;
        const poorCoverage = coverageRatio < 0.9;
        const poorContinuity = continuityRatio < 0.95;

        if (lowQualityIntraday || poorCoverage || poorContinuity) {
          const refillLimit = Math.max(requestedLimit, expectedWindowCandles || 0, 500);
          // Background refill
          this.fetchAndCacheCandles(resolvedSymbol, timeframe, from, to, refillLimit).catch(() => {});
        }
      }

      //Sanket - "For unbounded refresh calls, reject low-quality intraday cache and refill latest provider candles."
      if (!hasBoundedWindow && intradayTf && dbCandles.length > 0) {
        let oneStepTransitions = 0;
        for (let i = 1; i < dbCandles.length; i += 1) {
          const prev = Math.floor(new Date(dbCandles[i - 1].time).getTime() / 1000);
          const curr = Math.floor(new Date(dbCandles[i].time).getTime() / 1000);
          if ((curr - prev) === timeframeSeconds) {
            oneStepTransitions += 1;
          }
        }

        const totalTransitions = Math.max(1, dbCandles.length - 1);
        const continuityRatio = oneStepTransitions / totalTransitions;
        const totalVolume = dbCandles.reduce((acc, c) => acc + (Number(c.volume || c.tickVolume || 0) || 0), 0);
        const avgVolume = dbCandles.length > 0 ? totalVolume / dbCandles.length : 0;
        const lowQualityIntraday = avgVolume <= 2 || continuityRatio < 0.9;

        if (lowQualityIntraday) {
          await this.fetchAndCacheCandles(resolvedSymbol, timeframe, null, null, requestedLimit);
          const refreshed = await this.queryCandles(Model, resolvedSymbol, timeframe, null, null, requestedLimit);
          if (refreshed.length >= dbCandles.length) {
            dbCandles = refreshed;
          }
        }
      }

      const sourceTimeframe = this.getAggregationSourceTimeframe(timeframe);
      if (sourceTimeframe && dbCandles.length < Math.max(50, Math.floor(requestedLimit * 0.5))) {
        const aggregated = await this.aggregateCandlesFromSource(Model, resolvedSymbol, timeframe, from, to, requestedLimit);
        if (aggregated.length > dbCandles.length) {
          await this.storeCandles(resolvedSymbol, timeframe, aggregated);
          return aggregated;
        }
      }

      let mappedCandles = this.mapDbCandles(dbCandles);
      // Filter out weekend candles for XAUUSD (and similar symbols if needed)
      if (['XAUUSD', 'XAUUSD.i', 'XAUUSD.I'].includes(String(symbol).toUpperCase())) {
        mappedCandles = mappedCandles.filter(candle => {
          const day = (candle.time instanceof Date ? candle.time : new Date(candle.time)).getUTCDay();
          // 0 = Sunday, 6 = Saturday
          return day !== 0 && day !== 6;
        });
      }
      return mappedCandles;
    }

    // DB cache miss: fetch once (deduped), store, then serve from DB.
    // This prevents multiple users from triggering duplicate API calls for the same history window.
    await this.fetchAndCacheCandles(resolvedSymbol, timeframe, from, to, requestedLimit);

    dbCandles = await this.queryCandles(Model, resolvedSymbol, timeframe, from, to, limit);
    if (dbCandles.length > 0) {
      return this.mapDbCandles(dbCandles);
    }

    // If provider timeframe history is sparse, derive candles from a lower timeframe in MongoDB.
    const aggregated = await this.aggregateCandlesFromSource(Model, resolvedSymbol, timeframe, from, to, limit || 500);
    if (aggregated.length > 0) {
      await this.storeCandles(resolvedSymbol, timeframe, aggregated);
      return aggregated;
    }

    return [];
    } catch (error) {
      console.error(`[StorageService] Error in getCandles for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * //sanket - Iterative historical backfill
   * Fetches multiple batches of historical data until the requested days are reached.
   * Logic: Calculates the number of batches based on timeframe and limit, 
   * then loops backwards through time, fetching and storing each batch.
   */
  async backfill(symbol, timeframe, days = 30) {
    const taskKey = this.getTaskKey(symbol, timeframe, days);
    if (this.inflightBackfillTasks.has(taskKey)) {
      return this.inflightBackfillTasks.get(taskKey);
    }

    const task = (async () => {
      console.log(`[StorageService] Starting backfill for ${symbol} ${timeframe} - ${days} days`);
      
      // Calculate backfill window in seconds
      const durationSeconds = days * 24 * 60 * 60;
      const now = Math.floor(Date.now() / 1000);
      const targetStartTime = now - durationSeconds;

      let currentEndTime = now;
      let totalSynced = 0;
      const batchLimit = 1000; // MetaAPI max limit
      const timeframeSeconds = this.timeframeToSeconds(timeframe);
      const stepSeconds = timeframeSeconds * batchLimit;

      while (currentEndTime > targetStartTime) {
        try {
          const windowStart = Math.max(targetStartTime, currentEndTime - stepSeconds);
          console.log(
            `[StorageService] Fetching batch for ${symbol} ${timeframe} from ${new Date(windowStart * 1000).toISOString()} to ${new Date(currentEndTime * 1000).toISOString()}`
          );

          const candles = await metaApiService.getHistoricalCandles(
            symbol, 
            timeframe, 
            windowStart,
            currentEndTime,
            batchLimit
          );

          if (!candles || candles.length === 0) {
            console.log('[StorageService] No more candles found for this period.');
            break;
          }

          await this.storeCandles(symbol, timeframe, candles);
          totalSynced += candles.length;

          const oldestTime = Math.min(...candles.map(c => c.time));
          if (oldestTime >= currentEndTime) {
            console.log('[StorageService] Time progress stalled, finishing backfill.');
            break;
          }

          // Move one second before oldest candle to avoid re-fetch overlap loops.
          currentEndTime = oldestTime - 1;
          console.log(`[StorageService] Backfilled ${totalSynced} candles so far...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`[StorageService] Backfill error:`, error.message);
          break;
        }
      }

      console.log(`[StorageService] Backfill completed for ${symbol}. Total: ${totalSynced} candles.`);
      return totalSynced;
    })();

    this.inflightBackfillTasks.set(taskKey, task);
    try {
      return await task;
    } finally {
      this.inflightBackfillTasks.delete(taskKey);
    }
  }

  /**
   * //sanket - Modular helper for storing candles
   */
  async storeCandles(symbol, timeframe, candles) {
    const Model = getModelForSymbol(symbol);
    if (!Model || !candles || candles.length === 0) return;

    const operations = candles.map(candle => ({
      updateOne: {
        filter: { 
          symbol, 
          timeframe, 
          time: new Date(candle.time * 1000) 
        },
        update: {
          $set: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            tickVolume: candle.tickVolume || 0,
            spread: candle.spread || 0
          }
        },
        upsert: true
      }
    }));

    await Model.bulkWrite(operations);
  }
}

const storageService = new StorageService();
export default storageService;
