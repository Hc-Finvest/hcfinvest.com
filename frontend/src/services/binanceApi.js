/**
 * Crypto API Service - Compatibility Layer
 * All prices now come from AllTick API via backend
 * This file is kept for backward compatibility with existing imports
 */

class CryptoApiService {
  constructor() {
    this.prices = new Map()
    this.subscribers = new Map()
    this.isConnected = false
  }

  // Get all crypto symbols we support
  getCryptoSymbols() {
    return [
      { symbol: 'BTCUSD', name: 'Bitcoin', category: 'Crypto' },
      { symbol: 'ETHUSD', name: 'Ethereum', category: 'Crypto' },
      { symbol: 'BNBUSD', name: 'BNB', category: 'Crypto' },
      { symbol: 'SOLUSD', name: 'Solana', category: 'Crypto' },
      { symbol: 'XRPUSD', name: 'XRP', category: 'Crypto' },
      { symbol: 'ADAUSD', name: 'Cardano', category: 'Crypto' },
      { symbol: 'DOGEUSD', name: 'Dogecoin', category: 'Crypto' },
      { symbol: 'DOTUSD', name: 'Polkadot', category: 'Crypto' },
      { symbol: 'MATICUSD', name: 'Polygon', category: 'Crypto' },
      { symbol: 'LTCUSD', name: 'Litecoin', category: 'Crypto' },
      { symbol: 'AVAXUSD', name: 'Avalanche', category: 'Crypto' },
      { symbol: 'LINKUSD', name: 'Chainlink', category: 'Crypto' },
    ]
  }

  async getSymbolPrice(symbol) {
    return this.prices.get(symbol) || null
  }

  async getAllPrices(symbolList) {
    const prices = {}
    for (const symbol of symbolList) {
      const price = this.prices.get(symbol)
      if (price) prices[symbol] = price
    }
    return prices
  }

  connect(symbolsToSubscribe = []) {
    this.isConnected = true
    console.log('[CryptoAPI] Connected (prices from AllTick via backend)')
  }

  subscribe(symbol, callback) {
    this.subscribers.set(symbol, callback)
  }

  unsubscribe(symbol) {
    this.subscribers.delete(symbol)
  }

  disconnect() {
    this.subscribers.clear()
    this.isConnected = false
  }

  getPrice(symbol) {
    return this.prices.get(symbol)
  }

  updatePrice(symbol, priceData) {
    this.prices.set(symbol, priceData)
    const callback = this.subscribers.get(symbol)
    if (callback) callback(priceData)
  }
}

const cryptoApiService = new CryptoApiService()

export default cryptoApiService
