import crypto from 'crypto'
import mongoose from 'mongoose'
import PaymentGateway from '../models/PaymentGateway.js'
import CryptoTransaction from '../models/CryptoTransaction.js'
import User from '../models/User.js'

// ============================================================
// OXAPAY PAYMENT SERVICE
// Uses only Merchant API Key for all operations (Pay-In & Pay-Out)
// Production-ready with no mock data
// ============================================================

class OxapayService {
  constructor() {
    this.baseUrl = process.env.OXAPAY_API_URL || 'https://api.oxapay.com'
    this.merchantApiKey = process.env.OXAPAY_MERCHANT_API_KEY || ''
    this.payoutApiKey = process.env.OXAPAY_PAYOUT_API_KEY || ''
    
    console.log(`[Oxapay] Service initialized`)
  }

  // Load config from database (allows admin to update without restart)
  async loadConfig() {
    try {
      const gateway = await PaymentGateway.findOne({ name: 'oxapay' })
      if (gateway && gateway.apiConfig) {
        this.merchantApiKey = gateway.apiConfig.merchantApiKey || this.merchantApiKey
        this.payoutApiKey = gateway.apiConfig.payoutApiKey || this.payoutApiKey
        if (gateway.apiConfig.baseUrl) {
          this.baseUrl = gateway.apiConfig.baseUrl
        }
      }
    } catch (error) {
      console.error('[Oxapay] Error loading config:', error.message)
    }
  }

  // Verify webhook HMAC signature (SHA512) using Merchant API Key
  verifyWebhookSignature(rawBody, hmacHeader) {
    if (!hmacHeader || !this.merchantApiKey) {
      console.warn('[Oxapay] Missing HMAC header or API key for signature verification')
      return false
    }

    const calculatedHmac = crypto
      .createHmac('sha512', this.merchantApiKey)
      .update(rawBody)
      .digest('hex')
    
    try {
      return crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, 'hex'),
        Buffer.from(hmacHeader, 'hex')
      )
    } catch (error) {
      console.error('[Oxapay] Signature comparison error:', error.message)
      return false
    }
  }

  // Generate idempotency key
  generateIdempotencyKey(userId, amount, timestamp) {
    return crypto
      .createHash('sha256')
      .update(`${userId}-${amount}-${timestamp}`)
      .digest('hex')
  }

  // Make API request to Oxapay using Merchant API Key (for deposits/invoices)
  async makeRequest(endpoint, data = {}) {
    await this.loadConfig()

    if (!this.merchantApiKey) {
      throw new Error('Oxapay Merchant API Key not configured. Please set API credentials in admin panel.')
    }

    const fullUrl = `${this.baseUrl}${endpoint}`
    console.log(`[Oxapay] API call to ${fullUrl}`)
    console.log(`[Oxapay] Using merchant key: ${this.merchantApiKey ? this.merchantApiKey.substring(0, 6) + '...' : 'NOT SET'}`)

    try {
      // Oxapay API expects 'merchant' key in request body, not headers
      const requestBody = {
        merchant: this.merchantApiKey,
        ...data
      }
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      // Oxapay v1 API returns status: 200 for success
      if (result.status !== 200) {
        console.error(`[Oxapay] API Error:`, result)
        throw new Error(result.message || result.error?.message || `API Error: ${result.status}`)
      }

      console.log(`[Oxapay] API response received for ${endpoint}`)
      return result
    } catch (error) {
      console.error(`[Oxapay] API Error (${endpoint}):`, error.message)
      throw error
    }
  }

  // Make API request to Oxapay using Payout API Key (for withdrawals/payouts)
  async makePayoutRequest(endpoint, data = {}) {
    await this.loadConfig()

    if (!this.payoutApiKey) {
      throw new Error('Oxapay Payout API Key not configured. Please set payout API key in admin panel or .env file.')
    }

    const fullUrl = `${this.baseUrl}${endpoint}`
    console.log(`[Oxapay] Payout API call to ${fullUrl}`)

    try {
      // Oxapay Payout API expects 'key' in request body
      const requestBody = {
        key: this.payoutApiKey,
        ...data
      }
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      // Oxapay API returns result: 100 for success
      if (result.result !== 100) {
        console.error(`[Oxapay] Payout API Error:`, result)
        throw new Error(result.message || `Payout API Error: ${result.result}`)
      }

      console.log(`[Oxapay] Payout API response received for ${endpoint}`)
      return result
    } catch (error) {
      console.error(`[Oxapay] Payout API Error (${endpoint}):`, error.message)
      throw error
    }
  }

  // Check if gateway is available
  async isAvailable() {
    try {
      await this.loadConfig()
      const gateway = await PaymentGateway.findOne({ name: 'oxapay', isActive: true })
      
      // Extract crypto symbols from supportedCryptos array of objects
      // Schema stores: [{symbol, name, network, isActive}], frontend expects: ['USDT', 'BTC']
      let cryptoSymbols = ['USDT', 'BTC', 'ETH', 'TRX'] // defaults
      if (gateway?.supportedCryptos && gateway.supportedCryptos.length > 0) {
        const activeCryptos = gateway.supportedCryptos.filter(c => c.isActive !== false)
        if (activeCryptos.length > 0) {
          cryptoSymbols = activeCryptos.map(c => c.symbol || c)
        }
      }
      
      return {
        available: !!gateway && !!this.merchantApiKey,
        depositEnabled: gateway?.depositEnabled !== false,
        withdrawalEnabled: gateway?.withdrawalEnabled || false,
        minDeposit: gateway?.minDeposit || 10,
        maxDeposit: gateway?.maxDeposit || 100000,
        minWithdrawal: gateway?.minWithdrawal || 10,
        maxWithdrawal: gateway?.maxWithdrawal || 50000,
        supportedCryptos: cryptoSymbols
      }
    } catch (error) {
      return { available: false, error: error.message }
    }
  }

  // ==================== PAY-IN (DEPOSIT) ====================

  // Create a deposit invoice
  async createDeposit(userId, amount, currency = 'USD', cryptoCurrency = 'USDT', options = {}) {
    await this.loadConfig()

    // Validate API key is configured
    if (!this.merchantApiKey) {
      throw new Error('Oxapay Merchant API Key not configured')
    }

    // Validate gateway is active
    const gateway = await PaymentGateway.findOne({ name: 'oxapay', isActive: true })
    if (!gateway) {
      throw new Error('Oxapay payment gateway is not available')
    }

    if (!gateway.depositEnabled) {
      throw new Error('Crypto deposits are not enabled')
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid deposit amount')
    }

    // Validate amount limits
    if (amount < gateway.minDeposit) {
      throw new Error(`Minimum deposit amount is $${gateway.minDeposit}`)
    }
    if (amount > gateway.maxDeposit) {
      throw new Error(`Maximum deposit amount is $${gateway.maxDeposit}`)
    }

    // Get user and validate ownership
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate idempotency key
    const idempotencyKey = this.generateIdempotencyKey(userId, amount, Date.now())

    // Create local transaction record first
    const transaction = new CryptoTransaction({
      userId,
      gateway: 'oxapay',
      type: 'deposit',
      amount,
      currency,
      cryptoCurrency,
      status: 'pending',
      idempotencyKey,
      ipAddress: options.ipAddress || '',
      userAgent: options.userAgent || '',
      expiresAt: new Date(Date.now() + (options.lifetime || 60) * 60 * 1000)
    })

    try {
      // Prepare invoice request for Oxapay v1 API
      // Endpoint: /v1/payment/invoice with snake_case field names
      const invoiceData = {
        amount: amount,
        currency: currency,
        lifetime: options.lifetime || 60,
        fee_paid_by_payer: options.feePaidByPayer || 0,
        under_paid_coverage: options.underPaidCoverage || 2.5,
        callback_url: process.env.OXAPAY_WEBHOOK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/oxapay/webhook`,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/wallet?deposit=success&txn=${transaction._id}`,
        email: user.email,
        order_id: transaction._id.toString(),
        description: `Deposit to wallet - ${user.email}`
      }

      // Call Oxapay API to create invoice (v1 API)
      const response = await this.makeRequest('/v1/payment/invoice', invoiceData)

      // Update transaction with gateway response (v1 API uses data object)
      const data = response.data || response
      transaction.gatewayOrderId = data.track_id
      transaction.gatewayPaymentId = data.track_id
      transaction.paymentUrl = data.payment_url
      if (data.expired_at) {
        transaction.expiresAt = new Date(data.expired_at * 1000)
      }

      await transaction.save()

      console.log(`[Oxapay] Deposit invoice created: ${transaction._id}, trackId: ${data.track_id}`)

      return {
        success: true,
        transaction: {
          id: transaction._id,
          trackId: data.track_id,
          amount,
          currency,
          cryptoCurrency,
          paymentUrl: data.payment_url,
          status: transaction.status,
          expiresAt: transaction.expiresAt
        }
      }
    } catch (error) {
      // Save transaction with error status
      transaction.status = 'failed'
      transaction.errorMessage = error.message
      await transaction.save()

      console.error(`[Oxapay] Deposit creation failed:`, error.message)
      throw error
    }
  }

  // ==================== WEBHOOK PROCESSING ====================

  // Normalize Oxapay status to internal status
  normalizeStatus(oxapayStatus) {
    const statusMap = {
      'Paying': 'pending',
      'paying': 'pending',
      'Paid': 'success',
      'paid': 'success',
      'Confirming': 'processing',
      'confirming': 'processing',
      'Confirmed': 'success',
      'confirmed': 'success',
      'Failed': 'failed',
      'failed': 'failed',
      'Expired': 'expired',
      'expired': 'expired',
      'processing': 'processing'
    }
    return statusMap[oxapayStatus] || oxapayStatus?.toLowerCase() || 'pending'
  }

  // Process webhook from Oxapay
  async processWebhook(payload, hmacHeader, rawBody) {
    console.log(`[Oxapay] Webhook received:`, JSON.stringify(payload))

    await this.loadConfig()

    // Verify HMAC signature using Merchant API Key
    if (hmacHeader && this.merchantApiKey) {
      const isValid = this.verifyWebhookSignature(rawBody, hmacHeader)
      if (!isValid) {
        console.error('[Oxapay] Invalid webhook signature - rejecting')
        throw new Error('Invalid webhook signature')
      }
      console.log('[Oxapay] Webhook signature verified successfully')
    } else {
      console.warn('[Oxapay] No HMAC header or API key - signature verification skipped')
    }

    const { track_id, status, type, order_id, amount } = payload

    // Find transaction by track_id or order_id
    let transaction = await CryptoTransaction.findOne({
      $or: [
        { gatewayOrderId: track_id },
        { gatewayPaymentId: track_id },
        { _id: order_id }
      ]
    })

    if (!transaction) {
      console.error(`[Oxapay] Transaction not found for track_id: ${track_id}, order_id: ${order_id}`)
      throw new Error('Transaction not found')
    }

    console.log(`[Oxapay] Found transaction ${transaction._id}, type: ${transaction.type}, current status: ${transaction.status}`)

    // Idempotency check for deposits
    if (transaction.type === 'deposit' && transaction.walletCredited && this.normalizeStatus(status) === 'success') {
      console.log(`[Oxapay] Deposit ${transaction._id} already credited, skipping duplicate webhook`)
      return { success: true, message: 'Already processed', idempotent: true }
    }

    // Idempotency check for withdrawals
    if (transaction.type === 'withdrawal' && transaction.status === 'success') {
      console.log(`[Oxapay] Withdrawal ${transaction._id} already completed, skipping duplicate webhook`)
      return { success: true, message: 'Already processed', idempotent: true }
    }

    // Update transaction with webhook data
    transaction.webhookReceived = true
    transaction.webhookReceivedAt = new Date()
    transaction.webhookData = payload

    if (payload.txs && payload.txs.length > 0) {
      transaction.gatewayTransactionHash = payload.txs[0].tx_hash || ''
      transaction.cryptoAmount = payload.txs[0].value || payload.value || 0
    }

    // Process based on status and transaction type
    const normalizedStatus = this.normalizeStatus(status)
    console.log(`[Oxapay] Processing webhook with normalized status: ${normalizedStatus}`)

    switch (normalizedStatus) {
      case 'success':
        if (transaction.type === 'deposit') {
          return await this.handlePaymentSuccess(transaction)
        } else if (transaction.type === 'withdrawal') {
          return await this.handlePayoutSuccess(transaction)
        }
        break
      case 'failed':
      case 'expired':
        if (transaction.type === 'deposit') {
          return await this.handlePaymentFailed(transaction, payload.error || 'Payment failed')
        } else if (transaction.type === 'withdrawal') {
          return await this.handlePayoutFailed(transaction, payload.error || 'Payout failed')
        }
        break
      case 'pending':
      case 'processing':
        transaction.status = normalizedStatus
        await transaction.save()
        console.log(`[Oxapay] Transaction ${transaction._id} status updated to: ${normalizedStatus}`)
        break
      default:
        console.log(`[Oxapay] Unhandled status: ${status}`)
        transaction.status = normalizedStatus
        await transaction.save()
    }

    return { success: true, status: normalizedStatus }
  }

  // Handle successful payment - credit user wallet with ATOMIC transaction
  async handlePaymentSuccess(transaction) {
    // Idempotency check
    if (transaction.walletCredited) {
      console.log(`[Oxapay] Transaction ${transaction._id} already credited, skipping`)
      return { success: true, alreadyCredited: true }
    }

    const session = await mongoose.startSession()
    
    try {
      let result

      await session.withTransaction(async () => {
        // Re-fetch transaction within session to prevent race conditions
        const freshTxn = await CryptoTransaction.findById(transaction._id).session(session)
        
        // Double-check idempotency within transaction
        if (freshTxn.walletCredited) {
          console.log(`[Oxapay] Transaction ${transaction._id} already credited (race condition prevented)`)
          result = { success: true, alreadyCredited: true }
          return
        }

        // Get user within transaction
        const user = await User.findById(freshTxn.userId).session(session)
        if (!user) {
          throw new Error('User not found')
        }

        // Credit wallet atomically
        const previousBalance = user.walletBalance || 0
        const creditAmount = freshTxn.amount
        user.walletBalance = previousBalance + creditAmount
        await user.save({ session })

        // Update transaction status
        freshTxn.status = 'success'
        freshTxn.walletCredited = true
        freshTxn.creditedAt = new Date()
        freshTxn.creditedAmount = creditAmount
        await freshTxn.save({ session })

        console.log(`[Oxapay] ATOMIC CREDIT: User ${user._id} credited $${creditAmount}. Balance: $${previousBalance} → $${user.walletBalance}`)
        
        result = {
          success: true,
          credited: creditAmount,
          previousBalance,
          newBalance: user.walletBalance
        }
      })

      return result
    } catch (error) {
      console.error(`[Oxapay] ATOMIC CREDIT FAILED for transaction ${transaction._id}:`, error.message)
      throw error
    } finally {
      await session.endSession()
    }
  }

  // Handle failed payment
  async handlePaymentFailed(transaction, errorMessage = 'Payment failed') {
    transaction.status = 'failed'
    transaction.errorMessage = errorMessage
    await transaction.save()
    
    console.log(`[Oxapay] Payment ${transaction._id} marked as failed: ${errorMessage}`)
    return { success: true, status: 'failed' }
  }

  // ==================== PAY-OUT (WITHDRAWAL) ====================

  // ATOMIC debit for withdrawal - deduct from wallet with transaction safety
  async atomicDebitForWithdrawal(userId, amount, transactionId) {
    const session = await mongoose.startSession()
    
    try {
      let result

      await session.withTransaction(async () => {
        // Get transaction within session
        const transaction = await CryptoTransaction.findById(transactionId).session(session)
        if (!transaction) {
          throw new Error('Transaction not found')
        }

        // Idempotency check - already debited
        if (transaction.walletDebited) {
          console.log(`[Oxapay] Transaction ${transactionId} already debited, skipping`)
          result = { success: true, alreadyDebited: true }
          return
        }

        // Get user within transaction
        const user = await User.findById(userId).session(session)
        if (!user) {
          throw new Error('User not found')
        }

        // Check sufficient balance
        const currentBalance = user.walletBalance || 0
        if (currentBalance < amount) {
          throw new Error(`Insufficient balance. Available: $${currentBalance}, Required: $${amount}`)
        }

        // Debit wallet atomically
        const previousBalance = currentBalance
        user.walletBalance = previousBalance - amount
        await user.save({ session })

        // Update transaction with debit info
        transaction.walletDebited = true
        transaction.debitedAt = new Date()
        transaction.debitedAmount = amount
        transaction.status = 'processing'
        await transaction.save({ session })

        console.log(`[Oxapay] ATOMIC DEBIT: User ${userId} debited $${amount}. Balance: $${previousBalance} → $${user.walletBalance}`)
        
        result = {
          success: true,
          debited: amount,
          previousBalance,
          newBalance: user.walletBalance
        }
      })

      return result
    } catch (error) {
      console.error(`[Oxapay] ATOMIC DEBIT FAILED for transaction ${transactionId}:`, error.message)
      throw error
    } finally {
      await session.endSession()
    }
  }

  // ATOMIC refund for failed/rejected withdrawal
  async atomicRefundWithdrawal(transactionId, reason = 'Withdrawal failed') {
    const transaction = await CryptoTransaction.findById(transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // Idempotency check - already refunded
    if (transaction.refunded) {
      console.log(`[Oxapay] Transaction ${transactionId} already refunded, skipping`)
      return { success: true, alreadyRefunded: true }
    }

    // Only refund if wallet was actually debited
    if (!transaction.walletDebited) {
      console.log(`[Oxapay] Transaction ${transactionId} was never debited, no refund needed`)
      transaction.status = 'failed'
      transaction.errorMessage = reason
      await transaction.save()
      return { success: true, noDebitToRefund: true }
    }

    const session = await mongoose.startSession()
    
    try {
      let result
      
      await session.withTransaction(async () => {
        // Get user within transaction
        const user = await User.findById(transaction.userId).session(session)
        if (!user) {
          throw new Error('User not found')
        }

        // Refund wallet atomically
        const previousBalance = user.walletBalance || 0
        const refundAmount = transaction.debitedAmount || transaction.amount
        user.walletBalance = previousBalance + refundAmount
        await user.save({ session })

        // Update transaction with refund info
        const freshTxn = await CryptoTransaction.findById(transactionId).session(session)
        freshTxn.status = 'failed'
        freshTxn.refunded = true
        freshTxn.refundedAt = new Date()
        freshTxn.refundedAmount = refundAmount
        freshTxn.errorMessage = reason
        await freshTxn.save({ session })

        console.log(`[Oxapay] ATOMIC REFUND: User ${user._id} refunded $${refundAmount}. Balance: $${previousBalance} → $${user.walletBalance}`)
        
        result = {
          success: true,
          refunded: refundAmount,
          previousBalance,
          newBalance: user.walletBalance
        }
      })

      return result
    } catch (error) {
      console.error(`[Oxapay] ATOMIC REFUND FAILED for transaction ${transactionId}:`, error.message)
      throw error
    } finally {
      await session.endSession()
    }
  }

  // Handle successful payout
  async handlePayoutSuccess(transaction) {
    if (transaction.status === 'success') {
      console.log(`[Oxapay] Payout ${transaction._id} already marked success, skipping`)
      return { success: true, alreadyProcessed: true }
    }

    transaction.status = 'success'
    await transaction.save()
    
    console.log(`[Oxapay] Payout ${transaction._id} marked as success`)
    return { success: true }
  }

  // Handle failed payout - refund the user
  async handlePayoutFailed(transaction, errorMessage = 'Payout failed') {
    return await this.atomicRefundWithdrawal(transaction._id, errorMessage)
  }

  // Create a withdrawal/payout request using Merchant API Key
  async createPayout(userId, amount, cryptoCurrency = 'USDT', walletAddress, network = 'TRC20', options = {}) {
    await this.loadConfig()

    // Validate API key is configured
    if (!this.merchantApiKey) {
      throw new Error('Oxapay Merchant API Key not configured')
    }

    // Validate gateway is active
    const gateway = await PaymentGateway.findOne({ name: 'oxapay', isActive: true })
    if (!gateway) {
      throw new Error('Oxapay payment gateway is not available')
    }

    if (!gateway.withdrawalEnabled) {
      throw new Error('Crypto withdrawals are not enabled')
    }

    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Invalid withdrawal amount')
    }

    // Validate amount limits
    if (amount < gateway.minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is $${gateway.minWithdrawal}`)
    }
    if (amount > gateway.maxWithdrawal) {
      throw new Error(`Maximum withdrawal amount is $${gateway.maxWithdrawal}`)
    }

    // Validate wallet address
    if (!walletAddress || walletAddress.trim().length === 0) {
      throw new Error('Wallet address is required')
    }

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate idempotency key
    const idempotencyKey = this.generateIdempotencyKey(userId, amount, Date.now())

    // Create local transaction record
    const transaction = new CryptoTransaction({
      userId,
      gateway: 'oxapay',
      type: 'withdrawal',
      amount,
      currency: 'USD',
      cryptoCurrency,
      paymentAddress: walletAddress,
      network,
      status: 'processing',
      idempotencyKey,
      adminNotes: options.adminNotes || ''
    })

    try {
      // Prepare payout request for Oxapay Payout API
      const payoutData = {
        address: walletAddress,
        amount: amount,
        currency: cryptoCurrency,
        network: network,
        callbackUrl: process.env.OXAPAY_WEBHOOK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/oxapay/webhook`,
        description: options.description || `Payout to ${user.email}`
      }

      // Call Oxapay Payout API using payout key
      const response = await this.makePayoutRequest('/api/send', payoutData)

      // Update transaction with gateway response
      transaction.gatewayOrderId = response.trackId
      transaction.gatewayPaymentId = response.trackId

      if (response.status === 'Confirmed' || response.status === 'confirmed' || response.status === 'Complete') {
        transaction.status = 'success'
      }

      await transaction.save()

      console.log(`[Oxapay] Payout created: ${transaction._id}, trackId: ${response.trackId}`)

      return {
        success: true,
        transaction: {
          id: transaction._id,
          trackId: response.trackId,
          amount,
          cryptoCurrency,
          walletAddress,
          status: transaction.status
        }
      }
    } catch (error) {
      // Save transaction with error status
      transaction.status = 'failed'
      transaction.errorMessage = error.message
      await transaction.save()

      console.error(`[Oxapay] Payout creation failed:`, error.message)
      throw error
    }
  }

  // ==================== UTILITY METHODS ====================

  // Get transaction status
  async getTransactionStatus(transactionId) {
    const transaction = await CryptoTransaction.findById(transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    return {
      id: transaction._id,
      trackId: transaction.gatewayOrderId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      cryptoCurrency: transaction.cryptoCurrency,
      walletCredited: transaction.walletCredited,
      walletDebited: transaction.walletDebited,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }
  }

  // Get user transactions
  async getUserTransactions(userId, options = {}) {
    const { page = 1, limit = 20, type, status } = options
    
    const query = { userId, gateway: 'oxapay' }
    if (type) query.type = type
    if (status) query.status = status

    const transactions = await CryptoTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await CryptoTransaction.countDocuments(query)

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  // Get all transactions (admin)
  async getAllTransactions(options = {}) {
    const { page = 1, limit = 50, status, type, startDate, endDate } = options
    
    const query = { gateway: 'oxapay' }
    if (status) query.status = status
    if (type) query.type = type
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    const transactions = await CryptoTransaction.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await CryptoTransaction.countDocuments(query)

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// Export singleton instance
const oxapayService = new OxapayService()
export default oxapayService
