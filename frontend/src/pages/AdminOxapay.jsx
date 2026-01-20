import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Settings, Save, RefreshCw, Check, X, AlertTriangle, 
  DollarSign, Shield, Eye, EyeOff, Bitcoin, Wallet,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle
} from 'lucide-react'

const AdminOxapay = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('config')
  const [showApiKey, setShowApiKey] = useState(false)
  const [validatingKey, setValidatingKey] = useState(false)
  
  // Gateway config
  const [config, setConfig] = useState({
    isActive: false,
    depositEnabled: true,
    minDeposit: 10,
    maxDeposit: 100000,
    withdrawalEnabled: false,
    minWithdrawal: 10,
    maxWithdrawal: 50000,
    depositFeePercent: 0,
    depositFeeFixed: 0,
    description: '',
    instructions: '',
    supportedCryptos: [],
    hasMerchantApiKey: false
  })

  // API credentials (only Merchant API Key needed)
  const [credentials, setCredentials] = useState({
    merchantApiKey: ''
  })

  // Transactions
  const [transactions, setTransactions] = useState([])
  const [txLoading, setTxLoading] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txTotal, setTxTotal] = useState(0)
  const [txFilter, setTxFilter] = useState('')

  // Payouts
  const [payouts, setPayouts] = useState([])
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [payoutForm, setPayoutForm] = useState({
    userId: '',
    userEmail: '',
    amount: '',
    cryptoCurrency: 'USDT',
    walletAddress: '',
    adminNotes: ''
  })
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')

  // Withdrawal Requests
  const [withdrawalRequests, setWithdrawalRequests] = useState([])
  const [withdrawalLoading, setWithdrawalLoading] = useState(false)
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0)

  // Stats
  const [stats, setStats] = useState({
    byStatus: [],
    totalDeposits: { count: 0, totalAmount: 0 },
    todayDeposits: { count: 0, totalAmount: 0 },
    totalPayouts: { count: 0, totalAmount: 0 }
  })

  // Get admin token for authenticated requests
  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem('adminToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }

  useEffect(() => {
    fetchConfig()
    fetchStats()
    fetchWithdrawalRequests()
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
    if (activeTab === 'payouts') {
      fetchPayouts()
    }
    if (activeTab === 'withdrawals') {
      fetchWithdrawalRequests()
    }
  }, [activeTab, txPage, txFilter])

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/config`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success && data.gateway) {
        setConfig({
          isActive: data.gateway.isActive || false,
          depositEnabled: data.gateway.depositEnabled !== false,
          minDeposit: data.gateway.minDeposit || 10,
          maxDeposit: data.gateway.maxDeposit || 100000,
          withdrawalEnabled: data.gateway.withdrawalEnabled || false,
          minWithdrawal: data.gateway.minWithdrawal || 10,
          maxWithdrawal: data.gateway.maxWithdrawal || 50000,
          depositFeePercent: data.gateway.depositFeePercent || 0,
          depositFeeFixed: data.gateway.depositFeeFixed || 0,
          description: data.gateway.description || '',
          instructions: data.gateway.instructions || '',
          supportedCryptos: data.gateway.supportedCryptos || [],
          hasMerchantApiKey: data.gateway.hasMerchantApiKey || false
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      setMessage({ type: 'error', text: 'Failed to load configuration' })
    }
    setLoading(false)
  }

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/stats`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchTransactions = async () => {
    setTxLoading(true)
    try {
      let url = `${API_URL}/oxapay/admin/transactions?page=${txPage}&limit=20`
      if (txFilter) url += `&status=${txFilter}`
      
      const res = await fetch(url, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setTransactions(data.transactions || [])
        setTxTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
    setTxLoading(false)
  }

  const fetchPayouts = async () => {
    setPayoutLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/payouts?limit=50`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setPayouts(data.payouts || [])
        if (data.stats?.totalPayouts) {
          setStats(prev => ({ ...prev, totalPayouts: data.stats.totalPayouts }))
        }
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    }
    setPayoutLoading(false)
  }

  const handleValidateApiKey = async () => {
    if (!credentials.merchantApiKey) {
      setMessage({ type: 'error', text: 'Please enter a Merchant API Key' })
      return
    }
    
    setValidatingKey(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/validate-key`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ merchantApiKey: credentials.merchantApiKey })
      })
      const data = await res.json()
      
      if (data.success) {
        setMessage({ type: 'success', text: `✓ API Key is valid! ${data.currencies} currencies available.` })
      } else {
        setMessage({ type: 'error', text: `✗ Invalid API Key: ${data.message}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error validating API Key: ${error.message}` })
    }
    setValidatingKey(false)
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const searchUsers = async (search) => {
    if (!search || search.length < 2) {
      setUsers([])
      return
    }
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.users) {
        const filtered = data.users.filter(u => 
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.firstName?.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 10)
        setUsers(filtered)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const fetchWithdrawalRequests = async () => {
    setWithdrawalLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/withdrawal-requests?status=pending`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (data.success) {
        setWithdrawalRequests(data.requests || [])
        setPendingWithdrawals(data.pendingCount || 0)
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error)
    }
    setWithdrawalLoading(false)
  }

  const handleApproveWithdrawal = async (id) => {
    if (!confirm('Are you sure you want to approve this withdrawal? This will process the crypto payout.')) return
    
    setWithdrawalLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/approve-withdrawal/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes: 'Approved by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Withdrawal approved and processing!' })
        fetchWithdrawalRequests()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to approve withdrawal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving withdrawal' })
    }
    setWithdrawalLoading(false)
  }

  const handleRejectWithdrawal = async (id) => {
    const reason = prompt('Enter rejection reason (optional):')
    
    setWithdrawalLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/reject-withdrawal/${id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: reason || 'Rejected by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Withdrawal rejected and user refunded!' })
        fetchWithdrawalRequests()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to reject withdrawal' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error rejecting withdrawal' })
    }
    setWithdrawalLoading(false)
  }

  const handleCreatePayout = async () => {
    if (!payoutForm.userId || !payoutForm.amount || !payoutForm.walletAddress) {
      setMessage({ type: 'error', text: 'User, amount, and wallet address are required' })
      return
    }

    setPayoutLoading(true)
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/payout`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: payoutForm.userId,
          amount: parseFloat(payoutForm.amount),
          cryptoCurrency: payoutForm.cryptoCurrency,
          walletAddress: payoutForm.walletAddress,
          adminNotes: payoutForm.adminNotes
        })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Payout created successfully!' })
        setShowPayoutModal(false)
        setPayoutForm({ userId: '', userEmail: '', amount: '', cryptoCurrency: 'USDT', walletAddress: '', adminNotes: '' })
        fetchPayouts()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create payout' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating payout' })
    }
    setPayoutLoading(false)
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const payload = {
        ...config
      }
      
      // Only include merchantApiKey if it has a value
      if (credentials.merchantApiKey) {
        payload.merchantApiKey = credentials.merchantApiKey
      }

      const res = await fetch(`${API_URL}/oxapay/admin/config`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Configuration saved successfully!' })
        fetchConfig()
        // Clear credential field after save
        setCredentials({ merchantApiKey: '' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configuration' })
    }
    setSaving(false)
  }

  const handleManualCredit = async (transactionId) => {
    if (!confirm('Are you sure you want to manually credit this transaction?')) return
    
    try {
      const res = await fetch(`${API_URL}/oxapay/admin/manual-credit/${transactionId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes: 'Manually credited by admin' })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Transaction credited successfully!' })
        fetchTransactions()
        fetchStats()
      } else {
        setMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error crediting transaction' })
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-500',
      processing: 'bg-blue-500/20 text-blue-500',
      success: 'bg-green-500/20 text-green-500',
      failed: 'bg-red-500/20 text-red-500',
      expired: 'bg-gray-500/20 text-gray-500',
      cancelled: 'bg-gray-500/20 text-gray-500'
    }
    return styles[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} />
      case 'failed': return <XCircle size={14} />
      case 'pending': return <Clock size={14} />
      case 'processing': return <RefreshCw size={14} className="animate-spin" />
      default: return <Clock size={14} />
    }
  }

  return (
    <AdminLayout title="oxapay Payment Gateway">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Bitcoin size={24} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">oxapay Gateway</h1>
              <p className="text-gray-400 text-sm">Crypto payment gateway configuration</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
            {config.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <ArrowUpRight size={20} className="text-green-500" />
              </div>
              <span className="text-gray-400 text-sm">Total Deposits</span>
            </div>
            <p className="text-2xl font-bold text-white">${stats.totalDeposits?.totalAmount?.toFixed(2) || '0.00'}</p>
            <p className="text-gray-500 text-xs">{stats.totalDeposits?.count || 0} transactions</p>
          </div>
          
          <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-blue-500" />
              </div>
              <span className="text-gray-400 text-sm">Today's Deposits</span>
            </div>
            <p className="text-2xl font-bold text-white">${stats.todayDeposits?.totalAmount?.toFixed(2) || '0.00'}</p>
            <p className="text-gray-500 text-xs">{stats.todayDeposits?.count || 0} transactions</p>
          </div>
          
          <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-yellow-500" />
              </div>
              <span className="text-gray-400 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.byStatus?.find(s => s._id === 'pending')?.count || 0}
            </p>
            <p className="text-gray-500 text-xs">awaiting payment</p>
          </div>
          
          <div className="bg-dark-800 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle size={20} className="text-red-500" />
              </div>
              <span className="text-gray-400 text-sm">Failed</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stats.byStatus?.find(s => s._id === 'failed')?.count || 0}
            </p>
            <p className="text-gray-500 text-xs">failed transactions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['config', 'withdrawals', 'transactions', 'payouts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                activeTab === tab 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-dark-700 text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'config' ? 'Configuration' : tab === 'transactions' ? 'Deposits' : tab === 'withdrawals' ? 'Withdrawal Requests' : 'Payouts'}
              {tab === 'withdrawals' && pendingWithdrawals > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingWithdrawals}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <div className="bg-dark-800 rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Settings size={18} /> General Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Enable Gateway</p>
                    <p className="text-gray-500 text-sm">Allow users to deposit via oxapay</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.isActive ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Enable Deposits</p>
                    <p className="text-gray-500 text-sm">Allow deposit transactions</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, depositEnabled: !config.depositEnabled })}
                    className={`w-12 h-6 rounded-full transition-colors ${config.depositEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${config.depositEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Min Deposit ($)</label>
                    <input
                      type="number"
                      value={config.minDeposit}
                      onChange={(e) => setConfig({ ...config, minDeposit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Max Deposit ($)</label>
                    <input
                      type="number"
                      value={config.maxDeposit}
                      onChange={(e) => setConfig({ ...config, maxDeposit: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Deposit Fee (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={config.depositFeePercent}
                      onChange={(e) => setConfig({ ...config, depositFeePercent: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Fixed Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.depositFeeFixed}
                      onChange={(e) => setConfig({ ...config, depositFeeFixed: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* API Credentials */}
            <div className="bg-dark-800 rounded-xl p-6 border border-gray-800">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield size={18} /> API Credentials
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    Merchant API Key {config.hasMerchantApiKey && <span className="text-green-500">(configured)</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={credentials.merchantApiKey}
                      onChange={(e) => setCredentials({ ...credentials, merchantApiKey: e.target.value })}
                      placeholder={config.hasMerchantApiKey ? '••••••••••••••••' : 'Enter Merchant API Key'}
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white pr-10"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs mt-1">
                    Get this from your Oxapay merchant dashboard. Used for both deposits and withdrawals.
                  </p>
                  <button
                    onClick={handleValidateApiKey}
                    disabled={validatingKey || !credentials.merchantApiKey}
                    className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {validatingKey ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
                    {validatingKey ? 'Validating...' : 'Validate API Key'}
                  </button>
                </div>

                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-yellow-500 font-medium">Webhook URL</p>
                      <p className="text-gray-400 mt-1">Configure this URL in your Oxapay dashboard:</p>
                      <code className="block mt-1 p-2 bg-dark-900 rounded text-xs text-green-400 break-all">
                        https://api.hcfinvest.com/api/oxapay/webhook
                      </code>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield size={16} className="text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-blue-500 font-medium">Security Note</p>
                      <p className="text-gray-400 mt-1">
                        Webhook signatures are verified using HMAC-SHA512 with your Merchant API Key.
                        Ensure your webhook URL is configured correctly in Oxapay dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="lg:col-span-2">
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="w-full py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* Withdrawal Requests Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-dark-800 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Pending Withdrawal Requests</h3>
                <p className="text-gray-500 text-sm">{pendingWithdrawals} requests awaiting approval</p>
              </div>
              <button
                onClick={fetchWithdrawalRequests}
                className="px-3 py-2 bg-dark-700 text-gray-400 rounded-lg hover:text-white"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Date</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">User</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Amount</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Crypto</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Wallet Address</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalLoading ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <RefreshCw size={24} className="text-gray-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : withdrawalRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        No pending withdrawal requests
                      </td>
                    </tr>
                  ) : (
                    withdrawalRequests.map(req => (
                      <tr key={req._id} className="border-b border-gray-800 hover:bg-dark-700/50">
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white text-sm">{req.userId?.firstName || 'Unknown'}</p>
                          <p className="text-gray-500 text-xs">{req.userId?.email || ''}</p>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          ${req.amount?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {req.cryptoCurrency || 'USDT'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-400 text-xs font-mono truncate max-w-[150px]" title={req.paymentAddress}>
                            {req.paymentAddress}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(req._id)}
                              className="px-3 py-1 bg-green-500/20 text-green-500 rounded text-xs hover:bg-green-500/30"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(req._id)}
                              className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-xs hover:bg-red-500/30"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-dark-800 rounded-xl border border-gray-800">
            {/* Filters */}
            <div className="p-4 border-b border-gray-700 flex items-center gap-4">
              <select
                value={txFilter}
                onChange={(e) => { setTxFilter(e.target.value); setTxPage(1) }}
                className="px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
              <button
                onClick={fetchTransactions}
                className="px-3 py-2 bg-dark-700 text-gray-400 rounded-lg hover:text-white"
              >
                <RefreshCw size={18} />
              </button>
              <span className="text-gray-500 text-sm ml-auto">{txTotal} total transactions</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Date</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">User</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Amount</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Crypto</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Credited</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {txLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8">
                        <RefreshCw size={24} className="text-gray-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx._id} className="border-b border-gray-800 hover:bg-dark-700/50">
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white text-sm">{tx.userId?.firstName || 'Unknown'}</p>
                          <p className="text-gray-500 text-xs">{tx.userId?.email || ''}</p>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          ${tx.amount?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {tx.cryptoCurrency || '-'}
                          {tx.cryptoAmount > 0 && <span className="block text-xs">{tx.cryptoAmount}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tx.status)}`}>
                            {getStatusIcon(tx.status)}
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {tx.walletCredited ? (
                            <span className="text-green-500 flex items-center gap-1">
                              <Check size={14} /> Yes
                            </span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!tx.walletCredited && tx.status !== 'failed' && tx.status !== 'expired' && (
                            <button
                              onClick={() => handleManualCredit(tx._id)}
                              className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs hover:bg-green-500/30"
                            >
                              Credit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {txTotal > 20 && (
              <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                <button
                  onClick={() => setTxPage(p => Math.max(1, p - 1))}
                  disabled={txPage === 1}
                  className="px-3 py-1 bg-dark-700 text-gray-400 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-500 text-sm">
                  Page {txPage} of {Math.ceil(txTotal / 20)}
                </span>
                <button
                  onClick={() => setTxPage(p => p + 1)}
                  disabled={txPage >= Math.ceil(txTotal / 20)}
                  className="px-3 py-1 bg-dark-700 text-gray-400 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="bg-dark-800 rounded-xl border border-gray-800">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold">Crypto Payouts</h3>
                <p className="text-gray-500 text-sm">Total paid: ${stats.totalPayouts?.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
              >
                <ArrowDownRight size={18} /> New Payout
              </button>
            </div>

            {/* Payouts Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Date</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">User</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Amount</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Wallet Address</th>
                    <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutLoading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8">
                        <RefreshCw size={24} className="text-gray-500 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        No payouts yet
                      </td>
                    </tr>
                  ) : (
                    payouts.map(payout => (
                      <tr key={payout._id} className="border-b border-gray-800 hover:bg-dark-700/50">
                        <td className="py-3 px-4 text-gray-400 text-sm">
                          {new Date(payout.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white text-sm">{payout.userId?.firstName || 'Unknown'}</p>
                          <p className="text-gray-500 text-xs">{payout.userId?.email || ''}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-white font-medium">${payout.amount?.toFixed(2)}</p>
                          {payout.cryptoAmount > 0 && (
                            <p className="text-gray-500 text-xs">{payout.cryptoAmount} {payout.cryptoCurrency}</p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-gray-400 text-xs font-mono truncate max-w-[200px]" title={payout.paymentAddress}>
                            {payout.paymentAddress}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(payout.status)}`}>
                            {getStatusIcon(payout.status)}
                            {payout.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payout Modal */}
        {showPayoutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-white font-semibold">Create Crypto Payout</h3>
                <button onClick={() => setShowPayoutModal(false)} className="p-2 hover:bg-dark-700 rounded-lg">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Search User</label>
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); searchUsers(e.target.value) }}
                    placeholder="Search by email or name..."
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                  />
                  {users.length > 0 && (
                    <div className="mt-1 bg-dark-700 border border-gray-600 rounded-lg max-h-32 overflow-y-auto">
                      {users.map(user => (
                        <button
                          key={user._id}
                          onClick={() => {
                            setPayoutForm({ ...payoutForm, userId: user._id, userEmail: user.email })
                            setUserSearch(user.email)
                            setUsers([])
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-dark-600 text-sm"
                        >
                          <span className="text-white">{user.firstName}</span>
                          <span className="text-gray-500 ml-2">{user.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {payoutForm.userId && (
                    <p className="text-green-500 text-xs mt-1">Selected: {payoutForm.userEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Amount (USD)</label>
                  <input
                    type="number"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Cryptocurrency</label>
                  <select
                    value={payoutForm.cryptoCurrency}
                    onChange={(e) => setPayoutForm({ ...payoutForm, cryptoCurrency: e.target.value })}
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="USDT">USDT (Tether)</option>
                    <option value="BTC">BTC (Bitcoin)</option>
                    <option value="ETH">ETH (Ethereum)</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Wallet Address</label>
                  <input
                    type="text"
                    value={payoutForm.walletAddress}
                    onChange={(e) => setPayoutForm({ ...payoutForm, walletAddress: e.target.value })}
                    placeholder="Enter recipient wallet address"
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Notes (Optional)</label>
                  <input
                    type="text"
                    value={payoutForm.adminNotes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, adminNotes: e.target.value })}
                    placeholder="Admin notes..."
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowPayoutModal(false)}
                    className="flex-1 py-3 bg-dark-700 text-gray-400 rounded-lg hover:bg-dark-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePayout}
                    disabled={payoutLoading || !payoutForm.userId || !payoutForm.amount || !payoutForm.walletAddress}
                    className="flex-1 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    {payoutLoading ? 'Processing...' : 'Send Payout'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminOxapay
