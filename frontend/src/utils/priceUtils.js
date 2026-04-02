import { canonicalSymbol } from './symbolUtils';

/**
 * Calculates the retail markup value for a specific symbol based on admin configuration.
 * @param {string} symbol - The symbol (e.g., 'XAUUSD')
 * @param {Object} adminSpreads - The admin-set spread configuration
 * @returns {number} The absolute markup value (spread) to apply
 */
export const getAdminMarkupValue = (symbol, adminSpreads) => {
  const cleanSym = canonicalSymbol(symbol);
  const spreadConfig = adminSpreads?.[cleanSym];
  if (!spreadConfig || !spreadConfig.spread) return 0;

  const spreadValue = spreadConfig.spread;
  const spreadType = spreadConfig.spreadType || 'FIXED';

  if (spreadType === 'PERCENTAGE') {
    // Note: Percentage markup is usually dynamic and harder to apply to historical candles
    // For now, we return 0 to avoid distortion, or you can implement a baseline mid-price markup
    return 0;
  }

  // FIXED spread - convert from pips/cents/USD to actual price units
  //Sanket v2.0 - Handle all asset classes: forex, JPY, metals, commodities, crypto, indices
  if (symbol.includes('JPY')) {
    return spreadValue * 0.01; // JPY pairs: 1 pip = 0.01
  } else if (['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'USOIL', 'UKOIL', 'NGAS', 'COPPER'].includes(symbol)) {
    return spreadValue * 0.01; // Metals & commodities: cents to dollars
  } else if (['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'XLMUSD', 'TRXUSD', 'ETCUSD', 'NEARUSD', 'ALGOUSD'].includes(symbol)) {
    return spreadValue; // Crypto: USD value as-is
  } else if (['US30', 'US500', 'US100', 'UK100', 'GER40', 'FRA40', 'JP225', 'HK50', 'AUS200', 'ES35'].includes(symbol)) {
    return spreadValue; // Indices: points as-is
  } else {
    return spreadValue * 0.0001; // Standard Forex: 1 pip = 0.0001
  }
};

/**
 * Wraps a raw "Interbank" price into a "Retail" display price.
 * @param {number} price - The raw price (Bid, Ask, or OHLC)
 * @param {string} symbol - The symbol
 * @param {string} side - 'BUY', 'SELL', or 'MID'
 * @param {Object} adminSpreads - The configuration
 * @returns {number} The transformed retail price
 */
export const getRetailPrice = (price, symbol, side, adminSpreads) => {
  if (!price || isNaN(price)) return price;
  
  const markup = getAdminMarkupValue(symbol, adminSpreads);
  if (markup === 0) return price;

  if (side === 'BUY') {
    return price + markup; // BUY gets higher price (Market Ask + Markup)
  } else if (side === 'SELL') {
    return price - markup; // SELL gets lower price (Market Bid - Markup)
  } else {
    // 'MID' or chart candle - usually we shift based on the dominant direction 
    // or keep it raw if we want the chart to be centered.
    // However, to fix the "10 point offset" reported by the user, 
    // we must align the chart with one of the sides or the mid.
    // Most retail platforms shift the chart slightly to reflect the "Bid" price.
    return price; // Default to raw if no specific side is requested
  }
};

/**
 * Specifically used for Chart Candles to ensure they align with the user's perception.
 * For Gold with a 10-point spread, this shifts the whole candle by the markup amount.
 */
export const wrapOHLC = (candle, symbol, adminSpreads) => {
  const markup = getAdminMarkupValue(symbol, adminSpreads);
  if (markup === 0) return candle;

  // Shift the whole bar to align with the "Retail" price perception.
  // We subtract markup to show the "execution" level for Sells, which is what users usually track.
  return {
    ...candle,
    open: candle.open - markup,
    high: candle.high - markup,
    low: candle.low - markup,
    close: candle.close - markup
  };
};

/**
 * Reversed transformation for Drag-and-Drop.
 * Translates a visual "Retail" position back to a "Raw" price for the server.
 */
export const unwrapRetailPrice = (retailPrice, symbol, adminSpreads) => {
  const markup = getAdminMarkupValue(symbol, adminSpreads);
  return retailPrice + markup;
};
