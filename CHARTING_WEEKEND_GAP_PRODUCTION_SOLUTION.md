# Production-Grade Charting Logic: Handling Market Gaps & Sessions

In a production trading system, charting should be strictly **event-driven (tick-driven)** rather than **interval-driven**. When the market is closed (e.g., weekends for XAUUSD and Forex), **no ticks arrive**, therefore **no candles should be built**. 

The issue of flat, dotted, or continuous flat candles appearing during weekends is caused by two common anti-patterns:
1. **Backend Anti-pattern:** A timer (`setInterval` or CRON) that triggers every 15 minutes and takes the `lastKnownPrice` to forcefully build a candle, even if market activity is zero.
2. **Frontend Anti-pattern:** The charting library is treating the X-axis strictly as a contiguous timeline, plotting missing data as `NaN` (dotted line) or connecting them with a flat line. TradingView's Lightweight Charts handles this automatically by skipping gaps in the provided `time` array.

Here is the robust, production-grade TypeScript implementation to fix this.

---

## 1. Market Session Configuration

We need a flexible session configuration to define when different market types are open. Forex and Commodities (like XAUUSD) run almost 24/5, starting Sunday evening and closing Friday evening.

```typescript
export type MarketType = 'FOREX' | 'CRYPTO' | 'STOCKS';

export interface SessionConfig {
    type: MarketType;
    is247: boolean;
    // UTC days: 0 = Sun, 1 = Mon, ..., 6 = Sat
    openDayUTC?: number;
    openHourUTC?: number;
    closeDayUTC?: number;
    closeHourUTC?: number;
}

export const MARKET_SESSIONS: Record<string, SessionConfig> = {
    XAUUSD: {
        type: 'FOREX',
        is247: false,
        openDayUTC: 0,       // Sunday
        openHourUTC: 22,     // 22:00 UTC
        closeDayUTC: 5,      // Friday
        closeHourUTC: 22,    // 22:00 UTC
    },
    BTCUSD: {
        type: 'CRYPTO',
        is247: true
    },
    AAPL: {
        type: 'STOCKS',
        is247: false,
        openDayUTC: 1,       // Monday
        openHourUTC: 13.5,   // 13:30 UTC (9:30 AM EST)
        closeDayUTC: 5,      // Friday
        closeHourUTC: 20,    // 20:00 UTC (4:00 PM EST)
    }
};
```

---

## 2. Timestamp Validation & Session Filter

Filter out "ghost" ticks coming from stale API connections during off-hours.

> [!CAUTION]
> Avoid handling timezone logic locally using EST/PST directly. Always normalize everything to `UTC` to avoid Daylight Saving Time (DST) edge cases.

```typescript
/**
 * Evaluates if the market is currently open based on the UTC timestamp.
 */
export function isMarketOpen(timestamp: number, symbol: string): boolean {
    const config = MARKET_SESSIONS[symbol];
    if (!config) return true; // Default to open if no config exists
    if (config.is247) return true;

    const date = new Date(timestamp);
    const day = date.getUTCDay();
    const decimalHour = date.getUTCHours() + (date.getUTCMinutes() / 60);

    if (config.type === 'FOREX') {
        // Closed entirely on Saturday
        if (day === 6) return false;
        
        // Friday after close time
        if (day === config.closeDayUTC && decimalHour >= config.closeHourUTC!) return false;
        
        // Sunday before open time
        if (day === config.openDayUTC && decimalHour < config.openHourUTC!) return false;

        return true;
    }

    if (config.type === 'STOCKS') {
        // Closed on weekends
        if (day === 0 || day === 6) return false;
        // Closed outside trading hours
        if (decimalHour < config.openHourUTC! || decimalHour >= config.closeHourUTC!) return false;
        return true;
    }

    return true;
}
```

---

## 3. The Candle Builder Logic (Tick-Driven)

This is the core fix. **Never forward-fill**. Candles are only constructed when valid ticks hit the engine. If 48 hours pass over the weekend, the loop naturally sleeps, leaving a gap. The charting library will simply draw the Friday close candle, and immediately draw the Sunday open candle right next to it.

```typescript
export interface Tick {
    symbol: string;
    price: number;
    volume: number;
    timestamp: number;
}

export interface Candle {
    timestamp: number; // Start time of candle
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export class CandleBuilder {
    private timeframeMs: number;
    private symbol: string;
    private currentCandle: Candle | null = null;
    private lastPrice: number | null = null;

    constructor(symbol: string, timeframeMs: number) {
        this.symbol = symbol;
        // e.g., 15 minutes = 15 * 60 * 1000
        this.timeframeMs = timeframeMs;
    }

    /**
     * Call this function ONLY when a real websocket or API event occurs.
     * Returns an array of finalized (closed) candles.
     */
    public processTick(tick: Tick): Candle[] {
        const closedCandles: Candle[] = [];

        // 1. Session Filter Check
        if (!isMarketOpen(tick.timestamp, this.symbol)) {
            // Drop tick, market is strictly closed
            return [];
        }

        // 2. Data Filtering: Ignore redundant repeating prices WITHOUT volume
        if (this.lastPrice === tick.price && tick.volume <= 0) {
            // It's a duplicate tick without real market movement
            return [];
        }

        // 3. Determine timeframe boundary
        const candleOpenTime = Math.floor(tick.timestamp / this.timeframeMs) * this.timeframeMs;

        // 4. Timeframe transition check (Close old candle)
        if (this.currentCandle && candleOpenTime > this.currentCandle.timestamp) {
            closedCandles.push(this.currentCandle);
            this.currentCandle = null;
        }

        // 5. Build or Update existing candle
        if (!this.currentCandle) {
            // Initialize new candle
            this.currentCandle = {
                timestamp: candleOpenTime,
                open: tick.price,
                high: tick.price,
                low: tick.price,
                close: tick.price,
                volume: tick.volume
            };
        } else {
            // Mutate exiting candle
            this.currentCandle.high = Math.max(this.currentCandle.high, tick.price);
            this.currentCandle.low = Math.min(this.currentCandle.low, tick.price);
            this.currentCandle.close = tick.price;
            this.currentCandle.volume += tick.volume;
        }

        this.lastPrice = tick.price;
        return closedCandles;
    }
}
```

---

## 4. Why This Works Perfectly with TradingView

If you are using TradeView's `Lightweight Charts` or their advanced `Charting Library`, they do not require zero-filled / contiguous timeframes. They rely exclusively on **Ordinal Time**.

The X-Axis is an array of indices natively mapped to your candles. 

When your data looks like this:
```json
[
  { "time": 1713556800, "close": 2390.15 }, // Friday 22:00 
  { "time": 1713744000, "close": 2392.10 }  // Sunday 22:00 (Gap of 48 hours)
]
```
TradingView naturally plots Friday's candle directly adjacent to Sunday's candle without plotting 192 flat 15-minute candles in between.

> **To fix your frontend (if it still shows dotted lines):**
> Ensure that you are NOT doing `xAxis.type = 'time'` in a linear fashion (like in Chart.js or D3 by default). You must use an **ordinal scale** (or `type: 'category'`) where X-axis ticks represent individual data points rather than physical chronological time. TradingView does this out of the box.
