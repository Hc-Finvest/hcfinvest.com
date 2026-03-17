import crypto from 'crypto'

const getProvidedOpsKey = (req) => {
  const headerKey = req.headers['x-ops-key']
  if (typeof headerKey === 'string' && headerKey.trim()) return headerKey.trim()

  const authHeader = req.headers.authorization
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }

  return ''
}

const safeEqual = (a, b) => {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export const requireOpsAuth = (req, res, next) => {
  const configuredKey = process.env.OPS_API_KEY || ''
  const providedKey = getProvidedOpsKey(req)

  // In non-production, allow operations without OPS key for local development.
  if (!configuredKey) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        message: 'OPS_API_KEY is not configured for production'
      })
    }
    return next()
  }

  if (!providedKey || !safeEqual(providedKey, configuredKey)) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized operation'
    })
  }

  next()
}

export default { requireOpsAuth }
