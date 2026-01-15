/**
 * Market Data API Service
 * Provides price data from backend (powered by AllTick API)
 * This is a compatibility layer that maintains the same interface as the old MetaAPI service
 */
import { API_BASE_URL } from '../config/api'

console.log('[MarketData] Initialized - using AllTick API via backend')

class MarketDataApiService {
  constructor() {
    this.prices = new Map()
    this.subscribers = new Map()
    this.isConnected = false
  }

  async getSymbols() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prices/symbols`)
      if (!response.ok) throw new Error('Failed to fetch symbols')
      const data = await response.json()
      return data.symbols || []
    } catch (error) {
      console.error('[MarketData] Error fetching symbols:', error)
      return []
    }
  }

  async getSymbolSpecification(symbol) {
    return null
  }

  async getSymbolPrice(symbol) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prices/${symbol}`)
      if (!response.ok) return null
      const data = await response.json()
      if (data.success && data.price) {
        this.prices.set(symbol, data.price)
        return data.price
      }
      return null
    } catch (error) {
      console.error('[MarketData] Error fetching price:', error)
      return null
    }
  }

  async getAllPrices(symbolList) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/prices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: symbolList })
      })
      if (!response.ok) throw new Error('Failed to fetch prices')
      const data = await response.json()
      if (data.success && data.prices) {
        Object.entries(data.prices).forEach(([symbol, price]) => {
          this.prices.set(symbol, price)
        })
        return data.prices
      }
      return {}
    } catch (error) {
      console.error('[MarketData] Error fetching all prices:', error)
      return {}
    }
  }

  connect(symbolsToSubscribe = []) {
    this.isConnected = true
    console.log('[MarketData] Connected (prices streamed via Socket.IO)')
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
    console.log('[MarketData] Disconnected')
  }

  getPrice(symbol) {
    return this.prices.get(symbol)
  }

  updatePrice(symbol, priceData) {
    this.prices.set(symbol, priceData)
    const callback = this.subscribers.get(symbol)
    if (callback) {
      callback(priceData)
    }
  }
}

const marketDataApiService = new MarketDataApiService()

export default marketDataApiService
