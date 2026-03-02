
import MetaApi, { SynchronizationListener } from "metaapi.cloud-sdk";

const token = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiXSwicmVzb3VyY2VzIjpbImFjY291bnQ6JFVTRVJfSUQkOmI2NjhiOWI4LTU5NGUtNDc4OS1hODdkLTE1ODYwNDBkMDg0ZCJdfSx7ImlkIjoibWV0YWFwaS1yZXN0LWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19LHsiaWQiOiJtZXRhYXBpLXJwYy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFzdGF0cy1hcGkiLCJtZXRob2RzIjpbIm1ldGFzdGF0cy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImlhdCI6MTc3MDYzNTE4OX0.OtP0Fw4z0HzLKRqfasbRM3XvdquMBROjRD75QNqVfhMby1610fAlb95yG7H8WX_EhxFUXFVTEXOOCPumDCeCpFI0NAL-eGOiA6CgbXAPB5RjB95qCPamzub6MaK8c-ZWlkntrRekQgVu-vtYUsaTvC-1ZKY9Qcv4X4o7kesbiF373EXGdDyHD59i3p3FVkaVBT424jN8tA-qbBq7DPO6I_78P3U-Xg5tEQasam6LKG9UkJtMwi8CZMhL8Xtx63gb1phc0egXUhZQtfwyg7hQvdwFfV2fU8-vnVjZ_oq2kV8vg5Jk1mtyslfUmdHWeUJTFQ5QNWA5w1NDqwECsofPvGPqRMQmUOw6FQEpc9NpsRazOQ9Y_1c2FPGanrA-AbLopd8DpOCuok6LCFCWAtytkIyset9QTH6qMQyhJAHnxitIHqQhHp_5wbiGtZ0q1JC80cHGwd25F0nkrJt0wpF2CTpAhREC2tHnCDw2irbvFlfPLM_CTWKKTwb6TsaUPCRn6QEXkRKSQJSLozmtENsoah0nsbZN7jUYxR4WpOTu2b4Pswm1SY8cdC2TC2KCKLgDWVk7wsf_EQcXgmgrDXKthitNO5M5tldADVH_V6xr70Y3mfPXM-2kDVS5z4ikG_YleRFxjHeRSquooqTRD8SNRur38v-XFa9cbdmbxhfYj8U";
const accountId = "b668b9b8-594e-4789-a87d-1586040d084d";
const region = "london";

const SYMBOL = "XAUUSD.i";
const BACKEND = "http://localhost:5001/api/xauusd";

let api, account, connection, listener;

// Convert TradingView resolution → MetaAPI timeframe
const convertResolution = (res) => {
  const map = {
    "1": "1m",
    "5": "5m",
    "15": "15m",
    "30": "30m",
    "60": "1h",
    "D": "1d",
  };
  return map[res] || "1m";
};

async function init() {
  if (!api) {
    api = new MetaApi(token); // ❌ NO REGION HERE

    account = await api.metatraderAccountApi.getAccount(accountId);

    console.log("🌍 Account region:", account.region);

    connection = account.getStreamingConnection();

    await connection.connect();
    await connection.waitSynchronized();

    console.log("✅ MetaAPI connected successfully");
  }
}

export default {

  onReady: (cb) => {
    setTimeout(() => {
      cb({
        supported_resolutions: ["1", "5", "15", "30", "60", "D"],
      });
    }, 0);
  },

  resolveSymbol: (symbolName, onResolve) => {
    setTimeout(() => {
      onResolve({
        name: SYMBOL,
        ticker: SYMBOL,
        full_name: SYMBOL,
        description: "XAUUSD",
        type: "forex",
        session: "24x7",
        timezone: "Etc/UTC",
        exchange: "MetaAPI",
        listed_exchange: "MetaAPI",
        format: "price",
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        visible_plots_set: "ohlc",
        supported_resolutions: ["1", "5", "15", "30", "60", "D"],
      });
    }, 0);
  },

  // 🔥 HISTORY FROM MONGO
  getBars: async (
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback
  ) => {
    try {
      const timeframe = convertResolution(resolution);

      const from = new Date(periodParams.from * 1000);
      const to = new Date(periodParams.to * 1000);

      const response = await fetch(
        `${BACKEND}?timeframe=${timeframe}&from=${from.toISOString()}&to=${to.toISOString()}`
      );

      const result = await response.json();

      if (!result.success || !result.data.length) {
        onHistoryCallback([], { noData: true });
        return;
      }

      const bars = result.data.map((c) => ({
        time: new Date(c.time).getTime(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      bars.sort((a, b) => a.time - b.time);

      console.log("📊 Loaded candles from Mongo:", bars.length);

      onHistoryCallback(bars, { noData: false });

    } catch (err) {
      console.log("❌ History error:", err.message);
      onErrorCallback(err);
    }
  },

  // 🔥 LIVE STREAM + SAVE TO DB
  subscribeBars: async (
    symbolInfo,
    resolution,
    onRealtimeCallback
  ) => {
    await init();

    const timeframe = convertResolution(resolution);

    await connection.subscribeToMarketData(SYMBOL, [
      { type: "candles", timeframe },
    ]);

    listener = new (class extends SynchronizationListener {
      async onCandlesUpdated(_, candles) {
        if (!candles?.length) return;

        const c = candles[candles.length - 1];

        if (c.symbol !== SYMBOL) return;

        const bar = {
          time: new Date(c.time).getTime(),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        };

        // 🔥 Update TradingView instantly
        onRealtimeCallback(bar);

        // 🔥 Save to Mongo
        await fetch(`${BACKEND}/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: SYMBOL,
            timeframe,
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }),
        });

        console.log("💾 XAUUSD candle stored:", c.time);
      }
    })();

    connection.addSynchronizationListener(listener);
  },

  unsubscribeBars: () => {
    if (connection && listener) {
      connection.removeSynchronizationListener(listener);
      console.log("🛑 Unsubscribed from live stream");
    }
  },
};