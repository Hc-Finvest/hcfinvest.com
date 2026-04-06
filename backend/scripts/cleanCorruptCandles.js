/**
 * cleanCorruptCandles.js
 * One-time script to delete candle records with corrupt timestamps (year > 2100).
 *
 * Root cause: storageService.storeCandles() was doing candle.time * 1000 on an
 * already-millisecond timestamp, producing timestamps in year ~53869.
 * Fixed in commit 374570bb. Run this script ONCE to purge the corrupt records.
 *
 * Usage:
 *   node backend/scripts/cleanCorruptCandles.js
 *   node backend/scripts/cleanCorruptCandles.js --dry-run   (preview only)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candle from '../models/Candle.js';

dotenv.config();

//Sanket v2.0 - Any candle with time > year 2100 was produced by the *1000 double-multiply bug
const CORRUPT_DATE_THRESHOLD = new Date('2100-01-01T00:00:00.000Z');

const isDryRun = process.argv.includes('--dry-run');

const run = async () => {
  try {
    console.log(`[CleanCorruptCandles] Connecting to MongoDB...`);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[CleanCorruptCandles] Connected.`);

    if (isDryRun) {
      const count = await Candle.countDocuments({ time: { $gt: CORRUPT_DATE_THRESHOLD } });
      console.log(`[CleanCorruptCandles] DRY RUN: Would delete ${count} corrupt candle records (time > year 2100).`);
    } else {
      console.log(`[CleanCorruptCandles] Deleting candles with time > ${CORRUPT_DATE_THRESHOLD.toISOString()}...`);
      const result = await Candle.deleteMany({ time: { $gt: CORRUPT_DATE_THRESHOLD } });
      console.log(`[CleanCorruptCandles] ✅ Deleted ${result.deletedCount} corrupt candle records.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(`[CleanCorruptCandles] ❌ Error: ${err.message}`);
    process.exit(1);
  }
};

run();
