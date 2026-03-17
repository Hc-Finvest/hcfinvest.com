/**
 * Distributed leader lock backed by MongoDB TTL documents.
 *
 * Usage:
 *   import leaderLock from './leaderLock.js'
 *
 *   const acquired = await leaderLock.tryAcquire('lock:history-sync', 30 * 60 * 1000)
 *   if (!acquired) { console.log('Another instance is running sync'); return; }
 *   try {
 *     await doWork();
 *   } finally {
 *     await leaderLock.release('lock:history-sync');
 *   }
 *
 * How it works:
 *  - tryAcquire atomically claims expired/absent locks; returns false if another live
 *    instance already holds the lock.
 *  - The TTL index auto-deletes expired docs so crashed instances never block others.
 *  - renew() extends the expiry so long-running jobs don't auto-expire mid-flight.
 *  - All methods catch DB errors and fail-safe (returns false / silently) so a
 *    MongoDB outage degrades rather than crashes the app.
 */

import os from 'os';
import LeaderLock from '../models/LeaderLock.js';

class LeaderLockService {
  constructor() {
    // Unique identity: hostname + PID — survives process restarts on same host.
    this.instanceId = `${os.hostname()}-${process.pid}`;
    this._enabled = true; // can be toggled off in tests
  }

  /**
   * Try to acquire a distributed lock.
   * @param {string} lockKey  - Unique name for the lock (e.g. 'lock:history-sync').
   * @param {number} ttlMs    - Lock TTL in milliseconds. Auto-expires after this duration
   *                            so dead instances never block others permanently.
   * @returns {Promise<boolean>} true if this instance now holds the lock.
   */
  async tryAcquire(lockKey, ttlMs = 15 * 60 * 1000) {
    if (!this._enabled) return true; // test bypass
    const now = new Date();
    const expiresAt = new Date(Date.now() + ttlMs);

    try {
      // Step 1: atomically update an expired lock OR our own lock (renew).
      const updated = await LeaderLock.findOneAndUpdate(
        {
          lockKey,
          $or: [
            { holder: this.instanceId },     // already ours — renew
            { expiresAt: { $lte: now } }      // expired — take over
          ]
        },
        { $set: { holder: this.instanceId, expiresAt, acquiredAt: now } },
        { new: true }
      );

      if (updated) return true; // claimed or renewed

      // Step 2: no expired/own doc found — try to insert a fresh lock.
      try {
        await LeaderLock.create({ lockKey, holder: this.instanceId, expiresAt, acquiredAt: now });
        return true;
      } catch (insertErr) {
        if (insertErr.code === 11000) {
          // Another live instance inserted between our findOneAndUpdate and create.
          return false;
        }
        throw insertErr;
      }
    } catch (err) {
      // Fail-safe: if DB is unavailable let local isSyncing guard handle dedup.
      console.error(`[LeaderLock] tryAcquire error for "${lockKey}":`, err.message);
      return true; // Fail open: single-instance deployments still work during DB hiccups.
    }
  }

  /**
   * Release a lock held by this instance.
   * @param {string} lockKey
   */
  async release(lockKey) {
    if (!this._enabled) return;
    try {
      await LeaderLock.deleteOne({ lockKey, holder: this.instanceId });
    } catch (err) {
      console.error(`[LeaderLock] release error for "${lockKey}":`, err.message);
    }
  }

  /**
   * Extend expiry of a lock already held by this instance.
   * Call this periodically during long-running jobs so the lock doesn't expire
   * while work is in progress.
   * @param {string} lockKey
   * @param {number} ttlMs  - New TTL from now.
   * @returns {Promise<boolean>} true if renew succeeded.
   */
  async renew(lockKey, ttlMs = 15 * 60 * 1000) {
    if (!this._enabled) return true;
    try {
      const result = await LeaderLock.updateOne(
        { lockKey, holder: this.instanceId },
        { $set: { expiresAt: new Date(Date.now() + ttlMs) } }
      );
      return result.matchedCount > 0;
    } catch (err) {
      console.error(`[LeaderLock] renew error for "${lockKey}":`, err.message);
      return false;
    }
  }

  /**
   * Check whether this instance currently holds the lock.
   * @param {string} lockKey
   * @returns {Promise<boolean>}
   */
  async isHolder(lockKey) {
    try {
      const doc = await LeaderLock.findOne({ lockKey, holder: this.instanceId });
      return !!doc && doc.expiresAt > new Date();
    } catch {
      return false;
    }
  }

  /**
   * Get info about who holds the lock and when it expires.
   * @param {string} lockKey
   * @returns {Promise<{held: boolean, holder: string|null, expiresAt: Date|null, ours: boolean} | null>}
   */
  async inspect(lockKey) {
    try {
      const doc = await LeaderLock.findOne({ lockKey }).lean();
      if (!doc) return { held: false, holder: null, expiresAt: null, ours: false };
      const expired = doc.expiresAt <= new Date();
      return {
        held: !expired,
        holder: doc.holder,
        expiresAt: doc.expiresAt,
        ours: doc.holder === this.instanceId,
        expired
      };
    } catch (err) {
      console.error(`[LeaderLock] inspect error for "${lockKey}":`, err.message);
      return null;
    }
  }
}

const leaderLock = new LeaderLockService();
export default leaderLock;
