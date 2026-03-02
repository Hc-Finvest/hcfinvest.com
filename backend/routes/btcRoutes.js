import express from "express";
// const btcCandleModel = require("../models/btcCandleModel");
import btcCandleModel from "../models/btcCandelModel.js";  

const btcRoutes = express.Router();

/* =========================================================
   🔥 GET historical candles
   GET /btc?timeframe=1m&from=...&to=...
========================================================= */
const getBtcCandles = async (req, res) => {
  try {
    const { timeframe = "1m", from, to } = req.query;

    const query = {
      symbol: "BTCUSD",
      timeframe,
    };

    if (from && to) {
      query.time = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const candles = await btcCandleModel.find(query)
      .sort({ time: 1 })
      .limit(1000);

    res.json({ success: true, data: candles });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* =========================================================
   🔥 SAVE live candle (UPSERT)
   POST /btc/save
========================================================= */
const saveLiveCandle = async (req, res) => {
  try {
    const candle = req.body;

    await btcCandleModel.findOneAndUpdate(
      {
        symbol: "BTCUSD",
        timeframe: candle.timeframe,
        time: new Date(candle.time),
      },
      candle,
      { upsert: true, new: true }
    );

    console.log("💾 Live candle saved:", candle.time);

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


/* =========================================================
   🔥 Routes (Exact Same Paths)
========================================================= */

// POST → Save candle from MetaAPI
btcRoutes.post("/btc/save", saveLiveCandle);

// GET → Fetch candles for chart
btcRoutes.get("/btc", getBtcCandles);

export default btcRoutes;