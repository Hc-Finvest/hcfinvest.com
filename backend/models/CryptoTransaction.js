import mongoose from 'mongoose'

const cryptoTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Gateway identification
  gateway: {
    type: String,
    enum: ['oxapay', 'cryptrum', 'other'],
    default: 'oxapay',
    required: true
  },
  
  // Transaction type
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    required: true
  },
  
  // Amount details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  cryptoAmount: {
    type: Number,
    default: 0
  },
  cryptoCurrency: {
    type: String,
    default: ''
  },
  
  // Gateway references
  gatewayOrderId: {
    type: String,
    default: ''
  },
  gatewayPaymentId: {
    type: String,
    default: ''
  },
  gatewayTransactionHash: {
    type: String,
    default: ''
  },
  
  // Payment details from gateway
  paymentAddress: {
    type: String,
    default: ''
  },
  paymentUrl: {
    type: String,
    default: ''
  },
  qrCodeUrl: {
    type: String,
    default: ''
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'expired', 'cancelled'],
    default: 'pending'
  },
  
  // Idempotency key to prevent double processing
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Wallet credited flag (critical for preventing double credit)
  walletCredited: {
    type: Boolean,
    default: false
  },
  creditedAt: {
    type: Date
  },
  creditedAmount: {
    type: Number,
    default: 0
  },
  
  // Wallet debited flag (critical for preventing double debit on withdrawals)
  walletDebited: {
    type: Boolean,
    default: false
  },
  debitedAt: {
    type: Date
  },
  debitedAmount: {
    type: Number,
    default: 0
  },
  
  // Refund tracking (for failed withdrawals)
  refunded: {
    type: Boolean,
    default: false
  },
  refundedAt: {
    type: Date
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  
  // Webhook data
  webhookReceived: {
    type: Boolean,
    default: false
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookReceivedAt: {
    type: Date
  },
  
  // Error tracking
  errorMessage: {
    type: String,
    default: ''
  },
  errorCode: {
    type: String,
    default: ''
  },
  
  // Expiry
  expiresAt: {
    type: Date
  },
  
  // Admin notes
  adminNotes: {
    type: String,
    default: ''
  },
  
  // IP and metadata
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  indexes: [
    { gatewayOrderId: 1 },
    { gatewayPaymentId: 1 },
    { userId: 1, status: 1 },
    { status: 1, createdAt: -1 }
  ]
})

// Index for efficient queries
cryptoTransactionSchema.index({ userId: 1, createdAt: -1 })
cryptoTransactionSchema.index({ gateway: 1, status: 1 })

export default mongoose.model('CryptoTransaction', cryptoTransactionSchema)
