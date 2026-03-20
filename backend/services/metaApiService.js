import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const MetaApi = require('metaapi.cloud-sdk').default;
import fetch from 'node-fetch';

// Environment Variables
const METAAPI_TOKEN = () => process.env.METAAPI_TOKEN;
const METAAPI_ACCOUNT_ID = () => process.env.METAAPI_ACCOUNT_ID;
const METAAPI_REGION = () => process.env.METAAPI_REGION || 'new-york';
const METAAPI_BASE_URL = () => `https://mt-market-data-client-api-v1.${METAAPI_REGION()}.agiliumtrade.ai`;

const toKey = (symbol = '') => {
  if (!symbol) return '';
  return symbol.toUpperCase().split('.')[0].replace(/[^A-Z0-9]/g, '');
};

class MetaApiService {
  constructor() {
    this.subscribers = new Set();
    this.isConnected = false;
    this.accountSymbols = new Set();
    this.requestToActualMap = new Map();
    this.actualToRequestsMap = new Map();
    this.subscribedSymbols = new Set();
    this.prices = {};
    // Core working symbols (defaults)
    this.workingSymbols = ['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'ETHUSD'];
  }

  async connect() {
    console.log('[MetaAPI] connect() called');
    if (this.isConnected) {
      console.log('[MetaAPI] Already connected');
      return;
    }
    const token = METAAPI_TOKEN();
    const accountId = METAAPI_ACCOUNT_ID();
    
    if (!token || !accountId) {
      console.error('[MetaAPI] Missing credentials in .env');
      return;
    }

    try {
      console.log('[MetaAPI] Initializing MetaApi instance...');
      this.metaApi = new MetaApi(token);
      
      console.log(`[MetaAPI] Fetching account ${accountId}...`);
      this.account = await this.metaApi.metatraderAccountApi.getAccount(accountId);
      
      console.log(`[MetaAPI] Waiting for account connection...`);
      await this.account.waitConnected();
      this.isConnected = true;
      console.log('[MetaAPI] Connected successfully to MetaTrader');
      
      // Setup real-time price stream
      console.log('[MetaAPI] Getting streaming connection...');
      this.connection = await this.account.getStreamingConnection();
      
      console.log('[MetaAPI] Connecting stream...');
      await this.connection.connect();
      
      console.log('[MetaAPI] Waiting for synchronization...');
      await this.connection.waitSynchronized();

      // Sync symbols AFTER connection is established
      await this.syncSymbolsFromAccount();
      
      this.connection.addSynchronizationListener({
        onSymbolPricesUpdated: (instanceIndex, prices) => {
          console.log(`[MetaAPI] TRACE: onSymbolPricesUpdated triggered for ${prices?.length || 0} symbols`);
          if (Array.isArray(prices)) {
            prices.forEach(p => {
              if (p && p.symbol && typeof p.bid !== 'undefined') {
                this.updatePrice(p.symbol, p);
              }
            });
          }
        },
        onSymbolPriceUpdated: (instanceIndex, symbol, price) => {
          // Fallback for older versions or different streams
          if (symbol && price && typeof price.bid !== 'undefined') {
            this.updatePrice(symbol, price);
          }
        },
        onCandlesUpdated: (instanceIndex, candles) => {
          // console.log(`[MetaAPI] Candles updated: ${candles?.length || 0}`);
        },
        onSynchronizationStarted: () => {
          console.log('[MetaAPI] Synchronization started');
        },
        onSymbolSynchronizationFinished: (instanceIndex, symbol) => {
          // console.log(`[MetaAPI] Synchronization finished for ${symbol}`);
        },
        onSymbolSpecificationUpdated: (instanceIndex, symbol, specification) => {
          // console.log(`[MetaAPI] Specification updated for ${symbol}`);
        },
        onAccountInformationUpdated: (instanceIndex, accountInformation) => {
          // console.log(`[MetaAPI] Account info updated: ${accountInformation?.balance}`);
        },
        onPositionsUpdated: (instanceIndex, positions) => {
          // console.log(`[MetaAPI] Positions updated: ${positions?.length}`);
        },
        onOrdersUpdated: (instanceIndex, orders) => {
          // console.log(`[MetaAPI] Orders updated: ${orders?.length}`);
        },
        onPendingOrdersUpdated: (instanceIndex, pendingOrders) => {
          // console.log(`[MetaAPI] Pending orders updated: ${pendingOrders?.length}`);
        },
        onExecutionUpdated: (instanceIndex, execution) => {
          // console.log(`[MetaAPI] Execution updated`);
        },
        onHealthStatus: (instanceIndex, healthStatus) => {
          // console.log(`[MetaAPI] Health status: ${JSON.stringify(healthStatus)}`);
        }
      });
      
      console.log('[MetaAPI] Real-time price stream active and synchronized');
    } catch (err) {
      console.error('[MetaAPI] Connection process failed:', err);
      this.isConnected = false;
    }
  }

  async syncSymbolsFromAccount() {
    try {
      const accountId = METAAPI_ACCOUNT_ID();
      const token = METAAPI_TOKEN();
      const region = METAAPI_REGION();
      
      const fetchSymbols = (url) => {
        return new Promise((resolve, reject) => {
          const https = require('https');
          const options = { headers: { 'auth-token': token }, timeout: 10000 };
          https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode === 200) {
                try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
              } else { reject(new Error(`HTTP ${res.statusCode}: ${data}`)); }
            });
          }).on('error', reject);
        });
      };

      // Try generic and regional endpoints
      const urls = [
        `https://mt-client-api-v1.agiliumtrade.ai/users/current/accounts/${accountId}/symbols`,
        `https://mt-client-api-v1.${region}.agiliumtrade.ai/users/current/accounts/${accountId}/symbols`
      ];

      let symbolsData = null;
      for (const url of urls) {
        try {
          console.log(`[MetaAPI] SYNC: Fetching symbols via ${url}`);
          symbolsData = await fetchSymbols(url);
          if (symbolsData) break;
        } catch (e) {
          console.error(`[MetaAPI] SYNC: Failed ${url}: ${e.message}`);
        }
      }

      const symbols = Array.isArray(symbolsData) ? symbolsData.map(s => s.symbol || s) : [];
      if (symbols.length > 0) {
        this.accountSymbols = new Set(symbols);
        console.log(`[MetaAPI] SYNC: Successfully synced ${this.accountSymbols.size} symbols`);
        this.buildSymbolMappings();
      } else {
        throw new Error("No symbols returned from any endpoint");
      }
    } catch (err) {
      console.error('[MetaAPI] SYNC: Exception:', err.message);
      if (this.accountSymbols.size === 0) {
        this.accountSymbols = new Set(this.workingSymbols);
        this.buildSymbolMappings();
      }
    }
  }

  buildSymbolMappings() {
    console.log(`[MetaAPI] MAPPING: Building mappings for ${this.accountSymbols.size} symbols`);
    this.requestToActualMap.clear();
    this.actualToRequestsMap.clear();

    // Standard and synonym mappings
    const mappings = [
      { from: 'XAUUSD.i', to: 'XAUUSD.i' },
      { from: 'GOLD.i', to: 'XAUUSD.i' },
      { from: 'BTCUSD.i', to: 'BTCUSD.i' },
      { from: 'ETHUSD.i', to: 'XETUSD.i' },
      { from: 'LTCUSD.i', to: 'XLCUSD.i' },
      { from: 'DOGEUSD.i', to: 'DOGUSD.i' },
      { from: 'EURUSD.i', to: 'EURUSD.i' },
      { from: 'GBPUSD.i', to: 'GBPUSD.i' },
      { from: 'USOIL.i', to: 'USOUSD.i' },
      { from: 'UKOIL.i', to: 'UKOUSD.i' },
      { from: 'NGAS.i', to: 'NG.i' },
      { from: 'US500.i', to: 'SPX500.i' },
      { from: 'US100.i', to: 'NAS100.i' },
      { from: 'HK50.i', to: 'HK50ft.i' },
      { from: 'UK100.i', to: 'UK100ft.i' }
    ];

    mappings.forEach(({ from, to }) => {
      // If 'to' itself exists in the account, map it
      if (this.accountSymbols.has(to)) {
        this.requestToActualMap.set(from, to);
        if (!this.actualToRequestsMap.has(to)) this.actualToRequestsMap.set(to, new Set());
        this.actualToRequestsMap.get(to).add(from);
        if (from !== to) console.log(`[MetaAPI] MAPPING: ${from} -> ${to} (Manual)`);
        return;
      }
      
      // Fallback for symbols that might not have the .i in 'to'
      const actual = this.resolveSymbolForAccount(to);
      if (actual && this.accountSymbols.has(actual)) {
        this.requestToActualMap.set(from, actual);
        if (!this.actualToRequestsMap.has(actual)) this.actualToRequestsMap.set(actual, new Set());
        this.actualToRequestsMap.get(actual).add(from);
        if (from !== actual) console.log(`[MetaAPI] MAPPING: ${from} -> ${actual} (Auto)`);
      }
    });

    // Dynamic mapping for all other symbols
    for (const actual of this.accountSymbols) {
      const key = toKey(actual);
      if (key && !this.actualToRequestsMap.has(actual)) {
        // Map the base symbol (e.g., EURUSD) to the actual (e.g., EURUSD.i)
        if (!this.requestToActualMap.has(key)) {
          this.requestToActualMap.set(key, actual);
        }
        // Also ensure the actual maps to itself
        if (!this.requestToActualMap.has(actual)) {
          this.requestToActualMap.set(actual, actual);
        }
      }
    }

    // Auto-subscribe to symbols
    if (this.connection) {
      const coreMajors = [
        'EURUSD.i', 'GBPUSD.i', 'USDJPY.i', 'USDCHF.i', 'AUDUSD.i', 'NZDUSD.i', 'USDCAD.i', 'XAUUSD.i', 'BTCUSD.i',
        'EURGBP.i', 'EURJPY.i', 'GBPJPY.i', 'EURAUD.i', 'EURCAD.i', 'EURCHF.i', 'AUDJPY.i', 'CADJPY.i', 'CHFJPY.i',
        'AUDNZD.i', 'AUDCAD.i', 'CADCHF.i', 'NZDJPY.i', 'GBPAUD.i', 'GBPCAD.i', 'GBPCHF.i', 'GBPNZD.i', 'AUDCHF.i',
        'NZDCAD.i', 'NZDCHF.i', 'EURNZD.i', 'XAGUSD.i',
        'XETUSD.i', 'XLCUSD.i', 'DOGUSD.i', 'SOLUSD.i', 'USOUSD.i', 'UKOUSD.i', 'NG.i', 'SPX500.i', 'NAS100.i', 'HK50ft.i', 'UK100ft.i'
      ];
      
      console.log(`[MetaAPI] MAPPING: Built ${this.requestToActualMap.size} mappings. Subscribing to core instruments...`);
      
      // Subscribe to core instruments immediately
      coreMajors.forEach(sym => {
        if (this.accountSymbols.has(sym)) {
          this.subscribeToSymbol(sym);
        }
      });

      // Staggered subscription for EVERYTHING ELSE in the account mapping
      // to ensure all possible UI symbols have prices eventually
      const otherActuals = Array.from(this.requestToActualMap.values())
        .filter(sym => !coreMajors.includes(sym));
      
      console.log(`[MetaAPI] SYNC: Scheduling staggered subscription for ${otherActuals.length} other symbols`);
      otherActuals.forEach((sym, index) => {
        // Subscribe 2 per second to avoid bridge bombardment
        setTimeout(() => {
          if (this.connection) this.subscribeToSymbol(sym);
        }, 500 * index);
      });
    }
  }

  // Robust subscription helper
  subscribeToSymbol(actual) {
    if (!this.connection || !actual || this.subscribedSymbols.has(actual)) return;
    
    this.subscribedSymbols.add(actual);
    // console.log(`[MetaAPI] Subscribing to ${actual}...`);
    
    // Use the correct MT5 subscription method
    this.connection.subscribeToMarketData(actual, [
      { type: 'quotes', intervalInMilliseconds: 0 }
    ]).catch(err => {
      this.subscribedSymbols.delete(actual);
      console.error(`[MetaAPI] Subscription error for ${actual}:`, err.message);
    });
  }

  resolveSymbolForAccount(symbol) {
    if (!symbol) return symbol;
    
    // 1. Check existing map
    if (this.requestToActualMap.has(symbol)) {
      return this.requestToActualMap.get(symbol);
    }
    
    // 2. Exact match in account
    if (this.accountSymbols.has(symbol)) return symbol;
    
    // 3. Try common suffixes
    const suffixes = ['.i', '.pro', '.m', '.n', '.t', '.k', '.eb', '.c'];
    for (const s of suffixes) {
      if (this.accountSymbols.has(symbol + s)) return symbol + s;
    }
    
    // 4. Try without suffix if it has one
    const base = symbol.split('.')[0];
    if (this.accountSymbols.has(base)) return base;
    
    return symbol;
  }

  updatePrice(symbol, priceData) {
    if (!priceData || typeof priceData.bid === 'undefined') {
      console.log(`[MetaAPI] TRACE: updatePrice skipped for ${symbol} (missing bid)`);
      return;
    }

    // Store price for requested symbols
    const requestedSymbols = this.actualToRequestsMap.get(symbol) || new Set([symbol]);
    requestedSymbols.forEach(reqSym => {
      this.prices[reqSym] = {
        symbol: reqSym,
        bid: priceData.bid,
        ask: priceData.ask,
        time: priceData.time || new Date(),
        provider: 'metaapi'
      };
      
      // Log mapping every ~100 prices per symbol to keep logs readable but verifiable
      if (Math.random() < 0.01) {
        console.log(`[MetaAPI] TRACE: price logic ${symbol} -> ${reqSym}: ${priceData.bid}`);
      }
      
      this.notifySubscribers(reqSym, this.prices[reqSym]);
    });
  }

  getPrice(symbol) {
    return this.prices[symbol] || null;
  }

  async getHistoricalCandles(symbol, timeframe = '1m', startTime, endTime, limit = 500) {
    console.log(`[MetaAPI] getHistoricalCandles called for ${symbol} (${timeframe}) | start: ${startTime} | end: ${endTime} | limit: ${limit}`);
    const accountId = METAAPI_ACCOUNT_ID();
    const token = METAAPI_TOKEN();
    if (!accountId || !token) return [];

    const resolvedSymbol = this.resolveSymbolForAccount(symbol);
    
    // Improved timeframe mapping for MetaAPI
    const timeframeMap = {
      '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m', 
      '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w', 
      '1M': '1mn'
    };
    const metaTimeframe = timeframeMap[timeframe] || timeframe;
    
    // Formatting timestamps to ISO 8601 as required by MetaAPI Market Data API
    const startIso = startTime ? new Date(parseInt(startTime) * 1000).toISOString() : null;
    const endIso = endTime ? new Date(parseInt(endTime) * 1000).toISOString() : null;

    const baseUrl = METAAPI_BASE_URL();
    let url = `${baseUrl}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(resolvedSymbol)}/timeframes/${metaTimeframe}/candles?limit=${limit}`;
    
    if (startIso) url += `&startTime=${encodeURIComponent(startIso)}`;
    if (endIso) url += `&endTime=${encodeURIComponent(endIso)}`;
    
    console.log(`[MetaAPI] History Request: ${symbol} -> ${resolvedSymbol} | TF: ${metaTimeframe} | URL: ${url}`);

    try {
      const response = await fetch(url, { headers: { 'auth-token': token } });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[MetaAPI] History Failure: ${symbol} (${resolvedSymbol}) | HTTP ${response.status} | ${errorText}`);
        return [];
      }

      let data = await response.json();
      
      // Intelligent Fallback: If we got very few candles and had a startTime constraint,
      // retry without startTime to get sufficient history for the chart.
      // (Increased threshold to 100 for better chart coverage)
      if ((!data || data.length < 100) && limit >= 300 && startTime) {
        console.log(`[MetaAPI] History sparse for ${symbol} (${data?.length || 0} candles), retrying without startTime bound...`);
        const fallbackUrl = `${baseUrl}/users/current/accounts/${accountId}/historical-market-data/symbols/${encodeURIComponent(resolvedSymbol)}/timeframes/${metaTimeframe}/candles?limit=${limit}${endIso ? `&endTime=${encodeURIComponent(endIso)}` : ''}`;
        
        try {
          const fallbackResponse = await fetch(fallbackUrl, { headers: { 'auth-token': token } });
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && fallbackData.length > (data?.length || 0)) {
              console.log(`[MetaAPI] History fallback successful for ${symbol}: ${fallbackData.length} candles`);
              data = fallbackData;
            }
          }
        } catch (fallbackErr) {
          console.warn(`[MetaAPI] History fallback failed for ${symbol}:`, fallbackErr.message);
        }
      }

      return (data || []).map(c => ({
        time: Math.floor(new Date(c.time).getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume || c.volume || 0
      })).sort((a, b) => a.time - b.time);
    } catch (err) {
      console.error(`[MetaAPI] History Exception for ${symbol}:`, err.message);
      return [];
    }
  }

  addSubscriber(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(symbol, price) {
    this.subscribers.forEach(callback => callback(symbol, price));
  }

  isSymbolSupported(symbol) {
    return true; // We'll resolve on the fly
  }

  getSupportedSymbols() {
    return Array.from(this.accountSymbols).length > 0 
      ? Array.from(this.accountSymbols) 
      : this.workingSymbols;
  }

  setPrioritySymbols(symbols) {
    // Basic implementation: update working symbols if needed
    // or just return the input to satisfy the caller
    console.log(`[MetaAPI] Setting priority symbols: ${symbols.join(', ')}`);
    return symbols;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      latency: 0,
      timestamp: Date.now()
    };
  }

  getSymbolInfo(symbol) {
    // Return reasonable defaults for MetaTrader symbols
    return {
      symbol: symbol,
      description: symbol,
      digits: symbol.includes('JPY') || symbol.includes('XAU') ? 3 : 5,
      minLot: 0.01,
      maxLot: 100,
      lotStep: 0.01,
      type: 'forex'
    };
  }

  async disconnect() {
    console.log('[MetaAPI] Disconnecting...');
    try {
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log('[MetaAPI] Disconnected');
    } catch (err) {
      console.error('[MetaAPI] Disconnect error:', err.message);
    }
  }

  // Added missing methods to prevent crashes
  getAllPrices() {
    return this.prices || {};
  }

  getPricesByCategory() {
    // Basic implementation: group by first 3 letters or similar
    // For now, return a single 'All' category or empty object to satisfy the handler
    const categorized = { 'All': {} };
    Object.entries(this.prices).forEach(([symbol, data]) => {
      categorized['All'][symbol] = data;
    });
    return categorized;
  }

  getHeaders() {
    return { 'auth-token': METAAPI_TOKEN(), 'Content-Type': 'application/json' };
  }
}

export default new MetaApiService();
