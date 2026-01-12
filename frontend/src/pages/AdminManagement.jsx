import { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { 
  Shield,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Key,
  Mail,
  Calendar
} from 'lucide-react'

const AdminManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const admins = [
    { id: 1, name: 'Super Admin', email: 'admin@admin.com', role: 'Super Admin', permissions: 'Full Access', lastLogin: '2024-01-10 14:30', status: 'active' },
    { id: 2, name: 'John Manager', email: 'john@coinlytix.com', role: 'Manager', permissions: 'Users, Trades', lastLogin: '2024-01-10 12:15', status: 'active' },
    { id: 3, name: 'Sarah Support', email: 'sarah@coinlytix.com', role: 'Support', permissions: 'Users, Tickets', lastLogin: '2024-01-09 18:45', status: 'active' },
    { id: 4, name: 'Mike Finance', email: 'mike@coinlytix.com', role: 'Finance', permissions: 'Funds, Reports', lastLogin: '2024-01-08 09:00', status: 'inactive' },
  ]

  const roles = ['Super Admin', 'Manager', 'Support', 'Finance', 'Viewer']

  return (
    <AdminLayout title="Admin Management" subtitle="Manage admin users and permissions">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Total Admins</p>
          <p className="text-white text-2xl font-bold">4</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Active Now</p>
          <p className="text-white text-2xl font-bold">3</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Super Admins</p>
          <p className="text-white text-2xl font-bold">1</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-800">
          <p className="text-gray-500 text-sm mb-1">Roles</p>
          <p className="text-white text-2xl font-bold">{roles.length}</p>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-dark-800 rounded-xl border border-gray-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold text-lg">Admin Users</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 bg-dark-700 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600"
              />
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Plus size={16} />
              <span>Add Admin</span>
            </button>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden p-4 space-y-3">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-dark-700 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    admin.role === 'Super Admin' ? 'bg-red-500/20' : 'bg-blue-500/20'
                  }`}>
                    <Shield size={18} className={admin.role === 'Super Admin' ? 'text-red-500' : 'text-blue-500'} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{admin.name}</p>
                    <p className="text-gray-500 text-sm">{admin.role}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  admin.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {admin.status}
                </span>
              </div>
              <div className="space-y-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail size={14} />
                  <span>{admin.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Key size={14} />
                  <span>{admin.permissions}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={14} />
                  <span>Last login: {admin.lastLogin}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-600">
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500/20 text-blue-500 rounded-lg text-sm">
                  <Edit size={14} /> Edit
                </button>
                <button className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Admin</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Email</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Role</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Permissions</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Last Login</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Status</th>
                <th className="text-left text-gray-500 text-sm font-medium py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-800 hover:bg-dark-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        admin.role === 'Super Admin' ? 'bg-red-500/20' : 'bg-blue-500/20'
                      }`}>
                        <Shield size={18} className={admin.role === 'Super Admin' ? 'text-red-500' : 'text-blue-500'} />
                      </div>
                      <span className="text-white font-medium">{admin.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-400">{admin.email}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      admin.role === 'Super Admin' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-400">{admin.permissions}</td>
                  <td className="py-4 px-4 text-gray-400">{admin.lastLogin}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      admin.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-white">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-blue-500">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 hover:bg-dark-600 rounded-lg transition-colors text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
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

export default AdminManagement
