/**
 * Instrument precision utility
 * Mirrors the backend PriceNormalizer PRICE_CONFIG for frontend use.
 */

//Sanket v2.0 - Per-instrument decimals and pricescale lookup for SL/TP drag precision and rounding
const INSTRUMENT_CONFIG = {
  // Standard Forex (5 decimals)
  EURUSD: { decimals: 5, pricescale: 100000 },
  GBPUSD: { decimals: 5, pricescale: 100000 },
  AUDUSD: { decimals: 5, pricescale: 100000 },
  NZDUSD: { decimals: 5, pricescale: 100000 },
  USDCAD: { decimals: 5, pricescale: 100000 },
  USDCHF: { decimals: 5, pricescale: 100000 },
  EURGBP: { decimals: 5, pricescale: 100000 },
  EURAUD: { decimals: 5, pricescale: 100000 },
  EURCAD: { decimals: 5, pricescale: 100000 },
  EURCHF: { decimals: 5, pricescale: 100000 },
  EURNZD: { decimals: 5, pricescale: 100000 },
  GBPAUD: { decimals: 5, pricescale: 100000 },
  GBPCAD: { decimals: 5, pricescale: 100000 },
  GBPCHF: { decimals: 5, pricescale: 100000 },
  GBPNZD: { decimals: 5, pricescale: 100000 },
  AUDCAD: { decimals: 5, pricescale: 100000 },
  AUDCHF: { decimals: 5, pricescale: 100000 },
  AUDNZD: { decimals: 5, pricescale: 100000 },
  CADCHF: { decimals: 5, pricescale: 100000 },
  NZDCAD: { decimals: 5, pricescale: 100000 },
  NZDCHF: { decimals: 5, pricescale: 100000 },

  // JPY pairs (3 decimals)
  USDJPY: { decimals: 3, pricescale: 1000 },
  EURJPY: { decimals: 3, pricescale: 1000 },
  GBPJPY: { decimals: 3, pricescale: 1000 },
  AUDJPY: { decimals: 3, pricescale: 1000 },
  CADJPY: { decimals: 3, pricescale: 1000 },
  CHFJPY: { decimals: 3, pricescale: 1000 },
  NZDJPY: { decimals: 3, pricescale: 1000 },

  // Metals
  XAUUSD: { decimals: 2, pricescale: 100 },
  XAGUSD: { decimals: 3, pricescale: 1000 },
  XPTUSD: { decimals: 2, pricescale: 100 },
  XPDUSD: { decimals: 2, pricescale: 100 },

  // Commodities
  USOIL:  { decimals: 2, pricescale: 100 },
  UKOIL:  { decimals: 2, pricescale: 100 },
  NGAS:   { decimals: 3, pricescale: 1000 },
  COPPER: { decimals: 4, pricescale: 10000 },

  // Crypto
  BTCUSD:   { decimals: 2, pricescale: 100 },
  ETHUSD:   { decimals: 2, pricescale: 100 },
  LTCUSD:   { decimals: 2, pricescale: 100 },
  XRPUSD:   { decimals: 5, pricescale: 100000 },
  BNBUSD:   { decimals: 2, pricescale: 100 },
  SOLUSD:   { decimals: 2, pricescale: 100 },
  ADAUSD:   { decimals: 5, pricescale: 100000 },
  DOGEUSD:  { decimals: 5, pricescale: 100000 },
  DOTUSD:   { decimals: 3, pricescale: 1000 },
  MATICUSD: { decimals: 4, pricescale: 10000 },
  AVAXUSD:  { decimals: 2, pricescale: 100 },
  LINKUSD:  { decimals: 3, pricescale: 1000 },
  UNIUSD:   { decimals: 3, pricescale: 1000 },
  ATOMUSD:  { decimals: 3, pricescale: 1000 },
  XLMUSD:   { decimals: 5, pricescale: 100000 },
  TRXUSD:   { decimals: 5, pricescale: 100000 },
  ETCUSD:   { decimals: 2, pricescale: 100 },
  NEARUSD:  { decimals: 3, pricescale: 1000 },
  ALGOUSD:  { decimals: 4, pricescale: 10000 },

  // Indices
  US30:   { decimals: 1, pricescale: 10 },
  US500:  { decimals: 2, pricescale: 100 },
  US100:  { decimals: 1, pricescale: 10 },
  UK100:  { decimals: 1, pricescale: 10 },
  GER40:  { decimals: 1, pricescale: 10 },
  FRA40:  { decimals: 1, pricescale: 10 },
  JP225:  { decimals: 0, pricescale: 1 },
  HK50:   { decimals: 0, pricescale: 1 },
  AUS200: { decimals: 1, pricescale: 10 },
  ES35:   { decimals: 1, pricescale: 10 },
};

const DEFAULT = { decimals: 5, pricescale: 100000 };

/**
 * Returns { decimals, pricescale } for the given symbol.
 * Strips .i suffix and uppercases before lookup.
 */
export const getInstrumentInfo = (symbol) => {
  const clean = String(symbol || '').toUpperCase().replace(/\.I$/i, '').replace(/[^A-Z0-9]/g, '');
  return INSTRUMENT_CONFIG[clean] || DEFAULT;
};

/**
 * Rounds a price to the correct decimal places for the given symbol.
 */
export const roundPrice = (price, symbol) => {
  const { decimals } = getInstrumentInfo(symbol);
  const multiplier = Math.pow(10, decimals);
  return Math.round(price * multiplier) / multiplier;
};
