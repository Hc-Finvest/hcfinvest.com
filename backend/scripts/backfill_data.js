/**
 * //sanket - CLI tool for deep historical data backfill
 * Logic: Connects to MongoDB and triggers the iterative backfill process 
 * in StorageService for the specified symbol, timeframe, and duration.
 * 
 * Usage: node scripts/backfill_data.js [symbol] [timeframe] [days]
 * Example: node scripts/backfill_data.js XAUUSD.i 1m 30
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import storageService from '../services/storageService.js';

// Load environment variables from .env file
dotenv.config();

async function runBackfill() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const symbol = args[0] || 'XAUUSD.i';
  const timeframe = args[1] || '1m';
  const days = parseInt(args[2]) || 30;

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('[Backfill] ERROR: MONGODB_URI not found in environment');
      process.exit(1);
    }

    console.log(`[Backfill] Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log(`[Backfill] Connected.`);

    console.log(`[Backfill] Starting sync for ${symbol} (${timeframe}) - ${days} Days`);
    console.log(`[Backfill] This may take a while depending on the timeframe...`);
    
    // Execute the backfill logic in StorageService
    const count = await storageService.backfill(symbol, timeframe, days);
    
    console.log(`\n[Backfill] Sync Complete!`);
    console.log(`[Backfill] Total Candles Ingested: ${count}`);
  } catch (error) {
    console.error(`\n[Backfill] CRITICAL ERROR:`, error.message);
  } finally {
    // Ensure database connection is closed safely
    await mongoose.disconnect();
    console.log(`[Backfill] DB Connection Closed.`);
    process.exit(0);
  }
}

runBackfill();
