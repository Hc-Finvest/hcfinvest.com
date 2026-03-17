#!/usr/bin/env node
/**
 * Load / soak test for the market data pipeline.
 *
 * Tests:
 *  1. Concurrent history requests for the SAME symbol/timeframe
 *     — validates that in-flight request deduplication reduces actual DB/API hits.
 *  2. Burst of concurrent history requests for DIFFERENT symbols
 *     — validates that the server handles high concurrency without errors.
 *  3. Rapid flush endpoint calls
 *     — validates rate-limiter and queue behaviour under hammering.
 *
 * Usage:
 *   node backend/scripts/loadTest.js [options]
 *
 * Options (all optional):
 *   --url         Base URL of the backend server (default: http://localhost:5001)
 *   --symbol      Symbol to use for same-symbol dedup test (default: EURUSD)
 *   --concurrency Number of concurrent requests in same-symbol test (default: 100)
 *   --ops-key     OPS API key for flush calls (default: dev)
 *   --soak-secs   How many seconds to soak in tick-throughput test (default: 30)
 *
 * Example:
 *   node backend/scripts/loadTest.js --url http://localhost:5001 --concurrency 50
 */

import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const { values } = parseArgs({
  options: {
    url:         { type: 'string',  default: 'http://localhost:5001' },
    symbol:      { type: 'string',  default: 'EURUSD' },
    concurrency: { type: 'string',  default: '100' },
    'ops-key':   { type: 'string',  default: 'dev' },
    'soak-secs': { type: 'string',  default: '30' }
  },
  strict: false
});

const BASE_URL    = values.url;
const SYMBOL      = values.symbol;
const CONCURRENCY = parseInt(values.concurrency, 10);
const OPS_KEY     = values['ops-key'];
const SOAK_SECS   = parseInt(values['soak-secs'], 10);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const pad = (n, w = 6) => String(n).padStart(w);
const pct = (n, total) => total > 0 ? ((n / total) * 100).toFixed(1) : '0.0';

async function get(path) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    const body = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, status: 0, body: null, ms: Date.now() - start, error: err.message };
  }
}

async function post(path, body, opsKey) {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ops-key': opsKey },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, body: json, ms: Date.now() - start };
  } catch (err) {
    return { ok: false, status: 0, body: null, ms: Date.now() - start, error: err.message };
  }
}

function printStats(label, results) {
  const total  = results.length;
  const passed = results.filter(r => r.ok).length;
  const failed = total - passed;
  const durations = results.map(r => r.ms).sort((a, b) => a - b);
  const p50  = durations[Math.floor(total * 0.50)];
  const p95  = durations[Math.floor(total * 0.95)];
  const p99  = durations[Math.floor(total * 0.99)];
  const max  = durations[total - 1];
  const avg  = Math.round(durations.reduce((s, v) => s + v, 0) / total);
  const statusCounts = {};
  results.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  console.log(`\n  [${label}]`);
  console.log(`  Total: ${total}  |  OK: ${passed} (${pct(passed, total)}%)  |  Failed: ${failed}`);
  console.log(`  Latency — avg: ${avg} ms  p50: ${p50} ms  p95: ${p95} ms  p99: ${p99} ms  max: ${max} ms`);
  console.log(`  Status codes: ${JSON.stringify(statusCounts)}`);
}

// ---------------------------------------------------------------------------
// Test 1 — 100 concurrent requests for the SAME symbol (dedup validation)
// ---------------------------------------------------------------------------
async function testSameSymbolConcurrency() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TEST 1: ${CONCURRENCY} concurrent history requests for ${SYMBOL}/1m`);
  console.log(`  Goal: dedup should collapse these into 1 DB/API call`);
  console.log('─'.repeat(60));

  const path = `/api/prices/history?symbol=${SYMBOL}&resolution=1m&limit=50`;
  const promises = Array.from({ length: CONCURRENCY }, () => get(path));
  const results = await Promise.all(promises);
  printStats('Same-symbol concurrency', results);

  // Check stats to see inflightHistoryRequests stayed low
  const { body: statsBody } = await get('/api/prices/live-persistence');
  const inflight = statsBody?.stats?.inflightHistoryRequests ?? 'n/a';
  console.log(`  inflightHistoryRequests after test: ${inflight}`);
}

// ---------------------------------------------------------------------------
// Test 2 — Concurrent requests for different symbols
// ---------------------------------------------------------------------------
async function testDifferentSymbolConcurrency() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log('TEST 2: 80 concurrent history requests for different symbols');
  console.log('─'.repeat(60));

  // Use a mix of common symbols
  const symbols = [
    'EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD',
    'USDCHF','NZDUSD','EURJPY','GBPJPY','EURGBP',
    'XAUUSD','BTCUSD','ETHUSD','US30','USTEC',
    'USOIL','BRENT','FRA40','GER40','UK100'
  ];

  const requests = Array.from({ length: 80 }, (_, i) => {
    const sym = symbols[i % symbols.length];
    return get(`/api/prices/history?symbol=${sym}&resolution=5m&limit=30`);
  });

  const results = await Promise.all(requests);
  printStats('Different-symbol concurrency', results);
}

// ---------------------------------------------------------------------------
// Test 3 — Rapid flush calls (rate limit validation)
// ---------------------------------------------------------------------------
async function testFlushRateLimit() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log('TEST 3: 40 rapid flush calls (rate-limit validation)');
  console.log('─'.repeat(60));

  const results = [];
  for (let i = 0; i < 40; i++) {
    results.push(await post('/api/prices/live-persistence/flush', {}, OPS_KEY));
  }

  printStats('Rapid flush calls', results);
  const rateLimited = results.filter(r => r.status === 429).length;
  console.log(`  Rate-limited (429): ${rateLimited}/40`);
  if (rateLimited > 0) {
    console.log('  ✅ Rate limiter is working correctly.');
  } else {
    console.log('  ℹ  No 429s — rate limit window may not have been exceeded or is disabled.');
  }
}

// ---------------------------------------------------------------------------
// Test 4 — Soak test: monitor tick throughput over N seconds
// ---------------------------------------------------------------------------
async function testSoak() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`TEST 4: Soak monitoring — ${SOAK_SECS}s tick throughput observation`);
  console.log('─'.repeat(60));

  const { body: start } = await get('/api/prices/live-persistence');
  const ticksBefore   = start?.stats?.livePersistedTicks  ?? 0;
  const writesBefore  = start?.stats?.livePersistedWrites ?? 0;
  const flushBefore   = start?.stats?.liveFlushCount      ?? 0;
  const errorsBefore  = start?.stats?.livePersistErrors   ?? 0;

  console.log(`  Snapshot at t=0s: ticks=${ticksBefore} writes=${writesBefore} flushes=${flushBefore} errors=${errorsBefore}`);

  const samples = [];
  const interval = 5_000; // sample every 5 s
  const cycles = Math.ceil((SOAK_SECS * 1000) / interval);

  for (let i = 1; i <= cycles; i++) {
    await new Promise(r => setTimeout(r, interval));
    const { body: snap } = await get('/api/prices/live-persistence');
    const s = snap?.stats ?? {};
    samples.push(s);
    console.log(
      `  t=${pad(i * interval / 1000, 3)}s — ticks: ${pad(s.livePersistedTicks, 7)}` +
      `  writes: ${pad(s.livePersistedWrites, 7)}` +
      `  pending: ${pad(s.pendingLiveBarOps, 5)}` + 
      `  health: ${s.health}` +
      `  alert: ${s.alertState?.level ?? '?'}`
    );
  }

  const { body: end } = await get('/api/prices/live-persistence');
  const ticksAfter  = end?.stats?.livePersistedTicks  ?? 0;
  const writesAfter = end?.stats?.livePersistedWrites ?? 0;
  const flushAfter  = end?.stats?.liveFlushCount      ?? 0;
  const errorsAfter = end?.stats?.livePersistErrors   ?? 0;

  const deltaTicks  = ticksAfter  - ticksBefore;
  const deltaWrites = writesAfter - writesBefore;
  const deltaFlush  = flushAfter  - flushBefore;
  const deltaErrors = errorsAfter - errorsBefore;
  const tps = (deltaTicks / SOAK_SECS).toFixed(2);

  console.log(`\n  Soak summary (${SOAK_SECS}s):`);
  console.log(`    Ticks processed : ${deltaTicks} (~${tps} ticks/s)`);
  console.log(`    DB writes       : ${deltaWrites}`);
  console.log(`    Flush cycles    : ${deltaFlush}`);
  console.log(`    New errors      : ${deltaErrors}`);
  if (deltaErrors > 0) {
    console.log(`  ⚠  Errors detected during soak. Check server logs.`);
  } else {
    console.log('  ✅ No errors during soak.');
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('='.repeat(60));
  console.log(' HCFinvest Market Data Pipeline — Load / Soak Test');
  console.log('='.repeat(60));
  console.log(`  Target : ${BASE_URL}`);
  console.log(`  Symbol : ${SYMBOL}`);
  console.log(`  Concurrency: ${CONCURRENCY}`);
  console.log(`  Soak duration: ${SOAK_SECS}s`);

  // Verify server is reachable
  const health = await get('/api/prices/status');
  if (!health.ok) {
    console.error(`\n❌ Server not reachable at ${BASE_URL} (status ${health.status})`);
    process.exit(1);
  }
  console.log(`\n  Server OK — MetaAPI connected: ${health.body?.status?.connected ?? 'unknown'}`);

  await testSameSymbolConcurrency();
  await testDifferentSymbolConcurrency();
  await testFlushRateLimit();
  await testSoak();

  console.log(`\n${'='.repeat(60)}`);
  console.log(' Load test complete.');
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('\n❌ Load test failed:', err.message);
  process.exit(1);
});
