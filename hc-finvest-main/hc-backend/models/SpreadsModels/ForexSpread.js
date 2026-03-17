import mongoose from "mongoose";

const spreadSchema = new mongoose.Schema({
  marketType: String,
  accountType: String,
  currencyPair: String,
  avgSpread: Number,
  lowSpread: Number,
  leverageType: String,
});

export default mongoose.model("ForexSpread", spreadSchema, "forexSpreads");
