// models/BtcCandle
// const mongoose = require("mongoose");
import mongoose from "mongoose";

const btcCandleSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      default: "BTCUSD",
      index: true,
    },
    timeframe: {
      type: String, // 1m, 5m, 1h, 1d
      required: true,
      index: true,
    },
    time: {
      type: Date,
      required: true,
      index: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    tickVolume: Number,
    spread: Number,
    volume: Number,
  },
  { timestamps: true },
);

// Prevent duplicate candles
btcCandleSchema.index({ symbol: 1, timeframe: 1, time: 1 }, { unique: true });

// module.exports = mongoose.model("BtcCandle", btcCandleSchema);
export default mongoose.model("BtcCandle", btcCandleSchema);
