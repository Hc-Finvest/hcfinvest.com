
// import { API_URL } from "../config/api";

// /* Event system used by TradingPage.jsx to receive live price updates */
// const priceEventTarget = new EventTarget();
// export const getMetaApiPriceEvents = () => priceEventTarget;

// /* TradingView configuration */
// const configurationData = {
//   supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"]
// };

// const Datafeed = {
//   interval: null,

//   onReady: (callback) => {
//     setTimeout(() => callback(configurationData));
//   },

//   resolveSymbol: async (
//     symbolName,
//     onSymbolResolvedCallback,
//     onResolveErrorCallback
//   ) => {
//     const symbolInfo = {
//       name: symbolName,
//       ticker: symbolName,
//       type: "crypto",
//       session: "24x7",
//       timezone: "Etc/UTC",
//       exchange: "MetaApi",
//       minmov: 1,
//       pricescale: 100,
//       has_intraday: true,
//       intraday_multipliers: ["1", "5", "15", "30", "60"],
//       supported_resolutions: configurationData.supported_resolutions,
//       volume_precision: 2,
//       data_status: "streaming"
//     };

//     setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
//   },

//   /* Load historical candles */
//   getBars: async (
//     symbolInfo,
//     resolution,
//     periodParams,
//     onHistoryCallback,
//     onErrorCallback
//   ) => {

//     try {

//       const res = await fetch(`${API_URL}/xauusd/all`);
//       const result = await res.json();
//       const data = result.data;

//       if (!data || !data.length) {
//         onHistoryCallback([], { noData: true });
//         return;
//       }

//       const bars = data.map((c) => ({
//         time: new Date(c.time).getTime(),
//         open: c.open,
//         high: c.high,
//         low: c.low,
//         close: c.close
//       }));

//       bars.sort((a, b) => a.time - b.time);

//       onHistoryCallback(bars, { noData: false });

//     } catch (err) {

//       console.log("History error:", err);
//       onErrorCallback(err);

//     }

//   },

//   /* Realtime updates */
//   subscribeBars: (
//     symbolInfo,
//     resolution,
//     onRealtimeCallback,
//     subscriberUID
//   ) => {

//     // stop previous polling if exists
//     if (Datafeed.interval) {
//       clearInterval(Datafeed.interval);
//       Datafeed.interval = null;
//     }

//     Datafeed.interval = setInterval(async () => {

//       try {

//         const res = await fetch(`${API_URL}/xauusd/latest`);
//         const data = await res.json();

//         if (!data || !data.length) return;

//         const last = data[0];

//         const bar = {
//           time: new Date(last.time).getTime(),
//           open: last.open,
//           high: last.high,
//           low: last.low,
//           close: last.close
//         };

//         // Update TradingView chart
//         onRealtimeCallback(bar);

//         // Send price update to TradingPage
//         const priceEvent = new CustomEvent("priceUpdate", {
//           detail: {
//             symbol: symbolInfo.name,
//             bid: bar.close,
//             ask: bar.close + 0.5,
//             time: bar.time
//           }
//         });

//         priceEventTarget.dispatchEvent(priceEvent);

//       } catch (err) {
//         console.log("Realtime error:", err);
//       }

//     }, 1000); // fetch every 1 second

//   },

//   /* Stop realtime updates */
//   unsubscribeBars: () => {

//     if (Datafeed.interval) {
//       clearInterval(Datafeed.interval);
//       Datafeed.interval = null;
//     }

//   }

// };

// export default Datafeed;



// -----------------------------------------------------------------------------------------------------

import { API_URL } from "../config/api";

/**
 * //sanket - Custom Datafeed for TradingView Charting Library
 * Integrates with MetaAPI data through our optimized backend caching service.
 */

/* Event system used by TradingPage.jsx to receive live price updates */
const priceEventTarget = new EventTarget();
export const getMetaApiPriceEvents = () => priceEventTarget;

const configurationData = {
  supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"]
};

// //sanket - Map TradingView resolution to backend timeframe format
const formatResolution = (res) => {
  const map = {
    '1': '1m', '5': '5m', '15': '15m', '30': '30m',
    '60': '1h', '240': '4h', 'D': '1d', '1D': '1d', 'W': '1w', 'M': '1M'
  };
  return map[res] || res;
};

const normalizeRealtimeSymbol = (value = '') => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

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

