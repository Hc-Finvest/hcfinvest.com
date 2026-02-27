import mongoose from "mongoose";

const xauusdSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true
    },
    timeframe: {
      type: String,
      required: true,
      index: true
    },
    time: {
      type: Date,
      required: true,
      index: true
    },
    open: {
      type: Number,
      required: true
    },
    high: {
      type: Number,
      required: true
    },
    low: {
      type: Number,
      required: true
    },
    close: {
      type: Number,
      required: true
    },
    tickVolume: {
      type: Number,
      default: 0
    },
    spread: {
      type: Number,
      default: 0
    },
    volume: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// 🔥 Compound index for fast chart queries
xauusdSchema.index({ symbol: 1, timeframe: 1, time: 1 }, { unique: true });

export default mongoose.model("XAUUSD", xauusdSchema);