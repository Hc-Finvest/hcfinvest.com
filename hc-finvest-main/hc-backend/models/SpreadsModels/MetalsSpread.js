import mongoose from "mongoose";

const metalsSchema = new mongoose.Schema({
  marketType: String,
  accountType: String,
  currencyPair: String,
  avgSpread: Number,
  lowSpread: Number,
  leverageType: String,
});

export default mongoose.model("MetalsSpread", metalsSchema, "metalsSpreads");
