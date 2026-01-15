import mongoose from 'mongoose'

const paymentGatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['crypto', 'fiat', 'bank'],
    default: 'crypto'
  },
  
  // Enable/disable gateway
  isActive: {
    type: Boolean,
    default: false
  },
  
  // Deposit settings
  depositEnabled: {
    type: Boolean,
    default: true
  },
  minDeposit: {
    type: Number,
    default: 10
  },
  maxDeposit: {
    type: Number,
    default: 100000
  },
  
  // Withdrawal settings
  withdrawalEnabled: {
    type: Boolean,
    default: false
  },
  minWithdrawal: {
    type: Number,
    default: 10
  },
  maxWithdrawal: {
    type: Number,
    default: 50000
  },
  
  // Fees
  depositFeePercent: {
    type: Number,
    default: 0
  },
  depositFeeFixed: {
    type: Number,
    default: 0
  },
  withdrawalFeePercent: {
    type: Number,
    default: 0
  },
  withdrawalFeeFixed: {
    type: Number,
    default: 0
  },
  
  // Supported cryptocurrencies (for crypto gateways)
  supportedCryptos: [{
    symbol: String,
    name: String,
    network: String,
    isActive: { type: Boolean, default: true }
  }],
  
  // API Configuration (encrypted/secure storage recommended)
  apiConfig: {
    apiKey: { type: String, default: '' },
    apiSecret: { type: String, default: '' },
    merchantId: { type: String, default: '' },
    webhookSecret: { type: String, default: '' },
    baseUrl: { type: String, default: '' },
    testMode: { type: Boolean, default: false }
  },
  
  // Display settings
  logo: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  instructions: {
    type: String,
    default: ''
  },
  
  // Priority for display order
  priority: {
    type: Number,
    default: 0
  }
}, { timestamps: true })

export default mongoose.model('PaymentGateway', paymentGatewaySchema)
