import WebSocket from 'ws';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import redisClient from './redisClient.js';
import { updateCandleListWithTick } from '../utils/candleAggregator.js';
import priceNormalizer from './priceNormalizer.js';

dotenv.config();

// Unified token retrieval to handle different .env naming conventions
const ALLTICK_TOKEN = () => process.env.ALLTICK_API_TOKEN || process.env.ALLTICK_TOKEN || process.env.ALLTICK_API_KEY;
const ALLTICK_WS_URL = () => process.env.ALLTICK_WS_URL || 'wss://quote.alltick.io/quote-b-ws-api';
const ALLTICK_REST_URL = () => process.env.ALLTICK_REST_URL || 'https://quote.alltick.io/quote-b-api';

class AllTickApiService {
  constructor() {
    this.ws = null;
    this.subscribers = new Set();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.seqId = 1; // 32-bit sequence counter
    this.maxReconnectAttempts = 20; 
    
    // Comprehensive mapping for all instruments defined in frontend
    this.symbolMap = {
      // Forex
      'EURUSD.i': 'EURUSD', 'GBPUSD.i': 'GBPUSD', 'USDJPY.i': 'USDJPY', 'USDCHF.i': 'USDCHF', 
      'AUDUSD.i': 'AUDUSD', 'NZDUSD.i': 'NZDUSD', 'USDCAD.i': 'USDCAD', 'EURGBP.i': 'EURGBP', 
      'EURJPY.i': 'EURJPY', 'GBPJPY.i': 'GBPJPY', 'EURAUD.i': 'EURAUD', 'EURCAD.i': 'EURCAD', 
      'EURCHF.i': 'EURCHF', 'AUDJPY.i': 'AUDJPY', 'CADJPY.i': 'CADJPY', 'CHFJPY.i': 'CHFJPY', 
      'AUDNZD.i': 'AUDNZD', 'AUDCAD.i': 'AUDCAD', 'CADCHF.i': 'CADCHF', 'NZDJPY.i': 'NZDJPY', 
      'GBPAUD.i': 'GBPAUD', 'GBPCAD.i': 'GBPCAD', 'GBPCHF.i': 'GBPCHF', 'GBPNZD.i': 'GBPNZD', 
      'AUDCHF.i': 'AUDCHF', 'NZDCAD.i': 'NZDCAD', 'NZDCHF.i': 'NZDCHF', 'EURNZD.i': 'EURNZD',

      // Metals & Commodities
      'XAUUSD.i': 'XAUUSD',
      'XAGUSD.i': 'XAGUSD',
      'USOIL.i': 'USOIL',
      'UKOIL.i': 'UKOIL',
      'NGAS.i': 'NGAS',
      'COPPER.i': 'COPPER',

      // Cryptocurrencies (AllTick uses USDT pairings)
      'BTCUSD.i': 'BTCUSDT',
      'ETHUSD.i': 'ETHUSDT',
      'BNBUSD.i': 'BNBUSDT',
      'SOLUSD.i': 'SOLUSDT',
      'DOGEUSD.i': 'DOGEUSDT',
      'LTCUSD.i': 'LTCUSDT',
      'XRPUSD.i': 'XRPUSDT',
      'ADAUSD.i': 'ADAUSDT',

      // Indices
      'US30.i': 'US30',
      'US500.i': 'US500',
      'US100.i': 'US100',
      'UK100.i': 'UK100',
      'DE30.i': 'GER30',
      'FR40.i': 'FRA40',
      'ES35.i': 'SPA35'
    };

    this.reverseSymbolMap = {};
    Object.entries(this.symbolMap).forEach(([key, value]) => {
      this.reverseSymbolMap[value] = key;
      // Also map clean symbols to themselves if they differ from the .i key
      const cleanKey = key.replace(/\.i$/i, '');
      if (cleanKey !== key) {
        this.symbolMap[cleanKey] = value;
      }
    });

    // ≡ƒ¢í∩╕Å Senior Dev Fix: Ensure reverse map points to the FULL instrument ID (e.g. XAUUSD.i)
    // This ensures Redis lookups and frontend streaming stay consistent.
    Object.entries(this.symbolMap).forEach(([key, value]) => {
        if (key.includes('.i')) {
           this.reverseSymbolMap[value] = key;
        } else if (!this.reverseSymbolMap[value]) {
           this.reverseSymbolMap[value] = key;
        }
    });

    this.subscribedSymbols = new Set(['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD', 'ETHUSD', 'XAGUSD', 'EURJPY', 'USDJPY', 'GBPJPY']);
    // Auto-populate from symbol map to ensure we catch everything
    Object.values(this.symbolMap).forEach(s => this.subscribedSymbols.add(s));

    this.prioritySymbols = [];
    this.restCooldownUntil = 0; // Cooldown for REST API (history)
    this.wsCooldownUntil = 0;   // Cooldown for WebSocket (connection)
    this.historyCache = new Map(); // Cache for historical requests to avoid 429s
    
    // Periodically clear old cache entries (5 minute TTL)
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.historyCache.entries()) {
        if (now - value.timestamp > 300000) { 
          this.historyCache.delete(key);
        }
      }
    }, 60000);

    // REST Request Queue to prevent concurrent 429s/402s on trial tokens
    this.restQueue = Promise.resolve();
  }

  /**
   * Helper to always get the AllTick-compatible symbol
   */
  normalizeSymbol(symbol) {
    if (!symbol) return '';
    return this.symbolMap[symbol] || symbol;
  }

  async connect() {
    // Check WebSocket cooldown
    if (Date.now() < this.wsCooldownUntil) {
      console.warn(`[AllTick] ❄️ Skipping connection attempt (WS Cooldown active for ${Math.ceil((this.wsCooldownUntil - Date.now()) / 1000)}s)`);
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = ALLTICK_TOKEN();
    if (!token) {
        console.error('[AllTick] Missing AllTick token in .env');
        return;
    }

    const wsUrl = `wss://quote.alltick.io/quote-b-ws-api?token=${token}`;
    console.log(`[AllTick] Connecting to WebSocket (${wsUrl})...`);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('[AllTick] Connected to WebSocket successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.resubscribeAll();
      });

      this.ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(data);
        } catch (err) {
          console.error('[AllTick] Error parsing message:', err.message);
        }
      });

      this.ws.on('close', (code, reason) => {
        console.warn(`[AllTick] Connection closed: ${code} ${reason}`);
        this.isConnected = false;
        this.stopHeartbeat();
        this.handleReconnect();
      });

      this.ws.on('error', (err) => {
        console.error('[AllTick] WebSocket error:', err.message);
        // Handle 429 specifically on socket upgrade
        if (err.message.includes('429')) {
          console.error('[AllTick] 🚨 WS Rate limit hit (429). Entering 60s cooldown.');
          this.wsCooldownUntil = Date.now() + 60000;
        }
      });
    } catch (err) {
      console.error('[AllTick] Connection failed:', err.message);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (Date.now() < this.wsCooldownUntil) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(2000 * Math.pow(1.5, this.reconnectAttempts), 60000);
      console.log(`[AllTick] Reconnecting in ${Math.round(delay/1000)}s...`);
      setTimeout(() => this.connect(), delay);
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
        // Correct AllTick heartbeat: cmd_id 22000, must include data: {}
        this.ws.send(JSON.stringify({
          cmd_id: 22000,
          seq_id: this.seqId++,
          trace: uuidv4(),
          data: {}
        }));
      }
    }, 10000); // 10 second interval
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  handleMessage(data) {
    if (!data) return;

    const cmdId = data.cmd_id;
    
    // 22001 is the heartbeat response
    if (cmdId === 22001) return;
    
    // 22998 is the push message for real-time prices
    if (cmdId === 22998) {
        const tick = data.data;
        if (!tick || !tick.code) return;
        
        const appSymbol = this.reverseSymbolMap[tick.code] || tick.code;
        const lastPrice = parseFloat(tick.price) || 0;
        
        let tickMs = parseInt(tick.tick_time);
        if (tickMs < 100000000000) tickMs *= 1000;

        const tickTime = tickMs ? new Date(tickMs) : new Date();
        
        // Normalize price (rounds for display, keeps raw for math)
        const normalized = priceNormalizer.normalizePrice(appSymbol, lastPrice, lastPrice * 1.0001, tickTime);
        
        const priceData = {
          ...normalized,
          last: lastPrice,
          provider: 'alltick'
        };

        this.setLivePrice(appSymbol, priceData);
        this.notifySubscribers(appSymbol, priceData);
        
        // 🚀 ELITE: Proactively sync live tick to all timeframe caches (1m -> 1D)
        this.syncLivePriceToTiers(appSymbol, { price: lastPrice, time: tickMs });
        return;
    }

    if (cmdId === 22004 || cmdId === 22005 || cmdId === 11002 || (data.event && data.data)) {
      const payload = data.data;
      if (!payload) return;

      const ticks = payload.symbol_list || (Array.isArray(payload) ? payload : [payload]);
      
      ticks.forEach(tick => {
        const symbol = tick.code || tick.symbol;
        if (!symbol) return;

        const appSymbol = this.reverseSymbolMap[symbol] || symbol;

        let tickTs = tick.timestamp ? parseInt(tick.timestamp) : 0;
        if (tickTs > 0 && tickTs < 100000000000) tickTs *= 1000;

        let bid = parseFloat(tick.bid_price || tick.last_price || tick.price || tick.close) || 0;
        let ask = parseFloat(tick.ask_price || tick.last_price || tick.price || tick.close) || 0;
        
        // Add tiny spread if bid/ask are identical
        if (ask === bid && bid > 0) {
            ask += (bid * 0.00005);
        }

        const tickTime = tickTs ? new Date(tickTs) : new Date();
        const normalized = priceNormalizer.normalizePrice(appSymbol, bid, ask, tickTime);

        const priceData = {
          ...normalized,
          last: parseFloat(tick.last_price || tick.price || tick.close) || 0,
          provider: 'alltick'
        };

        this.setLivePrice(appSymbol, priceData);
        this.notifySubscribers(appSymbol, priceData);
      });
    }
  }

  resubscribeAll() {
    const symbols = new Set([...this.subscribedSymbols, ...this.prioritySymbols]);
    if (symbols.size > 0) {
      this.subscribeToSymbols(Array.from(symbols));
    }
  }

  subscribeToSymbols(symbols) {
    if (!Array.isArray(symbols)) symbols = [symbols];
    
    const alltickSymbols = [...new Set(symbols.map(s => this.normalizeSymbol(s)))];
    
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        cmd_id: 22004, // Use 22004 for transaction quote subscription
        seq_id: this.seqId++,
        trace: uuidv4(),
        data: {
          symbol_list: alltickSymbols.map(s => ({
            code: s
          }))
        }
      }));
    }
  }

  async getHistoricalCandles(symbol, timeframe = '1m', startTime, endTime, limit = 500, preferLive = false) {
    // 0. Use 'latest' (undefined endTime) only if preferLive is true AND no explicit endTime is provided
    const effectiveEndTime = (preferLive && !endTime) ? undefined : endTime;
    
    // Check REST cooldown
    if (Date.now() < this.restCooldownUntil) {
      console.warn(`[AllTick] ❄️ REST Cooldown active (${Math.ceil((this.restCooldownUntil - Date.now()) / 1000)}s remaining)`);
      // Standardize cache check during cooldown
      const fallbackSymbol = this.normalizeSymbol(symbol);
      const fallbackKey = `${fallbackSymbol}|${timeframe}|${effectiveEndTime || 'latest'}|${limit}`;
      if (this.historyCache.has(fallbackKey)) {
        return { success: true, candles: this.historyCache.get(fallbackKey).data, source: 'memory_cache_cooldown' };
      }
      return { success: false, candles: [], error: 'rate_limited', source: 'cooldown' };
    }

    const token = ALLTICK_TOKEN();
    const restUrl = ALLTICK_REST_URL();
    const alltickSymbol = this.normalizeSymbol(symbol);

    const timeframeMap = {
      '1m': 1, '5m': 2, '15m': 3, '30m': 4, '1h': 5, '4h': 6, '1d': 7, '1w': 8, '1M': 9
    };
    const klineType = timeframeMap[timeframe] || 1;

    const cacheKey = `${alltickSymbol}|${timeframe}|${effectiveEndTime || 'latest'}|${limit}`;
    if (this.historyCache.has(cacheKey)) {
      const cached = this.historyCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 min cache
        return { success: true, candles: cached.data, source: 'memory_cache' };
      }
    }

    const queryPayload = {
      data: {
        code: alltickSymbol,
        kline_type: klineType,
        query_kline_num: Math.min(limit, 5000),
        adjust_type: 0
      }
    };
    
    if (effectiveEndTime) {
       let ts = parseInt(effectiveEndTime);
       if (ts > 100000000000) ts = Math.floor(ts / 1000);
       queryPayload.data.kline_timestamp_end = ts;
    }

    const url = `${restUrl}/kline?token=${token}&query=${encodeURIComponent(JSON.stringify(queryPayload))}`;

    // Use sequential queue with throttle to prevent concurrent API hits and rate limits
    return this.restQueue = this.restQueue.then(async () => {
      let attempts = 0;
      const maxRetries = 2;
      
      while (attempts <= maxRetries) {
        try {
          // Mandatory throttle (e.g. 1.5s between requests)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const response = await fetch(url);

          if (response.status === 429) {
            attempts++;
            console.warn(`[AllTick] 🚨 Rate limit hit (429). Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          let result = await response.json();
          
          if (result.ret !== 0 && result.ret !== 200 || !result.data || !result.data.kline_list || result.data.kline_list.length === 0) {
            // If specific time range failed or returned empty (future dates), try falling back to latest
            if (queryPayload.data.kline_timestamp_end) {
              delete queryPayload.data.kline_timestamp_end;
              const retryUrl = `${restUrl}/kline?token=${token}&query=${encodeURIComponent(JSON.stringify(queryPayload))}`;
              
              // Second mandatory throttle
              await new Promise(resolve => setTimeout(resolve, 1200));
              
              const retryRes = await fetch(retryUrl);
              
              if (retryRes.status === 429) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue; 
              }
              
              if (retryRes.ok) result = await retryRes.json();
            }
          }

          if (result.ret !== 0 && result.ret !== 200 || !result.data || !result.data.kline_list) {
            return { success: false, candles: [], error: result.msg || 'api_invalid_response', source: 'api' };
          }
          
          const candles = result.data.kline_list.map(c => ({
            time: parseInt(c.timestamp) * 1000,
            open: parseFloat(c.open_price),
            high: parseFloat(c.high_price),
            low: parseFloat(c.low_price),
            close: parseFloat(c.close_price),
            volume: parseFloat(c.volume) || 0
          })).sort((a, b) => a.time - b.time);

          this.historyCache.set(cacheKey, {
            timestamp: Date.now(),
            data: candles
          });

          return { success: true, candles, source: 'api' };
        } catch (error) {
          console.error(`[AllTick] REST error for ${alltickSymbol}:`, error);
          return { success: false, candles: [], error: error.message, source: 'api_error' };
        }
      }
      return { success: false, candles: [], error: 'max_retries_exceeded', source: 'api' };
    }).catch(err => {
      console.error('[AllTick] restQueue error:', err.message);
      return { success: false, candles: [], error: 'queue_error' };
    });
  }

  addSubscriber(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(symbol, price) {
    this.subscribers.forEach(callback => {
      try {
        callback(symbol, price);
      } catch (err) {}
    });
  }

  // ==========================================
  // REDIS HELPER FUNCTIONS
  // ==========================================

  async setLivePrice(symbol, data) {
    try {
      if (!symbol || !data) return;
      const cleanSymbol = String(symbol).toUpperCase();
      const payloadString = JSON.stringify({ ...data, symbol: cleanSymbol });
      
      // 1. Store the newest price in Redis HSET (Always use clean symbol)
      await redisClient.hset('live_prices', cleanSymbol, payloadString);
      
      // 2. Publish to the Redis channel for real-time WebSocket broadcasting
      await redisClient.publish('price_updates', payloadString);
    } catch (err) {
      console.error('[Redis] Failed to set live price:', err.message);
    }
  }

  async getLivePrice(symbol) {
    try {
      const cleanSymbol = String(symbol).toUpperCase();
      const data = await redisClient.hget('live_prices', cleanSymbol);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[Redis] Failed to get live price:', err.message);
      return null;
    }
  }

  async getAllPrices() {
    try {
      const data = await redisClient.hgetall('live_prices');
      const parsed = {};
      for (const [sym, val] of Object.entries(data)) {
        parsed[sym] = JSON.parse(val);
      }
      return parsed;
    } catch (err) {
      console.error('[Redis] Failed to get all prices:', err.message);
      return {};
    }
  }

  async getPricesByCategory() {
    const allPrices = await this.getAllPrices();
    const categories = {
      'Forex': {},
      'Metals': {},
      'Crypto': {},
      'Indices': {},
      'All': {}
    };

    Object.entries(allPrices).forEach(([symbol, data]) => {
      categories['All'][symbol] = data;
      const s = symbol.toUpperCase();
      if (s.includes('USD') || s.includes('JPY') || s.includes('EUR')) {
        if (s.startsWith('XAU') || s.startsWith('XAG')) categories['Metals'][symbol] = data;
        else if (s.startsWith('BTC') || s.startsWith('ETH')) categories['Crypto'][symbol] = data;
        else categories['Forex'][symbol] = data;
      }
    });
    
    return categories;
  }

  setPrioritySymbols(symbols) {
    if (!Array.isArray(symbols)) return [];
    this.prioritySymbols = symbols;
    if (this.isConnected) {
      this.resubscribeAll(); // Prevent destroying the global background stream
    }
    return symbols;
  }

  getSupportedSymbols() {
    return Object.keys(this.symbolMap);
  }

  isSymbolSupported(symbol) {
    return !!(this.symbolMap[symbol]);
  }

  async getPrice(symbol) {
    return await this.getLivePrice(symbol);
  }

  getSymbolInfo(symbol) {
    const s = symbol.toUpperCase();
    let digits = 5;
    let pricescale = 100000;

    if (s.includes("JPY") || s.includes("XAU") || s.includes("BTC") || s.includes("ETH") || s.includes("USDT")) {
      digits = 2;
      pricescale = 100;
    } else if (s.includes("XAG")) {
      digits = 3;
      pricescale = 1000;
    }

    return {
      symbol: symbol,
      digits: digits,
      pricescale: pricescale,
      minmov: 1
    };
  }

  async disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Proactively updates multiple timeframe caches (1m, 5m, 1h, etc.) in Redis
   * with a single live price tick. Ensures instant, continuous charts.
   */
  async syncLivePriceToTiers(symbol, tick) {
    if (!symbol || !tick || !tick.price) return;

    // 🚀 PERFORMANCE: Only sync high-frequency timeframes (1m, 5m) to Redis.
    // Syncing 4h or 1d on every tick at 50ms latency is excessive and blocks the event loop.
    const timeframes = [
      { tf: '1m', mins: 1 },
      { tf: '5m', mins: 5 }
    ];

    try {
      // Use a lock-free approach: just update the "live" keys
      for (const { tf, mins } of timeframes) {
        // Build the same cache key pattern used in prices.js
        // hist:${symbol}:${timeframe}:start:latest:1000:std
        const cacheKey = `hist:${symbol}:${tf}:start:latest:1000:std`;
        const liveCacheKey = `hist:${symbol}:${tf}:start:latest:1000:live`;

        // We try both because the history route might have cached it with either
        const keys = [cacheKey, liveCacheKey];
        
        for (const key of keys) {
          const cached = await redisClient.get(key);
          if (cached) {
            const candles = JSON.parse(cached);
            if (candles.length > 0) {
              const updated = updateCandleListWithTick(candles, tick, mins);
              // Save back with short TTL (5 mins) as it's a live-updated cache
              await redisClient.set(key, JSON.stringify(updated), 'EX', 300);
            }
          }
        }
      }
    } catch (err) {
      // Sliently fail tier sync to avoid crashing the main WS handler
      // console.error(`[TierSync] Error for ${symbol}:`, err.message);
    }
  }
}

export default new AllTickApiService();
