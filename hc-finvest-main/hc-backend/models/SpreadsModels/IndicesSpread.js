import mongoose from "mongoose";

const indicesSchema = new mongoose.Schema({
  marketType: String,
  accountType: String,
  currencyPair: String,
  avgSpread: Number,
  lowSpread: Number,
  leverageType: String,
});

export default mongoose.model("IndicesSpread", indicesSchema, "indicesSpreads");
