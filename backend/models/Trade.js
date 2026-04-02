import mongoose from 'mongoose'

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tradingAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'accountType',
    required: true
  },
  accountType: {
    type: String,
    enum: ['TradingAccount', 'ChallengeAccount'],
    default: 'TradingAccount'
  },
  isChallengeAccount: {
    type: Boolean,
    default: false
  },
  tradeId: {
    type: String,
    unique: true,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  segment: {
    type: String,
    enum: ['Forex', 'Crypto', 'Commodities', 'Indices', 'Metals', 'FOREX', 'CRYPTO', 'COMMODITIES', 'INDICES', 'METALS'],
    required: true
  },
  side: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  orderType: {
    type: String,
    enum: ['MARKET', 'BUY_LIMIT', 'BUY_STOP', 'SELL_LIMIT', 'SELL_STOP'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01
  },
  openPrice: {
    type: Number,
    required: true
  },
  entryBid: {
    type: Number,
    default: null
  },
  entryAsk: {
    type: Number,
    default: null
  },
  closePrice: {
    type: Number,
    default: null
  },
  currentPrice: {
    type: Number,
    default: null
  },
  stopLoss: {
    type: Number,
    default: null
  },
  sl: {
    type: Number,
    default: null
  },
  takeProfit: {
    type: Number,
    default: null
  },
  tp: {
    type: Number,
    default: null
  },
  marginUsed: {
    type: Number,
    required: true
  },
  leverage: {
    type: Number,
    required: true
  },
  contractSize: {
    type: Number,
    default: 100000
  },
  spread: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0
  },
  swap: {
    type: Number,
    default: 0
  },
  floatingPnl: {
    type: Number,
    default: 0
  },
  realizedPnl: {
    type: Number,
    default: null
  },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'PENDING', 'CANCELLED'],
    default: 'OPEN'
  },
  pendingPrice: {
    type: Number,
    default: null
  },
  closedBy: {
    type: String,
    enum: ['USER', 'SL', 'TP', 'STOP_OUT', 'ADMIN', 'COPY_MASTER', null],
    default: null
  },
  openedAt: {
    type: Date,
    default: Date.now
  },
  closedAt: {
    type: Date,
    default: null
  },
  adminModified: {
    type: Boolean,
    default: false
  },
  adminModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminModifiedAt: {
    type: Date,
    default: null
  },
  //Sanket v2.0 - Grace period: timestamp of last SL/TP modification to prevent immediate SL trigger on moved stop
  slLastModifiedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// Generate unique trade ID
tradeSchema.statics.generateTradeId = async function() {
  const prefix = 'T'
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(1000 + Math.random() * 9000)
  const tradeId = `${prefix}${timestamp}${random}`
  const exists = await this.findOne({ tradeId })
  if (exists) return this.generateTradeId()
  return tradeId
}

// Calculate PnL for a trade
tradeSchema.methods.calculatePnl = function(currentBid, currentAsk) {
  if (this.status !== 'OPEN') return this.realizedPnl || 0
  
  // MT5 Logic: 
  // BUY Entry = Ask | Exit = Bid
  // SELL Entry = Bid | Exit = Ask
  
  // Fallbacks for legacy trades or missing data
  const entryAsk = this.entryAsk || this.openPrice
  const entryBid = this.entryBid || this.openPrice
  
  let pnl = 0
  if (this.side === 'BUY') {
    pnl = (currentBid - entryAsk) * this.quantity * this.contractSize
    if (global.DEBUG_PNL) {
      console.log(`[PnL] ${this.tradeId} BUY → Bid: ${currentBid.toFixed(5)}, EntryAsk: ${entryAsk.toFixed(5)}, Contract: ${this.contractSize}, Lots: ${this.quantity}`);
    }
  } else {
    pnl = (entryBid - currentAsk) * this.quantity * this.contractSize
    if (global.DEBUG_PNL) {
      console.log(`[PnL] ${this.tradeId} SELL → Ask: ${currentAsk.toFixed(5)}, EntryBid: ${entryBid.toFixed(5)}, Contract: ${this.contractSize}, Lots: ${this.quantity}`);
    }
  }
  
  // Deduct commission (total: entry + exit) and swap
  const totalPnl = pnl - this.commission - this.swap
  
  if (global.DEBUG_PNL) {
    console.log(`[PnL] ${this.tradeId} Result: ${totalPnl.toFixed(2)}`);
  }

  return totalPnl
}

// Check if SL/TP is hit
tradeSchema.methods.checkSlTp = function(currentBid, currentAsk) {
  if (this.status !== 'OPEN') return null
  
  // MT5 Logic:
  // BUY positions close at BID price. SL/TP must trigger on BID.
  // SELL positions close at ASK price. SL/TP must trigger on ASK.
  
  if (this.side === 'BUY') {
    if (this.stopLoss && currentBid <= this.stopLoss) return 'SL'
    if (this.takeProfit && currentBid >= this.takeProfit) return 'TP'
  } else {
    if (this.stopLoss && currentAsk >= this.stopLoss) return 'SL'
    if (this.takeProfit && currentAsk <= this.takeProfit) return 'TP'
  }
  
  return null
}

export default mongoose.model('Trade', tradeSchema)
