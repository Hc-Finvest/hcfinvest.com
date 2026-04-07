import { io } from 'socket.io-client'
import { API_BASE_URL } from '../config/api'
import { getPriceEvents } from './eventSystem'
import { validateRealtimeTick } from '../utils/realtimeCandleBuilder'

const PRICE_STREAM_DEBUG = false
const debugPriceStream = (...args) => {
  if (PRICE_STREAM_DEBUG) {
    console.log(...args)
  }
}

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
    this.connectionStatus = 'disconnected' // 'connecting'|'live'|'stale'|'reconnecting'|'degraded'|'disconnected'
    this.lastTickAt = null
    this.backendFeedState = 'disconnected'
    this.staleThresholdMs = 15_000
    this.degradedThresholdMs = 45_000
    this._healthTimer = null
    this._statusListeners = new Map()
    this.prioritySymbols = []
    this._disconnectTimer = null
    this._disconnectDelayMs = 350
    this._lastTickKeyBySymbol = new Map()
    this._lastTickTsBySymbol = new Map()
    this._lastAcceptedMidBySymbol = new Map()
    this._lastAcceptedTimeBySymbol = new Map()
    this._barSubscriptionCounts = new Map()
  }

  _normalizePriceEnvelope(price = {}, defaults = {}) {
    const bid = Number(price.bid)
    const ask = Number(price.ask ?? price.bid)
    const feedState = String(price.feedState || defaults.feedState || this.backendFeedState || 'live').toLowerCase()
    const freshnessByFeedState = {
      live: 'LIVE',
      stale: 'STALE',
      degraded: 'STALE',
      reconnecting: 'STALE',
      connecting: 'STALE',
      disconnected: 'OLD'
    }

    return {
      bid,
      ask,
      rawBid: Number(price.rawBid ?? defaults.rawBid ?? bid),
      rawAsk: Number(price.rawAsk ?? defaults.rawAsk ?? ask),
      time: price.time ?? defaults.time ?? Date.now(),
      spread: Number.isFinite(ask) && Number.isFinite(bid) ? Math.abs(ask - bid) : 0,
      feedState,
      quoteFreshness: price.quoteFreshness || defaults.quoteFreshness || freshnessByFeedState[feedState] || 'LIVE',
      marketState: price.marketState || defaults.marketState || 'OPEN',
      source: price.source || defaults.source || 'stream_tick',
      provider: price.provider || defaults.provider || 'alltick'
    }
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
      try { cb(status, this.lastTickAt, this.backendFeedState) } catch {}
    })
  }

  _setBackendFeedState(nextState) {
    if (!nextState) return
    this.backendFeedState = nextState
  }

  _startHealthMonitor() {
    if (this._healthTimer) return
    this._healthTimer = setInterval(() => {
      this._updateStatusFromActivity()
    }, 5000)
  }

  _stopHealthMonitor() {
    if (!this._healthTimer) return
    clearInterval(this._healthTimer)
    this._healthTimer = null
  }

  _updateStatusFromActivity(force = false) {
    if (!this.socket?.connected) return

    let nextStatus = 'live'
    if (this.backendFeedState === 'reconnecting') {
      nextStatus = 'reconnecting'
    } else if (this.backendFeedState === 'degraded') {
      nextStatus = 'degraded'
    } else if (this.lastTickAt) {
      const ageMs = Date.now() - this.lastTickAt
      if (ageMs >= this.degradedThresholdMs) nextStatus = 'degraded'
      else if (ageMs >= this.staleThresholdMs || this.backendFeedState === 'stale') nextStatus = 'stale'
    }

    if (force || nextStatus !== this.connectionStatus) {
      this._emitStatus(nextStatus)
    }
  }

  /** Subscribe to connection-status changes. Returns an unsubscribe fn. */
  onStatusChange(id, callback) {
    this._statusListeners.set(id, callback)
    // Immediately deliver current state
    try { callback(this.connectionStatus, this.lastTickAt, this.backendFeedState) } catch {}
    return () => this._statusListeners.delete(id)
  }

  getConnectionHealth() {
    return {
      status: this.connectionStatus,
      lastTickAt: this.lastTickAt,
      backendFeedState: this.backendFeedState
    }
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
      this._setBackendFeedState('live')
      this._startHealthMonitor()
      this._emitStatus('live')
      // Subscribe to price stream
      this.socket.emit('subscribePrices')
      if (this.prioritySymbols.length > 0) {
        this.socket.emit('setPrioritySymbols', { symbols: this.prioritySymbols })
      }
      Array.from(this._barSubscriptionCounts.entries())
        .filter(([, count]) => count > 0)
        .forEach(([symbol]) => {
          this.socket.emit('subscribeBars', { symbol })
        })
    })

    this.socket.on('priceStream', (data) => {
      const { prices, categories, updated, timestamp, feedState } = data
      this.lastTickAt = Date.now()
      this._setBackendFeedState(feedState || 'live')
      this._updateStatusFromActivity(true)
      
      // Update local price cache with all prices
      if (prices) {
        //Sanket v2.0 - Only merge prices with valid bid to prevent overwriting good cache with zero/null values
        //Sanket v2.0 - Skip symbols with recent live ticks to avoid overwriting realtime data with stale batch prices
        const _batchNow = Date.now();
        Object.entries(prices).forEach(([sym, p]) => {
          if (p && p.bid && p.bid > 0) {
            const _normalizedSym = normalizeSym(sym);
            const _lastLiveTick = this._lastTickTsBySymbol.get(_normalizedSym) || 0;
            if (_batchNow - _lastLiveTick <= 3000) return;
            this.prices[_normalizedSym] = p;
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
      const _dispatchNow = Date.now();
      const priceEventTarget = getPriceEvents();
      Object.entries(updated || prices).forEach(([rawSymbol, p]) => {
        if (p && p.bid > 0) {
          const symbol = normalizeSym(rawSymbol);
          //Sanket v2.0 - Skip stale batch dispatch for symbols with recent live ticks
          const _lastLiveTick = this._lastTickTsBySymbol.get(symbol) || 0;
          if (_dispatchNow - _lastLiveTick <= 3000) return;
          const acceptedTick = this._acceptRealtimeTick(symbol, p.bid, p.ask, timestamp || p.time)
          if (!acceptedTick.accepted) return
          priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
            detail: {
              symbol: symbol,
              bid: acceptedTick.bid,
              ask: acceptedTick.ask,
              time: acceptedTick.tickTime
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
      const { prices, categories, timestamp, feedState } = data
      this._setBackendFeedState(feedState || this.backendFeedState)
      this._updateStatusFromActivity(true)
      
      // Full update of price cache
      if (prices) {
        //Sanket v2.0 - Rebuild snapshot but preserve live tick data for actively ticking symbols
        const _snapNow = Date.now();
        const _newPrices = {};
        Object.entries(prices).forEach(([sym, p]) => {
          const _normalized = normalizeSym(sym);
          const _lastLiveTick = this._lastTickTsBySymbol.get(_normalized) || 0;
          if (_snapNow - _lastLiveTick <= 3000 && this.prices[_normalized]) {
            _newPrices[_normalized] = this.prices[_normalized];
          } else {
            _newPrices[_normalized] = p;
          }
        });
        this.prices = _newPrices;
        
        // ✅ BROADCAST to chart datafeed (only for symbols without recent live ticks)
        const priceEventTarget = getPriceEvents()
        Object.entries(prices).forEach(([rawSymbol, p]) => {
          const symbol = normalizeSym(rawSymbol);
          //Sanket v2.0 - Skip stale snapshot dispatch for symbols with recent live ticks
          const _lastLiveTick = this._lastTickTsBySymbol.get(symbol) || 0;
          if (_snapNow - _lastLiveTick <= 3000) return;
          const acceptedTick = this._acceptRealtimeTick(symbol, p.bid, p.ask, timestamp || p.time)
          if (!acceptedTick.accepted) return
          const normalizedPrice = this._normalizePriceEnvelope(p, {
            bid: acceptedTick.bid,
            ask: acceptedTick.ask,
            time: acceptedTick.tickTime,
            source: 'snapshot'
          })
          priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
            detail: {
              symbol: symbol,
              bid: normalizedPrice.bid,
              ask: normalizedPrice.ask,
              time: normalizedPrice.time,
              feedState: normalizedPrice.feedState
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
      this._setBackendFeedState(tickData.feedState || 'live')
      this._updateStatusFromActivity(true)
      
      const { symbol: rawSymbol, bid, ask, time, rawBid, rawAsk } = tickData
      const symbol = normalizeSym(rawSymbol)

      // 🔍 DEBUG-TICK: Log every raw tick arriving from socket
      if (symbol === 'XAUUSD' || symbol === 'EURUSD') {
      debugPriceStream(`[TICK-RAW] ${symbol} bid=${bid} ask=${ask} time=${time} raw=${JSON.stringify(tickData)}`)
      }

      //Sanket v2.0 - Drop ticks with invalid/zero bid to prevent PnL flicker to $0
      if (!symbol || !bid || bid <= 0) {
        console.warn(`[TICK-DROP-ZERO] ${symbol} bid=${bid} ask=${ask} — dropped (zero/null bid)`)
        return
      }

      const acceptedTick = this._acceptRealtimeTick(symbol, bid, ask, time)
      if (!acceptedTick.accepted) {
        console.warn(`[TICK-REJECTED] ${symbol} bid=${bid} — rejected by _acceptRealtimeTick`)
        return
      }

      //Sanket v2.0 - Drop duplicate ticks arriving back-to-back for same symbol.
      const tickKey = `${symbol}|${bid}|${ask}|${time || ''}`
      const prevKey = this._lastTickKeyBySymbol.get(symbol)
      const now = Date.now()
      const prevTs = this._lastTickTsBySymbol.get(symbol) || 0
      if (prevKey === tickKey && (now - prevTs) < 400) return
      this._lastTickKeyBySymbol.set(symbol, tickKey)
      this._lastTickTsBySymbol.set(symbol, now)
      
      // ✅ BROADCAST to all price subscribers (P/L table, etc.)
      const priceObj = this._normalizePriceEnvelope({
        bid: acceptedTick.bid,
        ask: acceptedTick.ask,
        rawBid: rawBid || acceptedTick.bid,
        rawAsk: rawAsk || acceptedTick.ask,
        time: acceptedTick.tickTime,
        feedState: tickData.feedState,
        marketState: tickData.marketState,
        quoteFreshness: tickData.quoteFreshness,
        source: tickData.source || 'tick_update',
        provider: tickData.provider || 'alltick'
      })
      
      this.prices[symbol] = priceObj

      // 🔍 DEBUG-DISPATCH: Log what gets sent to TradingPage subscribers
      if (symbol === 'XAUUSD' || symbol === 'EURUSD') {
      debugPriceStream(`[TICK-DISPATCH] ${symbol} -> subscribers bid=${acceptedTick.bid} ask=${acceptedTick.ask}`)
      }
      
      this.subscribers.forEach((callback) => {
        try { callback(this.prices, { [symbol]: this.prices[symbol] }, this.lastTickAt) } catch {}
      })

      // ✅ Dispatch priceUpdate event for the chart datafeed
      try {
        const priceEventTarget = getPriceEvents()
        priceEventTarget.dispatchEvent(new CustomEvent('priceUpdate', {
          detail: {
            symbol: symbol,
            bid: priceObj.bid,
            ask: priceObj.ask,
            time: priceObj.time,
            feedState: priceObj.feedState
          }
        }))
      } catch (e) {}
    })

    this.socket.on('disconnect', () => {
      // v7.51 Silent
      this.isConnected = false
      this._setBackendFeedState('reconnecting')
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
      this._setBackendFeedState(data.feedState || this.backendFeedState)
      this._updateStatusFromActivity(true)
      
      const { symbol, timeframe, candle, feedState } = data
      
      try {
        const priceEventTarget = getPriceEvents()
        priceEventTarget.dispatchEvent(new CustomEvent('candleUpdate', {
          detail: {
            symbol,
            timeframe,
            candle,
            feedState
          }
        }))
      } catch (e) {}
    })

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++
      this._setBackendFeedState('reconnecting')
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
    this._stopHealthMonitor()
    this.isConnected = false
    this.backendFeedState = 'disconnected'
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
    const normalizedSymbol = normalizeSym(symbol)
    if (!normalizedSymbol) return

    const nextCount = (this._barSubscriptionCounts.get(normalizedSymbol) || 0) + 1
    this._barSubscriptionCounts.set(normalizedSymbol, nextCount)
    if (nextCount > 1) return

    if (this.socket?.connected) {
      this.socket.emit('subscribeBars', { symbol: normalizedSymbol })
    } else if (!this.socket) {
      this.connect();
    }
  }

  unsubscribeBars(symbol) {
    const normalizedSymbol = normalizeSym(symbol)
    if (!normalizedSymbol) return

    const currentCount = this._barSubscriptionCounts.get(normalizedSymbol) || 0
    if (currentCount <= 1) {
      this._barSubscriptionCounts.delete(normalizedSymbol)
      if (this.socket?.connected) {
        this.socket.emit('unsubscribeBars', { symbol: normalizedSymbol })
      }
      return
    }

    this._barSubscriptionCounts.set(normalizedSymbol, currentCount - 1)
  }

  getBarSubscriptionCount(symbol) {
    const normalizedSymbol = normalizeSym(symbol)
    return this._barSubscriptionCounts.get(normalizedSymbol) || 0
  }

  getActiveBarSubscriptions() {
    return Array.from(this._barSubscriptionCounts.entries())
      .filter(([, count]) => count > 0)
      .map(([symbol]) => symbol)
  }

  clearBarSubscriptionCounts() {
    this._barSubscriptionCounts.clear()
    if (this.socket?.connected) {
      this.socket.emit('unsubscribeBars')
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

