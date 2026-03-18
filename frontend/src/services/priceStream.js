// // Institutional-grade real-time price streaming service using Socket.IO
// import { io } from 'socket.io-client'
// import { API_BASE_URL } from '../config/api'

// const SOCKET_URL = API_BASE_URL

// class PriceStreamService {
//   constructor() {
//     this.socket = null
//     this.prices = {}
//     this.categories = {}
//     this.subscribers = new Map()
//     this.categorySubscribers = new Map()
//     this.isConnected = false
//     this.reconnectAttempts = 0
//     this.maxReconnectAttempts = 10
//   }

//   connect() {
//     if (this.socket?.connected) return

//     this.socket = io(SOCKET_URL, {
//       transports: ['websocket'],
//       reconnection: true,
//       reconnectionAttempts: this.maxReconnectAttempts,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000
//     })

//     this.socket.on('connect', () => {
//       console.log('[PriceStream] Connected to server')
//       this.isConnected = true
//       this.reconnectAttempts = 0
//       // Subscribe to price stream
//       this.socket.emit('subscribePrices')
//     })

//     this.socket.on('priceStream', (data) => {
//       const { prices, categories, updated, timestamp } = data
      
//       // Update local price cache with all prices
//       if (prices) {
//         this.prices = { ...this.prices, ...prices }
//       }
      
//       // Update categories cache
//       if (categories) {
//         this.categories = categories
//       }
      
//       // Notify all price subscribers with updated prices only (throttled)
//       this.subscribers.forEach((callback, id) => {
//         try {
//           callback(this.prices, updated || {}, timestamp)
//         } catch (e) {
//           console.error('[PriceStream] Subscriber error:', e)
//         }
//       })
      
//       // Notify all category subscribers
//       this.categorySubscribers.forEach((callback, id) => {
//         try {
//           callback(this.categories, timestamp)
//         } catch (e) {
//           console.error('[PriceStream] Category subscriber error:', e)
//         }
//       })
//     })

//     // Handle full price snapshots (fallback every 2s)
//     this.socket.on('priceSnapshot', (data) => {
//       const { prices, categories, timestamp } = data
      
//       // Full update of price cache
//       if (prices) {
//         this.prices = prices
//       }
      
//       // Update categories cache
//       if (categories) {
//         this.categories = categories
//       }
      
//       // Notify subscribers with full snapshot
//       this.subscribers.forEach((callback, id) => {
//         try {
//           callback(this.prices, prices, timestamp)
//         } catch (e) {
//           console.error('[PriceStream] Subscriber error:', e)
//         }
//       })
//     })

//     this.socket.on('disconnect', () => {
//       console.log('[PriceStream] Disconnected')
//       this.isConnected = false
//     })

//     this.socket.on('connect_error', (error) => {
//       console.error('[PriceStream] Connection error:', error.message)
//       this.reconnectAttempts++
//     })
//   }

//   disconnect() {
//     if (this.socket) {
//       this.socket.emit('unsubscribePrices')
//       this.socket.disconnect()
//       this.socket = null
//     }
//     this.isConnected = false
//     this.subscribers.clear()
//     this.categorySubscribers.clear()
//   }

//   subscribe(id, callback) {
//     this.subscribers.set(id, callback)
//     // Connect if not already connected
//     if (!this.socket?.connected) {
//       this.connect()
//     }
//     // Send current prices immediately
//     if (Object.keys(this.prices).length > 0) {
//       callback(this.prices, {}, Date.now())
//     }
//     return () => this.unsubscribe(id)
//   }

//   // Subscribe to category-wise price updates
//   subscribeToCategories(id, callback) {
//     this.categorySubscribers.set(id, callback)
//     // Connect if not already connected
//     if (!this.socket?.connected) {
//       this.connect()
//     }
//     // Send current categories immediately
//     if (Object.keys(this.categories).length > 0) {
//       callback(this.categories, Date.now())
//     }
//     return () => this.unsubscribeFromCategories(id)
//   }

//   unsubscribe(id) {
//     this.subscribers.delete(id)
//     // Disconnect if no subscribers
//     if (this.subscribers.size === 0 && this.categorySubscribers.size === 0) {
//       this.disconnect()
//     }
//   }

//   unsubscribeFromCategories(id) {
//     this.categorySubscribers.delete(id)
//     // Disconnect if no subscribers
//     if (this.subscribers.size === 0 && this.categorySubscribers.size === 0) {
//       this.disconnect()
//     }
//   }

//   getPrice(symbol) {
//     return this.prices[symbol] || null
//   }

//   getAllPrices() {
//     return this.prices
//   }

//   // Get all categories with prices
//   getCategories() {
//     return this.categories
//   }

//   // Get prices for a specific category
//   getCategoryPrices(category) {
//     return this.categories[category] || null
//   }

//   // Calculate PnL for a trade using current prices
//   calculatePnl(trade) {
//     const prices = this.prices[trade.symbol]
//     if (!prices) return 0
    
//     const currentPrice = trade.side === 'BUY' ? prices.bid : prices.ask
//     const contractSize = trade.contractSize || 100
    
//     if (trade.side === 'BUY') {
//       return (currentPrice - trade.openPrice) * trade.quantity * contractSize
//     } else {
//       return (trade.openPrice - currentPrice) * trade.quantity * contractSize
//     }
//   }
// }

// // Singleton instance
// const priceStreamService = new PriceStreamService()

// export default priceStreamService




// --------------------------------------------------------------------------------------------------------------


// Institutional-grade real-time price streaming service using Socket.IO
import { io } from 'socket.io-client'
import { API_BASE_URL } from '../config/api'
import { getMetaApiPriceEvents } from './datafeed'

const SOCKET_URL = API_BASE_URL

class PriceStreamService {
  constructor() {
    this.socket = null
    this.prices = {}
    this.categories = {}
    this.subscribers = new Map()
    this.categorySubscribers = new Map()
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    // Connection health tracking
    this.connectionStatus = 'disconnected' // 'connecting'|'live'|'reconnecting'|'disconnected'
    this.lastTickAt = null
    this._statusListeners = new Map()
    this.prioritySymbols = []
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
    if (this.socket?.connected) return

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
        const priceEventTarget = getMetaApiPriceEvents()
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
      
      console.log(`[PriceStream] 📍 Tick received: ${symbol} bid=${bid} ask=${ask}`)
      
      // ✅ Dispatch priceUpdate event for the chart datafeed to aggregate into candles
      try {
        const priceEventTarget = getMetaApiPriceEvents()
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

    this.socket.on('connect_error', (error) => {
      console.error('[PriceStream] Connection error:', error.message)
      this.reconnectAttempts++
      this._emitStatus('reconnecting')
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('unsubscribePrices')
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnected = false
    this.subscribers.clear()
    this.categorySubscribers.clear()
  }

  subscribe(id, callback) {
    this.subscribers.set(id, callback)
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
      this.disconnect()
    }
  }

  unsubscribeFromCategories(id) {
    this.categorySubscribers.delete(id)
    // Disconnect if no subscribers
    if (this.subscribers.size === 0 && this.categorySubscribers.size === 0) {
      this.disconnect()
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

