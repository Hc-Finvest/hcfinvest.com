/**
 * //sanket - Storage Service for caching market data
 * This service periodically fetches historical candles from MetaAPI
 * and stores them in MongoDB for fast retrieval and to prevent API rate limits.
 */

import metaApiService from './metaApiService.js';
import Candle from '../models/Candle.js'; // //sanket - Generic model handles all symbols

// //sanket - All symbols use the generic Candle model for simplicity and consistency
// The Candle model has proper indexes for fast queries across all symbols
const getModelForSymbol = (symbol) => {
  return Candle;
};

class StorageService {
  constructor() {
    this.syncInterval = null;
    this.isSyncing = false;
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

  /**
   * //sanket - Sync all supported symbols for multiple timeframes
   */
  async syncAllSymbols() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    // //sanket - Sync ALL available symbols from MetaAPI service
    // This ensures every symbol available in the chart has historical data in MongoDB
    const allSymbols = metaApiService.getSupportedSymbols()
    const symbols = allSymbols;
    const timeframes = ['1m', '5m', '15m', '1h', '1d'];

    console.log(`[StorageService] 🔄 Syncing ${symbols.length} symbols across ${timeframes.length} timeframes (${symbols.length * timeframes.length} sync tasks)...`);
    console.log(`[StorageService] Symbols: ${symbols.slice(0, 10).join(', ')} ... and ${symbols.length - 10} more`);

    for (const symbol of symbols) {
      for (const timeframe of timeframes) {
        try {
          await this.syncCandles(symbol, timeframe);
          // Small delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[StorageService] Failed to sync ${symbol} ${timeframe}:`, error.message);
        }
      }
    }

    this.isSyncing = false;
    console.log('[StorageService] Sync cycle completed.');
  }

  /**
   * //sanket - Fetch candles from MetaAPI and upsert into MongoDB
   * Logic: Fetches the last 300 candles and uses MongoDB bulkWrite with upsert 
   * to ensure no duplicates while keeping data fresh.
   */
  async syncCandles(symbol, timeframe) {
    const Model = getModelForSymbol(symbol);
    if (!Model) return;

    try {
      const candles = await metaApiService.getHistoricalCandles(symbol, timeframe, null, null, 300);
      
      if (!candles || candles.length === 0) {
        console.warn(`[StorageService] ⚠️  No candles fetched for ${symbol} ${timeframe}`);
        return;
      }

      await this.storeCandles(symbol, timeframe, candles);
      console.log(`[StorageService] ✅ ${symbol} ${timeframe}: stored ${candles.length} candles`);
    } catch (err) {
      console.error(`[StorageService] ❌ Error syncing ${symbol} ${timeframe}:`, err.message);
    }
  }

  /**
   * //sanket - Fetch candles from local database with fallback to API
   */
  async getCandles(symbol, timeframe, from, to, limit) {
    const Model = getModelForSymbol(symbol);
    if (!Model) {
      return await metaApiService.getHistoricalCandles(symbol, timeframe, from, to, limit);
    }

    // Try DB first
    let query = { symbol, timeframe };
    let sortOrder = { time: 1 }; // Default ascending
    
    if (from || to) {
      query.time = {};
      if (from) query.time.$gte = new Date(from * 1000);
      if (to) query.time.$lte = new Date(to * 1000);
    } else {
      // If no range, we want the LATEST n candles
      sortOrder = { time: -1 };
    }

    let dbCandles = await Model.find(query)
      .sort(sortOrder)
      .limit(limit || 500)
      .lean();

    if (dbCandles.length > 0) {
      // If we sorted descending to get the latest, reverse them for the chart
      if (sortOrder.time === -1) {
        dbCandles.reverse();
      }

      return dbCandles.map(c => ({
        time: Math.floor(c.time.getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      }));
    }

    // Fallback to API if DB is empty
    return await metaApiService.getHistoricalCandles(symbol, timeframe, from, to, limit);
  }

  /**
   * //sanket - Iterative historical backfill
   * Fetches multiple batches of historical data until the requested days are reached.
   * Logic: Calculates the number of batches based on timeframe and limit, 
   * then loops backwards through time, fetching and storing each batch.
   */
  async backfill(symbol, timeframe, days = 30) {
    console.log(`[StorageService] Starting backfill for ${symbol} ${timeframe} - ${days} days`);
    
    // Calculate total duration in seconds
    const durationSeconds = days * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);
    const targetStartTime = now - durationSeconds;
    
    let currentEndTime = now;
    let totalSynced = 0;
    const batchLimit = 1000; // MetaAPI max limit

    while (currentEndTime > targetStartTime) {
      try {
        console.log(`[StorageService] Fetching batch for ${symbol} before ${new Date(currentEndTime * 1000).toISOString()}`);
        
        const candles = await metaApiService.getHistoricalCandles(
          symbol, 
          timeframe, 
          currentEndTime, // //sanket - Pass as startTime to fetch backwards from here
          null,           // endTime is not used by our service
          batchLimit
        );

        if (!candles || candles.length === 0) {
          console.log('[StorageService] No more candles found for this period.');
          break;
        }

        // Upsert into DB
        await this.storeCandles(symbol, timeframe, candles);
        
        totalSynced += candles.length;
        
        // Find the oldest candle in this batch to set as the next endTime
        const oldestTime = Math.min(...candles.map(c => c.time));
        
        // If we didn't move back in time, we are stuck
        if (oldestTime >= currentEndTime) {
          console.log('[StorageService] Time progress stalled, finishing backfill.');
          break;
        }

        currentEndTime = oldestTime;
        
        console.log(`[StorageService] Backfilled ${totalSynced} candles so far...`);
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`[StorageService] Backfill error:`, error.message);
        break;
      }
    }

    console.log(`[StorageService] Backfill completed for ${symbol}. Total: ${totalSynced} candles.`);
    return totalSynced;
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
