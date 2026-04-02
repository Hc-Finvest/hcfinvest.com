import Trade from '../models/Trade.js'
import TradingAccount from '../models/TradingAccount.js'
import Charges from '../models/Charges.js'
import TradeSettings from '../models/TradeSettings.js'
import AdminLog from '../models/AdminLog.js'
import ibEngine from './ibEngineNew.js'
import MasterTrader from '../models/MasterTrader.js'
import { isMarketOpen, isPriceFresh } from '../utils/marketHours.js'
import mongoose from 'mongoose'

class TradeEngine {
  constructor() {
    this.CONTRACT_SIZE = 100000
  }

  normalizeSymbol(symbol = '') {
    // Normalize broker-specific aliases (e.g. XAUUSD.i -> XAUUSD)
    return String(symbol).toUpperCase().replace(/\.I$/i, '')
  }

  // Scales the admin spread input into actual price math based on asset class
  getScaledSpreadValue(symbol, spreadValue) {
    if (!spreadValue || isNaN(spreadValue)) return 0;
    
    // Normalize symbol to strip suffixes like .i
    const normalizedSymbol = this.normalizeSymbol(symbol);

    if (normalizedSymbol.includes('JPY')) {
      return spreadValue * 0.01; // JPY pairs: 1 pip = 0.01
    } else if (['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'USOIL', 'UKOIL', 'NGAS', 'COPPER'].includes(normalizedSymbol)) {
      return spreadValue * 0.01; // Metals & Commodities: cents to dollars
    } else if (['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD', 'UNIUSD', 'ATOMUSD', 'XLMUSD', 'TRXUSD', 'ETCUSD', 'NEARUSD', 'ALGOUSD'].includes(normalizedSymbol)) {
      return spreadValue; // Crypto: USD value as-is
    } else if (['US30', 'US500', 'US100', 'UK100', 'GER40', 'FRA40', 'JP225', 'HK50', 'AUS200', 'ES35'].includes(normalizedSymbol)) {
      return spreadValue; // Indices: points as-is
    } else {
      return spreadValue * 0.0001; // Standard Forex: 1 pip = 0.0001
    }
  }

  // Get contract size based on symbol type
  getContractSize(symbol) {
    const normalizedSymbol = this.normalizeSymbol(symbol)
    // Metals - 100 oz for gold, 5000 oz for silver
    if (normalizedSymbol === 'XAUUSD') return 100
    if (normalizedSymbol === 'XAGUSD') return 5000
    // Crypto - 1 unit
    if (['BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD', 'BNBUSD', 'SOLUSD', 'ADAUSD', 'DOGEUSD', 'DOTUSD', 'MATICUSD', 'AVAXUSD', 'LINKUSD'].includes(normalizedSymbol)) return 1
    // Forex - standard 100,000
    return 100000
  }

  // Calculate execution price with Retail Markup (if any)
  calculateExecutionPrice(symbol, side, bid, ask, spreadValue, spreadType) {
    // ELITE: Start with raw market prices (Transparent Pricing)
    let executionPrice = (side === 'BUY') ? ask : bid;
    
    // Apply administrative markup if configured
    if (spreadValue > 0) {
      let markup = this.getScaledSpreadValue(symbol, spreadValue);
      if (spreadType === 'PERCENTAGE') {
        markup = (ask - bid) * (spreadValue / 100);
      }
      executionPrice = (side === 'BUY') ? (executionPrice + markup) : (executionPrice - markup);
    }
    
    return executionPrice;
  }

  // Simulated Market Execution Delay (LP Matching / Network Latency)
  async simulateExecutionDelay() {
    const delayMs = Math.floor(Math.random() * 50) + 30; // 30ms - 80ms realistic latency
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Calculate margin required for a trade
  // Formula: (Lots * Contract Size * Price) / Leverage
  // Example: 0.01 lot XAUUSD at $2650 with 1:100 leverage
  // = (0.01 * 100 * 2650) / 100 = $26.50 margin required
  calculateMargin(quantity, openPrice, leverage, contractSize = this.CONTRACT_SIZE) {
    const leverageNum = parseInt(leverage.toString().replace('1:', '')) || 100
    const margin = (quantity * contractSize * openPrice) / leverageNum
    return Math.round(margin * 100) / 100 // Round to 2 decimal places
  }

  // Calculate commission based on type
  calculateCommission(quantity, openPrice, commissionType, commissionValue, contractSize = this.CONTRACT_SIZE) {
    switch (commissionType) {
      case 'PER_LOT':
        return quantity * commissionValue
      case 'PER_TRADE':
        return commissionValue
      case 'PERCENTAGE':
        const tradeValue = quantity * contractSize * openPrice
        return tradeValue * (commissionValue / 100)
      default:
        return 0
    }
  }

  // Calculate PnL for a trade
  calculatePnl(side, openPrice, currentPrice, quantity, contractSize = this.CONTRACT_SIZE) {
    // Uses raw prices for full precision calculation
    if (side === 'BUY') {
      return (currentPrice - openPrice) * quantity * contractSize
    } else {
      return (openPrice - currentPrice) * quantity * contractSize
    }
  }

  // Calculate floating PnL including charges
  calculateFloatingPnl(trade, currentBid, currentAsk, rawBid = null, rawAsk = null) {
    // Prioritize raw values for institutional-grade accuracy
    const actualBid = rawBid !== null ? rawBid : currentBid
    const actualAsk = rawAsk !== null ? rawAsk : currentAsk
    
    const currentPrice = trade.side === 'BUY' ? actualBid : actualAsk
    const rawPnl = this.calculatePnl(trade.side, trade.openPrice, currentPrice, trade.quantity, trade.contractSize)
    return rawPnl - trade.commission - trade.swap
  }

  // Get account financial summary (real-time calculated values)
  async getAccountSummary(tradingAccountId, openTrades, currentPrices) {
    const account = await TradingAccount.findById(tradingAccountId)
    if (!account) throw new Error('Trading account not found')

    let usedMargin = 0
    let floatingPnl = 0

    for (const trade of openTrades) {
      usedMargin += trade.marginUsed
      const targetSym = this.normalizeSymbol(trade.symbol)
      const prices = currentPrices[targetSym] || currentPrices[trade.symbol]
      if (prices) {
        floatingPnl += this.calculateFloatingPnl(trade, prices.bid, prices.ask, prices.rawBid, prices.rawAsk)
      }
    }

    const equity = account.balance + account.credit + floatingPnl
    const freeMargin = equity - usedMargin

    return {
      balance: account.balance,
      credit: account.credit,
      equity,
      usedMargin,
      freeMargin,
      floatingPnl,
      marginLevel: usedMargin > 0 ? (equity / usedMargin) * 100 : 0
    }
  }

  // Validate if trade can be opened
  async validateTradeOpen(tradingAccountId, symbol, side, quantity, openPrice, leverage, contractSize = this.CONTRACT_SIZE) {
    const account = await TradingAccount.findById(tradingAccountId).populate('accountTypeId')
    if (!account) {
      return { valid: false, error: 'Trading account not found' }
    }

    console.log(`Account validation: ID=${tradingAccountId}, Balance=${account.balance}, Credit=${account.credit}, Status=${account.status}`)

    if (account.status !== 'Active') {
      return { valid: false, error: `Account is ${account.status}` }
    }

    if (account.killSwitchUntil && account.killSwitchUntil > new Date()) {
      return { valid: false, error: `Trading blocked! Kill Switch active until ${account.killSwitchUntil.toLocaleString()}` }
    }

    // CRITICAL: Check if account has any balance at all
    if (account.balance <= 0 && (account.credit || 0) <= 0) {
      return { valid: false, error: `Insufficient funds. Balance: $${account.balance}, Credit: $${account.credit || 0}. Please deposit to trade.` }
    }

    // Get open trades for margin calculation
    const openTrades = await Trade.find({ tradingAccountId, status: 'OPEN' })
    
    // Get trade settings
    const settings = await TradeSettings.getSettings(account.accountTypeId?._id)

    // Check max open trades
    if (openTrades.length >= settings.maxOpenTradesPerUser) {
      return { valid: false, error: 'Maximum open trades limit reached' }
    }

    // Check max lots
    const totalLots = openTrades.reduce((sum, t) => sum + t.quantity, 0) + quantity
    if (totalLots > settings.maxOpenLotsPerUser) {
      return { valid: false, error: 'Maximum lots limit exceeded' }
    }

    // Calculate margin required for new trade
    const marginRequired = this.calculateMargin(quantity, openPrice, leverage, contractSize)

    // Calculate current used margin from existing trades
    const usedMargin = openTrades.reduce((sum, t) => sum + (t.marginUsed || 0), 0)
    
    // Equity = Balance + Credit (floating PnL is calculated in real-time, not stored)
    // For validation, we use balance + credit as the base
    const equity = account.balance + (account.credit || 0)
    
    // Free margin = Equity - Used Margin
    const freeMargin = equity - usedMargin

    // CRITICAL: Ensure margin required doesn't exceed free margin
    if (marginRequired > freeMargin) {
      return { 
        valid: false, 
        error: `Insufficient margin. Required: $${marginRequired.toFixed(2)}, Available: $${freeMargin.toFixed(2)}` 
      }
    }

    // Additional check: Ensure user has at least the margin amount in their account
    if (marginRequired > equity) {
      return { 
        valid: false, 
        error: `Insufficient equity. Required margin: $${marginRequired.toFixed(2)}, Your equity: $${equity.toFixed(2)}` 
      }
    }

    return { valid: true, marginRequired, freeMargin, usedMargin, equity }
  }

  // Market open check is now handled via unified utility
  isMarketOpen(symbol) {
    return isMarketOpen(symbol);
  }

  // Open a new trade
  async openTrade(userId, tradingAccountId, rawSymbol, segment, side, orderType, quantity, bid, ask, sl = null, tp = null, userLeverage = null, pendingPriceInput = null, rawBid = null, rawAsk = null) {
    const symbol = this.normalizeSymbol(rawSymbol);
    const account = await TradingAccount.findById(tradingAccountId).populate('accountTypeId')
    if (!account) throw new Error('Trading account not found')

    // Check if market is open using unified utility
    if (!isMarketOpen(symbol)) {
      throw new Error(`Market is currently closed for ${symbol}. Please try again when market opens.`)
    }

    // Validate bid/ask prices are valid AND fresh
    if (!bid || !ask || bid <= 0 || ask <= 0) {
      throw new Error('Market is closed or no price data available. Please try again later.')
    }

    // Get charges for this trade
    const charges = await Charges.getChargesForTrade(userId, symbol, segment, account.accountTypeId?._id)
    console.log(`Charges retrieved: spread=${charges.spreadValue}, commission=${charges.commissionValue}, commissionType=${charges.commissionType}`)

    // Calculate execution price with spread
    // For pending orders, use the user-specified pending price
    // For market orders, calculate based on bid/ask with spread
    let openPrice
    if (orderType !== 'MARKET' && pendingPriceInput) {
      openPrice = pendingPriceInput
    } else {
      // Use raw values for the opening price if possible
      const bidToUse = rawBid !== null ? rawBid : bid
      const askToUse = rawAsk !== null ? rawAsk : ask
      openPrice = this.calculateExecutionPrice(symbol, side, bidToUse, askToUse, charges.spreadValue, charges.spreadType)
    }

    // Get contract size based on symbol
    const contractSize = this.getContractSize(symbol)

    // Use user-selected leverage if provided, otherwise use account's leverage
    // User can select any leverage up to account's max leverage
    const accountMaxLeverage = parseInt(account.leverage.toString().replace('1:', '')) || 100
    let selectedLeverage = accountMaxLeverage
    
    if (userLeverage) {
      const userLeverageNum = parseInt(userLeverage.toString().replace('1:', '')) || accountMaxLeverage
      // User can only use leverage up to account's max
      selectedLeverage = Math.min(userLeverageNum, accountMaxLeverage)
    }
    
    const leverage = `1:${selectedLeverage}`
    const marginRequired = this.calculateMargin(quantity, openPrice, leverage, contractSize)
    
    // Log for debugging
    // Simulate LP Matching Delay
    await this.simulateExecutionDelay();

    // Validate trade - pass the correct parameters
    const validation = await this.validateTradeOpen(tradingAccountId, symbol, side, quantity, openPrice, leverage, contractSize)
    if (!validation.valid) {
      throw new Error(validation.error)
    }
    

    // Calculate commission based on side and commission settings
    let commission = 0
    const shouldChargeCommission = (side === 'BUY' && charges.commissionOnBuy !== false) || 
                                   (side === 'SELL' && charges.commissionOnSell !== false)
    
    if (shouldChargeCommission && charges.commissionValue > 0) {
      commission = this.calculateCommission(quantity, openPrice, charges.commissionType, charges.commissionValue, contractSize)
    }

    // Generate trade ID
    const tradeId = await Trade.generateTradeId()

    // Create trade
    const trade = await Trade.create({
      userId,
      tradingAccountId,
      tradeId,
      symbol,
      segment,
      side,
      orderType,
      quantity,
      openPrice,
      stopLoss: sl,
      sl: sl,
      takeProfit: tp,
      tp: tp,
      marginUsed: marginRequired,
      leverage: parseInt(leverage.toString().replace('1:', '')) || 100,
      contractSize: contractSize,
      spread: charges.spreadValue,
      commission,
      swap: 0,
      floatingPnl: 0,
      status: orderType === 'MARKET' ? 'OPEN' : 'PENDING',
      pendingPrice: orderType !== 'MARKET' ? (pendingPriceInput || openPrice) : null
    })

    // Deduct commission from trading account balance when trade opens
    if (orderType === 'MARKET' && commission > 0) {
      account.balance -= commission
      if (account.balance < 0) account.balance = 0
      await account.save()
    }

    return trade
  }

  // Close a trade (supports partial close)
  async closeTrade(tradeId, currentBid, currentAsk, closedBy = 'USER', adminId = null, rawBid = null, rawAsk = null, quantityToClose = null) {
    const trade = await Trade.findById(tradeId).populate({ path: 'tradingAccountId', populate: { path: 'accountTypeId' } })
    if (!trade) throw new Error('Trade not found')
    if (trade.status !== 'OPEN') {
      // Trade already closed - return existing trade data instead of error (handles double-click/race conditions)
      console.log(`[Trade] Trade ${tradeId} already closed (status: ${trade.status}), returning existing data`)
      return { trade, realizedPnl: trade.realizedPnl || 0, alreadyClosed: true }
    }

    // Simulate LP Matching Delay for close order
    await this.simulateExecutionDelay();

    const bidToUse = rawBid !== null ? rawBid : currentBid
    const askToUse = rawAsk !== null ? rawAsk : currentAsk
    const closePrice = trade.side === 'BUY' ? bidToUse : askToUse
    
    // Determine the actual quantity to close
    const totalQuantity = trade.quantity;
    const actualQuantityToClose = (quantityToClose && quantityToClose > 0 && quantityToClose < totalQuantity) 
      ? parseFloat(quantityToClose) 
      : totalQuantity;
    
    const isPartialClose = actualQuantityToClose < totalQuantity;

    // Get charges to check if commission on close is enabled
    const charges = await Charges.getChargesForTrade(
      trade.userId, 
      trade.symbol, 
      trade.segment, 
      trade.tradingAccountId?.accountTypeId?._id
    )
    
    // Calculate commission on close if enabled (proportioned by quantity)
    let closeCommission = 0
    if (charges.commissionOnClose && charges.commissionValue > 0) {
      closeCommission = this.calculateCommission(actualQuantityToClose, closePrice, charges.commissionType, charges.commissionValue, trade.contractSize)
      console.log(`Commission on close (Partial=${isPartialClose}): $${closeCommission}`)
    }
    
    // Calculate final PnL for the closed portion
    const rawPnl = this.calculatePnl(trade.side, trade.openPrice, closePrice, actualQuantityToClose, trade.contractSize)
    const realizedPnl = rawPnl - (isPartialClose ? (trade.swap * (actualQuantityToClose / totalQuantity)) : trade.swap) - closeCommission

    let finalTradeForResponse = trade;

    if (isPartialClose) {
      // PARTIAL CLOSE LOGIC:
      // 1. Create a "History" trade entry for the closed portion
      // We use the same static generateTradeId() but we might need a unique ID here
      const closedPartTradeId = await Trade.generateTradeId();
      const closedPartTrade = await Trade.create({
        ...trade.toObject(),
        _id: new mongoose.Types.ObjectId(),
        tradeId: closedPartTradeId,
        quantity: actualQuantityToClose,
        status: 'CLOSED',
        closePrice: closePrice,
        realizedPnl: realizedPnl,
        closedBy: closedBy,
        closedAt: new Date(),
        commission: (trade.commission * (actualQuantityToClose / totalQuantity)) + closeCommission,
        swap: (trade.swap * (actualQuantityToClose / totalQuantity)),
        marginUsed: 0 // No margin used for closed trades
      });

      // 2. Update the original trade (KEEP OPEN with reduced volume)
      const oldQuantity = trade.quantity;
      trade.quantity -= actualQuantityToClose;
      // Proportionally reduce commission and swap stored on the open trade
      trade.commission -= (trade.commission * (actualQuantityToClose / oldQuantity));
      trade.swap -= (trade.swap * (actualQuantityToClose / oldQuantity));
      // Update margin used for smaller quantity
      trade.marginUsed = this.calculateMargin(trade.quantity, trade.openPrice, `1:${trade.leverage}`, trade.contractSize);
      
      await trade.save();
      finalTradeForResponse = closedPartTrade; // Return the closed portion for history tracking
      console.log(`[Trade] Partial close successful: ${actualQuantityToClose} closed, ${trade.quantity} remaining.`);
    } else {
      // FULL CLOSE LOGIC (Original):
      trade.closePrice = closePrice
      trade.realizedPnl = realizedPnl
      trade.status = 'CLOSED'
      trade.closedBy = closedBy
      trade.closedAt = new Date()

      if (adminId) {
        trade.adminModified = true
        trade.adminModifiedBy = adminId
        trade.adminModifiedAt = new Date()
      }

      await trade.save()
    }

    // Update account balance with proper credit handling
    const account = await TradingAccount.findById(trade.tradingAccountId)
    
    if (realizedPnl >= 0) {
      // Profit: Add to balance only (credit stays the same)
      account.balance += realizedPnl
    } else {
      // Loss: First deduct from balance, then from credit if balance insufficient
      const loss = Math.abs(realizedPnl)
      
      if (account.balance >= loss) {
        // Balance can cover the loss
        account.balance -= loss
      } else {
        // Balance cannot cover the loss - use credit for remaining
        const remainingLoss = loss - account.balance
        account.balance = 0
        
        // Deduct remaining loss from credit
        if (account.credit > 0) {
          account.credit = Math.max(0, (account.credit || 0) - remainingLoss)
        }
      }
    }
    
    await account.save()

    // Log admin action if applicable
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: isPartialClose ? 'TRADE_PARTIAL_CLOSE' : (closedBy === 'ADMIN' ? 'TRADE_CLOSE' : 'TRADE_FORCE_CLOSE'),
        targetType: 'TRADE',
        targetId: trade._id,
        previousValue: { status: 'OPEN', quantity: isPartialClose ? totalQuantity : trade.quantity },
        newValue: { 
          status: isPartialClose ? 'OPEN' : 'CLOSED', 
          quantity: isPartialClose ? trade.quantity : actualQuantityToClose,
          realizedPnl 
        }
      })
    }

    // Process IB commission for this trade (proportional for partial close)
    try {
      // Pass the quantity closed to the IB engine if it supports it
      await ibEngine.processTradeCommission(finalTradeForResponse)
    } catch (ibError) {
      console.error('Error processing IB commission:', ibError)
    }

    // Close follower trades if this is a master trade
    // This ensures SL/TP triggered closes also propagate to followers
    try {
      // Get the tradingAccountId - handle both populated and non-populated cases
      const tradingAccountId = trade.tradingAccountId?._id || trade.tradingAccountId
      
      const master = await MasterTrader.findOne({ 
        tradingAccountId: tradingAccountId, 
        status: 'ACTIVE' 
      })
      
      if (master) {
        // Update master stats
        master.stats.totalTrades = (master.stats.totalTrades || 0) + 1
        master.stats.totalProfitGenerated = (master.stats.totalProfitGenerated || 0) + realizedPnl
        if (realizedPnl > 0) {
          master.stats.profitableTrades = (master.stats.profitableTrades || 0) + 1
        }
        if (master.stats.totalTrades > 0) {
          master.stats.winRate = Math.round((master.stats.profitableTrades / master.stats.totalTrades) * 100)
        }
        await master.save()
        
        // Close follower trades (proportionally if partial)
        const copyTradingEngine = (await import('./copyTradingEngine.js')).default
        const copyResults = await copyTradingEngine.closeFollowerTrades(trade._id, closePrice, actualQuantityToClose)
        console.log(`[CopyTrade] Closed ${copyResults.filter(r => r.status === 'SUCCESS').length} follower trades (Partial=${isPartialClose})`)
      }
    } catch (copyError) {
      console.error('[CopyTrade] Error closing follower trades:', copyError)
    }

