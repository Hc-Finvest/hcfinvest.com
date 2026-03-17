import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import accountTypesRoutes from './routes/accountTypes.js'
import tradingAccountsRoutes from './routes/tradingAccounts.js'
import walletRoutes from './routes/wallet.js'
import paymentMethodsRoutes from './routes/paymentMethods.js'
import tradeRoutes from './routes/trade.js'
import walletTransferRoutes from './routes/walletTransfer.js'
import adminTradeRoutes from './routes/adminTrade.js'
import copyTradingRoutes from './routes/copyTrading.js'
import ibRoutes from './routes/ibNew.js'
import propTradingRoutes from './routes/propTrading.js'
import chargesRoutes from './routes/charges.js'
import pricesRoutes from './routes/prices.js'
import earningsRoutes from './routes/earnings.js'
import supportRoutes from './routes/support.js'
import kycRoutes from './routes/kyc.js'
import themeRoutes from './routes/theme.js'
import adminManagementRoutes from './routes/adminManagement.js'
import uploadRoutes from './routes/upload.js'
import emailRoutes from './routes/email.js'
import oxapayRoutes from './routes/oxapay.js'
import bannerRoutes from './routes/banner.js'
import carouselRoutes from './routes/carousel.js'
import path from 'path'
import { fileURLToPath } from 'url'
import metaApiService from './services/metaApiService.js'
import binanceRoutes from "./routes/binance.js";
import marketRoutes from "./routes/market.js";
import storageService from './services/storageService.js' // //sanket - Import storage service

import xauusd_Routes from "./routes/xauusd_Routes.js";
import streamer from "./services/xauusdStreamer.cjs";


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const httpServer = createServer(app)
// initLiveSocket(httpServer);

// Socket.IO for real-time updates
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket'], // //sanket - Force WebSockets for lower latency and better stability
  pingTimeout: 30000,
  pingInterval: 10000
})

// ✅ Store io in app context so routes can access it
app.set('io', io);

// Store connected clients
const connectedClients = new Map()
const priceSubscribers = new Set()
let isShuttingDown = false
let broadcastInterval = null
let syncInterval = null

const ENABLE_LIVE_PERSIST = (process.env.ENABLE_LIVE_PERSIST || 'true').toLowerCase() !== 'false'
const ENABLE_PERIODIC_HISTORY_SYNC = (process.env.ENABLE_PERIODIC_HISTORY_SYNC || 'true').toLowerCase() !== 'false'

// Initialize MetaAPI market data connection
console.log('[Server] Initializing MetaAPI market data service...')
metaApiService.connect()
console.log(`[Server] Feature flags -> ENABLE_LIVE_PERSIST=${ENABLE_LIVE_PERSIST}, ENABLE_PERIODIC_HISTORY_SYNC=${ENABLE_PERIODIC_HISTORY_SYNC}`)

// Stream incremental price updates and persist live candles from each incoming tick.
metaApiService.addSubscriber((symbol, priceData) => {
  if (isShuttingDown) return
  if (!symbol || !priceData) return

  // Aliased symbols are already mapped from the same source tick.
  // Persist only canonical updates to avoid duplicate writes.
  if (priceData.mappedFrom) return

  const payload = {
    symbol,
    bid: priceData.bid,
    ask: priceData.ask,
    time: priceData.time || Date.now()
  }

  if (priceSubscribers.size > 0) {
    io.to('prices').emit('tickUpdate', payload)
    io.to('prices').emit('priceStream', {
      prices: { [symbol]: priceData },
      updated: { [symbol]: priceData },
      timestamp: Date.now(),
      provider: 'metaapi'
    })
  }

  if (ENABLE_LIVE_PERSIST) {
    storageService.ingestTick(symbol, priceData).catch(err => {
      console.error(`[StorageService] Live tick persist error for ${symbol}:`, err.message)
    })
  }
})

// Broadcast prices to connected clients every 1000ms (Reduced frequency for general data)
// and specifically when prices change for active symbols (handled in metaApiService)
broadcastInterval = setInterval(() => {
  if (priceSubscribers.size === 0) return
  
  const now = Date.now()
  const allPrices = metaApiService.getAllPrices()
  const pricesByCategory = metaApiService.getPricesByCategory()
  
  // //sanket - Broadcast prices by category and all prices
  io.to('prices').emit('priceStream', {
    prices: allPrices,
    categories: pricesByCategory,
    timestamp: now,
    provider: 'metaapi'
  })
}, 1000)

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`)

  try {
    if (broadcastInterval) clearInterval(broadcastInterval)
    if (syncInterval) clearInterval(syncInterval)

    metaApiService.disconnect()

    if (ENABLE_LIVE_PERSIST) {
      const finalStats = await storageService.shutdown()
      console.log('[Server] Storage flush complete:', {
        pendingLiveBarOps: finalStats.pendingLiveBarOps,
        livePersistedWrites: finalStats.livePersistedWrites,
        livePersistErrors: finalStats.livePersistErrors
      })
    }

    await new Promise(resolve => io.close(resolve))
    await new Promise(resolve => httpServer.close(resolve))

    await mongoose.connection.close(false)
    console.log('[Server] Graceful shutdown completed.')
    process.exit(0)
  } catch (error) {
    console.error('[Server] Graceful shutdown failed:', error.message)
    process.exit(1)
  }
}

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT')
})

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM')
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Subscribe to real-time price stream
  socket.on('subscribePrices', () => {
    socket.join('prices')
    priceSubscribers.add(socket.id)
    // Send current prices immediately
    socket.emit('priceStream', {
      prices: metaApiService.getAllPrices(),
      updated: {},
      timestamp: Date.now()
    })
    console.log(`Socket ${socket.id} subscribed to price stream`)
  })

  // Unsubscribe from price stream
  socket.on('unsubscribePrices', () => {
    socket.leave('prices')
    priceSubscribers.delete(socket.id)
  })

  // Subscribe to account updates
  socket.on('subscribe', (data) => {
    const { tradingAccountId } = data
    if (tradingAccountId) {
      socket.join(`account:${tradingAccountId}`)
      connectedClients.set(socket.id, tradingAccountId)
      console.log(`Socket ${socket.id} subscribed to account ${tradingAccountId}`)
    }
  })

  // Unsubscribe from account updates
  socket.on('unsubscribe', (data) => {
    const { tradingAccountId } = data
    if (tradingAccountId) {
      socket.leave(`account:${tradingAccountId}`)
      connectedClients.delete(socket.id)
    }
  })

  // Handle price updates from client (for PnL calculation)
  socket.on('priceUpdate', async (data) => {
    const { tradingAccountId, prices } = data
    if (tradingAccountId && prices) {
      // Broadcast updated account summary to all subscribers
      io.to(`account:${tradingAccountId}`).emit('accountUpdate', {
        tradingAccountId,
        prices,
        timestamp: Date.now()
      })
    }
  })

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id)
    priceSubscribers.delete(socket.id)
    console.log('Client disconnected:', socket.id)
  })
})

// Make io accessible to routes
app.set('io', io)

// Middleware - CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://trade.hcfinvest.com',
    'https://hcfinvest.com',
    'https://www.hcfinvest.com',
    'https://admin.hcfinvest.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/account-types', accountTypesRoutes)
app.use('/api/trading-accounts', tradingAccountsRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/payment-methods', paymentMethodsRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/wallet-transfer', walletTransferRoutes)
app.use('/api/admin/trade', adminTradeRoutes)
app.use('/api/copy', copyTradingRoutes)
app.use('/api/ib', ibRoutes)
app.use('/api/prop', propTradingRoutes)
app.use('/api/charges', chargesRoutes)
app.use('/api/prices', pricesRoutes)
app.use('/api/earnings', earningsRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/kyc', kycRoutes)
app.use('/api/theme', themeRoutes)
app.use('/api/admin-mgmt', adminManagementRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/email', emailRoutes)
app.use('/api/oxapay', oxapayRoutes)
app.use("/api/xauusd", xauusd_Routes)
// app.use("/api/btcusd", btcusdRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/carousel', carouselRoutes)
app.use("/api/binance", binanceRoutes);

// Historical API route
// app.use("/api/history", historyRoute);

app.use("/api/market", marketRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ message: 'HCF Invest API is running' })
})

// Health check for CI/CD pipeline
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  })
})

const PORT = process.env.PORT || 5001
// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })

httpServer.listen(PORT, async () => {

  console.log("Server running on port 5001");

  // Start XAUUSD streamer
  streamer.startXAUUSDStreamer().catch(err => console.error('[Streamer] Error:', err.message));
  
  // Start background sync WITHOUT BLOCKING - fire and forget
  if (ENABLE_PERIODIC_HISTORY_SYNC) {
    console.log('[StorageService] Starting background sync (non-blocking)...');
    storageService.syncAllSymbols()
      .then(() => console.log('[StorageService] Initial sync completed'))
      .catch(err => console.error('[StorageService] Initial sync failed:', err.message));

    // Schedule periodic syncs every 5 minutes
    syncInterval = setInterval(() => {
      storageService.syncAllSymbols()
        .catch(err => console.error('[StorageService] Periodic sync failed:', err.message));
    }, 5 * 60 * 1000);
  } else {
    console.log('[StorageService] Periodic history sync is disabled by feature flag.');
  }

});