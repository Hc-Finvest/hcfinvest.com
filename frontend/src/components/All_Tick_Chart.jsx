import React, { useEffect, useRef } from "react";
import axios from "axios";
import alltickWebSocket from "../services/alltickWebSocket";
import { v4 as uuidv4 } from "uuid";

const CORS_PROXY = "https://corsproxy.io/?";
const ALLTICK_URL = "https://quote.alltick.io/quote-b-api/kline";
const TOKEN = "1620b8aba97f46dec78ec599d611b958-c-app";

function All_Tick_Chart() {
  const chartRef = useRef(null);

  useEffect(() => {
    let lastBar = null;
    let intervalId = null;

    const alignTimeToResolution = (timestampMs, resolution) => {
      const date = new Date(timestampMs);

      if (resolution === "1D") {
        date.setUTCHours(0, 0, 0, 0);
      } else {
        const minutes = parseInt(resolution);
        const totalMinutes =
          date.getUTCHours() * 60 + date.getUTCMinutes();
        const aligned =
          Math.floor(totalMinutes / minutes) * minutes;

        date.setUTCHours(
          Math.floor(aligned / 60),
          aligned % 60,
          0,
          0
        );
      }

      return date.getTime();
    };

    const resolutionMap = {
      "1": "1",
      "5": "5",
      "15": "8",
      "60": "10",
      "1D": "13"
    };

    const Datafeed = {
      onReady: (callback) => {
        setTimeout(() => {
          callback({
            supported_resolutions: ["1", "5", "15", "60", "1D"]
          });
        }, 0);
      },

      resolveSymbol: (symbolName, onSymbolResolvedCallback) => {
        setTimeout(() => {
          onSymbolResolvedCallback({
            name: symbolName,
            ticker: symbolName,
            description: symbolName,
            type: "crypto",
            session: "24x7",
            timezone: "Etc/UTC",
            exchange: "AllTick",
            listed_exchange: "AllTick",
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            supported_resolutions: ["1", "5", "15", "60", "1D"],
            volume_precision: 2,
            data_status: "streaming"
          });
        }, 0);
      },

      getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback) => {
        try {
          const klineType = resolutionMap[resolution] || "1";

          const queryPayload = {
            data: {
              code: symbolInfo.name,
              kline_type: klineType,
              kline_timestamp_end: 0,
              query_kline_num: 300,
              adjust_type: 0
            }
          };

          const url =
            CORS_PROXY +
            encodeURIComponent(
              `${ALLTICK_URL}?token=${TOKEN}&query=${JSON.stringify(queryPayload)}`
            );

          const response = await axios.get(url);
          const raw = response.data?.data?.kline_list;

          if (!raw || raw.length === 0) {
            onHistoryCallback([], { noData: true });
            return;
          }

          const bars = raw
            .map(candle => ({
              time: alignTimeToResolution(Number(candle.timestamp) * 1000, resolution),
              open: Number(candle.open_price),
              high: Number(candle.high_price),
              low: Number(candle.low_price),
              close: Number(candle.close_price),
              volume: Number(candle.volume)
            }))
            .sort((a, b) => a.time - b.time);

          lastBar = bars[bars.length - 1];
          onHistoryCallback(bars, { noData: false });

        } catch (error) {
          console.error("getBars error:", error);
          onHistoryCallback([], { noData: true });
        }
      },

      subscribeBars: (
        symbolInfo,
        resolution,
        onRealtimeCallback
      ) => {
        let currentBar = null;

        const unsubscribe = alltickWebSocket.subscribe(symbolInfo.name, (data) => {
          console.log('[All_Tick_Chart] 📊 Tick received:', data.price, 'at', new Date().toLocaleTimeString())
          
          if (!lastBar) {
            console.log('[All_Tick_Chart] ⏳ Waiting for historical data...')
            return;
          }

          // Always use current time for the candle to ensure real-time updates
          const currentCandleTime = alignTimeToResolution(Date.now(), resolution);
          console.log('[All_Tick_Chart] Current time:', new Date().toLocaleTimeString(), 'Candle time:', new Date(currentCandleTime).toLocaleTimeString())
          
          // Create or update the current candle with tick-by-tick data
          if (!currentBar || currentBar.time !== currentCandleTime) {
            // Create new candle for current time period
            currentBar = {
              time: currentCandleTime,
              open: data.open || data.price || lastBar.close,
              high: data.high || data.price || lastBar.close,
              low: data.low || data.price || lastBar.close,
              close: data.price,
              volume: data.volume || 0
            };
            console.log('[All_Tick_Chart] 🕯️ New candle created:', {
              time: new Date(currentBar.time).toLocaleTimeString(),
              open: currentBar.open,
              price: data.price,
              isNew: true
            })
          } else {
            // Update current candle with every price tick - this is the key for tick-by-tick movement
            const newPrice = data.price;
            const previousClose = currentBar.close;
            const priceChange = newPrice - previousClose;
            
            // Update OHLC with tick data
            currentBar.high = Math.max(currentBar.high, newPrice);
            currentBar.low = Math.min(currentBar.low, newPrice);
            currentBar.close = newPrice;
            currentBar.volume = (data.volume || 0) + currentBar.volume;
            
            // Show detailed tick information
            console.log('[All_Tick_Chart] 📈 Tick update:', {
              price: newPrice,
              change: priceChange,
              changePercent: ((priceChange / currentBar.open) * 100).toFixed(2) + '%',
              high: currentBar.high,
              low: currentBar.low,
              volume: currentBar.volume,
              direction: priceChange > 0 ? '📈 UP' : priceChange < 0 ? '📉 DOWN' : '➡️ FLAT'
            })
          }

          // CRITICAL: Always update the chart with the current candle for real-time visualization
          console.log('[All_Tick_Chart] 🔄 Calling onRealtimeCallback with candle:', {
            time: new Date(currentBar.time).toLocaleTimeString(),
            open: currentBar.open,
            close: currentBar.close,
            high: currentBar.high,
            low: currentBar.low
          })
          onRealtimeCallback(currentBar);
          
          // Update lastBar reference when new candle is created
          if (currentBar.time > lastBar.time) {
            lastBar = currentBar;
            console.log('[All_Tick_Chart] 📊 New bar became lastBar:', new Date(currentBar.time).toLocaleTimeString())
          }
        });

        Datafeed._unsubscribe = unsubscribe;

        console.log('[All_Tick_Chart] Live data subscription setup complete');
      },

      unsubscribeBars: () => {
        if (Datafeed._unsubscribe) {
          Datafeed._unsubscribe();
          Datafeed._unsubscribe = null;
        }
        console.log('[All_Tick_Chart] Unsubscribed from live data');
      }
    };

    const widget = new window.TradingView.widget({
      symbol: "BTCUSDT",
      interval: "1",
      container: chartRef.current,
      datafeed: Datafeed,
      library_path: "/charting_library/",
      locale: "en",
      disabled_features: [
        "use_localstorage_for_settings",
        "study_templates",
        "header_saveload"
      ],
      fullscreen: false,
      autosize: true
    });

    return () => {
      if (Datafeed._unsubscribe) {
        Datafeed._unsubscribe();
        Datafeed._unsubscribe = null;
      }
      widget.remove();
      console.log('[All_Tick_Chart] Chart cleanup complete');
    };

  }, []);

  return (
    <div
      ref={chartRef}
      style={{ width: "100%", height: "700px" }}
    />
  );
}