const Datafeed = {
  interval: null,

  onReady: (callback) => {
    setTimeout(() => callback(configurationData));
  },

  resolveSymbol: async (symbolName, onSymbolResolvedCallback) => {
    // //sanket - Determine pricescale based on symbol (BTC, XAU, JPY usually have 2-3 decimals, Forex has 5)
    let pricescale = 100000;
    const s = symbolName.toUpperCase();
    if (s.includes("JPY") || s.includes("XAU") || s.includes("BTC") || s.includes("ETH") || s.includes("USDT")) {
      pricescale = 100;
    } else if (s.includes("XAG")) {
      pricescale = 1000;
    }

    const symbolInfo = {
      name: symbolName,
      ticker: symbolName,
      description: symbolName,
      type: "forex",
      session: "24x7",
      timezone: "Etc/UTC",
      exchange: "MetaAPI",
      minmov: 1,
      pricescale: pricescale,
      has_intraday: true,
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: "streaming"
    };
    console.log(`[sanket] resolveSymbol: ${symbolName} using pricescale ${pricescale}`);
    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
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
      const intradayTimeframes = new Set(['1m', '5m', '15m', '30m', '1h', '4h']);
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
        onHistoryCallback([], { noData: true });
        return;
      }

      const result = await res.json();
      const candleCount = result.candles?.length || 0;
      console.log(`[DATAFEED] ✓ getBars received ${candleCount} candles for ${symbolInfo.name}`);

      let bars = [];
      if (result.success && result.candles && result.candles.length > 0) {
        bars = normalizeBars(result.candles);
      }

      // On initial load, if bounded window is too sparse (common during refresh mid-candle),
      // fetch an unbounded latest window and merge for a complete chart backbone.
      const sparseThreshold = Math.max(80, Math.floor((countBack || 300) * 0.4));
      if (firstDataRequest && bars.length < sparseThreshold) {
        const fallbackParams = new URLSearchParams();
        fallbackParams.set('symbol', symbolInfo.name);
        fallbackParams.set('resolution', timeframe);
        fallbackParams.set('limit', String(limit));
        fallbackParams.set('preferLive', '1');
        const fallbackUrl = `${API_URL}/prices/history?${fallbackParams.toString()}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          const fallbackResult = await fallbackRes.json();
          const fallbackBars = normalizeBars(fallbackResult?.candles || []);
          const mergedByTime = new Map();
          [...fallbackBars, ...bars].forEach((bar) => mergedByTime.set(bar.time, bar));
          bars = [...mergedByTime.values()].sort((a, b) => a.time - b.time);
          console.log(`[DATAFEED] ↺ fallback merged bars: ${bars.length} for ${symbolInfo.name}`);
        }
      }

      if (bars.length === 0) {
          console.log(`[DATAFEED] ⚠️ No valid bars for ${symbolInfo.name}. Returning noData.`);
          onHistoryCallback([], { noData: true });
      } else {
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...bars[bars.length - 1] };
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
    // Parse resolution correctly - can be "1", "5", "15", "30", "60", "240", "1D"
    let resolutionMinutes = 1;
    if (resolution === '1D' || resolution === 'D') {
      resolutionMinutes = 24 * 60; // 1440 minutes in a day
    } else if (resolution === '4h') {
      resolutionMinutes = 4 * 60;
    } else if (resolution === '1h') {
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
    const throttleMs = 300;
    let isActive = true;

    // Seed real-time aggregation from the last historical bar so refresh during a forming
    // candle does not restart OHLC from a single tick (dot-like candle issue).
    const seededBar = Datafeed._lastHistoryBars?.[historyKey];
    if (seededBar && Number.isFinite(seededBar.time)) {
      currentBar = { ...seededBar };
      lastBarTime = seededBar.time;
      lastUpdateTime = Date.now();
    }

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
          onRealtimeCallback(currentBar);
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
    
    const handlePriceUpdate = (e) => {
      tickCount++;
      const { symbol, bid, ask, time } = e.detail;
      lastTickTime = Date.now();
      
      // Robust symbol matching across suffix and punctuation differences.
      const cleanIncomingSymbol = normalizeRealtimeSymbol(symbol);
      const cleanTargetSymbol = normalizeRealtimeSymbol(symbolInfo.name);
      
      if (cleanIncomingSymbol !== cleanTargetSymbol) {
        return;
      }

      // CRITICAL: Convert timestamp to UNIX MILLISECONDS
      let timeMs = time;
      
      // If it's a string (ISO format from backend), parse it
      if (typeof timeMs === 'string') {
        timeMs = new Date(timeMs).getTime();
      }
      // If it's in seconds (< year 2286), convert to milliseconds
      else if (typeof timeMs === 'number' && timeMs < 10000000000) {
        timeMs = timeMs * 1000;
      }
      
      // Validate timestamp
      if (isNaN(timeMs) || timeMs <= 0) {
        return; // Skip this update
      }

      // ✅ CRITICAL FIX: Calculate which candle this tick belongs to
      const barTimeMs = Math.floor(timeMs / resolutionMs) * resolutionMs;

      if (lastBarTime !== null && barTimeMs < lastBarTime) {
        return;
      }
      
      const bidPrice = parseFloat(bid);
      const askPrice = parseFloat(ask);
      if (!Number.isFinite(bidPrice) || !Number.isFinite(askPrice) || bidPrice <= 0 || askPrice <= 0) {
        return;
      }
      const midPrice = (bidPrice + askPrice) / 2;
      if (!Number.isFinite(midPrice) || midPrice <= 0) {
        return;
      }
      
      // ✅ OHLC Calculation: Use bid/ask spread for H/L (like real trading platforms)
      // This matches backend calculation in storageService.ingestTick()
      // - HIGH/LOW: Use actual bid/ask range to show true market volatility
      // - OPEN/CLOSE: Use mid-price as the representative price
      // Example: bid=5040.50, ask=5041.00 → high=5041.00, low=5040.50, close=5040.75
      const tickHigh = Math.max(bidPrice, askPrice);
      const tickLow = Math.min(bidPrice, askPrice);
      
      // ✅ Create NEW bar OR update EXISTING bar
      if (lastBarTime !== null && barTimeMs > lastBarTime) {
        // New timeframe started
        // ⚠️ IMPORTANT: DO NOT emit the closed bar!
        // TradingView has cached it as historical data. Re-emitting causes conflicts.
        
        if (currentBar && currentBar.volume > 0) {
          console.log(`[DATAFEED] 🕯️ CLOSED (HISTORICAL): ${symbol} (${resolutionMinutes}m) @ ${new Date(lastBarTime).toISOString()} | O:${currentBar.open.toFixed(2)} H:${currentBar.high.toFixed(2)} L:${currentBar.low.toFixed(2)} C:${currentBar.close.toFixed(2)} V:${currentBar.volume}`);
        }
        
        // Create new bar for this timeframe
        currentBar = {
          time: barTimeMs,
          open: midPrice,
          high: tickHigh,
          low: tickLow,
          close: midPrice,
          volume: 1
        };
        
        lastBarTime = barTimeMs;
        lastUpdateTime = Date.now();
        
        console.log(`[DATAFEED] 🟢 OPENED (CURRENT): ${symbol} @ ${new Date(barTimeMs).toISOString()} (${resolutionMinutes}m)`);
        
        Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
        Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
        onRealtimeCallback(currentBar);
        
      } else if (lastBarTime === null) {
        // ✅ FIRST BAR - initialize
        currentBar = {
          time: barTimeMs,
          open: midPrice,
          high: tickHigh,
          low: tickLow,
          close: midPrice,
          volume: 1
        };
        
        lastBarTime = barTimeMs;
        lastUpdateTime = Date.now();
        
        console.log(`[DATAFEED] 🟢 OPENED (CURRENT): ${symbol} @ ${new Date(barTimeMs).toISOString()} (${resolutionMinutes}m)`);
        Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
        Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
        onRealtimeCallback(currentBar);
        
      } else if (currentBar && barTimeMs === lastBarTime) {
        // ✅ Same timeframe → UPDATE the current candle ONLY
        currentBar.high = Math.max(currentBar.high, tickHigh, midPrice);
        currentBar.low = Math.min(currentBar.low, tickLow, midPrice);
        currentBar.close = midPrice;
        currentBar.volume += 1;
        
        // ✅ THROTTLE: Only send updates every 300ms to prevent chart jitter
        const now = Date.now();
        if (now - lastUpdateTime >= throttleMs) {
          if (currentBar.volume % 50 === 0) {
            console.log(`[DATAFEED] 📊 UPDATE: ${symbol} (V:${currentBar.volume})`);
          }
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
          onRealtimeCallback(currentBar);
          lastUpdateTime = now;
        }
      }
    };

    // Store the listener on the subscriber for cleanup
    Datafeed._subscribers = Datafeed._subscribers || {};
    Datafeed._subscribers[subscriberUID] = handlePriceUpdate;

    console.log(`[DATAFEED] 👂 Real-time subscription: ${symbolInfo.name}`);
    priceEventTarget.addEventListener("priceUpdate", handlePriceUpdate);
    
    // Return cleanup function so TradingView can call it when unsubscribing
    return function cleanup() {
      isActive = false;
      clearInterval(dataGapMonitor);
      priceEventTarget.removeEventListener("priceUpdate", handlePriceUpdate);
      delete Datafeed._subscribers[subscriberUID];
      console.log(`[DATAFEED] ❌ Unsubscribed: ${symbolInfo.name}, received ${tickCount} ticks`);
    };
  },

  unsubscribeBars: (subscriberUID) => {
    const handler = Datafeed._subscribers && Datafeed._subscribers[subscriberUID];
    if (handler) {
      priceEventTarget.removeEventListener("priceUpdate", handler);
      delete Datafeed._subscribers[subscriberUID];
    }
  }
};

export default Datafeed;