    return { trade: finalTradeForResponse, realizedPnl, originalTradeRemaining: isPartialClose ? trade : null }
  }

  // Modify trade SL/TP
  async modifyTrade(tradeId, sl = null, tp = null, adminId = null) {
    const trade = await Trade.findById(tradeId)
    if (!trade) throw new Error('Trade not found')
    if (trade.status !== 'OPEN') throw new Error('Trade is not open')

    const previousValue = { stopLoss: trade.stopLoss, takeProfit: trade.takeProfit }

    // Update both stopLoss/takeProfit and sl/tp fields for compatibility
    // Handle NaN values - treat as null
    if (sl !== null && !isNaN(sl)) {
      trade.stopLoss = sl
      trade.sl = sl
    }
    if (tp !== null && !isNaN(tp)) {
      trade.takeProfit = tp
      trade.tp = tp
    }

    //Sanket v2.0 - Stamp modification time for 5s grace period: prevents immediate SL trigger when user
    // moves stop above current price (e.g. trailing stop on BUY). checkSlTpForAllTrades skips this trade
    // for 5 seconds after modification so the price has time to actually cross the new SL level.
    if ((sl !== null && !isNaN(sl)) || (tp !== null && !isNaN(tp))) {
      trade.slLastModifiedAt = new Date();
    }

    if (adminId) {
      trade.adminModified = true
      trade.adminModifiedBy = adminId
      trade.adminModifiedAt = new Date()
    }

    await trade.save()

    // Log admin action
    if (adminId) {
      await AdminLog.create({
        adminId,
        action: sl !== null ? 'TRADE_MODIFY_SL' : 'TRADE_MODIFY_TP',
        targetType: 'TRADE',
        targetId: trade._id,
        previousValue,
        newValue: { stopLoss: trade.stopLoss, takeProfit: trade.takeProfit }
      })
    }

    return trade
  }

  // Check and execute stop-out
  async checkStopOut(tradingAccountId, currentPrices) {
    const account = await TradingAccount.findById(tradingAccountId).populate('accountTypeId')
    if (!account) return null

    const openTrades = await Trade.find({ tradingAccountId, status: 'OPEN' })
    if (openTrades.length === 0) return null

    const settings = await TradeSettings.getSettings(account.accountTypeId?._id)
    const summary = await this.getAccountSummary(tradingAccountId, openTrades, currentPrices)

    // CRITICAL: Check if equity is negative or zero - immediate stop out
    // Also check if margin level is below stop-out level (default 20%)
    const stopOutLevel = settings.stopOutLevel || 20
    const shouldStopOut = 
      summary.equity <= 0 || 
      summary.freeMargin < 0 ||
      (summary.marginLevel > 0 && summary.marginLevel <= stopOutLevel)

    if (shouldStopOut) {
      console.log(`STOP OUT TRIGGERED for account ${tradingAccountId}: Equity=${summary.equity}, FreeMargin=${summary.freeMargin}, MarginLevel=${summary.marginLevel}%`)
      
      // Force close all trades
      const closedTrades = []
      for (const trade of openTrades) {
        const prices = currentPrices[trade.symbol]
        if (prices) {
          try {
            const result = await this.closeTrade(trade._id, prices.bid, prices.ask, 'STOP_OUT', null, prices.rawBid, prices.rawAsk)
            closedTrades.push(result)
          } catch (err) {
            console.error(`Error closing trade ${trade.tradeId} during stop out:`, err)
          }
        }
      }

      // Reset account balance if negative
      const finalAccount = await TradingAccount.findById(tradingAccountId)
      if (finalAccount.balance < 0) {
        finalAccount.balance = 0
      }
      await finalAccount.save()

      return { 
        stopOutTriggered: true, 
        closedTrades,
        reason: summary.equity <= 0 ? 'EQUITY_ZERO' : summary.freeMargin < 0 ? 'NEGATIVE_FREE_MARGIN' : 'MARGIN_LEVEL',
        finalEquity: summary.equity,
        finalMarginLevel: summary.marginLevel
      }
    }

    return { stopOutTriggered: false }
  }

  // Check SL/TP for all open trades
  async checkSlTpForAllTrades(currentPrices) {
    const openTrades = await Trade.find({ status: 'OPEN' })
    const triggeredTrades = []

    for (const trade of openTrades) {
      //Sanket v2.0 - Skip SL/TP check for 5 seconds after user modified SL/TP.
      // Prevents immediate close when user moves stop above current price (trailing stop / lock-in-profit).
      if (trade.slLastModifiedAt) {
        const secsSinceModify = (Date.now() - new Date(trade.slLastModifiedAt).getTime()) / 1000;
        if (secsSinceModify < 5) continue;
      }

      //Sanket v2.0 - Normalize trade symbol: strip .i suffix for consistent price lookup
      const targetSym = trade.symbol.toUpperCase().replace(/\.I$/i, '');
      const prices = currentPrices[targetSym] || 
                     currentPrices[`${targetSym}.i`];
      
      if (!prices) continue

      const trigger = trade.checkSlTp(prices.bid, prices.ask)
      if (trigger) {
        // ENHANCED: Real-World Market Execution (Gap/Slippage Handling)
        // Closing a trade (SL/TP) uses the first available market price (bid/ask) instead of the target stop/limit level
        const executionPrice = trade.side === 'BUY' ? prices.bid : prices.ask;
        
        console.log(`[TradeEngine] SL/TP ${trigger} HIT for trade ${trade.tradeId} @ market price ${executionPrice} (Slippage tracked)`);

        const result = await this.closeTrade(trade._id, executionPrice, executionPrice, trigger)
        triggeredTrades.push({ trade: result.trade, trigger, pnl: result.realizedPnl })
      }
    }

    return triggeredTrades
  }

  // Check and execute pending orders when price is reached
  async checkPendingOrders(currentPrices) {
    const pendingTrades = await Trade.find({ status: 'PENDING' })
    const executedTrades = []

    for (const trade of pendingTrades) {
      //Sanket v2.0 - Normalize trade symbol: strip .i suffix for consistent price lookup
      const targetSym = trade.symbol.toUpperCase().replace(/\.I$/i, '');
      const prices = currentPrices[targetSym] || 
                     currentPrices[`${targetSym}.i`];
      
      if (!prices) continue

      let shouldExecute = false
      const currentBid = prices.bid
      const currentAsk = prices.ask

      switch (trade.orderType) {
        case 'BUY_LIMIT':
          // Execute when ask price drops to or below pending price
          if (currentAsk <= trade.pendingPrice) shouldExecute = true
          break
        case 'BUY_STOP':
          // Execute when ask price rises to or above pending price
          if (currentAsk >= trade.pendingPrice) shouldExecute = true
          break
        case 'SELL_LIMIT':
          // Execute when bid price rises to or above pending price
          if (currentBid >= trade.pendingPrice) shouldExecute = true
          break
        case 'SELL_STOP':
          // Execute when bid price drops to or below pending price
          if (currentBid <= trade.pendingPrice) shouldExecute = true
          break
      }

      if (shouldExecute) {
        try {
          // Update trade to OPEN status
          trade.status = 'OPEN'
          // Use raw prices if available for pending execution
          const bidToUse = prices.rawBid !== null ? prices.rawBid : currentBid
          const askToUse = prices.rawAsk !== null ? prices.rawAsk : currentAsk
          trade.openPrice = trade.side === 'BUY' ? askToUse : bidToUse
          trade.openedAt = new Date()
          await trade.save()

          executedTrades.push({
            trade,
            executedAt: new Date(),
            executionPrice: trade.openPrice
          })

          console.log(`Pending order ${trade.tradeId} executed at ${trade.openPrice}`)
        } catch (error) {
          console.error(`Error executing pending order ${trade.tradeId}:`, error)
        }
      }
    }

    return executedTrades
  }

  // Apply swap to all open trades (called at rollover time)
  async applySwap() {
    const openTrades = await Trade.find({ status: 'OPEN' }).populate({
      path: 'tradingAccountId',
      populate: { path: 'accountTypeId' }
    })

    for (const trade of openTrades) {
      const charges = await Charges.getChargesForTrade(
        trade.userId,
        trade.symbol,
        trade.segment,
        trade.tradingAccountId?.accountTypeId?._id
      )

      const swapRate = trade.side === 'BUY' ? charges.swapLong : charges.swapShort
      let swapAmount = 0

      if (charges.swapType === 'POINTS') {
        swapAmount = trade.quantity * trade.contractSize * swapRate
      } else {
        // Percentage of trade value
        const tradeValue = trade.quantity * trade.contractSize * trade.openPrice
        swapAmount = tradeValue * (swapRate / 100)
      }

      trade.swap += swapAmount
      await trade.save()
    }
  }
}

export default new TradeEngine()
