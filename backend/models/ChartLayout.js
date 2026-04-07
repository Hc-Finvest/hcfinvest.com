import mongoose from 'mongoose';

const MAX_LAYOUT_BYTES = parseInt(process.env.CHART_LAYOUT_MAX_BYTES || `${512 * 1024}`, 10);

const getLayoutSizeBytes = (value) => {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? {}), 'utf8');
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

const ChartLayoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true,
    default: 'GLOBAL', // 'GLOBAL' can be used if users want a single layout for all symbols
    trim: true,
    uppercase: true
  },
  layoutJson: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator(value) {
        return value && typeof value === 'object' && !Array.isArray(value) && getLayoutSizeBytes(value) <= MAX_LAYOUT_BYTES;
      },
      message: `Chart layout must be a JSON object no larger than ${MAX_LAYOUT_BYTES} bytes`
    }
  },
  layoutVersion: {
    type: Number,
    default: 2
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to quickly find user's layout for a specific symbol
ChartLayoutSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const ChartLayout = mongoose.model('ChartLayout', ChartLayoutSchema);

export default ChartLayout;
