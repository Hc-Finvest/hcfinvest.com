import express from "express";
import axios from "axios";

const router = express.Router();

const resolutionMap = {
  "1": "1m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "240": "4h",
  "1D": "1d",
};

router.get("/history", async (req, res) => {
  try {
    const { symbol, resolution, from, to } = req.query;

    const interval = resolutionMap[resolution];

    const response = await axios.get(
      "https://api.binance.com/api/v3/klines",
      {
        params: {
          symbol,
          interval,
          startTime: from * 1000,
          endTime: to * 1000,
          limit: 1000,
        },
      }
    );

    const bars = response.data.map(k => ({
      time: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    res.json(bars);

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch Binance data" });
  }
});

export default router;