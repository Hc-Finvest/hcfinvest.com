import 'dotenv/config'
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
import warmupService from './services/warmupService.js'
import path from 'path'
import { fileURLToPath } from 'url'
import alltickApiService from './services/alltickApiService.js'
import binanceRoutes from "./routes/binance.js";
import marketRoutes from "./routes/market.js";
import storageService from './services/storageService.js' // //sanket - Import storage service
import tradeEngine from './services/tradeEngine.js';
import propTradingEngine from './services/propTradingEngine.js';
import competitionRoutes from "./routes/competitionRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import internalTransferRoutes from "./routes/internalTransfer.js";
import redisClient from './services/redisClient.js';
import competitionLeaderboard from "./routes/competitionLeaderboard.js";
import competitionEmailRoutes from "./routes/emailRoutes.js";
import chartRoutes from "./routes/chart.js";
import "./utils/competitionStatusCron.js";
import announcementRoute from "./routes/announcements_Router.js"; 


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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],

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
const socketPrioritySymbols = new Map()
let isShuttingDown = false
let broadcastInterval = null
let syncInterval = null
let slTpCheckInterval = null

function refreshPrioritySymbols() {
    // ≡ƒ¢í∩╕Å Senior Dev Fix: Extract all unique symbols from rooms that users are CURRENTLY watching
    const rooms = io.sockets.adapter.rooms;
    const activeChartSymbols = [];
    
    for (const [roomName, users] of rooms.entries()) {
      if (roomName.startsWith('candles:') && users.size > 0) {
        const symbol = roomName.split(':')[1];
        if (symbol) activeChartSymbols.push(symbol.toUpperCase());
      }
    }

    if (activeChartSymbols.length > 0) {
       const uniqueSymbols = [...new Set(activeChartSymbols)];
       console.log(`[Server] Resyncing priority symbols for ${uniqueSymbols.length} active charts: ${uniqueSymbols.join(', ')}`);
       alltickApiService.setPrioritySymbols(uniqueSymbols);
    }
}

const ENABLE_LIVE_PERSIST = (process.env.ENABLE_LIVE_PERSIST || 'true').toLowerCase() !== 'false'
const ENABLE_PERIODIC_HISTORY_SYNC = (process.env.ENABLE_PERIODIC_HISTORY_SYNC || 'true').toLowerCase() !== 'false'
// Initialize market data connections
console.log('[Server] Initializing AllTick market data service...')
alltickApiService.connect()

// ✅ Elite Performance: Start Redis cache warmup for top symbols
// This ensures popular charts load instantly from the moment the server is live
warmupService.run().catch(err => console.error('[Server] Warmup failed:', err.message));

// ✅ Backend Candle Authority: Bridge StorageService updates to Socket.io
if (ENABLE_LIVE_PERSIST) {
  storageService.on('candleUpdate', (data) => {
    if (isShuttingDown) return;
    // Broadcast authoritative candle to resolution-specific room
    // User watches candles:SYMBOL room in frontend
    io.to(`candles:${data.originalSymbol}`).emit('candleUpdate', {
      symbol: data.originalSymbol,
      timeframe: data.timeframe,
      candle: data.candle
    });
  });
}
console.log(`[Server] Feature flags -> ENABLE_LIVE_PERSIST=${ENABLE_LIVE_PERSIST}, ENABLE_PERIODIC_HISTORY_SYNC=${ENABLE_PERIODIC_HISTORY_SYNC}`)

// Track last emit times to prevent flooding
const lastEmitTimes = new Map();
const TICK_THROTTLE_MS = 500; // Sidebar symbols updated twice per second

// Stream incremental price updates from Redis (Decoupled Pub/Sub)
const redisSubscriber = redisClient.duplicate();

redisSubscriber.subscribe('price_updates', (err, count) => {
  if (err) console.error('[Redis Pub/Sub] Subscription failed:', err.message);
  else console.log(`[Redis Pub/Sub] Subscribed to ${count} channels.`);
});

// ✅ MONITORING: Redis Pub/Sub Heartbeat
let totalTicksReceived = 0;
setInterval(() => {
  if (totalTicksReceived > 0) {
    console.log(`[Monitoring] Redis Pub/Sub Heartbeat: Received ${totalTicksReceived} price ticks in 60s.`);
    totalTicksReceived = 0;
  }
}, 60000);

redisSubscriber.on('message', (channel, message) => {
  if (channel === 'price_updates') {
    totalTicksReceived++;
    try {
      const priceData = JSON.parse(message);
      const symbol = priceData.symbol;

      if (isShuttingDown) return;
      if (!symbol || !priceData) return;

      const now = Date.now();
      
      const activeChartSymbols = new Set(
        [...socketPrioritySymbols.values()]
          .flatMap(syms => syms || [])
          .map(s => String(s).toUpperCase())
      );
      
      const isBeingWatched = activeChartSymbols.has(String(symbol).toUpperCase());
      
      // ≡ƒ¢í∩╕Å ELITE: Emit to 'prices' room for BOTH active charts AND table updates (always emit if priceSubscribers exist)
      if (priceSubscribers.size > 0) {
        const payload = {
          symbol,
          bid: priceData.bid,
          ask: priceData.ask,
          rawBid: priceData.rawBid,
          rawAsk: priceData.rawAsk,
          time: priceData.time || now,
          provider: priceData.provider || 'alltick'
        }

        io.to('prices').emit('tickUpdate', payload);
      }

      if (ENABLE_LIVE_PERSIST && !priceData.mappedFrom) {
        storageService.ingestTick(symbol, priceData).catch(err => {
          console.error(`[StorageService] Live tick persist error for ${symbol}:`, err.message)
        });
      }
    } catch (err) {
      console.error('[Redis Pub/Sub] Message parse error:', err.message);
    }
  }
});

// Broadcast prices to connected clients every 1000ms
broadcastInterval = setInterval(async () => {
  if (priceSubscribers.size === 0) return
  
  const now = Date.now()
  const [allPrices, pricesByCategory] = await Promise.all([
    alltickApiService.getAllPrices(),
    alltickApiService.getPricesByCategory()
  ]);
  
  // Broadcast prices by category and all prices
  io.to('prices').emit('priceStream', {
    prices: allPrices,
    categories: pricesByCategory,
    timestamp: now,
    provider: 'alltick'
  })
}, 1000)

