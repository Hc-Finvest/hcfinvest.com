import mongoose from 'mongoose';

/**
 * MongoDB TTL-based distributed leader lock.
 * The TTL index on `expiresAt` ensures MongoDB automatically removes expired lock
 * documents, so a dead or crashed instance can never permanently block the lock.
 *
 * Lock lifecycle:
 *  1. Instance tries to insert a lock document (lock acquisition).
 *  2. If insert fails (duplicate key), another live instance holds the lock.
 *  3. Lock TTL expires → MongoDB deletes the document → any instance can re-acquire.
 *  4. Holding instance can renew (extend TTL) or explicitly release.
 */

const leaderLockSchema = new mongoose.Schema(
  {
    lockKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    holder: {
      type: String,
      required: true
    },
    // MongoDB TTL index: document is auto-deleted after this Date is past.
    // expireAfterSeconds: 0 means "delete at exactly expiresAt".
    expiresAt: {
      type: Date,
      required: true
    },
    acquiredAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

// TTL index — MongoDB sweeps expired documents roughly every 60 s.
leaderLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LeaderLock = mongoose.model('LeaderLock', leaderLockSchema);
export default LeaderLock;
