import express from "express";
import axios from "axios";

const router = express.Router();

// GET historical candles
router.get("/history", async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;

    // Map TradingView resolution → AllTick interval
    const intervalMap = {
      "1": "1m",
      "5": "5m",
      "15": "15m",
      "60": "1h",
      "1D": "1d"
    };

    const interval = intervalMap[resolution] || "15m";

    const response = await axios.get(
      `https://api.alltick.co/market/${symbol}/kline`,
      {
        params: {
          interval,
          start: from,
          end: to
        }
      }
    );

    // Normalize data for frontend
    const candles = response.data.map(c => ({
      time: c.time,          // seconds
      open: parseFloat(c.open),
      high: parseFloat(c.high),
      low: parseFloat(c.low),
      close: parseFloat(c.close),
      volume: parseFloat(c.volume)
    }));

    res.json(candles);
  } catch (error) {
    console.error("History fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;