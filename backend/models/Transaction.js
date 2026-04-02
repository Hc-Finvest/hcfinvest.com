import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Transfer_To_Account', 'Transfer_From_Account', 'Account_Transfer_Out', 'Account_Transfer_In', 'Demo_Credit', 'Demo_Reset', 'Admin_Credit', 'Admin_Debit', 'Commission_Transfer'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'UPI', 'QR Code', 'Internal', 'System', 'Oxapay', 'Cryptrum'],
    default: 'Internal'
  },
  // For internal transfers
  tradingAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingAccount'
  },
  tradingAccountName: {
    type: String,
    default: ''
  },
  // For account-to-account transfers
  toTradingAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingAccount'
  },
  toTradingAccountName: {
    type: String,
    default: ''
  },
  fromTradingAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TradingAccount'
  },
  fromTradingAccountName: {
    type: String,
    default: ''
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  transactionRef: {
    type: String,
    default: ''
  },
  screenshot: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
    default: 'Pending'
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

// Pre-save hook to generate a unique readable transaction ID
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.floor(Math.random() * 1000).toString(36).toUpperCase().padStart(3, '0')
    this.transactionId = `HCF-${timestamp}${random}`
  }
  next()
})

export default mongoose.model('Transaction', transactionSchema)
