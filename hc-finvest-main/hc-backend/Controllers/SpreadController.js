import Spread from "../models/Spread.js";
import ForexSpread from "../models/SpreadsModels/ForexSpread.js";
import MetalsSpread from "../models/SpreadsModels/MetalsSpread.js";
import IndicesSpread from "../models/SpreadsModels/IndicesSpread.js";
import StocksSpread from "../models/SpreadsModels/StocksSpread.js";
import CommoditiesSpread from "../models/SpreadsModels/CommoditiesSpread.js";
import CryptoSpread from "../models/SpreadsModels/CryptoSpread.js";
import { marketModelMap } from "../models/SpreadsModels/MarketModelMap.js";

const modelMap = {
  Forex: ForexSpread,
  Metals: MetalsSpread,
  Indices: IndicesSpread,
  Stocks: StocksSpread,
  Commodities: CommoditiesSpread,
  Cryptocurrencies: CryptoSpread,
};

export const getCurrencyPairs = async (req, res) => {
  const { marketType, accountType } = req.query;

  if (!marketType || !accountType) {
    return res
      .status(400)
      .json({ message: "marketType and accountType are required" });
  }

  try {
    const Model = marketModelMap[marketType];
    if (!Model) return res.status(400).json({ message: "Invalid market type" });

    const pairs = await Model.find({ accountType }).select("currencyPair");
    console.log("Currency Pairs from Controller" + pairs);
    res.json({ currencyPairs: pairs });
  } catch (err) {
    res.status(500).json({ message: "Error fetching currency pairs" });
  }
};

// UPDATE SPREAD RECORD
export const updateSpread = async (req, res) => {
  try {
    const {
      marketType,
      accountType,
      currencyPair,
      avgSpread,
      lowSpread,
      leverageType,
    } = req.body;

    const Model = modelMap[marketType];
    if (!Model) return res.status(400).json({ message: "Invalid market type" });

    const updated = await Model.findOneAndUpdate(
      { accountType, currencyPair },
      { avgSpread, lowSpread, leverageType },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Spread not found for update" });

    res.json({ message: "Spread updated successfully", updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating spread" });
  }
};

export const addSpread = async (req, res) => {
  try {
    const { marketType } = req.body;

    const Model = modelMap[marketType];

    if (!Model) {
      return res.status(400).json({ message: "Invalid Market Type" });
    }

    const newSpread = new Model(req.body);
    await newSpread.save();

    res
      .status(201)
      .json({ message: `${marketType} spread added`, data: newSpread });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// // ➡️ Add new spread
// export const addSpread = async (req, res) => {
//   try {
//     const spread = new Spread(req.body);
//     await spread.save();
//     res.status(201).json({ message: "Spread added successfully!", spread });
//   } catch (error) {
//     console.error("Error adding spread:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to add spread", error: error.message });
//   }
// };

// ➡️ Get all spreads
export const getSpreads = async (req, res) => {
  try {
    const spreads = await Spread.find().sort({ createdAt: -1 });
    res.status(200).json(spreads);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch spreads", error: error.message });
  }
};

// ➡️ Get single spread by ID
export const getSpreadById = async (req, res) => {
  try {
    const spread = await Spread.findById(req.params.id);
    if (!spread) return res.status(404).json({ message: "Spread not found" });
    res.status(200).json(spread);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch spread", error: error.message });
  }
};

// ➡️ Update spread
// export const updateSpread = async (req, res) => {
//   try {
//     const spread = await Spread.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//       runValidators: true,
//     });
//     if (!spread) return res.status(404).json({ message: "Spread not found" });
//     res.status(200).json({ message: "Spread updated successfully!", spread });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Failed to update spread", error: error.message });
//   }
// };

// ➡️ Delete spread
export const deleteSpread = async (req, res) => {
  try {
    const spread = await Spread.findByIdAndDelete(req.params.id);
    if (!spread) return res.status(404).json({ message: "Spread not found" });
    res.status(200).json({ message: "Spread deleted successfully!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete spread", error: error.message });
  }
};
