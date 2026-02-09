import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const router = express.Router()

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return id && id !== 'undefined' && id !== 'null' && /^[a-fA-F0-9]{24}$/.test(id)
}

// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({
      success: true,
      message: 'Users fetched successfully',
      users,
      total: users.length
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: 'Error fetching users', error: error.message })
  }
})

// GET /api/admin/users/:id - Get single user
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }
    const user = await User.findById(id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ user })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message })
  }
})

// POST /api/admin/users/create - Create new user (Admin only)
router.post('/users/create', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body
    
    if (!firstName || !email || !password) {
      return res.status(400).json({ success: false, message: 'First name, email and password are required' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' })
    }
    
    // Create new user
    const user = await User.create({
      firstName,
      lastName: lastName || '',
      email: email.toLowerCase(),
      phone: phone || '',
      password,
      isEmailVerified: true // Admin-created users are pre-verified
    })
    
    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({ success: false, message: 'Error creating user', error: error.message })
  }
})

// PUT /api/admin/users/:id/password - Change user password
router.put('/users/:id/password', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    const { password } = req.body
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
    }
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    user.password = password
    await user.save()
    
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error updating password:', error)
    res.status(500).json({ success: false, message: 'Error updating password', error: error.message })
  }
})

// POST /api/admin/users/:id/deduct - Deduct funds from user wallet
router.post('/users/:id/deduct', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    const { amount, reason } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' })
    }
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    // Use Wallet model (same as user wallet page)
    const Wallet = (await import('../models/Wallet.js')).default
    let wallet = await Wallet.findOne({ userId: id })
    if (!wallet) {
      return res.status(400).json({ success: false, message: 'User has no wallet' })
    }
    
    if ((wallet.balance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' })
    }
    
    wallet.balance = (wallet.balance || 0) - parseFloat(amount)
    await wallet.save()
    
    console.log(`[Admin] Deducted $${amount} from user ${user.email} wallet. New balance: $${wallet.balance}`)
    
    res.json({ 
      success: true,
      message: 'Funds deducted successfully',
      newBalance: wallet.balance
    })
  } catch (error) {
    console.error('Error deducting funds:', error)
    res.status(500).json({ success: false, message: 'Error deducting funds', error: error.message })
  }
})

// POST /api/admin/users/:id/add-fund - Add funds to user wallet (Admin only)
router.post('/users/:id/add-fund', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    const { amount, reason } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' })
    }
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    // Use Wallet model (same as user wallet page)
    const Wallet = (await import('../models/Wallet.js')).default
    let wallet = await Wallet.findOne({ userId: id })
    if (!wallet) {
      wallet = new Wallet({ userId: id, balance: 0 })
    }
    
    const previousBalance = wallet.balance || 0
    wallet.balance = previousBalance + parseFloat(amount)
    await wallet.save()
    
    console.log(`[Admin] Added $${amount} to user ${user.email} wallet. Balance: $${previousBalance} -> $${wallet.balance}`)
    
    res.json({ 
      success: true,
      message: 'Funds added successfully',
      previousBalance,
      newBalance: wallet.balance,
      amountAdded: parseFloat(amount)
    })
  } catch (error) {
    console.error('Error adding funds:', error)
    res.status(500).json({ success: false, message: 'Error adding funds', error: error.message })
  }
})

// POST /api/admin/trading-account/:id/add-fund - Add funds to trading account (Admin only)
router.post('/trading-account/:id/add-fund', async (req, res) => {
  try {
    const { amount, reason, adminId } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' })
    }
    
    const TradingAccount = (await import('../models/TradingAccount.js')).default
    const Transaction = (await import('../models/Transaction.js')).default
    const account = await TradingAccount.findById(req.params.id)
    if (!account) {
      return res.status(404).json({ success: false, message: 'Trading account not found' })
    }
    
    const previousBalance = account.balance || 0
    account.balance = previousBalance + parseFloat(amount)
    await account.save()
    
    // Create transaction record for user's history
    await Transaction.create({
      userId: account.userId,
      tradingAccountId: account._id,
      tradingAccountName: account.accountId,
      type: 'Admin_Credit',
      amount: parseFloat(amount),
      paymentMethod: 'System',
      status: 'Completed',
      adminRemarks: reason || 'Admin credit',
      processedAt: new Date(),
      processedBy: adminId || null
    })
    
    console.log(`[Admin] Added $${amount} to trading account ${account.accountId}. Balance: $${previousBalance} -> $${account.balance}`)
    
    res.json({ 
      success: true,
      message: 'Funds added to trading account successfully',
      previousBalance,
      newBalance: account.balance
    })
  } catch (error) {
    console.error('Error adding funds to trading account:', error)
    res.status(500).json({ success: false, message: 'Error adding funds', error: error.message })
  }
})

// POST /api/admin/trading-account/:id/deduct - Deduct funds from trading account (Admin only)
router.post('/trading-account/:id/deduct', async (req, res) => {
  try {
    const { amount, reason, adminId } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' })
    }
    
    const TradingAccount = (await import('../models/TradingAccount.js')).default
    const Transaction = (await import('../models/Transaction.js')).default
    const account = await TradingAccount.findById(req.params.id)
    if (!account) {
      return res.status(404).json({ success: false, message: 'Trading account not found' })
    }
    
    const previousBalance = account.balance || 0
    if (previousBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance in trading account' })
    }
    
    account.balance = previousBalance - parseFloat(amount)
    await account.save()
    
    // Create transaction record for user's history
    await Transaction.create({
      userId: account.userId,
      tradingAccountId: account._id,
      tradingAccountName: account.accountId,
      type: 'Admin_Debit',
      amount: parseFloat(amount),
      paymentMethod: 'System',
      status: 'Completed',
      adminRemarks: reason || 'Admin debit',
      processedAt: new Date(),
      processedBy: adminId || null
    })
    
    console.log(`[Admin] Deducted $${amount} from trading account ${account.accountId}. Balance: $${previousBalance} -> $${account.balance}`)
    
    res.json({ 
      success: true,
      message: 'Funds deducted from trading account successfully',
      previousBalance,
      newBalance: account.balance
    })
  } catch (error) {
    console.error('Error deducting funds from trading account:', error)
    res.status(500).json({ success: false, message: 'Error deducting funds', error: error.message })
  }
})

// PUT /api/admin/users/:id/block - Block/Unblock user
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    const { blocked, reason } = req.body
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    user.isBlocked = blocked
    user.blockReason = blocked ? (reason || 'Blocked by admin') : ''
    await user.save()
    
    res.json({ 
      success: true,
      message: blocked ? 'User blocked successfully' : 'User unblocked successfully',
      isBlocked: user.isBlocked
    })
  } catch (error) {
    console.error('Error updating user block status:', error)
    res.status(500).json({ success: false, message: 'Error updating user status', error: error.message })
  }
})

// PUT /api/admin/users/:id/ban - Ban/Unban user
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    const { banned, reason } = req.body
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    
    user.isBanned = banned
    user.banReason = banned ? (reason || 'Banned by admin') : ''
    if (banned) {
      user.isBlocked = true
    }
    await user.save()
    
    res.json({ 
      success: true,
      message: banned ? 'User banned successfully' : 'User unbanned successfully',
      isBanned: user.isBanned
    })
  } catch (error) {
    console.error('Error updating user ban status:', error)
    res.status(500).json({ success: false, message: 'Error updating user status', error: error.message })
  }
})

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message })
  }
})

// ==================== CREDIT/BONUS SYSTEM ====================

// POST /api/admin/trading-account/:id/add-credit - Add credit/bonus to trading account
router.post('/trading-account/:id/add-credit', async (req, res) => {
  try {
    const { id } = req.params
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid account ID' })
    }
    const { amount, reason, adminId } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' })
    }
    
    const TradingAccount = (await import('../models/TradingAccount.js')).default
    const account = await TradingAccount.findById(id)
    if (!account) {
      return res.status(404).json({ success: false, message: 'Trading account not found' })
    }
    
    const previousCredit = account.credit || 0
    account.credit = previousCredit + parseFloat(amount)
    await account.save()
    
    // Log the credit addition (optional - don't fail if logging fails)
    if (adminId) {
      try {
        const AdminLog = (await import('../models/AdminLog.js')).default
        await AdminLog.create({
          adminId,
          action: 'ADD_CREDIT',
          targetType: 'TRADING_ACCOUNT',
          targetId: account._id,
          previousValue: { credit: previousCredit },
          newValue: { credit: account.credit },
          reason: reason || 'Credit/Bonus added'
        })
      } catch (logError) {
        console.error('Error logging credit addition:', logError)
      }
    }
    
    res.json({ 
      success: true,
      message: 'Credit added successfully',
      previousCredit,
      newCredit: account.credit,
      balance: account.balance
    })
  } catch (error) {
    console.error('Error adding credit:', error)
    res.status(500).json({ success: false, message: 'Error adding credit', error: error.message })
  }
})

// POST /api/admin/trading-account/:id/remove-credit - Remove credit from trading account
router.post('/trading-account/:id/remove-credit', async (req, res) => {
  try {
    const { amount, reason, adminId } = req.body
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }
    
    const TradingAccount = (await import('../models/TradingAccount.js')).default
    const account = await TradingAccount.findById(req.params.id)
    if (!account) {
      return res.status(404).json({ message: 'Trading account not found' })
    }
    
    const previousCredit = account.credit || 0
    if (amount > previousCredit) {
      return res.status(400).json({ message: 'Cannot remove more credit than available' })
    }
    
    account.credit = previousCredit - parseFloat(amount)
    await account.save()
    
    // Log the credit removal (optional)
    if (adminId) {
      try {
        const AdminLog = (await import('../models/AdminLog.js')).default
        await AdminLog.create({
          adminId,
          action: 'REMOVE_CREDIT',
          targetType: 'TRADING_ACCOUNT',
          targetId: account._id,
          previousValue: { credit: previousCredit },
          newValue: { credit: account.credit },
          reason: reason || 'Credit removed'
        })
      } catch (logError) {
        console.error('Error logging credit removal:', logError)
      }
    }
    
    res.json({ 
      message: 'Credit removed successfully',
      previousCredit,
      newCredit: account.credit
    })
  } catch (error) {
    console.error('Error removing credit:', error)
    res.status(500).json({ message: 'Error removing credit', error: error.message })
  }
})

// GET /api/admin/trading-account/:id/summary - Get account summary with equity calculation
router.get('/trading-account/:id/summary', async (req, res) => {
  try {
    const TradingAccount = (await import('../models/TradingAccount.js')).default
    const Trade = (await import('../models/Trade.js')).default
    
    const account = await TradingAccount.findById(req.params.id).populate('userId', 'firstName lastName email')
    if (!account) {
      return res.status(404).json({ message: 'Trading account not found' })
    }
    
    // Get open trades for margin calculation
    const openTrades = await Trade.find({ tradingAccountId: account._id, status: 'OPEN' })
    
    const usedMargin = openTrades.reduce((sum, t) => sum + (t.marginUsed || 0), 0)
    const floatingPnl = openTrades.reduce((sum, t) => sum + (t.floatingPnl || 0), 0)
    
    // Equity = Balance + Credit + Floating PnL
    const equity = account.balance + (account.credit || 0) + floatingPnl
    const freeMargin = equity - usedMargin
    const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0
    
    res.json({
      account: {
        _id: account._id,
        accountId: account.accountId,
        userId: account.userId,
        balance: account.balance,
        credit: account.credit || 0,
        equity,
        usedMargin,
        freeMargin,
        marginLevel: marginLevel.toFixed(2),
        floatingPnl,
        leverage: account.leverage,
        status: account.status,
        openTradesCount: openTrades.length
      }
    })
  } catch (error) {
    console.error('Error fetching account summary:', error)
    res.status(500).json({ message: 'Error fetching account summary', error: error.message })
  }
})

// POST /api/admin/login-as-user/:userId - Generate token to login as user
router.post('/login-as-user/:userId', async (req, res) => {
  try {
    const { adminId } = req.body
    
    const user = await User.findById(req.params.userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    
    // Log the admin login as user action (optional)
    if (adminId) {
      try {
        const AdminLog = (await import('../models/AdminLog.js')).default
        await AdminLog.create({
          adminId,
          action: 'LOGIN_AS_USER',
          targetType: 'USER',
          targetId: user._id,
          reason: `Admin logged in as user: ${user.email}`
        })
      } catch (logError) {
        console.error('Error logging login as user:', logError)
      }
    }
    
    // Generate a simple token (in production, use JWT)
    const jwt = (await import('jsonwebtoken')).default
    const token = jwt.sign(
      { userId: user._id, email: user.email, isAdminSession: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '2h' }
    )
    
    res.json({
      message: 'Login as user successful',
      token,
      user
    })
  } catch (error) {
    console.error('Error logging in as user:', error)
    res.status(500).json({ message: 'Error logging in as user', error: error.message })
  }
})

// ==================== PASSWORD RESET REQUESTS ====================

// GET /api/admin/password-reset-requests - Get all password reset requests
router.get('/password-reset-requests', async (req, res) => {
  try {
    const PasswordResetRequest = (await import('../models/PasswordResetRequest.js')).default
    const { status } = req.query
    
    const filter = status ? { status } : {}
    const requests = await PasswordResetRequest.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
    
    // Get stats
    const pendingCount = await PasswordResetRequest.countDocuments({ status: 'Pending' })
    const completedCount = await PasswordResetRequest.countDocuments({ status: 'Completed' })
    const rejectedCount = await PasswordResetRequest.countDocuments({ status: 'Rejected' })
    
    res.json({ 
      success: true, 
      requests,
      stats: { pending: pendingCount, completed: completedCount, rejected: rejectedCount }
    })
  } catch (error) {
    console.error('Error fetching password reset requests:', error)
    res.status(500).json({ success: false, message: 'Error fetching requests', error: error.message })
  }
})

// PUT /api/admin/password-reset-requests/:id/process - Process password reset request
router.put('/password-reset-requests/:id/process', async (req, res) => {
  try {
    const { action, newPassword, adminRemarks } = req.body
    const PasswordResetRequest = (await import('../models/PasswordResetRequest.js')).default
    
    const request = await PasswordResetRequest.findById(req.params.id).populate('userId')
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' })
    }
    
    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' })
    }
    
    if (action === 'approve') {
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' })
      }
      
      // Update user password
      const user = await User.findById(request.userId._id)
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' })
      }
      
      // Update email if requested
      if (request.newEmail) {
        user.email = request.newEmail
      }
      
      user.password = newPassword
      await user.save()
      
      request.status = 'Completed'
      request.processedAt = new Date()
      request.adminRemarks = adminRemarks || 'Password reset and sent to user email'
      await request.save()
      
      console.log(`[Password Reset] Completed for user: ${user.email}`)
      
      res.json({ 
        success: true, 
        message: `Password reset for ${user.email}. New password: ${newPassword}`,
        email: request.newEmail || request.email
      })
    } else if (action === 'reject') {
      request.status = 'Rejected'
      request.processedAt = new Date()
      request.adminRemarks = adminRemarks || 'Request rejected'
      await request.save()
      
      res.json({ success: true, message: 'Request rejected' })
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' })
    }
  } catch (error) {
    console.error('Error processing password reset:', error)
    res.status(500).json({ success: false, message: 'Error processing request', error: error.message })
  }
})

export default router
