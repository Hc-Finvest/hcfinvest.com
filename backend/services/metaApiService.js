/**
 * MetaAPI Market Data Service
 * Streams real-time forex, metals, crypto, and indices prices via MetaAPI
 * Organized by categories for frontend display
 */

import dotenv from 'dotenv'

dotenv.config()

// Price decimal configuration per symbol type
const getDecimals = (symbol) => {
  if (symbol.includes('JPY')) return 3
  if (symbol.includes('XAU')) return 2
  if (symbol.includes('XAG')) return 3
  if (symbol.includes('BTC')) return 2
  if (symbol.includes('ETH')) return 2
  if (['US30', 'US500', 'US100', 'UK100', 'GER40', 'JP225'].includes(symbol)) return 1
  return 5 // Default for forex
}

const roundPrice = (price, decimals) => {
  const multiplier = Math.pow(10, decimals)
  return Math.round(price * multiplier) / multiplier
}

// MetaAPI Configuration
const METAAPI_TOKEN = () => process.env.METAAPI_TOKEN || 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiXSwicmVzb3VyY2VzIjpbImFjY291bnQ6JFVTRVJfSUQkOmI2NjhiOWI4LTU5NGUtNDc4OS1hODdkLTE1ODYwNDBkMDg0ZCJdfSx7ImlkIjoibWV0YWFwaS1yZXN0LWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19LHsiaWQiOiJtZXRhYXBpLXJwYy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyJhY2NvdW50OiRVU0VSX0lEJDpiNjY4YjliOC01OTRlLTQ3ODktYTg3ZC0xNTg2MDQwZDA4NGQiXX0seyJpZCI6Im1ldGFzdGF0cy1hcGkiLCJtZXRob2RzIjpbIm1ldGFzdGF0cy1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciJdLCJyZXNvdXJjZXMiOlsiYWNjb3VudDokVVNFUl9JRCQ6YjY2OGI5YjgtNTk0ZS00Nzg5LWE4N2QtMTU4NjA0MGQwODRkIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiIzODJhYTU4YjcwNTU0Yzc1MzczOTEyZDA3NDgwNGQwMyIsImlhdCI6MTc3MDYzNTE4OX0.OtP0Fw4z0HzLKRqfasbRM3XvdquMBROjRD75QNqVfhMby1610fAlb95yG7H8WX_EhxFUXFVTEXOOCPumDCeCpFI0NAL-eGOiA6CgbXAPB5RjB95qCPamzub6MaK8c-ZWlkntrRekQgVu-vtYUsaTvC-1ZKY9Qcv4X4o7kesbiF373EXGdDyHD59i3p3FVkaVBT424jN8tA-qbBq7DPO6I_78P3U-Xg5tEQasam6LKG9UkJtMwi8CZMhL8Xtx63gb1phc0egXUhZQtfwyg7hQvdwFfV2fU8-vnVjZ_oq2kV8vg5Jk1mtyslfUmdHWeUJTFQ5QNWA5w1NDqwECsofPvGPqRMQmUOw6FQEpc9NpsRazOQ9Y_1c2FPGanrA-AbLopd8DpOCuok6LCFCWAtytkIyset9QTH6qMQyhJAHnxitIHqQhHp_5wbiGtZ0q1JC80cHGwd25F0nkrJt0wpF2CTpAhREC2tHnCDw2irbvFlfPLM_CTWKKTwb6TsaUPCRn6QEXkRKSQJSLozmtENsoah0nsbZN7jUYxR4WpOTu2b4Pswm1SY8cdC2TC2KCKLgDWVk7wsf_EQcXgmgrDXKthitNO5M5tldADVH_V6xr70Y3mfPXM-2kDVS5z4ikG_YleRFxjHeRSquooqTRD8SNRur38v-XFa9cbdmbxhfYj8U'
const METAAPI_ACCOUNT_ID = () => process.env.METAAPI_ACCOUNT_ID || 'b668b9b8-594e-4789-a87d-1586040d084d'
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
    this.useSimulation = false
    this.rateLimitHits = 0
    this.rateLimitBackoff = 0
    this.consecutiveErrors = 0
    this.maxConsecutiveErrors = 5
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
   * Connect to MetaAPI and start price streaming
   * Uses real MetaAPI data with rate-limit-safe polling
   * Falls back to simulation only if MetaAPI is unavailable
   */
  async connect() {
    const token = METAAPI_TOKEN()
    const accountId = METAAPI_ACCOUNT_ID()
    
    if (!token || !accountId) {
      console.log('[MetaAPI] No credentials configured - starting price simulation')
      this.startPriceSimulation()
      return
    }
    
    console.log('[MetaAPI] Connecting to MetaAPI...')
    console.log(`[MetaAPI] Account ID: ${accountId.substring(0, 8)}...`)
    console.log(`[MetaAPI] Region: ${METAAPI_REGION()}`)
    
    // Test connection with a single symbol
    try {
      const response = await fetch(
        `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/EURUSD/current-price`,
        { headers: this.getHeaders() }
      )
      
      if (response.ok) {
        console.log('[MetaAPI] Connection successful - starting real-time polling')
        this.isConnected = true
        this.connectionStartTime = Date.now()
        this.useSimulation = false
        this.startRateLimitSafePolling()
      } else if (response.status === 401) {
        console.error('[MetaAPI] Authentication failed - check METAAPI_TOKEN')
        this.startPriceSimulation()
      } else if (response.status === 404) {
        console.error('[MetaAPI] Account not found - check METAAPI_ACCOUNT_ID and METAAPI_REGION')
        this.startPriceSimulation()
      } else {
        console.error(`[MetaAPI] Connection failed with status ${response.status}`)
        this.startPriceSimulation()
      }
    } catch (error) {
      console.error('[MetaAPI] Connection error:', error.message)
      this.startPriceSimulation()
    }
  }

  /**
   * Ultra-conservative polling strategy for MetaAPI
   * - Fetches ONLY 5 essential symbols from MetaAPI
   * - Uses simulation for all other symbols
   * - 10-second interval between polling cycles
   * - 2-second delay between individual requests
   */
  startRateLimitSafePolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
    }
    
    // Essential symbols to fetch from MetaAPI (only 5 to stay within limits)
    // MetaAPI free tier: ~60 requests/minute = 1 request/second max
    this.liveSymbols = ['XAUUSD', 'EURUSD', 'GBPUSD', 'BTCUSD', 'US30']
    
    console.log(`[MetaAPI] HYBRID MODE: Live prices for ${this.liveSymbols.length} symbols, simulation for others`)
    console.log(`[MetaAPI] Live symbols: ${this.liveSymbols.join(', ')}`)
    
    // Start simulation for non-live symbols first
    this.startHybridSimulation()
    
    // Poll live symbols every 10 seconds (5 symbols * 2s delay = 10s per cycle)
    const pollIntervalMs = 12000 // 12 seconds between cycles
    
    // Initial fetch
    this.fetchLiveSymbols()
    
    this.pollInterval = setInterval(() => {
      this.fetchLiveSymbols()
    }, pollIntervalMs)
  }

  /**
   * Fetch only essential live symbols with generous delays
   */
  async fetchLiveSymbols() {
    const accountId = METAAPI_ACCOUNT_ID()
    if (!accountId) return
    
    for (const symbol of this.liveSymbols) {
      try {
        const response = await fetch(
          `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/symbols/${symbol}/current-price`,
          { headers: this.getHeaders() }
        )
        
        if (response.ok) {
          const price = await response.json()
          this.updatePrice(price)
          this.totalTicksReceived++
        } else if (response.status === 429) {
          console.warn(`[MetaAPI] Rate limited on ${symbol} - skipping this cycle`)
          break // Stop this cycle, wait for next
        }
      } catch (e) {
        // Network error - continue with next symbol
      }
      
      // 2 second delay between requests (very conservative)
      await this.delay(2000)
    }
    
    this.lastUpdate = Date.now()
  }

  /**
   * Hybrid simulation - simulates prices for non-live symbols
   * Live symbols are updated from MetaAPI
   */
  startHybridSimulation() {
    // Base prices for simulation
    const basePrices = {
      // Forex (non-live will be simulated)
      USDJPY: 151.80, USDCHF: 0.9120, AUDUSD: 0.6280, NZDUSD: 0.5680, USDCAD: 1.4320,
      EURGBP: 0.8340, EURJPY: 156.70, GBPJPY: 187.90, EURCHF: 0.9410,
      EURAUD: 1.6430, EURCAD: 1.4780, EURNZD: 1.8170,
      GBPAUD: 1.9710, GBPCAD: 1.7730, GBPCHF: 1.1290, GBPNZD: 2.1790,
      AUDCAD: 0.8990, AUDCHF: 0.5730, AUDNZD: 1.1060, AUDJPY: 95.30,
      CADJPY: 106.00, CHFJPY: 166.50, NZDJPY: 86.20,
      NZDCAD: 0.8130, NZDCHF: 0.5180, CADCHF: 0.6370,
      // Metals (XAUUSD is live)
      XAGUSD: 32.50, XPTUSD: 1180, XPDUSD: 1050,
      USOIL: 72.50, UKOIL: 76.20, NGAS: 3.45, COPPER: 4.68,
      // Crypto (BTCUSD is live)
      ETHUSD: 2720, SOLUSD: 205, BNBUSD: 620,
      XRPUSD: 2.85, ADAUSD: 0.78, DOGEUSD: 0.26, DOTUSD: 5.10,
      MATICUSD: 0.38, LTCUSD: 128, AVAXUSD: 25, LINKUSD: 18.50,
      UNIUSD: 8.80, ATOMUSD: 5.70, XLMUSD: 0.42, TRXUSD: 0.26,
      ETCUSD: 24.50, NEARUSD: 3.50, ALGOUSD: 0.32,
      // Indices (US30 is live)
      US500: 6080, US100: 21650, UK100: 8580,
      GER40: 22100, FRA40: 7950, JP225: 38800, HK50: 20450, AUS200: 8420
    }
    
    this.simulatedPrices = { ...basePrices }
    
    // Simulate non-live symbols every 500ms
    this.simulationInterval = setInterval(() => {
      const nonLiveSymbols = ALL_SYMBOLS.filter(s => !this.liveSymbols.includes(s))
      
      nonLiveSymbols.forEach(symbol => {
        const basePrice = basePrices[symbol] || this.simulatedPrices[symbol]
        if (!basePrice) return
        
        let currentPrice = this.simulatedPrices[symbol] || basePrice
        
        // Small random variation
        let variation = 0.0001
        if (symbol.includes('BTC') || symbol.includes('ETH')) variation = 0.0003
        else if (symbol.includes('XAU') || symbol.includes('XAG')) variation = 0.00015
        
        const change = (Math.random() - 0.5) * 2 * variation
        let newPrice = currentPrice * (1 + change)
        
        // Mean reversion
        const drift = (newPrice - basePrice) / basePrice
        if (Math.abs(drift) > 0.003) {
          newPrice = basePrice * (1 + (drift > 0 ? 0.002 : -0.002))
        }
        
        this.simulatedPrices[symbol] = newPrice
        
        // Calculate spread
        let spread = 0.00015
        if (symbol.includes('JPY')) spread = 0.02
        else if (symbol.includes('XAU')) spread = 0.50
        else if (symbol.includes('XAG')) spread = 0.03
        else if (symbol.includes('BTC')) spread = 50
        else if (symbol.includes('ETH')) spread = 2
        
        this.updatePrice({
          symbol,
          bid: newPrice,
          ask: newPrice + spread,
          time: new Date().toISOString()
        })
      })
    }, 500)
    
    console.log('[MetaAPI] Hybrid simulation started for non-live symbols')
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Start price simulation with realistic market prices
   * Used as fallback when MetaAPI is unavailable
   */
  startPriceSimulation() {
    this.isConnected = true
    this.useSimulation = true
    console.log('[MetaAPI] Starting price simulation (fallback mode)')
    
    // Current market prices as of Feb 2026 (matching TradingView chart)
    const basePrices = {
      // Forex Majors
      EURUSD: 1.0320, GBPUSD: 1.2380, USDJPY: 151.80, USDCHF: 0.9120,
      AUDUSD: 0.6280, NZDUSD: 0.5680, USDCAD: 1.4320,
      // Forex Crosses
      EURGBP: 0.8340, EURJPY: 156.70, GBPJPY: 187.90, EURCHF: 0.9410,
      EURAUD: 1.6430, EURCAD: 1.4780, EURNZD: 1.8170,
      GBPAUD: 1.9710, GBPCAD: 1.7730, GBPCHF: 1.1290, GBPNZD: 2.1790,
      AUDCAD: 0.8990, AUDCHF: 0.5730, AUDNZD: 1.1060, AUDJPY: 95.30,
      CADJPY: 106.00, CHFJPY: 166.50, NZDJPY: 86.20,
      NZDCAD: 0.8130, NZDCHF: 0.5180, CADCHF: 0.6370,
      // Metals - Updated to match TradingView (~$5010)
      XAUUSD: 5010.00, XAGUSD: 58.50, XPTUSD: 1180, XPDUSD: 1050,
      // Commodities
      USOIL: 72.50, UKOIL: 76.20, NGAS: 3.45, COPPER: 4.68,
      // Crypto
      BTCUSD: 97500, ETHUSD: 2720, SOLUSD: 205, BNBUSD: 620,
      XRPUSD: 2.85, ADAUSD: 0.78, DOGEUSD: 0.26, DOTUSD: 5.10,
      MATICUSD: 0.38, LTCUSD: 128, AVAXUSD: 25, LINKUSD: 18.50,
      UNIUSD: 8.80, ATOMUSD: 5.70, XLMUSD: 0.42, TRXUSD: 0.26,
      ETCUSD: 24.50, NEARUSD: 3.50, ALGOUSD: 0.32,
      // Indices
      US30: 44350, US500: 6080, US100: 21650, UK100: 8580,
      GER40: 22100, FRA40: 7950, JP225: 38800, HK50: 20450, AUS200: 8420
    }
    
    // Initialize current prices
    this.simulatedPrices = { ...basePrices }
    
    // Simulate price movements every 500ms
    this.pollInterval = setInterval(() => {
      ALL_SYMBOLS.forEach(symbol => {
        const basePrice = basePrices[symbol] || this.simulatedPrices[symbol] || 1.0
        let currentPrice = this.simulatedPrices[symbol] || basePrice
        
        // Small random variation (0.01% - 0.03%)
        let variation = 0.0001
        if (symbol.includes('BTC') || symbol.includes('ETH')) variation = 0.0003
        else if (symbol.includes('XAU')) variation = 0.00015
        
        const change = (Math.random() - 0.5) * 2 * variation
        let newPrice = currentPrice * (1 + change)
        
        // Mean reversion - keep within 0.3% of base
        const drift = (newPrice - basePrice) / basePrice
        if (Math.abs(drift) > 0.003) {
          newPrice = basePrice * (1 + (drift > 0 ? 0.002 : -0.002))
        }
        
        this.simulatedPrices[symbol] = newPrice
        
        // Calculate spread
        let spread = 0.00015
        if (symbol.includes('JPY')) spread = 0.02
        else if (symbol.includes('XAU')) spread = 0.50
        else if (symbol.includes('BTC')) spread = 50
        else if (symbol.includes('ETH')) spread = 2
        
        this.updatePrice({
          symbol,
          bid: newPrice,
          ask: newPrice + spread,
          time: new Date().toISOString()
        })
      })
      this.lastUpdate = Date.now()
    }, 500)
    
    console.log('[MetaAPI] Price simulation started (500ms interval, realistic prices)')
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
        this.rateLimitHits = 0 // Reset on success
      } else if (response.status === 429) {
        // Rate limited - log warning
        this.rateLimitHits = (this.rateLimitHits || 0) + 1
        if (this.rateLimitHits === 1 || this.rateLimitHits % 10 === 0) {
          console.warn(`[MetaAPI] Rate limited (429) - ${this.rateLimitHits} consecutive hits for ${symbol}`)
        }
      }
    } catch (e) {
      // Skip failed symbols silently
    }
  }

  /**
   * Stop price polling and simulation
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
      this.simulationInterval = null
    }
  }

  /**
   * Update price in cache and notify subscribers
   */
  updatePrice(priceData) {
    if (!priceData || !priceData.symbol) return

    const { symbol, bid, ask, time } = priceData
    
    if (!bid || !ask || bid <= 0 || ask <= 0) return

    // Round prices to correct decimal places
    const decimals = getDecimals(symbol)
    const roundedBid = roundPrice(parseFloat(bid), decimals)
    const roundedAsk = roundPrice(parseFloat(ask), decimals)
    
    const priceInfo = {
      bid: roundedBid,
      ask: roundedAsk,
      spread: roundPrice(roundedAsk - roundedBid, decimals),
      time: time ? new Date(time).getTime() : Date.now(),
      decimals: decimals,
      provider: 'metaapi',
      category: SYMBOL_TO_CATEGORY[symbol] || 'Other',
      ...SYMBOL_INFO[symbol]
    }

    this.prices.set(symbol, priceInfo)
    this.totalTicksReceived++

    // Notify subscribers
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
    const isHybrid = this.liveSymbols && this.liveSymbols.length > 0 && !this.useSimulation
    return {
      connected: this.isConnected,
      provider: this.useSimulation ? 'simulation' : 'metaapi',
      mode: this.useSimulation ? 'SIMULATION' : (isHybrid ? 'HYBRID' : 'LIVE'),
      liveSymbols: this.liveSymbols || [],
      liveSymbolCount: this.liveSymbols?.length || 0,
      symbolCount: this.prices.size,
      totalSymbols: ALL_SYMBOLS.length,
      totalTicks: this.totalTicksReceived,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
      lastUpdate: this.lastUpdate,
      lastError: this.lastError
    }
  }

  /**
   * Fetch historical OHLC candles from MetaAPI
   * @param {string} symbol - Trading symbol (e.g., 'XAUUSD')
   * @param {string} timeframe - Timeframe: '1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1mn'
   * @param {number} startTime - Start timestamp in seconds
   * @param {number} endTime - End timestamp in seconds (optional, defaults to now)
   * @param {number} limit - Max number of candles (default 500, max 1000)
   * @returns {Promise<Array>} Array of candle objects { time, open, high, low, close, volume }
   */
  async getHistoricalCandles(symbol, timeframe = '1m', startTime, endTime, limit = 500) {
    const accountId = METAAPI_ACCOUNT_ID()
    const token = METAAPI_TOKEN()
    
    // Map timeframe to MetaAPI format
    const timeframeMap = {
      '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
      '1h': '1h', '4h': '4h', '1d': '1d', '1w': '1w', '1M': '1mn'
    }
    const metaTimeframe = timeframeMap[timeframe] || '1m'
    
    // If no credentials or in simulation mode, generate simulated candles
    if (!accountId || !token || this.useSimulation) {
      return this.generateSimulatedCandles(symbol, timeframe, startTime, endTime, limit)
    }
    
    try {
      // Build URL with query params
      let url = `${METAAPI_BASE_URL()}/users/current/accounts/${accountId}/historical-market-data/symbols/${symbol}/timeframes/${metaTimeframe}/candles`
      const params = new URLSearchParams()
      if (startTime) params.append('startTime', new Date(startTime * 1000).toISOString())
      if (limit) params.append('limit', Math.min(limit, 1000))
      
      if (params.toString()) url += `?${params.toString()}`
      
      const response = await fetch(url, { headers: this.getHeaders() })
      
      if (!response.ok) {
        console.warn(`[MetaAPI] Historical candles failed for ${symbol}: ${response.status}`)
        // Fallback to simulated candles
        return this.generateSimulatedCandles(symbol, timeframe, startTime, endTime, limit)
      }
      
      const data = await response.json()
      
      // Transform MetaAPI candle format to lightweight-charts format
      // MetaAPI returns: { time, open, high, low, close, tickVolume, spread, volume }
      const candles = (data || []).map(c => ({
        time: Math.floor(new Date(c.time).getTime() / 1000),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.tickVolume || c.volume || 0
      }))
      
      // Sort by time ascending
      candles.sort((a, b) => a.time - b.time)
      
      return candles
    } catch (error) {
      console.error(`[MetaAPI] Historical candles error for ${symbol}:`, error.message)
      return this.generateSimulatedCandles(symbol, timeframe, startTime, endTime, limit)
    }
  }

  /**
   * Generate simulated historical candles for demo/fallback
   * Creates realistic-looking price action based on current price
   */
  generateSimulatedCandles(symbol, timeframe = '1m', startTime, endTime, limit = 500) {
    const now = Math.floor(Date.now() / 1000)
    const end = endTime || now
    
    // Timeframe to seconds
    const tfSeconds = {
      '1m': 60, '5m': 300, '15m': 900, '30m': 1800,
      '1h': 3600, '4h': 14400, '1d': 86400, '1w': 604800, '1M': 2592000
    }
    const interval = tfSeconds[timeframe] || 60
    
    // Get current price as base
    const currentPrice = this.prices.get(symbol)
    let basePrice = currentPrice?.bid || this.getDefaultPrice(symbol)
    
    // Calculate start time if not provided
    const start = startTime || (end - (limit * interval))
    
    const candles = []
    let price = basePrice * (1 - 0.02) // Start 2% below current for realistic history
    
    // Volatility based on symbol type
    let volatility = 0.0005 // 0.05% for forex
    if (symbol.includes('XAU')) volatility = 0.001
    else if (symbol.includes('XAG')) volatility = 0.0015
    else if (symbol.includes('BTC')) volatility = 0.003
    else if (symbol.includes('ETH')) volatility = 0.004
    else if (symbol.includes('US30') || symbol.includes('US500') || symbol.includes('US100')) volatility = 0.0008
    
    for (let t = start; t < end; t += interval) {
      // Random walk with slight upward bias toward current price
      const drift = (basePrice - price) / basePrice * 0.01 // Mean reversion
      const change = (Math.random() - 0.48 + drift) * volatility
      
      const open = price
      const close = price * (1 + change)
      const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5)
      const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5)
      
      candles.push({
        time: t,
        open: this.roundToDecimals(open, symbol),
        high: this.roundToDecimals(high, symbol),
        low: this.roundToDecimals(low, symbol),
        close: this.roundToDecimals(close, symbol),
        volume: Math.floor(Math.random() * 1000) + 100
      })
      
      price = close
    }
    
    return candles
  }

  /**
   * Get default price for a symbol (used in simulation)
   */
  getDefaultPrice(symbol) {
    const defaults = {
      EURUSD: 1.0320, GBPUSD: 1.2380, USDJPY: 151.80, USDCHF: 0.9120,
      AUDUSD: 0.6280, NZDUSD: 0.5680, USDCAD: 1.4320,
      XAUUSD: 2950, XAGUSD: 32.50, BTCUSD: 97500, ETHUSD: 2720,
      US30: 44350, US500: 6080, US100: 21650
    }
    return defaults[symbol] || 1.0
  }

  /**
   * Round price to appropriate decimals for symbol
   */
  roundToDecimals(price, symbol) {
    const decimals = getDecimals(symbol)
    return roundPrice(price, decimals)
  }
}

// Singleton instance
const metaApiService = new MetaApiService()

export default metaApiService
export { SYMBOL_CATEGORIES, ALL_SYMBOLS, SYMBOL_INFO }
