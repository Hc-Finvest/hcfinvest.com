import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const emailOTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otpHash: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['signup', 'login', 'password_reset', 'email_change', 'verification'],
    default: 'signup'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 5
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedUntil: Date,
  ipAddress: String,
  userAgent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes
emailOTPSchema.index({ email: 1, purpose: 1 })
emailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index - auto delete expired
emailOTPSchema.index({ createdAt: -1 })

// Generate OTP (6 digits)
emailOTPSchema.statics.generateOTP = function() {
  return crypto.randomInt(100000, 999999).toString()
}

// Create new OTP
emailOTPSchema.statics.createOTP = async function(email, purpose = 'signup', metadata = {}) {
  // Check for rate limiting - max 5 OTPs per email per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentOTPs = await this.countDocuments({
    email: email.toLowerCase(),
    purpose,
    createdAt: { $gte: oneHourAgo }
  })

  if (recentOTPs >= 5) {
    throw new Error('Too many OTP requests. Please try again later.')
  }

  // Check if blocked
  const blockedOTP = await this.findOne({
    email: email.toLowerCase(),
    purpose,
    isBlocked: true,
    blockedUntil: { $gt: new Date() }
  })

  if (blockedOTP) {
    const remainingTime = Math.ceil((blockedOTP.blockedUntil - new Date()) / 60000)
    throw new Error(`Too many failed attempts. Please try again in ${remainingTime} minutes.`)
  }

  // Invalidate previous OTPs for same email and purpose
  await this.updateMany(
    { email: email.toLowerCase(), purpose, isUsed: false },
    { isUsed: true }
  )

  // Generate new OTP
  const otp = this.generateOTP()
  const otpHash = await bcrypt.hash(otp, 10)
  
  // OTP expires in 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  const otpDoc = await this.create({
    email: email.toLowerCase(),
    otpHash,
    purpose,
    expiresAt,
    ...metadata
  })

  return { otp, otpId: otpDoc._id }
}

// Verify OTP
emailOTPSchema.statics.verifyOTP = async function(email, otp, purpose = 'signup') {
  const otpDoc = await this.findOne({
    email: email.toLowerCase(),
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 })

  if (!otpDoc) {
    throw new Error('OTP expired or not found. Please request a new one.')
  }

  // Check if blocked
  if (otpDoc.isBlocked && otpDoc.blockedUntil > new Date()) {
    const remainingTime = Math.ceil((otpDoc.blockedUntil - new Date()) / 60000)
    throw new Error(`Too many failed attempts. Please try again in ${remainingTime} minutes.`)
  }

  // Increment attempts
  otpDoc.attempts += 1

  // Check if max attempts exceeded
  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    otpDoc.isBlocked = true
    otpDoc.blockedUntil = new Date(Date.now() + 30 * 60 * 1000) // Block for 30 minutes
    await otpDoc.save()
    throw new Error('Too many failed attempts. Please try again in 30 minutes.')
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otp, otpDoc.otpHash)

  if (!isValid) {
    await otpDoc.save()
    const remainingAttempts = otpDoc.maxAttempts - otpDoc.attempts
    throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`)
  }

  // Mark as used
  otpDoc.isUsed = true
  otpDoc.usedAt = new Date()
  await otpDoc.save()

  return true
}

// Check if email has pending verification
emailOTPSchema.statics.hasPendingOTP = async function(email, purpose = 'signup') {
  const otpDoc = await this.findOne({
    email: email.toLowerCase(),
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  })
  return !!otpDoc
}

const EmailOTP = mongoose.model('EmailOTP', emailOTPSchema)

export default EmailOTP
