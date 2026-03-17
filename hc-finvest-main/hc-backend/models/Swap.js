import mongoose from "mongoose";

const swapSchema = new mongoose.Schema(
  {
    marketType: {
      type: String,
      required: true,
      trim: true,
    },
    currencyPair: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    swapLong: {
      type: Number,
      required: true,
    },
    swapShort: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Swap", swapSchema);
