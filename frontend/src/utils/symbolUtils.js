/**
 * v7.77 Symbol Canonicalization Utility
 * Standardizes symbol strings for system-wide consistency.
 */

/**
 * Strips .i suffix and converts to uppercase for comparison.
 */
export const canonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  const compact = value.replace(/\.I$/i, '').replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  // Standardize 6-char pairs (e.g. EURUSD)
  if (compact.length >= 6) return compact.slice(0, 6);
  return compact;
};

/**
 * Ensures symbol is normalized (uppercase, no .i suffix).
 * Backward compat: strips .i from old saved symbols.
 * Example: XAUUSD.i -> XAUUSD
 */
//Sanket v2.0 - Changed to strip .i suffix instead of adding it
export const ensureISuffix = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return '';
  return s.replace(/\.I$/i, '');
};

/**
 * Complete normalization: Uppercase, no .i suffix.
 * Example: xauusd.i -> XAUUSD
 */
//Sanket v2.0 - Changed to strip .i suffix instead of adding it
export const normalizeSymbol = (raw) => {
  const s = String(raw || '').trim().toUpperCase();
  if (!s) return '';
  return s.replace(/\.I$/i, '');
};
