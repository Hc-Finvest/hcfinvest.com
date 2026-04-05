import User from '../models/User.js'
import IBPlan from '../models/IBPlanNew.js'
import IBCommission from '../models/IBCommissionNew.js'
import IBWallet from '../models/IBWallet.js'
import IBLevel from '../models/IBLevel.js'

class IBEngine {
  constructor() {
    this.CONTRACT_SIZES = {
      'XAUUSD': 100,
      'XAGUSD': 5000,
      'BTCUSD': 1,
      'ETHUSD': 1,
      'DEFAULT_FOREX': 100000,
      'DEFAULT_CRYPTO': 1
    }
  }

  getContractSize(symbol) {
    if (this.CONTRACT_SIZES[symbol]) return this.CONTRACT_SIZES[symbol]
    if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('USD')) {
      if (symbol.length <= 6) return this.CONTRACT_SIZES.DEFAULT_CRYPTO
    }
    return this.CONTRACT_SIZES.DEFAULT_FOREX
  }

  normalizeCommissionType(type) {
    return type === 'PERCENTAGE' ? 'PERCENT' : (type || 'PER_LOT')
  }

  getPlanRateForLevel(plan, level) {
    if (!plan || level <= 0) return 0

    if (Array.isArray(plan.levels) && plan.levels.length > 0) {
      const levelConfig = plan.levels.find((entry) => entry.level === level)
      return levelConfig ? Number(levelConfig.rate || 0) : 0
    }

    if (plan.levelCommissions && typeof plan.levelCommissions === 'object') {
      return Number(plan.levelCommissions[`level${level}`] || 0)
    }

    if (typeof plan.getRateForLevel === 'function') {
      return Number(plan.getRateForLevel(level) || 0)
    }

    return 0
  }

  async resolveCommissionConfig(ibUser, level) {
    const override = ibUser?.ibCommissionOverride
    if (override?.enabled) {
      const overrideRate = Number(override.levels?.[`level${level}`] || 0)
      if (overrideRate > 0) {
        return {
          rate: overrideRate,
          commissionType: this.normalizeCommissionType(override.commissionType),
          source: 'manual-override'
        }
      }
    }

    let levelDoc = null

    if (ibUser.ibLevelId && typeof ibUser.ibLevelId === 'object' && ibUser.ibLevelId.downlineCommission) {
      levelDoc = ibUser.ibLevelId
    } else if (ibUser.ibLevelId) {
      levelDoc = await IBLevel.findById(ibUser.ibLevelId)
    }

    const legacyLevelOrder = Number(ibUser.ibLevelOrder || ibUser.ibLevel || 1)

    if (!levelDoc && legacyLevelOrder > 0) {
      levelDoc = await IBLevel.findOne({ order: legacyLevelOrder, isActive: true })
    }

    let plan = null
    if (ibUser.ibPlanId && typeof ibUser.ibPlanId === 'object' && Array.isArray(ibUser.ibPlanId.levels)) {
      plan = ibUser.ibPlanId
    } else if (ibUser.ibPlanId) {
      plan = await IBPlan.findById(ibUser.ibPlanId)
    }

    if (plan && level <= (plan.maxLevels || 0)) {
      const planRate = this.getPlanRateForLevel(plan, level)
      if (planRate > 0) {
        return {
          rate: planRate,
          commissionType: this.normalizeCommissionType(plan.commissionType),
          source: 'plan',
          planId: plan._id,
          planName: plan.name
        }
      }
    }

    if (levelDoc) {
      const levelRate = Number(levelDoc.downlineCommission?.[`level${level}`] || 0)
      if (levelRate > 0) {
        return {
          rate: levelRate,
          commissionType: this.normalizeCommissionType(levelDoc.commissionType),
          source: 'ib-level',
          levelId: levelDoc._id,
          levelName: levelDoc.name
        }
      }
    }

    return {
      rate: 0,
      commissionType: 'PER_LOT',
      source: 'none'
    }
  }

  async getCommissionProfile(ibUserOrId) {
    const ibUser = typeof ibUserOrId === 'object'
      ? ibUserOrId
      : await User.findById(ibUserOrId).populate('ibLevelId').populate('ibPlanId')

    if (!ibUser || !ibUser.isIB) {
      return null
    }

    const directConfig = await this.resolveCommissionConfig(ibUser, 1)
    return {
      source: directConfig.source,
      effectiveRate: Number(directConfig.rate || 0),
      commissionType: directConfig.commissionType,
      manualOverrideEnabled: Boolean(ibUser.ibCommissionOverride?.enabled),
      manualLevels: ibUser.ibCommissionOverride?.levels || null,
      levelName: ibUser.ibLevelId?.name || null,
      planName: ibUser.ibPlanId?.name || null
    }
  }

  // Generate unique referral code
  async generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code
    let exists = true
    
    while (exists) {
      code = 'IB'
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      exists = await User.findOne({ referralCode: code })
    }
    
    return code
  }

  // Apply to become IB
  async applyForIB(userId) {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')
    
    if (user.isIB) {
      throw new Error('User is already an IB')
    }

    const referralCode = await this.generateReferralCode()
    
    user.isIB = true
    user.ibStatus = 'PENDING'
    user.referralCode = referralCode
    
    // If user was referred by an IB, set parent and level
    if (user.referredBy) {
      const parentIB = await User.findOne({ 
        referralCode: user.referredBy, 
        isIB: true, 
        ibStatus: 'ACTIVE' 
      })
      if (parentIB) {
        user.parentIBId = parentIB._id
        user.ibLevel = parentIB.ibLevel + 1
      } else {
        user.ibLevel = 1
      }
    } else {
      user.ibLevel = 1
    }

    await user.save()

    await this.assignInitialLevel(userId)
    
    // Create IB wallet
    await IBWallet.getOrCreateWallet(userId)
    
    return user
  }

  // Admin approve IB
  async approveIB(userId, planId = null) {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')
    if (!user.isIB) throw new Error('User is not an IB applicant')

    user.ibStatus = 'ACTIVE'
    
    if (planId) {
      user.ibPlanId = planId
    } else {
      const defaultPlan = await IBPlan.findOne({ isActive: true, isDefault: true }).sort({ createdAt: 1 })
        || await IBPlan.findOne({ isActive: true }).sort({ createdAt: 1 })
      user.ibPlanId = defaultPlan?._id || null
    }

    await user.save()
    await this.assignInitialLevel(userId)
    return user
  }

  // Admin block IB
  async blockIB(userId, reason = '') {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    user.ibStatus = 'BLOCKED'
    await user.save()
    return user
  }

  // Register user with referral code
  async registerWithReferral(userId, referralCode) {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    const referringIB = await User.findOne({ 
      referralCode, 
      isIB: true, 
      ibStatus: 'ACTIVE' 
    })
    
    if (!referringIB) {
      throw new Error('Invalid or inactive referral code')
    }

    user.referredBy = referralCode
    user.parentIBId = referringIB._id
    await user.save()

    return { user, referringIB }
  }

  // Get IB chain for a trader (upline IBs)
  async getIBChain(userId, maxLevels = 5) {
    const chain = []
    let currentUser = await User.findById(userId)
    
    if (!currentUser) return chain

    let parentId = currentUser.parentIBId
    let level = 1

    while (parentId && level <= maxLevels) {
      const parentIB = await User.findById(parentId)
        .populate('ibPlanId')
        .populate('ibLevelId')
      
      if (!parentIB || !parentIB.isIB || parentIB.ibStatus !== 'ACTIVE') {
        break
      }

      chain.push({
        ibUser: parentIB,
        level
      })

      parentId = parentIB.parentIBId
      level++
    }

    return chain
  }

  // Calculate and distribute IB commission when a trade closes
  async processTradeCommission(trade) {
    console.log(`Processing IB commission for trade ${trade.tradeId || trade._id}, userId: ${trade.userId}`)
    
    // Get the IB chain for the trader
    const ibChain = await this.getIBChain(trade.userId)
    
    console.log(`IB Chain length: ${ibChain.length}`)
    
    if (ibChain.length === 0) {
      console.log('No IB chain found for trader')
      return { processed: false, reason: 'No IB chain found for trader' }
    }

    const commissionResults = []
    const contractSize = this.getContractSize(trade.symbol)

    for (const { ibUser, level } of ibChain) {
      try {
        console.log(`Processing level ${level} for IB ${ibUser.firstName} (${ibUser._id})`)
        
        const commissionConfig = await this.resolveCommissionConfig(ibUser, level)
        const rate = Number(commissionConfig.rate || 0)

        console.log(`Level ${level} rate: ${rate} (${commissionConfig.source})`)
        
        if (rate <= 0) {
          console.log(`Rate is 0 for level ${level}`)
          continue
        }

        // Calculate commission based on commission type
        let commissionAmount = 0
        let baseAmount = trade.quantity // lot size
        
        if (commissionConfig.commissionType === 'PER_LOT') {
          // PER_LOT: rate is $ per lot
          commissionAmount = trade.quantity * rate
        } else {
          // PERCENT: rate is % of trade value
          const tradeValue = trade.quantity * contractSize * (trade.openPrice || 0)
          baseAmount = tradeValue
          commissionAmount = tradeValue * (rate / 100)
        }

        commissionAmount = Math.round(commissionAmount * 100) / 100

        if (commissionAmount <= 0) {
          console.log(`IB Commission: Skipping - commission amount is 0 for level ${level}`)
          continue
        }

        // Check if commission already exists for this trade and IB to prevent duplicates
        const existingCommission = await IBCommission.findOne({
          tradeId: trade._id,
          ibUserId: ibUser._id,
          level
        })
        
        if (existingCommission) {
          console.log(`IB Commission: Skipping - commission already exists for trade ${trade._id} and IB ${ibUser._id} at level ${level}`)
          continue
        }

        // Create commission record
        const commission = await IBCommission.create({
          tradeId: trade._id,
          traderUserId: trade.userId,
          ibUserId: ibUser._id,
          level,
          baseAmount,
          commissionAmount,
          symbol: trade.symbol,
          tradeLotSize: trade.quantity,
          contractSize,
          commissionType: commissionConfig.commissionType,
          status: 'CREDITED'
        })

        // Credit IB wallet
        const wallet = await IBWallet.getOrCreateWallet(ibUser._id)
        await wallet.creditCommission(commissionAmount)

        commissionResults.push({
          ibUserId: ibUser._id,
          ibName: ibUser.firstName,
          level,
          baseAmount,
          commissionAmount,
          commissionId: commission._id
        })

        console.log(`IB Commission: Level ${level} IB ${ibUser.firstName} earned $${commissionAmount.toFixed(2)} from trade ${trade.tradeId}`)

      } catch (error) {
        console.error(`Error processing IB commission for level ${level}:`, error)
      }
    }

    return {
      processed: true,
      commissionsGenerated: commissionResults.length,
      results: commissionResults
    }
  }

  // Reverse commission (admin action)
  async reverseCommission(commissionId, adminId, reason = '') {
    const commission = await IBCommission.findById(commissionId)
    if (!commission) throw new Error('Commission not found')
    if (commission.status === 'REVERSED') throw new Error('Commission already reversed')

    // Deduct from IB wallet
    const wallet = await IBWallet.getOrCreateWallet(commission.ibUserId)
    await wallet.reverseCommission(commission.commissionAmount)

    // Update commission status
    commission.status = 'REVERSED'
    commission.reversedAt = new Date()
    commission.reversedBy = adminId
    commission.reversalReason = reason
    await commission.save()

    return commission
  }

  // Get IB tree using $graphLookup (for admin visualization)
  async getIBTree(ibId, maxDepth = 5) {
    const result = await User.aggregate([
      { $match: { _id: ibId } },
      {
        $graphLookup: {
          from: 'users',
          startWith: '$_id',
          connectFromField: '_id',
          connectToField: 'parentIBId',
          as: 'downlines',
          maxDepth: maxDepth - 1,
          depthField: 'level'
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          email: 1,
          referralCode: 1,
          ibStatus: 1,
          ibLevel: 1,
          downlines: {
            _id: 1,
            firstName: 1,
            email: 1,
            referralCode: 1,
            ibStatus: 1,
            isIB: 1,
            parentIBId: 1,
            level: 1
          }
        }
      }
    ])

    return result[0] || null
  }

  // Get IB stats for admin dashboard
  async getIBStats(ibUserId) {
    const user = await User.findById(ibUserId)
    if (!user || !user.isIB) throw new Error('IB not found')

    // Get wallet
    const wallet = await IBWallet.getOrCreateWallet(ibUserId)

    // Get direct referrals count
    const directReferrals = await User.countDocuments({ parentIBId: ibUserId })

    // Get total downline count (all levels)
    const tree = await this.getIBTree(user._id, 5)
    const totalDownline = tree?.downlines?.length || 0

    // Get commission stats
    const commissionStats = await IBCommission.aggregate([
      { $match: { ibUserId: user._id, status: 'CREDITED' } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$commissionAmount' },
          totalTrades: { $sum: 1 }
        }
      }
    ])

    // Get active traders (users who traded in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const activeTraders = await IBCommission.aggregate([
      { 
        $match: { 
          ibUserId: user._id, 
          createdAt: { $gte: thirtyDaysAgo } 
        } 
      },
      { $group: { _id: '$traderUserId' } },
      { $count: 'count' }
    ])

    // Get commission counts per level
    const levelCommissions = await IBCommission.aggregate([
      { $match: { ibUserId: user._id, status: 'CREDITED' } },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commissionAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Build level counts object
    const levelCounts = {}
    for (let i = 1; i <= 5; i++) {
      const levelData = levelCommissions.find(l => l._id === i)
      levelCounts[`level${i}Count`] = levelData?.count || 0
      levelCounts[`level${i}Commission`] = levelData?.totalAmount || 0
    }

    return {
      ibUser: {
        _id: user._id,
        firstName: user.firstName,
        email: user.email,
        referralCode: user.referralCode,
        ibStatus: user.ibStatus,
        ibLevel: user.ibLevel
      },
      wallet: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        pendingWithdrawal: wallet.pendingWithdrawal
      },
      stats: {
        directReferrals,
        totalDownline,
        totalCommission: commissionStats[0]?.totalCommission || 0,
        totalTrades: commissionStats[0]?.totalTrades || 0,
        activeTraders: activeTraders[0]?.count || 0,
        ...levelCounts
      }
    }
  }

  // Withdraw from IB wallet to main wallet
  async withdrawToWallet(ibUserId, amount) {
    const user = await User.findById(ibUserId)
    if (!user || !user.isIB) throw new Error('IB not found')

    const wallet = await IBWallet.getOrCreateWallet(ibUserId)
    
    if (amount > wallet.balance) {
      throw new Error('Insufficient IB wallet balance')
    }

    // Deduct from IB wallet
    await wallet.requestWithdrawal(amount)
    
    // Add to user's main wallet balance
    user.walletBalance = (user.walletBalance || 0) + amount
    await user.save()

    // Complete the withdrawal
    await wallet.completeWithdrawal(amount)

    return {
      ibWalletBalance: wallet.balance,
      mainWalletBalance: user.walletBalance,
      withdrawnAmount: amount
    }
  }

  // Check and auto-upgrade IB level based on referral count
  async checkAndUpgradeLevel(ibUserId) {
    const user = await User.findById(ibUserId).populate('ibLevelId')
    if (!user || !user.isIB || user.ibStatus !== 'ACTIVE') return null
    if (!user.autoUpgradeEnabled) return null

    // Get direct referral count
    const referralCount = await User.countDocuments({ parentIBId: ibUserId })
    
    // Get all levels sorted by order
    const levels = await IBLevel.getAllLevels()
    if (levels.length === 0) return null

    // Find the highest level the user qualifies for
    let qualifiedLevel = levels[0] // Start with lowest level
    for (const level of levels) {
      if (referralCount >= level.referralTarget) {
        qualifiedLevel = level
      }
    }

    // Check if upgrade is needed
    const currentLevelOrder = user.ibLevelOrder || 1
    if (qualifiedLevel.order > currentLevelOrder) {
      user.ibLevelId = qualifiedLevel._id
      user.ibLevelOrder = qualifiedLevel.order
      await user.save()
      
      console.log(`[IB Level] User ${user.firstName} upgraded to ${qualifiedLevel.name} (${referralCount} referrals)`)
      return {
        upgraded: true,
        previousLevel: currentLevelOrder,
        newLevel: qualifiedLevel,
        referralCount
      }
    }

    return { upgraded: false, currentLevel: qualifiedLevel, referralCount }
  }

  // Get IB level progress for user dashboard
  async getIBLevelProgress(ibUserId) {
    const user = await User.findById(ibUserId).populate('ibLevelId')
    if (!user || !user.isIB) throw new Error('IB not found')

    // Get direct referral count
    const referralCount = await User.countDocuments({ parentIBId: ibUserId })
    
    // Get all levels
    const levels = await IBLevel.getAllLevels()
    if (levels.length === 0) {
      // Initialize default levels if none exist
      await IBLevel.initializeDefaultLevels()
      const newLevels = await IBLevel.getAllLevels()
      return this._calculateLevelProgress(user, referralCount, newLevels)
    }

    return this._calculateLevelProgress(user, referralCount, levels)
  }

  _calculateLevelProgress(user, referralCount, levels) {
    // Find current level
    let currentLevel = levels.find(l => l.order === (user.ibLevelOrder || 1)) || levels[0]
    
    // Find next level
    const nextLevel = levels.find(l => l.order === currentLevel.order + 1)
    
    // Calculate progress
    let progressPercent = 100
    let referralsNeeded = 0
    
    if (nextLevel) {
      const currentTarget = currentLevel.referralTarget
      const nextTarget = nextLevel.referralTarget
      const range = nextTarget - currentTarget
      const progress = referralCount - currentTarget
      progressPercent = Math.min(100, Math.max(0, (progress / range) * 100))
      referralsNeeded = Math.max(0, nextTarget - referralCount)
    }

    return {
      currentLevel: {
        _id: currentLevel._id,
        name: currentLevel.name,
        order: currentLevel.order,
        commissionRate: currentLevel.commissionRate,
        commissionType: currentLevel.commissionType,
        color: currentLevel.color,
        icon: currentLevel.icon,
        referralTarget: currentLevel.referralTarget,
        downlineCommission: currentLevel.downlineCommission
      },
      commissionProfile: {
        source: user.ibCommissionOverride?.enabled ? 'manual-override' : 'level',
        effectiveRate: user.ibCommissionOverride?.enabled
          ? Number(user.ibCommissionOverride?.levels?.level1 || currentLevel.commissionRate || 0)
          : Number(currentLevel.commissionRate || 0),
        commissionType: user.ibCommissionOverride?.enabled
          ? this.normalizeCommissionType(user.ibCommissionOverride?.commissionType)
          : currentLevel.commissionType,
        manualOverrideEnabled: Boolean(user.ibCommissionOverride?.enabled)
      },
      nextLevel: nextLevel ? {
        _id: nextLevel._id,
        name: nextLevel.name,
        order: nextLevel.order,
        commissionRate: nextLevel.commissionRate,
        referralTarget: nextLevel.referralTarget,
        color: nextLevel.color
      } : null,
      referralCount,
      referralsNeeded,
      progressPercent: Math.round(progressPercent),
      autoUpgradeEnabled: user.autoUpgradeEnabled,
      allLevels: levels.map(l => ({
        _id: l._id,
        name: l.name,
        order: l.order,
        commissionRate: l.commissionRate,
        commissionType: l.commissionType,
        referralTarget: l.referralTarget,
        color: l.color,
        icon: l.icon,
        isCurrentLevel: l.order === currentLevel.order,
        isUnlocked: referralCount >= l.referralTarget
      }))
    }
  }

  // Assign initial level to new IB
  async assignInitialLevel(userId) {
    const user = await User.findById(userId)
    if (!user) throw new Error('User not found')

    // Get the first level (Standard)
    let firstLevel = await IBLevel.findOne({ order: 1, isActive: true })
    if (!firstLevel) {
      await IBLevel.initializeDefaultLevels()
      firstLevel = await IBLevel.findOne({ order: 1, isActive: true })
    }

    if (firstLevel) {
      user.ibLevelId = firstLevel._id
      user.ibLevelOrder = firstLevel.order
      user.ibLevel = firstLevel.order
      await user.save()
    }

    return user
  }
}

export default new IBEngine()
