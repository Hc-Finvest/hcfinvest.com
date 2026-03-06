// datafeed.js
// export default function datafeed() {
//   return {
//     onReady: (callback) => {
//       setTimeout(() => callback({
//         supports_search: true,
//         supports_group_request: false,
//         supports_marks: false,
//         supports_timescale_marks: false,
//         supports_time: true,
//         supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"]
//       }), 0);
//     },

//     resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
//       const symbolInfo = {
//         name: symbolName,
//         ticker: symbolName,
//         description: symbolName,
//         type: "crypto",
//         session: "24x7",
//         timezone: "UTC",
//         minmov: 1,
//         pricescale: 100,
//         has_intraday: true,
//         intraday_multipliers: ["1", "5", "15", "30", "60"],
//         supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"],
//         volume_precision: 2,
//         data_status: "streaming",
//       };
//       setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
//     },

//     getBars: (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
//       // For simplicity, return empty history (you can fetch REST history if needed)
//       onHistoryCallback([], { noData: true });
//     },

//     subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
//       const socket = new WebSocket("wss://quote.alltick.io/quote-b-ws-api?token=1620b8aba97f46dec78ec599d611b958-c-app");

//       socket.onopen = () => {
//         console.log("Connected to Alltick WebSocket");

//         // Subscribe to kline data for the symbol
//         const subscribeMsg = {
//           cmd: "sub",
//           args: [`${symbolInfo.ticker}@kline_${resolution}m`]
//         };
//         socket.send(JSON.stringify(subscribeMsg));
//       };

//       socket.onmessage = (event) => {
//         const msg = JSON.parse(event.data);

//         if (msg && msg.data) {
//           const kline = msg.data;

//           onRealtimeCallback({
//             time: kline.timestamp * 100, // convert to ms
//             open: parseFloat(kline.open),
//             high: parseFloat(kline.high),
//             low: parseFloat(kline.low),
//             close: parseFloat(kline.close),
//             volume: parseFloat(kline.volume),
//           });
//         }
//       };

//       this._socket = socket;
//     },

//     unsubscribeBars: (subscriberUID) => {
//       if (this._socket) {
//         this._socket.close();
//         this._socket = null;
//       }
//     }
//   };
// }



 
// datafeed.js

// import MetaApi, { SynchronizationListener } from "metaapi.cloud-sdk";
// // datafeed for BTCUSD
// const token = import.meta.env.VITE_TOKEN;
// const accountId = import.meta.env.VITE_ACCOUNT_ID;
// const SYMBOL = "BTCUSD";
// const BACKEND = "http://localhost:1819/api";

// let api, account, connection, listener;

// // Convert resolution
// const convertResolution = (res) => {
//   const map = {
//     "1": "1m",
//     "5": "5m",
//     "15": "15m",
//     "30": "30m",
//     "60": "1h",
//     "D": "1d",
//   };
//   return map[res] || "1m";
// };

// async function init() {
//   if (!api) {
//     api = new MetaApi(token);
//     account = await api.metatraderAccountApi.getAccount(accountId);
//     connection = account.getStreamingConnection();
//     await connection.connect();
//     await connection.waitSynchronized();
//   }
// }

// export default {

//   onReady: (cb) => {
//     setTimeout(() => {
//       cb({
//         supported_resolutions: ["1", "5", "15", "30", "60", "D"],
//       });
//     }, 0);
//   },

//   resolveSymbol: (symbolName, onResolve) => {
//     setTimeout(() => {
//       onResolve({
//         name: SYMBOL,
//         ticker: SYMBOL,
//         full_name: SYMBOL,
//         description: "BTCUSD",
//         type: "crypto",
//         session: "24x7",
//         timezone: "Etc/UTC",
//         exchange: "MetaAPI",
//         listed_exchange: "MetaAPI",
//         format: "price",
//         minmov: 1,
//         pricescale: 1,
//         has_intraday: true,
//         visible_plots_set: "ohlc",
//         supported_resolutions: ["1", "5", "15", "30", "60", "D"],
//       });
//     }, 0);
//   },

//   // 🔥 HISTORY FROM MONGO
//   getBars: async (
//     symbolInfo,
//     resolution,
//     periodParams,
//     onHistoryCallback,
//     onErrorCallback
//   ) => {
//     try {
//       const timeframe = convertResolution(resolution);

//       const from = new Date(periodParams.from * 1000);
//       const to = new Date(periodParams.to * 1000);

//       const response = await fetch(
//         `${BACKEND}/btc?timeframe=${timeframe}&from=${from.toISOString()}&to=${to.toISOString()}`
//       );

//       const result = await response.json();

//       if (!result.success || !result.data.length) {
//         onHistoryCallback([], { noData: true });
//         return;
//       }

//       const bars = result.data.map((c) => ({
//         time: new Date(c.time).getTime(),
//         open: c.open,
//         high: c.high,
//         low: c.low,
//         close: c.close,
//       }));

//       bars.sort((a, b) => a.time - b.time);

//       onHistoryCallback(bars, { noData: false });

//     } catch (err) {
//       onErrorCallback(err);
//     }
//   },

//   // 🔥 LIVE FROM METAAPI + SAVE TO DB
//   subscribeBars: async (
//     symbolInfo,
//     resolution,
//     onRealtimeCallback
//   ) => {
//     await init();

//     const timeframe = convertResolution(resolution);

//     await connection.subscribeToMarketData(SYMBOL, [
//       { type: "candles", timeframe },
//     ]);

//     listener = new (class extends SynchronizationListener {
//       async onCandlesUpdated(_, candles) {
//         if (!candles?.length) return;

//         const c = candles[candles.length - 1];

//         if (c.symbol !== SYMBOL) return;

//         const bar = {
//           time: new Date(c.time).getTime(),
//           open: c.open,
//           high: c.high,
//           low: c.low,
//           close: c.close,
//         };

//         // 🔥 Update chart instantly
//         onRealtimeCallback(bar);

//         // 🔥 Save to Mongo
//         await fetch(`${BACKEND}/btc/save`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             symbol: SYMBOL,
//             timeframe,
//             time: c.time,
//             open: c.open,
//             high: c.high,
//             low: c.low,
//             close: c.close,
//           }),
//         });

//         console.log("💾 Live candle stored");
//       }
//     })();

//     connection.addSynchronizationListener(listener);
//   },

//   unsubscribeBars: () => {},
// }; 



import { API_URL } from "../config/api";

/* Event system used by TradingPage.jsx to receive live price updates */
const priceEventTarget = new EventTarget();
export const getMetaApiPriceEvents = () => priceEventTarget;

/* TradingView configuration */
const configurationData = {
  supported_resolutions: ["1", "5", "15", "30", "60", "240", "1D"]
};

const Datafeed = {
  interval: null,

  onReady: (callback) => {
    setTimeout(() => callback(configurationData));
  },

  resolveSymbol: async (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) => {
    const symbolInfo = {
      name: symbolName,
      ticker: symbolName,
      type: "crypto",
      session: "24x7",
      timezone: "Etc/UTC",
      exchange: "MetaApi",
      minmov: 1,
      pricescale: 100,
      has_intraday: true,
      intraday_multipliers: ["1", "5", "15", "30", "60"],
      supported_resolutions: configurationData.supported_resolutions,
      volume_precision: 2,
      data_status: "streaming"
    };

    setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
  },

  /* Load historical candles */
getBars: async (
  symbolInfo,
  resolution,
  periodParams,
  onHistoryCallback,
  onErrorCallback
) => {

  try {

    const res = await fetch(`${API_URL}/xauusd/all`);
    const result = await res.json();
    const data = result.data;

    if (!data || !data.length) {
      onHistoryCallback([], { noData: true });
      return;
    }

    const bars = data.map((c) => ({
      time: new Date(c.time).getTime(),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    }));

    bars.sort((a, b) => a.time - b.time);

    // console.log("📊 Loaded candles:", bars.length);

    onHistoryCallback(bars, { noData: false });

  } catch (err) {

    console.log("History error:", err);
    onErrorCallback(err);

  }

},
  /* Realtime updates */
subscribeBars: (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID
) => {

  if (Datafeed.interval) {
    clearInterval(Datafeed.interval);
  }

  Datafeed.interval = setInterval(async () => {

    try {

      const res = await fetch(`${API_URL}/xauusd/latest`);
      const data = await res.json();

      if (!data || !data.length) return;

      const last = data[0];

      const bar = {
        time: new Date(last.time).getTime(),
        open: last.open,
        high: last.high,
        low: last.low,
        close: last.close
      };

      // Update TradingView chart
      onRealtimeCallback(bar);

      // Send price update to TradingPage
      const priceEvent = new CustomEvent("priceUpdate", {
        detail: {
          symbol: symbolInfo.name,
          bid: bar.close,
          ask: bar.close + 0.5,
          time: bar.time
        }
      });

      priceEventTarget.dispatchEvent(priceEvent);

    } catch (err) {
      console.log("Realtime error:", err);
    }

  }, 300);

},

  /* Stop realtime updates */
  unsubscribeBars: () => {
    if (Datafeed.interval) {
      clearInterval(Datafeed.interval);
      Datafeed.interval = null;
    }
  }
};

export default Datafeed;