import crypto from 'crypto'
import PaymentGateway from '../models/PaymentGateway.js'
import CryptoTransaction from '../models/CryptoTransaction.js'
import User from '../models/User.js'

class CryptrumService {
  constructor() {
    this.baseUrl = process.env.CRYPTRUM_API_URL || 'https://api.cryptrum.com/v1'
    this.apiKey = process.env.CRYPTRUM_API_KEY || ''
    this.apiSecret = process.env.CRYPTRUM_API_SECRET || ''
    this.merchantId = process.env.CRYPTRUM_MERCHANT_ID || ''
    this.webhookSecret = process.env.CRYPTRUM_WEBHOOK_SECRET || ''
  }

  // Load config from database (allows admin to update without restart)
  async loadConfig() {
    try {
      const gateway = await PaymentGateway.findOne({ name: 'cryptrum' })
      if (gateway && gateway.apiConfig) {
        this.apiKey = gateway.apiConfig.apiKey || this.apiKey
        this.apiSecret = gateway.apiConfig.apiSecret || this.apiSecret
        this.merchantId = gateway.apiConfig.merchantId || this.merchantId
        this.webhookSecret = gateway.apiConfig.webhookSecret || this.webhookSecret
        this.baseUrl = gateway.apiConfig.baseUrl || this.baseUrl
      }
    } catch (error) {
      console.error('[Cryptrum] Error loading config:', error.message)
    }
  }

  // Generate signature for API requests
  generateSignature(payload, timestamp) {
    const message = `${timestamp}${JSON.stringify(payload)}`
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex')
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, timestamp) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(`${timestamp}${JSON.stringify(payload)}`)
      .digest('hex')
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  // Generate idempotency key
  generateIdempotencyKey(userId, amount, timestamp) {
    return crypto
      .createHash('sha256')
      .update(`${userId}-${amount}-${timestamp}`)
      .digest('hex')
  }

  // Make API request to Cryptrum
  async makeRequest(endpoint, method = 'POST', data = {}) {
    await this.loadConfig()
    
    if (!this.apiKey || !this.merchantId) {
      throw new Error('Cryptrum API not configured. Please set API credentials in admin panel.')
    }

    const timestamp = Date.now().toString()
    const signature = this.generateSignature(data, timestamp)

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-Merchant-ID': this.merchantId,
      'X-Timestamp': timestamp,
      'X-Signature': signature
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(data) : undefined
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || `API Error: ${response.status}`)
      }

      return result
    } catch (error) {
      console.error(`[Cryptrum] API Error (${endpoint}):`, error.message)
      throw error
    }
  }

  // Create a deposit payment request
  async createDeposit(userId, amount, currency = 'USD', cryptoCurrency = 'USDT', options = {}) {
    await this.loadConfig()

    // Validate gateway is active
    const gateway = await PaymentGateway.findOne({ name: 'cryptrum', isActive: true })
    if (!gateway) {
      throw new Error('Cryptrum payment gateway is not available')
    }

    // Validate amount limits
    if (amount < gateway.minDeposit) {
      throw new Error(`Minimum deposit amount is $${gateway.minDeposit}`)
    }
    if (amount > gateway.maxDeposit) {
      throw new Error(`Maximum deposit amount is $${gateway.maxDeposit}`)
    }

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Generate idempotency key
    const idempotencyKey = this.generateIdempotencyKey(userId, amount, Date.now())

    // Create local transaction record first
    const transaction = new CryptoTransaction({
      userId,
      gateway: 'cryptrum',
      type: 'deposit',
      amount,
      currency,
      cryptoCurrency,
      status: 'pending',
      idempotencyKey,
      ipAddress: options.ipAddress || '',
      userAgent: options.userAgent || '',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
    })

    try {
      // Prepare payment request for Cryptrum API
      const paymentData = {
        merchant_id: this.merchantId,
        order_id: transaction._id.toString(),
        amount: amount,
        currency: currency,
        crypto_currency: cryptoCurrency,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/cryptrum/webhook`,
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deposit/success?txn=${transaction._id}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/deposit/cancel?txn=${transaction._id}`,
        customer_email: user.email,
        customer_id: userId.toString(),
        description: `Deposit to trading account - ${user.email}`
      }

      // Call Cryptrum API to create payment
      const response = await this.makeRequest('/payments/create', 'POST', paymentData)

      // Update transaction with gateway response
      transaction.gatewayOrderId = response.order_id || response.payment_id || ''
      transaction.gatewayPaymentId = response.payment_id || ''
      transaction.paymentAddress = response.payment_address || response.address || ''
      transaction.paymentUrl = response.payment_url || response.checkout_url || ''
      transaction.qrCodeUrl = response.qr_code_url || response.qr_code || ''
      transaction.cryptoAmount = response.crypto_amount || 0

      await transaction.save()

      // Deposit created successfully

      return {
        success: true,
        transaction: {
          id: transaction._id,
          amount,
          currency,
          cryptoCurrency,
          cryptoAmount: transaction.cryptoAmount,
          paymentAddress: transaction.paymentAddress,
          paymentUrl: transaction.paymentUrl,
          qrCodeUrl: transaction.qrCodeUrl,
          status: transaction.status,
          expiresAt: transaction.expiresAt
        }
      }
    } catch (error) {
      // Save transaction with error status
      transaction.status = 'failed'
      transaction.errorMessage = error.message
      await transaction.save()

      console.error(`[Cryptrum] Deposit creation failed:`, error.message)
      throw error
    }
  }

  // Process webhook from Cryptrum
  async processWebhook(payload, signature, timestamp) {
    // Webhook received

    // Verify signature if webhook secret is configured
    if (this.webhookSecret && signature) {
      try {
        const isValid = this.verifyWebhookSignature(payload, signature, timestamp)
        if (!isValid) {
          console.error('[Cryptrum] Invalid webhook signature')
          throw new Error('Invalid webhook signature')
        }
      } catch (error) {
        console.error('[Cryptrum] Signature verification failed:', error.message)
        throw new Error('Webhook signature verification failed')
      }
    }

    const { order_id, payment_id, status, transaction_hash, crypto_amount } = payload

    // Find transaction by order_id or payment_id
    let transaction = await CryptoTransaction.findOne({
      $or: [
        { _id: order_id },
        { gatewayOrderId: order_id },
        { gatewayPaymentId: payment_id }
      ]
    })

    if (!transaction) {
      console.error(`[Cryptrum] Transaction not found for order: ${order_id}`)
      throw new Error('Transaction not found')
    }

    // Prevent duplicate processing
    if (transaction.walletCredited && status === 'success') {
      // Already credited, skipping
      return { success: true, message: 'Already processed' }
    }

    // Update transaction with webhook data
    transaction.webhookReceived = true
    transaction.webhookReceivedAt = new Date()
    transaction.webhookData = payload
    transaction.gatewayTransactionHash = transaction_hash || ''
    
    if (crypto_amount) {
      transaction.cryptoAmount = crypto_amount
    }

    // Process based on status
    const normalizedStatus = this.normalizeStatus(status)
    
    switch (normalizedStatus) {
      case 'success':
        await this.handlePaymentSuccess(transaction)
        break
      case 'failed':
        await this.handlePaymentFailed(transaction, payload.error_message || 'Payment failed')
        break
      case 'pending':
      case 'processing':
        transaction.status = normalizedStatus
        await transaction.save()
        break
      case 'expired':
        transaction.status = 'expired'
        await transaction.save()
        break
      default:
        // Unknown status received
        transaction.status = 'pending'
        await transaction.save()
    }

    return { success: true, status: transaction.status }
  }

  // Normalize status from different possible formats
  normalizeStatus(status) {
    const statusMap = {
      'payment_success': 'success',
      'payment_completed': 'success',
      'completed': 'success',
      'confirmed': 'success',
      'success': 'success',
      'payment_pending': 'pending',
      'pending': 'pending',
      'waiting': 'pending',
      'payment_processing': 'processing',
      'processing': 'processing',
      'confirming': 'processing',
      'payment_failed': 'failed',
      'failed': 'failed',
      'error': 'failed',
      'payment_expired': 'expired',
      'expired': 'expired',
      'timeout': 'expired',
      'cancelled': 'cancelled',
      'canceled': 'cancelled'
    }
    return statusMap[status?.toLowerCase()] || 'pending'
  }

  // Handle successful payment - credit user wallet
  async handlePaymentSuccess(transaction) {
    // Double-check to prevent duplicate credit
    if (transaction.walletCredited) {
      // Already credited
      return
    }

    try {
      // Get user and update wallet balance
      const user = await User.findById(transaction.userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Credit wallet
      const previousBalance = user.walletBalance || 0
      user.walletBalance = previousBalance + transaction.amount
      await user.save()

      // Update transaction
      transaction.status = 'success'
      transaction.walletCredited = true
      transaction.creditedAt = new Date()
      transaction.creditedAmount = transaction.amount
      await transaction.save()

      // Payment credited successfully

      return { success: true, credited: transaction.amount }
    } catch (error) {
      console.error(`[Cryptrum] Error crediting wallet:`, error.message)
      transaction.errorMessage = `Credit failed: ${error.message}`
      await transaction.save()
      throw error
    }
  }

  // Handle failed payment
  async handlePaymentFailed(transaction, errorMessage = 'Payment failed') {
    transaction.status = 'failed'
    transaction.errorMessage = errorMessage
    await transaction.save()

    // Transaction failed
  }

  // Create a withdrawal/payout request (Admin pays user in crypto)
  async createPayout(userId, amount, cryptoCurrency = 'USDT', walletAddress, options = {}) {
    await this.loadConfig()

    // Validate gateway is active
    const gateway = await PaymentGateway.findOne({ name: 'cryptrum', isActive: true })
    if (!gateway) {
      throw new Error('Cryptrum payment gateway is not available')
    }

    if (!gateway.withdrawalEnabled) {
      throw new Error('Crypto withdrawals are not enabled')
    }

    // Validate amount limits
    if (amount < gateway.minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is $${gateway.minWithdrawal}`)
    }
    if (amount > gateway.maxWithdrawal) {
      throw new Error(`Maximum withdrawal amount is $${gateway.maxWithdrawal}`)
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
      gateway: 'cryptrum',
      type: 'withdrawal',
      amount,
      currency: 'USD',
      cryptoCurrency,
      paymentAddress: walletAddress,
      status: 'processing',
      idempotencyKey,
      adminNotes: options.adminNotes || ''
    })

    try {
      // Prepare payout request for Cryptrum API
      const payoutData = {
        merchant_id: this.merchantId,
        order_id: transaction._id.toString(),
        amount: amount,
        currency: 'USD',
        crypto_currency: cryptoCurrency,
        wallet_address: walletAddress,
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/cryptrum/webhook`,
        description: `Withdrawal payout to ${user.email}`
      }

      // Call Cryptrum API to create payout
      const response = await this.makeRequest('/payouts/create', 'POST', payoutData)

      // Update transaction with gateway response
      transaction.gatewayOrderId = response.order_id || response.payout_id || ''
      transaction.gatewayPaymentId = response.payout_id || ''
      transaction.cryptoAmount = response.crypto_amount || 0
      transaction.gatewayTransactionHash = response.transaction_hash || ''

      if (response.status === 'completed' || response.status === 'success') {
        transaction.status = 'success'
      }

      await transaction.save()

      // Payout created successfully

      return {
        success: true,
        transaction: {
          id: transaction._id,
          amount,
          cryptoCurrency,
          cryptoAmount: transaction.cryptoAmount,
          walletAddress,
          status: transaction.status,
          transactionHash: transaction.gatewayTransactionHash
        }
      }
    } catch (error) {
      // Save transaction with error status
      transaction.status = 'failed'
      transaction.errorMessage = error.message
      await transaction.save()

      console.error(`[Cryptrum] Payout creation failed:`, error.message)
      throw error
    }
  }

  // Get transaction status
  async getTransactionStatus(transactionId) {
    const transaction = await CryptoTransaction.findById(transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    return {
      id: transaction._id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      cryptoCurrency: transaction.cryptoCurrency,
      cryptoAmount: transaction.cryptoAmount,
      paymentAddress: transaction.paymentAddress,
      walletCredited: transaction.walletCredited,
      createdAt: transaction.createdAt,
      expiresAt: transaction.expiresAt
    }
  }

  // Get user's crypto transactions
  async getUserTransactions(userId, options = {}) {
    const { page = 1, limit = 20, status, type } = options
    
    const query = { userId }
    if (status) query.status = status
    if (type) query.type = type

    const transactions = await CryptoTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await CryptoTransaction.countDocuments(query)

    return { transactions, total, page, limit }
  }

  // Admin: Get all transactions
  async getAllTransactions(options = {}) {
    const { page = 1, limit = 50, status, gateway, startDate, endDate } = options
    
    const query = {}
    if (status) query.status = status
    if (gateway) query.gateway = gateway
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

    // Get stats
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

    return { transactions, total, page, limit, stats }
  }

  // Check if gateway is configured and active
  async isAvailable() {
    await this.loadConfig()
    
    const gateway = await PaymentGateway.findOne({ name: 'cryptrum' })
    if (!gateway || !gateway.isActive) {
      return { available: false, reason: 'Gateway is disabled' }
    }

    // Only require API key (merchantId is optional for some Cryptrum setups)
    if (!this.apiKey) {
      return { available: false, reason: 'API key not configured' }
    }

    return { 
      available: true, 
      minDeposit: gateway.minDeposit,
      maxDeposit: gateway.maxDeposit,
      supportedCryptos: gateway.supportedCryptos?.filter(c => c.isActive) || []
    }
  }
}

// Export singleton instance
export default new CryptrumService()
