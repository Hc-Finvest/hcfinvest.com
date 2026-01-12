import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Building2,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  CreditCard,
  Globe,
  QrCode,
  RefreshCw,
  Upload,
  Smartphone
} from 'lucide-react'

const API_URL = 'http://localhost:5001/api'

const AdminBankSettings = () => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMethod, setEditingMethod] = useState(null)
  const [form, setForm] = useState({
    type: 'Bank Transfer',
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    upiId: '',
    qrCodeImage: '',
    isActive: true
  })

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/payment-methods/all`)
      const data = await res.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    try {
      const url = editingMethod 
        ? `${API_URL}/payment-methods/${editingMethod._id}`
        : `${API_URL}/payment-methods`
      const method = editingMethod ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (res.ok) {
        alert(editingMethod ? 'Payment method updated!' : 'Payment method created!')
        setShowAddModal(false)
        setEditingMethod(null)
        resetForm()
        fetchPaymentMethods()
      } else {
        alert(data.message || 'Error saving payment method')
      }
    } catch (error) {
      alert('Error saving payment method')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    try {
      const res = await fetch(`${API_URL}/payment-methods/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('Payment method deleted!')
        fetchPaymentMethods()
      }
    } catch (error) {
      alert('Error deleting payment method')
    }
  }

  const handleToggleStatus = async (method) => {
    try {
      await fetch(`${API_URL}/payment-methods/${method._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !method.isActive })
      })
      fetchPaymentMethods()
    } catch (error) {
      alert('Error updating status')
    }
  }

  const openEditModal = (method) => {
    setEditingMethod(method)
    setForm({
      type: method.type,
      bankName: method.bankName || '',
      accountNumber: method.accountNumber || '',
      accountHolderName: method.accountHolderName || '',
      ifscCode: method.ifscCode || '',
      upiId: method.upiId || '',
      qrCodeImage: method.qrCodeImage || '',
      isActive: method.isActive
    })
    setShowAddModal(true)
  }

  const resetForm = () => {
    setForm({
      type: 'Bank Transfer',
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      upiId: '',
      qrCodeImage: '',
      isActive: true
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setForm({ ...form, qrCodeImage: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const bankMethods = paymentMethods.filter(m => m.type === 'Bank Transfer')
  const upiMethods = paymentMethods.filter(m => m.type === 'UPI')
  const qrMethods = paymentMethods.filter(m => m.type === 'QR Code')

  return (
    <AdminLayout title="Bank Settings" subtitle="Manage bank accounts and payment methods">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={fetchPaymentMethods}
          className="p-2 bg-dark-800 hover:bg-dark-700 rounded-lg text-gray-400"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <button 
          onClick={() => { resetForm(); setEditingMethod(null); setShowAddModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          Add Payment Method
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={24} className="animate-spin text-gray-500" />
        </div>
      ) : (
        <>
          {/* Bank Accounts */}
          <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Building2 size={20} className="text-blue-500" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">Bank Accounts</h2>
                  <p className="text-gray-500 text-sm">Bank transfer deposit methods</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {bankMethods.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No bank accounts added yet</p>
              ) : (
                bankMethods.map((bank) => (
                  <div key={bank._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center">
                        <Building2 size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{bank.bankName}</p>
                        <p className="text-gray-500 text-sm">A/C: {bank.accountNumber} | IFSC: {bank.ifscCode}</p>
                        <p className="text-gray-500 text-sm">Holder: {bank.accountHolderName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(bank)}
                        className={`px-3 py-1 rounded-full text-xs ${
                          bank.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {bank.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button 
                        onClick={() => openEditModal(bank)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(bank._id)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* UPI Methods */}
          <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden mb-6">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone size={20} className="text-purple-500" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">UPI IDs</h2>
                  <p className="text-gray-500 text-sm">UPI payment methods</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {upiMethods.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No UPI IDs added yet</p>
              ) : (
                upiMethods.map((upi) => (
                  <div key={upi._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dark-600 rounded-lg flex items-center justify-center">
                        <Smartphone size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">UPI ID</p>
                        <p className="text-purple-400 text-lg font-mono">{upi.upiId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(upi)}
                        className={`px-3 py-1 rounded-full text-xs ${
                          upi.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {upi.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button 
                        onClick={() => openEditModal(upi)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(upi._id)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* QR Codes */}
          <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <QrCode size={20} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-white font-semibold">QR Codes</h2>
                  <p className="text-gray-500 text-sm">QR code payment methods</p>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {qrMethods.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No QR codes added yet</p>
              ) : (
                qrMethods.map((qr) => (
                  <div key={qr._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-dark-700 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-4">
                      {qr.qrCodeImage ? (
                        <img src={qr.qrCodeImage} alt="QR Code" className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-dark-600 rounded-lg flex items-center justify-center">
                          <QrCode size={32} className="text-orange-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">QR Code Payment</p>
                        <p className="text-gray-500 text-sm">Scan to pay</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(qr)}
                        className={`px-3 py-1 rounded-full text-xs ${
                          qr.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {qr.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button 
                        onClick={() => openEditModal(qr)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(qr._id)}
                        className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Payment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Bank Transfer', 'UPI', 'QR Code'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm({ ...form, type })}
                      className={`p-3 rounded-lg border text-sm ${
                        form.type === type 
                          ? 'border-blue-500 bg-blue-500/20 text-blue-500' 
                          : 'border-gray-700 text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Transfer Fields */}
              {form.type === 'Bank Transfer' && (
                <>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={form.accountHolderName}
                      onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })}
                      placeholder="e.g., John Doe"
                      className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Account Number</label>
                      <input
                        type="text"
                        value={form.accountNumber}
                        onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                        placeholder="e.g., 1234567890"
                        className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={form.ifscCode}
                        onChange={(e) => setForm({ ...form, ifscCode: e.target.value })}
                        placeholder="e.g., HDFC0001234"
                        className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* UPI Fields */}
              {form.type === 'UPI' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={form.upiId}
                    onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                    placeholder="e.g., yourname@upi"
                    className="w-full px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-white"
                  />
                </div>
              )}

              {/* QR Code Fields */}
              {form.type === 'QR Code' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">QR Code Image</label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                    {form.qrCodeImage ? (
                      <div className="space-y-3">
                        <img src={form.qrCodeImage} alt="QR Preview" className="w-32 h-32 mx-auto rounded-lg" />
                        <button
                          onClick={() => setForm({ ...form, qrCodeImage: '' })}
                          className="text-red-500 text-sm"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <Upload size={32} className="mx-auto text-gray-500 mb-2" />
                        <p className="text-gray-400 text-sm">Click to upload QR code image</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Active Status */}
              <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <span className="text-gray-400">Active Status</span>
                <button
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    form.isActive ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    form.isActive ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                >
                  {editingMethod ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBankSettings
