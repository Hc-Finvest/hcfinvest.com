import express from 'express'
import cryptrumService from '../services/cryptrumService.js'
import PaymentGateway from '../models/PaymentGateway.js'
import CryptoTransaction from '../models/CryptoTransaction.js'

const router = express.Router()

// ==================== USER ROUTES ====================

// GET /api/cryptrum/status - Check if Cryptrum is available
router.get('/status', async (req, res) => {
  try {
    const status = await cryptrumService.isAvailable()
    res.json({ success: true, ...status })
  } catch (error) {
    console.error('[Cryptrum] Status check error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/cryptrum/deposit - Create a deposit request
router.post('/deposit', async (req, res) => {
  try {
    const { userId, amount, currency = 'USD', cryptoCurrency = 'USDT' } = req.body

    if (!userId || !amount) {
      return res.status(400).json({ success: false, message: 'User ID and amount are required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' })
    }

    const result = await cryptrumService.createDeposit(userId, amount, currency, cryptoCurrency, {
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    })

    res.json(result)
  } catch (error) {
    console.error('[Cryptrum] Deposit error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/transaction/:id - Get transaction status
router.get('/transaction/:id', async (req, res) => {
  try {
    const status = await cryptrumService.getTransactionStatus(req.params.id)
    res.json({ success: true, transaction: status })
  } catch (error) {
    res.status(404).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/transactions/:userId - Get user's crypto transactions
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { page, limit, status, type } = req.query
    const result = await cryptrumService.getUserTransactions(req.params.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      type
    })
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== USER WITHDRAWAL REQUEST ====================

// POST /api/cryptrum/withdraw - User requests crypto withdrawal
router.post('/withdraw', async (req, res) => {
  try {
    const { userId, amount, cryptoCurrency = 'USDT', walletAddress } = req.body

    if (!userId || !amount || !walletAddress) {
      return res.status(400).json({ success: false, message: 'User ID, amount, and wallet address are required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' })
    }

    // Import models
    const User = (await import('../models/User.js')).default
    const KYC = (await import('../models/KYC.js')).default

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    // Check wallet balance
    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' })
    }

    // Check gateway config
    const gateway = await PaymentGateway.findOne({ name: 'cryptrum' })
    if (!gateway || !gateway.isActive) {
      return res.status(400).json({ success: false, message: 'Crypto withdrawals are not available' })
    }

    if (!gateway.withdrawalEnabled) {
      return res.status(400).json({ success: false, message: 'Crypto withdrawals are currently disabled' })
    }

    // Check withdrawal limits
    if (amount < gateway.minWithdrawal) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal is $${gateway.minWithdrawal}` })
    }
    if (amount > gateway.maxWithdrawal) {
      return res.status(400).json({ success: false, message: `Maximum withdrawal is $${gateway.maxWithdrawal}` })
    }

    // Check KYC status (optional - based on gateway config)
    const kyc = await KYC.findOne({ userId })
    const kycRequired = gateway.apiConfig?.requireKYC !== false
    if (kycRequired && (!kyc || kyc.status !== 'Approved')) {
      return res.status(400).json({ success: false, message: 'KYC verification required for withdrawals' })
    }

    // Generate idempotency key
    const idempotencyKey = cryptrumService.generateIdempotencyKey(userId, amount, Date.now())

    // Create withdrawal request (pending admin approval)
    const transaction = new CryptoTransaction({
      userId,
      gateway: 'cryptrum',
      type: 'withdrawal',
      amount,
      currency: 'USD',
      cryptoCurrency,
      paymentAddress: walletAddress,
      status: 'pending', // Pending admin approval
      idempotencyKey,
      ipAddress: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent']
    })

    // Deduct from wallet immediately (hold)
    user.walletBalance = (user.walletBalance || 0) - amount
    await user.save()

    await transaction.save()

    // Withdrawal request created

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. Pending approval.',
      transaction: {
        id: transaction._id,
        amount,
        cryptoCurrency,
        walletAddress,
        status: 'pending'
      }
    })
  } catch (error) {
    console.error('[Cryptrum] Withdrawal request error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/withdraw/status - Check withdrawal availability
router.get('/withdraw/status', async (req, res) => {
  try {
    const gateway = await PaymentGateway.findOne({ name: 'cryptrum' })
    
    if (!gateway || !gateway.isActive || !gateway.withdrawalEnabled) {
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
      requireKYC: gateway.apiConfig?.requireKYC !== false
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// ==================== WEBHOOK ROUTE ====================

// POST /api/cryptrum/webhook - Handle Cryptrum webhook callbacks
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'] || req.headers['x-cryptrum-signature']
    const timestamp = req.headers['x-timestamp'] || req.headers['x-cryptrum-timestamp']
    
    // Webhook received

    const result = await cryptrumService.processWebhook(req.body, signature, timestamp)
    
    // Always return 200 to acknowledge receipt
    res.json({ success: true, ...result })
  } catch (error) {
    console.error('[Cryptrum] Webhook error:', error)
    // Still return 200 to prevent retries for invalid requests
    res.status(200).json({ success: false, message: error.message })
  }
})

// ==================== ADMIN ROUTES ====================

// GET /api/cryptrum/admin/transactions - Get all transactions (admin)
router.get('/admin/transactions', async (req, res) => {
  try {
    const { page, limit, status, gateway, startDate, endDate } = req.query
    const result = await cryptrumService.getAllTransactions({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      status,
      gateway,
      startDate,
      endDate
    })
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/admin/config - Get gateway configuration
router.get('/admin/config', async (req, res) => {
  try {
    let gateway = await PaymentGateway.findOne({ name: 'cryptrum' })
    
    // Create default config if not exists
    if (!gateway) {
      gateway = await PaymentGateway.create({
        name: 'cryptrum',
        displayName: 'Cryptrum',
        type: 'crypto',
        isActive: false,
        depositEnabled: true,
        minDeposit: 10,
        maxDeposit: 100000,
        withdrawalEnabled: false,
        minWithdrawal: 10,
        maxWithdrawal: 50000,
        supportedCryptos: [
          { symbol: 'USDT', name: 'Tether', network: 'TRC20', isActive: true },
          { symbol: 'USDT', name: 'Tether', network: 'ERC20', isActive: true },
          { symbol: 'BTC', name: 'Bitcoin', network: 'BTC', isActive: true },
          { symbol: 'ETH', name: 'Ethereum', network: 'ERC20', isActive: true },
          { symbol: 'USDC', name: 'USD Coin', network: 'ERC20', isActive: true }
        ],
        description: 'Pay with cryptocurrency via Cryptrum',
        instructions: 'Select your preferred cryptocurrency and complete the payment within the time limit.'
      })
    }

    // Don't expose API secrets to frontend
    const safeConfig = {
      _id: gateway._id,
      name: gateway.name,
      displayName: gateway.displayName,
      type: gateway.type,
      isActive: gateway.isActive,
      depositEnabled: gateway.depositEnabled,
      minDeposit: gateway.minDeposit,
      maxDeposit: gateway.maxDeposit,
      withdrawalEnabled: gateway.withdrawalEnabled,
      minWithdrawal: gateway.minWithdrawal,
      maxWithdrawal: gateway.maxWithdrawal,
      depositFeePercent: gateway.depositFeePercent,
      depositFeeFixed: gateway.depositFeeFixed,
      supportedCryptos: gateway.supportedCryptos,
      description: gateway.description,
      instructions: gateway.instructions,
      hasApiKey: !!gateway.apiConfig?.apiKey,
      hasMerchantId: !!gateway.apiConfig?.merchantId,
      hasWebhookSecret: !!gateway.apiConfig?.webhookSecret
    }

    res.json({ success: true, gateway: safeConfig })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/cryptrum/admin/config - Update gateway configuration
router.put('/admin/config', async (req, res) => {
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
      supportedCryptos,
      description,
      instructions,
      apiKey,
      apiSecret,
      merchantId,
      webhookSecret,
      baseUrl,
      testMode
    } = req.body

    let gateway = await PaymentGateway.findOne({ name: 'cryptrum' })
    
    if (!gateway) {
      gateway = new PaymentGateway({ name: 'cryptrum', displayName: 'Cryptrum', type: 'crypto' })
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
    if (supportedCryptos !== undefined) gateway.supportedCryptos = supportedCryptos
    if (description !== undefined) gateway.description = description
    if (instructions !== undefined) gateway.instructions = instructions

    // Update API config (only if provided)
    if (!gateway.apiConfig) gateway.apiConfig = {}
    if (apiKey !== undefined) gateway.apiConfig.apiKey = apiKey
    if (apiSecret !== undefined) gateway.apiConfig.apiSecret = apiSecret
    if (merchantId !== undefined) gateway.apiConfig.merchantId = merchantId
    if (webhookSecret !== undefined) gateway.apiConfig.webhookSecret = webhookSecret
    if (baseUrl !== undefined) gateway.apiConfig.baseUrl = baseUrl
    if (testMode !== undefined) gateway.apiConfig.testMode = testMode

    await gateway.save()

    // Config updated

    res.json({ success: true, message: 'Configuration updated successfully' })
  } catch (error) {
    console.error('[Cryptrum] Config update error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/admin/stats - Get transaction statistics
router.get('/admin/stats', async (req, res) => {
  try {
    const stats = await CryptoTransaction.aggregate([
      { $match: { gateway: 'cryptrum' } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    const totalDeposits = await CryptoTransaction.aggregate([
      { $match: { gateway: 'cryptrum', type: 'deposit', status: 'success' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    const todayDeposits = await CryptoTransaction.aggregate([
      { 
        $match: { 
          gateway: 'cryptrum', 
          type: 'deposit', 
          status: 'success',
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        } 
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    res.json({
      success: true,
      stats: {
        byStatus: stats,
        totalDeposits: totalDeposits[0] || { count: 0, totalAmount: 0 },
        todayDeposits: todayDeposits[0] || { count: 0, totalAmount: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/cryptrum/admin/manual-credit - Manually credit a transaction (admin only)
router.post('/admin/manual-credit/:transactionId', async (req, res) => {
  try {
    const { adminNotes } = req.body
    const transaction = await CryptoTransaction.findById(req.params.transactionId)
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' })
    }

    if (transaction.walletCredited) {
      return res.status(400).json({ success: false, message: 'Transaction already credited' })
    }

    // Manually trigger credit
    await cryptrumService.handlePaymentSuccess(transaction)
    
    // Add admin notes
    transaction.adminNotes = adminNotes || 'Manually credited by admin'
    await transaction.save()

    res.json({ success: true, message: 'Transaction credited successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/cryptrum/admin/payout - Create crypto payout to user (admin only)
router.post('/admin/payout', async (req, res) => {
  try {
    const { userId, amount, cryptoCurrency, walletAddress, adminNotes } = req.body

    if (!userId || !amount || !walletAddress) {
      return res.status(400).json({ success: false, message: 'User ID, amount, and wallet address are required' })
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0' })
    }

    const result = await cryptrumService.createPayout(
      userId, 
      parseFloat(amount), 
      cryptoCurrency || 'USDT', 
      walletAddress,
      { adminNotes }
    )

    res.json(result)
  } catch (error) {
    console.error('[Cryptrum] Payout error:', error)
    res.status(400).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/admin/payouts - Get all payouts (admin only)
router.get('/admin/payouts', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query
    
    const query = { gateway: 'cryptrum', type: 'withdrawal' }
    if (status) query.status = status

    const payouts = await CryptoTransaction.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))

    const total = await CryptoTransaction.countDocuments(query)

    // Get payout stats
    const totalPayouts = await CryptoTransaction.aggregate([
      { $match: { gateway: 'cryptrum', type: 'withdrawal', status: 'success' } },
      { $group: { _id: null, count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } }
    ])

    res.json({
      success: true,
      payouts,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      stats: {
        totalPayouts: totalPayouts[0] || { count: 0, totalAmount: 0 }
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/cryptrum/admin/withdrawal-requests - Get pending withdrawal requests
router.get('/admin/withdrawal-requests', async (req, res) => {
  try {
    const { status = 'pending' } = req.query
    
    const requests = await CryptoTransaction.find({ 
      gateway: 'cryptrum', 
      type: 'withdrawal',
      status 
    })
      .populate('userId', 'firstName lastName email walletBalance')
      .sort({ createdAt: -1 })

    const pendingCount = await CryptoTransaction.countDocuments({ 
      gateway: 'cryptrum', 
      type: 'withdrawal', 
      status: 'pending' 
    })

    res.json({ success: true, requests, pendingCount })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/cryptrum/admin/approve-withdrawal/:id - Approve and process withdrawal
router.post('/admin/approve-withdrawal/:id', async (req, res) => {
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

    // Process the payout via Cryptrum API
    try {
      const result = await cryptrumService.createPayout(
        transaction.userId,
        transaction.amount,
        transaction.cryptoCurrency || 'USDT',
        transaction.paymentAddress,
        { adminNotes: adminNotes || 'Approved by admin' }
      )

      // Update original transaction
      transaction.status = 'processing'
      transaction.adminNotes = adminNotes || 'Approved and processing'
      transaction.gatewayOrderId = result.transaction?.id || ''
      await transaction.save()

      res.json({ 
        success: true, 
        message: 'Withdrawal approved and processing',
        transaction: result.transaction
      })
    } catch (payoutError) {
      // If payout fails, refund the user
      const User = (await import('../models/User.js')).default
      const user = await User.findById(transaction.userId)
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + transaction.amount
        await user.save()
      }

      transaction.status = 'failed'
      transaction.errorMessage = payoutError.message
      transaction.adminNotes = `Failed: ${payoutError.message}`
      await transaction.save()

      res.status(400).json({ 
        success: false, 
        message: `Payout failed: ${payoutError.message}. User refunded.` 
      })
    }
  } catch (error) {
    console.error('[Cryptrum] Approve withdrawal error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/cryptrum/admin/reject-withdrawal/:id - Reject withdrawal and refund
router.post('/admin/reject-withdrawal/:id', async (req, res) => {
  try {
    const { reason } = req.body
    const transaction = await CryptoTransaction.findById(req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' })
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Request already processed' })
    }

    // Refund the user
    const User = (await import('../models/User.js')).default
    const user = await User.findById(transaction.userId)
    if (user) {
      user.walletBalance = (user.walletBalance || 0) + transaction.amount
      await user.save()
      // User refunded
    }

    // Update transaction
    transaction.status = 'failed'
    transaction.errorMessage = reason || 'Rejected by admin'
    transaction.adminNotes = `Rejected: ${reason || 'No reason provided'}`
    await transaction.save()

    res.json({ success: true, message: 'Withdrawal rejected and user refunded' })
  } catch (error) {
    console.error('[Cryptrum] Reject withdrawal error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
