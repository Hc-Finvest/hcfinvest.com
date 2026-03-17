import { API_URL } from '../config/api'
import { useState, useEffect, useRef } from 'react'
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
  Home,
  Upload,
  Image,
  BookOpen,
  Sun,
  Moon,
  Bitcoin,
  ExternalLink
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

const WalletPage = () => {
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [activeMenu, setActiveMenu] = useState('Wallet')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showPaymentMethodsView, setShowPaymentMethodsView] = useState(false)
  const [showBankTransferModal, setShowBankTransferModal] = useState(false)
  const [showUPIModal, setShowUPIModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null)
  const [bankDetails, setBankDetails] = useState(null)
  const [upiDetails, setUpiDetails] = useState(null)
  const [amount, setAmount] = useState('')
  const [transactionRef, setTransactionRef] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false)
  const [currencies, setCurrencies] = useState([])
  const [selectedCurrency, setSelectedCurrency] = useState(null)
  const [localAmount, setLocalAmount] = useState('')
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const fileInputRef = useRef(null)
  
  // Oxapay state
  const [oxapayAvailable, setOxapayAvailable] = useState(false)
  const [oxapayConfig, setOxapayConfig] = useState(null)
  const [showOxapayModal, setShowOxapayModal] = useState(false)
  const [oxapayAmount, setOxapayAmount] = useState('')
  const [oxapayLoading, setOxapayLoading] = useState(false)
  const [oxapayPayment, setOxapayPayment] = useState(null)
  
  // Crypto withdrawal state
  const [cryptoWithdrawAvailable, setCryptoWithdrawAvailable] = useState(false)
  const [cryptoWithdrawConfig, setCryptoWithdrawConfig] = useState(null)
  const [showCryptoWithdrawModal, setShowCryptoWithdrawModal] = useState(false)
  const [cryptoWithdrawForm, setCryptoWithdrawForm] = useState({
    amount: '',
    cryptoCurrency: 'USDT',
    walletAddress: ''
  })
  const [cryptoWithdrawLoading, setCryptoWithdrawLoading] = useState(false)

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Account', icon: User, path: '/account' },
    { name: 'Wallet', icon: Wallet, path: '/wallet' },
    { name: 'Orders', icon: BookOpen, path: '/orders' },
    { name: 'IB', icon: Users, path: '/ib' },
    { name: 'Copytrade', icon: Copy, path: '/copytrade' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
    { name: 'Support', icon: HelpCircle, path: '/support' },
  ]

  // Handle screenshot file selection
  const handleScreenshotChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Screenshot must be less than 5MB')
        return
      }
      setScreenshot(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setScreenshotPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Download transactions as CSV
  const downloadTransactionsCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Method', 'Status', 'Reference']
    const rows = transactions.map(tx => [
      new Date(tx.createdAt).toLocaleString(),
      tx.type,
      tx.amount.toFixed(2),
      tx.paymentMethod || 'Internal',
      tx.status,
      tx.transactionRef || '-'
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Redirect to login if user not authenticated
    if (!user || !user._id) {
      navigate('/user/login')
      return
    }
    
    fetchChallengeStatus()
    fetchWallet()
    fetchTransactions()
    fetchPaymentMethods()
    fetchCurrencies()
    fetchOxapayStatus()
    fetchCryptoWithdrawStatus()
    fetchBankAndUPIDetails()
  }, [user._id])

  // Fetch bank and UPI details for deposit
  const fetchBankAndUPIDetails = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods`)
      const data = await res.json()
      const methods = data.paymentMethods || []
      
      // Find bank transfer details
      const bank = methods.find(m => m.type === 'Bank Transfer' && m.isActive)
      if (bank) setBankDetails(bank)
      
      // Find UPI details (including QR code)
      const upi = methods.find(m => (m.type === 'UPI' || m.type === 'QR Code') && m.isActive)
      if (upi) setUpiDetails(upi)
    } catch (error) {
      console.error('Error fetching payment details:', error)
    }
  }

  // Check Oxapay deposit availability
  const fetchOxapayStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/oxapay/status`)
      const data = await res.json()
      if (data.success && data.available) {
        setOxapayAvailable(true)
        setOxapayConfig(data)
      }
    } catch (error) {
      console.error('Oxapay status check failed:', error)
    }
  }

  // Check Crypto withdrawal availability
  const fetchCryptoWithdrawStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/oxapay/withdraw/status`)
      const data = await res.json()
      if (data.success && data.available) {
        setCryptoWithdrawAvailable(true)
        setCryptoWithdrawConfig(data)
      }
    } catch (error) {
      console.error('Crypto withdraw status check failed:', error)
    }
  }

  // Handle Crypto withdrawal request
  const handleCryptoWithdraw = async () => {
    if (!cryptoWithdrawForm.amount || parseFloat(cryptoWithdrawForm.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!cryptoWithdrawForm.walletAddress) {
      setError('Please enter your wallet address')
      return
    }

    const amount = parseFloat(cryptoWithdrawForm.amount)
    
    if (cryptoWithdrawConfig?.minWithdrawal && amount < cryptoWithdrawConfig.minWithdrawal) {
      setError(`Minimum withdrawal is $${cryptoWithdrawConfig.minWithdrawal}`)
      return
    }
    if (cryptoWithdrawConfig?.maxWithdrawal && amount > cryptoWithdrawConfig.maxWithdrawal) {
      setError(`Maximum withdrawal is $${cryptoWithdrawConfig.maxWithdrawal}`)
      return
    }
    if (amount > (wallet?.balance || 0)) {
      setError('Insufficient balance')
      return
    }

    setCryptoWithdrawLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/oxapay/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          amount,
          cryptoCurrency: cryptoWithdrawForm.cryptoCurrency,
          walletAddress: cryptoWithdrawForm.walletAddress
        })
      })

      const data = await res.json()
      if (data.success) {
        setSuccess('Withdrawal request submitted! Pending approval.')
        setShowCryptoWithdrawModal(false)
        setCryptoWithdrawForm({ amount: '', cryptoCurrency: 'USDT', walletAddress: '' })
        fetchWallet()
        fetchTransactions()
      } else {
        setError(data.message || 'Failed to submit withdrawal request')
      }
    } catch (error) {
      setError('Error submitting withdrawal request')
    }
    setCryptoWithdrawLoading(false)
  }

  // Handle Oxapay deposit
  const handleOxapayDeposit = async () => {
    // Validate user is logged in
    if (!user || !user._id) {
      setError('Please login to continue')
      navigate('/user/login')
      return
    }

    if (!oxapayAmount || parseFloat(oxapayAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    const amount = parseFloat(oxapayAmount)
    if (oxapayConfig?.minDeposit && amount < oxapayConfig.minDeposit) {
      setError(`Minimum deposit is $${oxapayConfig.minDeposit}`)
      return
    }
    if (oxapayConfig?.maxDeposit && amount > oxapayConfig.maxDeposit) {
      setError(`Maximum deposit is $${oxapayConfig.maxDeposit}`)
      return
    }

    setOxapayLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Session expired. Please login again.')
        navigate('/user/login')
        return
      }

      const res = await fetch(`${API_URL}/oxapay/deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          amount: amount,
          currency: 'USD',
          cryptoCurrency: 'USDT'
        })
      })

      const data = await res.json()
      if (data.success) {
        setOxapayPayment(data.transaction)
        setSuccess('Payment request created! Complete the payment using the link below.')
      } else {
        setError(data.message || 'Failed to create payment request')
      }
    } catch (error) {
      setError(error.message || 'Error creating payment request. Please try again.')
    }
    setOxapayLoading(false)
  }

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${API_URL}/payment-methods/currencies/active`)
      const data = await res.json()
      setCurrencies(data.currencies || [])
      // Set USD as default if no currencies
      if (!data.currencies || data.currencies.length === 0) {
        setSelectedCurrency({ currency: 'USD', symbol: '$', rateToUSD: 1, markup: 0 })
      }
    } catch (error) {
      console.error('Error fetching currencies:', error)
    }
  }

  // Calculate USD amount from local currency
  const calculateUSDAmount = (localAmt, currency) => {
    if (!currency || currency.currency === 'USD') return localAmt
    const effectiveRate = currency.rateToUSD * (1 + (currency.markup || 0) / 100)
    return localAmt / effectiveRate
  }

  // Calculate local amount from USD
  const calculateLocalAmount = (usdAmt, currency) => {
    if (!currency || currency.currency === 'USD') return usdAmt
    const effectiveRate = currency.rateToUSD * (1 + (currency.markup || 0) / 100)
    return usdAmt * effectiveRate
  }

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
    if (!localAmount || parseFloat(localAmount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!selectedPaymentMethod) {
      setError('Please select a payment method')
      return
    }

    // Calculate USD amount from local currency
    const usdAmount = selectedCurrency && selectedCurrency.currency !== 'USD'
      ? calculateUSDAmount(parseFloat(localAmount), selectedCurrency)
      : parseFloat(localAmount)

    try {
      setUploadingScreenshot(true)
      
      // Upload screenshot first if provided
      let screenshotUrl = null
      if (screenshot) {
        const formData = new FormData()
        formData.append('screenshot', screenshot)
        formData.append('userId', user._id)
        
        const uploadRes = await fetch(`${API_URL}/upload/screenshot`, {
          method: 'POST',
          body: formData
        })
        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          screenshotUrl = uploadData.url
        }
      }

      const res = await fetch(`${API_URL}/wallet/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          amount: usdAmount,
          localAmount: parseFloat(localAmount),
          currency: selectedCurrency?.currency || 'USD',
          currencySymbol: selectedCurrency?.symbol || '$',
          exchangeRate: selectedCurrency?.rateToUSD || 1,
          markup: selectedCurrency?.markup || 0,
          paymentMethod: selectedPaymentMethod.type,
          transactionRef,
          screenshot: screenshotUrl || screenshotPreview
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        setSuccess('Deposit request submitted successfully!')
        setShowDepositModal(false)
        setShowBankTransferModal(false)
        setShowUPIModal(false)
        setShowPaymentMethodsView(false)
        setAmount('')
        setLocalAmount('')
        setTransactionRef('')
        setSelectedPaymentMethod(null)
        setSelectedCurrency(null)
        setScreenshot(null)
        setScreenshotPreview(null)
        fetchWallet()
        fetchTransactions()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message || 'Failed to create deposit')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      setError('Error submitting deposit. Please try again.')
    } finally {
      setUploadingScreenshot(false)
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
    <div className={`h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-dark-900' : 'bg-gray-100'}`}>
      {/* Mobile Header */}
      {isMobile && (
        <header className={`fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center gap-4 ${isDarkMode ? 'bg-dark-800 border-b border-gray-800' : 'bg-white border-b border-gray-200'}`}>
          <button onClick={() => navigate('/mobile')} className={`p-2 -ml-2 rounded-lg ${isDarkMode ? 'hover:bg-dark-700' : 'hover:bg-gray-100'}`}>
            <ArrowLeft size={22} className={isDarkMode ? 'text-white' : 'text-gray-900'} />
          </button>
          <h1 className={`font-semibold text-lg flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Wallet</h1>
          <button onClick={toggleDarkMode} className={`p-2 rounded-lg ${isDarkMode ? 'text-yellow-400 hover:bg-dark-700' : 'text-blue-500 hover:bg-gray-100'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => navigate('/mobile')} className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-dark-700' : 'hover:bg-gray-100'}`}>
            <Home size={20} className="text-gray-400" />
          </button>
        </header>
      )}

      {/* Collapsible Sidebar - Hidden on Mobile, Fixed */}
      {!isMobile && (
        <aside 
          className={`${sidebarExpanded ? 'w-48' : 'w-16'} ${isDarkMode ? 'bg-dark-900 border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div className="p-4 flex items-center justify-center shrink-0">
            <img src="/hcfinvest_orange_logo.png" alt="hcfinvest" className="w-8 h-8 object-contain" />
          </div>

          <nav className="flex-1 px-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeMenu === item.name 
                    ? 'bg-accent-green text-black' 
                    : isDarkMode ? 'text-gray-400 hover:text-white hover:bg-dark-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={!sidebarExpanded ? item.name : ''}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
              </button>
            ))}
          </nav>

          <div className={`p-2 border-t shrink-0 ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <button onClick={toggleDarkMode} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${isDarkMode ? 'text-yellow-400 hover:bg-dark-700' : 'text-blue-500 hover:bg-gray-100'}`}>
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              {sidebarExpanded && <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors rounded-lg ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              title={!sidebarExpanded ? 'Log Out' : ''}
            >
              <LogOut size={18} className="flex-shrink-0" />
              {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Log Out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content - Scrollable */}
      <main className={`flex-1 overflow-y-auto ${isMobile ? 'pt-14' : ''}`}>
        {!isMobile && (
          <header className={`flex items-center justify-between px-6 py-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div>
              <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Wallet</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Manage your funds</p>
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
          <div className={`${isDarkMode ? 'bg-dark-800 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} rounded-xl ${isMobile ? 'p-4' : 'p-6'} border mb-4`}>
            <div className={`${isMobile ? '' : 'flex items-center justify-between'}`}>
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Available Balance</p>
                <p className={`font-bold ${isMobile ? 'text-2xl' : 'text-4xl'} ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${wallet?.balance?.toLocaleString() || '0.00'}</p>
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
              <div className={`flex gap-2 ${isMobile ? 'mt-4 flex-wrap' : ''}`}>
                <button
                  onClick={() => {
                    setShowPaymentMethodsView(true)
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
                  className={`flex items-center gap-2 font-medium ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} rounded-lg transition-colors border ${isDarkMode ? 'bg-dark-700 text-white hover:bg-dark-600 border-gray-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300'}`}
                >
                  <ArrowUpCircle size={isMobile ? 16 : 20} /> Withdraw
                </button>
                {cryptoWithdrawAvailable && (
                  <button
                    onClick={() => {
                      setShowCryptoWithdrawModal(true)
                      setCryptoWithdrawForm({ amount: '', cryptoCurrency: 'USDT', walletAddress: '' })
                      setError('')
                    }}
                    className={`flex items-center gap-2 bg-purple-600 text-white font-medium ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'} rounded-lg hover:bg-purple-700 transition-colors`}
                  >
                    <Bitcoin size={isMobile ? 16 : 20} /> Crypto Withdraw
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className={`${isDarkMode ? 'bg-dark-800 border-gray-800' : 'bg-white border-gray-200 shadow-sm'} rounded-xl ${isMobile ? 'p-4' : 'p-5'} border`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Transaction History</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={downloadTransactionsCSV}
                  disabled={transactions.length === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 ${isDarkMode ? 'bg-dark-700 hover:bg-dark-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                >
                  <Download size={14} /> Download
                </button>
                <button 
                  onClick={fetchTransactions}
                  className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
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
                            {tx.type === 'Account_Transfer_Out' && <ArrowUpCircle size={18} className="text-orange-500" />}
                            {tx.type === 'Account_Transfer_In' && <ArrowDownCircle size={18} className="text-teal-500" />}
                            <div>
                              <span className="text-white">
                                {tx.type === 'Transfer_To_Account' ? 'To Trading Account' : 
                                 tx.type === 'Transfer_From_Account' ? 'From Trading Account' : 
                                 tx.type === 'Account_Transfer_Out' ? 'Account Transfer (Out)' :
                                 tx.type === 'Account_Transfer_In' ? 'Account Transfer (In)' :
                                 tx.type}
                              </span>
                              {tx.tradingAccountName && (
                                <p className="text-gray-500 text-xs">{tx.tradingAccountName}</p>
                              )}
                              {tx.type === 'Account_Transfer_Out' && tx.toTradingAccountName && (
                                <p className="text-gray-500 text-xs">→ {tx.toTradingAccountName}</p>
                              )}
                              {tx.type === 'Account_Transfer_In' && tx.fromTradingAccountName && (
                                <p className="text-gray-500 text-xs">← {tx.fromTradingAccountName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`py-4 px-4 font-medium ${
                          tx.type === 'Deposit' || tx.type === 'Transfer_From_Account' || tx.type === 'Account_Transfer_In' ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {tx.type === 'Deposit' || tx.type === 'Transfer_From_Account' || tx.type === 'Account_Transfer_In' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-gray-400">
                          {tx.type === 'Transfer_To_Account' || tx.type === 'Transfer_From_Account' || tx.type === 'Account_Transfer_Out' || tx.type === 'Account_Transfer_In' ? 'Internal' : tx.paymentMethod}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-4 sm:p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
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

            {/* Currency Selection */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Select Your Currency</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-32 sm:max-h-40 overflow-y-auto p-1">
                <button
                  onClick={() => setSelectedCurrency({ currency: 'USD', symbol: '$', rateToUSD: 1, markup: 0 })}
                  className={`p-2 rounded-lg border transition-colors flex flex-col items-center gap-0.5 ${
                    !selectedCurrency || selectedCurrency.currency === 'USD'
                      ? 'border-accent-green bg-accent-green/10'
                      : 'border-gray-700 bg-dark-700 hover:border-gray-600'
                  }`}
                >
                  <span className="text-lg">$</span>
                  <span className="text-white text-[10px]">USD</span>
                </button>
                {currencies.map((curr) => (
                  <button
                    key={curr._id}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`p-2 rounded-lg border transition-colors flex flex-col items-center gap-0.5 ${
                      selectedCurrency?.currency === curr.currency
                        ? 'border-accent-green bg-accent-green/10'
                        : 'border-gray-700 bg-dark-700 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg">{curr.symbol}</span>
                    <span className="text-white text-[10px]">{curr.currency}</span>
                  </button>
                ))}
              </div>
              {currencies.length === 0 && (
                <p className="text-gray-500 text-xs mt-1">Only USD available. Admin can add more currencies.</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">
                Amount {selectedCurrency ? `(${selectedCurrency.symbol} ${selectedCurrency.currency})` : '($ USD)'}
              </label>
              <input
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                placeholder={`Enter amount in ${selectedCurrency?.currency || 'USD'}`}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
              {selectedCurrency && selectedCurrency.currency !== 'USD' && localAmount && parseFloat(localAmount) > 0 && (
                <div className="mt-2 p-3 bg-accent-green/10 rounded-lg border border-accent-green/30">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-1">You will receive</p>
                    <p className="text-green-400 font-bold text-2xl">${calculateUSDAmount(parseFloat(localAmount), selectedCurrency).toFixed(2)} USD</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Exchange Rate: 1 USD = {selectedCurrency.symbol}{(selectedCurrency.rateToUSD * (1 + (selectedCurrency.markup || 0) / 100)).toFixed(2)} {selectedCurrency.currency}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Payment Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {/* Crypto (Oxapay) Option */}
                {oxapayAvailable && (
                  <button
                    onClick={() => {
                      setShowDepositModal(false)
                      setShowOxapayModal(true)
                      setError('')
                    }}
                    className="p-4 rounded-lg border transition-colors flex flex-col items-center gap-2 border-orange-500/50 bg-orange-500/10 hover:border-orange-500 hover:bg-orange-500/20"
                  >
                    <Bitcoin size={24} className="text-orange-500" />
                    <span className="text-white text-sm">Crypto</span>
                  </button>
                )}
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
              {paymentMethods.length === 0 && !oxapayAvailable && (
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

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Transaction Reference (Optional)</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter transaction ID or reference"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
            </div>

            {/* Screenshot Upload */}
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">Payment Screenshot (Proof)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScreenshotChange}
                accept="image/*"
                className="hidden"
              />
              {screenshotPreview ? (
                <div className="relative">
                  <img 
                    src={screenshotPreview} 
                    alt="Payment Screenshot" 
                    className="w-full max-h-48 object-contain rounded-lg border border-gray-700"
                  />
                  <button
                    onClick={() => {
                      setScreenshot(null)
                      setScreenshotPreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-accent-green transition-colors flex flex-col items-center gap-2"
                >
                  <Upload size={24} className="text-gray-500" />
                  <span className="text-gray-400 text-sm">Click to upload payment screenshot</span>
                  <span className="text-gray-600 text-xs">PNG, JPG up to 5MB</span>
                </button>
              )}
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDepositModal(false)
                  setAmount('')
                  setLocalAmount('')
                  setTransactionRef('')
                  setSelectedPaymentMethod(null)
                  setSelectedCurrency(null)
                  setScreenshot(null)
                  setScreenshotPreview(null)
                  setError('')
                }}
                className="flex-1 bg-dark-700 text-white py-3 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={uploadingScreenshot}
                className="flex-1 bg-accent-green text-black font-medium py-3 rounded-lg hover:bg-accent-green/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingScreenshot ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Deposit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-4 sm:p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
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
                    className={`p-4 rounded-lg border transition-colors flex flex-col items-center justify-center gap-2 h-full min-h-[80px] ${
                      selectedPaymentMethod?._id === method._id
                        ? 'border-accent-green bg-accent-green/10'
                        : 'border-gray-700 bg-dark-700 hover:border-gray-600'
                    }`}
                  >
                    {getPaymentIcon(method.type)}
                    <span className="text-white text-sm text-center">{method.type}</span>
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

      {/* Oxapay Crypto Deposit Modal */}
      {showOxapayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Bitcoin size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Crypto Deposit</h3>
                  <p className="text-gray-500 text-xs">via Oxapay</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowOxapayModal(false)
                  setOxapayPayment(null)
                  setOxapayAmount('')
                  setError('')
                  setSuccess('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-500/20 text-green-400 rounded-lg text-sm">{success}</div>}

            {!oxapayPayment ? (
              <>
                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2">Amount (USD)</label>
                  <input
                    type="number"
                    value={oxapayAmount}
                    onChange={(e) => setOxapayAmount(e.target.value)}
                    placeholder={`Min: $${oxapayConfig?.minDeposit || 10}`}
                    className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                  />
                  {oxapayConfig && (
                    <p className="text-gray-500 text-xs mt-1">
                      Min: ${oxapayConfig.minDeposit} • Max: ${oxapayConfig.maxDeposit}
                    </p>
                  )}
                </div>

                <div className="mb-4 p-3 bg-dark-700 rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Supported Cryptocurrencies:</p>
                  <div className="flex flex-wrap gap-2">
                    {(oxapayConfig?.supportedCryptos || ['USDT', 'BTC', 'ETH', 'TRX']).map(crypto => (
                      <span key={crypto} className="px-2 py-1 bg-dark-600 text-white text-xs rounded">
                        {crypto}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowOxapayModal(false)
                      setOxapayAmount('')
                      setError('')
                    }}
                    className="flex-1 bg-dark-700 text-white py-3 rounded-lg hover:bg-dark-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleOxapayDeposit}
                    disabled={oxapayLoading || !oxapayAmount}
                    className="flex-1 bg-orange-500 text-white font-medium py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {oxapayLoading ? (
                      <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                    ) : (
                      'Continue to Payment'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={32} className="text-green-500" />
                  </div>
                  <p className="text-white font-medium">Payment Request Created</p>
                  <p className="text-gray-400 text-sm">Complete the payment using the link below</p>
                </div>

                <div className="bg-dark-700 rounded-lg p-4 mb-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Amount:</span>
                    <span className="text-white font-medium">${oxapayPayment.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Track ID:</span>
                    <span className="text-white font-medium text-xs">{oxapayPayment.trackId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Status:</span>
                    <span className="text-yellow-500 font-medium flex items-center gap-1">
                      <Clock size={14} /> Pending
                    </span>
                  </div>
                </div>

                {oxapayPayment.paymentUrl && (
                  <a
                    href={oxapayPayment.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-orange-500 text-white font-medium py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 mb-3"
                  >
                    <ExternalLink size={18} /> Open Payment Page
                  </a>
                )}

                <button
                  onClick={() => {
                    setShowOxapayModal(false)
                    setOxapayPayment(null)
                    setOxapayAmount('')
                    setSuccess('')
                    fetchWallet()
                    fetchTransactions()
                  }}
                  className="w-full bg-dark-700 text-white py-3 rounded-lg hover:bg-dark-600 transition-colors"
                >
                  Close
                </button>

                <p className="text-gray-500 text-xs text-center mt-3">
                  Your wallet will be credited automatically once payment is confirmed.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Crypto Withdrawal Modal */}
      {showCryptoWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-4 sm:p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Bitcoin size={20} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Crypto Withdrawal</h3>
                  <p className="text-gray-500 text-xs">Withdraw to your crypto wallet</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowCryptoWithdrawModal(false)
                  setCryptoWithdrawForm({ amount: '', cryptoCurrency: 'USDT', walletAddress: '' })
                  setError('')
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

            <div className="mb-4 p-3 bg-dark-700 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Available Balance:</span>
                <span className="text-white font-bold">${wallet?.balance?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Amount (USD)</label>
              <input
                type="number"
                value={cryptoWithdrawForm.amount}
                onChange={(e) => setCryptoWithdrawForm({ ...cryptoWithdrawForm, amount: e.target.value })}
                placeholder={`Min: $${cryptoWithdrawConfig?.minWithdrawal || 10}`}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {cryptoWithdrawConfig && (
                <p className="text-gray-500 text-xs mt-1">
                  Min: ${cryptoWithdrawConfig.minWithdrawal} • Max: ${cryptoWithdrawConfig.maxWithdrawal}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Cryptocurrency</label>
              <select
                value={cryptoWithdrawForm.cryptoCurrency}
                onChange={(e) => setCryptoWithdrawForm({ ...cryptoWithdrawForm, cryptoCurrency: e.target.value })}
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
                <option value="USDC">USDC</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">Your Wallet Address</label>
              <input
                type="text"
                value={cryptoWithdrawForm.walletAddress}
                onChange={(e) => setCryptoWithdrawForm({ ...cryptoWithdrawForm, walletAddress: e.target.value })}
                placeholder="Enter your crypto wallet address"
                className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm"
              />
              <p className="text-yellow-500 text-xs mt-1">⚠️ Double-check your wallet address. Incorrect addresses cannot be recovered.</p>
            </div>

            {cryptoWithdrawConfig?.requireKYC && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-500 text-sm">KYC verification required for withdrawals</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCryptoWithdrawModal(false)
                  setCryptoWithdrawForm({ amount: '', cryptoCurrency: 'USDT', walletAddress: '' })
                  setError('')
                }}
                className="flex-1 bg-dark-700 text-white py-3 rounded-lg hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCryptoWithdraw}
                disabled={cryptoWithdrawLoading || !cryptoWithdrawForm.amount || !cryptoWithdrawForm.walletAddress}
                className="flex-1 bg-purple-600 text-white font-medium py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cryptoWithdrawLoading ? (
                  <><RefreshCw size={16} className="animate-spin" /> Processing...</>
                ) : (
                  'Submit Withdrawal'
                )}
              </button>
            </div>

            <p className="text-gray-500 text-xs text-center mt-3">
              Withdrawals require admin approval and may take 1-24 hours to process.
            </p>
          </div>
        </div>
      )}

      {/* Payment Methods Selection View */}
      {showPaymentMethodsView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 w-full max-w-3xl border max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className={`font-semibold text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Choose your preferred payment option</p>
              </div>
              <button 
                onClick={() => setShowPaymentMethodsView(false)}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-dark-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <X size={20} />
              </button>
            </div>

            <div className={`${isDarkMode ? 'bg-dark-700/50' : 'bg-gray-50'} rounded-xl p-6`}>
              <h4 className={`font-medium mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Available Payment Methods</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Bank Transfer Card */}
                <div className={`${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border flex flex-col items-center text-center h-full`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                    <Building size={28} className="text-blue-500" />
                  </div>
                  <h5 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bank Transfer</h5>
                  <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Deposit using bank transfer</p>
                  <button
                    onClick={() => {
                      setShowPaymentMethodsView(false)
                      setShowBankTransferModal(true)
                      setLocalAmount('')
                      setTransactionRef('')
                      setScreenshot(null)
                      setScreenshotPreview(null)
                      setError('')
                    }}
                    disabled={!bankDetails}
                    className="w-full bg-blue-500 text-white font-medium py-2.5 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay via Bank
                  </button>
                  {!bankDetails && <p className="text-gray-500 text-xs mt-2">Not available</p>}
                </div>

                {/* UPI Payment Card */}
                <div className={`${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border flex flex-col items-center text-center h-full`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                    <QrCode size={28} className="text-green-500" />
                  </div>
                  <h5 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>UPI Payment</h5>
                  <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Pay instantly using UPI</p>
                  <button
                    onClick={() => {
                      setShowPaymentMethodsView(false)
                      setShowUPIModal(true)
                      setLocalAmount('')
                      setTransactionRef('')
                      setScreenshot(null)
                      setScreenshotPreview(null)
                      setError('')
                    }}
                    disabled={!upiDetails}
                    className="w-full bg-green-500 text-white font-medium py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay via UPI
                  </button>
                  {!upiDetails && <p className="text-gray-500 text-xs mt-2">Not available</p>}
                </div>

                {/* Crypto Payment Card */}
                <div className={`${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border flex flex-col items-center text-center h-full`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                    <Bitcoin size={28} className="text-orange-500" />
                  </div>
                  <h5 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Crypto Payment</h5>
                  <p className={`text-sm mb-4 flex-grow ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Deposit using cryptocurrency</p>
                  <button
                    onClick={() => {
                      setShowPaymentMethodsView(false)
                      setShowOxapayModal(true)
                      setOxapayAmount('')
                      setError('')
                    }}
                    disabled={!oxapayAvailable}
                    className="w-full bg-orange-500 text-white font-medium py-2.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Pay via Crypto
                  </button>
                  {!oxapayAvailable && <p className="text-gray-500 text-xs mt-2">Not available</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Transfer Modal */}
      {showBankTransferModal && bankDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 w-full max-w-md border max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <Building size={20} className="text-blue-500" />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Bank Transfer</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Transfer to our bank account</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowBankTransferModal(false)
                  setLocalAmount('')
                  setTransactionRef('')
                  setScreenshot(null)
                  setScreenshotPreview(null)
                  setError('')
                }}
                className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <X size={20} />
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

            {/* Bank Details Card */}
            <div className={`${isDarkMode ? 'bg-dark-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transfer to this account:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Bank Name</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Account Holder</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{bankDetails.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>Account Number</span>
                  <span className={`font-medium font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{bankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>IFSC Code</span>
                  <span className={`font-medium font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{bankDetails.ifscCode}</span>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount (USD)</label>
              <input
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                placeholder="Enter amount"
                className={`w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-dark-700 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border`}
              />
            </div>

            {/* Transaction Reference */}
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Transaction ID / Reference</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter bank transaction reference"
                className={`w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-dark-700 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border`}
              />
            </div>

            {/* Screenshot Upload */}
            <div className="mb-6">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Screenshot</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScreenshotChange}
                accept="image/*"
                className="hidden"
              />
              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="Screenshot" className={`w-full max-h-40 object-contain rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />
                  <button
                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center gap-2 ${isDarkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-300 hover:border-blue-500'}`}
                >
                  <Upload size={24} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upload payment screenshot</span>
                </button>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBankTransferModal(false)
                  setShowPaymentMethodsView(true)
                }}
                className={`flex-1 py-3 rounded-lg transition-colors ${isDarkMode ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
              >
                Back
              </button>
              <button
                onClick={async () => {
                  if (!localAmount || parseFloat(localAmount) <= 0) {
                    setError('Please enter a valid amount')
                    return
                  }
                  setSelectedPaymentMethod(bankDetails)
                  await handleDeposit()
                  if (!error) {
                    setShowBankTransferModal(false)
                  }
                }}
                disabled={uploadingScreenshot || !localAmount}
                className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingScreenshot ? <><RefreshCw size={16} className="animate-spin" /> Submitting...</> : 'Submit Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI Payment Modal */}
      {showUPIModal && upiDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 w-full max-w-md border max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-50'}`}>
                  <QrCode size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>UPI Payment</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Pay using UPI</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowUPIModal(false)
                  setLocalAmount('')
                  setTransactionRef('')
                  setScreenshot(null)
                  setScreenshotPreview(null)
                  setError('')
                }}
                className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <X size={20} />
              </button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">{error}</div>}

            {/* UPI Details Card */}
            <div className={`${isDarkMode ? 'bg-dark-700' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
              {upiDetails.upiId && (
                <div className="text-center mb-4">
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>UPI ID</p>
                  <p className={`font-mono font-medium text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{upiDetails.upiId}</p>
                </div>
              )}
              {upiDetails.qrCodeImage && (
                <div className="text-center">
                  <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Scan QR Code</p>
                  <img src={upiDetails.qrCodeImage} alt="UPI QR Code" className="mx-auto max-w-48 rounded-lg" />
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amount (USD)</label>
              <input
                type="number"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value)}
                placeholder="Enter amount"
                className={`w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 ${isDarkMode ? 'bg-dark-700 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border`}
              />
            </div>

            {/* UPI Transaction ID */}
            <div className="mb-4">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>UPI Transaction ID</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="Enter UPI transaction ID"
                className={`w-full rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 ${isDarkMode ? 'bg-dark-700 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border`}
              />
            </div>

            {/* Screenshot Upload */}
            <div className="mb-6">
              <label className={`block text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Screenshot (Optional)</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleScreenshotChange}
                accept="image/*"
                className="hidden"
              />
              {screenshotPreview ? (
                <div className="relative">
                  <img src={screenshotPreview} alt="Screenshot" className={`w-full max-h-40 object-contain rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />
                  <button
                    onClick={() => { setScreenshot(null); setScreenshotPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center gap-2 ${isDarkMode ? 'border-gray-700 hover:border-green-500' : 'border-gray-300 hover:border-green-500'}`}
                >
                  <Upload size={24} className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Upload payment screenshot</span>
                </button>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUPIModal(false)
                  setShowPaymentMethodsView(true)
                }}
                className={`flex-1 py-3 rounded-lg transition-colors ${isDarkMode ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
              >
                Back
              </button>
              <button
                onClick={async () => {
                  if (!localAmount || parseFloat(localAmount) <= 0) {
                    setError('Please enter a valid amount')
                    return
                  }
                  setSelectedPaymentMethod(upiDetails)
                  await handleDeposit()
                  if (!error) {
                    setShowUPIModal(false)
                  }
                }}
                disabled={uploadingScreenshot || !localAmount}
                className="flex-1 bg-green-500 text-white font-medium py-3 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingScreenshot ? <><RefreshCw size={16} className="animate-spin" /> Submitting...</> : 'Submit Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletPage
