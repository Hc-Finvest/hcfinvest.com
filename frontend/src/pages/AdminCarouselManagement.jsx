// ============================================
// ADMIN CAROUSEL MANAGEMENT PAGE
// Allows admin to add, update, delete carousel images
// ============================================

import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Image, Plus, Edit2, Trash2, Eye, EyeOff, 
  Save, X, ArrowUp, ArrowDown, Link, FileText,
  RefreshCw, ChevronLeft, Upload, Loader2
} from 'lucide-react'

const AdminCarouselManagement = () => {
  const navigate = useNavigate()
  
  // ============================================
  // STATE VARIABLES
  // ============================================
  const [carousels, setCarousels] = useState([])           // List of all carousel images
  const [loading, setLoading] = useState(true)             // Loading state
  const [showModal, setShowModal] = useState(false)        // Add/Edit modal visibility
  const [editingCarousel, setEditingCarousel] = useState(null) // Currently editing carousel
  const [message, setMessage] = useState({ type: '', text: '' }) // Success/error messages
  const [uploading, setUploading] = useState(false)        // Image upload loading state
  
  // Form data for add/edit
  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    description: '',
    linkUrl: '',
    isActive: true
  })

  const adminToken = localStorage.getItem('adminToken')
  
  // ============================================
  // HANDLE IMAGE UPLOAD
  // Uploads image file to server and returns URL
  // ============================================
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' })
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File too large. Maximum size is 10MB.' })
      return
    }

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      const res = await fetch(`${API_URL}/upload/carousel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formDataUpload
      })

      const data = await res.json()
      if (data.success) {
        // Set the uploaded image URL - remove /api for static file paths
        const imageUrl = data.url.startsWith('http') ? data.url : `${API_URL.replace('/api', '')}${data.url}`
        setFormData({ ...formData, imageUrl })
        setMessage({ type: 'success', text: 'Image uploaded successfully' })
      } else {
        setMessage({ type: 'error', text: data.message || 'Upload failed' })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage({ type: 'error', text: 'Error uploading image' })
    }
    setUploading(false)
  }

  // ============================================
  // FETCH ALL CAROUSEL IMAGES
  // Called on component mount and after any CRUD operation
  // ============================================
  useEffect(() => {
    fetchCarousels()
  }, [])

  const fetchCarousels = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/carousel/admin/all`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setCarousels(data.carousels || [])
      }
    } catch (error) {
      console.error('Error fetching carousels:', error)
      setMessage({ type: 'error', text: 'Failed to fetch carousel images' })
    }
    setLoading(false)
  }

  // ============================================
  // ADD NEW CAROUSEL IMAGE
  // Opens modal with empty form for adding new image
  // ============================================
  const handleAdd = () => {
    setEditingCarousel(null)
    setFormData({
      imageUrl: '',
      title: '',
      description: '',
      linkUrl: '',
      isActive: true
    })
    setShowModal(true)
  }

  // ============================================
  // EDIT EXISTING CAROUSEL IMAGE
  // Opens modal with pre-filled form data
  // ============================================
  const handleEdit = (carousel) => {
    setEditingCarousel(carousel)
    // Handle relative URLs when editing - remove /api for static files
    const imageUrl = carousel.imageUrl 
      ? (carousel.imageUrl.startsWith('http') ? carousel.imageUrl : `${API_URL.replace('/api', '')}${carousel.imageUrl}`)
      : ''
    setFormData({
      imageUrl,
      title: carousel.title || '',
      description: carousel.description || '',
      linkUrl: carousel.linkUrl || '',
      isActive: carousel.isActive
    })
    setShowModal(true)
  }

  // ============================================
  // SAVE CAROUSEL (ADD OR UPDATE)
  // Submits form data to create new or update existing
  // ============================================
  const handleSave = async () => {
    if (!formData.imageUrl) {
      setMessage({ type: 'error', text: 'Please upload an image first' })
      return
    }
    
    // Validate image URL format
    if (!formData.imageUrl.startsWith('http') && !formData.imageUrl.startsWith('/uploads')) {
      setMessage({ type: 'error', text: 'Invalid image. Please upload a valid image.' })
      return
    }

    try {
      const url = editingCarousel 
        ? `${API_URL}/carousel/${editingCarousel._id}`  // UPDATE endpoint
        : `${API_URL}/carousel`                          // ADD endpoint
      
      const method = editingCarousel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: editingCarousel ? 'Carousel updated successfully' : 'Carousel added successfully' 
        })
        setShowModal(false)
        fetchCarousels() // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.message || 'Operation failed' })
      }
    } catch (error) {
      console.error('Error saving carousel:', error)
      setMessage({ type: 'error', text: 'Error saving carousel' })
    }
  }

  // ============================================
  // DELETE CAROUSEL IMAGE
  // Permanently removes a carousel image after confirmation
  // ============================================
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this carousel image?')) {
      return
    }

    try {
      const res = await fetch(`${API_URL}/carousel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Carousel deleted successfully' })
        fetchCarousels() // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.message || 'Delete failed' })
      }
    } catch (error) {
      console.error('Error deleting carousel:', error)
      setMessage({ type: 'error', text: 'Error deleting carousel' })
    }
  }

  // ============================================
  // TOGGLE CAROUSEL ACTIVE STATUS
  // Quickly enable/disable a carousel image
  // ============================================
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_URL}/carousel/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        fetchCarousels() // Refresh the list
      } else {
        setMessage({ type: 'error', text: data.message || 'Toggle failed' })
      }
    } catch (error) {
      console.error('Error toggling carousel:', error)
      setMessage({ type: 'error', text: 'Error toggling carousel' })
    }
  }

  // ============================================
  // MOVE CAROUSEL UP/DOWN (REORDER)
  // Changes the display order of carousel images
  // ============================================
  const handleMove = async (index, direction) => {
    const newCarousels = [...carousels]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newCarousels.length) return

    // Swap the items
    [newCarousels[index], newCarousels[targetIndex]] = [newCarousels[targetIndex], newCarousels[index]]

    // Update orders
    const orders = newCarousels.map((c, i) => ({ id: c._id, order: i }))

    try {
      const res = await fetch(`${API_URL}/carousel/reorder/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ orders })
      })

      const data = await res.json()
      if (data.success) {
        setCarousels(newCarousels)
        setMessage({ type: 'success', text: 'Order updated successfully' })
      }
    } catch (error) {
      console.error('Error reordering:', error)
      setMessage({ type: 'error', text: 'Error updating order' })
    }
  }

  // Clear message after 3 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ============================================
  // RENDER COMPONENT
  // ============================================
  return (
    <div className="min-h-screen bg-dark-900 text-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Image size={20} className="text-purple-500 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">Carousel Management</h1>
              <p className="text-xs sm:text-sm text-gray-500">Manage dashboard carousel images</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchCarousels}
            className="px-3 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg flex items-center gap-2 text-sm transition-colors"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Add Image
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Carousel List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw size={24} className="animate-spin text-gray-500" />
        </div>
      ) : carousels.length === 0 ? (
        <div className="text-center py-12 bg-dark-800 rounded-xl border border-gray-800">
          <Image size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 mb-4">No carousel images yet</p>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors"
          >
            Add First Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carousels.map((carousel, index) => (
            <div 
              key={carousel._id}
              className={`bg-dark-800 rounded-xl border overflow-hidden ${
                carousel.isActive ? 'border-gray-700' : 'border-red-500/30 opacity-60'
              }`}
            >
              {/* Image Preview */}
              <div className="relative h-40 sm:h-48">
                <img 
                  src={carousel.imageUrl.startsWith('http') ? carousel.imageUrl : `${API_URL.replace('/api', '')}${carousel.imageUrl}`} 
                  alt={carousel.title || 'Carousel'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x200?text=Image+Not+Found'
                  }}
                />
                {/* Order Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs font-medium">
                  #{index + 1}
                </div>
                {/* Status Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                  carousel.isActive ? 'bg-green-500/80' : 'bg-red-500/80'
                }`}>
                  {carousel.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                {carousel.title && (
                  <h3 className="font-medium text-sm mb-1 truncate">{carousel.title}</h3>
                )}
                {carousel.description && (
                  <p className="text-xs text-gray-400 mb-2 truncate">{carousel.description}</p>
                )}
                {carousel.linkUrl && (
                  <div className="flex items-center gap-1 text-xs text-blue-400 mb-3">
                    <Link size={12} />
                    <span className="truncate">{carousel.linkUrl}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Move Up */}
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  {/* Move Down */}
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === carousels.length - 1}
                    className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Move Down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggle(carousel._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      carousel.isActive 
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                    title={carousel.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {carousel.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => handleEdit(carousel)}
                    className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(carousel._id)}
                    className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================
          ADD/EDIT MODAL
          Modal for adding new or editing existing carousel
          ============================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">
                {editingCarousel ? 'Edit Carousel Image' : 'Add Carousel Image'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Image Upload - Required */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Upload Image <span className="text-red-500">*</span>
                </label>
                
                {/* Upload Button */}
                <label className={`flex items-center justify-center gap-2 w-full px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploading 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'border-gray-600 hover:border-orange-500 hover:bg-dark-700'
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin text-orange-500" />
                      <span className="text-orange-500 text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="text-gray-400" />
                      <span className="text-gray-400 text-sm">Click to upload image (JPEG, PNG, GIF, WebP - Max 10MB)</span>
                    </>
                  )}
                </label>
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-700 relative">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image'
                    }}
                  />
                  {/* Remove image button */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Title - Optional */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Title (Optional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter title"
                  className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Description - Optional */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={2}
                  className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 text-sm resize-none"
                />
              </div>

              {/* Link URL - Optional */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Link URL (Optional)</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder="https://example.com/page"
                  className="w-full px-4 py-3 bg-dark-700 border border-gray-600 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Active (visible on dashboard)
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Save size={16} />
                {editingCarousel ? 'Update' : 'Add'} Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminCarouselManagement
