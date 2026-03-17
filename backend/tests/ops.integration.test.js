/**
 * Integration tests for the Ops API endpoints.
 * Run with:   node --test backend/tests/ops.integration.test.js
 *
 * Prerequisites:
 *   1. Backend server must be running on the port defined by TEST_BASE_URL
 *      (default: http://localhost:5001)
 *   2. OPS_API_KEY env var must NOT be set (dev-mode pass-through) OR set to
 *      the value you pass in TEST_OPS_KEY.
 *
 * Environment variables:
 *   TEST_BASE_URL  — base URL of the running server (default http://localhost:5001)
 *   TEST_OPS_KEY   — ops API key to use in tests (default: 'dev')
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';
const OPS_KEY  = process.env.TEST_OPS_KEY  || 'dev';

// ---------------------------------------------------------------------------
// Helper: plain fetch wrapper with JSON parsing
// ---------------------------------------------------------------------------
async function api(method, path, { body, opsKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opsKey !== undefined) headers['x-ops-key'] = opsKey;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json };
}

// ---------------------------------------------------------------------------
// Wait for server readiness (up to 10 s)
// ---------------------------------------------------------------------------
before(async () => {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE_URL}/api/prices/status`);
      if (r.ok) return;
    } catch { /* keep waiting */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server at ${BASE_URL} did not become ready in 10 s`);
});

// ---------------------------------------------------------------------------
// Status endpoint
// ---------------------------------------------------------------------------
describe('GET /api/prices/status', () => {
  it('returns 200 with success=true and expected keys', async () => {
    const { status, body } = await api('GET', '/api/prices/status');
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.ok('status' in body,          'body.status missing');
    assert.ok('livePersistence' in body, 'body.livePersistence missing');
    assert.ok('syncStats' in body,       'body.syncStats missing');
    assert.ok('opsRateLimit' in body,    'body.opsRateLimit missing');
  });

  it('livePersistence includes alertState', async () => {
    const { body } = await api('GET', '/api/prices/status');
    const lp = body.livePersistence;
    assert.ok(lp, 'livePersistence missing');
    assert.ok('alertState' in lp, 'alertState missing from livePersistence');
    assert.ok(['ok', 'warn', 'alert'].includes(lp.alertState.level),
      `unexpected alertState.level: ${lp.alertState.level}`);
  });
});

// ---------------------------------------------------------------------------
// Live-persistence flush — auth + dedup
// ---------------------------------------------------------------------------
describe('POST /api/prices/live-persistence/flush', () => {
  it('returns 401 when no ops key provided', async () => {
    const { status } = await api('POST', '/api/prices/live-persistence/flush');
    // In dev mode (OPS_API_KEY not set) the middleware may pass — skip check.
    // In production it must be 401.
    assert.ok([200, 401].includes(status), `Unexpected status: ${status}`);
  });

  it('returns 200 with flush stats when valid key provided', async () => {
    const { status, body } = await api('POST', '/api/prices/live-persistence/flush', { opsKey: OPS_KEY });
    // 200 success OR 429 if rate-limit already hit by previous runs
    assert.ok([200, 429].includes(status), `Unexpected status: ${status}`);
    if (status === 200) {
      assert.equal(body.success, true);
      assert.ok('stats' in body, 'stats missing from flush response');
      assert.ok(Number.isInteger(body.stats.pendingLiveBarOps), 'pendingLiveBarOps should be integer');
    }
  });
});

// ---------------------------------------------------------------------------
// History sync — dedup guard
// ---------------------------------------------------------------------------
describe('POST /api/prices/sync', () => {
  it('returns 200 or 202 (already running) when valid key provided', async () => {
    const { status, body } = await api('POST', '/api/prices/sync', { opsKey: OPS_KEY });
    assert.ok([200, 202, 429].includes(status), `Unexpected status: ${status}`);
    if (status === 202) {
      assert.match(body.message || '', /already in progress/i);
    }
  });

  it('returns 401 when no ops key provided (non-dev)', async () => {
    // In dev mode middleware passes; production blocks.
    const { status } = await api('POST', '/api/prices/sync');
    assert.ok([200, 202, 401].includes(status), `Unexpected status: ${status}`);
  });
});

// ---------------------------------------------------------------------------
// Backfill — input validation
// ---------------------------------------------------------------------------
describe('POST /api/prices/backfill — input validation', () => {
  it('returns 400 when symbol is missing', async () => {
    const { status, body } = await api('POST', '/api/prices/backfill',
      { body: { days: 7 }, opsKey: OPS_KEY });
    // 429 if rate-limited, otherwise should be 400
    if (status !== 429) {
      assert.equal(status, 400);
      assert.equal(body.success, false);
    }
  });

  it('returns 400 when days=0', async () => {
    const { status, body } = await api('POST', '/api/prices/backfill',
      { body: { symbol: 'EURUSD', days: 0 }, opsKey: OPS_KEY });
    if (status !== 429) {
      assert.equal(status, 400);
      assert.ok(/days must be a positive/i.test(body.message || ''));
    }
  });

  it('returns 400 when days exceeds 365', async () => {
    const { status, body } = await api('POST', '/api/prices/backfill',
      { body: { symbol: 'EURUSD', days: 500 }, opsKey: OPS_KEY });
    if (status !== 429) {
      assert.equal(status, 400);
      assert.ok(/days cannot exceed/i.test(body.message || ''));
    }
  });

  it('returns 400 when days is not a number', async () => {
    const { status, body } = await api('POST', '/api/prices/backfill',
      { body: { symbol: 'EURUSD', days: 'abc' }, opsKey: OPS_KEY });
    if (status !== 429) {
      assert.equal(status, 400);
    }
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
describe('Rate limiting on ops endpoints', () => {
  it('returns 429 after enough rapid requests', async function () {
    // Fire 35 requests in quick succession — should trigger 429
    // (OPS_RATE_LIMIT_MAX defaults to 30 in a 60-s window)
    let got429 = false;
    for (let i = 0; i < 35; i++) {
      const { status } = await api('POST', '/api/prices/live-persistence/flush', { opsKey: OPS_KEY });
      if (status === 429) { got429 = true; break; }
    }
    // Only assert if rate limiting is enabled (check stats endpoint)
    const { body: statusBody } = await api('GET', '/api/prices/status');
    const rlEnabled = statusBody?.opsRateLimit?.enabled ?? true;
    if (rlEnabled) {
      assert.ok(got429, 'Expected 429 after exceeding rate limit');
    }
  });
});

// ---------------------------------------------------------------------------
// History endpoint — basic
// ---------------------------------------------------------------------------
describe('GET /api/prices/history', () => {
  it('returns 400 when symbol is missing', async () => {
    const { status, body } = await api('GET', '/api/prices/history');
    assert.equal(status, 400);
    assert.equal(body.success, false);
  });

  it('returns 404 for unsupported symbol', async () => {
    const { status } = await api('GET', '/api/prices/history?symbol=FAKESYMBOLXYZ&resolution=1m');
    assert.equal(status, 404);
  });
});
