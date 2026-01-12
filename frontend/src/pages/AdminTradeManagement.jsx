import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  RefreshCw,
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  Plus,
  Edit,
  X,
  Trash2
} from 'lucide-react'
import metaApiService from '../services/metaApi'
import binanceApiService from '../services/binanceApi'

const API_URL = 'http://localhost:5001/api'

const AdminTradeManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [trades, setTrades] = useState([])
  const [stats, setStats] = useState({ total: 0, open: 0, volume: 0, pnl: 0 })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState(null)
  const [users, setUsers] = useState([])
  const [tradingAccounts, setTradingAccounts] = useState([])
  const [createForm, setCreateForm] = useState({
    userId: '',
    tradingAccountId: '',
    symbol: 'XAUUSD',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 0.01,
    openPrice: 0,
    stopLoss: '',
    takeProfit: ''
  })
  const [editForm, setEditForm] = useState({
    openPrice: 0,
    closePrice: '',
    quantity: 0,
    stopLoss: '',
    takeProfit: '',
    realizedPnl: 0
  })
  const [marketPrices, setMarketPrices] = useState({})
  const [loadingPrices, setLoadingPrices] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalTrades, setTotalTrades] = useState(0)
  const tradesPerPage = 20

  useEffect(() => {
    fetchTrades()
    fetchUsers()
  }, [filterStatus, currentPage])

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`)
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTradingAccounts = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${userId}`)
      const data = await res.json()
      if (data.accounts) setTradingAccounts(data.accounts)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchMarketPrice = async (symbol) => {
    setLoadingPrices(true)
    try {
      let priceData = null
      
      // Check if it's a crypto symbol
      const cryptoSymbols = ['BTCUSD', 'ETHUSD', 'BTCUSDT', 'ETHUSDT']
      if (cryptoSymbols.includes(symbol)) {
        // Use Binance API for crypto
        const prices = await binanceApiService.getAllPrices([symbol])
        priceData = prices[symbol]
      } else {
        // Use MetaAPI for forex/commodities
        priceData = await metaApiService.getSymbolPrice(symbol)
      }
      
      if (priceData && priceData.bid && priceData.ask) {
        setMarketPrices(prev => ({ ...prev, [symbol]: priceData }))
        
        // Auto-set price for market orders
        if (createForm.orderType === 'MARKET') {
          const marketPrice = createForm.side === 'BUY' ? priceData.ask : priceData.bid
          setCreateForm(prev => ({ ...prev, openPrice: marketPrice }))
        }
      } else {
        console.warn('No price data received for', symbol)
      }
    } catch (error) {
      console.error('Error fetching price:', error)
    }
    setLoadingPrices(false)
  }

  const handleCreateTrade = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/trade/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          quantity: parseFloat(createForm.quantity),
          openPrice: parseFloat(createForm.openPrice),
          stopLoss: createForm.stopLoss ? parseFloat(createForm.stopLoss) : null,
          takeProfit: createForm.takeProfit ? parseFloat(createForm.takeProfit) : null
        })
      })
      const data = await res.json()
      if (data.success) {
        alert('Trade created successfully!')
        setShowCreateModal(false)
        fetchTrades()
        setCreateForm({
          userId: '', tradingAccountId: '', symbol: 'XAUUSD', side: 'BUY',
          orderType: 'MARKET', quantity: 0.01, openPrice: 0, stopLoss: '', takeProfit: ''
        })
      } else {
        alert(data.message || 'Failed to create trade')
      }
    } catch (error) {
      alert('Error creating trade')
    }
  }

  // Full edit trade - admin can change any field
  const handleEditTrade = async () => {
    if (!selectedTrade) return
    try {
      const res = await fetch(`${API_URL}/admin/trade/edit/${selectedTrade._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openPrice: parseFloat(editForm.openPrice),
          closePrice: editForm.closePrice ? parseFloat(editForm.closePrice) : null,
          quantity: parseFloat(editForm.quantity),
          stopLoss: editForm.stopLoss ? parseFloat(editForm.stopLoss) : null,
          takeProfit: editForm.takeProfit ? parseFloat(editForm.takeProfit) : null,
          realizedPnl: editForm.realizedPnl ? parseFloat(editForm.realizedPnl) : null
        })
      })
      const data = await res.json()
      if (data.success) {
        alert('Trade updated successfully!')
        setShowEditModal(false)
        fetchTrades()
      } else {
        alert(data.message || 'Failed to update trade')
      }
    } catch (error) {
      alert('Error updating trade')
    }
  }

  const handleCloseTrade = async () => {
    if (!selectedTrade) return
    try {
      const res = await fetch(`${API_URL}/admin/trade/close/${selectedTrade._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closePrice: selectedTrade.openPrice })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Trade closed! P&L: $${data.realizedPnl?.toFixed(2)}`)
        setShowCloseModal(false)
        fetchTrades()
      } else {
        alert(data.message || 'Failed to close trade')
      }
    } catch (error) {
      alert('Error closing trade')
    }
  }

  const openEditModal = (trade) => {
    setSelectedTrade(trade)
    setEditForm({
      openPrice: trade.openPrice || 0,
      closePrice: trade.closePrice || '',
      quantity: trade.quantity || 0,
      stopLoss: trade.stopLoss || '',
      takeProfit: trade.takeProfit || '',
      realizedPnl: trade.realizedPnl || 0
    })
    setShowEditModal(true)
  }

  const openCloseModal = (trade) => {
    setSelectedTrade(trade)
    setShowCloseModal(true)
  }

  // Calculate PnL when admin changes prices
  const calculatePnL = () => {
    if (!selectedTrade || !editForm.closePrice) return
    const contractSize = selectedTrade.contractSize || 100
    const pnl = selectedTrade.side === 'BUY'
      ? (parseFloat(editForm.closePrice) - parseFloat(editForm.openPrice)) * parseFloat(editForm.quantity) * contractSize
      : (parseFloat(editForm.openPrice) - parseFloat(editForm.closePrice)) * parseFloat(editForm.quantity) * contractSize
    setEditForm(prev => ({ ...prev, realizedPnl: Math.round(pnl * 100) / 100 }))
  }

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const offset = (currentPage - 1) * tradesPerPage
      const statusParam = filterStatus !== 'all' ? `&status=${filterStatus.toUpperCase()}` : ''
      const res = await fetch(`${API_URL}/admin/trade/all?limit=${tradesPerPage}&offset=${offset}${statusParam}`)
      const data = await res.json()
      if (data.trades) {
        setTrades(data.trades)
        setTotalTrades(data.total || data.trades.length)
        // Calculate stats
        const openTrades = data.trades.filter(t => t.status === 'OPEN')
        const closedTrades = data.trades.filter(t => t.status === 'CLOSED')
        const totalVolume = data.trades.reduce((sum, t) => sum + (t.quantity * t.contractSize * t.openPrice), 0)
        const totalPnl = closedTrades.reduce((sum, t) => sum + (t.realizedPnl || 0), 0)
        setStats({
          total: data.total || data.trades.length,
          open: openTrades.length,
          volume: totalVolume,
          pnl: totalPnl
        })
      }
    } catch (error) {
      console.error('Error fetching trades:', error)
    }
    setLoading(false)
  }

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'bg-green-500/20 text-green-500'
      case 'CLOSED': return 'bg-gray-500/20 text-gray-400'
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-500'
      case 'CANCELLED': return 'bg-red-500/20 text-red-500'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.tradeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return <CheckCircle size={14} />
      case 'CLOSED': return <XCircle size={14} />
      case 'PENDING': return <Clock size={14} />
      default: return null
    }
  }

  return (
    <AdminLayout title="Trade Management" subtitle="Monitor and manage all trading activities">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Total Trades</p>
          <p className="text-white text-2xl font-bold">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Open Positions</p>
          <p className="text-white text-2xl font-bold">{stats.open}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Total Volume</p>
          <p className="text-white text-2xl font-bold">${(stats.volume / 1000000).toFixed(2)}M</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Platform P&L</p>
          <p className={`text-2xl font-bold ${stats.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">All Trades</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => {
                setShowCreateModal(true)
                fetchMarketPrice('XAUUSD')
              }}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg flex items-center gap-2"
            >
              <Plus size={18} /> Create Trade
            </button>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search trades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-dark-700 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading trades...</div>
        ) : filteredTrades.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No trades found</div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden p-4 space-y-3">
              {filteredTrades.map((trade) => (
                <div key={trade._id} className="bg-dark-700 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{trade.symbol}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        trade.side === 'BUY' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {trade.side}
                      </span>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(trade.status)}`}>
                      {getStatusIcon(trade.status)}
                      {trade.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">User</p>
                      <p className="text-white">{trade.userId?.firstName || trade.userId?.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Lots</p>
                      <p className="text-white">{trade.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Leverage</p>
                      <p className="text-white">1:{trade.leverage}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">P&L</p>
                      <p className={(trade.realizedPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {(trade.realizedPnl || 0) >= 0 ? '+' : ''}${(trade.realizedPnl || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Trade ID</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">User</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Symbol</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Side</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Lots</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Open Price</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">P&L</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => (
                    <tr key={trade._id} className="border-b border-gray-800 hover:bg-dark-700/50">
                      <td className="py-4 px-4 text-white font-mono text-sm">{trade.tradeId}</td>
                      <td className="py-4 px-4 text-white">{trade.userId?.firstName || trade.userId?.email}</td>
                      <td className="py-4 px-4 text-white font-medium">{trade.symbol}</td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-1 ${trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                          {trade.side === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">{trade.quantity}</td>
                      <td className="py-4 px-4 text-gray-400">${trade.openPrice?.toFixed(5)}</td>
                      <td className={`py-4 px-4 font-medium ${(trade.realizedPnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(trade.realizedPnl || 0) >= 0 ? '+' : ''}${(trade.realizedPnl || 0).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${getStatusColor(trade.status)}`}>
                          {getStatusIcon(trade.status)}
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEditModal(trade)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-gray-400 hover:text-blue-500" 
                            title="Edit Trade"
                          >
                            <Edit size={16} />
                          </button>
                          {trade.status === 'OPEN' && (
                            <button 
                              onClick={() => openCloseModal(trade)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-gray-400 hover:text-red-500" 
                              title="Close Trade"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalTrades > tradesPerPage && (
              <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  Showing {((currentPage - 1) * tradesPerPage) + 1} - {Math.min(currentPage * tradesPerPage, totalTrades)} of {totalTrades} trades
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-white px-3">
                    Page {currentPage} of {Math.ceil(totalTrades / tradesPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalTrades / tradesPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(totalTrades / tradesPerPage)}
                    className="px-3 py-1 bg-dark-700 hover:bg-dark-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Trade Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create Trade</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">User</label>
                <select
                  value={createForm.userId}
                  onChange={(e) => {
                    setCreateForm({ ...createForm, userId: e.target.value, tradingAccountId: '' })
                    if (e.target.value) fetchTradingAccounts(e.target.value)
                  }}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.firstName} - {u.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Trading Account</label>
                <select
                  value={createForm.tradingAccountId}
                  onChange={(e) => setCreateForm({ ...createForm, tradingAccountId: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Select Account</option>
                  {tradingAccounts.map(a => (
                    <option key={a._id} value={a._id}>{a.accountId} - ${a.balance?.toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Symbol</label>
                  <select
                    value={createForm.symbol}
                    onChange={(e) => {
                      const symbol = e.target.value
                      setCreateForm({ ...createForm, symbol })
                      fetchMarketPrice(symbol)
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="XAUUSD">XAUUSD</option>
                    <option value="EURUSD">EURUSD</option>
                    <option value="GBPUSD">GBPUSD</option>
                    <option value="BTCUSD">BTCUSD</option>
                    <option value="ETHUSD">ETHUSD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Order Type</label>
                  <select
                    value={createForm.orderType}
                    onChange={(e) => {
                      const orderType = e.target.value
                      setCreateForm({ ...createForm, orderType })
                      if (orderType === 'MARKET') {
                        fetchMarketPrice(createForm.symbol)
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="MARKET">Market Order</option>
                    <option value="LIMIT">Limit Order</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Side</label>
                  <select
                    value={createForm.side}
                    onChange={(e) => {
                      const side = e.target.value
                      setCreateForm({ ...createForm, side })
                      if (createForm.orderType === 'MARKET') {
                        const price = marketPrices[createForm.symbol]
                        if (price) {
                          setCreateForm(prev => ({ 
                            ...prev, 
                            side,
                            openPrice: side === 'BUY' ? price.ask : price.bid 
                          }))
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Quantity (Lots)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={createForm.quantity}
                    onChange={(e) => setCreateForm({ ...createForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
              
              {/* Market Price Display */}
              {loadingPrices ? (
                <div className="bg-dark-700 rounded-lg p-3 flex items-center justify-center">
                  <RefreshCw size={16} className="animate-spin text-gray-400 mr-2" />
                  <span className="text-gray-400 text-sm">Fetching live price...</span>
                </div>
              ) : marketPrices[createForm.symbol] ? (
                <div className="bg-dark-700 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-xs">Live Market Price</p>
                    <p className="text-white font-medium">{createForm.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-500">Bid: {marketPrices[createForm.symbol].bid?.toFixed(5)}</p>
                    <p className="text-green-500">Ask: {marketPrices[createForm.symbol].ask?.toFixed(5)}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-500 text-sm">Click on symbol to fetch live price</p>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  {createForm.orderType === 'MARKET' ? 'Execution Price (auto)' : 'Limit Price'}
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={createForm.openPrice}
                  onChange={(e) => setCreateForm({ ...createForm, openPrice: e.target.value })}
                  disabled={createForm.orderType === 'MARKET'}
                  className={`w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white ${
                    createForm.orderType === 'MARKET' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
                {createForm.orderType === 'MARKET' && (
                  <p className="text-gray-500 text-xs mt-1">Price auto-filled from market ({createForm.side === 'BUY' ? 'Ask' : 'Bid'})</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Stop Loss (optional)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={createForm.stopLoss}
                    onChange={(e) => setCreateForm({ ...createForm, stopLoss: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Take Profit (optional)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={createForm.takeProfit}
                    onChange={(e) => setCreateForm({ ...createForm, takeProfit: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTrade}
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                >
                  Create Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Trade Modal */}
      {showEditModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-dark-800">
              <h2 className="text-xl font-bold text-white">Edit Trade</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-dark-700 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-sm">Trade ID: {selectedTrade.tradeId}</p>
                    <p className="text-white font-medium">{selectedTrade.symbol} {selectedTrade.side}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTrade.status)}`}>
                    {selectedTrade.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">User: {selectedTrade.userId?.firstName || selectedTrade.userId?.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Quantity (Lots)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Open Price</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={editForm.openPrice}
                    onChange={(e) => setEditForm({ ...editForm, openPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={editForm.stopLoss}
                    onChange={(e) => setEditForm({ ...editForm, stopLoss: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Take Profit</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={editForm.takeProfit}
                    onChange={(e) => setEditForm({ ...editForm, takeProfit: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Close Price & PnL - for closed trades or to close open trades */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="text-gray-400 text-sm mb-3">Close Trade Settings (for closed trades or to set P&L)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Close Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={editForm.closePrice}
                      onChange={(e) => setEditForm({ ...editForm, closePrice: e.target.value })}
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                      placeholder="Enter close price"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Realized P&L</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.realizedPnl}
                        onChange={(e) => setEditForm({ ...editForm, realizedPnl: e.target.value })}
                        className={`flex-1 px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg ${
                          parseFloat(editForm.realizedPnl) >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      />
                      <button
                        onClick={calculatePnL}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm"
                        title="Auto-calculate P&L"
                      >
                        Calc
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-500 text-sm">⚠️ Changes will be saved silently without notifying the user.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTrade}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Trade Modal */}
      {showCloseModal && selectedTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Close Trade</h2>
              <button onClick={() => setShowCloseModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-dark-700 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Trade Details</p>
                <p className="text-white font-medium">{selectedTrade.tradeId}</p>
                <p className="text-white">{selectedTrade.symbol} {selectedTrade.side} {selectedTrade.quantity} lots</p>
                <p className="text-gray-400">Open Price: ${selectedTrade.openPrice}</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-yellow-500 text-sm">Are you sure you want to close this trade? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCloseModal(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseTrade}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                >
                  Close Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminTradeManagement
