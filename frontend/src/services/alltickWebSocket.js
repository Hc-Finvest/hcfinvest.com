import { v4 as uuidv4 } from 'uuid'

class AllTickWebSocket {
  constructor() {
    this.ws = null
    this.subscribers = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 1 // Only try once, then switch to polling
    this.reconnectDelay = 1000
    this.isConnected = false
    this.heartbeatInterval = null
    this.pollingInterval = null
    this.usePolling = false
    this.pollingSubscribers = new Map()
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      console.log('[AllTickWebSocket] Attempting WebSocket connection...')
      // AllTick WebSocket endpoint
      this.ws = new WebSocket('wss://quote.alltick.io/quote-b-ws-api?token=1620b8aba97f46dec78ec599d611b958-c-app')

      this.ws.onopen = () => {
        console.log('[AllTickWebSocket] Connected to AllTick WebSocket')
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Start heartbeat to keep connection alive
        this.startHeartbeat()
        
        // Resubscribe to all symbols after reconnection
        this.resubscribeAll()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[AllTickWebSocket] Received message:', data)
          this.handleMessage(data)
        } catch (error) {
          console.error('[AllTickWebSocket] Error parsing message:', error, 'Raw data:', event.data)
        }
      }

      this.ws.onclose = (event) => {
        console.log('[AllTickWebSocket] Connection closed:', event.code, event.reason)
        this.isConnected = false
        this.stopHeartbeat()
        
        // If connection closed abnormally or never connected, switch to polling immediately
        if (event.code === 1006 || this.reconnectAttempts === 0) {
          console.log('[AllTickWebSocket] Connection failed, switching to HTTP polling immediately')
          this.switchToPolling()
          return
        }
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect()
        } else {
          this.switchToPolling()
        }
      }

      this.ws.onerror = (error) => {
        console.error('[AllTickWebSocket] WebSocket error:', error)
        this.isConnected = false
        
        // Switch to polling immediately on error
        console.log('[AllTickWebSocket] WebSocket error detected, switching to HTTP polling')
        setTimeout(() => this.switchToPolling(), 100)
      }

    } catch (error) {
      console.error('[AllTickWebSocket] Failed to create WebSocket:', error)
      // Switch to polling immediately if WebSocket creation fails
      this.switchToPolling()
    }
  }

  handleMessage(data) {
    console.log('[AllTickWebSocket] Processing message:', data)
    
    // Handle different message types from AllTick
    if (data.cmd_id && data.data) {
      switch (data.cmd_id) {
        case 22002: // Subscribe response
          console.log('[AllTickWebSocket] Subscription confirmed:', data.data)
          break
        case 22003: // Unsubscribe response
          console.log('[AllTickWebSocket] Unsubscription confirmed:', data.data)
          break
        case 22004: // Real-time data
        case 22005: // Tick data
          console.log('[AllTickWebSocket] Real-time data received:', data.data)
          this.handleRealtimeData(data.data)
          break
        default:
          console.log('[AllTickWebSocket] Unknown message type:', data.cmd_id, data.data)
      }
    } else if (data.event && data.data) {
      // Handle event-based messages
      console.log('[AllTickWebSocket] Event message:', data.event, data.data)
      this.handleRealtimeData(data.data)
    } else {
      console.log('[AllTickWebSocket] Unhandled message format:', data)
    }
  }

  handleRealtimeData(data) {
    console.log('[AllTickWebSocket] Processing real-time data:', data)
    
    // Process real-time price data - handle different formats
    let symbolDataArray = []
    
    if (data.symbol_list && Array.isArray(data.symbol_list)) {
      symbolDataArray = data.symbol_list
    } else if (data.code) {
      // Single symbol data
      symbolDataArray = [data]
    } else if (Array.isArray(data)) {
      symbolDataArray = data
    } else {
      console.log('[AllTickWebSocket] Unknown data format:', data)
      return
    }

    symbolDataArray.forEach(symbolData => {
      const symbol = symbolData.code || symbolData.symbol
      if (!symbol) {
        console.log('[AllTickWebSocket] No symbol found in data:', symbolData)
        return
      }

      const priceData = {
        symbol: symbol,
        price: symbolData.last_price || symbolData.price || symbolData.close,
        bid: symbolData.bid_price || symbolData.bid,
        ask: symbolData.ask_price || symbolData.ask,
        volume: symbolData.volume || symbolData.vol || 0,
        timestamp: symbolData.timestamp || Date.now(),
        high: symbolData.high_price || symbolData.high,
        low: symbolData.low_price || symbolData.low,
        open: symbolData.open_price || symbolData.open,
        close: symbolData.last_price || symbolData.price || symbolData.close
      }

      console.log('[AllTickWebSocket] Price data for', symbol, ':', priceData)

      // Notify all subscribers for this symbol
      const symbolSubscribers = this.subscribers.get(symbol)
      if (symbolSubscribers) {
        symbolSubscribers.forEach(callback => {
          try {
            callback(priceData)
          } catch (error) {
            console.error(`[AllTickWebSocket] Error in subscriber callback for ${symbol}:`, error)
          }
        })
      }

      // Also notify general subscribers (listening to all symbols)
      const generalSubscribers = this.subscribers.get('*')
      if (generalSubscribers) {
        generalSubscribers.forEach(callback => {
          try {
            callback(priceData)
          } catch (error) {
            console.error('[AllTickWebSocket] Error in general subscriber callback:', error)
          }
        })
      }
    })
  }

  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set())
    }
    this.subscribers.get(symbol).add(callback)

    // Also add to polling subscribers for fallback
    if (!this.pollingSubscribers.has(symbol)) {
      this.pollingSubscribers.set(symbol, new Set())
    }
    this.pollingSubscribers.get(symbol).add(callback)

    // If already using polling, start polling immediately
    if (this.usePolling) {
      console.log('[AllTickWebSocket] Already in polling mode, starting data fetch')
      if (!this.pollingInterval) {
        this.pollingInterval = setInterval(() => {
          this.pollForData()
        }, 2000)
      }
      // Initial poll for this symbol
      this.pollForData()
      return () => this.unsubscribe(symbol, callback)
    }

    // Connect if not already connected and not using polling
    if (!this.isConnected && !this.usePolling) {
      this.connect()
    }

    // Send subscription message to AllTick if WebSocket is connected
    if (this.ws?.readyState === WebSocket.OPEN && !this.usePolling) {
      this.sendSubscription(symbol)
    }

    // Return unsubscribe function
    return () => this.unsubscribe(symbol, callback)
  }

  unsubscribe(symbol, callback) {
    const symbolSubscribers = this.subscribers.get(symbol)
    if (symbolSubscribers) {
      symbolSubscribers.delete(callback)
      if (symbolSubscribers.size === 0) {
        this.subscribers.delete(symbol)
        // Send unsubscribe message to AllTick if WebSocket is connected
        if (this.ws?.readyState === WebSocket.OPEN && !this.usePolling) {
          this.sendUnsubscription(symbol)
        }
      }
    }

    // Also remove from polling subscribers
    const pollingSubscribers = this.pollingSubscribers.get(symbol)
    if (pollingSubscribers) {
      pollingSubscribers.delete(callback)
      if (pollingSubscribers.size === 0) {
        this.pollingSubscribers.delete(symbol)
      }
    }

    // Stop polling if no subscribers
    if (this.pollingSubscribers.size === 0 && this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  sendSubscription(symbol) {
    const message = {
      cmd_id: 22002,
      seq_id: Date.now(),
      trace: uuidv4(),
      data: {
        symbol_list: [
          {
            code: symbol,
            kline_type: 1, // 1-minute data
            depth_level: 0
          }
        ]
      }
    }
    
    console.log('[AllTickWebSocket] Sending subscription:', message)
    this.ws.send(JSON.stringify(message))
    console.log(`[AllTickWebSocket] Subscribed to ${symbol}`)
  }

  sendUnsubscription(symbol) {
    const message = {
      cmd_id: 22003,
      seq_id: Date.now(),
      trace: uuidv4(),
      data: {
        symbol_list: [
          {
            code: symbol
          }
        ]
      }
    }
    this.ws.send(JSON.stringify(message))
    console.log(`[AllTickWebSocket] Unsubscribed from ${symbol}`)
  }

  resubscribeAll() {
    // Resubscribe to all symbols after reconnection
    this.subscribers.forEach((subscribers, symbol) => {
      if (symbol !== '*' && subscribers.size > 0) {
        this.sendSubscription(symbol)
      }
    })
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping message to keep connection alive
        this.ws.send(JSON.stringify({ cmd_id: 22000, seq_id: Date.now() }))
      }
    }, 30000) // Send heartbeat every 30 seconds
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  reconnect() {
    this.reconnectAttempts++
    console.log(`[AllTickWebSocket] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[AllTickWebSocket] Max reconnection attempts reached, switching to HTTP polling')
      this.switchToPolling()
      return
    }
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay * this.reconnectAttempts)
  }

  switchToPolling() {
    this.usePolling = true
    this.isConnected = false
    console.log('[AllTickWebSocket] Switched to HTTP polling mode')
    
    // Start polling for all subscribers
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(() => {
        this.pollForData()
      }, 500) // Poll every 500ms for tick-by-tick updates
    }
    
    // Initial poll
    this.pollForData()
  }

  async pollForData() {
    if (!this.usePolling || this.pollingSubscribers.size === 0) return

    const symbols = Array.from(this.pollingSubscribers.keys())
    
    for (const symbol of symbols) {
      try {
        const CORS_PROXY = "https://corsproxy.io/?"
        const ALLTICK_URL = "https://quote.alltick.io/quote-b-api/kline"
        const TOKEN = "1620b8aba97f46dec78ec599d611b958-c-app"

        // Get current timestamp to fetch the most recent data
        const currentTimestamp = Math.floor(Date.now() / 1000)
        
        const queryPayload = {
          data: {
            code: symbol,
            kline_type: 1, // 1-minute
            kline_timestamp_end: currentTimestamp, // Use current timestamp
            query_kline_num: 2, // Get 2 candles to ensure we have the latest
            adjust_type: 0
          }
        }

        const url = CORS_PROXY + encodeURIComponent(
          `${ALLTICK_URL}?token=${TOKEN}&query=${JSON.stringify(queryPayload)}`
        )

        const response = await fetch(url)
        const data = await response.json()
        const raw = data?.data?.kline_list

        console.log('[AllTickWebSocket] 📊 Polling data for', symbol, ':', raw)

        if (raw && raw.length > 0) {
          // Use the most recent candle (last in array)
          const candle = raw[raw.length - 1]
          const priceData = {
            symbol: symbol,
            price: Number(candle.close_price),
            bid: Number(candle.close_price),
            ask: Number(candle.close_price),
            volume: Number(candle.volume),
            timestamp: Number(candle.timestamp) * 1000,
            high: Number(candle.high_price),
            low: Number(candle.low_price),
            open: Number(candle.open_price),
            close: Number(candle.close_price)
          }

          console.log('[AllTickWebSocket] 📈 Processed price data:', priceData)

          // Notify subscribers
          const symbolSubscribers = this.pollingSubscribers.get(symbol)
          if (symbolSubscribers) {
            symbolSubscribers.forEach(callback => {
              try {
                callback(priceData)
              } catch (error) {
                console.error('[AllTickWebSocket] Error in subscriber callback:', error)
              }
            })
          }
        } else {
          console.log('[AllTickWebSocket] ⚠️ No data received for', symbol)
        }
      } catch (error) {
        console.error('[AllTickWebSocket] Error polling data for', symbol, ':', error)
      }
    }
  }

  disconnect() {
    this.isConnected = false
    this.usePolling = false
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    
    this.subscribers.clear()
    this.pollingSubscribers.clear()
    console.log('[AllTickWebSocket] Disconnected')
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected || this.usePolling,
      mode: this.usePolling ? 'polling' : 'websocket'
    }
  }
}

export default new AllTickWebSocket()
