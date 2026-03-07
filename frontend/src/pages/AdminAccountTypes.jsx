import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  RefreshCw,
  CreditCard
} from 'lucide-react'

const AdminAccountTypes = () => {
  const [accountTypes, setAccountTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    minDeposit: '',
    leverage: '1:100',
    exposureLimit: '',
    minSpread: '0',
    commission: '0',
    isActive: true,
    isDemo: false,
    demoBalance: '10000'
  })

  useEffect(() => {
    fetchAccountTypes()
  }, [])

  const fetchAccountTypes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/account-types/all`)
      const data = await res.json()
      setAccountTypes(data.accountTypes || [])
    } catch (error) {
      console.error('Error fetching account types:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.minDeposit || !formData.leverage) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const url = editingType 
        ? `${API_URL}/account-types/${editingType._id}`
        : `${API_URL}/account-types`
      
      const res = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minDeposit: parseFloat(formData.minDeposit),
          exposureLimit: formData.exposureLimit ? parseFloat(formData.exposureLimit) : 0,
          minSpread: parseFloat(formData.minSpread) || 0,
          commission: parseFloat(formData.commission) || 0,
          isDemo: formData.isDemo,
          demoBalance: formData.isDemo ? parseFloat(formData.demoBalance) : 0
        })
      })
      const data = await res.json()
      
      if (res.ok) {
        setSuccess(editingType ? 'Account type updated!' : 'Account type created!')
        setShowModal(false)
        resetForm()
        fetchAccountTypes()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.message)
      }
    } catch (error) {
      setError('Error saving account type')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this account type?')) return

    try {
      const res = await fetch(`${API_URL}/account-types/${id}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setSuccess('Account type deleted!')
        fetchAccountTypes()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      setError('Error deleting account type')
    }
  }

  const handleToggleActive = async (type) => {
    try {
      const res = await fetch(`${API_URL}/account-types/${type._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...type, isActive: !type.isActive })
      })
      
      if (res.ok) {
        fetchAccountTypes()
      }
    } catch (error) {
      setError('Error updating account type')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      minDeposit: '',
      leverage: '1:100',
      exposureLimit: '',
      minSpread: '0',
      commission: '0',
      isActive: true,
      isDemo: false,
      demoBalance: '10000'
    })
    setEditingType(null)
    setError('')
  }

  const openEditModal = (type) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      description: type.description || '',
      minDeposit: type.minDeposit.toString(),
      leverage: type.leverage,
      exposureLimit: type.exposureLimit?.toString() || '',
      minSpread: type.minSpread?.toString() || '0',
      commission: type.commission?.toString() || '0',
      isActive: type.isActive,
      isDemo: type.isDemo || false,
      demoBalance: type.demoBalance?.toString() || '10000'
    })
    setShowModal(true)
    setError('')
  }

  return (
    <AdminLayout title="Account Types" subtitle="Manage trading account types">
      <div className="flex justify-end mb-6">
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          <Plus size={18} /> Add Account Type
        </button>
      </div>

      <div>
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500 flex items-center gap-2">
              <Check size={18} /> {success}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={28} className="text-gray-500 animate-spin" />
            </div>
          ) : accountTypes.length === 0 ? (
            <div className="bg-dark-800 rounded-xl p-12 border border-gray-800 text-center">
              <CreditCard size={56} className="text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-medium text-lg mb-2">No Account Types</h3>
              <p className="text-gray-500">Create your first account type to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accountTypes.map((type) => (
                <div 
                  key={type._id} 
                  className={`bg-dark-800 rounded-xl p-5 border ${type.isActive ? 'border-gray-700' : 'border-red-500/30 opacity-60'}`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.isDemo ? 'bg-yellow-500/20' : 'bg-blue-500/20'}`}>
                        <CreditCard size={20} className={type.isDemo ? 'text-yellow-500' : 'text-blue-500'} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-base">{type.name}</h3>
                        {type.isDemo && (
                          <span className="text-yellow-500 text-xs">Demo Account</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${type.isActive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {type.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {type.description || 'No description provided'}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Min Deposit</p>
                      <p className="text-white font-semibold">${type.minDeposit?.toLocaleString()}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Leverage</p>
                      <p className="text-white font-semibold">{type.leverage}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Min Spread</p>
                      <p className="text-white font-semibold">{type.minSpread || 0} pips</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-500 text-xs mb-1">Commission</p>
                      <p className="text-white font-semibold">{type.commission > 0 ? `$${type.commission}` : 'None'}</p>
                    </div>
                    {type.isDemo && (
                      <div className="bg-yellow-500/10 rounded-lg p-3 col-span-2">
                        <p className="text-yellow-500/70 text-xs mb-1">Demo Balance</p>
                        <p className="text-yellow-500 font-semibold">${(type.demoBalance || 10000).toLocaleString()}</p>
                      </div>
                    )}
                    {!type.isDemo && (
                      <div className="bg-dark-700 rounded-lg p-3 col-span-2">
                        <p className="text-gray-500 text-xs mb-1">Exposure Limit</p>
                        <p className="text-white font-semibold">${(type.exposureLimit || 0).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(type)}
                      className="flex-1 flex items-center justify-center gap-2 bg-dark-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-dark-600 transition-colors"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(type)}
                      className={`flex-1 py-2.5 rounded-lg transition-colors text-sm font-medium ${type.isActive ? 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}
                    >
                      {type.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(type._id)}
                      className="px-3 py-2.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base sm:text-lg">
                    {editingType ? 'Edit Account Type' : 'Create Account Type'}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Configure account settings</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowModal(false); resetForm(); }} 
                className="text-gray-400 hover:text-white p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
              {/* Account Name */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Account Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard, Premium, VIP"
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Account type description"
                  rows={2}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              {/* Min Deposit & Leverage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Min Deposit ($) *</label>
                  <input
                    type="number"
                    value={formData.minDeposit}
                    onChange={(e) => setFormData({ ...formData, minDeposit: e.target.value })}
                    placeholder="100"
                    className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Leverage *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm sm:text-base">1:</span>
                    <input
                      type="number"
                      min="1"
                      value={formData.leverage.replace('1:', '')}
                      onChange={(e) => setFormData({ ...formData, leverage: `1:${e.target.value}` })}
                      placeholder="100"
                      className="flex-1 bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-1.5">e.g., 100, 500, 1000, 2000</p>
                </div>
              </div>

              {/* Exposure Limit */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Exposure Limit ($)</label>
                <input
                  type="number"
                  value={formData.exposureLimit}
                  onChange={(e) => setFormData({ ...formData, exposureLimit: e.target.value })}
                  placeholder="0 for unlimited"
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Min Spread and Commission */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Min Spread (pips)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.minSpread}
                    onChange={(e) => setFormData({ ...formData, minSpread: e.target.value })}
                    placeholder="0"
                    className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Commission ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    placeholder="0"
                    className="w-full bg-dark-700 border border-gray-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Demo Account Toggle */}
              <div className="bg-dark-700 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-white font-medium text-sm sm:text-base">Demo Account</label>
                    <p className="text-gray-500 text-xs mt-1">Enable for practice accounts with virtual funds</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isDemo: !formData.isDemo })}
                    className={`w-12 h-6 rounded-full transition-colors shrink-0 ${formData.isDemo ? 'bg-yellow-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.isDemo ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                
                {formData.isDemo && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <label className="block text-gray-400 text-sm mb-2">Demo Balance ($)</label>
                    <input
                      type="number"
                      value={formData.demoBalance}
                      onChange={(e) => setFormData({ ...formData, demoBalance: e.target.value })}
                      placeholder="10000"
                      className="w-full bg-dark-600 border border-gray-600 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                    />
                    <p className="text-gray-500 text-xs mt-1.5">Virtual balance for this account type</p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-700 shrink-0">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 bg-dark-700 text-white py-2.5 sm:py-3 rounded-lg hover:bg-dark-600 transition-colors text-sm sm:text-base font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-red-500 text-white font-medium py-2.5 sm:py-3 rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
              >
                {editingType ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminAccountTypes
