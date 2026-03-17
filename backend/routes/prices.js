import express from 'express'
import metaApiService from '../services/metaApiService.js'
import storageService from '../services/storageService.js' // //sanket - Import storage service

const router = express.Router()

// GET /api/prices/status - Get market data service status
router.get('/status', async (req, res) => {
  try {
    const status = metaApiService.getStatus()
    res.json({ success: true, status })
  } catch (error) {
    console.error('Error fetching status:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/sync - Force immediate sync of all historical data
router.post('/sync', async (req, res) => {
  try {
    console.log('[PricesAPI] 🔄 Manual sync triggered');
    // Trigger sync in background (don't wait)
    storageService.syncAllSymbols().catch(err => {
      console.error('[PricesAPI] Sync error:', err.message);
    });
    
    res.json({ 
      success: true, 
      message: 'Sync triggered. Check backend logs for progress.',
      info: 'Syncing all symbols now...'
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/prices/backfill - Backfill missing historical data for a symbol
router.post('/backfill', async (req, res) => {
  try {
    const { symbol, days = 7 } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required' });
    }
    
    if (!metaApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ success: false, message: `Symbol ${symbol} is not supported` });
    }
    
    console.log(`[PricesAPI] 🔙 Backfill triggered for ${symbol} (${days} days)`);
    
    // Run backfill in background
    const timeframes = ['1m', '5m', '15m', '1h', '1d'];
    
    // Queue backfills for all timeframes
    Promise.all(timeframes.map(tf => 
      storageService.backfill(symbol, tf, days).catch(err => {
        console.error(`[PricesAPI] Backfill error for ${symbol} ${tf}:`, err.message);
      })
    )).then(() => {
      console.log(`[PricesAPI] ✅ Backfill completed for ${symbol}`);
    });
    
    res.json({ 
      success: true, 
      message: `Backfill started for ${symbol} (${days} days, all timeframes). Check backend logs for progress.`
    });
  } catch (error) {
    console.error('Error triggering backfill:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/prices/symbols - Get all supported symbols
router.get('/symbols', async (req, res) => {
  try {
    const symbols = metaApiService.getSupportedSymbols()
    res.json({ success: true, symbols })
  } catch (error) {
    console.error('Error fetching symbols:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/categories - Get all categories with symbols and prices
router.get('/categories', async (req, res) => {
  try {
    const categories = metaApiService.getPricesByCategory()
    res.json({ 
      success: true, 
      categories,
      provider: 'metaapi'
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/history - Get historical OHLC candles
// NOTE: This must be defined BEFORE /:symbol route to avoid matching 'history' as a symbol
router.get('/history', async (req, res) => {
  try {
    const { symbol, resolution, from, to, limit } = req.query
    
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'symbol is required' })
    }
    
    // Check if symbol is supported
    if (!metaApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ 
        success: false, 
        message: `Symbol ${symbol} is not supported` 
      })
    }
    
    // Map resolution to timeframe (support various formats)
    const resolutionMap = {
      '1': '1m', '1m': '1m', '1min': '1m',
      '5': '5m', '5m': '5m', '5min': '5m',
      '15': '15m', '15m': '15m', '15min': '15m',
      '30': '30m', '30m': '30m', '30min': '30m',
      '60': '1h', '1h': '1h', '1H': '1h', '1hour': '1h',
      '240': '4h', '4h': '4h', '4H': '4h',
      'D': '1d', '1d': '1d', '1D': '1d', 'day': '1d',
      'W': '1w', '1w': '1w', '1W': '1w', 'week': '1w',
      'M': '1M', '1M': '1M', 'month': '1M'
    }
    const timeframe = resolutionMap[resolution] || '1m'
    
    // Parse timestamps (expect seconds)
    const startTime = from ? parseInt(from) : undefined
    const endTime = to ? parseInt(to) : undefined
    const candleLimit = limit ? parseInt(limit) : 500
    
    // //sanket - Fetch candles from StorageService (local cache with API fallback)
    // Ensure minimum 300 candles for proper chart display
    const minLimit = 300;
    const requestLimit = candleLimit || minLimit;
    const finalLimit = Math.max(requestLimit, minLimit);
    
    const candles = await storageService.getCandles(
      symbol, 
      timeframe, 
      startTime, 
      endTime, 
      finalLimit
    )
    
    console.log(`[PricesAPI] History: ${symbol} ${timeframe} returned ${candles.length} candles (requested: ${finalLimit})`);
    
    res.json({
      success: true,
      symbol,
      timeframe,
      candles,
      count: candles.length,
      provider: 'metaapi'
    })
  } catch (error) {
    console.error('Error fetching historical candles:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/:symbol - Get single symbol price
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params
    
    // Check if symbol is supported
    if (!metaApiService.isSymbolSupported(symbol)) {
      return res.status(404).json({ 
        success: false, 
        message: `Symbol ${symbol} is not supported` 
      })
    }
    
    // Get price from MetaAPI market data service
    const price = metaApiService.getPrice(symbol)
    const symbolInfo = metaApiService.getSymbolInfo(symbol)
    
    if (price && price.bid) {
      res.json({ 
        success: true, 
        price: {
          bid: price.bid,
          ask: price.ask,
          spread: price.spread,
          time: price.time,
          ...symbolInfo
        },
        provider: 'metaapi'
      })
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Price not available yet. Market data is streaming.' 
      })
    }
  } catch (error) {
    console.error('Error fetching price:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/prices/batch - Get multiple symbol prices
router.post('/batch', async (req, res) => {
  try {
    const { symbols } = req.body
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({ success: false, message: 'symbols array required' })
    }
    
    const prices = {}
    
    // Get all prices from MetaAPI market data service
    for (const symbol of symbols) {
      if (metaApiService.isSymbolSupported(symbol)) {
        const price = metaApiService.getPrice(symbol)
        const symbolInfo = metaApiService.getSymbolInfo(symbol)
        if (price && price.bid) {
          prices[symbol] = {
            bid: price.bid,
            ask: price.ask,
            spread: price.spread,
            time: price.time,
            ...symbolInfo
          }
        }
      }
    }
    
    res.json({ 
      success: true, 
      prices,
      provider: 'metaapi',
      count: Object.keys(prices).length
    })
  } catch (error) {
    console.error('Error fetching batch prices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/prices/all - Get all current prices
router.get('/', async (req, res) => {
  try {
    const prices = metaApiService.getAllPrices()
    const categories = metaApiService.getPricesByCategory()
    res.json({ 
      success: true, 
      prices,
      categories,
      provider: 'metaapi',
      count: Object.keys(prices).length
    })
  } catch (error) {
    console.error('Error fetching all prices:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
