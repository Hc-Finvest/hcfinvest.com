import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Image, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw, X, ExternalLink } from 'lucide-react'
import { API_URL } from '../config/api'

const AdminBannerManagement = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    linkText: 'Learn More',
    backgroundColor: 'from-orange-500/20 to-yellow-500/20',
    position: 'top',
    priority: 0,
    isActive: true,
    startDate: '',
    endDate: ''
  })

  const adminToken = localStorage.getItem('adminToken')

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/banners`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setBanners(data.banners || [])
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async () => {
    if (!form.title) {
      setMessage({ type: 'error', text: 'Title is required' })
      return
    }

    try {
      const url = editingBanner 
        ? `${API_URL}/banners/${editingBanner._id}`
        : `${API_URL}/banners`
      
      const res = await fetch(url, {
        method: editingBanner ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...form,
          startDate: form.startDate || null,
          endDate: form.endDate || null
        })
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: `Banner ${editingBanner ? 'updated' : 'created'} successfully` })
        setShowModal(false)
        resetForm()
        fetchBanners()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save banner' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving banner' })
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const res = await fetch(`${API_URL}/banners/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Banner deleted successfully' })
        fetchBanners()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error deleting banner' })
    }
  }

  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_URL}/banners/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        fetchBanners()
      }
    } catch (error) {
      console.error('Error toggling banner:', error)
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setForm({
      title: banner.title || '',
      description: banner.description || '',
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      linkText: banner.linkText || 'Learn More',
      backgroundColor: banner.backgroundColor || 'from-orange-500/20 to-yellow-500/20',
      position: banner.position || 'top',
      priority: banner.priority || 0,
      isActive: banner.isActive !== false,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingBanner(null)
    setForm({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      linkText: 'Learn More',
      backgroundColor: 'from-orange-500/20 to-yellow-500/20',
      position: 'top',
      priority: 0,
      isActive: true,
      startDate: '',
      endDate: ''
    })
  }

  const backgroundOptions = [
    { value: 'from-orange-500/20 to-yellow-500/20', label: 'Orange/Yellow', preview: 'bg-gradient-to-r from-orange-500/40 to-yellow-500/40' },
    { value: 'from-blue-500/20 to-cyan-500/20', label: 'Blue/Cyan', preview: 'bg-gradient-to-r from-blue-500/40 to-cyan-500/40' },
    { value: 'from-green-500/20 to-emerald-500/20', label: 'Green/Emerald', preview: 'bg-gradient-to-r from-green-500/40 to-emerald-500/40' },
    { value: 'from-purple-500/20 to-pink-500/20', label: 'Purple/Pink', preview: 'bg-gradient-to-r from-purple-500/40 to-pink-500/40' },
    { value: 'from-red-500/20 to-orange-500/20', label: 'Red/Orange', preview: 'bg-gradient-to-r from-red-500/40 to-orange-500/40' }
  ]

  return (
    <AdminLayout title="Banner Management" subtitle="Manage promotional banners for client dashboard">
      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Image size={20} className="text-purple-500" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Dashboard Banners</h2>
            <p className="text-gray-500 text-sm">{banners.length} banners configured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBanners}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} /> Add Banner
          </button>
        </div>
      </div>

      {/* Banners List */}
      <div className="bg-dark-800 rounded-xl border border-gray-800">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="p-8 text-center">
            <Image size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-500">No banners created yet</p>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="mt-4 text-purple-400 hover:text-purple-300"
            >
              Create your first banner
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {banners.map(banner => (
              <div key={banner._id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-12 rounded-lg bg-gradient-to-r ${banner.backgroundColor} flex items-center justify-center`}>
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Image size={20} className="text-white/50" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{banner.title}</p>
                    <p className="text-gray-500 text-sm">{banner.description || 'No description'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">Position: {banner.position}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-600">Priority: {banner.priority}</span>
                      {banner.linkUrl && (
                        <>
                          <span className="text-xs text-gray-600">•</span>
                          <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 flex items-center gap-1">
                            <ExternalLink size={10} /> Link
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${banner.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggle(banner._id)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                    title={banner.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {banner.isActive ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-gray-400" />}
                  </button>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} className="text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-dark-800">
              <h2 className="text-lg font-semibold text-white">
                {editingBanner ? 'Edit Banner' : 'Create Banner'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="Banner title"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
                  rows={2}
                  placeholder="Short description"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Image URL</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  placeholder="https://example.com/image.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Link URL</label>
                  <input
                    type="text"
                    value={form.linkUrl}
                    onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="/page or https://..."
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Link Text</label>
                  <input
                    type="text"
                    value={form.linkText}
                    onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Background Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {backgroundOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, backgroundColor: opt.value })}
                      className={`h-10 rounded-lg ${opt.preview} border-2 transition-colors ${
                        form.backgroundColor === opt.value ? 'border-white' : 'border-transparent'
                      }`}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Position</label>
                  <select
                    value={form.position}
                    onChange={(e) => setForm({ ...form, position: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="top">Top</option>
                    <option value="middle">Middle</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Priority</label>
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="isActive" className="text-white text-sm">Active</label>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Preview</label>
                <div className={`bg-gradient-to-r ${form.backgroundColor} rounded-xl p-4 border border-white/10`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{form.title || 'Banner Title'}</h3>
                      <p className="text-gray-300 text-sm">{form.description || 'Banner description'}</p>
                    </div>
                    {form.linkText && (
                      <button className="px-4 py-2 bg-white/20 text-white rounded-lg text-sm">
                        {form.linkText}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium"
                >
                  {editingBanner ? 'Update' : 'Create'} Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminBannerManagement
