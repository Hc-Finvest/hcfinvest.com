import mongoose from 'mongoose'

const emailLogSchema = new mongoose.Schema({
  recipient: {
    email: {
      type: String,
      required: true
    },
    name: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  templateSlug: String,
  subject: {
    type: String,
    required: true
  },
  htmlContent: String,
  textContent: String,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'],
    default: 'pending'
  },
  provider: {
    type: String,
    enum: ['smtp', 'sendgrid', 'ses', 'brevo', 'mailgun', 'resend'],
    default: 'smtp'
  },
  providerMessageId: String,
  category: {
    type: String,
    enum: ['otp', 'welcome', 'password_reset', 'notification', 'marketing', 'transactional', 'manual'],
    default: 'transactional'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    code: String,
    message: String,
    stack: String
  },
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  retryCount: {
    type: Number,
    default: 0
  },
  maxRetries: {
    type: Number,
    default: 3
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
})

// Indexes for efficient querying
emailLogSchema.index({ 'recipient.email': 1 })
emailLogSchema.index({ 'recipient.userId': 1 })
emailLogSchema.index({ status: 1 })
emailLogSchema.index({ category: 1 })
emailLogSchema.index({ createdAt: -1 })
emailLogSchema.index({ templateSlug: 1, createdAt: -1 })

// Static method to log email
emailLogSchema.statics.logEmail = async function(data) {
  return this.create(data)
}

// Static method to update status
emailLogSchema.statics.updateStatus = async function(id, status, additionalData = {}) {
  const update = { status, ...additionalData }
  if (status === 'sent') update.sentAt = new Date()
  if (status === 'delivered') update.deliveredAt = new Date()
  if (status === 'opened') update.openedAt = new Date()
  if (status === 'clicked') update.clickedAt = new Date()
  
  return this.findByIdAndUpdate(id, update, { new: true })
}

// Static method to get email stats
emailLogSchema.statics.getStats = async function(startDate, endDate) {
  const match = {}
  if (startDate || endDate) {
    match.createdAt = {}
    if (startDate) match.createdAt.$gte = new Date(startDate)
    if (endDate) match.createdAt.$lte = new Date(endDate)
  }

  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ])
}

const EmailLog = mongoose.model('EmailLog', emailLogSchema)

export default EmailLog
