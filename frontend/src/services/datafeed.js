import { API_URL } from "../config/api";
import { normalizeSymbol } from "../utils/symbolUtils";
import priceStreamService from "./priceStream";
import { getPriceEvents } from "./eventSystem";
import { validateRealtimeBar } from "../utils/realtimeCandleBuilder";
import { sanitizeBatch, validateRealtimeUpdate } from "../utils/chartSanitizer";

/**
 * Custom Datafeed for TradingView Charting Library
 * Integrates with AllTick data through our optimized backend caching service.
 */

/* Event system used by TradingPage.jsx to receive live price updates */

const configurationData = {
  supported_resolutions: ["1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"]
};

// //sanket - Map TradingView resolution to backend timeframe format
const formatResolution = (res) => {
  const map = {
    '1': '1m', '5': '5m', '15': '15m', '30': '30m',
    '60': '1h', '120': '2h', '240': '4h', 'D': '1d', '1D': '1d', 'W': '1w', '1W': '1w', 'M': '1M', '1M': '1M'
  };
  return map[res] || res;
};

//Sanket v2.0 - Strip .i suffix before removing non-alphanumeric so XAUUSD.i and XAUUSD both normalize to XAUUSD
//Sanket v2.0 - Strip ALL suffixes and special chars for strict normalization
const normalizeRealtimeSymbol = (value = '') => {
  if (!value) return '';
  return String(value)
    .toUpperCase()
    .replace(/\.I$/i, '')
    .replace(/\.F$/i, '')
    .replace(/\.C$/i, '')
    .replace(/[^A-Z0-9]/g, '');
};

const toMs = (rawTime) => {
  let timeMs = rawTime;
  if (typeof timeMs === 'number' && timeMs < 10000000000) {
    timeMs = timeMs * 1000;
  } else if (typeof timeMs === 'string') {
    timeMs = new Date(timeMs).getTime();
  }
  return Number.isFinite(timeMs) ? timeMs : NaN;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const normalizeBars = (candles = [], symbol = '') => {
  if (!candles || candles.length === 0) return [];
  
  // 1. Basic formatting (timestamps and numbers)
  const rawBars = candles.map(c => ({
    time: toMs(c?.time),
    open: toNumber(c?.open),
    high: toNumber(c?.high),
    low: toNumber(c?.low),
    close: toNumber(c?.close),
    volume: Number.isFinite(Number(c?.volume)) ? Number(c.volume) : 0
  })).filter(b => Number.isFinite(b.time) && b.time > 0);

  // 2. Production Sanitization (Anti-Spike, OHLC correction, Sorting)
  return sanitizeBatch(rawBars, symbol);
};

const applyChartPriceModeToBar = (bar, symbol, adminSpreads, side = 'MID') => {
  if (!bar) return bar;

  // Keep historical bars raw for all chart modes. Applying retail markup at chart layer
  // causes drift versus execution prices, open-position mark prices, and header quotes.
  return bar;
};

const getChartExecutionPrice = (bid, ask, symbol, adminSpreads, side = 'MID') => {
  const numBid = Number(bid);
  const numAsk = Number(ask);

  if (side === 'BUY') {
    return numAsk;
  }

  if (side === 'SELL') {
    return numBid;
  }

  return (numBid + numAsk) / 2;
};

//Sanket v2.0 - All symbols without .i suffix
//Sanket v2.0 - Canonical Symbol Registry (Shared logic with Backend)
const SYMBOL_REGISTRY_FE = {
  'EURUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'GBPUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'USDJPY': { pricescale: 100,    session: '2200-2200:12345' },
  'USDCHF': { pricescale: 100000, session: '2200-2200:12345' },
  'AUDUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'NZDUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'USDCAD': { pricescale: 100000, session: '2200-2200:12345' },
  'XAUUSD': { pricescale: 100,    session: '2200-2200:12345' },
  'XAGUSD': { pricescale: 1000,   session: '2200-2200:12345' },
  'BTCUSD': { pricescale: 100,    session: '24x7' },
  'ETHUSD': { pricescale: 100,    session: '24x7' },
  'BNBUSD': { pricescale: 100,    session: '24x7' },
  'SOLUSD': { pricescale: 100,    session: '24x7' },
  'US30':   { pricescale: 10,     session: '2200-2200:12345' },
  'US500':  { pricescale: 100,    session: '2200-2200:12345' },
  'US100':  { pricescale: 10,     session: '2200-2200:12345' },
  'UK100':  { pricescale: 10,     session: '2200-2200:12345' },
};

const ALL_SYMBOLS = [
  // Forex
  { symbol: 'EURUSD', description: 'Euro / US Dollar', type: 'forex' },
  { symbol: 'GBPUSD', description: 'Great British Pound / US Dollar', type: 'forex' },
  { symbol: 'USDJPY', description: 'US Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'USDCHF', description: 'US Dollar / Swiss Franc', type: 'forex' },
  { symbol: 'AUDUSD', description: 'Australian Dollar / US Dollar', type: 'forex' },
  { symbol: 'NZDUSD', description: 'New Zealand Dollar / US Dollar', type: 'forex' },
  { symbol: 'USDCAD', description: 'US Dollar / Canadian Dollar', type: 'forex' },
  { symbol: 'EURGBP', description: 'Euro / Great British Pound', type: 'forex' },
  { symbol: 'EURJPY', description: 'Euro / Japanese Yen', type: 'forex' },
  { symbol: 'GBPJPY', description: 'Great British Pound / Japanese Yen', type: 'forex' },
  { symbol: 'EURAUD', description: 'Euro / Australian Dollar', type: 'forex' },
  { symbol: 'EURCAD', description: 'Euro / Canadian Dollar', type: 'forex' },
  { symbol: 'EURCHF', description: 'Euro / Swiss Franc', type: 'forex' },
  { symbol: 'AUDJPY', description: 'Australian Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'CADJPY', description: 'Canadian Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'CHFJPY', description: 'Swiss Franc / Japanese Yen', type: 'forex' },
  { symbol: 'GBPAUD', description: 'Great British Pound / Australian Dollar', type: 'forex' },
  { symbol: 'GBPCAD', description: 'Great British Pound / Canadian Dollar', type: 'forex' },
  { symbol: 'AUDCAD', description: 'Australian Dollar / Canadian Dollar', type: 'forex' },
  { symbol: 'NZDJPY', description: 'New Zealand Dollar / Japanese Yen', type: 'forex' },
  // Metals
  { symbol: 'XAUUSD', description: 'CFDs on Gold (US$ / OZ)', type: 'commodity' },
  { symbol: 'XAGUSD', description: 'CFDs on Silver (US$ / OZ)', type: 'commodity' },
  // Energy & Commodities
  { symbol: 'USOIL',  description: 'US Crude Oil (WTI)', type: 'commodity' },
  { symbol: 'UKOIL',  description: 'UK Brent Crude Oil', type: 'commodity' },
  { symbol: 'NGAS',   description: 'Natural Gas', type: 'commodity' },
  { symbol: 'COPPER', description: 'Copper', type: 'commodity' },
  // Indices
  { symbol: 'US30',  description: 'US Wall Street 30', type: 'index' },
  { symbol: 'US500', description: 'US S&P 500', type: 'index' },
  { symbol: 'US100', description: 'US NASDAQ 100', type: 'index' },
  { symbol: 'UK100', description: 'UK FTSE 100', type: 'index' },
  { symbol: 'ES35',  description: 'Spain 35', type: 'index' },
  // Crypto
  { symbol: 'BTCUSD', description: 'Bitcoin / US Dollar', type: 'crypto' },
  { symbol: 'ETHUSD', description: 'Ethereum / US Dollar', type: 'crypto' },
  { symbol: 'BNBUSD', description: 'Binance Coin / US Dollar', type: 'crypto' },
  { symbol: 'SOLUSD', description: 'Solana / US Dollar', type: 'crypto' },
];

const Datafeed = {
  interval: null,
  _adminSpreads: {},
  _chartPriceSide: 'MID',

  setAdminSpreads: (spreads) => {
    Datafeed._adminSpreads = spreads || {};
    console.log('[DATAFEED] Admin spreads updated', Object.keys(Datafeed._adminSpreads).length);
  },

  setChartPriceSide: (side) => {
    Datafeed._chartPriceSide = side === 'BUY' || side === 'SELL' ? side : 'MID';
  },

  onReady: (callback) => {
    setTimeout(() => callback(configurationData));
  },

  // 🛡️ v7.52 Sync with server time to ensure candle countdown is accurate
  getServerTime: (callback) => {
    fetch(`${API_URL}/prices/time`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.time) {
          callback(json.time);
        }
      })
      .catch(() => { /* Fallback to local time if API fails */ });
  },

  // Required by TradingView — powers the built-in symbol search dialog
  searchSymbols: (userInput, _exchange, _symbolType, onResult) => {
    const query = (userInput || '').toUpperCase();
    const results = ALL_SYMBOLS
      .filter(s => s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query))
      .map(s => ({
        symbol: s.symbol,
        full_name: s.symbol,
        description: s.description,
        exchange: 'AllTick',
        type: s.type,
        ticker: s.symbol,
      }));
    onResult(results);
  },

  //Sanket v2.0 - Added try/catch + onResolveErrorCallback so chart doesn't hang on bad symbols
  resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
    try {
      // v7.77 Strict Normalization using Registry
      const cleanName = normalizeRealtimeSymbol(symbolName);
      const meta = SYMBOL_REGISTRY_FE[cleanName] || {};
      
      const pricescale = meta.pricescale || 100000;
      const session = meta.session || '24x7';
      
      const symbolItem = ALL_SYMBOLS.find(s => s.symbol === cleanName);
      
      const symbolInfo = {
        name: symbolName,
        ticker: symbolName,
        description: symbolItem ? symbolItem.description : symbolName,
        type: symbolItem ? symbolItem.type : 'forex',
        session: session, // ✅ THE FIX: Native session support
        timezone: 'Etc/UTC',
        exchange: 'AllTick',
        minmov: 1,
        pricescale: pricescale,
        has_intraday: true,
        intraday_multipliers: ['1', '5', '15', '30', '60', '120', '240'],
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 2,
        data_status: 'streaming'
      };
      console.log(`[v7.77] resolveSymbol: ${symbolName} using session ${session} and pricescale ${pricescale}`);
      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    } catch (err) {
      console.error(`[DATAFEED] resolveSymbol failed for ${symbolName}:`, err.message);
      if (onResolveErrorCallback) {
        onResolveErrorCallback(`Failed to resolve symbol: ${symbolName}`);
      }
    }
  },

  /**
   * //sanket - Fetch historical candles from our backend cache
   * CRITICAL: Returns bars with time in UNIX MILLISECONDS (TradingView requirement)
   */
  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    try {
      const { from, to, countBack, firstDataRequest } = periodParams;
      const timeframe = formatResolution(resolution);
      const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
      const intradayTimeframes = new Set(['1m', '5m', '15m', '30m', '1h', '2h', '4h']);
      const useLiveCache = firstDataRequest && intradayTimeframes.has(timeframe);
      
      // Ensure minimum 500 candles for proper chart display
      const limit = Math.max(countBack || 300, 500);
      const params = new URLSearchParams();
      params.set('symbol', symbolInfo.name);
      params.set('resolution', timeframe);
      if (Number.isFinite(from)) params.set('from', String(from));
      if (Number.isFinite(to)) params.set('to', String(to));
      params.set('limit', String(limit));
      if (useLiveCache) params.set('preferLive', '1');
      params.set('v', '3'); // 🔥 THE FIX: Bust Browser HTTP Cache so TradingView pulls the newly pruned payload
      const url = `${API_URL}/prices/history?${params.toString()}`;
      
      console.log(`[DATAFEED] getBars: ${symbolInfo.name} (${resolution}→${timeframe}) from=${from} to=${to} limit=${limit}`);
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[DATAFEED] ❌ getBars HTTP ${res.status} for ${symbolInfo.name}`);
        // CRITICAL: Call onError instead of onHistory([], {noData: true})
        // This prevents TradingView from permanently marking this timeframe as "EMPTY"
        // if we are just experiencing a temporary 429 rate limit.
        onErrorCallback(`HTTP ${res.status}`);
        return;
      }

      const result = await res.json();
      const candleCount = result.candles?.length || 0;
      console.log(`[DATAFEED] ✓ getBars received ${candleCount} candles for ${symbolInfo.name}`);

      let bars = [];
      if (result.success && result.candles && result.candles.length > 0) {
        // Apply Retail Lens Markup to historical bars
        const rawBars = normalizeBars(result.candles, symbolInfo.name);
        bars = rawBars.map(bar => applyChartPriceModeToBar(bar, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide));
      }

      if (bars.length === 0) {
          console.log(`[DATAFEED] ⚠️ No valid bars for ${symbolInfo.name}. Returning noData.`);
          onHistoryCallback([], { noData: true });
      } else {
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          //Sanket v2.0 - Only update if this batch is more recent. Backward pagination batches
          // arrive AFTER the first (most-recent) batch and would overwrite _lastHistoryBars with
          // stale old bars. subscribeBars seeds lastPushedBarTime from this value, so if it's
          // stale, bootstrapLiveBar and handleCandleUpdate can push bars older than TV's last
          // getBars bar, causing putToCacheNewBar time violations on 1W/1D/higher timeframes.
          const candidateBar = bars[bars.length - 1];
          if (!Datafeed._lastHistoryBars[historyKey] || candidateBar.time > Datafeed._lastHistoryBars[historyKey].time) {
            Datafeed._lastHistoryBars[historyKey] = { ...candidateBar };
          }
          console.log(`[DATAFEED] ✅ Returning ${bars.length} bars with valid timestamps`);
          onHistoryCallback(bars, { noData: false });
      }
    } catch (err) {
      console.error("[DATAFEED] ❌ getBars Exception:", err.message);
      onErrorCallback(err);
    }
  },

  /**
   * //sanket - Real-time price streaming via Event-driven updates
   * CRITICAL: Must convert timestamps to UNIX MILLISECONDS for TradingView
   * Logic: Listens to priceUpdate events and creates proper OHLC candle updates
   */
  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID) => {
    let resolutionMinutes = 1;
    if (resolution === '1M' || resolution === 'M') {
      resolutionMinutes = 30 * 24 * 60;
    } else if (resolution === '1W' || resolution === 'W') {
      resolutionMinutes = 7 * 24 * 60;
    } else if (resolution === '1D' || resolution === 'D') {
      resolutionMinutes = 24 * 60;
    } else if (resolution === '4h' || resolution === '240') {
      resolutionMinutes = 4 * 60;
    } else if (resolution === '2h' || resolution === '120') {
      resolutionMinutes = 2 * 60;
    } else if (resolution === '1h' || resolution === '60') {
      resolutionMinutes = 60;
    } else {
      resolutionMinutes = parseInt(resolution) || 1;
    }
    
    const resolutionMs = resolutionMinutes * 60 * 1000;
    const timeframe = formatResolution(resolution);
    const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
    
    let lastBarTime = null;
    let currentBar = null;
    let lastUpdateTime = 0;
    let tickCount = 0;
    let lastTickTime = 0;
    const throttleMs = 50;
    let isActive = true;

    const seededBar = Datafeed._lastHistoryBars?.[historyKey];
    if (seededBar && Number.isFinite(seededBar.time)) {
      currentBar = { ...seededBar };
      lastBarTime = seededBar.time;
      lastUpdateTime = Date.now();
    }

    let lastPushedBarTime = seededBar ? seededBar.time : -Infinity;
    const pushBar = (bar) => {
      if (!bar || !Number.isFinite(bar.time)) return;
      if (bar.time < lastPushedBarTime) return;
      lastPushedBarTime = bar.time;
      onRealtimeCallback(bar);
      try {
        getPriceEvents().dispatchEvent(new CustomEvent('chartBarUpdate', {
          detail: {
            symbol: symbolInfo.name,
            close: bar.close,
            time: bar.time,
            side: Datafeed._chartPriceSide
          }
        }));
      } catch {}
    };

    const bootstrapLiveBar = async () => {
      try {
        const params = new URLSearchParams();
        params.set('symbol', symbolInfo.name);
        params.set('resolution', timeframe);
        params.set('limit', '30');
        params.set('preferLive', '1');

        const response = await fetch(`${API_URL}/prices/history?${params.toString()}`);
        if (!response.ok || !isActive) return;

        const payload = await response.json();
        if (!isActive) return;

        const bars = normalizeBars(payload?.candles || [], symbolInfo.name);
        if (bars.length === 0) return;

        const latest = bars[bars.length - 1];
        const currentBucket = Math.floor(Date.now() / resolutionMs) * resolutionMs;

        if (latest.time === currentBucket) {
          currentBar = applyChartPriceModeToBar(latest, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
          lastBarTime = latest.time;
          lastUpdateTime = Date.now();
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
          pushBar(currentBar);
          return;
        }

        if (lastBarTime === null) {
          currentBar = applyChartPriceModeToBar(latest, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
          lastBarTime = latest.time;
          lastUpdateTime = Date.now();
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
        }
      } catch (error) {}
    };

    bootstrapLiveBar();
    
    priceStreamService.subscribeBars(symbolInfo.name);
    
    const normalizedSym = normalizeRealtimeSymbol(symbolInfo.name);
    const existingPriority = Array.isArray(priceStreamService.prioritySymbols) ? priceStreamService.prioritySymbols : [];
    if (!existingPriority.includes(normalizedSym)) {
      priceStreamService.setPrioritySymbols([...existingPriority, normalizedSym]);
    }

    // ✅ Monitor for data gaps
    const dataGapMonitor = setInterval(() => {
      const now = Date.now();
      if (lastTickTime > 0) {
        const timeSinceLastTick = now - lastTickTime;
        if (timeSinceLastTick > 15000) {
          console.warn(`[DATAFEED] ⚠️ DATA GAP for ${symbolInfo.name} for ${(timeSinceLastTick/1000).toFixed(1)}s`);
        }
      }
    }, 10000);

    const handleCandleUpdate = (e) => {
      const { symbol, timeframe: incomingTimeframe, candle } = e.detail;
      if (normalizeRealtimeSymbol(symbol) !== normalizedSym) return;
      if (incomingTimeframe !== timeframe) return;

      const bar = {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      };
      
      const validatedBar = validateRealtimeBar({
        symbol: symbolInfo.name,
        bar,
        previousBar: currentBar
      });
      if (!validatedBar.accepted) return;
      if (currentBar !== null && validatedBar.bar.time < lastBarTime) return;

      const authoritativeBar = applyChartPriceModeToBar(validatedBar.bar, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);

      currentBar = { ...authoritativeBar };
      lastBarTime = validatedBar.bar.time;
      lastUpdateTime = Date.now();

      Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
      const existing = Datafeed._lastHistoryBars[historyKey];
      if (!existing || validatedBar.bar.time >= existing.time) {
        Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
      }

      pushBar(currentBar);
    };
    
    const handlePriceUpdate = (e) => {
      tickCount++;
      if (!isActive) return;
      const { symbol, bid, ask, time } = e.detail;
      lastTickTime = Date.now();
      
      if (normalizeRealtimeSymbol(symbol) !== normalizedSym) return;

      const now = Date.now();
      if ((now - lastUpdateTime) < throttleMs) return;
      lastUpdateTime = now;

      const price = getChartExecutionPrice(bid, ask, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
      if (!isFinite(price) || price <= 0) return;

      // 🏆 PRODUCTION SANITIZATION: Validate live update
      if (currentBar) {
        const result = validateRealtimeUpdate({
          currentBar, 
          nextPrice: price, 
          symbol: symbolInfo.name
        });
        
        if (!result.accepted) return; // Drop spikes
        
        currentBar = result.bar;
        pushBar(currentBar);
      }
    };

    Datafeed._subscribers = Datafeed._subscribers || {};
    Datafeed._subscribers[subscriberUID] = {
      priceUpdate: handlePriceUpdate,
      candleUpdate: handleCandleUpdate,
      symbol: symbolInfo.name,
      dataGapMonitor
    };

    getPriceEvents().addEventListener("candleUpdate", handleCandleUpdate);
    getPriceEvents().addEventListener("priceUpdate", handlePriceUpdate);
    
    return function cleanup() {
      isActive = false;
      clearInterval(dataGapMonitor);
      priceStreamService.unsubscribeBars(symbolInfo.name);
      getPriceEvents().removeEventListener("candleUpdate", handleCandleUpdate);
      getPriceEvents().removeEventListener("priceUpdate", handlePriceUpdate);
      delete Datafeed._subscribers[subscriberUID];
      
      const remainingPriority = (priceStreamService.prioritySymbols || []).filter(s => s !== normalizedSym);
      priceStreamService.setPrioritySymbols(remainingPriority);
    };
  },

  unsubscribeBars: (subscriberUID) => {
    const sub = Datafeed._subscribers && Datafeed._subscribers[subscriberUID];
    if (sub) {
      getPriceEvents().removeEventListener("priceUpdate", sub.priceUpdate);
      getPriceEvents().removeEventListener("candleUpdate", sub.candleUpdate);
      if (sub.dataGapMonitor) clearInterval(sub.dataGapMonitor);
      if (sub.heartbeatTimer) clearInterval(sub.heartbeatTimer);
      if (sub.symbol) priceStreamService.unsubscribeBars(sub.symbol);
      delete Datafeed._subscribers[subscriberUID];
    }
  }
};

export default Datafeed;