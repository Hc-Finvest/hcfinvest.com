import { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  FileCheck,
  Search,
  Eye,
  Check,
  X,
  Clock,
  Download,
  User,
  FileText,
  Calendar
} from 'lucide-react'

const AdminKYC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const kycRequests = [
    { id: 1, user: 'John Doe', email: 'john@email.com', docType: 'Passport', submittedAt: '2024-01-10 14:30', status: 'pending' },
    { id: 2, user: 'Jane Smith', email: 'jane@email.com', docType: 'Driving License', submittedAt: '2024-01-10 12:15', status: 'approved' },
    { id: 3, user: 'Mike Johnson', email: 'mike@email.com', docType: 'National ID', submittedAt: '2024-01-09 18:45', status: 'pending' },
    { id: 4, user: 'Sarah Wilson', email: 'sarah@email.com', docType: 'Passport', submittedAt: '2024-01-08 09:00', status: 'rejected' },
    { id: 5, user: 'Tom Brown', email: 'tom@email.com', docType: 'Aadhaar Card', submittedAt: '2024-01-07 16:30', status: 'approved' },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-500'
      case 'pending': return 'bg-yellow-500/20 text-yellow-500'
      case 'rejected': return 'bg-red-500/20 text-red-500'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <Check size={14} />
      case 'pending': return <Clock size={14} />
      case 'rejected': return <X size={14} />
      default: return null
    }
  }

  const filteredRequests = kycRequests.filter(req => {
    const matchesSearch = req.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <AdminLayout title="KYC Verification" subtitle="Verify user identity documents">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck size={18} className="text-blue-500" />
            <p className="text-gray-500 text-sm">Total Submissions</p>
          </div>
          <p className="text-white text-2xl font-bold">156</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-yellow-500" />
            <p className="text-gray-500 text-sm">Pending Review</p>
          </div>
          <p className="text-white text-2xl font-bold">23</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Check size={18} className="text-green-500" />
            <p className="text-gray-500 text-sm">Approved</p>
          </div>
          <p className="text-white text-2xl font-bold">118</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <X size={18} className="text-red-500" />
            <p className="text-gray-500 text-sm">Rejected</p>
          </div>
          <p className="text-white text-2xl font-bold">15</p>
        </div>
      </div>

      {/* KYC List */}
      <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">KYC Requests</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-dark-700 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden p-4 space-y-3">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-dark-700 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <User size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{req.user}</p>
                    <p className="text-gray-500 text-sm">{req.email}</p>
                  </div>
                </div>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(req.status)}`}>
                  {getStatusIcon(req.status)}
                  {req.status}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText size={14} />
                  <span>{req.docType}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={14} />
                  <span>{req.submittedAt}</span>
                </div>
              </div>
              {req.status === 'pending' && (
                <div className="flex gap-2 pt-3 border-t border-gray-600">
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500/20 text-blue-500 rounded-lg text-sm">
                    <Eye size={14} /> View
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm">
                    <Check size={14} /> Approve
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm">
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">User</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Document Type</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Submitted</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id} className="border-b border-gray-800 hover:bg-dark-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <User size={18} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{req.user}</p>
                        <p className="text-gray-500 text-sm">{req.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-white">{req.docType}</td>
                  <td className="py-4 px-4 text-gray-400">{req.submittedAt}</td>
                  <td className="py-4 px-4">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${getStatusColor(req.status)}`}>
                      {getStatusIcon(req.status)}
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-white" title="View Documents">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-blue-500" title="Download">
                        <Download size={16} />
                      </button>
                      {req.status === 'pending' && (
                        <>
                          <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-green-500" title="Approve">
                            <Check size={16} />
                          </button>
                          <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500" title="Reject">
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminKYC
