const { default: MetaApi, SynchronizationListener } = require('metaapi.cloud-sdk');
const fetch = (...args) =>
import('node-fetch').then(({ default: fetch }) => fetch(...args));

let api, account, connection, listener;

async function startXAUUSDStreamer() {
  // Credentials must be read INSIDE the function to ensure process.env is populated by dotenv
  const token = process.env.METAAPI_TOKEN;
  const accountId = process.env.METAAPI_ACCOUNT_ID;
  const backendUrl = process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 5001}`; // Fallback to 5001 if not set, but server.js uses app.get('PORT') or 5001 anyway
  
  console.log("🚀 Starting XAUUSD Streamer with backend URL:", backendUrl);
  
  if (!token || !accountId) {
    console.error("[Streamer] Missing MetaAPI credentials");
    return;
  }

  const SYMBOL = "XAUUSD.i";
  const BACKEND = `${backendUrl}/api/xauusd`;

  api = new MetaApi(token);

  account = await api.metatraderAccountApi.getAccount(accountId);

  connection = account.getStreamingConnection();

  await connection.connect();
  await connection.waitSynchronized();

  console.log("✅ MetaApi backend streamer started");

  await connection.subscribeToMarketData(SYMBOL, [
    { type: "candles", timeframe: "1m" }
  ]);

  listener = new (class extends SynchronizationListener {
    async onCandlesUpdated(_, candles) {
      if (!candles?.length) return;
      const c = candles[candles.length - 1];
      if (c.symbol !== SYMBOL) return;
      await fetch(`${BACKEND}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: SYMBOL,
          timeframe: "1m",
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        })
      }).catch(err => console.error(`[Streamer] Fetch error:`, err.message));
    }
  })();

  connection.addSynchronizationListener(listener);
}

module.exports = { startXAUUSDStreamer };