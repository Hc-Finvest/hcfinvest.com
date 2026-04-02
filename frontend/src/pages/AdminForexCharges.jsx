import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  RefreshCw,
  Search,
  User as UserIcon,
  Info,
  TrendingUp,
  Moon,
  Filter,
  ArrowRight,
  ShieldAlert,
  Layers
} from 'lucide-react'

// Level hierarchy configuration
const LEVEL_CONFIG = {
  'USER': { priority: 1, label: 'Specific User', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  'INSTRUMENT': { priority: 2, label: 'Asset Specific', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'ACCOUNT_TYPE': { priority: 3, label: 'Account Tier', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'SEGMENT': { priority: 4, label: 'Market Segment', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'GLOBAL': { priority: 5, label: 'Global Base', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
}

const getSpreadPlaceholder = (segment) => {
  switch (segment?.toLowerCase()) {
    case 'forex': return 'Enter pips (e.g. 1.5)';
    case 'metals': return 'Enter cents (e.g. 50)';
    case 'crypto': return 'Enter in USD (e.g. 10)';
    case 'indices': return 'Enter points (e.g. 2)';
    case 'stocks': return 'Enter cents (e.g. 5)';
    default: return 'Enter raw value';
  }
}

const AdminForexCharges = () => {
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCharge, setEditingCharge] = useState(null)
  
  // Data sources
  const [users, setUsers] = useState([])
  const [accountTypes, setAccountTypes] = useState([])
  const [supportedSymbols, setSupportedSymbols] = useState([])
  
  // Search & Filters
  const [userSearch, setUserSearch] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedAccountType, setSelectedAccountType] = useState(null)
  
  const [filterLevel, setFilterLevel] = useState('ALL')

  const initialFormState = {
    level: 'SEGMENT',
    segment: 'Forex',
    instrumentSymbol: '',
    userId: '',
    accountTypeId: '',
    spreadType: 'FIXED', // PERCENTAGE removed for core mathematical safety
    spreadValue: '',
    commissionType: 'PER_LOT',
    commissionValue: '',
    commissionOnBuy: true,
    commissionOnSell: true,
    commissionOnClose: false,
    swapLong: '',
    swapShort: ''
  }
  
  const [form, setForm] = useState(initialFormState)

  useEffect(() => {
    fetchCharges()
    fetchUsers()
    fetchAccountTypes()
    fetchSupportedSymbols()
  }, [])

  const fetchSupportedSymbols = async () => {
    try {
      const res = await fetch(`${API_URL}/prices/symbols`)
      const data = await res.json()
      if (data.success) setSupportedSymbols(data.symbols || [])
    } catch (error) { console.error('Error fetching symbols:', error) }
  }

  const fetchAccountTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/account-types/all`)
      const data = await res.json()
      setAccountTypes(data.accountTypes || [])
    } catch (error) { console.error('Error fetching account types:', error) }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`)
      const data = await res.json()
      if (data.success) setUsers(data.users || [])
    } catch (error) { console.error('Error fetching users:', error) }
  }

  const fetchCharges = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/charges`)
      const data = await res.json()
      if (data.success) setCharges(data.charges || [])
    } catch (error) { console.error('Error fetching charges:', error) }
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingCharge ? `${API_URL}/charges/${editingCharge._id}` : `${API_URL}/charges`
      const method = editingCharge ? 'PUT' : 'POST'

      const payload = {
        ...form,
        spreadValue: form.spreadValue !== '' ? parseFloat(form.spreadValue) : 0,
        commissionValue: form.commissionValue !== '' ? parseFloat(form.commissionValue) : 0,
        swapLong: form.swapLong !== '' ? parseFloat(form.swapLong) : 0,
        swapShort: form.swapShort !== '' ? parseFloat(form.swapShort) : 0,
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        setModalOpen(false)
        resetForm()
        fetchCharges()
      } else {
        alert('Failed to save charge rule: ' + data.message)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving the charge rule.')
    }
  }

  const handleDelete = async (chargeId) => {
    if (window.confirm('Are you sure you want to delete this rule? It will be removed immediately.')) {
      try {
        const res = await fetch(`${API_URL}/charges/${chargeId}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) fetchCharges()
        else alert('Delete failed: ' + data.message)
      } catch (e) {
        console.error('Delete error:', e)
      }
    }
  }

  const openModal = (charge = null) => {
    if (charge) {
      setEditingCharge(charge)
      setForm({
        level: charge.level || 'SEGMENT',
        segment: charge.segment || 'Forex',
        instrumentSymbol: charge.instrumentSymbol || '',
        userId: charge.userId?._id || charge.userId || '',
        accountTypeId: charge.accountTypeId?._id || charge.accountTypeId || '',
        spreadType: 'FIXED', 
        spreadValue: charge.spreadValue != null ? String(charge.spreadValue) : '',
        commissionType: charge.commissionType || 'PER_LOT',
        commissionValue: charge.commissionValue != null ? String(charge.commissionValue) : '',
        commissionOnBuy: charge.commissionOnBuy !== false,
        commissionOnSell: charge.commissionOnSell !== false,
        commissionOnClose: charge.commissionOnClose || false,
        swapLong: charge.swapLong != null ? String(charge.swapLong) : '',
        swapShort: charge.swapShort != null ? String(charge.swapShort) : ''
      })
      if (charge.level === 'USER' && charge.userId) {
        const user = users.find(u => u._id === (charge.userId?._id || charge.userId))
        setSelectedUser(user || null)
      } else setSelectedUser(null)
      
      if (charge.level === 'ACCOUNT_TYPE' && charge.accountTypeId) {
        const accType = accountTypes.find(a => a._id === (charge.accountTypeId?._id || charge.accountTypeId))
        setSelectedAccountType(accType || null)
      } else setSelectedAccountType(null)
    } else {
      resetForm()
    }
    setModalOpen(true)
  }

  const resetForm = () => {
    setEditingCharge(null)
    setForm(initialFormState)
    setSelectedUser(null)
    setSelectedAccountType(null)
    setUserSearch('')
  }

  // Visual Helper for Table Row Target
  const parseTarget = (c) => {
    if (c.level === 'GLOBAL') return 'Entire Platform'
    if (c.level === 'SEGMENT') return `${c.segment} Pairs`
    if (c.level === 'ACCOUNT_TYPE') return `${c.accountTypeId?.name || 'Account Type'}` + (c.segment ? ` (${c.segment})` : ' (All Assets)')
    if (c.level === 'INSTRUMENT') return `${c.instrumentSymbol}`
    if (c.level === 'USER') return `${c.userId?.name || c.userId?.email || 'User'}` + (c.instrumentSymbol ? ` on ${c.instrumentSymbol}` : ' (All Assets)')
    return 'Unknown'
  }

  const filteredCharges = charges
    .filter(c => filterLevel === 'ALL' || c.level === filterLevel)
    .sort((a, b) => LEVEL_CONFIG[a.level].priority - LEVEL_CONFIG[b.level].priority)

  return (
    <AdminLayout 
      title="Trading Fees & Spreads" 
      subtitle="Standardized platform charges and customer-specific overrides."
    >
      <div className="bg-slate-50 min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Action Card */}
          <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <DollarSign className="text-blue-600 w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Active Fee Structure</h2>
                <p className="text-slate-500 text-sm mt-0.5">Define your global spreads or set specific rules for assets and traders.</p>
              </div>
            </div>
            <button 
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-blue-200"
            >
              <Plus className="w-5 h-5" />
              Add New Rule
            </button>
          </div>

          {/* Setting Levels Guide / Filters */}
          <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {/* Show All Button */}
              <button 
                onClick={() => setFilterLevel('ALL')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl border transition-all duration-200 ${
                  filterLevel === 'ALL' 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm'
                }`}
              >
                <Layers className={`w-4 h-4 ${filterLevel === 'ALL' ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-sm font-bold">All Configurations</span>
              </button>

              <div className="w-px h-8 bg-slate-200 mx-2 self-center" />

              {Object.entries(LEVEL_CONFIG).map(([key, config]) => {
                const isSelected = filterLevel === key;
                return (
                  <button 
                    key={key}
                    onClick={() => setFilterLevel(key)}
                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200 ${
                      isSelected 
                      ? 'bg-white border-blue-500 text-slate-900 shadow-md ring-2 ring-blue-50' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${config.color.includes('emerald') ? 'bg-emerald-500' : config.color.includes('purple') ? 'bg-purple-500' : config.color.includes('blue') ? 'bg-blue-500' : config.color.includes('orange') ? 'bg-orange-500' : 'bg-slate-400'}`}></div>
                    <span className={`text-sm font-extrabold ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm shadow-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                Current Configuration
              </h2>
              <button 
                onClick={fetchCharges} 
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-500"
                title="Refresh Rules"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-100">
                    <th className="px-8 py-5">Setting Level</th>
                    <th className="px-8 py-5">Applied To</th>
                    <th className="px-8 py-5">Spread Margin</th>
                    <th className="px-8 py-5">Commission</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCharges.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium">
                        {loading ? 'Fetching rule configuration...' : 'No charging rules defined yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCharges.map(charge => {
                      const levelCfg = LEVEL_CONFIG[charge.level] || LEVEL_CONFIG['GLOBAL']
                      return (
                        <tr key={charge._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${levelCfg.color.replace('zinc', 'slate').replace('white', 'slate')}`}>
                              {charge.level}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              {parseTarget(charge)}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            {(charge.spreadValue !== null && charge.spreadValue !== undefined) ? (
                              <div className="flex flex-col">
                                <span className="text-slate-900 font-bold text-base">{charge.spreadValue}</span>
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight">Fixed Offset</span>
                              </div>
                            ) : <span className="text-slate-300 text-xs italic">Default</span>}
                          </td>
                          <td className="px-8 py-5">
                            {(charge.commissionValue !== null && charge.commissionValue !== undefined) ? (
                              <div className="flex flex-col">
                                <span className="text-slate-900 font-bold flex items-center gap-1">
                                  ${charge.commissionValue} <span className="text-slate-400 text-[10px] uppercase">{charge.commissionType === 'PER_LOT' ? 'Lot' : 'Trade'}</span>
                                </span>
                                <div className="flex gap-1.5 mt-1.5">
                                  {charge.commissionOnBuy && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Applied on Buy" />}
                                  {charge.commissionOnSell && <span className="w-1.5 h-1.5 rounded-full bg-red-500" title="Applied on Sell" />}
                                </div>
                              </div>
                            ) : <span className="text-slate-300 text-xs italic">Default</span>}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => openModal(charge)} className="p-2.5 bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-200">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(charge._id)} className="p-2.5 bg-slate-50 hover:bg-red-600 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-200">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {editingCharge ? 'Edit Charge Rule' : 'New Charge Rule'}
                </h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">Define how this rule should be applied to transactions.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 text-slate-400 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8">
              
              {/* Step 1: Context Definition */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Target Context</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1">Setting Level</label>
                    <select 
                      value={form.level}
                      onChange={(e) => setForm({...form, level: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="GLOBAL">Global Baseline</option>
                      <option value="SEGMENT">Market Segment</option>
                      <option value="ACCOUNT_TYPE">Account Tier</option>
                      <option value="INSTRUMENT">Specific Asset</option>
                      <option value="USER">Specific User</option>
                    </select>
                  </div>

                  {['SEGMENT', 'ACCOUNT_TYPE'].includes(form.level) && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1">Market Segment</label>
                      <select 
                        value={form.segment}
                        onChange={(e) => setForm({...form, segment: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="Forex">Forex (Currencies)</option>
                        <option value="Metals">Metals (XAU, XAG)</option>
                        <option value="Crypto">Crypto</option>
                        <option value="Indices">Indices</option>
                        <option value="Stocks">Stocks</option>
                        {form.level === 'ACCOUNT_TYPE' && <option value="">All Segments</option>}
                      </select>
                    </div>
                  )}

                  {form.level === 'ACCOUNT_TYPE' && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1">Account Tier</label>
                      <select
                        value={form.accountTypeId}
                        onChange={(e) => setForm({...form, accountTypeId: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required
                      >
                        <option value="">Select Tier</option>
                        {accountTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}

                  {['INSTRUMENT', 'USER'].includes(form.level) && (
                    <div className="space-y-2 relative">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1">Target Symbol {form.level === 'USER' && '(Optional)'}</label>
                      <select
                        value={form.instrumentSymbol}
                        onChange={(e) => {
                          setForm({...form, instrumentSymbol: e.target.value});
                          const t = e.target.value;
                          if (t.includes('XAU') || t.includes('XAG')) setForm(f => ({...f, segment: 'Metals'}));
                          else if (t.includes('USD') && t.length === 6) setForm(f => ({...f, segment: 'Forex'}));
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        required={form.level === 'INSTRUMENT'}
                      >
                        <option value="">{form.level === 'USER' ? 'All Assets' : 'Select Asset'}</option>
                        {supportedSymbols.map((sym, idx) => <option key={idx} value={sym}>{sym}</option>)}
                      </select>
                    </div>
                  )}

                  {form.level === 'USER' && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1">Target User</label>
                      <div className="relative">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                          <Search className="w-4 h-4 text-slate-400 mr-2" />
                          <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={selectedUser ? (selectedUser.name || selectedUser.email) : userSearch}
                            onChange={(e) => {
                              setUserSearch(e.target.value)
                              setSelectedUser(null)
                              setShowUserDropdown(true)
                            }}
                            onFocus={() => setShowUserDropdown(true)}
                            className="bg-transparent border-none text-slate-900 font-medium outline-none w-full placeholder-slate-300"
                            required
                          />
                          {selectedUser && (
                            <button type="button" onClick={() => { setSelectedUser(null); setUserSearch(''); setForm({...form, userId: ''}) }}>
                              <X className="w-4 h-4 text-slate-400" />
                            </button>
                          )}
                        </div>
                        {showUserDropdown && !selectedUser && userSearch.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-10 p-2">
                            {users.filter(u => 
                              (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
                              (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
                            ).slice(0, 10).map(u => (
                              <div
                                key={u._id}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex flex-col rounded-xl transition-colors"
                                onClick={() => {
                                  setSelectedUser(u)
                                  setForm({...form, userId: u._id})
                                  setShowUserDropdown(false)
                                }}
                              >
                                <span className="text-slate-900 text-sm font-bold">{u.name || 'Unnamed User'}</span>
                                <span className="text-slate-400 text-xs">{u.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Step 2: Values */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Adjustment Values</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1 flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-blue-500" /> Spread Margin
                    </label>
                    <input 
                      type="number" step="0.01"
                      value={form.spreadValue}
                      onChange={(e) => setForm({...form, spreadValue: e.target.value})}
                      placeholder={getSpreadPlaceholder(form.segment)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-tight ml-1 flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-emerald-500" /> Base Commission
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number" step="0.01"
                        value={form.commissionValue}
                        onChange={(e) => setForm({...form, commissionValue: e.target.value})}
                        placeholder="e.g. 5.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-slate-300"
                      />
                      <select
                        value={form.commissionType}
                        onChange={(e) => setForm({...form, commissionType: e.target.value})}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 text-slate-700 font-bold text-xs outline-none shrink-0"
                      >
                        <option value="PER_LOT">Lot</option>
                        <option value="PER_TRADE">Trade</option>
                        <option value="PERCENTAGE">% Vol</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                    <Moon className="w-4 h-4 text-indigo-500" /> Overnight Swap Fees
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Buy Side (Long)</label>
                      <input 
                        type="number" step="0.01"
                        value={form.swapLong}
                        onChange={(e) => setForm({...form, swapLong: e.target.value})}
                        placeholder="e.g. -5.2"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Sell Side (Short)</label>
                      <input 
                        type="number" step="0.01"
                        value={form.swapShort}
                        onChange={(e) => setForm({...form, swapShort: e.target.value})}
                        placeholder="e.g. 1.5"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-8 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)} 
                  className="px-8 py-3.5 text-slate-500 hover:text-slate-900 font-bold transition-colors"
                >
                  Discard Changes
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-blue-100 font-bold"
                >
                  <Save className="w-5 h-5" />
                  Apply Rule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminForexCharges
