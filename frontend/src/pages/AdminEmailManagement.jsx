import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Mail, Send, Users, FileText, Search, RefreshCw, Eye, Trash2, Plus } from 'lucide-react'
import { API_URL } from '../config/api'

const AdminEmailManagement = () => {
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

  const adminToken = localStorage.getItem('adminToken')

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
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">Email Management</h1>
              <p className="text-sm text-gray-500">Send emails to users using templates</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('send')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'send' ? 'bg-orange-500 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            <Send size={16} className="inline mr-2" />
            Send Email
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'templates' ? 'bg-orange-500 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Templates
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'logs' ? 'bg-orange-500 text-white' : 'bg-dark-700 text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Email Logs
          </button>
        </div>

        {/* Send Email Tab */}
        {activeTab === 'send' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Select User */}
            <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Users size={18} />
                Select User
              </h3>
              
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.map(user => (
                  <button
                    key={user._id}
                    onClick={() => setSelectedUser(user)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedUser?._id === user._id 
                        ? 'bg-orange-500/20 border border-orange-500' 
                        : 'bg-dark-700 hover:bg-dark-600 border border-transparent'
                    }`}
                  >
                    <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </button>
                ))}
              </div>

              {selectedUser && (
                <div className="mt-4 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <p className="text-orange-400 text-sm">Selected: {selectedUser.firstName} ({selectedUser.email})</p>
                </div>
              )}
            </div>

            {/* Email Content */}
            <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Mail size={18} />
                Email Content
              </h3>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">Select Template</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">-- Use Custom Email --</option>
                  {templates.map(template => (
                    <option key={template._id} value={template.slug}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Email Fields */}
              {!selectedTemplate && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Subject</label>
                    <input
                      type="text"
                      value={customEmail.subject}
                      onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                      placeholder="Email subject"
                      className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">HTML Content</label>
                    <textarea
                      value={customEmail.htmlContent}
                      onChange={(e) => setCustomEmail({ ...customEmail, htmlContent: e.target.value })}
                      placeholder="<h1>Hello!</h1><p>Your message here...</p>"
                      rows={6}
                      className="w-full bg-dark-700 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 font-mono text-sm"
                    />
                  </div>
                </>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendEmail}
                disabled={loading || !selectedUser}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                Send Email
              </button>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="bg-dark-800 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-medium">Email Templates</h3>
              <button
                onClick={fetchTemplates}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <RefreshCw size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="divide-y divide-gray-800">
              {templates.map(template => (
                <div key={template._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{template.name}</p>
                    <p className="text-gray-500 text-sm">{template.slug} • {template.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${template.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => handlePreviewTemplate(template._id)}
                      className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                    >
                      <Eye size={16} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-dark-800 rounded-xl border border-gray-800">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-white font-medium">Email Logs</h3>
              <button
                onClick={fetchEmailLogs}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
              >
                <RefreshCw size={16} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700">
                  <tr>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Recipient</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Subject</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Status</th>
                    <th className="text-left text-gray-400 text-sm font-medium px-4 py-3">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {emailLogs.map(log => (
                    <tr key={log._id} className="hover:bg-dark-700/50">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{log.recipient?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-300 text-sm">{log.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          log.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                          log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-400 text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-dark-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="text-white font-medium">Email Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div 
                  className="bg-white rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminEmailManagement
