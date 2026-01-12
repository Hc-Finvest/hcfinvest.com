import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  User,
  Wallet,
  Users,
  Copy,
  UserCircle,
  HelpCircle,
  FileText,
  LogOut,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  X,
  Check,
  Clock,
  XCircle,
  Building,
  Smartphone,
  QrCode,
  Trophy,
  ArrowRightLeft,
  Send,
  Download,
  ArrowLeft,
  Home
} from 'lucide-react'

const API_URL = 'http://localhost:5001/api'

const WalletPage = () => {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('Wallet')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [amount, setAmount] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Account', icon: User, path: '/account' },
    { name: 'Wallet', icon: Wallet, path: '/wallet' },
    { name: 'IB', icon: Users, path: '/ib' },
    { name: 'Copytrade', icon: Copy, path: '/copytrade' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
    { name: 'Support', icon: HelpCircle, path: '/support' },
    { name: 'Instructions', icon: FileText, path: '/instructions' },
  ]

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchChallengeStatus()
    if (user._id) {
      fetchWallet()
      fetchTransactions()
    }
    fetchPaymentMethods()
  }, [user._id])

  const fetchChallengeStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/prop/status`)
      const data = await res.json()
      if (data.success) {
        setChallengeModeEnabled(data.enabled)
      }
    } catch (error) {
      console.error('Error fetching challenge status:', error)
    }
  }

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/${user._id}`)
      const data = await res.json()
      setWallet(data.wallet)
    } catch (error) {
      console.error('Error fetching wallet:', error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/wallet/transactions/${user._id}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
    setLoading(false)
  }

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods`)
      const data = await res.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  const handleDeposit = async () => {
    if (!user._id) {
      setError('Please login to make a deposit')
      return
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!selectedPaymentMethod) {
      setError('Please select a payment method')
      return
    }

    try {
      const res = await fetch(`${API_URL}/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          amount: parseFloat(amount),
          paymentMethod: selectedPaymentMethod.type,
          transactionRef
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        setSuccess('Deposit request submitted successfully!')
        setShowDepositModal(false)
        setAmount('')
        setTransactionRef('')
        setSelectedPaymentMethod(null)
        fetchWallet()
        fetchTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to create deposit')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      setError('Error submitting deposit. Please try again.')
    }
  }

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!selectedPaymentMethod) {
      setError('Please select a payment method')
      return
    }
    if (wallet && parseFloat(amount) > wallet.balance) {
      setError('Insufficient balance')
      return
    }

    try {
      const res = await fetch(`${API_URL}/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          amount: parseFloat(amount),
          paymentMethod: selectedPaymentMethod.type
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        setSuccess('Withdrawal request submitted successfully!')
        setShowWithdrawModal(false)
        setAmount('')
        setSelectedPaymentMethod(null)
        fetchWallet()
        fetchTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error submitting withdrawal')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/user/login')
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': 
      case 'Completed': 
        return <Check size={16} className="text-green-500" />
      case 'Rejected': return <XCircle size={16} className="text-red-500" />
      default: return <Clock size={16} className="text-yellow-500" />
    }
  }

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'Bank Transfer': return <Building size={18} />
      case 'UPI': return <Smartphone size={18} />
      case 'QR Code': return <QrCode size={18} />
      default: return <Wallet size={18} />
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-dark-800 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/mobile')} className="p-2 -ml-2 hover:bg-dark-700 rounded-lg">
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-white font-semibold text-lg flex-1">Wallet</h1>
          <button onClick={() => navigate('/mobile')} className="p-2 hover:bg-dark-700 rounded-lg">
            <Home size={20} className="text-gray-400" />
          </button>
        </header>
      )}

      {/* Collapsible Sidebar - Hidden on Mobile */}
      {!isMobile && (
        <aside 
          className={`${sidebarExpanded ? 'w-48' : 'w-16'} bg-dark-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div className="p-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-accent-green rounded flex items-center justify-center">
              <span className="text-black font-bold text-sm">⟨X</span>
            </div>
          </div>

          <nav className="flex-1 px-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeMenu === item.name 
                    ? 'bg-accent-green text-black' 
                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
                title={!sidebarExpanded ? item.name : ''}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
              </button>
            ))}
          </nav>

          <div className="p-2 border-t border-gray-800">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white transition-colors rounded-lg"
              title={!sidebarExpanded ? 'Log Out' : ''}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Log Out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}>
        {!isMobile && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <div>
              <h1 className="text-xl font-semibold text-white">Wallet</h1>
              <p className="text-gray-500 text-sm">Manage your funds</p>
            </div>
          </header>
        )}

        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500 flex items-center gap-2 text-sm">
              <Check size={18} /> {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Wallet Balance Card */}
          <div className={`bg-dark-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} border border-gray-800 mb-4`}>
            <div className={`${isMobile ? '' : 'flex items-center justify-between'}`}>
              <div>
                <p className="text-gray-500 text-sm mb-1">Available Balance</p>
                <p className={`text-white font-bold ${isMobile ? 'text-2xl' : 'text-4xl'}`}>${wallet?.balance?.toLocaleString() || '0.00'}</p>
                <div className={`flex ${isMobile ? 'gap-4' : 'gap-6'} mt-3`}>
                  <div>
                    <p className="text-gray-500 text-xs">Pending Deposits</p>
                    <p className="text-yellow-500 font-medium text-sm">${wallet?.pendingDeposits?.toLocaleString() || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Pending Withdrawals</p>
                    <p className="text-orange-500 font-medium text-sm">${wallet?.pendingWithdrawals?.toLocaleString() || '0.00'}</p>
                  </div>
                </div>
              </div>
              <div className={`flex gap-2 ${isMobile ? 'mt-4' : ''}`}>
                <button
                  onClick={() => {
                    setShowDepositModal(true)
                    setError('')
                  }}
                  className={`flex items-center gap-2 bg-accent-green text-black font-medium ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} rounded-lg hover:bg-accent-green/90 transition-colors`}
                >
                  <ArrowDownCircle size={isMobile ? 16 : 20} /> Deposit
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawModal(true)
                    setError('')
                  }}
                  className={`flex items-center gap-2 bg-dark-700 text-white font-medium ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} rounded-lg hover:bg-dark-600 transition-colors border border-gray-700`}
                >
                  <ArrowUpCircle size={isMobile ? 16 : 20} /> Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className={`bg-dark-800 rounded-xl ${isMobile ? 'p-4' : 'p-5'} border border-gray-800`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">Transaction History</h2>
              <button 
                onClick={fetchTransactions}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={24} className="text-gray-500 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet size={48} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Type</th>
                      <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Amount</th>
                      <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Method</th>
                      <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                      <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="border-b border-gray-800">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {tx.type === 'Deposit' && <ArrowDownCircle size={18} className="text-green-500" />}
                            {tx.type === 'Withdrawal' && <ArrowUpCircle size={18} className="text-red-500" />}
                            {tx.type === 'Transfer_To_Account' && <Send size={18} className="text-blue-500" />}
                            {tx.type === 'Transfer_From_Account' && <Download size={18} className="text-purple-500" />}
                            <div>
                              <span className="text-white">
                                {tx.type === 'Transfer_To_Account' ? 'To Trading Account' : 
                                 tx.type === 'Transfer_From_Account' ? 'From Trading Account' : 
                                 tx.type}
                              </span>
                              {tx.tradingAccountName && (
                                <p className="text-gray-500 text-xs">{tx.tradingAccountName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 px-4 font-medium ${
                          tx.type === 'Deposit' || tx.type === 'Transfer_From_Account' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {tx.type === 'Deposit' || tx.type === 'Transfer_From_Account' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-gray-400">
                          {tx.type === 'Transfer_To_Account' || tx.type === 'Transfer_From_Account' ? 'Internal' : tx.paymentMethod}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(tx.status)}
                            <span className={`${
                              tx.status === 'Approved' || tx.status === 'Completed' ? 'text-green-500' :
                              tx.status === 'Rejected' ? 'text-red-500' :
                              'text-yellow-500'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-400 text-sm">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Deposit Funds</h3>
              <button 
                onClick={() => {
                  setShowDepositModal(false)
                  setAmount('')
                  setTransactionRef('')
                  setSelectedPaymentMethod(null)
                  setError('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method._id}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`p-4 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                      selectedPaymentMethod?._id === method._id
                        ? 'border-accent-green bg-accent-green/10'
                        : 'border-gray-700 bg-dark-700 hover:border-gray-600'
                    }`}
                  >
                    {getPaymentIcon(method.type)}
                    <span className="text-white text-sm">{method.type}</span>
                  </button>
                ))}
              </div>
              {paymentMethods.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No payment methods available</p>
              )}
            </div>

            {selectedPaymentMethod && (
              <div className="mb-4 p-4 bg-dark-700 rounded-lg">
                {selectedPaymentMethod.type === 'Bank Transfer' && (
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-400">Bank: <span className="text-white">{selectedPaymentMethod.bankName}</span></p>
                    <p className="text-gray-400">Account: <span className="text-white">{selectedPaymentMethod.accountNumber}</span></p>
                    <p className="text-gray-400">Name: <span className="text-white">{selectedPaymentMethod.accountHolderName}</span></p>
                    <p className="text-gray-400">IFSC: <span className="text-white">{selectedPaymentMethod.ifscCode}</span></p>
                  </div>
                )}
                {selectedPaymentMethod.type === 'UPI' && (
                  <p className="text-gray-400">UPI ID: <span className="text-white">{selectedPaymentMethod.upiId}</span></p>
                )}
                {selectedPaymentMethod.type === 'QR Code' && selectedPaymentMethod.qrCodeImage && (
                  <img src={selectedPaymentMethod.qrCodeImage} alt="QR Code" className="mx-auto max-w-48" />
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Transaction Reference (Optional)</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter transaction ID or reference"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDepositModal(false)
                  setAmount('')
                  setTransactionRef('')
                  setSelectedPaymentMethod(null)
                  setError('')
                }}
                className="flex-1 bg-dark-700 text-white py-3 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                className="flex-1 bg-accent-green text-black font-medium py-3 rounded-lg hover:bg-accent-green/90 transition-colors"
              >
                Submit Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-6 w-full max-w-lg border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-semibold text-lg">Withdraw Funds</h3>
              <button 
                onClick={() => {
                  setShowWithdrawModal(false)
                  setAmount('')
                  setSelectedPaymentMethod(null)
                  setError('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-2 p-3 bg-dark-700 rounded-lg">
              <p className="text-gray-400 text-sm">Available Balance</p>
              <p className="text-white text-xl font-bold">${wallet?.balance?.toLocaleString() || '0.00'}</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Withdrawal Method</label>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method._id}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={`p-4 rounded-lg border transition-colors flex flex-col items-center gap-2 ${
                      selectedPaymentMethod?._id === method._id
                        ? 'border-accent-green bg-accent-green/10'
                        : 'border-gray-700 bg-dark-700 hover:border-gray-600'
                    }`}
                  >
                    {getPaymentIcon(method.type)}
                    <span className="text-white text-sm">{method.type}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setAmount('')
                  setSelectedPaymentMethod(null)
                  setError('')
                }}
                className="flex-1 bg-dark-700 text-white py-3 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 bg-accent-green text-black font-medium py-3 rounded-lg hover:bg-accent-green/90 transition-colors"
              >
                Submit Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletPage
