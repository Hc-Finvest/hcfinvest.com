import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { useTheme } from '../context/ThemeContext'
import { 
  Users,
  TrendingUp,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertCircle,
  Activity
} from 'lucide-react'

const AdminOverview = () => {
  const navigate = useNavigate()
  const { modeColors } = useTheme()
  const [loading, setLoading] = useState(true)
  const [recentUsers, setRecentUsers] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    newThisWeek: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeTrades: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0
  })

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/admin/dashboard-stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentUsers(data.recentUsers || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
    setLoading(false)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const mainStats = [
    { 
      title: 'Total Platform Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'blue',
      subtitle: `${stats.newThisWeek} new this week`
    },
    { 
      title: 'Active (24h)', 
      value: stats.activeToday, 
      icon: Activity, 
      color: 'emerald',
      subtitle: 'Real-time activity'
    },
    { 
      title: 'Net Deposits', 
      value: `$${(stats.totalDeposits || 0).toLocaleString()}`, 
      icon: Wallet, 
      color: 'indigo',
      subtitle: 'Approved funds'
    },
    { 
      title: 'Net Withdrawals', 
      value: `$${(stats.totalWithdrawals || 0).toLocaleString()}`, 
      icon: CreditCard, 
      color: 'orange',
      subtitle: 'Processed payouts'
    }
  ]

  return (
    <AdminLayout title="System Overview" subtitle="Real-time monitoring and platform health.">
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Top Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainStats.map((stat, index) => (
            <div 
              key={index} 
              style={{ backgroundColor: modeColors.bgCard }} 
              className="rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-50 rounded-xl flex items-center justify-center border border-${stat.color}-100 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} className={`text-${stat.color}-600`} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Live
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{stat.title}</p>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                  <TrendingUp size={12} className="text-emerald-500" />
                  {stat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Operations Queue (Action Needed) */}
          <div className="lg:col-span-1 space-y-6">
            <div style={{ backgroundColor: modeColors.bgCard }} className="rounded-3xl p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-slate-900 font-bold text-lg flex items-center gap-2">
                  <Clock className="text-orange-500 w-5 h-5" />
                  Action Queue
                </h2>
                <span className="bg-orange-50 text-orange-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Pending</span>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <ShieldCheck className="text-blue-600 w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-slate-900 font-bold text-sm">KYC Approvals</p>
                      <p className="text-slate-400 text-xs">{stats.pendingKYC} awaiting review</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => navigate('/admin/transactions')}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <Wallet className="text-orange-600 w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-slate-900 font-bold text-sm">Payout Requests</p>
                      <p className="text-slate-400 text-xs">{stats.pendingWithdrawals} pending transfer</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </button>
                
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <TrendingUp className="text-indigo-600 w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-indigo-900 font-bold text-sm">Live Positions</p>
                      <p className="text-indigo-400 text-xs">{stats.activeTrades} trades running</p>
                    </div>
                  </div>
                  <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Quick Helper */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <AlertCircle className="text-blue-400 w-8 h-8 mb-4" />
                <h4 className="text-xl font-bold mb-2">Platform Pulse</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Platform data is synced in real-time. Use the refresh button for manual sync.
                </p>
              </div>
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl" />
            </div>
          </div>

          {/* Recent Registrations Table */}
          <div className="lg:col-span-2">
            <div style={{ backgroundColor: modeColors.bgCard }} className="rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-slate-900 font-bold text-xl">Recent Registrations</h2>
                  <p className="text-slate-500 text-sm mt-1">Latest users who joined the platform.</p>
                </div>
                <button 
                  onClick={fetchStats}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all text-xs font-bold border border-slate-200"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-extrabold tracking-widest border-b border-slate-100">
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Joined Date</th>
                      <th className="px-8 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {recentUsers.map((user, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                              {user.firstName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-slate-900 font-bold">{user.firstName}</p>
                              <p className="text-slate-500 text-xs font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase border border-emerald-100">Active</span>
                        </td>
                        <td className="px-8 py-5 text-slate-500 text-sm">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => navigate('/admin/users')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center justify-end gap-1 group"
                          >
                            Details
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {recentUsers.length === 0 && (
                <div className="p-20 text-center text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-medium">No recent user activity found.</p>
                </div>
              )}

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="text-slate-500 hover:text-slate-900 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  View All Platform Users
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminOverview
