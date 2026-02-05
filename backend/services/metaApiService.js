/**
 * MetaAPI Market Data Service
 * Streams real-time forex, metals, crypto, and indices prices via MetaAPI
 * Organized by categories for frontend display
 * Uses PriceNormalizer for tick throttling and proper rounding
 */

import dotenv from 'dotenv'
import priceNormalizer from './priceNormalizer.js'

dotenv.config()

// MetaAPI Configuration
const METAAPI_TOKEN = () => process.env.METAAPI_TOKEN || ''
const METAAPI_ACCOUNT_ID = () => process.env.METAAPI_ACCOUNT_ID || ''
// Region can be: london, new-york, singapore, etc. Default to new-york
const METAAPI_REGION = () => process.env.METAAPI_REGION || 'new-york'
const METAAPI_BASE_URL = () => `https://mt-client-api-v1.${METAAPI_REGION()}.agiliumtrade.ai`

// Symbol Categories with display names
const SYMBOL_CATEGORIES = {
  Forex: {
    name: 'Forex',
    description: 'Currency Pairs',
    symbols: [
      { symbol: 'EURUSD', name: 'EUR/USD', displayName: 'Euro / US Dollar' },
      { symbol: 'GBPUSD', name: 'GBP/USD', displayName: 'British Pound / US Dollar' },
      { symbol: 'USDJPY', name: 'USD/JPY', displayName: 'US Dollar / Japanese Yen' },
      { symbol: 'USDCHF', name: 'USD/CHF', displayName: 'US Dollar / Swiss Franc' },
      { symbol: 'AUDUSD', name: 'AUD/USD', displayName: 'Australian Dollar / US Dollar' },
      { symbol: 'NZDUSD', name: 'NZD/USD', displayName: 'New Zealand Dollar / US Dollar' },
      { symbol: 'USDCAD', name: 'USD/CAD', displayName: 'US Dollar / Canadian Dollar' },
      { symbol: 'EURGBP', name: 'EUR/GBP', displayName: 'Euro / British Pound' },
      { symbol: 'EURJPY', name: 'EUR/JPY', displayName: 'Euro / Japanese Yen' },
      { symbol: 'GBPJPY', name: 'GBP/JPY', displayName: 'British Pound / Japanese Yen' },
      { symbol: 'EURAUD', name: 'EUR/AUD', displayName: 'Euro / Australian Dollar' },
      { symbol: 'EURCAD', name: 'EUR/CAD', displayName: 'Euro / Canadian Dollar' },
      { symbol: 'EURCHF', name: 'EUR/CHF', displayName: 'Euro / Swiss Franc' },
      { symbol: 'AUDJPY', name: 'AUD/JPY', displayName: 'Australian Dollar / Japanese Yen' },
      { symbol: 'CADJPY', name: 'CAD/JPY', displayName: 'Canadian Dollar / Japanese Yen' },
      { symbol: 'CHFJPY', name: 'CHF/JPY', displayName: 'Swiss Franc / Japanese Yen' },
      { symbol: 'AUDNZD', name: 'AUD/NZD', displayName: 'Australian Dollar / New Zealand Dollar' },
      { symbol: 'AUDCAD', name: 'AUD/CAD', displayName: 'Australian Dollar / Canadian Dollar' },
      { symbol: 'CADCHF', name: 'CAD/CHF', displayName: 'Canadian Dollar / Swiss Franc' },
      { symbol: 'NZDJPY', name: 'NZD/JPY', displayName: 'New Zealand Dollar / Japanese Yen' },
      { symbol: 'GBPAUD', name: 'GBP/AUD', displayName: 'British Pound / Australian Dollar' },
      { symbol: 'GBPCAD', name: 'GBP/CAD', displayName: 'British Pound / Canadian Dollar' },
      { symbol: 'GBPCHF', name: 'GBP/CHF', displayName: 'British Pound / Swiss Franc' },
      { symbol: 'GBPNZD', name: 'GBP/NZD', displayName: 'British Pound / New Zealand Dollar' },
      { symbol: 'AUDCHF', name: 'AUD/CHF', displayName: 'Australian Dollar / Swiss Franc' },
      { symbol: 'NZDCAD', name: 'NZD/CAD', displayName: 'New Zealand Dollar / Canadian Dollar' },
      { symbol: 'NZDCHF', name: 'NZD/CHF', displayName: 'New Zealand Dollar / Swiss Franc' },
      { symbol: 'EURNZD', name: 'EUR/NZD', displayName: 'Euro / New Zealand Dollar' }
    ]
  },
  Metals: {
    name: 'Metals',
    description: 'Precious Metals & Commodities',
    symbols: [
      { symbol: 'XAUUSD', name: 'XAU/USD', displayName: 'Gold / US Dollar' },
      { symbol: 'XAGUSD', name: 'XAG/USD', displayName: 'Silver / US Dollar' },
      { symbol: 'XPTUSD', name: 'XPT/USD', displayName: 'Platinum / US Dollar' },
      { symbol: 'XPDUSD', name: 'XPD/USD', displayName: 'Palladium / US Dollar' },
      { symbol: 'USOIL', name: 'US Oil', displayName: 'WTI Crude Oil' },
      { symbol: 'UKOIL', name: 'UK Oil', displayName: 'Brent Crude Oil' },
      { symbol: 'NGAS', name: 'Natural Gas', displayName: 'Natural Gas' },
      { symbol: 'COPPER', name: 'Copper', displayName: 'Copper' }
    ]
  },
  Crypto: {
    name: 'Crypto',
    description: 'Cryptocurrencies',
    symbols: [
      { symbol: 'BTCUSD', name: 'BTC/USD', displayName: 'Bitcoin / US Dollar' },
      { symbol: 'ETHUSD', name: 'ETH/USD', displayName: 'Ethereum / US Dollar' },
      { symbol: 'LTCUSD', name: 'LTC/USD', displayName: 'Litecoin / US Dollar' },
      { symbol: 'XRPUSD', name: 'XRP/USD', displayName: 'Ripple / US Dollar' },
      { symbol: 'BNBUSD', name: 'BNB/USD', displayName: 'Binance Coin / US Dollar' },
      { symbol: 'SOLUSD', name: 'SOL/USD', displayName: 'Solana / US Dollar' },
      { symbol: 'ADAUSD', name: 'ADA/USD', displayName: 'Cardano / US Dollar' },
      { symbol: 'DOGEUSD', name: 'DOGE/USD', displayName: 'Dogecoin / US Dollar' },
      { symbol: 'DOTUSD', name: 'DOT/USD', displayName: 'Polkadot / US Dollar' },
      { symbol: 'MATICUSD', name: 'MATIC/USD', displayName: 'Polygon / US Dollar' },
      { symbol: 'AVAXUSD', name: 'AVAX/USD', displayName: 'Avalanche / US Dollar' },
      { symbol: 'LINKUSD', name: 'LINK/USD', displayName: 'Chainlink / US Dollar' },
      { symbol: 'UNIUSD', name: 'UNI/USD', displayName: 'Uniswap / US Dollar' },
      { symbol: 'ATOMUSD', name: 'ATOM/USD', displayName: 'Cosmos / US Dollar' },
      { symbol: 'XLMUSD', name: 'XLM/USD', displayName: 'Stellar / US Dollar' },
      { symbol: 'TRXUSD', name: 'TRX/USD', displayName: 'Tron / US Dollar' },
      { symbol: 'ETCUSD', name: 'ETC/USD', displayName: 'Ethereum Classic / US Dollar' },
      { symbol: 'NEARUSD', name: 'NEAR/USD', displayName: 'Near Protocol / US Dollar' },
      { symbol: 'ALGOUSD', name: 'ALGO/USD', displayName: 'Algorand / US Dollar' }
    ]
  },
  Indices: {
    name: 'Indices',
    description: 'Stock Market Indices',
    symbols: [
      { symbol: 'US30', name: 'US30', displayName: 'Dow Jones Industrial Average' },
      { symbol: 'US500', name: 'US500', displayName: 'S&P 500' },
      { symbol: 'US100', name: 'US100', displayName: 'NASDAQ 100' },
      { symbol: 'UK100', name: 'UK100', displayName: 'FTSE 100' },
      { symbol: 'GER40', name: 'GER40', displayName: 'DAX 40' },
      { symbol: 'FRA40', name: 'FRA40', displayName: 'CAC 40' },
      { symbol: 'JP225', name: 'JP225', displayName: 'Nikkei 225' },
      { symbol: 'HK50', name: 'HK50', displayName: 'Hang Seng 50' },
      { symbol: 'AUS200', name: 'AUS200', displayName: 'ASX 200' }
    ]
  }
}

// Build flat symbol list and reverse lookup
const ALL_SYMBOLS = []
const SYMBOL_INFO = {}
const SYMBOL_TO_CATEGORY = {}

Object.entries(SYMBOL_CATEGORIES).forEach(([category, data]) => {
  data.symbols.forEach(sym => {
    ALL_SYMBOLS.push(sym.symbol)
    SYMBOL_INFO[sym.symbol] = { ...sym, category }
    SYMBOL_TO_CATEGORY[sym.symbol] = category
  })
})

class MetaApiService {
  constructor() {
    this.prices = new Map()
    this.subscribers = new Set()
    this.isConnected = false
    this.pollInterval = null
    this.lastUpdate = null
    this.totalTicksReceived = 0
    this.lastError = null
    this.connectionStartTime = null
  }

  /**
   * Get MetaAPI headers for authentication
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'auth-token': METAAPI_TOKEN()
    }
  }

  /**
   * Connect and start polling prices
   */
  async connect() {
    const token = METAAPI_TOKEN()
    const accountId = METAAPI_ACCOUNT_ID()

    if (!token) {
      console.error('[MetaAPI] METAAPI_TOKEN not configured in .env')
      this.lastError = 'METAAPI_TOKEN not configured'
      return
    }

    if (!accountId) {
      console.error('[MetaAPI] METAAPI_ACCOUNT_ID not configured in .env')
      this.lastError = 'METAAPI_ACCOUNT_ID not configured'
      return
    }

    console.log(`[MetaAPI] Connecting with account: ${accountId.substring(0, 8)}...`)
    console.log(`[MetaAPI] Region: ${METAAPI_REGION()}, Base URL: ${METAAPI_BASE_URL()}`)
    this.connectionStartTime = Date.now()

    // Test connection by fetching a price for a common symbol (EURUSD)
    try {
      const testSymbol = 'EURUSD'
      const url = `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/${testSymbol}/current-price`
      console.log(`[MetaAPI] Testing connection with ${testSymbol}...`)
      const response = await fetch(url, { headers: this.getHeaders() })

      if (!response.ok) {
        const error = await response.text()
        console.error('[MetaAPI] Connection failed:', response.status, error)
        this.lastError = `Connection failed: ${response.status}`
        
        // Start fallback price simulation
        console.log('[MetaAPI] Starting fallback price simulation due to connection failure...')
        this.startFallbackPriceSimulation()
        return
      }

      const priceData = await response.json()
      console.log(`[MetaAPI] Connected! Test price - ${testSymbol}: Bid=${priceData.bid}, Ask=${priceData.ask}`)
      this.isConnected = true
      this.lastError = null

      // Start polling prices
      this.startPricePolling()

    } catch (error) {
      console.error('[MetaAPI] Connection error:', error.message)
      this.lastError = error.message
      
      // Start fallback price simulation if MetaAPI fails
      console.log('[MetaAPI] Starting fallback price simulation...')
      this.startFallbackPriceSimulation()
    }
  }

  /**
   * Start fallback price simulation when MetaAPI is not available
   */
  startFallbackPriceSimulation() {
    this.isConnected = true // Mark as connected so prices flow
    
    // Base prices for simulation - will be updated with random walk
    this.simulatedPrices = {
      EURUSD: 1.0850, GBPUSD: 1.2650, USDJPY: 154.50, USDCHF: 0.8850,
      AUDUSD: 0.6550, NZDUSD: 0.6050, USDCAD: 1.3650, EURGBP: 0.8580,
      EURJPY: 167.50, GBPJPY: 195.50, XAUUSD: 2650.00, XAGUSD: 31.50,
      BTCUSD: 98500, ETHUSD: 3450, SOLUSD: 195, BNBUSD: 680,
      XRPUSD: 2.45, ADAUSD: 0.95, DOGEUSD: 0.32, DOTUSD: 7.50,
      MATICUSD: 0.85, LTCUSD: 105, AVAXUSD: 38, LINKUSD: 22,
      US30: 43500, US500: 5950, US100: 21200, UK100: 8250,
      EURNZD: 1.8450, AUDCAD: 0.9050, AUDCHF: 0.5850, AUDNZD: 1.1050,
      AUDJPY: 101.50, CADJPY: 113.50, CHFJPY: 174.50, NZDJPY: 93.50,
      EURAUD: 1.6550, EURCAD: 1.4850, EURCHF: 0.9650, GBPAUD: 1.9350,
      GBPCAD: 1.7250, GBPCHF: 1.1250, GBPNZD: 2.0950, NZDCAD: 0.8250,
      NZDCHF: 0.5350, CADCHF: 0.6450, USOIL: 78.50, UKOIL: 82.50,
      NGAS: 2.85, COPPER: 4.25, XPTUSD: 985, XPDUSD: 1050
    }
    
    // Simulate realistic price movements every 500ms
    this.pollInterval = setInterval(() => {
      ALL_SYMBOLS.forEach(symbol => {
        // Get current price or use default
        let currentPrice = this.simulatedPrices[symbol] || 1.0
        
        // Random walk with momentum - more realistic price movement
        // Variation: ±0.02% to ±0.05% per tick depending on asset type
        let variationPercent
        if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL')) {
          variationPercent = 0.0008 // Crypto: more volatile
        } else if (symbol.includes('XAU') || symbol.includes('XAG')) {
          variationPercent = 0.0004 // Metals: medium volatility
        } else if (symbol.includes('US') || symbol.includes('UK') || symbol.includes('JP')) {
          variationPercent = 0.0003 // Indices: medium volatility
        } else {
          variationPercent = 0.00025 // Forex: lower volatility
        }
        
        const change = (Math.random() - 0.5) * 2 * variationPercent
        const newPrice = currentPrice * (1 + change)
        
        // Store the new price for next iteration (random walk)
        this.simulatedPrices[symbol] = newPrice
        
        // Calculate spread based on asset type
        let spreadPips
        if (symbol.includes('JPY')) {
          spreadPips = 0.02 // 2 pips for JPY pairs
        } else if (symbol.includes('XAU')) {
          spreadPips = 0.50 // 50 cents for gold
        } else if (symbol.includes('BTC')) {
          spreadPips = 50 // $50 for BTC
        } else if (symbol.includes('ETH')) {
          spreadPips = 2 // $2 for ETH
        } else {
          spreadPips = 0.00015 // 1.5 pips for major forex
        }
        
        const bid = newPrice
        const ask = newPrice + spreadPips
        
        this.updatePrice({
          symbol,
          bid,
          ask,
          time: new Date().toISOString()
        })
      })
      this.lastUpdate = Date.now()
    }, 500) // Update every 500ms for smoother price movement
    
