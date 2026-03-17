import express from "express";
import XAUUSD from "../models/XAUUSD.js";

const router = express.Router();

/* ===============================
   GET Candles with Filtering
================================ */
export const getCandles = async (req, res) => {
  try {
    const { timeframe = "1m", from, to, symbol } = req.query;

    const query = {
      symbol: symbol || "XAUUSD.i",
      timeframe,
    };

    if (from && to) {
      query.time = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const candles = await XAUUSD.find(query)
      .sort({ time: 1 })
      .lean();   // ✅ removed limit(1000)

    // console.log(`📊 Returning ${candles.length} candles from DB`);

    res.json({
      success: true,
      data: candles,
    });

  } catch (error) {
    console.log("❌ Error in getCandles:", error.message);
    res.status(500).json({ success: false });
  }
};


/* ===============================
   SAVE LIVE CANDLE (UPSERT)
================================ */
export const saveCandle = async (req, res) => {
  try {
    const candle = req.body;

    const result = await XAUUSD.findOneAndUpdate(
      {
        symbol: candle.symbol,
        timeframe: candle.timeframe,
        time: new Date(candle.time),
      },
      {
        ...candle,
        time: new Date(candle.time),
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    console.log("💾 XAUUSD candle saved:", result.time);

    res.json({ success: true });

  } catch (error) {
    console.log("❌ Error in saveCandle:", error.message);
    res.status(500).json({ success: false });
  }
};


router.get("/latest", async (req, res) => {
  try {

    const candle = await XAUUSD
      .find({ symbol: "XAUUSD.i", timeframe: "1m" })
      .sort({ time: -1 })
      .limit(1)
      .lean();

    res.json(candle);

  } catch (error) {
    console.log("❌ Error fetching latest candle:", error.message);
    res.status(500).json({ success: false });
  }
});


/* ===============================
   ROUTES
================================ */

router.get("/", getCandles);
router.get("/all", getCandles); // added earlier
router.post("/save", saveCandle);

/* ===============================
   HANDLE REAL-TIME TICKS (From MetaAPI Streamer)
================================ */
let tickCounter = 0;
let lastTickTime = null;

export const handleTick = async (req, res, io) => {
  try {
    const { symbol, bid, ask, time, volume } = req.body;

    if (!bid || !ask || !symbol) {
      console.warn('[XAUUSD-Tick] ❌ Invalid tick data:', req.body);
      return res.status(400).json({ success: false, error: 'Missing tick data' });
    }

    tickCounter++;
    lastTickTime = time;

    // ✅ Log every 100th tick to monitor data flow
    if (tickCounter % 100 === 0) {
      console.log(`[XAUUSD-Tick] ✅ Received ${tickCounter} ticks | Latest: ${symbol} bid=${bid} ask=${ask} @ ${new Date(time).toISOString()}`);
    }

    // ✅ VALIDATE timestamp to ensure we're getting current data
    let timeMs = time;
    if (typeof timeMs === 'string') {
      timeMs = new Date(timeMs).getTime();
    } else if (typeof timeMs === 'number' && timeMs < 10000000000) {
      timeMs = timeMs * 1000;
    }

    const now = Date.now();
    const timeDiff = now - timeMs;
    
    // Warn if tick is more than 5 seconds old
    if (timeDiff > 5000) {
      console.warn(`[XAUUSD-Tick] ⚠️  Stale tick: ${(timeDiff / 1000).toFixed(1)}s old`);
    }

    // ✅ BROADCAST tick immediately to all connected chart clients via WebSocket
    if (io) {
      const receivedClients = io.to('prices').emit('tickUpdate', {
        symbol: symbol,
        bid: parseFloat(bid),
        ask: parseFloat(ask),
        time: timeMs,  // Use converted milliseconds
        volume: volume || 0,
        mid: (parseFloat(bid) + parseFloat(ask)) / 2,
        timestamp: now
      });

      // Log broadcast confirmation
      if (tickCounter % 100 === 0) {
        console.log(`[XAUUSD-Tick] 📡 Broadcasted to 'prices' room`);
      }
    } else {
      console.error('[XAUUSD-Tick] ❌ Socket.IO not available!');
    }

    // Fast response - don't wait for broadcast completion
    res.json({ success: true, tickCount: tickCounter });

  } catch (error) {
    console.error('[XAUUSD-Tick] ❌ Error handling tick:', error.message);
    console.error(error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post("/tick", (req, res) => {
  // Pass io from app context
  const io = req.app.get('io');
  if (!io) {
    console.error('[XAUUSD-Tick] ❌ Socket.IO not available in app context!');
    return res.status(500).json({ success: false, error: 'Socket.IO not initialized' });
  }
  handleTick(req, res, io);
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: 'ok',
    ticks: tickCounter,
    lastTick: lastTickTime ? new Date(lastTickTime).toISOString() : 'none'
  });
});

export default router;