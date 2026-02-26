import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
import { API_URL } from '../config/api'
import priceStreamService from '../services/priceStream'

const TIMEFRAMES = [
  { label: '1m', value: '1m', seconds: 60 },
  { label: '5m', value: '5m', seconds: 300 },
  { label: '15m', value: '15m', seconds: 900 },
  { label: '30m', value: '30m', seconds: 1800 },
  { label: '1H', value: '1h', seconds: 3600 },
  { label: '4H', value: '4h', seconds: 14400 },
  { label: '1D', value: '1d', seconds: 86400 },
  { label: '1W', value: '1w', seconds: 604800 },
]

const TradingChart = ({ 
  symbol = 'XAUUSD', 
  isDarkMode = true,
  height = 400,
  showToolbar = true,
  onPriceUpdate
}) => {
  const chartContainerRef = useRef(null)
  const chartRef = useRef(null)
  const candleSeriesRef = useRef(null)
  const volumeSeriesRef = useRef(null)
  const currentCandleRef = useRef(null)
  const lastTickTimeRef = useRef(null)
  
  const [timeframe, setTimeframe] = useState('1m')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPrice, setCurrentPrice] = useState(null)
  const [priceChange, setPriceChange] = useState({ value: 0, percent: 0 })

  // Get timeframe interval in seconds
  const getTimeframeSeconds = useCallback(() => {
    const tf = TIMEFRAMES.find(t => t.value === timeframe)
    return tf ? tf.seconds : 60
  }, [timeframe])

  // Fetch historical candles
  const fetchHistoricalData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const now = Math.floor(Date.now() / 1000)
      const tfSeconds = getTimeframeSeconds()
      const from = now - (tfSeconds * 500) // Get 500 candles
      
      const response = await fetch(
        `${API_URL}/prices/history?symbol=${symbol}&resolution=${timeframe}&from=${from}&to=${now}&limit=500`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data')
      }
      
      const data = await response.json()
      
      if (!data.success || !data.candles) {
        throw new Error(data.message || 'No candle data received')
      }
      
      return data.candles
    } catch (err) {
      console.error('[TradingChart] Error fetching history:', err)
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [symbol, timeframe, getTimeframeSeconds])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Chart colors based on theme
    const colors = isDarkMode ? {
      background: '#1a1a2e',
      text: '#d1d5db',
      grid: '#2d2d44',
      borderColor: '#3d3d5c',
      upColor: '#22c55e',
      downColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      volumeUp: 'rgba(34, 197, 94, 0.3)',
      volumeDown: 'rgba(239, 68, 68, 0.3)',
    } : {
      background: '#ffffff',
      text: '#374151',
      grid: '#e5e7eb',
      borderColor: '#d1d5db',
      upColor: '#16a34a',
      downColor: '#dc2626',
      wickUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      volumeUp: 'rgba(22, 163, 74, 0.3)',
      volumeDown: 'rgba(220, 38, 38, 0.3)',
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.grid },
        horzLines: { color: colors.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: colors.borderColor,
          style: 2,
        },
        horzLine: {
          width: 1,
          color: colors.borderColor,
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: timeframe === '1m',
        rightOffset: 5,
        barSpacing: 8,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
      borderUpColor: colors.upColor,
      borderDownColor: colors.downColor,
      wickUpColor: colors.wickUpColor,
      wickDownColor: colors.wickDownColor,
    })

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: colors.volumeUp,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candleSeriesRef.current = candleSeries
    volumeSeriesRef.current = volumeSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chart) {
        chart.remove()
      }
      chartRef.current = null
      candleSeriesRef.current = null
      volumeSeriesRef.current = null
    }
  }, [isDarkMode, height, timeframe])

  // Load historical data when symbol or timeframe changes
  useEffect(() => {
    const loadData = async () => {
      const candles = await fetchHistoricalData()
      
      if (candles.length > 0 && candleSeriesRef.current && volumeSeriesRef.current) {
        // Set candle data
        candleSeriesRef.current.setData(candles)
        
        // Set volume data with colors
        const volumeData = candles.map(c => ({
          time: c.time,
          value: c.volume || 0,
          color: c.close >= c.open 
            ? (isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)')
            : (isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)')
        }))
        volumeSeriesRef.current.setData(volumeData)
        
        // Store last candle for real-time updates
        const lastCandle = candles[candles.length - 1]
        currentCandleRef.current = { ...lastCandle }
        lastTickTimeRef.current = lastCandle.time
        
        // Calculate price change
        if (candles.length >= 2) {
          const firstCandle = candles[0]
          const change = lastCandle.close - firstCandle.open
          const percent = (change / firstCandle.open) * 100
          setPriceChange({ value: change, percent })
        }
        
        setCurrentPrice(lastCandle.close)
        
        // Fit content
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      }
    }
    
    loadData()
  }, [symbol, timeframe, fetchHistoricalData, isDarkMode])

  // Subscribe to real-time price updates
  useEffect(() => {
    const tfSeconds = getTimeframeSeconds()
    
    const handlePriceUpdate = (prices) => {
      const priceData = prices[symbol]
      if (!priceData || !priceData.bid || !candleSeriesRef.current) return
      
      const price = (priceData.bid + (priceData.ask || priceData.bid)) / 2
      const now = Math.floor(Date.now() / 1000)
      const candleTime = Math.floor(now / tfSeconds) * tfSeconds
      
      setCurrentPrice(price)
      
      // Notify parent of price update
      if (onPriceUpdate) {
        onPriceUpdate(priceData)
      }
      
      // Check if we need a new candle
      if (!currentCandleRef.current || candleTime > currentCandleRef.current.time) {
        // New candle period started
        const newCandle = {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 1
        }
        currentCandleRef.current = newCandle
        candleSeriesRef.current.update(newCandle)
        
        // Add volume bar
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: candleTime,
            value: 1,
            color: isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)'
          })
        }
      } else {
        // Update current candle
        const candle = currentCandleRef.current
        candle.high = Math.max(candle.high, price)
        candle.low = Math.min(candle.low, price)
        candle.close = price
        candle.volume = (candle.volume || 0) + 1
        
        candleSeriesRef.current.update(candle)
        
        // Update volume
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: candle.time,
            value: candle.volume,
            color: candle.close >= candle.open
              ? (isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)')
              : (isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)')
          })
        }
      }
    }
    
    // Subscribe to price stream
    const unsubscribe = priceStreamService.subscribe(`chart-${symbol}`, handlePriceUpdate)
    
    return () => unsubscribe()
  }, [symbol, timeframe, getTimeframeSeconds, isDarkMode, onPriceUpdate])

  // Format price for display
  const formatPrice = (price) => {
    if (!price) return '0.00'
    if (symbol.includes('JPY')) return price.toFixed(3)
    if (symbol.includes('XAU')) return price.toFixed(2)
    if (symbol.includes('XAG')) return price.toFixed(3)
    if (symbol.includes('BTC')) return price.toFixed(2)
    if (symbol.includes('ETH')) return price.toFixed(2)
    return price.toFixed(5)
  }

  return (
    <div className="flex flex-col w-full h-full">
      {/* Toolbar */}
      {showToolbar && (
        <div className={`flex items-center justify-between px-3 py-2 border-b ${
          isDarkMode ? 'bg-[#1a1a2e] border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* Symbol & Price */}
          <div className="flex items-center gap-4">
            <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {symbol}
            </span>
            {currentPrice && (
              <div className="flex items-center gap-2">
                <span className={`font-mono text-lg ${
                  priceChange.value >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatPrice(currentPrice)}
                </span>
                <span className={`text-sm ${
                  priceChange.value >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {priceChange.value >= 0 ? '+' : ''}{priceChange.percent.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Timeframe selector */}
          <div className="flex items-center gap-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  timeframe === tf.value
                    ? 'bg-blue-600 text-white'
                    : isDarkMode 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Chart container */}
      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${
            isDarkMode ? 'bg-[#1a1a2e]/80' : 'bg-white/80'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Loading chart...
              </span>
            </div>
          </div>
        )}
        
        {error && (
          <div className={`absolute inset-0 flex items-center justify-center z-10 ${
            isDarkMode ? 'bg-[#1a1a2e]/80' : 'bg-white/80'
          }`}>
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <button
                onClick={() => fetchHistoricalData()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full h-full"
          style={{ minHeight: height }}
        />
      </div>
    </div>
  )
}

export default TradingChart
