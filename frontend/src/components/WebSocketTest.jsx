import React, { useEffect, useState } from 'react'
import alltickWebSocket from '../services/alltickWebSocket'

const WebSocketTest = () => {
  const [logs, setLogs] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[WebSocketTest] ${message}`)
  }

  useEffect(() => {
    addLog('Starting WebSocket test...')

    // Subscribe to BTCUSDT live data
    const unsubscribe = alltickWebSocket.subscribe('BTCUSDT', (data) => {
      addLog(`📈 LIVE DATA RECEIVED:`)
      addLog(`   Symbol: ${data.symbol}`)
      addLog(`   Price: $${data.price?.toLocaleString()}`)
      addLog(`   Bid: $${data.bid?.toLocaleString()}`)
      addLog(`   Ask: $${data.ask?.toLocaleString()}`)
      addLog(`   High: $${data.high?.toLocaleString()}`)
      addLog(`   Low: $${data.low?.toLocaleString()}`)
      addLog(`   Volume: ${data.volume?.toLocaleString()}`)
      addLog(`   Timestamp: ${new Date(data.timestamp).toLocaleString()}`)
      addLog('---')
    })

    // Monitor connection status
    const statusInterval = setInterval(() => {
      const status = alltickWebSocket.getConnectionStatus()
      setConnectionStatus(status.mode)
      
      if (status.mode !== connectionStatus) {
        addLog(`🔄 Connection mode changed to: ${status.mode}`)
      }
    }, 1000)

    // Cleanup
    return () => {
      addLog('Cleaning up WebSocket test...')
      if (unsubscribe) unsubscribe()
      clearInterval(statusInterval)
    }
  }, [])

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">AllTick WebSocket Test</h2>
      
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'WebSocket' ? 'bg-green-500' : 
            connectionStatus === 'HTTP Polling' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="font-medium">Status: {connectionStatus}</span>
        </div>
      </div>

      <div className="bg-black rounded p-4 h-96 overflow-y-auto font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500">Waiting for data...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={log.includes('LIVE DATA') ? 'text-green-400' : 'text-gray-300'}>
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>• WebSocket attempts to connect to AllTick real-time data</p>
        <p>• Falls back to HTTP polling if WebSocket fails</p>
        <p>• Live data appears in green when received</p>
        <p>• Check browser console for detailed logs</p>
      </div>
    </div>
  )
}

export default WebSocketTest
