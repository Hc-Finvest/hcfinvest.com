import storageService from './storageService.js';
import alltickApiService from './alltickApiService.js';

/**
 * ✅ Elite Performance: Warmup Service
 * Pre-populates the Redis rolling cache for top symbols
 * so the first user request is instant.
 */
class WarmupService {
  constructor() {
    //Sanket v2.0 - Removed .i suffix from warmup symbols
    this.topSymbols = ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'XAGUSD'];
    this.topTimeframes = ['1m', '5m', '15m', '1h'];
    this.isWarming = false;
  }

  async run() {
    if (this.isWarming) return;
    this.isWarming = true;
    
    console.log('[Warmup] ♨️  Starting Redis cache warmup for top symbols...');
    const start = Date.now();

    try {
      for (const symbol of this.topSymbols) {
        for (const tf of this.topTimeframes) {
          // Trigger getCandles which handles the Redis -> DB -> API flow.
          // This call ensures the Redis rolling buffer (ZSET) is loaded
          // with the most recent data for immediate chart availability.
          await storageService.getCandles(symbol, tf, null, null, 1000);
          
          // Small staggered delay to respect API rate limits during boot
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`[Warmup] ✅ Warmup completed in ${duration}s. Popular symbols are now HOT.`);
    } catch (err) {
      console.error('[Warmup] ❌ Warmup error:', err.message);
    } finally {
      this.isWarming = false;
    }
  }
}

const warmupService = new WarmupService();
export default warmupService;
