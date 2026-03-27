/**
 * Unified Market Hours Utility
 * Handles market open/close state based on UTC time
 */

export const isMarketOpen = (symbol) => {
  if (!symbol) return false;
  
  const normalizedSymbol = String(symbol).toUpperCase().replace(/[^A-Z]/g, '');
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const utcHour = now.getUTCHours();
  
  // 🚀 CRYPTO: Always Open (24bit/7D)
  const cryptos = ['BTC', 'ETH', 'LTC', 'XRP', 'BCH', 'BNB', 'SOL', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'LINK'];
  if (cryptos.some(c => normalizedSymbol.startsWith(c))) {
    return true;
  }

  // 🚀 FOREX & METALS: Closed Friday 22:00 UTC to Sunday 22:00 UTC
  // Friday After 22:00 UTC
  if (utcDay === 5 && utcHour >= 22) return false;
  
  // Saturday
  if (utcDay === 6) return false;
  
  // Sunday Before 22:00 UTC
  if (utcDay === 0 && utcHour < 22) return false;
  
  return true;
};

/**
 * Validates price freshness (MAX_AGE in seconds)
 */
export const isPriceFresh = (priceTimestamp, maxAgeSeconds = 60) => {
  if (!priceTimestamp) return false;
  
  const ts = new Date(priceTimestamp).getTime();
  const now = Date.now();
  
  // Check if timestamp is in the future (server clock skew) or too old
  const ageSeconds = (now - ts) / 1000;
  
  return ageSeconds >= -5 && ageSeconds <= maxAgeSeconds;
};
