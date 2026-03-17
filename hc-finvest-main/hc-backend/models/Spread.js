// models/Spread.js
import mongoose from "mongoose";

const spreadSchema = new mongoose.Schema(
  {
    marketType: {
      type: String,
      required: true,
      enum: [
        "Forex",
        "Metals",
        "Indices",
        "Stocks",
        "Commodities",
        "Cryptocurrencies",
      ],
    },
    accountType: {
      type: String,
      required: true,
      enum: ["Starter", "ProTrader", "ZeroSpread", "Elite"],
    },
    currencyPair: {
      type: String,
      required: true,
      trim: true,
    },
    avgSpread: {
      type: Number,
      required: true,
    },
    lowSpread: {
      type: Number,
      required: true,
    },
    leverageType: {
      type: String,
      required: true,
      enum: ["1:100", "1:2000"],
    },
  },
  { timestamps: true }
);

const Spread = mongoose.model("Spread", spreadSchema);

export default Spread;
