import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Admin from '../models/Admin.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Auth middleware for regular users
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    
    const decoded = jwt.verify(token, JWT_SECRET)
    
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been blocked',
        reason: user.blockReason 
      })
    }

    if (user.isBanned) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been banned',
        reason: user.banReason 
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' })
    }
    console.error('Auth middleware error:', error)
    res.status(500).json({ success: false, message: 'Authentication error' })
  }
}

// Admin middleware - checks for admin authentication
export const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    
    const decoded = jwt.verify(token, JWT_SECRET)
    
    // Check if it's an admin token (adminId from admin-mgmt login or id from other sources)
    const adminId = decoded.adminId || decoded.id
    console.log('Admin middleware - decoded:', { adminId, role: decoded.role })
    
    const admin = await Admin.findById(adminId).select('-password')
    console.log('Admin middleware - admin found:', admin ? admin.email : 'NOT FOUND')
    
    if (admin) {
      if (admin.status !== 'ACTIVE') {
        return res.status(403).json({ 
          success: false, 
          message: 'Admin account is not active' 
        })
      }
      req.admin = admin
      req.isAdmin = true
      return next()
    }

    // Fallback: Check if user has admin privileges (for backward compatibility)
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' })
    }

    // For now, allow any authenticated user to access admin routes
    // In production, you should check for admin role
    req.user = user
    req.isAdmin = false
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' })
    }
    console.error('Admin middleware error:', error)
    res.status(500).json({ success: false, message: 'Authentication error' })
  }
}

// Optional auth - doesn't fail if no token, just sets user if valid
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next()
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    
    if (user && !user.isBlocked && !user.isBanned) {
      req.user = user
    }
    
    next()
  } catch (error) {
    // Silently continue without user
    next()
  }
}

export default { authMiddleware, adminMiddleware, optionalAuth }