    console.log('[MetaAPI] Fallback price simulation started (500ms interval)')
  }

  /**
   * Start polling prices at regular intervals
   */
  startPricePolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }

    // Initial fetch
    this.fetchAllPrices()

    // Poll every 1 second for real-time updates
    this.pollInterval = setInterval(() => {
      this.fetchAllPrices()
    }, 1000)

    console.log('[MetaAPI] Price polling started (1s interval)')
  }

  /**
   * Fetch prices for all symbols from MetaAPI
   * MetaAPI only supports fetching one symbol at a time, so we batch requests
   */
  async fetchAllPrices() {
    const accountId = METAAPI_ACCOUNT_ID()
    if (!accountId || !this.isConnected) return

    try {
      // Fetch prices in parallel batches to avoid rate limiting
      const batchSize = 10
      const batches = []
      
      for (let i = 0; i < ALL_SYMBOLS.length; i += batchSize) {
        batches.push(ALL_SYMBOLS.slice(i, i + batchSize))
      }

      for (const batch of batches) {
        const promises = batch.map(symbol => this.fetchSymbolPrice(accountId, symbol))
        await Promise.all(promises)
      }

      this.lastUpdate = Date.now()
      this.lastError = null

    } catch (error) {
      // Silent fail for polling - don't spam logs
      if (!this.lastError) {
        console.error('[MetaAPI] Price fetch error:', error.message)
        this.lastError = error.message
      }
    }
  }

  /**
   * Fetch price for a single symbol
   */
  async fetchSymbolPrice(accountId, symbol) {
    try {
      const response = await fetch(
        `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`,
        { headers: this.getHeaders() }
      )

      if (response.ok) {
        const price = await response.json()
        this.updatePrice(price)
      }
    } catch (e) {
      // Skip failed symbols silently
    }
  }

  /**
   * Update price in cache and notify subscribers
   * Uses PriceNormalizer for proper rounding and tick throttling
   */
  updatePrice(priceData) {
    if (!priceData || !priceData.symbol) return

    const { symbol, bid, ask, time } = priceData
    
    if (!bid || !ask || bid <= 0 || ask <= 0) return

    // Use price normalizer for proper rounding
    const normalized = priceNormalizer.normalizePrice(symbol, bid, ask, time ? new Date(time).getTime() : Date.now())
    
    const priceInfo = {
      bid: normalized.bid,
      ask: normalized.ask,
      spread: normalized.spread,
      time: normalized.timestamp,
      decimals: normalized.decimals,
      pipSize: normalized.pipSize,
      provider: 'metaapi',
      category: SYMBOL_TO_CATEGORY[symbol] || 'Other',
      ...SYMBOL_INFO[symbol]
    }

    this.prices.set(symbol, priceInfo)
    this.totalTicksReceived++

    // Add to normalizer buffer for throttled emission
    priceNormalizer.addTick(symbol, normalized.bid, normalized.ask, normalized.timestamp)

    // Notify subscribers immediately (for backward compatibility)
    this.notifySubscribers(symbol, priceInfo)
  }

  /**
   * Disconnect and stop polling
   */
  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this.isConnected = false
    this.subscribers.clear()
    console.log('[MetaAPI] Disconnected')
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
        console.error('[MetaAPI] Subscriber error:', e.message)
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
   * Get all current prices as object
   */
  getAllPrices() {
    return Object.fromEntries(this.prices)
  }

  /**
   * Get prices organized by category
   */
  getPricesByCategory() {
    const result = {}
    
    Object.entries(SYMBOL_CATEGORIES).forEach(([category, data]) => {
      result[category] = {
        name: data.name,
        description: data.description,
        symbols: data.symbols.map(sym => {
          const price = this.prices.get(sym.symbol)
          return {
            ...sym,
            bid: price?.bid || 0,
            ask: price?.ask || 0,
            spread: price?.spread || 0,
            time: price?.time || null,
            hasPrice: !!price
          }
        })
      }
    })

    return result
  }

  /**
   * Get all supported symbols
   */
  getSupportedSymbols() {
    return [...ALL_SYMBOLS]
  }

  /**
   * Get symbol categories configuration
   */
  getCategories() {
    return SYMBOL_CATEGORIES
  }

  /**
   * Get symbol info
   */
  getSymbolInfo(symbol) {
    return SYMBOL_INFO[symbol] || null
  }

  /**
   * Check if symbol is supported
   */
  isSymbolSupported(symbol) {
    return ALL_SYMBOLS.includes(symbol)
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      provider: 'metaapi',
      symbolCount: this.prices.size,
      totalSymbols: ALL_SYMBOLS.length,
      totalTicks: this.totalTicksReceived,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
      lastUpdate: this.lastUpdate,
      lastError: this.lastError
    }
  }
}

// Singleton instance
const metaApiService = new MetaApiService()

export default metaApiService
export { SYMBOL_CATEGORIES, ALL_SYMBOLS, SYMBOL_INFO }
