import express from 'express'
import oxapayService from '../services/oxapayService.js'
import PaymentGateway from '../models/PaymentGateway.js'
import CryptoTransaction from '../models/CryptoTransaction.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import KYC from '../models/KYC.js'

const router = express.Router()

// Helper to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return id && id !== 'undefined' && id !== 'null' && /^[a-fA-F0-9]{24}$/.test(id)
}

// ==================== USER ROUTES ====================

// GET /api/oxapay/status - Check if Oxapay is available
router.get('/status', async (req, res) => {
  try {
    const status = await oxapayService.isAvailable()
    res.json({ success: true, ...status })
  } catch (error) {
    console.error('[Oxapay] Status check error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/oxapay/deposit - Create a deposit request (authenticated user)
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { userId, amount, currency = 'USD', cryptoCurrency = 'USDT' } = req.body

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Amount is required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' })
    }

    const result = await oxapayService.createDeposit(userId, amount, currency, cryptoCurrency, {
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    })

    res.json(result)
  } catch (error) {
    console.error('[Oxapay] Deposit error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/transaction/:id - Get transaction status
router.get('/transaction/:id', authMiddleware, async (req, res) => {
  try {
    const result = await oxapayService.getTransactionStatus(req.params.id)
    res.json({ success: true, transaction: result })
  } catch (error) {
    res.status(404).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/transactions - Get user's transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { page, limit, type, status } = req.query
    const userId = req.user._id

    const result = await oxapayService.getUserTransactions(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      status
    })

    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== USER WITHDRAWAL REQUEST ====================

// POST /api/oxapay/withdraw - User requests crypto withdrawal (authenticated user)
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { userId, amount, cryptoCurrency = 'USDT', walletAddress, network = 'TRC20' } = req.body

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' })
    }
    if (!amount || !walletAddress) {
      return res.status(400).json({ success: false, message: 'Amount and wallet address are required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' })
    }

    // SECURITY CHECK: Verify KYC is approved before crypto withdrawal
    const kyc = await KYC.findOne({ userId, status: 'approved' })
    if (!kyc) {
      return res.status(400).json({ 
        success: false, 
        message: 'KYC verification required before withdrawal. Please complete your KYC first.' 
      })
    }

    // Validate gateway
    const gateway = await PaymentGateway.findOne({ name: 'oxapay', isActive: true })
    if (!gateway) {
      return res.status(400).json({ success: false, message: 'Oxapay gateway is not available' })
    }

    if (!gateway.withdrawalEnabled) {
      return res.status(400).json({ success: false, message: 'Crypto withdrawals are not enabled' })
    }

    // Check limits
    if (amount < gateway.minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is $${gateway.minWithdrawal}` })
    }
    if (amount > gateway.maxWithdrawal) {
      return res.status(400).json({ success: false, message: `Maximum withdrawal is $${gateway.maxWithdrawal}` })
    }

    // Check user balance
    const User = (await import('../models/User.js')).default
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' })
    }

    // Generate idempotency key
    const idempotencyKey = `${userId}-${amount}-${Date.now()}`

    // Create withdrawal request (pending admin approval) - NO balance deduction yet
    const transaction = new CryptoTransaction({
      userId,
      gateway: 'oxapay',
      type: 'withdrawal',
      amount,
      currency: 'USD',
      cryptoCurrency,
      paymentAddress: walletAddress,
      network,
      status: 'pending',
      idempotencyKey,
      walletDebited: false,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    })

    await transaction.save()
    
    console.log(`[Oxapay] Withdrawal request created: ${transaction._id}, amount: $${amount}, status: pending (balance NOT deducted yet)`)

    res.json({
      success: true,
      message: 'Withdrawal request submitted. Pending admin approval.',
      transaction: {
        id: transaction._id,
        amount,
        cryptoCurrency,
        walletAddress,
        network,
        status: 'pending'
      }
    })
  } catch (error) {
    console.error('[Oxapay] Withdraw request error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/withdraw/status - Check withdrawal availability
router.get('/withdraw/status', async (req, res) => {
  try {
    const gateway = await PaymentGateway.findOne({ name: 'oxapay', isActive: true })
    
    if (!gateway || !gateway.withdrawalEnabled) {
      return res.json({ 
        success: true, 
        available: false, 
        reason: 'Crypto withdrawals are not available' 
      })
    }

    res.json({
      success: true,
      available: true,
      minWithdrawal: gateway.minWithdrawal,
      maxWithdrawal: gateway.maxWithdrawal,
      supportedCryptos: gateway.supportedCryptos || ['USDT', 'BTC', 'ETH', 'TRX']
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== WEBHOOK ROUTE ====================

// POST /api/oxapay/webhook - Handle Oxapay webhook callbacks
router.post('/webhook', async (req, res) => {
  try {
    const hmacHeader = req.headers['hmac']
    const rawBody = JSON.stringify(req.body)
    
    console.log('[Oxapay] Webhook received from gateway')

    const result = await oxapayService.processWebhook(req.body, hmacHeader, rawBody)
    
    // Oxapay requires "ok" response
    res.status(200).send('ok')
  } catch (error) {
    console.error('[Oxapay] Webhook error:', error)
    // Still return 200 with "ok" to prevent retries
    res.status(200).send('ok')
  }
})

// ==================== ADMIN ROUTES (Protected) ====================

// GET /api/oxapay/admin/transaction/:id - Get transaction details (admin only)
router.get('/admin/transaction/:id', adminMiddleware, async (req, res) => {
  try {
    const transaction = await CryptoTransaction.findById(req.params.id)
      .populate('userId', 'firstName lastName email walletBalance')

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' })
    }

    res.json({ 
      success: true, 
      transaction: {
        id: transaction._id,
        trackId: transaction.gatewayOrderId,
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        walletCredited: transaction.walletCredited,
        walletDebited: transaction.walletDebited,
        refunded: transaction.refunded,
        user: transaction.userId,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/test/user-balance/:userId - Get user balance for testing
router.get('/test/user-balance/:userId', async (req, res) => {
  try {
    const mode = process.env.PAYMENT_MODE || 'TEST'
    
    if (mode !== 'TEST') {
      return res.status(403).json({ 
        success: false, 
        message: 'Test endpoints only available in TEST mode'
      })
    }

    const User = (await import('../models/User.js')).default
    const user = await User.findById(req.params.userId).select('firstName lastName email walletBalance')

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        walletBalance: user.walletBalance || 0
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== ADMIN ROUTES (Protected) ====================

// GET /api/oxapay/admin/transactions - Get all transactions (admin only)
router.get('/admin/transactions', adminMiddleware, async (req, res) => {
  try {
    const { page, limit, status, type, startDate, endDate } = req.query
    const result = await oxapayService.getAllTransactions({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      status,
      type,
      startDate,
      endDate
    })
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/admin/config - Get gateway configuration (admin only)
router.get('/admin/config', adminMiddleware, async (req, res) => {
  try {
    let gateway = await PaymentGateway.findOne({ name: 'oxapay' })
    
    // Create default config if not exists
    if (!gateway) {
      gateway = await PaymentGateway.create({
        name: 'oxapay',
        displayName: 'Oxapay',
        type: 'crypto',
        isActive: false,
        depositEnabled: true,
        withdrawalEnabled: false,
        minDeposit: 10,
        maxDeposit: 100000,
        minWithdrawal: 10,
        maxWithdrawal: 50000,
        depositFeePercent: 0,
        depositFeeFixed: 0,
        withdrawalFeePercent: 0,
        withdrawalFeeFixed: 0,
        supportedCryptos: ['USDT', 'BTC', 'ETH', 'TRX', 'LTC', 'BNB'],
        apiConfig: {}
      })
    }

    // Don't expose sensitive API keys
    const safeConfig = {
      ...gateway.toObject(),
      apiConfig: undefined,
      hasMerchantApiKey: !!gateway.apiConfig?.merchantApiKey
    }

    res.json({ success: true, gateway: safeConfig })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/oxapay/admin/config - Update gateway configuration (admin only)
router.put('/admin/config', adminMiddleware, async (req, res) => {
  try {
    const {
      isActive,
      depositEnabled,
      minDeposit,
      maxDeposit,
      withdrawalEnabled,
      minWithdrawal,
      maxWithdrawal,
      depositFeePercent,
      depositFeeFixed,
      withdrawalFeePercent,
      withdrawalFeeFixed,
      supportedCryptos,
      description,
      instructions,
      merchantApiKey
    } = req.body

    let gateway = await PaymentGateway.findOne({ name: 'oxapay' })
    
    if (!gateway) {
      gateway = new PaymentGateway({ name: 'oxapay', displayName: 'Oxapay', type: 'crypto' })
    }

    // Update basic settings
    if (isActive !== undefined) gateway.isActive = isActive
    if (depositEnabled !== undefined) gateway.depositEnabled = depositEnabled
    if (minDeposit !== undefined) gateway.minDeposit = minDeposit
    if (maxDeposit !== undefined) gateway.maxDeposit = maxDeposit
    if (withdrawalEnabled !== undefined) gateway.withdrawalEnabled = withdrawalEnabled
    if (minWithdrawal !== undefined) gateway.minWithdrawal = minWithdrawal
    if (maxWithdrawal !== undefined) gateway.maxWithdrawal = maxWithdrawal
    if (depositFeePercent !== undefined) gateway.depositFeePercent = depositFeePercent
    if (depositFeeFixed !== undefined) gateway.depositFeeFixed = depositFeeFixed
    if (withdrawalFeePercent !== undefined) gateway.withdrawalFeePercent = withdrawalFeePercent
    if (withdrawalFeeFixed !== undefined) gateway.withdrawalFeeFixed = withdrawalFeeFixed
    if (supportedCryptos) gateway.supportedCryptos = supportedCryptos
    if (description !== undefined) gateway.description = description
    if (instructions !== undefined) gateway.instructions = instructions

    // Update API config (only Merchant API Key needed)
    if (!gateway.apiConfig) gateway.apiConfig = {}
    if (merchantApiKey) gateway.apiConfig.merchantApiKey = merchantApiKey

    await gateway.save()

    console.log(`[Oxapay] Gateway config updated by admin`)

    res.json({ success: true, message: 'Configuration updated successfully' })
  } catch (error) {
    console.error('[Oxapay] Config update error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/admin/stats - Get transaction statistics (admin only)
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const stats = await CryptoTransaction.aggregate([
      { $match: { gateway: 'oxapay' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    const totalDeposits = await CryptoTransaction.aggregate([
      { $match: { gateway: 'oxapay', type: 'deposit', status: 'success' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ])

    const totalWithdrawals = await CryptoTransaction.aggregate([
      { $match: { gateway: 'oxapay', type: 'withdrawal', status: 'success' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayDeposits = await CryptoTransaction.aggregate([
      { $match: { gateway: 'oxapay', type: 'deposit', status: 'success', createdAt: { $gte: today } } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ])

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        totalDeposits: totalDeposits[0] || { count: 0, totalAmount: 0 },
        totalWithdrawals: totalWithdrawals[0] || { count: 0, totalAmount: 0 },
        todayDeposits: todayDeposits[0] || { count: 0, totalAmount: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/oxapay/admin/manual-credit - Manually credit a transaction (admin only)
router.post('/admin/manual-credit/:transactionId', adminMiddleware, async (req, res) => {
  try {
    const { adminNotes } = req.body
    const transaction = await CryptoTransaction.findById(req.params.transactionId)
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' })
    }

    if (transaction.walletCredited) {
      return res.status(400).json({ success: false, message: 'Transaction already credited' })
    }

    // Use atomic credit
    const result = await oxapayService.handlePaymentSuccess(transaction)
    
    // Update admin notes
    transaction.adminNotes = adminNotes || 'Manually credited by admin'
    await transaction.save()

    console.log(`[Oxapay] Transaction ${transaction._id} manually credited by admin`)

    res.json({ success: true, message: 'Transaction credited successfully', result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/oxapay/admin/withdrawal-requests - Get pending withdrawal requests (admin only)
router.get('/admin/withdrawal-requests', adminMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query
    
    const requests = await CryptoTransaction.find({ 
      gateway: 'oxapay', 
      type: 'withdrawal',
      status 
    })
      .populate('userId', 'firstName lastName email walletBalance')
      .sort({ createdAt: -1 })

    const pendingCount = await CryptoTransaction.countDocuments({ 
      gateway: 'oxapay', 
      type: 'withdrawal', 
      status: 'pending' 
    })

    res.json({ success: true, requests, pendingCount })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/oxapay/admin/approve-withdrawal/:id - Approve and process withdrawal (admin only)
router.post('/admin/approve-withdrawal/:id', adminMiddleware, async (req, res) => {
  try {
    const { adminNotes } = req.body
    const transaction = await CryptoTransaction.findById(req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' })
    }

    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ success: false, message: 'Not a withdrawal request' })
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' })
    }

    if (transaction.walletDebited) {
      return res.status(400).json({ success: false, message: 'Withdrawal already processed (wallet debited)' })
    }

    // STEP 1: Atomically debit user's wallet
    console.log(`[Oxapay] Approving withdrawal ${transaction._id}: Debiting $${transaction.amount} from user ${transaction.userId}`)
    
    try {
      await oxapayService.atomicDebitForWithdrawal(
        transaction.userId,
        transaction.amount,
        transaction._id
      )
    } catch (debitError) {
      console.error(`[Oxapay] Debit failed for withdrawal ${transaction._id}:`, debitError.message)
      return res.status(400).json({ 
        success: false, 
        message: `Cannot approve: ${debitError.message}` 
      })
    }

    // STEP 2: Process the payout via Oxapay API
    try {
      const result = await oxapayService.createPayout(
        transaction.userId,
        transaction.amount,
        transaction.cryptoCurrency || 'USDT',
        transaction.paymentAddress,
        transaction.network || 'TRC20',
        { adminNotes: adminNotes || 'Approved by admin' }
      )

      // Update original transaction
      transaction.status = 'processing'
      transaction.adminNotes = adminNotes || 'Approved and processing'
      transaction.gatewayOrderId = result.transaction?.trackId || ''
      await transaction.save()

      console.log(`[Oxapay] Withdrawal ${transaction._id} approved and sent to gateway`)

      res.json({ 
        success: true, 
        message: 'Withdrawal approved and processing',
        transaction: result.transaction
      })
    } catch (payoutError) {
      // STEP 3: If payout fails, atomically refund the user
      console.error(`[Oxapay] Payout API failed for withdrawal ${transaction._id}:`, payoutError.message)
      
      try {
        await oxapayService.atomicRefundWithdrawal(transaction._id, `Payout failed: ${payoutError.message}`)
        console.log(`[Oxapay] User refunded for failed withdrawal ${transaction._id}`)
      } catch (refundError) {
        console.error(`[Oxapay] CRITICAL: Refund failed for withdrawal ${transaction._id}:`, refundError.message)
        transaction.errorMessage = `CRITICAL: Debit succeeded but payout and refund failed. Manual intervention required.`
        transaction.status = 'failed'
        await transaction.save()
        
        return res.status(500).json({ 
          success: false, 
          message: `CRITICAL ERROR: Payout failed and refund failed. Manual intervention required.`,
          transactionId: transaction._id
        })
      }

      res.status(400).json({ 
        success: false, 
        message: `Payout failed: ${payoutError.message}. User has been refunded.` 
      })
    }
  } catch (error) {
    console.error('[Oxapay] Approve withdrawal error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/oxapay/admin/reject-withdrawal/:id - Reject withdrawal request (admin only)
router.post('/admin/reject-withdrawal/:id', adminMiddleware, async (req, res) => {
  try {
    const { reason } = req.body
    const transaction = await CryptoTransaction.findById(req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' })
    }

    if (transaction.status !== 'pending' && transaction.status !== 'processing') {
      return res.status(400).json({ success: false, message: 'Request already processed' })
    }

    // Check if wallet was debited - if so, need to refund atomically
    if (transaction.walletDebited && !transaction.refunded) {
      console.log(`[Oxapay] Rejecting withdrawal ${transaction._id} - refunding debited amount`)
      try {
        await oxapayService.atomicRefundWithdrawal(transaction._id, reason || 'Rejected by admin')
        console.log(`[Oxapay] Withdrawal ${transaction._id} rejected and refunded`)
        return res.json({ success: true, message: 'Withdrawal rejected and user refunded' })
      } catch (refundError) {
        console.error(`[Oxapay] Refund failed for rejection ${transaction._id}:`, refundError.message)
        return res.status(500).json({ 
          success: false, 
          message: `Failed to refund: ${refundError.message}` 
        })
      }
    }

    // Wallet was never debited - just mark as failed
    transaction.status = 'failed'
    transaction.errorMessage = reason || 'Rejected by admin'
    transaction.adminNotes = `Rejected: ${reason || 'No reason provided'}`
    await transaction.save()

    console.log(`[Oxapay] Withdrawal ${transaction._id} rejected (no refund needed - never debited)`)
    res.json({ success: true, message: 'Withdrawal request rejected' })
  } catch (error) {
    console.error('[Oxapay] Reject withdrawal error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/oxapay/admin/payout - Create direct payout (admin only)
router.post('/admin/payout', adminMiddleware, async (req, res) => {
  try {
    const { userId, amount, cryptoCurrency, walletAddress, network, adminNotes } = req.body

    if (!userId || !amount || !walletAddress) {
      return res.status(400).json({ success: false, message: 'User ID, amount, and wallet address are required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' })
    }

    const result = await oxapayService.createPayout(
      userId,
      amount,
      cryptoCurrency || 'USDT',
      walletAddress,
      network || 'TRC20',
      { adminNotes }
    )

    res.json(result)
  } catch (error) {
    console.error('[Oxapay] Payout error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

export default router
