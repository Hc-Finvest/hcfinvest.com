/**
 * Integration tests for the live-candle persistence pipeline.
 * Run with:   node --test backend/tests/persistence.integration.test.js
 *
 * Prerequisites:
 *   Backend server running on TEST_BASE_URL (default http://localhost:5001).
 *   OPS_API_KEY not set (dev pass-through) OR set to TEST_OPS_KEY value.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001';
const OPS_KEY  = process.env.TEST_OPS_KEY  || 'dev';

async function api(method, path, { body, opsKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (opsKey !== undefined) headers['x-ops-key'] = opsKey;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

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
// /api/prices/live-persistence - Health endpoint shape
// ---------------------------------------------------------------------------
describe('GET /api/prices/live-persistence', () => {
  it('returns 200 with expected stats fields', async () => {
    const { status, body } = await api('GET', '/api/prices/live-persistence');
    assert.equal(status, 200);
    assert.equal(body.success, true);

    const s = body.stats;
    assert.ok(s, 'stats object missing');

    // Health string
    assert.ok(['healthy', 'degraded', 'unhealthy'].includes(s.health),
      `Unexpected health: ${s.health}`);

    // Numeric counters must be non-negative integers
    for (const field of ['activeBars', 'activeSymbols', 'livePersistedTicks',
                          'livePersistedWrites', 'livePersistErrors',
                          'pendingLiveBarOps', 'liveFlushCount']) {
      assert.ok(
        Number.isInteger(s[field]) && s[field] >= 0,
        `${field} should be a non-negative integer, got ${s[field]}`
      );
    }

    // alertState
    assert.ok(s.alertState, 'alertState missing');
    assert.ok(['ok', 'warn', 'alert'].includes(s.alertState.level),
      `Unexpected alertState.level: ${s.alertState.level}`);
    assert.ok(Array.isArray(s.alertState.alerts),   'alertState.alerts must be array');
    assert.ok(Array.isArray(s.alertState.warnings), 'alertState.warnings must be array');
  });

  it('health is "healthy" when no errors and queue not full', async () => {
    const { body } = await api('GET', '/api/prices/live-persistence');
    const s = body.stats;
    const pendingRatio = s.pendingLiveBarOps / (s.maxPendingLiveBarOps || 20000);
    if (s.livePersistErrors === 0 && pendingRatio <= 0.7) {
      assert.equal(s.health, 'healthy');
    }
  });
});

// ---------------------------------------------------------------------------
// Flush clears pendingLiveBarOps
// ---------------------------------------------------------------------------
describe('POST /api/prices/live-persistence/flush', () => {
  it('pendingLiveBarOps is 0 immediately after flush', async () => {
    const { status, body } = await api('POST', '/api/prices/live-persistence/flush',
      { opsKey: OPS_KEY });

    // Skip this assertion if rate-limited
    if (status === 429) return;

    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.stats.pendingLiveBarOps, 0,
      `Expected 0 pending ops after flush, got ${body.stats.pendingLiveBarOps}`);
  });
});

// ---------------------------------------------------------------------------
// Persistence tick counters increase over time
// ---------------------------------------------------------------------------
describe('Live persistence counters increase over time', () => {
  it('livePersistedTicks increases after 5 s of receiving ticks', async () => {
    const { body: snapshot1 } = await api('GET', '/api/prices/live-persistence');
    const ticksBefore = snapshot1.stats?.livePersistedTicks ?? 0;

    // Wait for ticks to arrive and be processed
    await new Promise(r => setTimeout(r, 5000));

    const { body: snapshot2 } = await api('GET', '/api/prices/live-persistence');
    const ticksAfter = snapshot2.stats?.livePersistedTicks ?? 0;

    // Only assert if MetaAPI is actually connected and sending ticks
    const { body: status } = await api('GET', '/api/prices/status');
    const connected = status?.status?.connected ?? false;
    if (connected) {
      assert.ok(
        ticksAfter > ticksBefore,
        `Expected livePersistedTicks to increase. Before: ${ticksBefore} After: ${ticksAfter}`
      );
    }
  });
});

// ---------------------------------------------------------------------------
// syncStats shape
// ---------------------------------------------------------------------------
describe('syncStats shape on status endpoint', () => {
  it('has expected fields with correct types', async () => {
    const { status, body } = await api('GET', '/api/prices/status');
    assert.equal(status, 200);

    const ss = body.syncStats;
    assert.ok(ss, 'syncStats missing from status');
    assert.ok(typeof ss.isSyncing === 'boolean', 'isSyncing should be boolean');
    assert.ok(Number.isInteger(ss.inflightSyncTasks),     'inflightSyncTasks should be int');
    assert.ok(Number.isInteger(ss.inflightBackfillTasks), 'inflightBackfillTasks should be int');
    assert.ok(Number.isInteger(ss.inflightHistoryRequests), 'inflightHistoryRequests should be int');
  });
});
