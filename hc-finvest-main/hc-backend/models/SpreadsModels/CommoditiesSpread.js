import mongoose from "mongoose";

const commoditiesSchema = new mongoose.Schema({
  marketType: String,
  accountType: String,
  currencyPair: String,
  avgSpread: Number,
  lowSpread: Number,
  leverageType: String,
});

export default mongoose.model(
  "CommoditiesSpread",
  commoditiesSchema,
  "commoditiesSpreads"
);