export default All_Tick_Chart;


// ------------------------------------------------------------------------------------------------------------------


// import React, { useEffect, useRef } from "react";
// import axios from "axios";
// import { v4 as uuidv4 } from "uuid";

// const CORS_PROXY = "https://corsproxy.io/?";
// const ALLTICK_KLINE = "https://quote.alltick.io/quote-b-api/kline";
// const TOKEN = "1620b8aba97f46dec78ec599d611b958-c-app";

// function All_Tick_Chart() {
//   const chartRef = useRef(null);

//   useEffect(() => {

//     const alignTimeToResolution = (timestampMs, resolution) => {
//       const date = new Date(timestampMs);

//       if (resolution === "1D") {
//         date.setUTCHours(0, 0, 0, 0);
//       } else {
//         const minutes = parseInt(resolution);
//         const totalMinutes =
//           date.getUTCHours() * 60 + date.getUTCMinutes();
//         const aligned =
//           Math.floor(totalMinutes / minutes) * minutes;

//         date.setUTCHours(
//           Math.floor(aligned / 60),
//           aligned % 60,
//           0,
//           0
//         );
//       }

//       return date.getTime();
//     };

//     const Datafeed = {

//       onReady: (callback) => {
//         setTimeout(() => {
//           callback({
//             supported_resolutions: ["1", "5", "15", "60", "1D"]
//           });
//         }, 0);
//       },

//       resolveSymbol: (symbolName, onSymbolResolvedCallback) => {
//         setTimeout(() => {
//           onSymbolResolvedCallback({
//             name: symbolName,
//             ticker: symbolName,
//             description: symbolName,
//             type: "crypto",
//             session: "24x7",
//             timezone: "Etc/UTC",
//             exchange: "AllTick",
//             listed_exchange: "AllTick",
//             minmov: 1,
//             pricescale: 100,
//             has_intraday: true,
//             supported_resolutions: ["1", "5", "15", "60", "1D"],
//             volume_precision: 2,
//             data_status: "streaming"
//           });
//         }, 0);
//       },

//       getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback) => {
//         try {

//           const resolutionMap = {
//             "1": "1",
//             "5": "5",
//             "15": "8",
//             "60": "10",
//             "1D": "13"
//           };

//           const klineType = resolutionMap[resolution] || "8";

//           const queryPayload = {
//             data: {
//               code: symbolInfo.name,
//               kline_type: klineType,
//               kline_timestamp_end: 0,
//               query_kline_num: 300,
//               adjust_type: 0
//             }
//           };

//           const url =
//             CORS_PROXY +
//             encodeURIComponent(
//               `${ALLTICK_KLINE}?token=${TOKEN}&query=${JSON.stringify(queryPayload)}`
//             );

//           const response = await axios.get(url);
//           const raw = response.data?.data?.kline_list;

//           if (!raw || raw.length === 0) {
//             onHistoryCallback([], { noData: true });
//             return;
//           }

//           const bars = raw.map(candle => ({
//             time: alignTimeToResolution(
//               Number(candle.timestamp) * 1000,
//               resolution
//             ),
//             open: Number(candle.open_price),
//             high: Number(candle.high_price),
//             low: Number(candle.low_price),
//             close: Number(candle.close_price),
//             volume: Number(candle.volume)
//           }));

//           onHistoryCallback(bars, { noData: false });

//         } catch (error) {
//           console.error("getBars error:", error);
//           onHistoryCallback([], { noData: true });
//         }
//       },

//       subscribeBars: (
//         symbolInfo,
//         resolution,
//         onRealtimeCallback
//       ) => {

//         let currentBar = null;

//         const ws = new WebSocket(
//           `wss://quote.alltick.co/quote-b-ws-api?token=${TOKEN}`
//         );

//         ws.onopen = () => {
//           console.log("WebSocket connected to AllTick");

//           // send subscription message
//           ws.send(JSON.stringify({
//             cmd_id: 22002,
//             seq_id: 1,
//             trace: uuidv4(),
//             data: {
//               symbol_list: [
//                 {
//                   code: symbolInfo.name,
//                   depth_level: 1
//                 }
//               ]
//             }
//           }));
//         };

//         ws.onmessage = (event) => {
//           const msg = JSON.parse(event.data);

//           // AllTick pushes tick data with trade price
//           const tickPrice = Number(msg?.data?.last_price);
//           const tickTime = msg?.data?.last_time;

//           if (!tickPrice || !tickTime) {
//             return;
//           }

//           const bucketTime =
//             alignTimeToResolution(tickTime, resolution);

//           if (!currentBar || currentBar.time !== bucketTime) {
//             currentBar = {
//               time: bucketTime,
//               open: tickPrice,
//               high: tickPrice,
//               low: tickPrice,
//               close: tickPrice,
//               volume: 0
//             };
//           } else {
//             currentBar.high = Math.max(currentBar.high, tickPrice);
//             currentBar.low = Math.min(currentBar.low, tickPrice);
//             currentBar.close = tickPrice;
//           }

//           onRealtimeCallback(currentBar);
//         };

//         ws.onerror = (err) => {
//           console.error("WebSocket error:", err);
//         };

//         Datafeed._ws = ws;
//       },

//       unsubscribeBars: () => {
//         if (Datafeed._ws) {
//           Datafeed._ws.close();
//         }
//       }
//     };

//     const widget = new window.TradingView.widget({
//       symbol: "BTCUSDT",
//       interval: "1",
//       container: chartRef.current,
//       datafeed: Datafeed,
//       library_path: "/charting_library/",
//       locale: "en",
//       disabled_features: [
//         "use_localstorage_for_settings",
//         "study_templates",
//         "header_saveload"
//       ],
//       fullscreen: false,
//       autosize: true
//     });

//     return () => widget.remove();

//   }, []);

//   return (
//     <div
//       ref={chartRef}
//       style={{ width: "100%", height: "700px" }}
//     />
//   );
// }

// export default All_Tick_Chart;


// --------------------------------------------------------------------------------------------------------------------------