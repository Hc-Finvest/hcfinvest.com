import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users,
  LogOut,
  Search,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Trash2,
  Eye,
  RefreshCw,
  CreditCard,
  Settings,
  Wallet
} from 'lucide-react'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'User Management', icon: Users, path: '/admin/dashboard' },
    { name: 'Accounts', icon: CreditCard, path: '/admin/accounts' },
    { name: 'Account Types', icon: Wallet, path: '/admin/account-types' },
    { name: 'Transactions', icon: Settings, path: '/admin/transactions' },
    { name: 'Payment Methods', icon: Settings, path: '/admin/payment-methods' },
  ]

  // Check admin auth
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      navigate('/admin')
    }
  }, [navigate])

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${API_URL}/admin/users`)
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching users:', error)
      }
      setLoading(false)
    }
    fetchUsers()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin')
  }

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Collapsible Sidebar - Note: This should ideally be handled by AdminLayout, but we'll maintain the existing structure with new theme */}
      <aside 
        className={`${sidebarExpanded ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shadow-sm`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          {sidebarExpanded && <span className="text-slate-900 font-extrabold text-xl tracking-tight">ADMIN</span>}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1.5 transition-all duration-200 ${
                activeMenu === item.name 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
              title={!sidebarExpanded ? item.name : ''}
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarExpanded && <span className="text-sm font-bold whitespace-nowrap">{item.name}</span>}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl"
            title={!sidebarExpanded ? 'Log Out' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-bold whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 py-6 border-b border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Main Command Center</h1>
            <p className="text-slate-500 text-sm font-medium">Real-time platform overview and management.</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            SECURE ACCESS
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {activeMenu === 'Dashboard' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                      <Users size={24} className="text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">+12%</span>
                  </div>
                  <p className="text-slate-500 text-xs font-extrabold uppercase tracking-widest mb-1">Total Users</p>
                  <p className="text-slate-900 text-3xl font-black tracking-tighter">{users.length}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <Users size={24} className="text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-slate-50 text-xs font-extrabold uppercase tracking-widest mb-1">Active Today</p>
                  <p className="text-slate-900 text-3xl font-black tracking-tighter">{Math.floor(users.length * 0.7)}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center border border-purple-100">
                      <Calendar size={24} className="text-purple-600" />
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-extrabold uppercase tracking-widest mb-1">New This Week</p>
                  <p className="text-slate-900 text-3xl font-black tracking-tighter">{Math.floor(users.length * 0.3)}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                      <Users size={24} className="text-orange-600" />
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs font-extrabold uppercase tracking-widest mb-1">Pending Verification</p>
                  <p className="text-slate-900 text-3xl font-black tracking-tighter">0</p>
                </div>
              </div>

              {/* Recent Users Preview */}
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Onboardings</h2>
                    <p className="text-slate-500 text-sm font-medium">Latest users who joined the platform.</p>
                  </div>
                  <button 
                    onClick={() => setActiveMenu('User Management')}
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-colors"
                  >
                    View Registry
                  </button>
                </div>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                          <span className="text-blue-600 font-black text-lg">
                            {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-slate-900 font-bold">{user.firstName || 'Unknown User'}</p>
                          <p className="text-slate-500 text-xs font-medium">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-xs font-bold block uppercase tracking-widest">Joined</span>
                        <span className="text-slate-600 text-sm font-bold">{formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && !loading && (
                    <div className="text-center py-12 flex flex-col items-center gap-4">
                       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <Users size={32} className="text-slate-300" />
                       </div>
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No users identified yet</p>
                    </div>
                  )}
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw size={32} className="text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeMenu === 'User Management' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Customer Directory</h2>
                  <p className="text-slate-500 text-sm font-medium">{users.length} active platform members recorded.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by name, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-80 font-medium"
                    />
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-900 border border-slate-200 transition-all"
                  >
                    <RefreshCw size={20} className={`${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                      <th className="py-4 px-6">Identity</th>
                      <th className="py-4 px-6">Contact Channels</th>
                      <th className="py-4 px-6">Platform Data</th>
                      <th className="py-4 px-6">Onboarding</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="text-center py-20">
                          <RefreshCw size={32} className="text-blue-500 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-20">
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                            {searchTerm ? 'No matches discovered for search query' : 'Registry currently empty'}
                           </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={index} className="hover:bg-slate-50 group transition-colors">
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 font-black text-blue-600">
                                {user.firstName?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <span className="text-slate-900 font-bold text-base">{user.firstName || 'Unknown User'}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                <Mail size={14} className="text-slate-300" />
                                <span>{user.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                                <Phone size={14} className="text-slate-200" />
                                <span>{user.phone || 'No Mobile Linked'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                               Verified
                             </span>
                          </td>
                          <td className="py-5 px-6">
                            <div className="text-slate-500 text-sm font-bold">{formatDate(user.createdAt)}</div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2.5 bg-white hover:bg-blue-600 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-200 shadow-sm">
                                <Eye size={18} />
                              </button>
                              <button className="p-2.5 bg-white hover:bg-red-600 hover:text-white text-slate-400 rounded-xl transition-all border border-slate-200 shadow-sm">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
