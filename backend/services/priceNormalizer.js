/**
 * Price Normalizer Service
 * Handles price normalization, rounding, and tick aggregation
 * Ensures consistent pricing across all components
 */

// Decimal places and pip sizes per asset type
const PRICE_CONFIG = {
  // Forex pairs
  EURUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  GBPUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  AUDUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  NZDUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  USDCAD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  USDCHF: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  EURGBP: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  EURAUD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  EURCAD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  EURCHF: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  EURNZD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  GBPAUD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  GBPCAD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  GBPCHF: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  GBPNZD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  AUDCAD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  AUDCHF: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  AUDNZD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  CADCHF: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  NZDCAD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  NZDCHF: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  
  // JPY pairs (3 decimals)
  USDJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  EURJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  GBPJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  AUDJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  CADJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  CHFJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  NZDJPY: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  
  // Metals
  XAUUSD: { decimals: 2, pipSize: 0.1, tickSize: 0.01 },
  XAGUSD: { decimals: 3, pipSize: 0.01, tickSize: 0.001 },
  XPTUSD: { decimals: 2, pipSize: 0.1, tickSize: 0.01 },
  XPDUSD: { decimals: 2, pipSize: 0.1, tickSize: 0.01 },
  
  // Commodities
  USOIL: { decimals: 2, pipSize: 0.01, tickSize: 0.01 },
  UKOIL: { decimals: 2, pipSize: 0.01, tickSize: 0.01 },
  NGAS: { decimals: 3, pipSize: 0.001, tickSize: 0.001 },
  COPPER: { decimals: 4, pipSize: 0.0001, tickSize: 0.0001 },
  
  // Crypto
  BTCUSD: { decimals: 2, pipSize: 1, tickSize: 0.01 },
  ETHUSD: { decimals: 2, pipSize: 0.1, tickSize: 0.01 },
  LTCUSD: { decimals: 2, pipSize: 0.01, tickSize: 0.01 },
  XRPUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  BNBUSD: { decimals: 2, pipSize: 0.1, tickSize: 0.01 },
  SOLUSD: { decimals: 2, pipSize: 0.01, tickSize: 0.01 },
  ADAUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  DOGEUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  DOTUSD: { decimals: 3, pipSize: 0.001, tickSize: 0.001 },
  MATICUSD: { decimals: 4, pipSize: 0.0001, tickSize: 0.0001 },
  AVAXUSD: { decimals: 2, pipSize: 0.01, tickSize: 0.01 },
  LINKUSD: { decimals: 3, pipSize: 0.001, tickSize: 0.001 },
  UNIUSD: { decimals: 3, pipSize: 0.001, tickSize: 0.001 },
  ATOMUSD: { decimals: 3, pipSize: 0.001, tickSize: 0.001 },
  XLMUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  TRXUSD: { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 },
  ETCUSD: { decimals: 2, pipSize: 0.01, tickSize: 0.01 },
  NEARUSD: { decimals: 3, pipSize: 0.001, tickSize: 0.001 },
  ALGOUSD: { decimals: 4, pipSize: 0.0001, tickSize: 0.0001 },
  
  // Indices
  US30: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  US500: { decimals: 2, pipSize: 0.1, tickSize: 0.01 },
  US100: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  NDX: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  UK100: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  GER40: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  GER30: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  FRA40: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  IBEX: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  SPA35: { decimals: 1, pipSize: 1, tickSize: 0.1 },
  JP225: { decimals: 0, pipSize: 1, tickSize: 1 },
  HK50: { decimals: 0, pipSize: 1, tickSize: 1 },
  AUS200: { decimals: 1, pipSize: 1, tickSize: 0.1 }
}

// Default config for unknown symbols
const DEFAULT_CONFIG = { decimals: 5, pipSize: 0.0001, tickSize: 0.00001 }

class PriceNormalizer {
  constructor() {
    this.tickBuffer = new Map() // Buffer for tick aggregation
    this.lastEmittedPrices = new Map() // Last emitted prices to prevent duplicates
    this.aggregationInterval = 250 // Aggregate ticks every 250ms
    this.subscribers = new Set()
    this.aggregationTimer = null
  }

  /**
   * Get price configuration for a symbol
   */
  getConfig(symbol) {
    return PRICE_CONFIG[symbol] || DEFAULT_CONFIG
  }

  /**
   * Round price to correct decimal places
   */
  roundPrice(price, symbol) {
    const config = this.getConfig(symbol)
    const multiplier = Math.pow(10, config.decimals)
    return Math.round(price * multiplier) / multiplier
  }

  /**
   * Normalize a raw price tick
   */
  normalizePrice(symbol, rawBid, rawAsk, timestamp = Date.now()) {
    const config = this.getConfig(symbol)
    
    const bidFloat = parseFloat(rawBid)
    const askFloat = parseFloat(rawAsk)
    
    const bid = this.roundPrice(bidFloat, symbol)
    const ask = this.roundPrice(askFloat, symbol)
    const spread = this.roundPrice(ask - bid, symbol)
    
    return {
      symbol,
      bid,
      ask,
      rawBid: bidFloat,
      rawAsk: askFloat,
      spread,
      pipSize: config.pipSize,
      decimals: config.decimals,
      timestamp,
      normalized: true
    }
  }

  /**
   * Add a raw tick to the buffer for aggregation
   */
  addTick(symbol, bid, ask, timestamp = Date.now()) {
    if (!bid || !ask || bid <= 0 || ask <= 0) return
    
    const normalized = this.normalizePrice(symbol, bid, ask, timestamp)
    
    // Store in buffer (overwrites previous - we only care about latest)
    this.tickBuffer.set(symbol, normalized)
    
    // Start aggregation timer if not running
    if (!this.aggregationTimer) {
      this.startAggregation()
    }
  }

  /**
   * Start the tick aggregation timer
   */
  startAggregation() {
    if (this.aggregationTimer) return
    
    this.aggregationTimer = setInterval(() => {
      this.emitAggregatedTicks()
    }, this.aggregationInterval)
  }

  /**
   * Stop the tick aggregation timer
   */
  stopAggregation() {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer)
      this.aggregationTimer = null
    }
  }

  /**
   * Emit aggregated ticks to subscribers
   * Only emits if price has actually changed
   */
  emitAggregatedTicks() {
    if (this.tickBuffer.size === 0) return
    
    const updatedPrices = {}
    let hasUpdates = false
    
    this.tickBuffer.forEach((price, symbol) => {
      const lastPrice = this.lastEmittedPrices.get(symbol)
      
      // Only emit if price changed (prevents duplicate updates)
      if (!lastPrice || lastPrice.bid !== price.bid || lastPrice.ask !== price.ask) {
        updatedPrices[symbol] = price
        this.lastEmittedPrices.set(symbol, price)
        hasUpdates = true
      }
    })
    
    // Clear buffer after processing
    this.tickBuffer.clear()
    
    // Notify subscribers only if there are actual updates
    if (hasUpdates && Object.keys(updatedPrices).length > 0) {
      this.notifySubscribers(updatedPrices)
    }
  }

  /**
   * Subscribe to normalized price updates
   */
  subscribe(callback) {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify all subscribers of price updates
   */
  notifySubscribers(prices) {
    this.subscribers.forEach(callback => {
      try {
        callback(prices)
      } catch (e) {
        console.error('[PriceNormalizer] Subscriber error:', e.message)
      }
    })
  }

  /**
   * Get all current prices (last emitted)
   */
  getAllPrices() {
    return Object.fromEntries(this.lastEmittedPrices)
  }

  /**
   * Get price for a specific symbol
   */
  getPrice(symbol) {
    return this.lastEmittedPrices.get(symbol) || null
  }

  /**
   * Calculate pip value for a symbol
   */
  getPipValue(symbol, lotSize = 1) {
    const config = this.getConfig(symbol)
    //Sanket v2.0 - Use correct contract sizes per asset class instead of hardcoded 100000
    const upperSymbol = String(symbol).toUpperCase()
    let contractSize = 100000 // default forex
    if (upperSymbol === 'XAUUSD') contractSize = 100          // 100 troy oz
    else if (upperSymbol === 'XAGUSD') contractSize = 5000    // 5000 troy oz
    else if (upperSymbol === 'XPTUSD' || upperSymbol === 'XPDUSD') contractSize = 100
    else if (upperSymbol === 'USOIL' || upperSymbol === 'UKOIL') contractSize = 1000 // 1000 barrels
    else if (upperSymbol === 'NGAS') contractSize = 10000
    else if (upperSymbol === 'COPPER') contractSize = 25000
    else if (['BTCUSD','ETHUSD','LTCUSD','XRPUSD','BNBUSD','SOLUSD','ADAUSD','DOGEUSD','DOTUSD','MATICUSD','AVAXUSD','LINKUSD','UNIUSD','ATOMUSD','XLMUSD','TRXUSD','ETCUSD','NEARUSD','ALGOUSD'].includes(upperSymbol)) contractSize = 1 // crypto = 1 unit per lot
    else if (['US30','US500','US100','UK100','GER40','FRA40','JP225','HK50','AUS200'].includes(upperSymbol)) contractSize = 1 // indices = 1 contract
    return config.pipSize * contractSize * lotSize
  }
}

// Singleton instance
const priceNormalizer = new PriceNormalizer()

export default priceNormalizer
export { PRICE_CONFIG, DEFAULT_CONFIG }
