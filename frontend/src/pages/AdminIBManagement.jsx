import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import AdminLayout from '../components/AdminLayout'
import { 
  UserCog,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Percent,
  Check,
  X,
  RefreshCw,
  Settings,
  ChevronDown,
  ArrowRightLeft,
  UserPlus,
  Award,
  Trophy,
  Crown,
  Target,
  Calendar,
  ShieldCheck,
  ArrowRight
} from 'lucide-react'

const AdminIBManagement = () => {
  const { modeColors } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('ibs') // ibs, applications, plans, settings, transfer
  const [ibs, setIbs] = useState([])
  const [applications, setApplications] = useState([])
  const [plans, setPlans] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedIB, setSelectedIB] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  
  // Referral Transfer states
  const [allUsers, setAllUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [targetIB, setTargetIB] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  
  // IB Levels states
  const [ibLevels, setIbLevels] = useState([])
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [editingLevel, setEditingLevel] = useState(null)
  
  // IB Details Modal states
  const [showIBModal, setShowIBModal] = useState(false)
  const [viewingIB, setViewingIB] = useState(null)
  const [ibCommission, setIbCommission] = useState('')
  const [ibPlan, setIbPlan] = useState('')
  const [savingIB, setSavingIB] = useState(false)
  const [ibAutoUpgradeEnabled, setIbAutoUpgradeEnabled] = useState(true)
  const [ibManualCommissionEnabled, setIbManualCommissionEnabled] = useState(false)
  const [ibManualCommissionType, setIbManualCommissionType] = useState('PER_LOT')
  const [ibManualCommissionLevels, setIbManualCommissionLevels] = useState({ level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 })
  const [ibManualCommissionNotes, setIbManualCommissionNotes] = useState('')

  const getAdminHeaders = () => {
    const adminToken = localStorage.getItem('adminToken')
    return {
      'Content-Type': 'application/json',
      ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {})
    }
  }

  useEffect(() => {
    fetchDashboard()
    fetchIBs()
    fetchApplications()
    fetchPlans()
    fetchSettings()
    fetchAllUsers()
    fetchIBLevels()

    // Auto-refresh every 10 seconds
    const refreshInterval = setInterval(() => {
      fetchDashboard()
      fetchIBs()
      fetchApplications()
    }, 10000)

    return () => clearInterval(refreshInterval)
  }, [])

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`, { headers: getAdminHeaders() })
      const data = await res.json()
      setAllUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleTransferReferrals = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to transfer')
      return
    }
    if (!targetIB) {
      alert('Please select a target IB')
      return
    }

    setTransferLoading(true)
    try {
      const res = await fetch(`${API_URL}/ib/admin/transfer-referrals`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          userIds: selectedUsers,
          targetIBId: targetIB
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(`Successfully transferred ${data.transferredCount} users to the selected IB`)
        setSelectedUsers([])
        setTargetIB('')
        fetchAllUsers()
        fetchIBs()
      } else {
        alert(data.message || 'Failed to transfer referrals')
      }
    } catch (error) {
      console.error('Error transferring referrals:', error)
      alert('Failed to transfer referrals')
    }
    setTransferLoading(false)
  }

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const selectAllUsers = () => {
    const filteredUserIds = filteredUsers.map(u => u._id)
    setSelectedUsers(filteredUserIds)
  }

  const deselectAllUsers = () => {
    setSelectedUsers([])
  }

  const filteredUsers = allUsers.filter(user => 
    user.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user._id?.includes(userSearchTerm)
  )

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/dashboard`, { headers: getAdminHeaders() })
      const data = await res.json()
      // Handle both old format (data.dashboard) and new format (data.stats)
      if (data.stats) {
        setDashboard({
          ibs: { total: data.stats.totalIBs, active: data.stats.activeIBs, pending: data.stats.pendingIBs },
          referrals: { total: 0 },
          commissions: { 
            total: { totalCommission: data.stats.totalCommissionPaid || 0 },
            today: { totalCommission: 0 }
          },
          withdrawals: { pending: { totalPending: 0, count: 0 } }
        })
      } else if (data.dashboard) {
        setDashboard(data.dashboard)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    }
  }

  const fetchIBs = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/all`, { headers: getAdminHeaders() })
      const data = await res.json()
      setIbs(data.ibs || [])
    } catch (error) {
      console.error('Error fetching IBs:', error)
    }
    setLoading(false)
  }

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/pending`, { headers: getAdminHeaders() })
      const data = await res.json()
      setApplications(data.pending || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    }
  }

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/plans`, { headers: getAdminHeaders() })
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/settings`, { headers: getAdminHeaders() })
      const data = await res.json()
      if (data.settings) setSettings(data.settings)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchIBLevels = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/levels`, { headers: getAdminHeaders() })
      const data = await res.json()
      setIbLevels(data.levels || [])
    } catch (error) {
      console.error('Error fetching IB levels:', error)
    }
  }

  const handleSaveLevel = async (levelData) => {
    try {
      const url = editingLevel 
        ? `${API_URL}/ib/admin/levels/${editingLevel._id}`
        : `${API_URL}/ib/admin/levels`
      const method = editingLevel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(levelData)
      })
      const data = await res.json()
      if (data.success) {
        alert(editingLevel ? 'Level updated!' : 'Level created!')
        setShowLevelModal(false)
        setEditingLevel(null)
        fetchIBLevels()
      } else {
        alert(data.message || 'Failed to save level')
      }
    } catch (error) {
      console.error('Error saving level:', error)
      alert('Failed to save level')
    }
  }

  const handleDeleteLevel = async (levelId) => {
    if (!confirm('Are you sure you want to delete this level?')) return
    
    try {
      const res = await fetch(`${API_URL}/ib/admin/levels/${levelId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        alert('Level deleted!')
        fetchIBLevels()
      } else {
        alert(data.message || 'Failed to delete level')
      }
    } catch (error) {
      console.error('Error deleting level:', error)
      alert('Failed to delete level')
    }
  }

  const handleApprove = async (userId, planId = null) => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/approve/${userId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ planId: planId })
      })
      const data = await res.json()
      if (data.success) {
        alert('IB approved successfully!')
        fetchApplications()
        fetchIBs()
        fetchDashboard()
      } else {
        alert(data.message || 'Failed to approve')
      }
    } catch (error) {
      console.error('Error approving:', error)
      alert('Failed to approve IB')
    }
  }

  const handleReject = async (userId) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const res = await fetch(`${API_URL}/ib/admin/reject/${userId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        alert('IB application rejected')
        fetchApplications()
        fetchDashboard()
      } else {
        alert(data.message || 'Failed to reject')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      alert('Failed to reject IB application')
    }
  }

  const handleBlock = async (userId) => {
    const reason = prompt('Enter block reason:')
    if (!reason) return

    try {
      const res = await fetch(`${API_URL}/ib/admin/block/${userId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        alert('IB blocked')
        fetchIBs()
        fetchDashboard()
      }
    } catch (error) {
      console.error('Error blocking:', error)
    }
  }

  const handleSuspend = async (ibId) => {
    if (!confirm('Are you sure you want to suspend this IB?')) return

    try {
      const res = await fetch(`${API_URL}/ib/admin/suspend/${ibId}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ adminId: 'admin' })
      })
      const data = await res.json()
      if (data.ibUser) {
        alert('IB suspended')
        fetchIBs()
      }
    } catch (error) {
      console.error('Error suspending:', error)
    }
  }

  const handleViewIB = (ib) => {
    setViewingIB(ib)
    setIbCommission(ib.ibLevelId?._id || '')
    setIbPlan(ib.ibPlanId?._id || '')
    setIbAutoUpgradeEnabled(ib.autoUpgradeEnabled !== false)
    setIbManualCommissionEnabled(Boolean(ib.ibCommissionOverride?.enabled))
    setIbManualCommissionType(ib.ibCommissionOverride?.commissionType || 'PER_LOT')
    setIbManualCommissionLevels({
      level1: Number(ib.ibCommissionOverride?.levels?.level1 || 0),
      level2: Number(ib.ibCommissionOverride?.levels?.level2 || 0),
      level3: Number(ib.ibCommissionOverride?.levels?.level3 || 0),
      level4: Number(ib.ibCommissionOverride?.levels?.level4 || 0),
      level5: Number(ib.ibCommissionOverride?.levels?.level5 || 0)
    })
    setIbManualCommissionNotes(ib.ibCommissionOverride?.notes || '')
    setShowIBModal(true)
  }

  const handleSaveIBDetails = async () => {
    if (!viewingIB) return
    setSavingIB(true)
    
    try {
      const res = await fetch(`${API_URL}/ib/admin/update/${viewingIB._id}`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          levelId: ibCommission || null,
          planId: ibPlan || null,
          autoUpgradeEnabled: ibAutoUpgradeEnabled,
          commissionOverride: {
            enabled: ibManualCommissionEnabled,
            commissionType: ibManualCommissionType,
            levels: ibManualCommissionLevels,
            notes: ibManualCommissionNotes
          }
        })
      })
      const data = await res.json()
      if (data.success) {
        alert('IB updated successfully!')
        setShowIBModal(false)
        setViewingIB(null)
        fetchIBs()
      } else {
        alert(data.message || 'Failed to update IB')
      }
    } catch (error) {
      console.error('Error updating IB:', error)
      alert('Failed to update IB')
    }
    setSavingIB(false)
  }

  const handleSavePlan = async (planData) => {
    try {
      const url = editingPlan 
        ? `${API_URL}/ib/admin/plans/${editingPlan._id}`
        : `${API_URL}/ib/admin/plans`
      const method = editingPlan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(planData)
      })
      const data = await res.json()
      if (data.success || data.plan) {
        alert(editingPlan ? 'Plan updated!' : 'Plan created!')
        setShowPlanModal(false)
        setEditingPlan(null)
        fetchPlans()
      } else {
        alert(data.message || 'Failed to save plan')
      }
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Failed to save plan')
    }
  }

  const handleUpdateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/settings`, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify(newSettings)
      })
      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
        alert('Settings updated!')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  const filteredIBs = ibs.filter(ib => 
    ib.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ib.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ib.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout title="Partnership Ecosystem" subtitle="Orchestrate Introducing Brokers, tiers, and referral networks">
      {/* Dynamic Stats Portfolio */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Verified Partners', value: dashboard?.ibs?.total || 0, sub: `${dashboard?.ibs?.pending || 0} pending review`, icon: UserCog, color: 'blue' },
          { label: 'Network Reach', value: dashboard?.referrals?.total || 0, sub: 'Total Referrals', icon: Users, color: 'green' },
          { label: 'Settled Comms', value: `$${(dashboard?.commissions?.total?.totalCommission || 0).toFixed(2)}`, sub: `Today: $${(dashboard?.commissions?.today?.totalCommission || 0).toFixed(2)}`, icon: DollarSign, color: 'purple' },
          { label: 'Frozen Capital', value: `$${(dashboard?.withdrawals?.pending?.totalPending || 0).toFixed(2)}`, sub: `${dashboard?.withdrawals?.pending?.count || 0} payout requests`, icon: Target, color: 'orange' }
        ].map((stat, idx) => (
          <div key={idx} style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2rem] p-6 border shadow-sm group hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center border border-${stat.color}-500/20 shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} className={`text-${stat.color}-600`} />
              </div>
              <div style={{ backgroundColor: modeColors.bgSecondary }} className="px-2 py-1 rounded-lg">
                <span style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Metrics</span>
              </div>
            </div>
            <p style={{ color: modeColors.textSecondary }} className="text-xs font-black uppercase tracking-widest italic opacity-70 mb-1">{stat.label}</p>
            <p style={{ color: modeColors.text }} className="text-3xl font-black tracking-tight">{stat.value}</p>
            <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${stat.color === 'blue' ? 'text-blue-500' : stat.color === 'green' ? 'text-green-500' : stat.color === 'purple' ? 'text-purple-500' : 'text-orange-500'}`}>
              <ArrowRight size={10} /> {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tab Navigation Ecosystem */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-4 custom-scrollbar">
        {[
          { id: 'ibs', label: 'Verified Partners', count: dashboard?.ibs?.active, icon: Award },
          { id: 'applications', label: 'Review Queue', count: applications.length, icon: UserPlus },
          { id: 'levels', label: 'Echelon Tiers', count: ibLevels.length, icon: Trophy },
          { id: 'plans', label: 'Commission Plans', count: plans.length, icon: Percent },
          { id: 'transfer', label: 'Lineage Migrator', icon: ArrowRightLeft },
          { id: 'settings', label: 'System Logic', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              backgroundColor: activeTab === tab.id ? '#3B82F6' : modeColors.card,
              color: activeTab === tab.id ? '#FFFFFF' : modeColors.text,
              borderColor: activeTab === tab.id ? '#3B82F6' : modeColors.border,
            }}
            className={`px-6 py-4 rounded-2xl whitespace-nowrap flex items-center gap-3 border shadow-sm transition-all active:scale-[0.98] font-black text-[10px] uppercase tracking-widest ${
              activeTab === tab.id ? 'shadow-lg shadow-blue-500/20' : 'hover:border-blue-200'
            }`}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
            {tab.count !== undefined && (
              <span 
                style={{ backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : modeColors.bgSecondary }} 
                className={`px-3 py-1 rounded-full text-[10px] font-black border border-white/10`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active IBs Hub */}
      {activeTab === 'ibs' && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div style={{ borderBottomColor: modeColors.border }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 sm:p-8 border-b">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
              <div>
                <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Partner Registry</h2>
                <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60">Verified agents and institutional partners</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative group">
                <Search size={18} style={{ color: modeColors.textSecondary }} className="absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Master Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full sm:w-64 border-2 rounded-2xl pl-12 pr-4 py-3 font-bold text-sm focus:outline-none focus:border-blue-500 transition-all placeholder-slate-400 shadow-inner"
                />
              </div>
              <button 
                onClick={() => { fetchIBs(); fetchDashboard(); }}
                style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
                className="flex items-center justify-center p-3 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
                title="Deep Sync"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 grayscale opacity-50">
              <RefreshCw size={48} className="animate-spin text-slate-300 mb-4" />
              <p style={{ color: modeColors.textSecondary }} className="font-black text-[10px] uppercase tracking-widest">Querying Partner Database...</p>
            </div>
          ) : filteredIBs.length === 0 ? (
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="text-center py-32 rounded-[2rem] border-4 border-dashed border-slate-100 m-8">
              <div style={{ backgroundColor: modeColors.card }} className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-slate-200">
                <Users size={40} />
              </div>
              <p style={{ color: modeColors.text }} className="font-black text-xl mb-2 tracking-tight">No Matches Found</p>
              <p style={{ color: modeColors.textSecondary }} className="font-medium">Try broadening your search parameters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: modeColors.bgSecondary, borderBottomColor: modeColors.border }} className="border-b">
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Identity</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">Referral ID</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Policy Tier</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">Downline</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-right">Settlements</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-left py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60 text-center">State</th>
                    <th style={{ color: modeColors.textSecondary }} className="text-right py-5 px-8 font-black text-[10px] uppercase tracking-[0.2em] opacity-60">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredIBs.map((ib) => (
                    <tr key={ib._id} className="group hover:bg-slate-50/50 transition-all">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <span className="text-blue-600 font-black text-xl">{ib.firstName?.charAt(0) || '?'}</span>
                          </div>
                          <div className="min-w-0">
                            <p style={{ color: modeColors.text }} className="font-black text-lg tracking-tight truncate">{ib.firstName} {ib.lastName}</p>
                            <p style={{ color: modeColors.textSecondary }} className="text-xs font-bold opacity-60 truncate">UID: {ib.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span style={{ color: modeColors.text, backgroundColor: modeColors.bgSecondary }} className="font-mono font-black text-xs px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner group-hover:bg-white group-hover:border-blue-200 transition-all">{ib.referralCode || 'UNASSIGNED'}</span>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-2">
                          <Award size={14} className="text-orange-500" />
                          <div>
                            <p style={{ color: modeColors.text }} className="font-black text-xs uppercase tracking-wider">{ib.ibLevelId?.name || `Level ${ib.ibLevelOrder || ib.ibLevel || 1}`}</p>
                            <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-bold opacity-60">{ib.ibPlanId?.name || 'No plan assigned'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-100">
                          <Users size={12} className="text-blue-500" />
                          <span style={{ color: modeColors.text }} className="font-black text-sm">{ib.referralCount || 0}</span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <p className="text-green-600 font-black text-lg tracking-tighter">${(ib.totalEarned || 0).toFixed(2)}</p>
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-40">Lifetime Value</p>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${
                          ib.ibStatus === 'ACTIVE' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 
                          ib.ibStatus === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
                          ib.ibStatus === 'BLOCKED' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                          'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          {ib.ibStatus || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleViewIB(ib)}
                            style={{ backgroundColor: modeColors.bgSecondary }}
                            className="p-3 border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                            title="Inspect Intelligence"
                          >
                            <Eye size={20} />
                          </button>
                          <button 
                            onClick={() => handleViewIB(ib)}
                            style={{ backgroundColor: modeColors.bgSecondary }}
                            className="p-3 border border-slate-100 rounded-2xl text-slate-400 hover:text-orange-500 hover:border-orange-200 transition-all shadow-sm active:scale-95"
                            title="Modify Directives"
                          >
                            <Edit size={20} />
                          </button>
                          {ib.ibStatus === 'ACTIVE' && (
                            <button 
                              onClick={() => handleBlock(ib._id)}
                              style={{ backgroundColor: modeColors.bgSecondary }}
                              className="p-3 border border-slate-100 rounded-2xl text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                              title="Terminate Access"
                            >
                              <X size={20} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Review Queue (Applications) */}
      {activeTab === 'applications' && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div style={{ borderBottomColor: modeColors.border }} className="flex items-center justify-between p-6 sm:p-8 border-b">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
              <div>
                <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Review Queue</h2>
                <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60">Evaluate and onboard new partner candidates</p>
              </div>
            </div>
          </div>

          {applications.length === 0 ? (
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="text-center py-32 rounded-[2rem] border-4 border-dashed border-slate-100 m-8">
              <div style={{ backgroundColor: modeColors.card }} className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100 text-slate-200">
                <Check size={40} />
              </div>
              <p style={{ color: modeColors.text }} className="font-black text-xl mb-2 tracking-tight">Queue Clear</p>
              <p style={{ color: modeColors.textSecondary }} className="font-medium">All applications have been processed</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {applications.map((app) => (
                <div key={app._id} className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-slate-50/50 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                      <span className="text-amber-600 font-black text-2xl">{app.firstName?.charAt(0) || '?'}</span>
                    </div>
                    <div>
                      <p style={{ color: modeColors.text }} className="font-black text-xl tracking-tight">{app.firstName} {app.lastName}</p>
                      <p style={{ color: modeColors.textSecondary }} className="text-sm font-bold opacity-60 mb-2">{app.email}</p>
                      <div style={{ backgroundColor: modeColors.bgSecondary }} className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Calendar size={10} /> {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <select 
                        style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                        className="appearance-none w-full md:w-56 border-2 rounded-2xl pl-5 pr-12 py-3 font-bold text-sm focus:outline-none focus:border-blue-500 transition-all shadow-inner cursor-pointer"
                        id={`plan-${app._id}`}
                        defaultValue=""
                      >
                        <option value="" disabled>Assign Contract Model...</option>
                        {plans.map(plan => (
                          <option key={plan._id} value={plan._id}>{plan.name}</option>
                        ))}
                        <option value="default">Global Default Plan</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const planSelect = document.getElementById(`plan-${app._id}`)
                          const planId = planSelect?.value === 'default' ? null : planSelect?.value
                          if (!planSelect?.value) {
                            alert('Please select a plan first')
                            return
                          }
                          handleApprove(app._id, planId)
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-2xl hover:bg-green-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                      >
                        <Check size={18} /> Provision
                      </button>
                      <button
                        onClick={() => handleReject(app._id)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                      >
                        <X size={18} /> Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Echelon Tiers (IB Levels) */}
      {activeTab === 'levels' && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div style={{ borderBottomColor: modeColors.border }} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 border-b gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-purple-500 rounded-full" />
              <div>
                <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Echelon Tiers</h2>
                <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60">Growth path architecture and yield logic</p>
              </div>
            </div>
            <button
              onClick={() => { setEditingLevel(null); setShowLevelModal(true); }}
              className="flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
              <Plus size={18} /> Architect Level
            </button>
          </div>

          {ibLevels.length === 0 ? (
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="text-center py-32 rounded-[2rem] border-4 border-dashed border-slate-100 m-8">
              <Award size={64} className="mx-auto mb-6 text-slate-200" />
              <p style={{ color: modeColors.text }} className="font-black text-xl mb-2 tracking-tight">Logic Void Detected</p>
              <p style={{ color: modeColors.textSecondary }} className="font-medium mb-8 italic">No progression tiers currently exist in the system</p>
              <button
                onClick={async () => {
                  await fetch(`${API_URL}/ib/admin/init-levels`, { method: 'POST', headers: getAdminHeaders() })
                  fetchIBLevels()
                }}
                className="px-8 py-4 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
              >
                Synthesize Standard Tiers
              </button>
            </div>
          ) : (
            <div className="p-6 sm:p-8 grid grid-cols-1 gap-6">
              {ibLevels.map((level) => (
                <div key={level._id} style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="group rounded-[2rem] border-2 p-8 hover:border-purple-500/20 hover:shadow-xl transition-all relative overflow-hidden">
                  {/* Decorative background accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform translate-x-10 -translate-y-10">
                    <Trophy size={160} style={{ color: level.color }} />
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div 
                        className="w-20 h-20 rounded-3xl flex items-center justify-center border-2 border-white shadow-xl transform -rotate-3 group-hover:rotate-0 transition-transform"
                        style={{ backgroundColor: `${level.color}20`, borderColor: `${level.color}40` }}
                      >
                        {level.icon === 'crown' ? <Crown size={40} style={{ color: level.color }} /> :
                         level.icon === 'trophy' ? <Trophy size={40} style={{ color: level.color }} /> :
                         <Award size={40} style={{ color: level.color }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tighter uppercase">{level.name}</h3>
                          <span style={{ backgroundColor: modeColors.card }} className="px-3 py-1 rounded-xl text-[10px] font-black uppercase border border-slate-100 shadow-sm opacity-60">Order {level.order}</span>
                          {!level.isActive && (
                            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-[10px] font-black uppercase border border-red-500/20 rounded-xl">Deactivated</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <p style={{ color: modeColors.textSecondary }} className="text-sm font-bold opacity-60 flex items-center gap-2">
                            <Target size={14} className="text-purple-500" />
                            Threshold: {level.referralTarget} Direct Referrals
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => { setEditingLevel(level); setShowLevelModal(true); }}
                        style={{ backgroundColor: modeColors.card }}
                        className="p-4 border border-slate-100 rounded-2xl text-slate-400 hover:text-purple-600 hover:border-purple-200 transition-all shadow-sm active:scale-95"
                        title="Reconfigure"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteLevel(level._id)}
                        style={{ backgroundColor: modeColors.card }}
                        className="p-4 border border-slate-100 rounded-2xl text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm active:scale-95"
                        title="Purge"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Revenue Distribution Portfolio */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 pt-8 border-t border-slate-100/50">
                    <div style={{ backgroundColor: modeColors.card }} className="rounded-2xl p-4 border border-slate-100 shadow-sm">
                      <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Base Yield</p>
                      <p style={{ color: modeColors.text }} className="font-black text-xl">
                        {level.commissionType === 'PER_LOT' ? '$' : ''}{level.commissionRate}
                        <span className="text-[10px] opacity-40 italic ml-1">
                          {level.commissionType === 'PERCENT' ? '%' : '/lot'}
                        </span>
                      </p>
                    </div>
                    {[1, 2, 3, 4, 5].map(lvl => (
                      <div key={lvl} style={{ backgroundColor: modeColors.card }} className="rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Gen L{lvl} Pay</p>
                        <p className="text-green-600 font-black text-xl">${level.downlineCommission?.[`level${lvl}`] || 0}<span className="text-[10px] opacity-40 font-bold italic ml-1">/lot</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commission Plans Hub */}
      {activeTab === 'plans' && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div style={{ borderBottomColor: modeColors.border }} className="flex items-center justify-between p-6 sm:p-8 border-b gap-6">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <div>
                <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Contractual Archetypes</h2>
                <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60">Revenue sharing models and multi-level payout logic</p>
              </div>
            </div>
            <button
              onClick={() => { setEditingPlan(null); setShowPlanModal(true); }}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus size={18} /> Forge New Plan
            </button>
          </div>

          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border }} className="group relative rounded-[2rem] border-2 p-8 hover:border-blue-500/20 hover:shadow-xl transition-all overflow-hidden">
                <div className="flex items-start justify-between relative z-10 mb-6">
                  <div>
                    <h3 style={{ color: modeColors.text }} className="font-black text-xl tracking-tight uppercase flex items-center gap-2">
                      {plan.name}
                      {plan.isDefault && (
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase border border-blue-500/20 rounded-xl">Mandatory Baseline</span>
                      )}
                    </h3>
                    <p style={{ color: modeColors.textSecondary }} className="text-xs font-medium opacity-60 mt-1 max-w-[80%]">{plan.description || 'Global revenue distribution model'}</p>
                  </div>
                  <button
                    onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }}
                    style={{ backgroundColor: modeColors.card }}
                    className="p-3 border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                  >
                    <Edit size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-2 relative z-10">
                  {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} style={{ backgroundColor: modeColors.card }} className="rounded-2xl p-3 border border-slate-100 shadow-sm text-center">
                      <p style={{ color: modeColors.textSecondary }} className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Gen L{level}</p>
                      <p className="text-blue-600 font-black text-sm">
                        {plan.commissionType === 'PER_LOT' ? '$' : ''}{plan.levelCommissions?.[`level${level}`] || 0}
                        <span className="text-[8px] opacity-40 font-bold ml-0.5">
                          {plan.commissionType === 'PERCENTAGE' ? '%' : ''}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Aesthetic background mesh */}
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Settings Portfolio */}
      {activeTab === 'settings' && settings && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4 p-8 sm:p-12">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-1.5 h-8 bg-blue-500 rounded-full" />
            <div>
              <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Ecosystem Logic</h2>
              <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60">Master toggles and global parameter injection</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {[
                { label: 'Network Vitality', sub: 'Enable or disable the entire IB architecture', icon: Settings, value: settings.isEnabled, key: 'isEnabled' },
                { label: 'Inbound Onboarding', sub: 'Allow new users to submit partner applications', icon: UserPlus, value: settings.allowNewApplications, key: 'allowNewApplications' },
                { label: 'Autonomous Provisioning', sub: 'Automatically approve incoming applications', icon: Check, value: settings.autoApprove, key: 'autoApprove' }
              ].map((toggle, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg ${toggle.value ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <toggle.icon size={20} />
                    </div>
                    <div>
                      <p style={{ color: modeColors.text }} className="font-black text-sm uppercase tracking-tight">{toggle.label}</p>
                      <p style={{ color: modeColors.textSecondary }} className="text-xs font-medium opacity-60">{toggle.sub}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateSettings({ [toggle.key]: !toggle.value })}
                    className={`w-14 h-8 rounded-full transition-all relative ${toggle.value ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${toggle.value ? 'translate-x-[1.75rem]' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-8">
              {[
                { label: 'Identity Verification', sub: 'Require KYC clearance for partner status', icon: ShieldCheck, value: settings.ibRequirements?.kycRequired, path: ['ibRequirements', 'kycRequired'] },
                { label: 'Settlement Auditing', sub: 'Manual approval for all payout requests', icon: DollarSign, value: settings.commissionSettings?.withdrawalApprovalRequired, path: ['commissionSettings', 'withdrawalApprovalRequired'] }
              ].map((toggle, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-lg ${toggle.value ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <toggle.icon size={20} />
                    </div>
                    <div>
                      <p style={{ color: modeColors.text }} className="font-black text-sm uppercase tracking-tight">{toggle.label}</p>
                      <p style={{ color: modeColors.textSecondary }} className="text-xs font-medium opacity-60">{toggle.sub}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nested = { ...settings[toggle.path[0]], [toggle.path[1]]: !toggle.value }
                      handleUpdateSettings({ [toggle.path[0]]: nested })
                    }}
                    className={`w-14 h-8 rounded-full transition-all relative ${toggle.value ? 'bg-green-500 shadow-lg shadow-green-500/30' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${toggle.value ? 'translate-x-[1.75rem]' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}

              <div className="p-8 bg-slate-50 rounded-3xl border-2 border-slate-100 shadow-inner">
                <p style={{ color: modeColors.text }} className="font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500" /> Capital Threshold
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-blue-500 italic">$</span>
                  <input
                    type="number"
                    value={settings.commissionSettings?.minWithdrawalAmount || 50}
                    onChange={(e) => handleUpdateSettings({ commissionSettings: { ...settings.commissionSettings, minWithdrawalAmount: parseFloat(e.target.value) } })}
                    style={{ backgroundColor: modeColors.card, color: modeColors.text }}
                    className="w-full border-2 border-white rounded-2xl pl-10 pr-4 py-4 font-black text-xl focus:outline-none focus:border-blue-500 shadow-sm transition-all"
                  />
                  <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50 px-4">Internal Minimum Payout Threshold</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lineage Migrator (Referral Transfer) */}
      {activeTab === 'transfer' && (
        <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] border overflow-hidden shadow-sm shadow-slate-100 animate-in fade-in slide-in-from-bottom-4">
          <div style={{ borderBottomColor: modeColors.border }} className="p-8 sm:p-10 border-b">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-purple-500 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                <ArrowRightLeft size={24} />
              </div>
              <div>
                <h2 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight">Lineage Migrator</h2>
                <p style={{ color: modeColors.textSecondary }} className="text-sm font-medium opacity-60 italic">Reprogram referral hierarchies and partner associations</p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10 space-y-10">
            {/* Target IB Vector */}
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="rounded-3xl p-8 border-2 border-slate-100 shadow-inner">
              <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-4 px-2 opacity-60">Target Recipient IB</label>
              <div className="relative">
                <select
                  value={targetIB}
                  onChange={(e) => setTargetIB(e.target.value)}
                  style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                  className="appearance-none w-full border-2 rounded-2xl pl-6 pr-12 py-5 font-black text-lg focus:outline-none focus:border-purple-500 shadow-sm cursor-pointer transition-all"
                >
                  <option value="">-- Interface with Host IB Tier --</option>
                  {ibs.filter(ib => ib.ibStatus === 'ACTIVE').map(ib => (
                    <option key={ib._id} value={ib._id}>
                      {ib.firstName} {ib.lastName} — CID: {ib.referralCode || 'X'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={24} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
            </div>

            {/* Mass Selection Vector */}
            <div style={{ backgroundColor: modeColors.bgSecondary }} className="rounded-3xl p-8 border-2 border-slate-100 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 px-2">
                <div>
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1 opacity-60">Active Selection Buffer</label>
                  <p className="text-purple-600 font-black text-2xl tracking-tighter">{selectedUsers.length} <span className="text-xs uppercase opacity-60 tracking-widest">Identities Locked</span></p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllUsers}
                    className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    Lock All Matches
                  </button>
                  <button
                    onClick={deselectAllUsers}
                    style={{ backgroundColor: modeColors.card, color: modeColors.text }}
                    className="px-6 py-3 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                  >
                    Flush Buffer
                  </button>
                </div>
              </div>

              <div className="relative mb-6">
                <Search size={22} style={{ color: modeColors.textSecondary }} className="absolute left-6 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="text"
                  placeholder="Scan Network by Name, Email, or UUIDHash..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl pl-16 pr-6 py-5 font-bold text-lg focus:outline-none focus:border-purple-500 shadow-sm transition-all placeholder-slate-300"
                />
              </div>

              <div className="max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-24 grayscale opacity-30">
                    <Users size={64} className="mx-auto mb-4" />
                    <p className="font-black text-xs uppercase tracking-widest">No matching identity vectors found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      style={{ 
                        backgroundColor: selectedUsers.includes(user._id) ? 'rgba(139, 92, 246, 0.05)' : modeColors.card,
                        borderColor: selectedUsers.includes(user._id) ? 'rgba(139, 92, 246, 0.3)' : 'transparent'
                      }}
                      className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border-2 group hover:shadow-lg ${
                        selectedUsers.includes(user._id) ? 'shadow-purple-500/10' : 'hover:border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                          selectedUsers.includes(user._id)
                            ? 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-500/30'
                            : 'border-slate-200 group-hover:border-purple-200'
                        }`}>
                          {selectedUsers.includes(user._id) && <Check size={16} className="text-white" />}
                        </div>
                        <div>
                          <p style={{ color: modeColors.text }} className="font-black text-lg tracking-tight">{user.firstName} {user.lastName || ''}</p>
                          <p style={{ color: modeColors.textSecondary }} className="text-xs font-bold opacity-60 tracking-tight italic">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black opacity-30 tracking-[0.2em] uppercase font-mono mb-1">METADATA_ID_{user._id?.slice(-8)}</p>
                        {user.referredBy && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-amber-600 font-black text-[9px] uppercase tracking-widest">Bridged to: {user.referredBy?.slice(-6)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Finalize Operation Control */}
            <div className="flex justify-center pt-8">
              <button
                onClick={handleTransferReferrals}
                disabled={transferLoading || selectedUsers.length === 0 || !targetIB}
                className={`group relative overflow-hidden px-14 py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                  transferLoading || selectedUsers.length === 0 || !targetIB
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border-4 border-slate-50'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-500/40'
                }`}
              >
                <div className="relative z-10 flex items-center gap-3">
                  {transferLoading ? (
                    <>
                      <RefreshCw size={24} className="animate-spin" />
                      <span>Synchronizing...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                      <span>Commit Migration Cycle</span>
                    </>
                  )}
                </div>
                {!transferLoading && selectedUsers.length > 0 && targetIB && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {showPlanModal && (
        <PlanModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => { setShowPlanModal(false); setEditingPlan(null); }}
        />
      )}

      {/* Level Modal */}
      {showLevelModal && (
        <LevelModal
          level={editingLevel}
          onSave={handleSaveLevel}
          onClose={() => { setShowLevelModal(false); setEditingLevel(null); }}
          existingOrders={ibLevels.map(l => l.order)}
        />
      )}

      {/* IB Details Modal */}
      {showIBModal && (
        <IBDetailsModal
          ib={viewingIB}
          plans={plans}
          ibLevels={ibLevels}
          ibCommission={ibCommission}
          setIbCommission={setIbCommission}
          ibPlan={ibPlan}
          setIbPlan={setIbPlan}
          ibAutoUpgradeEnabled={ibAutoUpgradeEnabled}
          setIbAutoUpgradeEnabled={setIbAutoUpgradeEnabled}
          ibManualCommissionEnabled={ibManualCommissionEnabled}
          setIbManualCommissionEnabled={setIbManualCommissionEnabled}
          ibManualCommissionType={ibManualCommissionType}
          setIbManualCommissionType={setIbManualCommissionType}
          ibManualCommissionLevels={ibManualCommissionLevels}
          setIbManualCommissionLevels={setIbManualCommissionLevels}
          ibManualCommissionNotes={ibManualCommissionNotes}
          setIbManualCommissionNotes={setIbManualCommissionNotes}
          onSave={handleSaveIBDetails}
          onClose={() => { setShowIBModal(false); setViewingIB(null); }}
          saving={savingIB}
        />
      )}
    </AdminLayout>
  )
}

// Plan Modal Component
const PlanModal = ({ plan, onSave, onClose }) => {
  const { modeColors } = useTheme()
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    maxLevels: plan?.maxLevels || 3,
    commissionType: plan?.commissionType || 'PER_LOT',
    levelCommissions: plan?.levelCommissions || { level1: 5, level2: 3, level3: 2, level4: 1, level5: 0.5 },
    isDefault: plan?.isDefault || false
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] w-full max-w-lg border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div style={{ borderBottomColor: modeColors.border }} className="p-8 border-b">
          <h3 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight uppercase">Plan Architect</h3>
          <p style={{ color: modeColors.textSecondary }} className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">Revenue Distribution Protocol</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Identifier</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full border-2 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                placeholder="PRO_TRADER_A..."
                required
              />
            </div>
            <div>
              <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Detailed Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                className="w-full border-2 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-blue-500 shadow-inner h-24 resize-none"
                placeholder="Define the scope of this model..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Logic Payload</label>
                <div className="relative">
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="appearance-none w-full border-2 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-blue-500 shadow-inner cursor-pointer"
                  >
                    <option value="PER_LOT">Fixed USD / Lot</option>
                    <option value="PERCENTAGE">Revenue Share %</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
              <div>
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Hierarchical Depth</label>
                <div className="relative">
                  <select
                    value={formData.maxLevels}
                    onChange={(e) => setFormData({ ...formData, maxLevels: parseInt(e.target.value) })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="appearance-none w-full border-2 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-blue-500 shadow-inner cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Levels Active</option>)}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-4 px-1">Generational Yield coefficients</label>
            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level}>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1 text-center font-mono">L{level}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.levelCommissions[`level${level}`] || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      levelCommissions: { ...formData.levelCommissions, [`level${level}`]: parseFloat(e.target.value) }
                    })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className={`w-full border-2 rounded-xl px-2 py-2 text-center font-black text-xs focus:outline-none focus:border-blue-500 shadow-inner ${level > formData.maxLevels ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
                    disabled={level > formData.maxLevels}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 scale-100 active:scale-95 transition-all cursor-pointer select-none" onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${formData.isDefault ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
              {formData.isDefault && <Check size={14} className="text-white" />}
            </div>
            <label style={{ color: modeColors.text }} className="text-xs font-black uppercase tracking-widest cursor-pointer">Baseline Standard Protocol</label>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
              className="flex-1 px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
            >
              Abort
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
            >
              Commit Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Level Modal Component
const LevelModal = ({ level, onSave, onClose, existingOrders }) => {
  const { modeColors } = useTheme()
  const [formData, setFormData] = useState({
    name: level?.name || '',
    order: level?.order || (Math.max(...existingOrders, 0) + 1),
    referralTarget: level?.referralTarget || 0,
    commissionRate: level?.commissionRate || 0,
    commissionType: level?.commissionType || 'PER_LOT',
    downlineCommission: level?.downlineCommission || { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
    color: level?.color || '#10B981',
    icon: level?.icon || 'award',
    isActive: level?.isActive !== false
  })

  const colorOptions = [
    { value: '#6B7280', label: 'Iron' },
    { value: '#CD7F32', label: 'Bronze' },
    { value: '#C0C0C0', label: 'Silver' },
    { value: '#FFD700', label: 'Gold' },
    { value: '#E5E4E2', label: 'Platinum' },
    { value: '#10B981', label: 'Emerald' },
    { value: '#3B82F6', label: 'Azure' },
    { value: '#8B5CF6', label: 'Obsidian' }
  ]

  const iconOptions = [
    { value: 'user', label: 'Individual' },
    { value: 'award', label: 'Distinction' },
    { value: 'trophy', label: 'Excellence' },
    { value: 'crown', label: 'Supreme' }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] w-full max-w-2xl border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div style={{ borderBottomColor: modeColors.border }} className="p-8 border-b">
          <h3 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight uppercase">Echelon Architect</h3>
          <p style={{ color: modeColors.textSecondary }} className="text-xs font-bold opacity-60 mt-1 uppercase tracking-widest">Define Tiered Reward Logic</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Tier Designation</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-5 py-4 font-black text-sm focus:outline-none focus:border-purple-500 shadow-inner"
                  placeholder="e.g. TITANIUM_PLUS"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Echelon Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-2xl px-5 py-4 font-black text-sm focus:outline-none focus:border-purple-500 shadow-inner"
                    required
                  />
                </div>
                <div>
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Entry Bar</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.referralTarget}
                      onChange={(e) => setFormData({ ...formData, referralTarget: parseInt(e.target.value) })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="w-full border-2 rounded-2xl pl-5 pr-12 py-4 font-black text-sm focus:outline-none focus:border-purple-500 shadow-inner"
                      placeholder="0"
                    />
                    <Users size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Theme Hue</label>
                  <div className="relative">
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="appearance-none w-full border-2 rounded-2xl px-5 py-4 font-black text-sm focus:outline-none focus:border-purple-500 shadow-inner cursor-pointer"
                    >
                      {colorOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: formData.color }} />
                  </div>
                </div>
                <div>
                  <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Heroic SVG</label>
                  <div className="relative">
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                      className="appearance-none w-full border-2 rounded-2xl px-5 py-4 font-black text-sm focus:outline-none focus:border-purple-500 shadow-inner cursor-pointer"
                    >
                      {iconOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Yield Structure</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="flex-1 border-2 rounded-2xl px-5 py-4 font-black text-sm focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-32 border-2 rounded-2xl px-4 py-4 font-black text-xs focus:outline-none focus:border-purple-500 shadow-inner cursor-pointer"
                  >
                    <option value="PER_LOT">$/Lot</option>
                    <option value="PERCENT">% Share</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Generational Yield Block */}
          <div style={{ backgroundColor: modeColors.bgSecondary }} className="rounded-[2rem] p-8 border-2 border-slate-100 shadow-inner">
            <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-6 text-center opacity-60">Systemic Multi-Generational Payout Portfolio ($/lot)</label>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map(lvl => (
                <div key={lvl}>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1 font-mono">L{lvl}_VECTOR</p>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.downlineCommission?.[`level${lvl}`] || 0}
                    onChange={(e) => setFormData({
                      ...formData,
                      downlineCommission: { 
                        ...formData.downlineCommission, 
                        [`level${lvl}`]: parseFloat(e.target.value) || 0 
                      }
                    })}
                    style={{ backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-xl py-3 text-center font-black text-sm focus:outline-none focus:border-purple-500 shadow-sm transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Interface Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}>
              <div className={`w-14 h-8 rounded-full transition-all relative ${formData.isActive ? 'bg-purple-600 shadow-lg shadow-purple-500/20' : 'bg-slate-300'}`}>
                <div className={`w-6 h-6 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${formData.isActive ? 'translate-x-[1.75rem]' : 'translate-x-1'}`} />
              </div>
              <p style={{ color: modeColors.text }} className="text-xs font-black uppercase tracking-widest">Protocol Active</p>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                style={{ backgroundColor: modeColors.bgSecondary, color: modeColors.text }}
                className="px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all"
              >
                Flush
              </button>
              <button
                type="submit"
                className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 hover:bg-purple-700 active:scale-95 transition-all"
              >
                Synthesize Tier
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// IB Details Modal Component
const IBDetailsModal = ({
  ib,
  plans,
  ibLevels,
  ibCommission,
  setIbCommission,
  ibPlan,
  setIbPlan,
  ibAutoUpgradeEnabled,
  setIbAutoUpgradeEnabled,
  ibManualCommissionEnabled,
  setIbManualCommissionEnabled,
  ibManualCommissionType,
  setIbManualCommissionType,
  ibManualCommissionLevels,
  setIbManualCommissionLevels,
  ibManualCommissionNotes,
  setIbManualCommissionNotes,
  onSave,
  onClose,
  saving
}) => {
  const { modeColors } = useTheme()
  if (!ib) return null

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div style={{ backgroundColor: modeColors.card, borderColor: modeColors.border }} className="rounded-[2.5rem] w-full max-w-lg border-2 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div style={{ borderBottomColor: modeColors.border }} className="p-8 border-b flex items-center justify-between">
          <div>
            <h3 style={{ color: modeColors.text }} className="font-black text-2xl tracking-tight uppercase">Identity Profile</h3>
            <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Partner Deep-Scan</p>
          </div>
          <button onClick={onClose} style={{ color: modeColors.textSecondary }} className="p-2 hover:bg-slate-50 rounded-2xl transition-all">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          {/* IB Info Portfolio */}
          <div style={{ backgroundColor: modeColors.bgSecondary }} className="flex items-center gap-6 rounded-[2rem] p-6 border-2 border-slate-100 shadow-inner group">
            <div className="w-20 h-20 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center border-2 border-blue-500/20 shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-blue-600 font-black text-3xl">{ib.firstName?.charAt(0) || '?'}</span>
            </div>
            <div className="min-w-0">
              <p style={{ color: modeColors.text }} className="font-black text-xl tracking-tight truncate">{ib.firstName} {ib.lastName}</p>
              <p style={{ color: modeColors.textSecondary }} className="text-xs font-bold opacity-60 truncate font-mono italic">{ib.email}</p>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-xl border border-slate-100 shadow-sm">
                <span style={{ color: modeColors.textSecondary }} className="text-[9px] font-black uppercase tracking-widest opacity-40">Vector:</span>
                <span className="text-blue-500 font-black text-[9px] uppercase tracking-widest">{ib.referralCode || 'UNASSIGNED'}</span>
              </div>
            </div>
          </div>

          {/* Live Performance Vectors */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Current State', value: ib.ibStatus || 'OFFLINE', color: ib.ibStatus === 'ACTIVE' ? 'text-green-500' : 'text-amber-500' },
              { label: 'Growth Tier', value: ib.ibLevelId?.name || `Level ${ib.ibLevelOrder || ib.ibLevel || 1}`, color: 'text-blue-500' },
              { label: 'Network', value: ib.referralCount || 0, color: 'text-purple-500' }
            ].map((stat, idx) => (
              <div key={idx} style={{ backgroundColor: modeColors.bgSecondary }} className="rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                <p style={{ color: modeColors.textSecondary }} className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">{stat.label}</p>
                <p className={`${stat.color} font-black text-sm tracking-widest uppercase`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Privilege Escalation Control */}
          <div className="space-y-4">
            <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block px-1">Echelon Tier Correction</label>
            <select
              value={ibCommission}
              onChange={(e) => setIbCommission(e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="w-full border-2 rounded-2xl px-6 py-5 font-black text-base focus:outline-none focus:border-blue-500 shadow-inner"
            >
              <option value="">Select a level</option>
              {ibLevels.map((level) => (
                <option key={level._id} value={level._id}>
                  {level.name} • Order {level.order} • ${level.commissionRate}/{level.commissionType === 'PER_LOT' ? 'lot' : '%'}
                </option>
              ))}
            </select>
            <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-medium opacity-50 px-1 italic text-center uppercase tracking-wider leading-relaxed">This writes the real IB level record used by progression and level-based fallback commission logic.</p>
          </div>

          <div className="space-y-4">
            <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block px-1">Plan Assignment</label>
            <select
              value={ibPlan}
              onChange={(e) => setIbPlan(e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="w-full border-2 rounded-2xl px-6 py-5 font-black text-base focus:outline-none focus:border-blue-500 shadow-inner"
            >
              <option value="">No plan override</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-medium opacity-50 px-1 italic text-center uppercase tracking-wider leading-relaxed">Direct override of partner growth logic. Proceed with audit trail active.</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block px-1">Manual Commission Override</label>
              <button
                onClick={() => setIbAutoUpgradeEnabled(!ibAutoUpgradeEnabled)}
                className={`w-14 h-8 rounded-full transition-all relative ${ibAutoUpgradeEnabled ? 'bg-green-500 shadow-lg shadow-green-500/20' : 'bg-slate-300'}`}
                type="button"
                title="Toggle auto-upgrade"
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${ibAutoUpgradeEnabled ? 'translate-x-[1.75rem]' : 'translate-x-1'}`} />
              </button>
            </div>
            <p style={{ color: modeColors.textSecondary }} className="text-[10px] font-medium opacity-50 px-1 italic text-center uppercase tracking-wider leading-relaxed">Auto-upgrade can be disabled when manual commercial terms are enforced.</p>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p style={{ color: modeColors.text }} className="font-black text-xs uppercase tracking-widest">Override Active</p>
                <p style={{ color: modeColors.textSecondary }} className="text-[10px] opacity-60">When enabled, plan/level fallback no longer controls commissions.</p>
              </div>
              <button
                onClick={() => setIbManualCommissionEnabled(!ibManualCommissionEnabled)}
                className={`w-14 h-8 rounded-full transition-all relative ${ibManualCommissionEnabled ? 'bg-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-300'}`}
                type="button"
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform absolute top-1 shadow-sm ${ibManualCommissionEnabled ? 'translate-x-[1.75rem]' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ color: modeColors.textSecondary }} className="text-[10px] font-black uppercase tracking-[0.2em] block mb-2 px-1">Override Type</label>
                <select
                  value={ibManualCommissionType}
                  onChange={(e) => setIbManualCommissionType(e.target.value)}
                  style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                  className="w-full border-2 rounded-2xl px-5 py-4 font-black text-sm focus:outline-none focus:border-blue-500 shadow-inner"
                >
                  <option value="PER_LOT">Fixed USD / Lot</option>
                  <option value="PERCENT">Revenue Share %</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((levelNumber) => (
                <div key={levelNumber}>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1 text-center font-mono">L{levelNumber}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={ibManualCommissionLevels[`level${levelNumber}`] || 0}
                    onChange={(e) => setIbManualCommissionLevels({
                      ...ibManualCommissionLevels,
                      [`level${levelNumber}`]: parseFloat(e.target.value) || 0
                    })}
                    style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
                    className="w-full border-2 rounded-xl px-2 py-3 text-center font-black text-xs focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
              ))}
            </div>

            <textarea
              value={ibManualCommissionNotes}
              onChange={(e) => setIbManualCommissionNotes(e.target.value)}
              style={{ backgroundColor: modeColors.bgSecondary, borderColor: modeColors.border, color: modeColors.text }}
              className="w-full border-2 rounded-2xl px-5 py-4 font-bold text-sm focus:outline-none focus:border-blue-500 shadow-inner h-24 resize-none"
              placeholder="Reason for manual commercial override..."
            />
          </div>

          {/* Safety Protocols */}
          <div className="flex gap-4">
            {ib.ibStatus === 'BLOCKED' && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_URL}/ib/admin/unblock/${ib._id}`, { method: 'PUT' })
                    const data = await res.json()
                    if (data.success) {
                      alert('Protocol Restricted - IB Re-Authorized')
                      onClose()
                    }
                  } catch (e) { alert('Failed to re-authorize') }
                }}
                className="flex-1 px-8 py-5 bg-green-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-green-500/30 active:scale-95 transition-all"
              >
                Re-Authorize Access
              </button>
            )}
            {ib.ibStatus === 'ACTIVE' && (
              <button
                onClick={async () => {
                  const reason = prompt('Execute Access Termination - Define Justification:')
                  if (!reason) return
                  try {
                    const res = await fetch(`${API_URL}/ib/admin/block/${ib._id}`, {
                      method: 'PUT',
                      headers: getAdminHeaders(),
                      body: JSON.stringify({ reason })
                    })
                    const data = await res.json()
                    if (data.success) {
                      alert('Identity Vector Disabled')
                      onClose()
                    }
                  } catch (e) { alert('Failed to terminate access') }
                }}
                style={{ backgroundColor: modeColors.bgSecondary }}
                className="flex-1 px-8 py-5 border-2 border-red-500/20 text-red-500 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-red-500/5 active:scale-95 transition-all"
              >
                Terminate Access
              </button>
            )}
          </div>
        </div>

        <div style={{ borderTopColor: modeColors.border, backgroundColor: modeColors.bgSecondary }} className="p-8 border-t flex gap-4">
          <button
            onClick={onClose}
            style={{ backgroundColor: modeColors.card, color: modeColors.text }}
            className="flex-1 px-8 py-4 border-2 border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-sm"
          >
            Abort
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? 'Syncing...' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminIBManagement
