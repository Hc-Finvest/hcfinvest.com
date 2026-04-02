import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Mail, Send, Users, FileText, Search, RefreshCw, Eye, Trash2, Plus, X, Check } from 'lucide-react'
import { API_URL } from '../config/api'
import { useTheme } from '../context/ThemeContext'

const AdminEmailManagement = () => {
  const { modeColors } = useTheme()
  const [activeTab, setActiveTab] = useState('send')
  const [templates, setTemplates] = useState([])
  const [users, setUsers] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customEmail, setCustomEmail] = useState({
    subject: '',
    htmlContent: ''
  })
  const [previewHtml, setPreviewHtml] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const rawToken = localStorage.getItem('adminToken')
  const adminToken = (rawToken === 'undefined' || rawToken === 'null') ? null : rawToken

  useEffect(() => {
    fetchTemplates()
    fetchUsers()
    fetchEmailLogs()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/email/templates`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchEmailLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/email/logs?limit=50`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      if (data.success) {
        setEmailLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'Please select a user' })
      return
    }

    if (!selectedTemplate && (!customEmail.subject || !customEmail.htmlContent)) {
      setMessage({ type: 'error', text: 'Please select a template or enter custom email content' })
      return
    }

    setLoading(true)
    try {
      const body = {
        userId: selectedUser._id,
        ...(selectedTemplate ? { templateSlug: selectedTemplate } : {
          subject: customEmail.subject,
          htmlContent: customEmail.htmlContent
        })
      }

      const res = await fetch(`${API_URL}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Email sent successfully!' })
        setSelectedUser(null)
        setSelectedTemplate('')
        setCustomEmail({ subject: '', htmlContent: '' })
        fetchEmailLogs()
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to send email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error sending email' })
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewTemplate = async (templateId) => {
    try {
      const res = await fetch(`${API_URL}/email/templates/${templateId}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ data: { user_name: selectedUser?.firstName || 'User' } })
      })
      const data = await res.json()
      if (data.success) {
        setPreviewHtml(data.preview.html)
        setShowPreview(true)
      }
    } catch (error) {
      console.error('Error previewing template:', error)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout title="Email Management" subtitle="Send emails to users using templates">
      <div className="p-4 sm:p-6">
        {/* Header - Handled by AdminLayout title/subtitle but keep if custom elements needed */}
        {/* We can remove the redundant header if AdminLayout handles it, but let's keep the icon sync */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-orange-500/20">
              <Mail size={24} className="text-orange-500" />
            </div>
            <div>
              <h1 style={{ color: modeColors.text }} className="text-xl font-bold">Manager</h1>
              <p style={{ color: modeColors.textSecondary }} className="text-sm">Broadcast and direct user communication</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div style={{ backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: message.type === 'success' ? '#22C55E' : '#EF4444' }} className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
              <p className="font-semibold text-sm sm:text-base">{message.text}</p>
            </div>
            <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 hover:bg-black/5 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('send')}
            style={{ 
              backgroundColor: activeTab === 'send' ? '#F97316' : modeColors.card,
              color: activeTab === 'send' ? '#FFFFFF' : modeColors.textSecondary,
              borderColor: activeTab === 'send' ? '#F97316' : modeColors.border
            }}
            className="px-5 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base flex items-center gap-2 border shadow-sm active:scale-[0.98]"
          >
            <Send size={18} />
            Email
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            style={{ 
              backgroundColor: activeTab === 'templates' ? '#F97316' : modeColors.card,
              color: activeTab === 'templates' ? '#FFFFFF' : modeColors.textSecondary,
              borderColor: activeTab === 'templates' ? '#F97316' : modeColors.border
            }}
            className="px-5 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base flex items-center gap-2 border shadow-sm active:scale-[0.98]"
          >
            <FileText size={18} />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            style={{ 
              backgroundColor: activeTab === 'logs' ? '#F97316' : modeColors.card,
              color: activeTab === 'logs' ? '#FFFFFF' : modeColors.textSecondary,
              borderColor: activeTab === 'logs' ? '#F97316' : modeColors.border
            }}
            className="px-5 py-2.5 rounded-xl font-bold transition-all text-sm sm:text-base flex items-center gap-2 border shadow-sm active:scale-[0.98]"
          >
            <RefreshCw size={18} />
            History Logs
          </button>
        </div>

        {/* Send Email Tab */}
        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Select User */}
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl p-5 border shadow-sm flex flex-col h-full">
              <h3 style={{ color: modeColors.text }} className="font-bold mb-4 flex items-center gap-2 text-base">
                <Users size={20} className="text-orange-500" />
                Select Recipient
              </h3>
              
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all font-medium"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={48} className="text-gray-200 mx-auto mb-3" />
                    <p style={{ color: modeColors.textSecondary }} className="text-sm">No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <button
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      style={{ 
                        backgroundColor: selectedUser?._id === user._id ? 'rgba(249, 115, 22, 0.05)' : modeColors.bgSecondary, 
                        borderColor: selectedUser?._id === user._id ? '#F97316' : modeColors.border 
                      }}
                      className="w-full text-left p-4 rounded-xl border transition-all hover:shadow-sm group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p style={{ color: modeColors.text }} className="font-bold text-sm sm:text-base group-hover:text-orange-500 transition-colors">{user.firstName} {user.lastName}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-xs sm:text-sm truncate max-w-[200px]">{user.email}</p>
                        </div>
                        {selectedUser?._id === user._id && <Check size={18} className="text-orange-500" />}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {selectedUser && (
                <div className="mt-4 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                    {selectedUser.firstName?.[0]}
                  </div>
                  <div>
                    <p className="text-orange-600 font-bold text-sm">Target Recipient</p>
                    <p style={{ color: modeColors.text }} className="text-xs font-medium">{selectedUser.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Email Content */}
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl p-5 border shadow-sm">
              <h3 style={{ color: modeColors.text }} className="font-bold mb-4 flex items-center gap-2 text-base">
                <Mail size={20} className="text-orange-500" />
                Compose Message
              </h3>

              {/* Template Selection */}
              <div className="mb-6">
                <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Message Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="">-- Use Custom / Blank Message --</option>
                  {templates.map(template => (
                    <option key={template._id} value={template.slug}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Email Fields */}
              {!selectedTemplate && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Subject Line</label>
                    <input
                      type="text"
                      value={customEmail.subject}
                      onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                      placeholder="e.g., Important Account Update"
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label style={{ color: modeColors.textSecondary }} className="block text-sm mb-2 font-medium">Rich HTML Content</label>
                    <textarea
                      value={customEmail.htmlContent}
                      onChange={(e) => setCustomEmail({ ...customEmail, htmlContent: e.target.value })}
                      placeholder="<h1>Hello!</h1><p>Your custom message body...</p>"
                      rows={5}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendEmail}
                disabled={loading || !selectedUser}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 text-base shadow-lg shadow-orange-500/20 active:scale-[0.98]"
              >
                {loading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
                Broadcast and Send Message
              </button>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl border overflow-hidden shadow-sm">
            <div style={{ borderBottomColor: modeColors.border }} className="p-5 border-b flex items-center justify-between">
              <h3 style={{ color: modeColors.text }} className="font-bold text-lg">Email Templates</h3>
              <button
                onClick={fetchTemplates}
                style={{ color: modeColors.textSecondary }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            {templates.length === 0 ? (
              <div className="p-16 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                <p style={{ color: modeColors.textSecondary }} className="font-medium">No templates available</p>
              </div>
            ) : (
              <div style={{ backgroundColor: modeColors.bgSecondary }} className="divide-y divide-slate-100">
                {templates.map(template => (
                  <div key={template._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p style={{ color: modeColors.text }} className="font-bold text-base sm:text-lg group-hover:text-orange-500 transition-colors">{template.name}</p>
                      <p style={{ color: modeColors.textSecondary }} className="text-sm flex items-center gap-2">
                        <span className="font-mono">{template.slug}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span>{template.category}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${template.isActive ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handlePreviewTemplate(template._id)}
                        style={{ color: modeColors.textSecondary }}
                        className="p-2.5 hover:bg-slate-100 rounded-xl transition-all hover:text-blue-500"
                        title="Preview"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Email Logs Tab */}
        {activeTab === 'logs' && (
          <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-xl border overflow-hidden shadow-sm">
            <div style={{ borderBottomColor: modeColors.border }} className="p-5 border-b flex items-center justify-between">
              <h3 style={{ color: modeColors.text }} className="font-bold text-lg">Communication History</h3>
              <button
                onClick={fetchEmailLogs}
                style={{ color: modeColors.textSecondary }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
            
            {emailLogs.length === 0 ? (
              <div className="p-16 text-center">
                <Mail size={48} className="text-gray-300 mx-auto mb-4" />
                <p style={{ color: modeColors.textSecondary }} className="font-medium">No communication logs recorded yet</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {emailLogs.map(log => (
                    <div key={log._id} style={{ backgroundColor: modeColors.bgSecondary }} className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p style={{ color: modeColors.text }} className="text-sm font-bold truncate flex-1">{log.recipient?.email}</p>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ml-2 ${
                          log.status === 'sent' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                          log.status === 'failed' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium line-clamp-1">{log.subject}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <RefreshCw size={12} />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: modeColors.bgSecondary }}>
                      <tr style={{ borderBottomColor: modeColors.border }} className="border-b">
                        <th style={{ color: modeColors.textSecondary }} className="text-left text-xs font-bold uppercase tracking-wider px-6 py-4">Recipient</th>
                        <th style={{ color: modeColors.textSecondary }} className="text-left text-xs font-bold uppercase tracking-wider px-6 py-4">Full Subject</th>
                        <th style={{ color: modeColors.textSecondary }} className="text-left text-xs font-bold uppercase tracking-wider px-6 py-4">Status</th>
                        <th style={{ color: modeColors.textSecondary }} className="text-left text-xs font-bold uppercase tracking-wider px-6 py-4">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody style={{ backgroundColor: modeColors.card }} className="divide-y divide-slate-100">
                      {emailLogs.map(log => (
                        <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-5">
                            <p style={{ color: modeColors.text }} className="text-sm font-bold group-hover:text-orange-500 transition-colors">{log.recipient?.email}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium truncate max-w-[300px]">{log.subject}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              log.status === 'sent' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                              log.status === 'failed' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right sm:text-left">
                            <p className="text-gray-400 text-xs font-mono">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border shadow-2xl flex flex-col">
              <div style={{ borderBottomColor: modeColors.border }} className="p-6 border-b flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Eye size={20} className="text-orange-500" />
                  </div>
                  <h3 style={{ color: modeColors.text }} className="font-bold text-lg">E-mail Content Preview</h3>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{ color: modeColors.textSecondary }}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all hover:text-red-500"
                >
                  <X size={24} />
                </button>
              </div>
              <div style={{ backgroundColor: modeColors.bgSecondary }} className="p-6 overflow-y-auto flex-1">
                <div 
                  className="bg-white rounded-xl p-8 shadow-inner border border-slate-100"
                  style={{ color: '#1e293b' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
              <div style={{ borderTopColor: modeColors.border }} className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-md active:scale-95"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminEmailManagement
