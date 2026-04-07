import { API_URL } from "../config/api";
import { normalizeSymbol } from "../utils/symbolUtils";
import priceStreamService from "./priceStream";
import { getPriceEvents } from "./eventSystem";
import { buildCandleFromTick, validateRealtimeBar } from "../utils/realtimeCandleBuilder";
import { sanitizeBatch, validateRealtimeUpdate, getSpikeThreshold } from "../utils/chartSanitizer";

const DATAFEED_DEBUG = false;
const debugDatafeed = (...args) => {
  if (DATAFEED_DEBUG) {
    console.log(...args);
  }
};

/**
 * Custom Datafeed for TradingView Charting Library
 * Integrates with AllTick data through our optimized backend caching service.
 */

/* Event system used by TradingPage.jsx to receive live price updates */
// Moved to shared eventSystem.js to break circular dependency

const configurationData = {
  supported_resolutions: ["1", "5", "15", "30", "60", "120", "240", "1D", "1W", "1M"]
};

// //sanket - Map TradingView resolution to backend timeframe format
const formatResolution = (res) => {
  const map = {
    '1': '1m', '5': '5m', '15': '15m', '30': '30m',
    '60': '1h', '120': '2h', '240': '4h', 'D': '1d', '1D': '1d', 'W': '1w', '1W': '1w', 'M': '1M', '1M': '1M'
  };
  return map[res] || res;
};

//Sanket v2.0 - Strip .i suffix before removing non-alphanumeric so XAUUSD.i and XAUUSD both normalize to XAUUSD
//Sanket v2.0 - Strip ALL suffixes and special chars for strict normalization
const normalizeRealtimeSymbol = (value = '') => {
  if (!value) return '';
  return String(value)
    .toUpperCase()
    .replace(/\.I$/i, '')
    .replace(/\.F$/i, '')
    .replace(/\.C$/i, '')
    .replace(/[^A-Z0-9]/g, '');
};

const toMs = (rawTime) => {
  let timeMs = rawTime;
  if (typeof timeMs === 'number' && timeMs < 10000000000) {
    timeMs = timeMs * 1000;
  } else if (typeof timeMs === 'string') {
    timeMs = new Date(timeMs).getTime();
  }
  return Number.isFinite(timeMs) ? timeMs : NaN;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
};

const normalizeBars = (candles = [], symbol = '') => {
  if (!candles || candles.length === 0) return [];
  
  // 1. Basic formatting (timestamps and numbers)
  const rawBars = candles.map(c => ({
    time: toMs(c?.time),
    open: toNumber(c?.open),
    high: toNumber(c?.high),
    low: toNumber(c?.low),
    close: toNumber(c?.close),
    volume: Number.isFinite(Number(c?.volume)) ? Number(c.volume) : 0
  })).filter(b => Number.isFinite(b.time) && b.time > 0);

  // 2. Production Sanitization (Anti-Spike, OHLC correction, Sorting)
  return sanitizeBatch(rawBars, symbol);
};

const buildBootstrapBarsFromPayload = (payload = {}, symbol = '') => {
  const seedBars = [];

  if (Array.isArray(payload.recentClosed)) {
    seedBars.push(...payload.recentClosed);
  }

  if (payload.candle) {
    seedBars.push(payload.candle);
  } else if (payload.bootstrap && Number(payload.bootstrap.close) > 0) {
    const bootstrapTime = toMs(payload.bootstrap.time);
    if (Number.isFinite(bootstrapTime) && bootstrapTime > 0) {
      seedBars.push({
        time: bootstrapTime,
        open: payload.bootstrap.close,
        high: payload.bootstrap.close,
        low: payload.bootstrap.close,
        close: payload.bootstrap.close,
        volume: 0
      });
    }
  }

  const bars = normalizeBars(seedBars, symbol);
  if (bars.length === 0) return [];

  const byTime = new Map();
  bars.forEach((bar) => {
    byTime.set(bar.time, bar);
  });

  return [...byTime.values()].sort((a, b) => a.time - b.time);
};

const normalizeFeedState = (value = '') => {
  const next = String(value || '').toLowerCase();
  if (['live', 'stale', 'reconnecting', 'degraded', 'connecting', 'disconnected'].includes(next)) {
    return next;
  }
  return 'degraded';
};

const applyChartPriceModeToBar = (bar, symbol, adminSpreads, side = 'MID') => {
  if (!bar) return bar;

  // Keep historical bars raw for all chart modes. Applying retail markup at chart layer
  // causes drift versus execution prices, open-position mark prices, and header quotes.
  return bar;
};

const getChartExecutionPrice = (bid, ask, symbol, adminSpreads, side = 'MID') => {
  const numBid = Number(bid);
  const numAsk = Number(ask);

  if (side === 'BUY') {
    return numAsk;
  }

  if (side === 'SELL') {
    return numBid;
  }

  return (numBid + numAsk) / 2;
};

//Sanket v2.0 - All symbols without .i suffix
//Sanket v2.0 - Canonical Symbol Registry (Shared logic with Backend)
const SYMBOL_REGISTRY_FE = {
  'EURUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'GBPUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'USDJPY': { pricescale: 100,    session: '2200-2200:12345' },
  'USDCHF': { pricescale: 100000, session: '2200-2200:12345' },
  'AUDUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'NZDUSD': { pricescale: 100000, session: '2200-2200:12345' },
  'USDCAD': { pricescale: 100000, session: '2200-2200:12345' },
  'XAUUSD': { pricescale: 100,    session: '2200-2100:12345' },
  'XAGUSD': { pricescale: 1000,   session: '2200-2100:12345' },
  'BTCUSD': { pricescale: 100,    session: '24x7' },
  'ETHUSD': { pricescale: 100,    session: '24x7' },
  'BNBUSD': { pricescale: 100,    session: '24x7' },
  'SOLUSD': { pricescale: 100,    session: '24x7' },
  'US30':   { pricescale: 10,     session: '2200-2100:12345' },
  'US500':  { pricescale: 100,    session: '2200-2100:12345' },
  'US100':  { pricescale: 10,     session: '2200-2100:12345' },
  'UK100':  { pricescale: 10,     session: '2200-2100:12345' },
};

const ALL_SYMBOLS = [
  // Forex
  { symbol: 'EURUSD', description: 'Euro / US Dollar', type: 'forex' },
  { symbol: 'GBPUSD', description: 'Great British Pound / US Dollar', type: 'forex' },
  { symbol: 'USDJPY', description: 'US Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'USDCHF', description: 'US Dollar / Swiss Franc', type: 'forex' },
  { symbol: 'AUDUSD', description: 'Australian Dollar / US Dollar', type: 'forex' },
  { symbol: 'NZDUSD', description: 'New Zealand Dollar / US Dollar', type: 'forex' },
  { symbol: 'USDCAD', description: 'US Dollar / Canadian Dollar', type: 'forex' },
  { symbol: 'EURGBP', description: 'Euro / Great British Pound', type: 'forex' },
  { symbol: 'EURJPY', description: 'Euro / Japanese Yen', type: 'forex' },
  { symbol: 'GBPJPY', description: 'Great British Pound / Japanese Yen', type: 'forex' },
  { symbol: 'EURAUD', description: 'Euro / Australian Dollar', type: 'forex' },
  { symbol: 'EURCAD', description: 'Euro / Canadian Dollar', type: 'forex' },
  { symbol: 'EURCHF', description: 'Euro / Swiss Franc', type: 'forex' },
  { symbol: 'AUDJPY', description: 'Australian Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'CADJPY', description: 'Canadian Dollar / Japanese Yen', type: 'forex' },
  { symbol: 'CHFJPY', description: 'Swiss Franc / Japanese Yen', type: 'forex' },
  { symbol: 'GBPAUD', description: 'Great British Pound / Australian Dollar', type: 'forex' },
  { symbol: 'GBPCAD', description: 'Great British Pound / Canadian Dollar', type: 'forex' },
  { symbol: 'AUDCAD', description: 'Australian Dollar / Canadian Dollar', type: 'forex' },
  { symbol: 'NZDJPY', description: 'New Zealand Dollar / Japanese Yen', type: 'forex' },
  // Metals
  { symbol: 'XAUUSD', description: 'CFDs on Gold (US$ / OZ)', type: 'commodity' },
  { symbol: 'XAGUSD', description: 'CFDs on Silver (US$ / OZ)', type: 'commodity' },
  // Energy & Commodities
  { symbol: 'USOIL',  description: 'US Crude Oil (WTI)', type: 'commodity' },
  { symbol: 'UKOIL',  description: 'UK Brent Crude Oil', type: 'commodity' },
  { symbol: 'NGAS',   description: 'Natural Gas', type: 'commodity' },
  { symbol: 'COPPER', description: 'Copper', type: 'commodity' },
  // Indices
  { symbol: 'US30',  description: 'US Wall Street 30', type: 'index' },
  { symbol: 'US500', description: 'US S&P 500', type: 'index' },
  { symbol: 'US100', description: 'US NASDAQ 100', type: 'index' },
  { symbol: 'UK100', description: 'UK FTSE 100', type: 'index' },
  { symbol: 'ES35',  description: 'Spain 35', type: 'index' },
  // Crypto
  { symbol: 'BTCUSD', description: 'Bitcoin / US Dollar', type: 'crypto' },
  { symbol: 'ETHUSD', description: 'Ethereum / US Dollar', type: 'crypto' },
  { symbol: 'BNBUSD', description: 'Binance Coin / US Dollar', type: 'crypto' },
  { symbol: 'SOLUSD', description: 'Solana / US Dollar', type: 'crypto' },
];

const Datafeed = {
  interval: null,
  _adminSpreads: {},
  _chartPriceSide: 'MID',
  _feedStatusBySymbol: {},
  _historyMetaBySymbol: {},
  _subscribers: {},
  _priorityRefs: {},
  //Sanket v2.0 - Offset in ms between server clock and local Date.now(); set by getServerTime on each call
  _serverTimeOffsetMs: 0,

  setAdminSpreads: (spreads) => {
    Datafeed._adminSpreads = spreads || {};
    debugDatafeed('[DATAFEED] Admin spreads updated', Object.keys(Datafeed._adminSpreads).length);
  },

  setChartPriceSide: (side) => {
    Datafeed._chartPriceSide = side === 'BUY' || side === 'SELL' ? side : 'MID';
  },

  setFeedStatus: (symbol, status, meta = {}) => {
    const normalizedSymbol = normalizeRealtimeSymbol(symbol);
    if (!normalizedSymbol) return;

    const nextStatus = normalizeFeedState(status);
    const nextMeta = {
      ...(Datafeed._feedStatusBySymbol[normalizedSymbol] || {}),
      ...meta,
      symbol: normalizedSymbol,
      status: nextStatus,
      updatedAt: Date.now()
    };

    Datafeed._feedStatusBySymbol[normalizedSymbol] = nextMeta;
    try {
      getPriceEvents().dispatchEvent(new CustomEvent('chartFeedStatus', {
        detail: nextMeta
      }));
    } catch {}
  },

  getFeedStatus: (symbol) => {
    const normalizedSymbol = normalizeRealtimeSymbol(symbol);
    return Datafeed._feedStatusBySymbol[normalizedSymbol] || null;
  },

  onReady: (callback) => {
    setTimeout(() => callback(configurationData));
  },

  //Sanket v2.0 - Fixed: always call callback so TradingView countdown never hangs on network failure
  //Sanket v2.0 - Added half-RTT latency compensation so bar-close countdown matches real server time
  //Sanket v2.0 - Stores _serverTimeOffsetMs so bootstrapLiveBar uses server-aligned bucket boundaries
  getServerTime: (callback) => {
    const _fetchStart = Date.now();
    fetch(`${API_URL}/prices/time`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Number.isFinite(json.time)) {
          //Sanket v2.0 - Compensate for ~half of round-trip network latency
          const _latencyMs = (Date.now() - _fetchStart) / 2;
          const _adjustedSec = json.time + Math.round(_latencyMs / 1000);
          //Sanket v2.0 - Store server-client offset so all bucket calculations are server-time-aligned
          Datafeed._serverTimeOffsetMs = (json.time * 1000 + _latencyMs) - Date.now();
          callback(_adjustedSec);
        } else {
          callback(Math.floor(Date.now() / 1000));
        }
      })
      .catch(() => {
        //Sanket v2.0 - Always call back: TradingView bar-close countdown is broken if this never fires
        callback(Math.floor(Date.now() / 1000));
      });
  },

  // Required by TradingView — powers the built-in symbol search dialog
  searchSymbols: (userInput, _exchange, _symbolType, onResult) => {
    const query = (userInput || '').toUpperCase();
    const results = ALL_SYMBOLS
      .filter(s => s.symbol.toUpperCase().includes(query) || s.description.toUpperCase().includes(query))
      .map(s => ({
        symbol: s.symbol,
        full_name: s.symbol,
        description: s.description,
        exchange: 'AllTick',
        type: s.type,
        ticker: s.symbol,
      }));
    onResult(results);
  },

  //Sanket v2.0 - Added try/catch + onResolveErrorCallback so chart doesn't hang on bad symbols
  resolveSymbol: async (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
    try {
      // v7.77 Strict Normalization using Registry
      const cleanName = normalizeRealtimeSymbol(symbolName);
      const meta = SYMBOL_REGISTRY_FE[cleanName] || {};
      const symbolItem = ALL_SYMBOLS.find(s => s.symbol === cleanName);
      
      const pricescale = meta.pricescale || 100000;
      const defaultSession = symbolItem?.type === 'crypto'
        ? '24x7'
        : (symbolItem?.type === 'commodity' || symbolItem?.type === 'index')
          ? '2200-2100:12345'
          : '2200-2200:12345';
      const session = meta.session || defaultSession;
      
      const symbolInfo = {
        name: symbolName,
        ticker: symbolName,
        description: symbolItem ? symbolItem.description : symbolName,
        type: symbolItem ? symbolItem.type : 'forex',
        session: session, // ✅ THE FIX: Native session support
        timezone: 'Etc/UTC',
        exchange: 'AllTick',
        minmov: 1,
        pricescale: pricescale,
        has_intraday: true,
        intraday_multipliers: ['1', '5', '15', '30', '60', '120', '240'],
        has_daily: true,
        has_weekly_and_monthly: true,
        supported_resolutions: configurationData.supported_resolutions,
        volume_precision: 2,
        data_status: 'streaming'
      };
      debugDatafeed(`[v7.77] resolveSymbol: ${symbolName} using session ${session} and pricescale ${pricescale}`);
      setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
    } catch (err) {
      console.error(`[DATAFEED] resolveSymbol failed for ${symbolName}:`, err.message);
      if (onResolveErrorCallback) {
        onResolveErrorCallback(`Failed to resolve symbol: ${symbolName}`);
      }
    }
  },

  /**
   * //sanket - Fetch historical candles from our backend cache
   * CRITICAL: Returns bars with time in UNIX MILLISECONDS (TradingView requirement)
   */
  getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    try {
      const { from, to, countBack, firstDataRequest } = periodParams;
      const timeframe = formatResolution(resolution);
      const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
      const intradayTimeframes = new Set(['1m', '5m', '15m', '30m', '1h', '2h', '4h']);
      const useLiveCache = firstDataRequest && intradayTimeframes.has(timeframe);
      
      // Ensure minimum 500 candles for proper chart display
      const limit = Math.max(countBack || 300, 500);
      const params = new URLSearchParams();
      params.set('symbol', symbolInfo.name);
      params.set('resolution', timeframe);
      if (Number.isFinite(from)) params.set('from', String(from));
      if (Number.isFinite(to)) params.set('to', String(to));
      params.set('limit', String(limit));
      if (useLiveCache) params.set('preferLive', '1');
      params.set('v', '3'); // 🔥 THE FIX: Bust Browser HTTP Cache so TradingView pulls the newly pruned payload
      const url = `${API_URL}/prices/history?${params.toString()}`;
      Datafeed.setFeedStatus(symbolInfo.name, 'connecting', { path: 'history', timeframe });
      const resolutionSeconds = ({
        '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '2h': 7200, '4h': 14400, '1d': 86400, '1w': 604800, '1M': 2592000
      })[timeframe] || 60;
      const serverNowSec = Math.floor((Date.now() + (Datafeed._serverTimeOffsetMs || 0)) / 1000);
      const canBootstrapFromCurrent = useLiveCache || !Number.isFinite(to) || (serverNowSec - Number(to || 0)) <= Math.max(resolutionSeconds * 3, 15 * 60);
      
      debugDatafeed(`[DATAFEED] getBars: ${symbolInfo.name} (${resolution}->${timeframe}) from=${from} to=${to} limit=${limit}`);
      
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[DATAFEED] ❌ getBars HTTP ${res.status} for ${symbolInfo.name}`);
        // CRITICAL: Call onError instead of onHistory([], {noData: true})
        // This prevents TradingView from permanently marking this timeframe as "EMPTY"
        // if we are just experiencing a temporary 429 rate limit.
        Datafeed.setFeedStatus(symbolInfo.name, 'degraded', { timeframe, reason: `history_http_${res.status}` });
        onErrorCallback(`HTTP ${res.status}`);
        return;
      }

      const result = await res.json();
      Datafeed._historyMetaBySymbol[historyKey] = {
        source: result.source || 'unknown',
        freshness: result.freshness || 'degraded',
        degraded: result.degraded === true,
        feedState: normalizeFeedState(result.feedState || (result.degraded ? 'degraded' : 'live')),
        quoteAgeMs: result.quoteAgeMs ?? null,
        updatedAt: Date.now()
      };
      Datafeed.setFeedStatus(symbolInfo.name, Datafeed._historyMetaBySymbol[historyKey].feedState, {
        timeframe,
        source: result.source,
        freshness: result.freshness,
        degraded: result.degraded === true,
        quoteAgeMs: result.quoteAgeMs ?? null
      });
      const candleCount = result.candles?.length || 0;
      debugDatafeed(`[DATAFEED] getBars received ${candleCount} candles for ${symbolInfo.name}`);

      let bars = [];
      if (result.success && result.candles && result.candles.length > 0) {
        // Apply Retail Lens Markup to historical bars
        const rawBars = normalizeBars(result.candles, symbolInfo.name);
        bars = rawBars.map(bar => applyChartPriceModeToBar(bar, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide));
      }

      if (bars.length === 0) {
          if (canBootstrapFromCurrent) {
          try {
            const bootstrapRes = await fetch(
              `${API_URL}/prices/current-candle?symbol=${encodeURIComponent(symbolInfo.name)}&resolution=${encodeURIComponent(timeframe)}`
            );
            if (bootstrapRes.ok) {
              const bootstrapJson = await bootstrapRes.json();
              const bootstrapBars = buildBootstrapBarsFromPayload(bootstrapJson, symbolInfo.name)
                .map(bar => applyChartPriceModeToBar(bar, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide));

              if (bootstrapBars.length > 0) {
                const candidateBar = bootstrapBars[bootstrapBars.length - 1];
                Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
                Datafeed._lastHistoryBars[historyKey] = { ...candidateBar };
                Datafeed.setFeedStatus(symbolInfo.name, bootstrapJson.feedState || result.feedState || 'stale', {
                  timeframe,
                  source: bootstrapJson.source || result.source || 'storage_bootstrap',
                  freshness: bootstrapJson.freshness || result.freshness || 'stale',
                  degraded: bootstrapJson.degraded === true || result.degraded === true,
                  quoteAgeMs: bootstrapJson.quoteAgeMs ?? result.quoteAgeMs ?? null,
                  authority: bootstrapJson.authority || 'bootstrap'
                });
                debugDatafeed(`[DATAFEED] Bootstrapped ${bootstrapBars.length} bars for ${symbolInfo.name} from current-candle fallback`);
                onHistoryCallback(bootstrapBars, { noData: false });
                return;
              }
            }
          } catch {}
          }

          debugDatafeed(`[DATAFEED] No valid bars for ${symbolInfo.name}. Returning noData.`);
          Datafeed.setFeedStatus(symbolInfo.name, result.feedState || 'degraded', {
            timeframe,
            source: result.source,
            freshness: result.freshness,
            degraded: true
          });
          onHistoryCallback([], { noData: true });
      } else {
          //Sanket v2.0 - CRITICAL: Inject current running candle into history array on first request
          //Sanket v2.0 - TradingView sets lastBarsCache from the LAST bar in onHistoryCallback
          //Sanket v2.0 - If the live candle is NOT in this array, TV creates a new empty bar on first tick
          //Sanket v2.0 - Also use recentClosed (Redis ZSET candles) to fill the gap left by stale history cache
          //Sanket v2.0 - Without this: history ends at 06:14 (5-min cache lag), live bar at 06:27 → 13-min blank gap
          if (useLiveCache) {
            try {
              const liveRes = await fetch(
                `${API_URL}/prices/current-candle?symbol=${encodeURIComponent(symbolInfo.name)}&resolution=${encodeURIComponent(timeframe)}`
              );
              if (liveRes.ok) {
                const liveJson = await liveRes.json();
                if (liveJson?.success) {
                  Datafeed.setFeedStatus(symbolInfo.name, liveJson.feedState || result.feedState || 'live', {
                    timeframe,
                    source: liveJson.source || result.source,
                    freshness: liveJson.freshness || result.freshness,
                    degraded: liveJson.degraded === true,
                    quoteAgeMs: liveJson.quoteAgeMs ?? result.quoteAgeMs ?? null
                  });
                  const recentClosed = Array.isArray(liveJson.recentClosed) ? liveJson.recentClosed : [];
                  const liveCandle = liveJson.candle;

                  // ── Step 1: Merge recentClosed Redis candles to fill the history gap ──
                  //Sanket v2.0 - recentClosed has tick-accurate bars from the last 30 min from Redis ZSET
                  //Sanket v2.0 - We use them to replace/append candles that AllTick history is missing
                  if (recentClosed.length > 0) {
                    const lastHistTime = bars[bars.length - 1].time;
                    for (const rc of recentClosed) {
                      if (!Number.isFinite(rc.time) || rc.time <= 0) continue;
                      if (rc.time <= lastHistTime) {
                        //Sanket v2.0 - Bar already exists in history: replace it with fresher Redis data
                        const idx = bars.findIndex(b => b.time === rc.time);
                        if (idx !== -1) bars[idx] = applyChartPriceModeToBar(rc, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
                      } else {
                        //Sanket v2.0 - Bar is newer than history: append to fill the gap
                        bars.push(applyChartPriceModeToBar(rc, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide));
                      }
                    }
                    // Re-sort after merging (recentClosed may arrive out-of-order)
                    bars.sort((a, b) => a.time - b.time);
                    debugDatafeed(`[DATAFEED] Merged ${recentClosed.length} Redis candles for ${symbolInfo.name}`);
                  }

                  // ── Step 2: Append current open bar (or flat-fill any remaining tiny gap) ──
                  if (liveCandle && Number.isFinite(liveCandle.time) && liveCandle.time > 0) {
                    const rawLive = {
                      time: liveCandle.time,
                      open: Number(liveCandle.open),
                      high: Number(liveCandle.high),
                      low: Number(liveCandle.low),
                      close: Number(liveCandle.close),
                      volume: Number(liveCandle.volume) || 0
                    };
                    const liveBar = applyChartPriceModeToBar(rawLive, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
                    const lastHistoryBar = bars[bars.length - 1];
                    if (liveBar.time === lastHistoryBar.time) {
                      //Sanket v2.0 - Same bucket: replace with live OHLC (more ticks than Redis has)
                      bars[bars.length - 1] = liveBar;
                      debugDatafeed(`[DATAFEED] Live candle merged for ${symbolInfo.name} t=${liveBar.time}`);
                    } else if (liveBar.time > lastHistoryBar.time) {
                      //Sanket v2.0 - Still a small gap? flat-fill any remaining buckets (should be at most 1-2)
                      const _tfMsMap = {'1m':60000,'5m':300000,'15m':900000,'30m':1800000,'1h':3600000,'2h':7200000,'4h':14400000,'1d':86400000,'1w':604800000,'1M':2592000000};
                      const _resMs = _tfMsMap[timeframe] || 60000;
                      let _fill = lastHistoryBar.time + _resMs;
                      while (_fill < liveBar.time) {
                        bars.push({ time: _fill, open: lastHistoryBar.close, high: lastHistoryBar.close, low: lastHistoryBar.close, close: lastHistoryBar.close, volume: 0.0001 });
                        _fill += _resMs;
                      }
                      bars.push(liveBar);
                      debugDatafeed(`[DATAFEED] Live candle appended for ${symbolInfo.name} t=${liveBar.time}`);
                    }
                  }
                }
              }
            } catch (_liveErr) {
              // Non-fatal: history bars will still be returned normally
            }
          }

          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          //Sanket v2.0 - Only update if this batch is more recent. Backward pagination batches
          // arrive AFTER the first (most-recent) batch and would overwrite _lastHistoryBars with
          // stale old bars. subscribeBars seeds lastPushedBarTime from this value, so if it's
          // stale, bootstrapLiveBar and handleCandleUpdate can push bars older than TV's last
          // getBars bar, causing putToCacheNewBar time violations on 1W/1D/higher timeframes.
          const candidateBar = bars[bars.length - 1];
          if (!Datafeed._lastHistoryBars[historyKey] || candidateBar.time > Datafeed._lastHistoryBars[historyKey].time) {
            Datafeed._lastHistoryBars[historyKey] = { ...candidateBar };
          }
          debugDatafeed(`[DATAFEED] Returning ${bars.length} bars, lastBar.time=${candidateBar.time}`);
          onHistoryCallback(bars, { noData: false });
      }
    } catch (err) {
      console.error("[DATAFEED] ❌ getBars Exception:", err.message);
      Datafeed.setFeedStatus(symbolInfo.name, 'degraded', {
        timeframe: formatResolution(resolution),
        reason: err?.message || 'history_fetch_failed'
      });
      onErrorCallback(err);
    }
  },

  /**
   * //sanket - Real-time price streaming via Event-driven updates
   * CRITICAL: Must convert timestamps to UNIX MILLISECONDS for TradingView
   * Logic: Listens to priceUpdate events and creates proper OHLC candle updates
   */
  subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscriberUID) => {
    const existingSubscriberIds = Object.keys(Datafeed._subscribers || {});
    for (const existingUID of existingSubscriberIds) {
      if (existingUID !== String(subscriberUID)) {
        // Single-chart app: force-clean older realtime listeners so stale resolutions
        // cannot keep pushing duplicate bars after a symbol or interval change.
        Datafeed.unsubscribeBars(existingUID);
      }
    }
    if (Datafeed._subscribers?.[subscriberUID]) {
      Datafeed.unsubscribeBars(subscriberUID);
    }

    let resolutionMinutes = 1;
    if (resolution === '1M' || resolution === 'M') {
      resolutionMinutes = 30 * 24 * 60;
    } else if (resolution === '1W' || resolution === 'W') {
      resolutionMinutes = 7 * 24 * 60;
    } else if (resolution === '1D' || resolution === 'D') {
      resolutionMinutes = 24 * 60;
    } else if (resolution === '4h' || resolution === '240') {
      resolutionMinutes = 4 * 60;
    } else if (resolution === '2h' || resolution === '120') {
      resolutionMinutes = 2 * 60;
    } else if (resolution === '1h' || resolution === '60') {
      resolutionMinutes = 60;
    } else {
      resolutionMinutes = parseInt(resolution) || 1;
    }
    
    const resolutionMs = resolutionMinutes * 60 * 1000;
    const timeframe = formatResolution(resolution);
    const historyKey = `${normalizeRealtimeSymbol(symbolInfo.name)}|${timeframe}`;
    
    let lastBarTime = null;
    let currentBar = null;
    let lastUpdateTime = 0;
    let tickCount = 0;
    let lastTickTime = 0;
    const throttleMs = 50;
    let isActive = true;
    const streamStatusListenerId = `chart-feed-${subscriberUID}`;
    const unsubscribeStreamStatus = priceStreamService.onStatusChange(
      streamStatusListenerId,
      (status, lastTickAt, backendFeedState) => {
        Datafeed.setFeedStatus(symbolInfo.name, backendFeedState || status, {
          timeframe,
          transportStatus: status,
          backendFeedState,
          lastTickAt
        });
      }
    );

    //Sanket v2.0 - Rolling median spike guard: tracks last N accepted chart prices to detect outlier ticks
    //Sanket v2.0 - AllTick sends stale/cached quotes (e.g. session open price) that create spike wicks on chart
    //Sanket v2.0 - These are only 0.35-0.40% from real price so they pass the 3% threshold — need tighter local check
    const SPIKE_WINDOW_SIZE = 10;
    let _priceWindow = [];
    let _consecutiveSpikes = 0;
    const MAX_CONSECUTIVE_SPIKES = 5;

    const _getChartSpikeThresholdPct = (sym) => {
      const u = String(sym).toUpperCase();
      if (u.includes('BTC') || u.includes('ETH') || u.includes('BNB') || u.includes('SOL') || u.includes('XRP') || u.includes('DOGE')) return 5;
      if (u.includes('XAU') || u.includes('XAG')) return 1.5;
      if (u.includes('OIL') || u.includes('NGAS') || u.includes('US30') || u.includes('US100') || u.includes('US500') || u.includes('UK100') || u.includes('ES35')) return 1;
      return 0.35; // FX pairs: 0.35% catches AllTick stale quote spikes (~0.36%) while allowing real moves
    };

    const _isChartSpike = (price, sym) => {
      if (_priceWindow.length < 5) return false; // not enough data yet
      const sorted = [..._priceWindow].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const devPct = Math.abs((price - median) / median) * 100;
      return devPct > _getChartSpikeThresholdPct(sym);
    };

    const seededBar = Datafeed._lastHistoryBars?.[historyKey];
    if (seededBar && Number.isFinite(seededBar.time)) {
      currentBar = { ...seededBar };
      lastBarTime = seededBar.time;
      lastUpdateTime = Date.now();
      //Sanket v2.0 - Pre-seed rolling window from historical bar close so spike guard is active from first tick
      //Sanket v2.0 - Use server-aligned time so a stale seeded bar is not mistakenly treated as fresh
      const _seedNowMs = Date.now() + (Datafeed._serverTimeOffsetMs || 0);
      if (Number.isFinite(seededBar.close) && seededBar.close > 0 && (_seedNowMs - seededBar.time) < 120000) {
        _priceWindow = Array(5).fill(seededBar.close);
      }
    }

    let lastPushedBarTime = seededBar ? seededBar.time : -Infinity;
    const pushBar = (bar) => {
      if (!bar || !Number.isFinite(bar.time)) return;
      if (bar.time < lastPushedBarTime) return;
      lastPushedBarTime = bar.time;
      onRealtimeCallback(bar);
      try {
        getPriceEvents().dispatchEvent(new CustomEvent('chartBarUpdate', {
          detail: {
            symbol: symbolInfo.name,
            close: bar.close,
            time: bar.time,
            side: Datafeed._chartPriceSide
          }
        }));
      } catch {}
    };

    //Sanket v2.0 - Immediately push the seeded bar via onRealtimeCallback so TradingView activates
    //Sanket v2.0 - it as the current live candle before the first tick arrives.
    //Sanket v2.0 - Without this TV treats the injected getBars candle as "static history" and waits
    //Sanket v2.0 - for the first tick to define the candle body — causing the tiny/late-start visual bug.
    //Sanket v2.0 - setTimeout(0): deferred so TV's subscribeBars handler finishes registering first.
    if (currentBar) {
      setTimeout(() => {
        if (isActive && currentBar) pushBar(currentBar);
      }, 0);
    }

    //Sanket v2.0 - Rewritten: Phase 1 fetches CURRENT RUNNING bar directly from backend live state
    //Sanket v2.0 - This is the REAL FIX: on mid-candle joins the chart now continues the active candle
    //Sanket v2.0 - instead of creating a new empty one. Phase 2 falls back to preferLive history.
    //Sanket v2.0 - Only create a new candle when the first tick arrives for a genuinely new bucket.
    const bootstrapLiveBar = async () => {
      try {
        // ── Phase 1: Fetch exactly the current in-progress bar from backend live state ──
        const currentCandleRes = await fetch(
          `${API_URL}/prices/current-candle?symbol=${encodeURIComponent(symbolInfo.name)}&resolution=${encodeURIComponent(timeframe)}`
        );
        if (!isActive) return;

        if (currentCandleRes.ok) {
          const json = await currentCandleRes.json();
          if (!isActive) return;

          if (json?.success && json.candle && Number.isFinite(json.candle.time) && json.candle.time > 0) {
            //Sanket v2.0 - Server returned the currently running candle — use it directly
            //Sanket v2.0 - This bar already has correct open/high/low/close from all ticks so far this minute
            const liveCandle = {
              time: json.candle.time,
              open: Number(json.candle.open),
              high: Number(json.candle.high),
              low: Number(json.candle.low),
              close: Number(json.candle.close),
              volume: Number(json.candle.volume) || 0
            };
            currentBar = applyChartPriceModeToBar(liveCandle, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
            lastBarTime = liveCandle.time;
            lastUpdateTime = Date.now();
            Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
            Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
            // Seed spike guard window with the real close
            //Sanket v2.0 - Always reseed regardless of existing window size so the spike guard is
            //Sanket v2.0 - calibrated to the actual current price from the server, not a stale seeded close.
            if (liveCandle.close > 0) {
              _priceWindow = Array(5).fill(liveCandle.close);
            }
            pushBar(currentBar);
            return; // Done — live bar fully seeded
          }
        }

        // ── Phase 2: Fallback — preferLive history fetch ──
        //Sanket v2.0 - Used when backend live bar is not yet available (e.g. no ticks this minute yet)
        const params = new URLSearchParams();
        params.set('symbol', symbolInfo.name);
        params.set('resolution', timeframe);
        params.set('limit', '30');
        params.set('preferLive', '1');

        const response = await fetch(`${API_URL}/prices/history?${params.toString()}`);
        if (!response.ok || !isActive) return;

        const payload = await response.json();
        if (!isActive) return;

        const bars = normalizeBars(payload?.candles || [], symbolInfo.name);
        if (bars.length === 0) return;

        const latest = bars[bars.length - 1];
        //Sanket v2.0 - Use server-aligned time for bucket boundary check
        const _nowAlignedMs = Date.now() + (Datafeed._serverTimeOffsetMs || 0);
        const currentBucket = Math.floor(_nowAlignedMs / resolutionMs) * resolutionMs;

        if (latest.time === currentBucket) {
          currentBar = applyChartPriceModeToBar(latest, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
          lastBarTime = latest.time;
          lastUpdateTime = Date.now();
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
          pushBar(currentBar);
          return;
        }

        // Most-recent historical bar is NOT the current bucket — use it to anchor currentBar
        // The first incoming tick will trigger buildCandleFromTick to open the correct new bucket
        if (lastBarTime === null) {
          currentBar = applyChartPriceModeToBar(latest, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
          lastBarTime = latest.time;
          lastUpdateTime = Date.now();
          Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
          Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
        }
      } catch (error) {}
    };

    bootstrapLiveBar();
    
    priceStreamService.subscribeBars(symbolInfo.name);
    
    const normalizedSym = normalizeRealtimeSymbol(symbolInfo.name);
    const existingPriority = Array.isArray(priceStreamService.prioritySymbols) ? priceStreamService.prioritySymbols : [];
    if (!existingPriority.includes(normalizedSym)) {
      priceStreamService.setPrioritySymbols([...existingPriority, normalizedSym]);
    }

    // ✅ Monitor for data gaps
    const dataGapMonitor = setInterval(() => {
      const now = Date.now();
      if (lastTickTime > 0) {
        const timeSinceLastTick = now - lastTickTime;
        if (timeSinceLastTick > 15000) {
          console.warn(`[DATAFEED] ⚠️ DATA GAP for ${symbolInfo.name} for ${(timeSinceLastTick/1000).toFixed(1)}s`);
        }
      }
    }, 10000);

    const handleCandleUpdate = (e) => {
      const { symbol, timeframe: incomingTimeframe, candle, feedState } = e.detail;
      if (normalizeRealtimeSymbol(symbol) !== normalizedSym) return;
      if (incomingTimeframe !== timeframe) return;
      if (feedState) {
        Datafeed.setFeedStatus(symbolInfo.name, feedState, { timeframe, path: 'candle_update' });
      }

      const bar = {
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      };
      
      const validatedBar = validateRealtimeBar({
        symbol: symbolInfo.name,
        bar,
        previousBar: currentBar
      });
      if (!validatedBar.accepted) return;
      //Sanket v2.0 - Skip same-minute and stale backend candle updates; handlePriceUpdate owns live bar state
      if (validatedBar.bar.time <= lastBarTime) return;

      const authoritativeBar = applyChartPriceModeToBar(validatedBar.bar, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);

      currentBar = { ...authoritativeBar };
      lastBarTime = validatedBar.bar.time;
      lastUpdateTime = Date.now();

      Datafeed._lastHistoryBars = Datafeed._lastHistoryBars || {};
      const existing = Datafeed._lastHistoryBars[historyKey];
      if (!existing || validatedBar.bar.time >= existing.time) {
        Datafeed._lastHistoryBars[historyKey] = { ...currentBar };
      }

      pushBar(currentBar);
    };
    
    const handlePriceUpdate = (e) => {
      tickCount++;
      if (!isActive) return;
      const { symbol, bid, ask, time, feedState } = e.detail;
      lastTickTime = Date.now();
      
      if (normalizeRealtimeSymbol(symbol) !== normalizedSym) return;
      if (feedState) {
        Datafeed.setFeedStatus(symbolInfo.name, feedState, {
          timeframe,
          path: 'price_update'
        });
      }

      // 🔍 DEBUG-CHART: Log every tick reaching the chart candle builder
      debugDatafeed(`[CHART-TICK] ${symbol} bid=${bid} ask=${ask} currentBar.close=${currentBar?.close} time=${time}`);

      const now = Date.now();
      if ((now - lastUpdateTime) < throttleMs) {
        debugDatafeed(`[CHART-THROTTLED] ${symbol} tick dropped (throttle ${throttleMs}ms, elapsed ${now-lastUpdateTime}ms)`);
        return;
      }
      lastUpdateTime = now;

      const price = getChartExecutionPrice(bid, ask, symbolInfo.name, Datafeed._adminSpreads, Datafeed._chartPriceSide);
      if (!isFinite(price) || price <= 0) {
        console.warn(`[CHART-INVALID-PRICE] ${symbol} price=${price} from bid=${bid} ask=${ask}`);
        return;
      }

      //Sanket v2.0 - Rolling median spike guard: reject single stale/outlier AllTick quotes that create spike wicks
      //Sanket v2.0 - Safety: after MAX_CONSECUTIVE_SPIKES rejections in a row, force-accept (handles real rapid moves)
      if (_isChartSpike(price, symbolInfo.name)) {
        if (_consecutiveSpikes < MAX_CONSECUTIVE_SPIKES) {
          _consecutiveSpikes++;
          console.warn(`[CHART-SPIKE-GUARD] ${symbol} price=${price} rejected (consecutive=${_consecutiveSpikes}) vs window median`);
          return;
        }
        // Too many consecutive rejections → real market move, accept and reset
        console.warn(`[CHART-SPIKE-GUARD] ${symbol} price=${price} force-accepted after ${_consecutiveSpikes} consecutive rejections`);
        _priceWindow = []; // reset window to new price level
      }
      _consecutiveSpikes = 0;

      //Sanket v2.0 - buildCandleFromTick handles same-bucket updates, new-minute bar creation, and gap interpolation
      //Sanket v2.0 - replaces validateRealtimeUpdate which could not create new bars nor interpolate gaps
      //Sanket v2.0 - Apply server time offset so the minute bucket aligns with the actual server-side clock.
      //Sanket v2.0 - When AllTick sends no timestamp, priceStream.js falls back to Date.now() (client clock).
      //Sanket v2.0 - Without the offset, a client clock that is even 30s ahead can prematurely open a new bar.
      const serverAlignedTickTime = (Number.isFinite(time) && time > 0 ? time : Date.now()) + (Datafeed._serverTimeOffsetMs || 0);
      const result = buildCandleFromTick({
        currentBar,
        tickPrice: price,
        tickTime: serverAlignedTickTime,
        resolutionMs,
        symbol: symbolInfo.name
      });

      //Sanket v2.0 - SYNC-CHECK log: compare chart execution price to raw bid/ask so price-mode drift is visible
      if (result.accepted) {
        const bucketIso = new Date(result.bucketTime || serverAlignedTickTime).toISOString().slice(11, 19);
        debugDatafeed(`[SYNC-CHECK] ${symbol} bid=${bid} ask=${ask} chartPrice=${price} bucket=${bucketIso} isNewBar=${result.isNewBar} serverOffset=${Datafeed._serverTimeOffsetMs || 0}ms`);
      }

      if (!result.accepted) {
        //Sanket v2.0 - Show actual rejection reason (was mislabeled as CHART-SPIKE-DROPPED for all rejections including out_of_order_bucket)
        console.warn(`[CHART-SKIP] ${symbol} reason=${result.reason} price=${price} currentBar.close=${currentBar?.close}`);
        return;
      }

      //Sanket v2.0 - Update rolling window with accepted price so median stays current
      _priceWindow.push(price);
      if (_priceWindow.length > SPIKE_WINDOW_SIZE) _priceWindow.shift();

      for (const bar of result.bars) {
        debugDatafeed(`[CHART-PUSH] ${symbol} close=${bar.close} high=${bar.high} low=${bar.low} barTime=${bar.time}`);
        pushBar(bar);
      }
      currentBar = result.bars[result.bars.length - 1];
      lastBarTime = currentBar.time;
    };

    Datafeed._subscribers[subscriberUID] = {
      priceUpdate: handlePriceUpdate,
      candleUpdate: handleCandleUpdate,
      symbol: symbolInfo.name,
      normalizedSymbol: normalizedSym,
      dataGapMonitor
    };

    Datafeed._priorityRefs[normalizedSym] = (Datafeed._priorityRefs[normalizedSym] || 0) + 1;

    getPriceEvents().addEventListener("candleUpdate", handleCandleUpdate);
    getPriceEvents().addEventListener("priceUpdate", handlePriceUpdate);
    
    return function cleanup() {
      isActive = false;
      if (typeof unsubscribeStreamStatus === 'function') {
        unsubscribeStreamStatus();
      }
      clearInterval(dataGapMonitor);
      priceStreamService.unsubscribeBars(symbolInfo.name);
      getPriceEvents().removeEventListener("candleUpdate", handleCandleUpdate);
      getPriceEvents().removeEventListener("priceUpdate", handlePriceUpdate);
      delete Datafeed._subscribers[subscriberUID];
      
      if (Datafeed._priorityRefs[normalizedSym] > 1) {
        Datafeed._priorityRefs[normalizedSym] -= 1;
      } else {
        delete Datafeed._priorityRefs[normalizedSym];
      }
      priceStreamService.setPrioritySymbols(Object.keys(Datafeed._priorityRefs));
    };
  },

  unsubscribeBars: (subscriberUID) => {
    const sub = Datafeed._subscribers && Datafeed._subscribers[subscriberUID];
    if (sub) {
      //Sanket v2.0 - Fixed: was using sub.handlePriceUpdate (undefined) instead of sub.priceUpdate
      //Sanket v2.0 - Bug: listeners were never removed, causing duplicate CHART-TICK and time/countdown desync
      getPriceEvents().removeEventListener("priceUpdate", sub.priceUpdate);
      getPriceEvents().removeEventListener("candleUpdate", sub.candleUpdate);
      if (sub.dataGapMonitor) clearInterval(sub.dataGapMonitor);
      if (sub.heartbeatTimer) clearInterval(sub.heartbeatTimer);
      if (sub.symbol) priceStreamService.unsubscribeBars(sub.symbol);
      if (sub.normalizedSymbol) {
        if (Datafeed._priorityRefs[sub.normalizedSymbol] > 1) {
          Datafeed._priorityRefs[sub.normalizedSymbol] -= 1;
        } else {
          delete Datafeed._priorityRefs[sub.normalizedSymbol];
        }
        priceStreamService.setPrioritySymbols(Object.keys(Datafeed._priorityRefs));
      }
      delete Datafeed._subscribers[subscriberUID];
    }
  }
};

export default Datafeed;
