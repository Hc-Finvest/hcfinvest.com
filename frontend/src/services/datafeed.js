import { API_URL } from "../config/api";
import priceStreamService from "./priceStream";
import { wrapOHLC } from "../utils/priceUtils";
import { normalizeSymbol } from "../utils/symbolUtils";

/**
 * Custom Datafeed for TradingView Charting Library
 * Integrates with AllTick data through our optimized backend caching service.
 */

/* Event system used by TradingPage.jsx to receive live price updates */
const priceEventTarget = new EventTarget();
export const getPriceEvents = () => priceEventTarget;

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
const normalizeRealtimeSymbol = (value = '') => value.toUpperCase().replace(/\.I$/i, '').replace(/[^A-Z0-9]/g, '');

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

const normalizeBars = (candles = []) => {
  const barsByTime = new Map();

  candles.forEach((c) => {
    const time = toMs(c?.time);
    const open = toNumber(c?.open);
    const high = toNumber(c?.high);
    const low = toNumber(c?.low);
    const close = toNumber(c?.close);
    const volume = Number.isFinite(Number(c?.volume)) ? Number(c.volume) : 0;

    if (!Number.isFinite(time) || time <= 0) return;
    if (![open, high, low, close].every(Number.isFinite)) return;

    const fixedHigh = Math.max(high, open, close, low);
    const fixedLow = Math.min(low, open, close, high);

    barsByTime.set(time, {
      time,
      open,
      high: fixedHigh,
      low: fixedLow,
      close,
      volume
    });
  });

  return [...barsByTime.values()].sort((a, b) => a.time - b.time);
};

//Sanket v2.0 - All symbols without .i suffix
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
  // Energy & Commodities (Sanket v2.0 - AllTick-confirmed codes)
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
];

