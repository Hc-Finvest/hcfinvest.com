const OPS_RATE_LIMIT_WINDOW_MS = parseInt(process.env.OPS_RATE_LIMIT_WINDOW_MS || '60000', 10)
const OPS_RATE_LIMIT_MAX = parseInt(process.env.OPS_RATE_LIMIT_MAX || '30', 10)

const buckets = new Map()

const getClientKey = (req) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'
  const route = req.path || 'unknown'
  return `${ip}:${route}`
}

const cleanupExpired = (now) => {
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key)
    }
  }
}

export const opsRateLimit = (req, res, next) => {
  const now = Date.now()
  cleanupExpired(now)

  const key = getClientKey(req)
  const current = buckets.get(key)

  if (!current || now >= current.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: now + OPS_RATE_LIMIT_WINDOW_MS,
      blocked: 0
    })
    return next()
  }

  if (current.count >= OPS_RATE_LIMIT_MAX) {
    current.blocked += 1
    const retryAfterSec = Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    res.setHeader('Retry-After', retryAfterSec)
    return res.status(429).json({
      success: false,
      message: 'Too many operation requests. Please retry later.',
      retryAfterSeconds: retryAfterSec
    })
  }

  current.count += 1
  next()
}

export const getOpsRateLimitStats = () => {
  const now = Date.now()
  let totalRequestsInWindow = 0
  let totalBlockedInWindow = 0

  buckets.forEach(bucket => {
    if (bucket.resetAt > now) {
      totalRequestsInWindow += bucket.count
      totalBlockedInWindow += bucket.blocked
    }
  })

  return {
    enabled: true,
    windowMs: OPS_RATE_LIMIT_WINDOW_MS,
    maxRequestsPerWindow: OPS_RATE_LIMIT_MAX,
    activeBuckets: buckets.size,
    totalRequestsInWindow,
    totalBlockedInWindow
  }
}

export default { opsRateLimit, getOpsRateLimitStats }
