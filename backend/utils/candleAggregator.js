/**
 * candleAggregator.js
 * Utility to synthesize higher timeframe candles from 1-minute raw data.
 */

/**
 * Aggregates 1-minute candles into a larger timeframe with gap filling.
 * This is the "Iterative Bucket" approach which guarantees continuity.
 * @param {Array} candles1m - Array of {time, open, high, low, close, volume}
 * @param {number} timeframeMinutes - The target timeframe in minutes
 * @returns {Array} Continuous aggregated candles
 */
export const aggregateToTimeframe = (candles1m, timeframeMinutes) => {
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
      // Skip emitting flat candles if the gap to the next real data point is >= 12 hours (weekend)
      if (i < sorted.length && sorted[i].time - t >= 12 * 60 * 60 * 1000) {
        // Fast-forward t to the bucket of the next real candle
        const nextRealCandleBucket = Math.floor(sorted[i].time / intervalMs) * intervalMs;
        t = nextRealCandleBucket - intervalMs; // -intervalMs because the loop will += intervalMs
        continue;
      }
      open = high = low = close = lastClose;
      volume = 0;
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
 * @returns {Array} Continuous candles
 */
export const fillGaps = (candles, intervalMinutes) => {
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

    // Skip filling if the gap is >= 12 hours (implies market closure / weekend)
    const gapMs = nextTime - currentTime;
    
    if (gapMs > intervalMs * 1.5 && gapMs < (12 * 60 * 60 * 1000)) {
      //Sanket v2.0 - Use bucket-aligned fill to prevent overshoot: stop BEFORE the next real candle's bucket
      const nextBucket = Math.floor(nextTime / intervalMs) * intervalMs;
      let fillTime = Math.floor(currentTime / intervalMs) * intervalMs + intervalMs;
      while (fillTime < nextBucket) {
        filled.push({
          time: fillTime,
          open: current.close,
          high: current.close,
          low: current.close,
          close: current.close,
          volume: 0,
          isFilled: true
        });
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
export const updateCandleListWithTick = (candles, tick, timeframeMinutes) => {
  if (!candles) return [];
  if (!tick || !tick.price) return candles;

  const intervalMs = timeframeMinutes * 60 * 1000;
  const tickTime = typeof tick.time === 'number' ? tick.time : new Date(tick.time).getTime();
  const tickPrice = parseFloat(tick.price);
  const bucketTime = Math.floor(tickTime / intervalMs) * intervalMs;

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
