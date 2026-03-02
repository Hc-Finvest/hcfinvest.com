import express from "express";
import XAUUSD from "../models/XAUUSD.js";

const xauusd_Routes = express.Router();

/* =========================================================
   🔥 GET candles with filtering
   GET /?timeframe=1m&from=...&to=...&symbol=...
========================================================= */
const getCandles = async (req, res) => {
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
      .limit(1000)
      .lean();

    console.log(`📊 Returning ${candles.length} candles from DB`);

    res.json({
      success: true,
      data: candles,
    });

  } catch (error) {
    console.log("❌ Error in getCandles:", error.message);
    res.status(500).json({ success: false });
  }
};


/* =========================================================
   🔥 SAVE LIVE CANDLE (UPSERT)
   POST /save
========================================================= */
const saveCandle = async (req, res) => {
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


/* =========================================================
   🔥 Routes (Exact Same URLs)
========================================================= */

xauusd_Routes.get("/", getCandles);
xauusd_Routes.post("/save", saveCandle);

export default xauusd_Routes;