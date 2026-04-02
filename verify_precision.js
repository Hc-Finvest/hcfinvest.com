/**
 * Verification script for precision.js
 */
// logic pasted below
const mockCanonicalSymbol = (raw) => {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';
  const compact = value.replace(/\.I$/i, '').replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';
  if (compact.length >= 6) return compact.slice(0, 6);
  return compact;
};

const getInfo = (symbol) => {
  const s = mockCanonicalSymbol(symbol).toUpperCase();
  let pricescale = 100000;
  let decimals = 5;

  if (s.includes("JPY") || s.includes("XAG") || s.includes("NGAS") || s.includes("OIL") || s.includes("WTI") || s.includes("BRENT")) {
    pricescale = 1000;
    decimals = 3;
  } else if (s.includes("XAU") || s.includes("BTC") || s.includes("ETH") || s.includes("BNB") || s.includes("SOL") || s.includes("LTC") || s.includes("US500") || s.includes("SPX")) {
    pricescale = 100;
    decimals = 2;
  } else if (s.includes("US30") || s.includes("US100") || s.includes("NAS100") || s.includes("UK100") || s.includes("GER40") || s.includes("FRA40") || s.includes("SPA35") || s.includes("ES35")) {
    pricescale = 10;
    decimals = 1;
  }
  return { pricescale, decimals };
};

const testSymbols = [
  { s: 'EURUSD.i', expected: 5 },
  { s: 'USDJPY.i', expected: 3 },
  { s: 'XAUUSD.i', expected: 2 },
  { s: 'US30.i', expected: 1 },
  { s: 'BTCUSD.i', expected: 2 },
  { s: 'GBPUSD', expected: 5 }
];

console.log('--- Precision Verification ---');
testSymbols.forEach(({ s, expected }) => {
  const { decimals } = getInfo(s);
  const status = decimals === expected ? '✅' : '❌';
  console.log(`${s.padEnd(10)} | Decimals: ${decimals} | Expected: ${expected} | ${status}`);
});
