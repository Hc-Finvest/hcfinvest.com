import mongoose from "mongoose";

const stocksSchema = new mongoose.Schema({
  marketType: String,
  accountType: String,
  currencyPair: String,
  avgSpread: Number,
  lowSpread: Number,
  leverageType: String,
});

export default mongoose.model("StocksSpread", stocksSchema, "stocksSpreads");
