/**
 * candleAggregator.js
 * Utility to synthesize higher timeframe candles from 1-minute raw data.
 */

const MARKET_SESSIONS = {
  FOREX: { type: 'FOREX', is247: false, openDayUTC: 0, openHourUTC: 22, closeDayUTC: 5, closeHourUTC: 22 },
  CRYPTO: { type: 'CRYPTO', is247: true }
};

const getSymbolConfig = (symbol) => {
  if (!symbol) return MARKET_SESSIONS.CRYPTO;
  const upper = String(symbol).toUpperCase();
  if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('BNB') || upper.includes('SOL') || upper.includes('XRP') || upper.includes('ADA') || upper.includes('DOGE') || upper.includes('LTC')) {
    return MARKET_SESSIONS.CRYPTO;
  }
  return MARKET_SESSIONS.FOREX;
};

export const isMarketOpen = (timestamp, symbol) => {
  const config = getSymbolConfig(symbol);
  if (config.is247) return true;

  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const decimalHour = date.getUTCHours() + (date.getUTCMinutes() / 60);

  if (config.type === 'FOREX') {
    if (day === 6) return false;
    if (day === config.closeDayUTC && decimalHour >= config.closeHourUTC) return false;
    if (day === config.openDayUTC && decimalHour < config.openHourUTC) return false;
    return true;
  }
  return true;
};

export const filterClosedMarketCandles = (candles, symbol) => {
  if (!candles || !Array.isArray(candles)) return [];
  return candles.filter(c => isMarketOpen(c.time, symbol));
};

/**
 * Aggregates 1-minute candles into a larger timeframe with gap filling.
 * This is the "Iterative Bucket" approach which guarantees continuity.
 * @param {Array} candles1m - Array of {time, open, high, low, close, volume}
 * @param {number} timeframeMinutes - The target timeframe in minutes
 * @param {string} symbol - Optional symbol for market hours filtering
 * @returns {Array} Continuous aggregated candles
 */
export const aggregateToTimeframe = (candles1m, timeframeMinutes, symbol = null) => {
  if (!candles1m || candles1m.length === 0) return [];
  const intervalMs = timeframeMinutes * 60 * 1000;
  if (timeframeMinutes <= 1) return candles1m;

  // 1. Sort to ensure we iterate forward
  const sorted = [...candles1m].sort((a, b) => a.time - b.time);

  // 2. Identify start and end "buckets"
  const startBucket = Math.floor(sorted[0].time / intervalMs) * intervalMs;
  const endBucket = Math.floor(sorted[sorted.length - 1].time / intervalMs) * intervalMs;

  const result = [];
  let i = 0;
  let lastClose = sorted[0].close;

  // 3. Iterate through every single time bucket
  for (let t = startBucket; t <= endBucket; t += intervalMs) {
    let open = null;
    let high = -Infinity;
    let low = Infinity;
    let close = null;
    let volume = 0;
    let found = false;

    // Collect all 1m candles that fit in this target timeframe bucket
    while (i < sorted.length && sorted[i].time < t + intervalMs) {
      const c = sorted[i];
      if (open === null) open = c.open;
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      close = c.close;
      volume += (Number(c.volume) || 0);
      found = true;
      i++;
    }

    if (!found) {
      // 🔥 THE FIX: Gap found in 1m source for this timeframe bucket
      // We fill with the last known price to prevent chart disconnects.
      // EXCEPTION: Do not fill if market is closed!
      if (isMarketOpen(t, symbol)) {
        open = high = low = close = lastClose;
        volume = 0;
      } else {
        // Skip emitting this aggregated candle because the market is closed
        continue;
      }
    }

    result.push({
      time: t,
      open,
      high,
      low,
      close,
      volume
    });

    lastClose = close;
  }

  return result;
};

/**
 * Fills historical data gaps with "flat" candles.
 * Ensures the chart line is continuous even when no trading occurred.
 * @param {Array} candles - Array of {time, open, high, low, close, volume}
 * @param {number} intervalMinutes - Time interval in minutes
 * @param {string} symbol - The symbol to check for market hours
 * @returns {Array} Continuous candles
 */
export const fillGaps = (candles, intervalMinutes, symbol = null) => {
  if (!candles || candles.length < 2) return candles;
  
  const intervalMs = intervalMinutes * 60 * 1000;
  const filled = [];
  
  // Ensure data is sorted by time before processing
  const sorted = [...candles].sort((a, b) => a.time - b.time);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    filled.push(current);

    let currentTime = current.time;
    const nextTime = next.time;

    // Detect and fill gaps larger than 1.5x the interval (to allow for minor jitter)
    // but typically it should be exactly intervalMs.
    // Skip only truly huge gaps (>7 days) to avoid massive synthetic backfills.
    const gapMs = nextTime - currentTime;
    
    if (gapMs > intervalMs * 1.5 && gapMs < (7 * 24 * 60 * 60 * 1000)) {
      //Sanket v2.0 - Use bucket-aligned fill to prevent overshoot: stop BEFORE the next real candle's bucket
      const nextBucket = Math.floor(nextTime / intervalMs) * intervalMs;
      let fillTime = Math.floor(currentTime / intervalMs) * intervalMs + intervalMs;
      while (fillTime < nextBucket) {
        if (isMarketOpen(fillTime, symbol)) {
          filled.push({
            time: fillTime,
            open: current.close,
            high: current.close,
            low: current.close,
            close: current.close,
            volume: 0,
            isFilled: true
          });
        }
        fillTime += intervalMs;
      }
    }
  }

  // Push the last candle
  filled.push(sorted[sorted.length - 1]);

  return filled;
};

/**
 * Validates the continuity of a candle dataset.
 * Logs warnings if any gaps are found.
 * @param {Array} candles - Sorted array of candles
 * @param {number} intervalMinutes - Expected interval in minutes
 * @returns {boolean} True if continuous, false if gaps exist
 */
export const validateContinuity = (candles, intervalMinutes) => {
  if (!candles || candles.length < 2) return true;
  const intervalMs = intervalMinutes * 60 * 1000;
  let gapCount = 0;

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].time - candles[i - 1].time;
    // We allow a small 10% jitter but anything larger is a gap
    if (diff > intervalMs * 1.1) {
      gapCount++;
      if (gapCount < 5) { // Log first few gaps to avoid console spam
        console.warn(`[Continuity] ⚠️ GAP DETECTED: ${Math.round(diff / 60000)}m gap between ${new Date(candles[i-1].time).toISOString()} and ${new Date(candles[i].time).toISOString()}`);
      }
    }
  }

  if (gapCount > 0) {
    console.warn(`[Continuity] Total gaps found in ${intervalMinutes}m dataset: ${gapCount}`);
    return false;
  }
  return true;
};

/**
 * Incrementally updates a candle list with a new price tick.
 * This is used for "Proactive Tier Sync" to avoid re-aggregating full history.
 * @param {Array} candles - Current candle list
 * @param {Object} tick - { price, time }
 * @param {number} timeframeMinutes - Timeframe in minutes
 * @returns {Array} Updated candle list
 */
export const updateCandleListWithTick = (candles, tick, timeframeMinutes, symbol = null) => {
  if (!candles) return [];
  if (!tick || !tick.price) return candles;

  const intervalMs = timeframeMinutes * 60 * 1000;
  const tickTime = typeof tick.time === 'number' ? tick.time : new Date(tick.time).getTime();
  const tickPrice = parseFloat(tick.price);
  const bucketTime = Math.floor(tickTime / intervalMs) * intervalMs;

  // Drop ticks that arrive on weekends/closed market hours
  if (!isMarketOpen(tickTime, symbol)) {
    return candles;
  }

  const updated = [...candles];
  if (updated.length === 0) {
    updated.push({
      time: bucketTime,
      open: tickPrice,
      high: tickPrice,
      low: tickPrice,
      close: tickPrice,
      volume: 0
    });
    return updated;
  }

  const lastCandle = updated[updated.length - 1];

  if (lastCandle.time === bucketTime) {
    // ✍️ Update existing "Live" candle
    lastCandle.close = tickPrice;
    if (tickPrice > lastCandle.high) lastCandle.high = tickPrice;
    if (tickPrice < lastCandle.low) lastCandle.low = tickPrice;
    // Note: Volume increment depends on tick data, here we assume it's just a price update
  } else if (bucketTime > lastCandle.time) {
    //Sanket v2.0 - Snap new candle open to previous candle's close for visual continuity (no gap-up micro-jumps)
    const openPrice = lastCandle.close;
    updated.push({
      time: bucketTime,
      open: openPrice,
      high: Math.max(openPrice, tickPrice),
      low: Math.min(openPrice, tickPrice),
      close: tickPrice,
      volume: 0
    });
    
    // Maintain a reasonable buffer (e.g. 1500 candles) to avoid memory leaks
    if (updated.length > 2000) {
      updated.shift();
    }
  }

  return updated;
};
