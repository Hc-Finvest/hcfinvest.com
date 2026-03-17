// Simple WebSocket test - run this in browser console or as a script
import alltickWebSocket from './services/alltickWebSocket.js'

console.log('🚀 Starting AllTick WebSocket Test...')

// Subscribe to BTCUSDT live data
const unsubscribe = alltickWebSocket.subscribe('BTCUSDT', (data) => {
  console.log('📈 LIVE DATA RECEIVED:')
  console.log('   Symbol:', data.symbol)
  console.log('   Price: $' + data.price?.toLocaleString())
  console.log('   Bid: $' + data.bid?.toLocaleString())
  console.log('   Ask: $' + data.ask?.toLocaleString())
  console.log('   High: $' + data.high?.toLocaleString())
  console.log('   Low: $' + data.low?.toLocaleString())
  console.log('   Volume:', data.volume?.toLocaleString())
  console.log('   Timestamp:', new Date(data.timestamp).toLocaleString())
  console.log('---')
})

// Monitor connection status
setInterval(() => {
  const status = alltickWebSocket.getConnectionStatus()
  console.log('🔄 Connection Status:', status.mode, 'Connected:', status.isConnected)
}, 2000)

// Cleanup after 30 seconds
setTimeout(() => {
  console.log('🛑 Cleaning up test...')
  unsubscribe()
}, 30000)

console.log('✅ WebSocket test started. Check for live data above...')