// --- AUTO SL/TP & PENDING CHECKER ---
// Runs every 1 second to verify if any open trades hit their Stop Loss or Take Profit natively
slTpCheckInterval = setInterval(async () => {
  if (isShuttingDown) return;
  try {
    const allPrices = await alltickApiService.getAllPrices();
    if (!allPrices || Object.keys(allPrices).length === 0) return;

    // 1. Check SL/TP for all Regular and Challenge Trades
    const closedChallenge = await propTradingEngine.checkSlTpForAllTrades(allPrices);
    const closedRegular = await tradeEngine.checkSlTpForAllTrades(allPrices);
    
    const allClosed = [...closedChallenge, ...closedRegular];
    
    if (allClosed.length > 0) {
      console.log(`[TradeEngine] Natively auto-closed ${allClosed.length} trades via SL/TP hit.`);
      // Emit closure to specific users
      allClosed.forEach(ct => {
        if (ct.trade && ct.trade.tradingAccountId) {
          app.get('io').to(`account:${ct.trade.tradingAccountId}`).emit('tradeClosed', ct.trade);
        }
      });
    }

    // 2. Check Pending Orders
    const executedPending = await tradeEngine.checkPendingOrders(allPrices);
    if (executedPending && executedPending.length > 0) {
      console.log(`[TradeEngine] Auto-executed ${executedPending.length} pending orders.`);
      executedPending.forEach(et => {
        if (et.trade && et.trade.tradingAccountId) {
          app.get('io').to(`account:${et.trade.tradingAccountId}`).emit('tradeUpdated', et.trade);
        }
      });
    }
  } catch (err) {
    //Sanket v2.0 - Re-enabled error logging for SL/TP debugging
    console.error('[TradeEngine] Auto SL/TP Check Error:', err.message);
  }
}, 1000);

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`[Server] Received ${signal}. Starting graceful shutdown...`)

  try {
    if (broadcastInterval) clearInterval(broadcastInterval)
    if (syncInterval) clearInterval(syncInterval)
    if (slTpCheckInterval) clearInterval(slTpCheckInterval)

    if (ENABLE_LIVE_PERSIST) {
      const finalStats = await storageService.shutdown()
      console.log('[Server] Storage flush complete:', {
        writes: finalStats.livePersistedWrites,
        errors: finalStats.livePersistErrors,
        pending: finalStats.pendingLiveBarOps
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
  socket.on('subscribePrices', async () => {
    socket.join('prices')
    priceSubscribers.add(socket.id)
    // Send current prices immediately
    
    // Await Redis prices
    const initialPrices = await alltickApiService.getAllPrices();
    
    socket.emit('priceStream', {
      prices: initialPrices,
      updated: {},
      timestamp: Date.now()
    })
    console.log(`Socket ${socket.id} subscribed to price stream`)
  })

  socket.on('setPrioritySymbols', (data) => {
    const symbols = Array.isArray(data?.symbols) ? data.symbols : []
    socketPrioritySymbols.set(socket.id, symbols)
    const appliedSymbols = alltickApiService.setPrioritySymbols([...new Set(
      [...socketPrioritySymbols.values()].flatMap(items => items || [])
    )])
    if (appliedSymbols.length > 0) {
      console.log(`Socket ${socket.id} set priority symbols: ${appliedSymbols.join(', ')}`)
    }
  })

  // Unsubscribe from price stream
  socket.on('unsubscribePrices', () => {
    socket.leave('prices')
    priceSubscribers.delete(socket.id)
    socketPrioritySymbols.delete(socket.id)
    refreshPrioritySymbols()
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

  // ✅ Backend Candle Authority: Join resolution-agnostic symbol room
  socket.on('subscribeBars', (data) => {
    const { symbol } = data;
    if (symbol) {
      socket.join(`candles:${symbol}`);
      console.log(`Socket ${socket.id} joined candle room for ${symbol}`);
    }
  });

  socket.on('unsubscribeBars', (data) => {
    const { symbol } = data;
    if (symbol) {
      socket.leave(`candles:${symbol}`);
    }
  });

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
    socketPrioritySymbols.delete(socket.id)
    refreshPrioritySymbols()
    console.log('Client disconnected:', socket.id)
  })
})

// Make io accessible to routes
app.set('io', io)

// Middleware - CORS configuration for production
// NOTE: `credentials: true` cannot be used with `origin: '*'` — browsers block it.
// We must explicitly whitelist all allowed origins.
const allowedOrigins = [
  'https://trade.hcfinvest.com',
  'https://hcfinvest.com',
  'https://www.hcfinvest.com',
  'https://api.hcfinvest.com',
  'https://admin.hcfinvest.com',
  'https://testing.hcfinvest.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
]

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    console.warn(`[CORS] Blocked request from origin: ${origin}`)
    return callback(new Error(`CORS policy: Origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'auth-token'],
  optionsSuccessStatus: 200 // For legacy browser pre-flight support
}

app.use(cors(corsOptions))
// Explicitly handle OPTIONS pre-flight for all routes
app.options('*', cors(corsOptions))
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf?.toString('utf8') || ''
  }
}))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// 🛡️ Security: Restrict /api/admin & /api/admin-mgmt to admin subdomain only
const ADMIN_ALLOWED_ORIGINS = [
  'https://admin.hcfinvest.com',
  'https://testing.hcfinvest.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
]
const restrictAdminOrigin = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer || ''
  const isAllowed = ADMIN_ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))
  if (!isAllowed) {
    console.warn(`[Security] Blocked admin API access from origin: ${origin}`)
    return res.status(403).json({ success: false, message: 'Admin access is restricted to the admin portal.' })
  }
  return next()
}
app.use('/api/admin', restrictAdminOrigin)
app.use('/api/admin-mgmt', restrictAdminOrigin)
app.use('/api/oxapay/admin', restrictAdminOrigin)

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
// app.use("/api/xauusd", xauusd_Routes)
// app.use("/api/btcusd", btcusdRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/carousel', carouselRoutes)
app.use("/api/binance", binanceRoutes);
app.use("/api/transfer", internalTransferRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/competitions", competitionRoutes);
app.use("/api/competition", competitionLeaderboard);
app.use("/api/email", emailRoutes);
app.use("/api/competition-email", competitionEmailRoutes);
app.use("/api/chart", chartRoutes);
app.use('/api/announcement', announcementRoute);

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

const PORT = process.env.PORT || 8080
// httpServer.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })

httpServer.listen(PORT, '0.0.0.0', async () => {

  console.log(`Server running on port ${PORT}`);

  // Start XAUUSD streamer
  // streamer.startXAUUSDStreamer().catch(err => console.error('[Streamer] Error:', err.message));
  
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