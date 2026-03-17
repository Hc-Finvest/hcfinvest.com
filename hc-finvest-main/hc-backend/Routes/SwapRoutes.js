import express from "express";
import {
  addSwap,
  getCurrencyPairsByMarket,
  getSwapsByMarketType,
  updateSwap
} from "../Controllers/SwapController.js";

const router = express.Router();

router.post("/", addSwap); // POST /api/swaps
router.get("/currencyPairs/:marketType", getCurrencyPairsByMarket);
router.put("/update", updateSwap);
router.get("/:marketType", getSwapsByMarketType);

// router.post("/add", addSwap);
// router.put("/update", updateSwap);
// router.post("/save", saveSwap); // Upsert

export default router;
