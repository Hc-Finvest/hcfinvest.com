import express from "express";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import XAUUSD from "../models/XAUUSD.js";

const router = express.Router();

// 🔥 Configure Multer
const upload = multer({
  dest: "uploads/",
});

// 🔥 Upload API
router.post("/upload-csv", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;

    const candles = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const dateTimeString = `${row["<DATE>"]} ${row["<TIME>"]}`;
        const formattedDate = new Date(
          dateTimeString.replace(/\./g, "-")
        );

        candles.push({
          symbol: "XAUUSD.i",
          timeframe: "1m",
          time: formattedDate,
          open: parseFloat(row["<OPEN>"]),
          high: parseFloat(row["<HIGH>"]),
          low: parseFloat(row["<LOW>"]),
          close: parseFloat(row["<CLOSE>"]),
          tickVolume: parseInt(row["<TICKVOL>"]),
          volume: parseInt(row["<VOL>"]),
          spread: parseInt(row["<SPREAD>"]),
        });
      })
      .on("end", async () => {
        try {
          await XAUUSD.insertMany(candles, { ordered: false });

          fs.unlinkSync(filePath); // delete uploaded file

          console.log("🔥 CSV Imported:", candles.length);

          res.json({
            success: true,
            inserted: candles.length,
          });
        } catch (error) {
          console.log("❌ Insert Error:", error.message);
          res.status(500).json({ success: false });
        }
      });

  } catch (error) {
    console.log("❌ Upload Error:", error.message);
    res.status(500).json({ success: false });
  }
});

export default router;