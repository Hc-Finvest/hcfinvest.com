import React, { useState, useEffect } from 'react'
import alltickWebSocket from '../services/alltickWebSocket'

const LivePriceDisplay = ({ symbol = 'BTCUSDT', className = '' }) => {
  const [priceData, setPriceData] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    let unsubscribe = null

    // Subscribe to live price updates
    unsubscribe = alltickWebSocket.subscribe(symbol, (data) => {
      setPriceData(data)
      setLastUpdate(new Date())
    })

    // Update connection status
    const updateConnectionStatus = () => {
      const status = alltickWebSocket.getConnectionStatus()
      setConnectionStatus(status.isConnected ? 'connected' : 'disconnected')
    }

    const statusInterval = setInterval(updateConnectionStatus, 1000)
    updateConnectionStatus()

    return () => {
      if (unsubscribe) unsubscribe()
      clearInterval(statusInterval)
    }
  }, [symbol])

  const formatPrice = (price) => {
    if (!price) return '---'
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const formatTime = (date) => {
    if (!date) return '--:--:--'
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getPriceChange = () => {
    if (!priceData || !priceData.open || !priceData.close) return null
    return priceData.close - priceData.open
  }

  const getPriceChangePercent = () => {
    if (!priceData || !priceData.open || !priceData.close) return null
    return ((priceData.close - priceData.open) / priceData.open) * 100
  }

  const priceChange = getPriceChange()
  const priceChangePercent = getPriceChangePercent()

  return (
    <div className={`bg-gray-900 text-white p-4 rounded-lg ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{symbol}</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-gray-400">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Price Display */}
      <div className="space-y-2">
        <div className="text-3xl font-bold">
          {formatPrice(priceData?.price)}
        </div>

        {/* Price Change */}
        {priceChange !== null && (
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              priceChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              {priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)}
            </span>
            <span className={`text-sm ${
              priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'
            }`}>
              ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent?.toFixed(2)}%)
            </span>
          </div>
        )}

        {/* Additional Price Info */}
        {priceData && (
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
            <div>
              <span className="text-gray-500">Bid:</span> {formatPrice(priceData.bid)}
            </div>
            <div>
              <span className="text-gray-500">Ask:</span> {formatPrice(priceData.ask)}
            </div>
            <div>
              <span className="text-gray-500">High:</span> {formatPrice(priceData.high)}
            </div>
            <div>
              <span className="text-gray-500">Low:</span> {formatPrice(priceData.low)}
            </div>
            <div>
              <span className="text-gray-500">Volume:</span> {priceData.volume?.toLocaleString()}
            </div>
            <div>
              <span className="text-gray-500">Open:</span> {formatPrice(priceData.open)}
            </div>
          </div>
        )}

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
            Last update: {formatTime(lastUpdate)}
          </div>
        )}
      </div>
    </div>
  )
}

export default LivePriceDisplay
