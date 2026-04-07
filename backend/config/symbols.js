/**
 * symbols.js - The Single Source of Truth for all Financial Instruments
 * Standardizes symbol canonicalization, provider mapping, and market sessions.
 */

export const SYMBOL_REGISTRY = {
  // --- FOREX ---
  'EURUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'EURUSD' },
  'GBPUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'GBPUSD' },
  'USDJPY': { type: 'forex', pricescale: 100, session: '2200-2200:12345', providerCode: 'USDJPY' },
  'USDCHF': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'USDCHF' },
  'AUDUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'AUDUSD' },
  'NZDUSD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'NZDUSD' },
  'USDCAD': { type: 'forex', pricescale: 100000, session: '2200-2200:12345', providerCode: 'USDCAD' },
  
  // --- METALS ---
  'XAUUSD': { type: 'commodity', pricescale: 100, session: '2200-2100:12345', providerCode: 'XAUUSD' },
  'XAGUSD': { type: 'commodity', pricescale: 1000, session: '2200-2100:12345', providerCode: 'XAGUSD' },

  // --- CRYPTO ---
  'BTCUSD': { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'BTCUSDT' },
  'ETHUSD': { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'ETHUSDT' },
  'BNBUSD': { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'BNBUSDT' },
  'SOLUSD': { type: 'crypto', pricescale: 100, session: '24x7', providerCode: 'SOLUSDT' },

  // --- INDICES ---
  'US30':  { type: 'index', pricescale: 10,  session: '2200-2100:12345', providerCode: 'US30' },
  'US500': { type: 'index', pricescale: 100, session: '2200-2100:12345', providerCode: 'US500' },
  'US100': { type: 'index', pricescale: 10,  session: '2200-2100:12345', providerCode: 'US100' },
  'UK100': { type: 'index', pricescale: 10,  session: '2200-2100:12345', providerCode: 'UK100' }
};

/**
 * Universal Symbol Normalizer
 * Strips all suffixes (.i, .f, etc.) and special chars to return canonical ID.
 */
export const normalizeSymbol = (symbol = '') => {
  if (!symbol) return '';
  return String(symbol)
    .toUpperCase()
    .replace(/\.I$/i, '')
    .replace(/\.[A-Z]$/i, '') // Strips any single-letter suffix like .f, .c
    .replace(/[^A-Z0-9]/g, '');
};

/**
 * Retrieves full metadata for a symbol using strict normalization.
 */
export const getSymbolMetadata = (symbol) => {
  const clean = normalizeSymbol(symbol);
  return SYMBOL_REGISTRY[clean] || null;
};
