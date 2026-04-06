import { io } from 'socket.io-client'
import { API_BASE_URL } from '../config/api'
import { getPriceEvents } from './eventSystem'
import { validateRealtimeTick } from '../utils/realtimeCandleBuilder'

const SOCKET_URL = API_BASE_URL

//SANKET - Universal Normalization Wrapper for consistent key matching
const normalizeSym = (val = '') => {
  if (!val) return '';
  return String(val)
    .toUpperCase()
    .replace(/\.I$/i, '')
    .replace(/\.F$/i, '')
    .replace(/\.C$/i, '')
    .replace(/[^A-Z0-9]/g, '');
};

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
    this._lastAcceptedMidBySymbol = new Map()
    this._lastAcceptedTimeBySymbol = new Map()
  }

  _acceptRealtimeTick(symbol, bid, ask, time) {
    const result = validateRealtimeTick({
      symbol,
      bid,
      ask,
      time,
      state: {
        lastMid: this._lastAcceptedMidBySymbol.get(symbol),
        lastTime: this._lastAcceptedTimeBySymbol.get(symbol)
      }
    })

    if (!result.accepted) return result

    this._lastAcceptedMidBySymbol.set(symbol, result.mid)
    this._lastAcceptedTimeBySymbol.set(symbol, result.tickTime)
    return result
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
      // v7.51 Silent
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
        //Sanket v2.0 - Only merge prices with valid bid to prevent overwriting good cache with zero/null values
        Object.entries(prices).forEach(([sym, p]) => {
          if (p && p.bid && p.bid > 0) {
            this.prices[normalizeSym(sym)] = p;
          }
        });
      }
      
      // Update categories cache
      if (categories) {
        this.categories = categories
      }
      
      // NOTE: We now dispatch priceUpdate events from priceStream as a robust fallback.
      // While tickUpdate (high frequency) is the preferred driver for smooth chart movement,
      // priceStream ensuring the chart moves at least every 1s if the tick stream is quiet.
    if (prices) {
      const priceEventTarget = getPriceEvents();
      //Sanket v2.0 - Removed _acceptRealtimeTick filter here. Spike filtering belongs in datafeed.js
      // (validateRealtimeUpdate) not in the broadcaster. Filtering here caused chart + buy/sell buttons
      // to freeze after any legitimate rapid move once lastMid diverged from real price.
      Object.entries(updated || prices).forEach(([rawSymbol, p]) => {
        if (p && p.bid > 0) {
          const symbol = normalizeSym(rawSymbol);
          priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
            detail: {
              symbol: symbol,
              bid: p.bid,
              ask: p.ask,
              time: timestamp || p.time
            }
          }));
        }
      });
    }

      // Notify all price subscribers with updated prices only (throttled)
      this.subscribers.forEach((callback, id) => {
        try {
          callback(this.prices, updated || {}, timestamp)
        } catch (e) {}
      })
      
      // Notify all category subscribers
      this.categorySubscribers.forEach((callback, id) => {
        try {
          callback(this.categories, timestamp)
        } catch (e) {}
      })
    })

    // Handle full price snapshots (fallback every 2s)
    this.socket.on('priceSnapshot', (data) => {
      const { prices, categories, timestamp } = data
      
      // Full update of price cache
      if (prices) {
        // Rebuild normalized price cache
        this.prices = {}
        Object.entries(prices).forEach(([sym, p]) => {
          this.prices[normalizeSym(sym)] = p;
        });
        
        // ✅ BROADCAST to chart datafeed
        //Sanket v2.0 - Removed _acceptRealtimeTick filter (same fix as priceUpdate handler above)
        const priceEventTarget = getPriceEvents()
        Object.entries(prices).forEach(([rawSymbol, p]) => {
          if (!p || !(p.bid > 0)) return
          const symbol = normalizeSym(rawSymbol);
          priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
            detail: {
              symbol: symbol,
              bid: p.bid,
              ask: p.ask,
              time: timestamp || p.time
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
        } catch (e) {}
      })
    })

    // ✅ NEW: Handle real-time tick updates for candle aggregation AND UI (P/L tables)
    this.socket.on('tickUpdate', (tickData) => {
      if (!tickData) return
      this.lastTickAt = Date.now()
      if (this.connectionStatus !== 'live') this._emitStatus('live')
      
      const { symbol: rawSymbol, bid, ask, time, rawBid, rawAsk } = tickData
      const symbol = normalizeSym(rawSymbol)

      //Sanket v2.0 - Drop ticks with invalid/zero bid to prevent PnL flicker to $0
      if (!symbol || !bid || bid <= 0) return

      //Sanket v2.0 - Removed _acceptRealtimeTick spike filter from tickUpdate path.
      // Previously this blocked ticks that jumped > 5% from lastMid. Since lastMid only updates
      // on ACCEPTED ticks, any rapid legitimate market move (e.g. NFP release) would cause ALL
      // subsequent ticks to be silently dropped until LONG_GAP_MS (45min) reset the check.
      // Result: chart + buy/sell buttons completely frozen during real price moves.
      // Fix: let raw ticks through; datafeed.js validateRealtimeUpdate handles chart-side filtering.

      //Sanket v2.0 - Drop duplicate ticks arriving back-to-back for same symbol.
      const tickKey = `${symbol}|${bid}|${ask}|${time || ''}`
      const prevKey = this._lastTickKeyBySymbol.get(symbol)
      const now = Date.now()
      const prevTs = this._lastTickTsBySymbol.get(symbol) || 0
      if (prevKey === tickKey && (now - prevTs) < 400) return
      this._lastTickKeyBySymbol.set(symbol, tickKey)
      this._lastTickTsBySymbol.set(symbol, now)
      
      // ✅ BROADCAST to all price subscribers (P/L table, etc.)
      const priceObj = { 
        bid,
        ask,
        rawBid: rawBid || bid,
        rawAsk: rawAsk || ask,
        time: time || new Date().toISOString()
      }
      
      this.prices[symbol] = priceObj
      
      this.subscribers.forEach((callback) => {
        try { callback(this.prices, { [symbol]: this.prices[symbol] }, this.lastTickAt) } catch {}
      })

      // ✅ Dispatch priceUpdate event for the chart datafeed
      try {
        const priceEventTarget = getPriceEvents()
        priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
          detail: {
            symbol: symbol,
            bid,
            ask,
            time: time || new Date().toISOString()
          }
        }))
      } catch (e) {}
    })

    this.socket.on('disconnect', () => {
      // v7.51 Silent
      this.isConnected = false
      this._emitStatus('reconnecting')
    })

    // ✅ NEW: Listen to live trade updates pushes from backend
    this.socket.on('tradeUpdated', (trade) => {
      // v7.51 Silent
      this.tradeSubscribers.forEach((callback) => {
        try { callback(trade, 'updated') } catch (e) {}
      })
    })

    this.socket.on('tradeClosed', (trade) => {
      // v7.51 Silent
      this.tradeSubscribers.forEach((callback) => {
        try { callback(trade, 'closed') } catch (e) {}
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
      } catch (e) {}
    })

    this.socket.on('connect_error', (error) => {
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

  // ✅ Account-room subscription (v7.69)
  subscribeToAccount(accountId) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe', { tradingAccountId: accountId })
    } else if (!this.socket) {
      this.connect()
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

//Sanket v2.0 - Re-export getPriceEvents so TradingPage and AdvancedChart can import it from
// this module without a separate import from eventSystem. Previously these components imported
// { getPriceEvents } from './priceStream' but priceStream never re-exported it → undefined →
// hadleMetaApiPriceUpdate and handlePriceUpdate (chart) never registered → buy/sell buttons
// only updated via the 300ms-throttled priceStreamService.subscribe fallback, appeared stuck.
export { getPriceEvents }

export default priceStreamService

