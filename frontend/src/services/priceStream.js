import { io } from 'socket.io-client'
import { API_BASE_URL } from '../config/api'
import { getPriceEvents } from './datafeed'
export { getPriceEvents }

const SOCKET_URL = API_BASE_URL

class PriceStreamService {
  constructor() {
    this.socket = null
    this.prices = {}
    this.categories = {}
    this.subscribers = new Map()
    this.categorySubscribers = new Map()
    this.tradeSubscribers = new Map()
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    // Connection health tracking
    this.connectionStatus = 'disconnected' // 'connecting'|'live'|'reconnecting'|'disconnected'
    this.lastTickAt = null
    this._statusListeners = new Map()
    this.prioritySymbols = []
    this._disconnectTimer = null
    this._disconnectDelayMs = 350
    this._lastTickKeyBySymbol = new Map()
    this._lastTickTsBySymbol = new Map()
  }

  _emitStatus(status) {
    if (this.connectionStatus === status) return
    this.connectionStatus = status
    this._statusListeners.forEach(cb => {
      try { cb(status, this.lastTickAt) } catch {}
    })
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe fn. */
  onStatusChange(id, callback) {
    this._statusListeners.set(id, callback)
    // Immediately deliver current state
    try { callback(this.connectionStatus, this.lastTickAt) } catch {}
    return () => this._statusListeners.delete(id)
  }

  connect() {
    //Sanket v2.0 - Guard against duplicate connect() calls while socket is already connected OR connecting.
    // React StrictMode can mount/unmount effects twice in dev, which previously created parallel sockets.
    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer)
      this._disconnectTimer = null
    }
    if (this.socket) {
      if (this.socket.connected || this.connectionStatus === 'connecting' || this.connectionStatus === 'reconnecting') {
        return
      }
      try {
        this.socket.connect()
        this._emitStatus('connecting')
        return
      } catch (e) {}
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    this._emitStatus('connecting')

    this.socket.on('connect', () => {
      console.log('[PriceStream] Connected to server')
      this.isConnected = true
      this.reconnectAttempts = 0
      this._emitStatus('live')
      // Subscribe to price stream
      this.socket.emit('subscribePrices')
      if (this.prioritySymbols.length > 0) {
        this.socket.emit('setPrioritySymbols', { symbols: this.prioritySymbols })
      }
    })

    this.socket.on('priceStream', (data) => {
      const { prices, categories, updated, timestamp } = data
      this.lastTickAt = Date.now()
      if (this.connectionStatus !== 'live') this._emitStatus('live')
      
      // Update local price cache with all prices
      if (prices) {
        this.prices = { ...this.prices, ...prices }
      }
      
      // Update categories cache
      if (categories) {
        this.categories = categories
      }
      
      // NOTE: Do NOT dispatch priceUpdate events from priceStream.
      // Chart candle aggregation is handled exclusively by the tickUpdate event handler below.
      // priceStream (both per-tick and 1s interval) was causing chart candles to be updated
      // redundantly — inflating volume and H/L on every snapshot even during quiet markets.

      // Notify all price subscribers with updated prices only (throttled)
      this.subscribers.forEach((callback, id) => {
        try {
          callback(this.prices, updated || {}, timestamp)
        } catch (e) {
          console.error('[PriceStream] Subscriber error:', e)
        }
      })
      
      // Notify all category subscribers
      this.categorySubscribers.forEach((callback, id) => {
        try {
          callback(this.categories, timestamp)
        } catch (e) {
          console.error('[PriceStream] Category subscriber error:', e)
        }
      })
    })

    // Handle full price snapshots (fallback every 2s)
    this.socket.on('priceSnapshot', (data) => {
      const { prices, categories, timestamp } = data
      
      // Full update of price cache
      if (prices) {
        this.prices = prices
        
        // ✅ BROADCAST to chart datafeed
        const priceEventTarget = getPriceEvents()
        Object.entries(prices).forEach(([symbol, p]) => {
          priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
            detail: {
              symbol: symbol,
              bid: p.bid,
              ask: p.ask,
              time: timestamp || new Date().toISOString()
            }
          }))
        })
      }
      
      // Update categories cache
      if (categories) {
        this.categories = categories
      }
      
      // Notify subscribers with full snapshot
      this.subscribers.forEach((callback, id) => {
        try {
          callback(this.prices, prices, timestamp)
        } catch (e) {
          console.error('[PriceStream] Subscriber error:', e)
        }
      })
    })

    // ✅ NEW: Handle real-time tick updates for candle aggregation
    this.socket.on('tickUpdate', (tickData) => {
      if (!tickData) return
      this.lastTickAt = Date.now()
      if (this.connectionStatus !== 'live') this._emitStatus('live')
      
      const { symbol, bid, ask, time } = tickData

      //Sanket v2.0 - Drop duplicate ticks arriving back-to-back for same symbol.
      // This prevents duplicate console lines and duplicate downstream priceUpdate dispatches.
      const tickKey = `${symbol}|${bid}|${ask}|${time || ''}`
      const prevKey = this._lastTickKeyBySymbol.get(symbol)
      const now = Date.now()
      const prevTs = this._lastTickTsBySymbol.get(symbol) || 0
      if (prevKey === tickKey && (now - prevTs) < 400) return
      this._lastTickKeyBySymbol.set(symbol, tickKey)
      this._lastTickTsBySymbol.set(symbol, now)
      
      // console.log(`[PriceStream] 📍 Tick received: ${symbol} bid=${bid} ask=${ask}`)
      
      // ✅ Dispatch priceUpdate event for the chart datafeed to aggregate into candles
      try {
        const priceEventTarget = getPriceEvents()
        priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
          detail: {
            symbol: symbol,
            bid: bid,
            ask: ask,
            time: time || new Date().toISOString()
          }
        }))
      } catch (e) {
        console.error('[PriceStream] Failed to dispatch tickUpdate:', e.message)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('[PriceStream] Disconnected')
      this.isConnected = false
      this._emitStatus('reconnecting')
    })

    // ✅ NEW: Listen to live trade updates pushes from backend
    this.socket.on('tradeUpdated', (trade) => {
      console.log(`[PriceStream] 🔄 Trade Updated: ${trade.tradeId}`)
      this.tradeSubscribers.forEach((callback) => {
        try { callback(trade, 'updated') } catch (e) { console.error(e) }
      })
    })

    this.socket.on('tradeClosed', (trade) => {
      console.log(`[PriceStream] ❌ Trade Closed: ${trade.tradeId}`)
      this.tradeSubscribers.forEach((callback) => {
        try { callback(trade, 'closed') } catch (e) { console.error(e) }
      })
    })

    // ✅ Backend Candle Authority: Handle authoritative candle updates
    this.socket.on('candleUpdate', (data) => {
      if (!data) return
      
      const { symbol, timeframe, candle } = data
      
      try {
        const priceEventTarget = getPriceEvents()
        priceEventTarget.dispatchEvent(new CustomEvent('candleUpdate', {
          detail: {
            symbol,
            timeframe,
            candle
          }
        }))
      } catch (e) {
        console.error('[PriceStream] Failed to dispatch candleUpdate:', e.message)
      }
    })

    this.socket.on('connect_error', (error) => {
      console.error('[PriceStream] Connection error:', error.message)
      this.reconnectAttempts++
      this._emitStatus('reconnecting')
    })
  }

  disconnect() {
    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer)
      this._disconnectTimer = null
    }
    if (this.socket) {
      //Sanket v2.0 - Avoid emitting on a socket that never fully connected.
      // This prevents noisy "closed before established" behavior during quick strict-mode teardown.
      if (this.socket.connected) {
        this.socket.emit('unsubscribePrices')
      }
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this._emitStatus('disconnected')
    this.subscribers.clear()
    this.categorySubscribers.clear()
  }

  _scheduleDisconnectIfIdle() {
    //Sanket v2.0 - Delay disconnect slightly to absorb rapid unsubscribe/resubscribe bursts.
    // This is common in React StrictMode and route transitions.
    if (this._disconnectTimer) return
    this._disconnectTimer = setTimeout(() => {
      this._disconnectTimer = null
      if (this.subscribers.size === 0 && this.categorySubscribers.size === 0 && this.tradeSubscribers.size === 0) {
        this.disconnect()
      }
    }, this._disconnectDelayMs)
  }

  subscribe(id, callback) {
    this.subscribers.set(id, callback)
    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer)
      this._disconnectTimer = null
    }
    // Connect if not already connected
    if (!this.socket?.connected) {
      this.connect()
    }
    // Send current prices immediately
    if (Object.keys(this.prices).length > 0) {
      callback(this.prices, {}, Date.now())
    }
    return () => this.unsubscribe(id)
  }

  // Subscribe to category-wise price updates
  subscribeToCategories(id, callback) {
    this.categorySubscribers.set(id, callback)
    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer)
      this._disconnectTimer = null
    }
    // Connect if not already connected
    if (!this.socket?.connected) {
      this.connect()
    }
    // Send current categories immediately
    if (Object.keys(this.categories).length > 0) {
      callback(this.categories, Date.now())
    }
    return () => this.unsubscribeFromCategories(id)
  }

  unsubscribe(id) {
    this.subscribers.delete(id)
    // Disconnect if no subscribers
    if (this.subscribers.size === 0 && this.categorySubscribers.size === 0) {
      this._scheduleDisconnectIfIdle()
    }
  }

  unsubscribeFromCategories(id) {
    this.categorySubscribers.delete(id)
    // Disconnect if no subscribers
    if (this.subscribers.size === 0 && this.categorySubscribers.size === 0 && this.tradeSubscribers.size === 0) {
      this._scheduleDisconnectIfIdle()
    }
  }

  // ✅ Trade synchronization subscriptions
  subscribeToTrades(id, callback) {
    this.tradeSubscribers.set(id, callback)
    if (this._disconnectTimer) {
      clearTimeout(this._disconnectTimer)
      this._disconnectTimer = null
    }
    if (!this.socket?.connected) this.connect()
    return () => this.unsubscribeFromTrades(id)
  }

  unsubscribeFromTrades(id) {
    this.tradeSubscribers.delete(id)
    if (this.subscribers.size === 0 && this.categorySubscribers.size === 0 && this.tradeSubscribers.size === 0) {
      this._scheduleDisconnectIfIdle()
    }
  }

  getPrice(symbol) {
    return this.prices[symbol] || null
  }

  getAllPrices() {
    return this.prices
  }

  // Get all categories with prices
  getCategories() {
    return this.categories
  }

  // Get prices for a specific category
  getCategoryPrices(category) {
    return this.categories[category] || null
  }

  setPrioritySymbols(symbols = []) {
    this.prioritySymbols = [...new Set((Array.isArray(symbols) ? symbols : [symbols]).filter(Boolean))]
    if (this.socket?.connected) {
      this.socket.emit('setPrioritySymbols', { symbols: this.prioritySymbols })
    } else if (!this.socket) {
      this.connect()
    }
  }

  // ✅ Backend Candle Authority: Trigger room-based subscription
  subscribeBars(symbol) {
    if (this.socket?.connected) {
      this.socket.emit('subscribeBars', { symbol })
    } else if (!this.socket) {
      this.connect();
    }
  }

  unsubscribeBars(symbol) {
    if (this.socket?.connected) {
      this.socket.emit('unsubscribeBars', { symbol })
    }
  }

  // Calculate PnL for a trade using current prices
  calculatePnl(trade) {
    const prices = this.prices[trade.symbol]
    if (!prices) return 0
    
    const currentPrice = trade.side === 'BUY' ? prices.bid : prices.ask
    const contractSize = trade.contractSize || 100
    
    if (trade.side === 'BUY') {
      return (currentPrice - trade.openPrice) * trade.quantity * contractSize
    } else {
      return (trade.openPrice - currentPrice) * trade.quantity * contractSize
    }
  }
}

// Singleton instance
const priceStreamService = new PriceStreamService()

export default priceStreamService

