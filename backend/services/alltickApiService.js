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
    
    // ✅ ELITE Resilience: Initialize memory cache (v7.77)
    this.prices = {};
    
    //Sanket v2.0 - Removed .i suffix convention from symbolMap keys for system-wide consistency
    this.symbolMap = {
      // Forex
      'EURUSD': 'EURUSD', 'GBPUSD': 'GBPUSD', 'USDJPY': 'USDJPY', 'USDCHF': 'USDCHF', 
      'AUDUSD': 'AUDUSD', 'NZDUSD': 'NZDUSD', 'USDCAD': 'USDCAD', 'EURGBP': 'EURGBP', 
      'EURJPY': 'EURJPY', 'GBPJPY': 'GBPJPY', 'EURAUD': 'EURAUD', 'EURCAD': 'EURCAD', 
      'EURCHF': 'EURCHF', 'AUDJPY': 'AUDJPY', 'CADJPY': 'CADJPY', 'CHFJPY': 'CHFJPY', 
      'AUDNZD': 'AUDNZD', 'AUDCAD': 'AUDCAD', 'CADCHF': 'CADCHF', 'NZDJPY': 'NZDJPY', 
      'GBPAUD': 'GBPAUD', 'GBPCAD': 'GBPCAD', 'GBPCHF': 'GBPCHF', 'GBPNZD': 'GBPNZD', 
      'AUDCHF': 'AUDCHF', 'NZDCAD': 'NZDCAD', 'NZDCHF': 'NZDCHF', 'EURNZD': 'EURNZD',

      // Metals & Commodities
      'XAUUSD': 'XAUUSD',
      'XAGUSD': 'XAGUSD',
      'USOIL': 'USOIL',
      'UKOIL': 'UKOIL',
      'NGAS': 'NGAS',
      'COPPER': 'COPPER',

      // Cryptocurrencies (AllTick uses USDT pairings)
      'BTCUSD': 'BTCUSDT',
      'ETHUSD': 'ETHUSDT',
      'BNBUSD': 'BNBUSDT',
      'SOLUSD': 'SOLUSDT',
      'DOGEUSD': 'DOGEUSDT',
      'LTCUSD': 'LTCUSDT',
      'XRPUSD': 'XRPUSDT',
      'ADAUSD': 'ADAUSDT',

      // Indices
      'US30': 'US30',
      'US500': 'US500',
      'US100': 'US100',
      'UK100': 'UK100',
      'DE30': 'GER30',
      'FR40': 'FRA40',
      'ES35': 'SPA35'
    };

    //Sanket v2.0 - Build reverseSymbolMap: AllTick symbol -> App symbol (no .i suffix)
    this.reverseSymbolMap = {};
    Object.entries(this.symbolMap).forEach(([key, value]) => {
      this.reverseSymbolMap[value] = key;
    });

    this.subscribedSymbols = new Set(['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD', 'ETHUSD', 'XAGUSD', 'EURJPY', 'USDJPY', 'GBPJPY']);
    // Auto-populate from symbol map to ensure we catch everything
    Object.values(this.symbolMap).forEach(s => this.subscribedSymbols.add(s));

    this.prioritySymbols = [];
    this.restCooldownUntil = 0; // Cooldown for REST API (history)
    this.wsCooldownUntil = 0;   // Cooldown for WebSocket (connection)
    this.historyCache = new Map(); // Cache for historical requests to avoid 429s
    this.lastAcceptedMidBySymbol = new Map();
    this.lastAcceptedTsBySymbol = new Map();
    this.pendingSpikeBySymbol = new Map();
    //Sanket v2.0 - Blacklist for symbols that AllTick confirms are unsupported (HTTP 600 / code invalid).
    // Without this, every startup warmup + chart load re-hits the API for the same bad symbol,
    // stacking up REST requests that trigger 429 → WS disconnect → real-time prices lost.
    this.unsupportedSymbols = new Set();
    
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

  getSpikeThresholdPercent(symbol = '') {
    const s = String(symbol).toUpperCase();

    if (s.includes('BTC') || s.includes('ETH') || s.includes('BNB') || s.includes('SOL') || s.includes('XRP') || s.includes('ADA') || s.includes('DOGE') || s.includes('LTC')) {
      return 20;
    }

    if (s.includes('XAU') || s.includes('XAG') || s.includes('OIL') || s.includes('NGAS') || s.includes('COPPER') || s.includes('US30') || s.includes('US100') || s.includes('US500') || s.includes('UK100') || s.includes('ES35')) {
      return 5;
    }

    return 3;
  }

  markAcceptedPrice(symbol, mid, ts) {
    this.lastAcceptedMidBySymbol.set(symbol, mid);
    this.lastAcceptedTsBySymbol.set(symbol, ts);
    this.pendingSpikeBySymbol.delete(symbol);
  }

  shouldAcceptTickPrice(symbol, midPrice, tickMs) {
    if (!Number.isFinite(midPrice) || midPrice <= 0) return false;

    const ts = Number.isFinite(tickMs) && tickMs > 0 ? tickMs : Date.now();
    const lastMid = this.lastAcceptedMidBySymbol.get(symbol);
    const lastTs = this.lastAcceptedTsBySymbol.get(symbol) || 0;

    if (!Number.isFinite(lastMid) || lastMid <= 0) {
      this.markAcceptedPrice(symbol, midPrice, ts);
      return true;
    }

    // Allow wider price movement after long market pauses/session transitions.
    const elapsedMs = Math.max(0, ts - lastTs);
    if (elapsedMs > (45 * 60 * 1000)) {
      this.markAcceptedPrice(symbol, midPrice, ts);
      return true;
    }

    const jumpPct = Math.abs((midPrice - lastMid) / lastMid) * 100;
    const thresholdPct = this.getSpikeThresholdPercent(symbol);
    if (jumpPct <= thresholdPct) {
      this.markAcceptedPrice(symbol, midPrice, ts);
      return true;
    }

    // Quarantine spikes: require a second near-identical anomalous tick before acceptance.
    const pending = this.pendingSpikeBySymbol.get(symbol);
    if (pending) {
      const withinPendingBand = Math.abs((midPrice - pending.price) / pending.price) * 100 <= 0.35;
      const withinWindow = (ts - pending.firstSeenAt) <= 15000;
      if (withinPendingBand && withinWindow) {
        pending.confirmations += 1;
        pending.lastSeenAt = ts;
        if (pending.confirmations >= 2) {
          this.markAcceptedPrice(symbol, midPrice, ts);
          return true;
        }
        this.pendingSpikeBySymbol.set(symbol, pending);
        return false;
      }
    }

    this.pendingSpikeBySymbol.set(symbol, {
      price: midPrice,
      confirmations: 1,
      firstSeenAt: ts,
      lastSeenAt: ts
    });
    console.warn(`[AllTick] Spike rejected for ${symbol}: ${lastMid} -> ${midPrice} (${jumpPct.toFixed(2)}%)`);
    return false;
  }

  /**
   * Returns the AllTick-native symbol code (e.g. 'XAUUSD.i' -> 'XAUUSD').
   * Handles case-insensitive input by normalizing the base (uppercase) while
   * preserving the lowercase .i suffix convention used in symbolMap keys.
   */
  normalizeSymbol(symbol) {
    if (!symbol) return '';
    const s = String(symbol).toUpperCase();
    const base = s.replace(/\.I$/, '');
    const targetWithSuffix = `${base}.i`;

    // 1. Try with .i suffix (e.g. 'XAUUSD.i')
    if (this.symbolMap[targetWithSuffix]) return this.symbolMap[targetWithSuffix];
    
    // 2. Try exact base (e.g. 'XAUUSD')
    if (this.symbolMap[base]) return this.symbolMap[base];
    
    // 3. Last resort fallbacks
    if (this.symbolMap[symbol]) return this.symbolMap[symbol];
    if (this.symbolMap[symbol.toLowerCase()]) return this.symbolMap[symbol.toLowerCase()];
    
    return symbol;
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
        console.log('[AllTick] ✅ WebSocket Connected successfully to', wsUrl);
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
        if (tick.code === 'XAUUSD' || appSymbol.includes('XAUUSD')) {
            console.log(`[AllTick] 📥 LIVE TICK: ${tick.code} -> ${appSymbol} @ ${tick.price}`);
        }
        const lastPrice = parseFloat(tick.price) || 0;
        
        let tickMs = parseInt(tick.tick_time);
        if (tickMs < 100000000000) tickMs *= 1000;

        const tickTime = tickMs ? new Date(tickMs) : new Date();

        if (!this.shouldAcceptTickPrice(appSymbol, lastPrice, tickMs)) {
          return;
        }
        
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

        const mid = (bid + ask) / 2;
        if (!this.shouldAcceptTickPrice(appSymbol, mid, tickTs || Date.now())) {
          return;
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
      const msg = {
        cmd_id: 22004, // Use 22004 for transaction quote subscription
        seq_id: this.seqId++,
        trace: uuidv4(),
        data: {
          symbol_list: alltickSymbols.map(s => ({
            code: s
          }))
        }
      };
      this.ws.send(JSON.stringify(msg));
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

    //Sanket v2.0 - Blacklist early-exit: if AllTick already returned code_invalid for this symbol
    // during this session, skip the API call entirely. This prevents the XAGUSD warmup spam where
    // 4 timeframe requests × multiple PM2 restarts stack up REST calls → 429 → WS disconnects.
    if (this.unsupportedSymbols.has(alltickSymbol)) {
      return { success: false, candles: [], error: 'code_invalid', source: 'blacklist' };
    }

    //Sanket v2.0 - Added 2h timeframe mapping (AllTick doesn't have native 2h, use 1h and double count)
    const timeframeMap = {
      '1m': 1, '5m': 2, '15m': 3, '30m': 4, '1h': 5, '2h': 5, '4h': 6, '1d': 7, '1w': 8, '1M': 9
    };
    const klineType = timeframeMap[timeframe] || 1;
    //Sanket v2.0 - For 2h: fetch double the 1h candles so we can aggregate them
    const adjustedLimit = timeframe === '2h' ? Math.min(limit * 2, 5000) : limit;

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
        query_kline_num: Math.min(adjustedLimit, 5000),
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

          //Sanket v2.0 - AllTick returns HTTP 600 for unsupported symbols (e.g. XAGUSD not on this plan)
          if (response.status === 600 || !response.ok) {
            const errBody = await response.text().catch(() => '');
            if (errBody.includes('code invalid') || response.status === 600) {
              console.warn(`[AllTick] ⚠️ Symbol not supported by AllTick: ${alltickSymbol} (HTTP ${response.status}, code invalid). Blacklisting for this session.`);
              //Sanket v2.0 - Blacklist: prevents repeated API calls for the same unsupported symbol,
              // which would stack up REST requests and trigger 429 → WS rate limit → real-time data lost.
              this.unsupportedSymbols.add(alltickSymbol);
              return { success: false, candles: [], error: 'code_invalid', source: 'api' };
            }
            throw new Error(`HTTP ${response.status}`);
          }
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
          
          let candles = result.data.kline_list.map(c => ({
            time: parseInt(c.timestamp) * 1000,
            open: parseFloat(c.open_price),
            high: parseFloat(c.high_price),
            low: parseFloat(c.low_price),
            close: parseFloat(c.close_price),
            volume: parseFloat(c.volume) || 0
          })).sort((a, b) => a.time - b.time);

          //Sanket v2.0 - Aggregate 1h candles into 2h candles since AllTick has no native 2h
          if (timeframe === '2h' && candles.length > 1) {
            const aggregated = [];
            for (let i = 0; i < candles.length; i += 2) {
              const c1 = candles[i];
              const c2 = candles[i + 1];
              if (c2) {
                aggregated.push({
                  time: c1.time,
                  open: c1.open,
                  high: Math.max(c1.high, c2.high),
                  low: Math.min(c1.low, c2.low),
                  close: c2.close,
                  volume: c1.volume + c2.volume
                });
              } else {
                aggregated.push(c1);
              }
            }
            candles = aggregated;
          }

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
      
      //Sanket v2.0 - Store prices with plain uppercase symbol (no .i suffix)
      const targetSymbol = String(symbol).toUpperCase().replace(/\.I$/i, '');
      //Sanket v2.0 - Add receivedAt so freshness check uses server receive time, not exchange tick time
      const payloadString = JSON.stringify({ ...data, symbol: targetSymbol, receivedAt: Date.now() });
      
      // 1. Store the newest price in Redis HSET (Strictly canonical .i only)
      await redisClient.hset('live_prices', targetSymbol, payloadString);
      
      // 2. Publish for real-time WebSocket broadcasting
      await redisClient.publish('price_updates', payloadString);
      
      // 3. Update local memory cache
      this.prices[targetSymbol] = data;
    } catch (err) {
      console.error('[Redis] Failed to set live price:', err.message);
    }
  }

  async getLivePrice(symbol) {
    try {
      if (!symbol) return null;
      const targetSymbol = String(symbol);
      const data = await redisClient.hget('live_prices', targetSymbol);
      
      if (data) return JSON.parse(data);
      
      // ✅ ELITE Fallback: Memory cache (v7.77 Resilience)
      if (this.prices[targetSymbol]) return this.prices[targetSymbol];
      
      return null;
    } catch (err) {
      console.error('[Redis] Failed to get live price:', err.message);
      return this.prices[symbol] || null;
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
    if (!symbol) return false;
    const s = String(symbol).toUpperCase();
    const base = s.replace(/\.I$/, '');
    const targetWithSuffix = `${base}.i`;
    
    // Check with .i, then base, then original
    return !!(this.symbolMap[targetWithSuffix] || this.symbolMap[base] || this.symbolMap[symbol] || this.symbolMap[symbol.toLowerCase()]);
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
    const cleanSymbol = String(symbol).toUpperCase();

    //Sanket v2.0 - Sync all cached intraday timeframes, not just 1m/5m. 2h skipped (aggregated from 1h client-side).
    const timeframes = [
      { tf: '1m', mins: 1 },
      { tf: '5m', mins: 5 },
      { tf: '15m', mins: 15 },
      { tf: '30m', mins: 30 },
      { tf: '1h', mins: 60 },
      { tf: '4h', mins: 240 }
    ];

    try {
      // Use a lock-free approach: just update the "live" keys
      for (const { tf, mins } of timeframes) {
        // Build the same cache key pattern used in prices.js
        //Sanket v2.0 - Fixed cache key to match prices.js format (end: not start:, requestLimit not hardcoded 1000)
        const cacheKey = `hist:${cleanSymbol}:${tf}:end:latest:1000:std`;
        const liveCacheKey = `hist:${cleanSymbol}:${tf}:end:latest:1000:live`;

        // We try both because the history route might have cached it with either
        const keys = [cacheKey, liveCacheKey];
        
        for (const key of keys) {
          const cached = await redisClient.get(key);
          if (cached) {
            const candles = JSON.parse(cached);
            if (candles.length > 0) {
              const updated = updateCandleListWithTick(candles, tick, mins, cleanSymbol);
              // Save back with short TTL (5 mins) as it's a live-updated cache
              await redisClient.set(key, JSON.stringify(updated), 'EX', 300);
            }
          }
        }
      }
    } catch (err) {
      // Silently fail tier sync to avoid crashing the main WS handler
    }
  }

}

export default new AllTickApiService();
