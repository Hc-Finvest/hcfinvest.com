import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const TOKEN = process.env.ALLTICK_API_TOKEN || process.env.ALLTICK_TOKEN || process.env.ALLTICK_API_KEY;
const REST_URL = process.env.ALLTICK_REST_URL || 'https://quote.alltick.io/quote-b-api';

console.log('Token (last 8):', TOKEN ? TOKEN.slice(-8) : 'NOT FOUND');

// Test NGAS with 200 daily candles and also check prices
const tests = [
  { sym: 'NGAS', ktype: 7, num: 200 },
  { sym: 'NGAS', ktype: 1, num: 200 },
  { sym: 'XAGUSD', ktype: 7, num: 10 },
  { sym: 'USOIL', ktype: 7, num: 10 },
];
for (const { sym, ktype, num } of tests) {
  const q = JSON.stringify({ data: { code: sym, kline_type: ktype, query_kline_num: num, adjust_type: 0 } });
  const url = `${REST_URL}/kline?token=${TOKEN}&query=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url);
    const text = await r.text();
    let d; try { d = JSON.parse(text); } catch(e) { d = { msg: 'parse_error' }; }
    const candles = d.data?.kline_list?.length || 0;
    const first = candles > 0 ? d.data.kline_list[0] : null;
    const last = candles > 0 ? d.data.kline_list[candles-1] : null;
    console.log(`${sym} ktype:${ktype} status:${r.status} msg:${String(d.msg||'ok')} candles:${candles}` + 
      (last ? ` last_close:${last.close_price} ts:${new Date(parseInt(last.timestamp)*1000).toISOString().slice(0,10)}` : ''));
    await new Promise(res => setTimeout(res, 1500));
  } catch (e) {
    console.log(`${sym} ERROR: ${e.message}`);
  }
}
console.log('\nDone.');
