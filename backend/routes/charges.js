import express from 'express'
import Charges from '../models/Charges.js'

const router = express.Router()

// GET /api/charges/spreads - Get spreads for all instruments (for display in trading UI)
router.get('/spreads', async (req, res) => {
  try {
    const { userId, accountTypeId } = req.query
    
    // Get all active charges
    const charges = await Charges.find({ isActive: true })
    
    // Build a map of symbol -> spread (respecting hierarchy)
    const spreadMap = {}
    
    //Sanket v2.0 - Complete symbol list matching all instruments in the trading UI
    const allSymbols = [
      // Forex majors & crosses
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD',
      'EURGBP', 'EURJPY', 'GBPJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURNZD',
      'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
      'AUDNZD', 'AUDCAD', 'AUDCHF', 'CADCHF', 'NZDCAD', 'NZDCHF',
      'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
      // Metals & Commodities
      'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'USOIL', 'UKOIL', 'NGAS', 'COPPER',
      // Crypto
      'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD',
      'ADAUSD', 'DOGEUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD',
      'UNIUSD', 'ATOMUSD', 'XLMUSD', 'TRXUSD', 'ETCUSD', 'NEARUSD', 'ALGOUSD',
      // Indices
      'US30', 'US500', 'US100', 'UK100', 'GER40', 'FRA40', 'JP225', 'HK50', 'AUS200', 'ES35'
    ]
    
    const segmentSymbols = {
      'Forex': [
        'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD', 'USDCAD',
        'EURGBP', 'EURJPY', 'GBPJPY', 'EURAUD', 'EURCAD', 'EURCHF', 'EURNZD',
        'AUDJPY', 'CADJPY', 'CHFJPY', 'NZDJPY',
        'AUDNZD', 'AUDCAD', 'AUDCHF', 'CADCHF', 'NZDCAD', 'NZDCHF',
        'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD'
      ],
      'Metals': ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD'],
      'Commodities': ['USOIL', 'UKOIL', 'NGAS', 'COPPER'],
      'Crypto': [
        'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD',
        'ADAUSD', 'DOGEUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD',
        'UNIUSD', 'ATOMUSD', 'XLMUSD', 'TRXUSD', 'ETCUSD', 'NEARUSD', 'ALGOUSD'
      ],
      'Indices': ['US30', 'US500', 'US100', 'UK100', 'GER40', 'FRA40', 'JP225', 'HK50', 'AUS200', 'ES35']
    }
    
    // Priority order: USER > INSTRUMENT > ACCOUNT_TYPE > SEGMENT > GLOBAL
    const priorityOrder = { 'USER': 1, 'INSTRUMENT': 2, 'ACCOUNT_TYPE': 3, 'SEGMENT': 4, 'GLOBAL': 5 }
    
    // Sort logic - lowest priority first so higher priority ones overwrite them
    const sortedCharges = charges.sort((a, b) => priorityOrder[b.level] - priorityOrder[a.level])
    
    const normalizeSymbol = (s = '') => String(s).toUpperCase().replace(/\.I$/i, '')

    for (const charge of sortedCharges) {
      // 1. Specific USER + INSTRUMENT (Highest priority)
      if (charge.level === 'USER' && charge.instrumentSymbol && userId && charge.userId?.toString() === userId) {
        const normSymbol = normalizeSymbol(charge.instrumentSymbol)
        spreadMap[normSymbol] = {
          spread: charge.spreadValue,
          spreadType: charge.spreadType,
          commission: charge.commissionValue,
          commissionType: charge.commissionType,
          swapLong: charge.swapLong,
          swapShort: charge.swapShort,
          level: 'USER'
        }
      }
      // 2. USER level (applies to all symbols for this user)
      else if (charge.level === 'USER' && !charge.instrumentSymbol && userId && charge.userId?.toString() === userId) {
        for (const symbol of allSymbols) {
          const normSymbol = normalizeSymbol(symbol)
          spreadMap[normSymbol] = {
            spread: charge.spreadValue,
            spreadType: charge.spreadType,
            commission: charge.commissionValue,
            commissionType: charge.commissionType,
            swapLong: charge.swapLong,
            swapShort: charge.swapShort,
            level: 'USER'
          }
        }
      }
      // 3. INSTRUMENT level
      else if (charge.level === 'INSTRUMENT' && charge.instrumentSymbol) {
        const normSymbol = normalizeSymbol(charge.instrumentSymbol)
        if (!spreadMap[normSymbol] || priorityOrder['INSTRUMENT'] <= priorityOrder[spreadMap[normSymbol].level]) {
          spreadMap[normSymbol] = {
            spread: charge.spreadValue,
            spreadType: charge.spreadType,
            commission: charge.commissionValue,
            commissionType: charge.commissionType,
            swapLong: charge.swapLong,
            swapShort: charge.swapShort,
            level: 'INSTRUMENT'
          }
        }
      }
      // 4. ACCOUNT_TYPE level
      else if (charge.level === 'ACCOUNT_TYPE' && accountTypeId && charge.accountTypeId?.toString() === accountTypeId) {
        const symbols = charge.segment ? (segmentSymbols[charge.segment] || []) : allSymbols
        for (const symbol of symbols) {
          const normSymbol = normalizeSymbol(symbol)
          if (!spreadMap[normSymbol] || priorityOrder['ACCOUNT_TYPE'] <= priorityOrder[spreadMap[normSymbol].level]) {
            spreadMap[normSymbol] = {
              spread: charge.spreadValue,
              spreadType: charge.spreadType,
              commission: charge.commissionValue,
              commissionType: charge.commissionType,
              swapLong: charge.swapLong,
              swapShort: charge.swapShort,
              level: 'ACCOUNT_TYPE'
            }
          }
        }
      }
      // 5. SEGMENT level
      else if (charge.level === 'SEGMENT' && charge.segment) {
        const symbols = segmentSymbols[charge.segment] || []
        for (const symbol of symbols) {
          const normSymbol = normalizeSymbol(symbol)
          if (!spreadMap[normSymbol] || priorityOrder['SEGMENT'] <= priorityOrder[spreadMap[normSymbol].level]) {
            spreadMap[normSymbol] = {
              spread: charge.spreadValue,
              spreadType: charge.spreadType,
              commission: charge.commissionValue,
              commissionType: charge.commissionType,
              swapLong: charge.swapLong,
              swapShort: charge.swapShort,
              level: 'SEGMENT'
            }
          }
        }
      }
      // 6. GLOBAL level
      else if (charge.level === 'GLOBAL') {
        for (const symbol of allSymbols) {
          const normSymbol = normalizeSymbol(symbol)
          if (!spreadMap[normSymbol] || priorityOrder['GLOBAL'] <= priorityOrder[spreadMap[normSymbol].level]) {
            spreadMap[normSymbol] = {
              spread: charge.spreadValue,
              spreadType: charge.spreadType,
              commission: charge.commissionValue,
              commissionType: charge.commissionType,
              swapLong: charge.swapLong,
              swapShort: charge.swapShort,
              level: 'GLOBAL'
            }
          }
        }
      }
    }
    
    res.json({ success: true, spreads: spreadMap })
  } catch (error) {
    console.error('Error fetching spreads:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/charges - Get all charges with optional filters
router.get('/', async (req, res) => {
  try {
    const { segment, level, instrumentSymbol, userId } = req.query
    
    let query = { isActive: true }
    if (segment) query.segment = segment
    if (level) query.level = level
    if (instrumentSymbol) query.instrumentSymbol = instrumentSymbol
    if (userId) query.userId = userId

    const charges = await Charges.find(query)
      .populate('userId', 'name email mobile')
      .sort({ level: 1, createdAt: -1 })
    res.json({ success: true, charges })
  } catch (error) {
    console.error('Error fetching charges:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET /api/charges/:id - Get single charge
router.get('/:id', async (req, res) => {
  try {
    const charge = await Charges.findById(req.params.id)
    if (!charge) {
      return res.status(404).json({ success: false, message: 'Charge not found' })
    }
    res.json({ success: true, charge })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// POST /api/charges - Create new charge
router.post('/', async (req, res) => {
  try {
    const {
      level,
      userId,
      instrumentSymbol,
      segment,
      accountTypeId,
      spreadType,
      spreadValue,
      commissionType,
      commissionValue,
      commissionOnBuy,
      commissionOnSell,
      commissionOnClose,
      swapLong,
      swapShort,
      swapType
    } = req.body

    if (!level) {
      return res.status(400).json({ success: false, message: 'Level is required' })
    }

    const charge = await Charges.create({
      level,
      userId: userId || null,
      instrumentSymbol: instrumentSymbol || null,
      segment: segment || null,
      accountTypeId: accountTypeId || null,
      spreadType: spreadType || 'FIXED',
      spreadValue: spreadValue || 0,
      commissionType: commissionType || 'PER_LOT',
      commissionValue: commissionValue || 0,
      commissionOnBuy: commissionOnBuy !== false,
      commissionOnSell: commissionOnSell !== false,
      commissionOnClose: commissionOnClose || false,
      swapLong: swapLong || 0,
      swapShort: swapShort || 0,
      swapType: swapType || 'POINTS',
      isActive: true
    })

    res.json({ success: true, message: 'Charge created', charge })
  } catch (error) {
    console.error('Error creating charge:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// PUT /api/charges/:id - Update charge
router.put('/:id', async (req, res) => {
  try {
    const {
      level,
      userId,
      instrumentSymbol,
      segment,
      accountTypeId,
      spreadType,
      spreadValue,
      commissionType,
      commissionValue,
      commissionOnBuy,
      commissionOnSell,
      commissionOnClose,
      swapLong,
      swapShort,
      swapType,
      isActive
    } = req.body

    const charge = await Charges.findById(req.params.id)
    if (!charge) {
      return res.status(404).json({ success: false, message: 'Charge not found' })
    }

    if (level !== undefined) charge.level = level
    if (userId !== undefined) charge.userId = userId || null
    if (instrumentSymbol !== undefined) charge.instrumentSymbol = instrumentSymbol
    if (segment !== undefined) charge.segment = segment
    if (accountTypeId !== undefined) charge.accountTypeId = accountTypeId || null
    if (spreadType !== undefined) charge.spreadType = spreadType
    if (spreadValue !== undefined) charge.spreadValue = spreadValue
    if (commissionType !== undefined) charge.commissionType = commissionType
    if (commissionValue !== undefined) charge.commissionValue = commissionValue
    if (commissionOnBuy !== undefined) charge.commissionOnBuy = commissionOnBuy
    if (commissionOnSell !== undefined) charge.commissionOnSell = commissionOnSell
    if (commissionOnClose !== undefined) charge.commissionOnClose = commissionOnClose
    if (swapLong !== undefined) charge.swapLong = swapLong
    if (swapShort !== undefined) charge.swapShort = swapShort
    if (swapType !== undefined) charge.swapType = swapType
    if (isActive !== undefined) charge.isActive = isActive

    await charge.save()

    res.json({ success: true, message: 'Charge updated', charge })
  } catch (error) {
    console.error('Error updating charge:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// DELETE /api/charges/:id - Delete charge
router.delete('/:id', async (req, res) => {
  try {
    const charge = await Charges.findById(req.params.id)
    if (!charge) {
      return res.status(404).json({ success: false, message: 'Charge not found' })
    }

    await Charges.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: 'Charge deleted' })
  } catch (error) {
    console.error('Error deleting charge:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

export default router
