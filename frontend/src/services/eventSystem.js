/**
 * Shared Event System for TradingView Datafeed Updates
 * This service provides a centralized EventTarget to decouple the chart datafeed
 * from the price streaming service, resolving circular dependencies.
 */

// Central event target for price and candle updates
const priceEventTarget = new EventTarget();

/**
 * Returns the shared EventTarget instance for subscription.
 * Listen for:
 * - 'priceUpdate': Live contract execution price (tick-by-tick)
 * - 'candleUpdate': Authoritative bar updates from the backend
 */
export const getPriceEvents = () => priceEventTarget;

export default {
  getPriceEvents
};
