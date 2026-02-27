import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  linkUrl: {
    type: String,
    trim: true
  },
  linkText: {
    type: String,
    default: 'Learn More'
  },
  backgroundColor: {
    type: String,
    default: 'from-orange-500/20 to-yellow-500/20'
  },
  textColor: {
    type: String,
    default: 'text-white'
  },
  position: {
    type: String,
    enum: ['top', 'middle', 'bottom'],
    default: 'top'
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  targetAudience: {
    type: String,
    enum: ['all', 'new_users', 'active_traders', 'inactive_users'],
    default: 'all'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true })

// Index for efficient queries
bannerSchema.index({ isActive: 1, position: 1, priority: -1 })

// Static method to get active banners
bannerSchema.statics.getActiveBanners = async function(position = null) {
  const now = new Date()
  const query = {
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      { startDate: { $lte: now }, endDate: null },
      { startDate: null, endDate: { $gte: now } },
      { startDate: { $lte: now }, endDate: { $gte: now } }
    ]
  }
  
  if (position) {
    query.position = position
  }
  
  return this.find(query).sort({ priority: -1, createdAt: -1 })
}

export default mongoose.model('Banner', bannerSchema)
