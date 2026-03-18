import mongoose from 'mongoose'

const opsActionLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  route: {
    type: String,
    required: true,
    index: true
  },
  method: {
    type: String,
    required: true,
    default: 'POST'
  },
  status: {
    type: String,
    required: true,
    enum: ['accepted', 'skipped', 'failed'],
    index: true
  },
  ipAddress: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    default: ''
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { timestamps: true })

opsActionLogSchema.index({ createdAt: -1 })
opsActionLogSchema.index({ action: 1, createdAt: -1 })

export default mongoose.model('OpsActionLog', opsActionLogSchema)
