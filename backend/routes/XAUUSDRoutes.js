// xauusd_Routes.js

import express from "express";
import XAUUSD from "../models/XAUUSD.js";

const xauusd_Routes = express.Router();

// 🔥 Debug
console.log("Model type:", typeof XAUUSD);
console.log("Model value:", XAUUSD);

// ==========================
// Insert Single Candle
// ==========================
const insertCandle = async (req, res) => {
  try {
    console.log("📥 Candle Received:", req.body.time);

    const candle = await XAUUSD.create(req.body);

    console.log("✅ Candle Saved:", candle.time);

    return res.status(201).json({
      success: true,
      message: "Candle inserted",
      data: candle,
    });

  } catch (error) {

    if (error.code === 11000) {
      console.log("⚠️ Duplicate candle skipped");
      return res.status(200).json({
        success: false,
        message: "Duplicate candle skipped",
      });
    }

    console.log("❌ Insert Error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Insert Many Candles
// ==========================
const insertManyCandles = async (req, res) => {
  try {
    const candles = await XAUUSD.insertMany(req.body, {
      ordered: false,
    });

    return res.status(201).json({
      success: true,
      message: "Bulk candles inserted",
      count: candles.length,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==========================
// Get All Candles
// ==========================
const getAllCandles = async (req, res) => {
  try {
    const candles = await XAUUSD.find({})
      .sort({ time: 1 })
      .lean();

    return res.status(200).json(candles);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}; +
// ==========================
// Routes
// ==========================
xauusd_Routes.post("/insert", insertCandle);
xauusd_Routes.post("/insert-many", insertManyCandles);
xauusd_Routes.get("/all", getAllCandles);

export default xauusd_Routes;