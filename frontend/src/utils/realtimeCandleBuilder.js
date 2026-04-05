const LONG_GAP_MS = 45 * 60 * 1000;
const ALLOWED_TIME_SKEW_MS = 1500;

export const toEventTimeMs = (rawTime) => {
  if (typeof rawTime === 'number') {
    if (!Number.isFinite(rawTime) || rawTime <= 0) return NaN;
    return rawTime < 10000000000 ? rawTime * 1000 : rawTime;
  }

  if (typeof rawTime === 'string') {
    const parsed = Date.parse(rawTime);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  return NaN;
};

export const getRealtimeSpikeThresholdPercent = (symbol = '') => {
  const upper = String(symbol).toUpperCase();

  if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('BNB') || upper.includes('SOL') || upper.includes('XRP') || upper.includes('ADA') || upper.includes('DOGE') || upper.includes('LTC')) {
    return 20;
  }

  if (upper.includes('XAU') || upper.includes('XAG') || upper.includes('OIL') || upper.includes('NGAS') || upper.includes('COPPER') || upper.includes('US30') || upper.includes('US100') || upper.includes('US500') || upper.includes('UK100') || upper.includes('ES35')) {
    return 5;
  }

  return 3;
};

export const isAbnormalJump = ({ symbol, nextPrice, referencePrice, elapsedMs, thresholdPct }) => {
  if (!Number.isFinite(nextPrice) || !Number.isFinite(referencePrice) || referencePrice <= 0) return false;
  if (Number.isFinite(elapsedMs) && elapsedMs > LONG_GAP_MS) return false;

  const maxJumpPct = Number.isFinite(thresholdPct)
    ? thresholdPct
    : getRealtimeSpikeThresholdPercent(symbol);
  const jumpPct = Math.abs((nextPrice - referencePrice) / referencePrice) * 100;
  return jumpPct > maxJumpPct;
};

export const validateRealtimeTick = ({ symbol, bid, ask, time, state }) => {
  const numericBid = Number(bid);
  const numericAsk = Number(ask);
  const hasBid = Number.isFinite(numericBid) && numericBid > 0;
  const hasAsk = Number.isFinite(numericAsk) && numericAsk > 0;
  if (!symbol || !hasBid || !hasAsk) {
    return { accepted: false, reason: 'invalid_price' };
  }

  const tickTime = toEventTimeMs(time) || Date.now();
  const mid = (numericBid + numericAsk) / 2;
  const previousMid = state?.lastMid;
  const previousTime = state?.lastTime || 0;

  if (Number.isFinite(previousTime) && tickTime + ALLOWED_TIME_SKEW_MS < previousTime) {
    return { accepted: false, reason: 'out_of_order_tick', tickTime, mid };
  }

  if (
    Number.isFinite(previousMid) &&
    isAbnormalJump({
      symbol,
      nextPrice: mid,
      referencePrice: previousMid,
      elapsedMs: Math.max(0, tickTime - previousTime)
    })
  ) {
    return { accepted: false, reason: 'abnormal_jump', tickTime, mid };
  }

  return {
    accepted: true,
    tickTime,
    mid,
    bid: numericBid,
    ask: numericAsk
  };
};

export const validateRealtimeBar = ({ symbol, bar, previousBar }) => {
  if (!bar) return { accepted: false, reason: 'missing_bar' };

  const nextBar = {
    time: Number(bar.time),
    open: Number(bar.open),
    high: Number(bar.high),
    low: Number(bar.low),
    close: Number(bar.close),
    volume: Number.isFinite(Number(bar.volume)) ? Number(bar.volume) : 0
  };

  if (![nextBar.time, nextBar.open, nextBar.high, nextBar.low, nextBar.close].every(Number.isFinite)) {
    return { accepted: false, reason: 'invalid_ohlc' };
  }

  nextBar.high = Math.max(nextBar.high, nextBar.open, nextBar.close, nextBar.low);
  nextBar.low = Math.min(nextBar.low, nextBar.open, nextBar.close, nextBar.high);

  if (previousBar?.time && nextBar.time < previousBar.time) {
    return { accepted: false, reason: 'stale_bar' };
  }

  const previousClose = Number(previousBar?.close);
  const previousTime = Number(previousBar?.time) || 0;
  if (
    Number.isFinite(previousClose) &&
    isAbnormalJump({
      symbol,
      nextPrice: nextBar.close,
      referencePrice: previousClose,
      elapsedMs: Math.max(0, nextBar.time - previousTime)
    })
  ) {
    return { accepted: false, reason: 'abnormal_bar' };
  }

  return { accepted: true, bar: nextBar };
};

export const buildCandleFromTick = ({ currentBar, tickPrice, tickTime, resolutionMs, symbol }) => {
  if (!Number.isFinite(tickPrice) || tickPrice <= 0) {
    return { accepted: false, reason: 'invalid_tick_price' };
  }

  if (!Number.isFinite(tickTime) || tickTime <= 0 || !Number.isFinite(resolutionMs) || resolutionMs <= 0) {
    return { accepted: false, reason: 'invalid_timeframe' };
  }

  const bucketTime = Math.floor(tickTime / resolutionMs) * resolutionMs;

  if (currentBar && Number.isFinite(currentBar.time) && bucketTime < currentBar.time) {
    return { accepted: false, reason: 'out_of_order_bucket', bucketTime };
  }

  if (!currentBar) {
    const seed = {
      time: bucketTime,
      open: tickPrice,
      high: tickPrice,
      low: tickPrice,
      close: tickPrice,
      volume: 1
    };
    return { accepted: true, bar: seed, isNewBar: true, bucketTime };
  }

  const previousClose = Number(currentBar.close);
  if (
    Number.isFinite(previousClose) &&
    isAbnormalJump({
      symbol,
      nextPrice: tickPrice,
      referencePrice: previousClose,
      elapsedMs: Math.max(0, tickTime - currentBar.time)
    })
  ) {
    return { accepted: false, reason: 'abnormal_tick_jump', bucketTime };
  }

  if (bucketTime > currentBar.time) {
    const open = Number.isFinite(previousClose) ? previousClose : tickPrice;
    const nextBar = {
      time: bucketTime,
      open,
      high: Math.max(open, tickPrice),
      low: Math.min(open, tickPrice),
      close: tickPrice,
      volume: 1
    };
    return { accepted: true, bar: nextBar, isNewBar: true, bucketTime };
  }

  const nextBar = {
    ...currentBar,
    high: Math.max(Number(currentBar.high), tickPrice),
    low: Math.min(Number(currentBar.low), tickPrice),
    close: tickPrice,
    volume: (Number(currentBar.volume) || 0) + 1
  };

  return { accepted: true, bar: nextBar, isNewBar: false, bucketTime };
};