const Datafeed = {
  interval: null,
  _adminSpreads: {},

  setAdminSpreads: (spreads) => {
    Datafeed._adminSpreads = spreads || {};
    console.log('[DATAFEED] Admin spreads updated', Object.keys(Datafeed._adminSpreads).length);
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
      // v7.77 Strict Normalization
      const normalizedName = normalizeSymbol(symbolName);
      
      // Determine pricescale based on actual asset type and precision requirements
      let pricescale = 100000; // Default 5 decimals (Forex)
      const s = normalizedName.toUpperCase();
      
      if (s.includes("US30") || s.includes("US100") || s.includes("UK100") || s.includes("GER40") || s.includes("FRA40") || s.includes("SPA35") || s.includes("ES35")) {
        pricescale = 10; // 1 decimal (e.g., 18000.5)
      } else if (s.includes("US500") || s.includes("XAU") || s.includes("BTC") || s.includes("ETH") || s.includes("BNB") || s.includes("SOL") || s.includes("LTC")) {
        pricescale = 100; // 2 decimals (e.g., 2150.50, 65000.00)
      } else if (s.includes("JPY") || s.includes("XAG") || s.includes("NGAS") || s.includes("OIL") || s.includes("COPPER")) {
        pricescale = 1000; // 3 decimals (e.g., 150.123, 30.550)
      } else if (s.includes("XRP") || s.includes("ADA") || s.includes("DOGE")) {
        pricescale = 100000; // 5 decimals (Crypto micros)
      }

      //Sanket v2.0 - Use 24x7 for all instruments so TradingView never drops candles
      // AllTick only delivers data during actual market hours, so no fake weekend candles
      const symbolInfo = {
        name: normalizedName,
        ticker: normalizedName,
        description: normalizedName,
        type: "forex",
        session: "24x7",
        timezone: "Etc/UTC",
        exchange: "AllTick",
        minmov: 1,
        pricescale: pricescale,
        has_intraday: true,
        intraday_multipliers: ['1', '5', '15', '30', '60', '120', '240'],
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 2,
        data_status: "streaming"
      };
      console.log(`[v7.50] resolveSymbol: ${symbolName} using pricescale ${pricescale}`);
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
        const rawBars = normalizeBars(result.candles);
        bars = rawBars.map(bar => wrapOHLC(bar, symbolInfo.name, Datafeed._adminSpreads));
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
    // Parse resolution correctly - can be "1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"
    let resolutionMinutes = 1;
    if (resolution === '1M' || resolution === 'M') {
      resolutionMinutes = 30 * 24 * 60; // Approximate for throttling/candle logic
    } else if (resolution === '1W' || resolution === 'W') {
      resolutionMinutes = 7 * 24 * 60; // 10080 minutes in a week
    } else if (resolution === '1D' || resolution === 'D') {
      resolutionMinutes = 24 * 60; // 1440 minutes in a day
    } else if (resolution === '4h' || resolution === '240') {
      resolutionMinutes = 4 * 60;
    } else if (resolution === '2h' || resolution === '120') {
      resolutionMinutes = 2 * 60;
    } else if (resolution === '1h' || resolution === '60') {
      resolutionMinutes = 60;
    } else {
      resolutionMinutes = parseInt(resolution) || 1;
    }
    
    const resolutionMs = resolutionMinutes * 60 * 1000; // Convert to milliseconds
    const timeframe = formatResolution(resolution);
    const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
    
    let lastBarTime = null;
    let currentBar = null;
    let lastUpdateTime = 0;
    let tickCount = 0;
    let lastTickTime = 0;
    const throttleMs = 50;
    let isActive = true;

    // Seed real-time aggregation from the last historical bar so refresh during a forming
    // candle does not restart OHLC from a single tick (dot-like candle issue).
    const seededBar = Datafeed._lastHistoryBars?.[historyKey];
    if (seededBar && Number.isFinite(seededBar.time)) {
      currentBar = { ...seededBar };
      lastBarTime = seededBar.time;
      lastUpdateTime = Date.now();
    }

    //Sanket v2.0 - Guard against backward-in-time pushes that corrupt TradingView's internal bar cache.
    // Race condition: handleCandleUpdate may push bar at 14:00, then handlePriceUpdate
    // fires a "new bucket" transition that also pushes the OLD 12:00 bar to finalize it.
    // TV sees 14:00 -> 12:00 and throws putToCacheNewBar time violation, breaking 1D/1W/1M history.
    let lastPushedBarTime = seededBar ? seededBar.time : -Infinity;
    const pushBar = (bar) => {
      if (!bar || !Number.isFinite(bar.time)) return;
      if (bar.time < lastPushedBarTime) return; // silently drop backwards-in-time bars
      lastPushedBarTime = bar.time;
      onRealtimeCallback(bar);
    };

    // Bootstrap with latest live-preferred history so opening mid-candle (e.g. 15:57 on 15:55 bar)
    // can render already-formed OHLC instead of starting from a single incoming tick.
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

        const bars = normalizeBars(payload?.candles || []);
        if (bars.length === 0) return;

        const latest = bars[bars.length - 1];
        const currentBucket = Math.floor(Date.now() / resolutionMs) * resolutionMs;

        if (latest.time === currentBucket) {
          currentBar = { ...latest };
          lastBarTime = latest.time;
          lastUpdateTime = Date.now();
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
          pushBar(currentBar);
          console.log(`[DATAFEED] 🧩 Bootstrapped live bar for ${symbolInfo.name} ${timeframe} @ ${new Date(latest.time).toISOString()}`);
          return;
        }

        if (lastBarTime === null) {
          currentBar = { ...latest };
          lastBarTime = latest.time;
          lastUpdateTime = Date.now();
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
        }
      } catch (error) {
        // Keep stream alive if bootstrap fails; tick updates will continue normally.
      }
    };

    bootstrapLiveBar();
    
    // ✅ Backend Candle Authority: Join resolution-agnostic symbol room on backend
    priceStreamService.subscribeBars(symbolInfo.name);
    
    console.log(`[DATAFEED] ✅ subscribeBars: ${symbolInfo.name}, resolution=${resolution}m`);
    
    // ✅ Monitor for data gaps - production-grade health check
    const dataGapMonitor = setInterval(() => {
      const now = Date.now();
      if (lastTickTime > 0) {
        const timeSinceLastTick = now - lastTickTime;
        if (timeSinceLastTick > 30000) {
          console.warn(`[DATAFEED] ⚠️  DATA GAP: No ticks for ${(timeSinceLastTick / 1000).toFixed(1)}s (${tickCount} total ticks received)`);
        }
      }
    }, 10000);

    // ✅ Backend Candle Authority: Authoritative bar updates (Source of Truth)
    const handleCandleUpdate = (e) => {
      const { symbol, timeframe: incomingTimeframe, candle } = e.detail;
      
      // Symbol match
      if (normalizeRealtimeSymbol(symbol) !== normalizeRealtimeSymbol(symbolInfo.name)) return;
      
      // Resolution match (only process bars for the resolution we are watching)
      if (incomingTimeframe !== timeframe) return;

      const bar = {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      };

      //Sanket v2.0 - Reject stale candle updates that would rewind our time state.
      // On higher timeframes (1D/1W/1M) the backend emits the last COMPLETED bar alongside the
      // current forming bar. If we accept the old bar, currentBar/lastBarTime reset backwards,
      // handlePriceUpdate sees "new bucket" at a misaligned timestamp, pushBar emits a bar older
      // than TV's cache → putToCacheNewBar time violation → chart shows only 1 candle.
      if (currentBar !== null && bar.time < lastBarTime) return;

      // Apply Retail Lens Markup to AUTHORITATIVE bar
      const authoritativeBar = wrapOHLC(bar, symbolInfo.name, Datafeed._adminSpreads);

      currentBar = { ...authoritativeBar };
      lastBarTime = bar.time;
      lastUpdateTime = Date.now();

      // Update the singleton cache so History -> Realtime is seamless.
      // Only update when this bar is at least as recent as the cached entry to prevent
      // stale candle updates from corrupting the seed value for the next subscription.
      Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
      const existingCachedBar = Datafeed._lastHistoryBars[historyKey];
      if (!existingCachedBar || bar.time >= existingCachedBar.time) {
        Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
      }

      // Push to chart
      pushBar(currentBar);
    };
    
    const handlePriceUpdate = (e) => {
      tickCount++;
      if (!isActive) return;
      const { symbol, bid, ask, time } = e.detail;
      lastTickTime = Date.now();
      
      // Robust symbol matching
      if (normalizeRealtimeSymbol(symbol) !== normalizeRealtimeSymbol(symbolInfo.name)) return;

      // Throttle: don't flood the chart with every single tick
      const now = Date.now();
      if ((now - lastUpdateTime) < throttleMs) return;
      lastUpdateTime = now;

      // Use the mid-price to build candles
      const price = (Number(bid) + Number(ask)) / 2;
      if (!isFinite(price) || price <= 0) return;

      // Calculate candle bucket for this tick
      const tickTime = toMs(time) || now;
      const bucketTime = Math.floor(tickTime / resolutionMs) * resolutionMs;

      if (currentBar === null) {
        // No bar yet — seed from this tick
        currentBar = { time: bucketTime, open: price, high: price, low: price, close: price, volume: 0 };
        lastBarTime = bucketTime;
      } else if (bucketTime > lastBarTime) {
        // New candle period — only finalize the immediately preceding bar to avoid pushing stale bars.
        //Sanket v2.0 - If seededBar was from months ago, currentBar.time will be far in the past.
        // Pushing it would violate TV's time order (TV already has recent bars from getBars).
        // Only push if currentBar is the direct predecessor of the new bucket.
        if (currentBar.time === bucketTime - resolutionMs) {
          pushBar({ ...currentBar });
        }
        currentBar = { time: bucketTime, open: currentBar.close, high: price, low: price, close: price, volume: 0 };
        lastBarTime = bucketTime;
      } else {
        // Same bar — update OHLC
        currentBar.high  = Math.max(currentBar.high,  price);
        currentBar.low   = Math.min(currentBar.low,   price);
        currentBar.close = price;
      }

      currentBar.volume = (currentBar.volume || 0) + 1;

      // Apply spread markup and push to chart
      const markupBar = wrapOHLC({ ...currentBar }, symbolInfo.name, Datafeed._adminSpreads);
      pushBar(markupBar);
    };

    //Sanket v2.0 - Store both listeners so unsubscribeBars can clean up everything
    Datafeed._subscribers = Datafeed._subscribers || {};
    Datafeed._subscribers[subscriberUID] = {
      priceUpdate: handlePriceUpdate,
      candleUpdate: handleCandleUpdate,
      symbol: symbolInfo.name,
      dataGapMonitor
    };

    console.log(`[DATAFEED] 👂 Real-time subscription: ${symbolInfo.name}`);
    priceEventTarget.addEventListener("candleUpdate", handleCandleUpdate);
    priceEventTarget.addEventListener("priceUpdate", handlePriceUpdate);
    
    // Return cleanup function so TradingView can call it when unsubscribing
    return function cleanup() {
      isActive = false;
      clearInterval(dataGapMonitor);
      priceStreamService.unsubscribeBars(symbolInfo.name);
      priceEventTarget.removeEventListener("candleUpdate", handleCandleUpdate);
      priceEventTarget.removeEventListener("priceUpdate", handlePriceUpdate);
      delete Datafeed._subscribers[subscriberUID];
      console.log(`[DATAFEED] ❌ Unsubscribed: ${symbolInfo.name}, received ${tickCount} ticks`);
    };
  },

  //Sanket v2.0 - Now removes both priceUpdate AND candleUpdate listeners to prevent memory leaks
  unsubscribeBars: (subscriberUID) => {
    const sub = Datafeed._subscribers && Datafeed._subscribers[subscriberUID];
    if (sub) {
      priceEventTarget.removeEventListener("priceUpdate", sub.priceUpdate);
      priceEventTarget.removeEventListener("candleUpdate", sub.candleUpdate);
      if (sub.dataGapMonitor) clearInterval(sub.dataGapMonitor);
      if (sub.symbol) priceStreamService.unsubscribeBars(sub.symbol);
      delete Datafeed._subscribers[subscriberUID];
    }
  }
};

export default Datafeed;