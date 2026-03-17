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
      const { from, to, countBack } = periodParams;
      const timeframe = formatResolution(resolution);
      
      // Ensure minimum 500 candles for proper chart display
      const limit = Math.max(countBack || 300, 500);
      const url = `${API_URL}/prices/history?symbol=${symbolInfo.name}&resolution=${timeframe}&from=${from}&to=${to}&limit=${limit}`;
      
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
          // CRITICAL: Convert time to UNIX MILLISECONDS
          // Backend returns time in SECONDS, TradingView expects MILLISECONDS
          bars = result.candles.map((c, idx) => {
            // Validate timestamp
            let timeMs = c.time;
            
            // If it's in seconds (less than year 2286), convert to milliseconds
            if (typeof timeMs === 'number' && timeMs < 10000000000) {
              timeMs = timeMs * 1000;
            }
            
            // If it's a string, parse it
            if (typeof timeMs === 'string') {
              timeMs = new Date(timeMs).getTime();
            }
            
            // Final validation - reject invalid timestamps
            if (isNaN(timeMs) || timeMs <= 0) {
              console.warn(`[DATAFEED] Invalid timestamp at index ${idx}: ${c.time}`);
              return null;
            }
            
            return {
              time: timeMs,
              open: parseFloat(c.open),
              high: parseFloat(c.high),
              low: parseFloat(c.low),
              close: parseFloat(c.close),
              volume: parseInt(c.volume) || 0
            };
          }).filter(b => b !== null); // Remove invalid bars
      }

      if (bars.length === 0) {
          console.log(`[DATAFEED] ⚠️ No valid bars for ${symbolInfo.name}. Returning noData.`);
          onHistoryCallback([], { noData: true });
      } else {
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
    
    let lastBarTime = null;
    let currentBar = null;
    let lastUpdateTime = 0;
    let tickCount = 0;
    let lastTickTime = 0;
    const throttleMs = 300;
    
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
      
      // Robust symbol matching (case-insensitive, handles .i suffix)
      const cleanIncomingSymbol = symbol.toUpperCase().replace('.I', '');
      const cleanTargetSymbol = symbolInfo.name.toUpperCase().replace('.I', '');
      
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
      
      const bidPrice = parseFloat(bid);
      const askPrice = parseFloat(ask);
      const midPrice = (bidPrice + askPrice) / 2;
      
      // ✅ OHLC Calculation: Use bid/ask spread for H/L (like real trading platforms)
      // This matches backend calculation in storageService.ingestTick()
      // - HIGH/LOW: Use actual bid/ask range to show true market volatility
      // - OPEN/CLOSE: Use mid-price as the representative price
      // Example: bid=5040.50, ask=5041.00 → high=5041.00, low=5040.50, close=5040.75
      
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
          high: Math.max(bidPrice, askPrice),
          low: Math.min(bidPrice, askPrice),
          close: midPrice,
          volume: 1
        };
        
        lastBarTime = barTimeMs;
        lastUpdateTime = Date.now();
        
        console.log(`[DATAFEED] 🟢 OPENED (CURRENT): ${symbol} @ ${new Date(barTimeMs).toISOString()} (${resolutionMinutes}m)`);
        
        onRealtimeCallback(currentBar);
        
      } else if (lastBarTime === null) {
        // ✅ FIRST BAR - initialize
        currentBar = {
          time: barTimeMs,
          open: midPrice,
          high: Math.max(bidPrice, askPrice),
          low: Math.min(bidPrice, askPrice),
          close: midPrice,
          volume: 1
        };
        
        lastBarTime = barTimeMs;
        lastUpdateTime = Date.now();
        
        console.log(`[DATAFEED] 🟢 OPENED (CURRENT): ${symbol} @ ${new Date(barTimeMs).toISOString()} (${resolutionMinutes}m)`);
        onRealtimeCallback(currentBar);
        
      } else if (currentBar && barTimeMs === lastBarTime) {
        // ✅ Same timeframe → UPDATE the current candle ONLY
        currentBar.high = Math.max(currentBar.high, bidPrice, askPrice);
        currentBar.low = Math.min(currentBar.low, bidPrice, askPrice);
        currentBar.close = midPrice;
        currentBar.volume += 1;
        
        // ✅ THROTTLE: Only send updates every 300ms to prevent chart jitter
        const now = Date.now();
        if (now - lastUpdateTime >= throttleMs) {
          if (currentBar.volume % 50 === 0) {
            console.log(`[DATAFEED] 📊 UPDATE: ${symbol} (V:${currentBar.volume})`);
          }
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