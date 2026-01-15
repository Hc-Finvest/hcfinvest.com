/**
 * Market Data Service - Abstracted layer for price data providers
 * Currently implements AllTick API (paid version)
 * Designed for easy provider swapping in the future
 */

import WebSocket from 'ws'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// AllTick API Configuration
const ALLTICK_WS_URL = 'wss://quote.alltick.co/quote-b-ws-api'

// Get token dynamically to ensure .env is loaded
const getToken = () => process.env.ALLTICK_API_TOKEN || ''

// Symbol mapping: Internal symbol -> AllTick code
// Forex & Commodities use: wss://quote.alltick.co/quote-b-ws-api
// Stocks use: wss://quote.alltick.co/quote-stock-b-ws-api
const SYMBOL_MAPPING = {
  // ============ FOREX PAIRS ============
  'EURUSD': 'EURUSD',
  'GBPUSD': 'GBPUSD',
  'USDJPY': 'USDJPY',
  'USDCHF': 'USDCHF',
  'AUDUSD': 'AUDUSD',
  'NZDUSD': 'NZDUSD',
  'USDCAD': 'USDCAD',
  'EURGBP': 'EURGBP',
  'EURJPY': 'EURJPY',
  'GBPJPY': 'GBPJPY',
  'EURAUD': 'EURAUD',
  'EURCAD': 'EURCAD',
  'EURCHF': 'EURCHF',
  'AUDJPY': 'AUDJPY',
  'CADJPY': 'CADJPY',
  'CHFJPY': 'CHFJPY',
  'AUDNZD': 'AUDNZD',
  'AUDCAD': 'AUDCAD',
  'CADCHF': 'CADCHF',
  'NZDJPY': 'NZDJPY',
  'GBPAUD': 'GBPAUD',
  'GBPCAD': 'GBPCAD',
  'GBPCHF': 'GBPCHF',
  'GBPNZD': 'GBPNZD',
  'AUDCHF': 'AUDCHF',
  'NZDCAD': 'NZDCAD',
  'NZDCHF': 'NZDCHF',
  'EURNZD': 'EURNZD',
  
  // ============ COMMODITIES / METALS ============
  'XAUUSD': 'GOLD',
  'XAGUSD': 'Silver',
  'XPTUSD': 'Platinum',
  'XPDUSD': 'Palladium',
  'USOIL': 'USOIL',
  'UKOIL': 'UKOIL',
  'NGAS': 'NGAS',
  'COPPER': 'COPPER',
  
  // ============ CRYPTO (AllTick uses USDT pairs) ============
  'BTCUSD': 'BTCUSDT',
  'ETHUSD': 'ETHUSDT',
  'LTCUSD': 'LTCUSDT',
  'XRPUSD': 'XRPUSDT',
  'BCHUSD': 'BCHUSDT',
  'BNBUSD': 'BNBUSDT',
  'SOLUSD': 'SOLUSDT',
  'ADAUSD': 'ADAUSDT',
  'DOGEUSD': 'DOGEUSDT',
  'DOTUSD': 'DOTUSDT',
  'MATICUSD': 'MATICUSDT',
  'AVAXUSD': 'AVAXUSDT',
  'LINKUSD': 'LINKUSDT',
  'UNIUSD': 'UNIUSDT',
  'ATOMUSD': 'ATOMUSDT',
  'XLMUSD': 'XLMUSDT',
  'TRXUSD': 'TRXUSDT',
  'ETCUSD': 'ETCUSDT',
  'FILUSD': 'FILUSDT',
  'AAVEUSD': 'AAVEUSDT',
  'NEARUSD': 'NEARUSDT',
  'ALGOUSD': 'ALGOUSDT',
  
  // ============ INDICES (Only those working on AllTick forex endpoint) ============
  'UK100': 'UK100',
  'HK50': 'HK50'
}

// Reverse mapping: AllTick code -> Internal symbol
const REVERSE_SYMBOL_MAPPING = Object.fromEntries(
  Object.entries(SYMBOL_MAPPING).map(([k, v]) => [v, k])
)

// All supported symbols
const SUPPORTED_SYMBOLS = Object.keys(SYMBOL_MAPPING)

class MarketDataService {
  constructor() {
    this.ws = null
    this.prices = new Map()
    this.subscribers = new Set()
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.reconnectDelay = 1000
    this.heartbeatInterval = null
    this.seqId = 1
    this.lastHeartbeat = Date.now()
    this.connectionStartTime = null
    this.totalTicksReceived = 0
    this.lastError = null
  }

  /**
   * Get AllTick code for internal symbol
   */
  getProviderCode(symbol) {
    return SYMBOL_MAPPING[symbol] || symbol
  }

  /**
   * Get internal symbol from AllTick code
   */
  getInternalSymbol(providerCode) {
    return REVERSE_SYMBOL_MAPPING[providerCode] || providerCode
  }

  /**
   * Check if symbol is supported
   */
  isSymbolSupported(symbol) {
    return SUPPORTED_SYMBOLS.includes(symbol)
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols() {
    return [...SUPPORTED_SYMBOLS]
  }

  /**
   * Connect to AllTick WebSocket
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[MarketData] Already connected')
      return
    }

    const token = getToken()
    if (!token) {
      console.error('[MarketData] ALLTICK_API_TOKEN not configured - please add your AllTick API token to .env')
      this.lastError = 'ALLTICK_API_TOKEN not configured'
      return
    }

    const wsUrl = `${ALLTICK_WS_URL}?token=${token}`
    console.log('[MarketData] Connecting to AllTick WebSocket...')
    this.connectionStartTime = Date.now()

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.on('open', () => {
        console.log('[MarketData] Connected to AllTick WebSocket')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.lastError = null

        // Subscribe to all symbols
        this.subscribeToSymbols(SUPPORTED_SYMBOLS)

        // Start heartbeat (every 10 seconds as per AllTick docs)
        this.startHeartbeat()
      })

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(message)
        } catch (e) {
          console.error('[MarketData] Error parsing message:', e.message)
        }
      })

      this.ws.on('error', (error) => {
        console.error('[MarketData] WebSocket error:', error.message)
        this.lastError = error.message
      })

      this.ws.on('close', (code, reason) => {
        console.log(`[MarketData] WebSocket closed: ${code} - ${reason}`)
        this.isConnected = false
        this.stopHeartbeat()
        this.attemptReconnect()
      })

    } catch (error) {
      console.error('[MarketData] Connection error:', error.message)
      this.lastError = error.message
      this.attemptReconnect()
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    const { cmd_id, ret, data } = message

    // Heartbeat response
    if (cmd_id === 22001) {
      this.lastHeartbeat = Date.now()
      return
    }

    // Subscription response
    if (cmd_id === 22003 || cmd_id === 22005) {
      if (ret === 200) {
        console.log('[MarketData] Subscription confirmed')
      } else {
        console.error('[MarketData] Subscription failed:', message.msg)
      }
      return
    }

    // Order book push (22999) - contains bid/ask
    if (cmd_id === 22999 && data) {
      this.handleOrderBookUpdate(data)
      return
    }

    // Transaction push (22998) - contains last price
    if (cmd_id === 22998 && data) {
      this.handleTransactionUpdate(data)
      return
    }
  }

  /**
   * Handle order book update (bid/ask prices)
   */
  handleOrderBookUpdate(data) {
    const { code, tick_time, bids, asks } = data
    const internalSymbol = this.getInternalSymbol(code)

    if (!bids || !asks || bids.length === 0 || asks.length === 0) {
      return
    }

    const bid = parseFloat(bids[0].price)
    const ask = parseFloat(asks[0].price)

    if (isNaN(bid) || isNaN(ask) || bid <= 0 || ask <= 0) {
      return
    }

    const priceData = {
      bid,
      ask,
      spread: ask - bid,
      time: parseInt(tick_time) || Date.now(),
      provider: 'alltick'
    }

    this.prices.set(internalSymbol, priceData)
    this.totalTicksReceived++

    // Notify subscribers
    this.notifySubscribers(internalSymbol, priceData)
  }

  /**
   * Handle transaction update (last price)
   */
  handleTransactionUpdate(data) {
    const { code, tick_time, price } = data
    const internalSymbol = this.getInternalSymbol(code)
    const lastPrice = parseFloat(price)

    if (isNaN(lastPrice) || lastPrice <= 0) {
      return
    }

    // Update existing price or create new entry
    const existing = this.prices.get(internalSymbol) || {}
    const priceData = {
      ...existing,
      last: lastPrice,
      time: parseInt(tick_time) || Date.now(),
      provider: 'alltick'
    }

    // If no bid/ask yet, estimate from last price
    if (!priceData.bid) {
      const estimatedSpread = lastPrice * 0.0001 // 1 pip estimate
      priceData.bid = lastPrice - estimatedSpread / 2
      priceData.ask = lastPrice + estimatedSpread / 2
      priceData.spread = estimatedSpread
    }

    this.prices.set(internalSymbol, priceData)
    this.totalTicksReceived++

    // Notify subscribers
    this.notifySubscribers(internalSymbol, priceData)
  }

  /**
   * Subscribe to order book updates for symbols
   * Only subscribes to order book (bid/ask) to avoid rate limits
   */
  subscribeToSymbols(symbols) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[MarketData] Cannot subscribe - not connected')
      return
    }

    // Convert to AllTick codes
    const symbolList = symbols
      .filter(s => this.isSymbolSupported(s))
      .map(s => ({ code: this.getProviderCode(s) }))

    if (symbolList.length === 0) {
      console.warn('[MarketData] No valid symbols to subscribe')
      return
    }

    // Subscribe to order book (bid/ask) - Protocol 22002
    // This provides both bid and ask prices which is what we need
    const orderBookRequest = {
      cmd_id: 22002,
      seq_id: this.seqId++,
      trace: `sub-${Date.now()}`,
      data: {
        symbol_list: symbolList
      }
    }

    this.ws.send(JSON.stringify(orderBookRequest))
    console.log(`[MarketData] Subscribed to ${symbolList.length} symbols (order book)`)
  }

  /**
   * Start heartbeat to keep connection alive
   */
  startHeartbeat() {
    this.stopHeartbeat()
    
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeat = {
          cmd_id: 22000,
          seq_id: this.seqId++,
          trace: `hb-${Date.now()}`,
          data: {}
        }
        this.ws.send(JSON.stringify(heartbeat))
      }
    }, 10000) // Every 10 seconds as per AllTick docs
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[MarketData] Max reconnection attempts reached')
      this.lastError = 'Max reconnection attempts reached'
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000)
    
    console.log(`[MarketData] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.isConnected = false
    this.subscribers.clear()
    console.log('[MarketData] Disconnected')
  }

  /**
   * Add a subscriber callback
   */
  addSubscriber(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of price update
   */
  notifySubscribers(symbol, priceData) {
    this.subscribers.forEach(callback => {
      try {
        callback(symbol, priceData)
      } catch (e) {
        console.error('[MarketData] Subscriber error:', e.message)
      }
    })
  }

  /**
   * Get current price for a symbol
   */
  getPrice(symbol) {
    return this.prices.get(symbol) || null
  }

  /**
   * Get all current prices
   */
  getAllPrices() {
    return Object.fromEntries(this.prices)
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      provider: 'alltick',
      symbolCount: this.prices.size,
      totalTicks: this.totalTicksReceived,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
      lastHeartbeat: this.lastHeartbeat,
      lastError: this.lastError,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// Singleton instance
const marketDataService = new MarketDataService()

export default marketDataService
export { SUPPORTED_SYMBOLS, SYMBOL_MAPPING }
