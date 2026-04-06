import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import AdminLayout from '../components/AdminLayout'
import { 
  UserCog, Plus, Search, Eye, Edit, Trash2, Users, DollarSign, 
  Percent, Check, X, RefreshCw, Settings, ChevronDown, ArrowRightLeft, 
  UserPlus, Award, Target, Calendar, ShieldCheck, Wallet
} from 'lucide-react'

// --- Professional Minimalist SaaS Styles ---
const cardBase = "bg-white border border-slate-200 rounded-xl shadow-sm";
const inputBase = "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none";
const primaryBtn = "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm active:scale-95 transition-all outline-none";
const secondaryBtn = "flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-sm active:scale-95 transition-all border border-slate-300 shadow-sm outline-none";
const dangerBtn = "flex items-center justify-center gap-2 hover:bg-red-50 text-red-600 px-5 py-2.5 rounded-lg font-semibold text-sm active:scale-95 transition-all border border-red-200 outline-none";

const AdminIBManagement = () => {
  const { modeColors } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('ibs') 
  const [ibs, setIbs] = useState([])
  const [applications, setApplications] = useState([])
  const [plans, setPlans] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [allUsers, setAllUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [targetIB, setTargetIB] = useState('')
  const [transferLoading, setTransferLoading] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  
  const [ibLevels, setIbLevels] = useState([])
  const [showLevelModal, setShowLevelModal] = useState(false)
  const [editingLevel, setEditingLevel] = useState(null)
  
  const [showIBModal, setShowIBModal] = useState(false)
  const [viewingIB, setViewingIB] = useState(null)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  
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
    return { 'Content-Type': 'application/json', ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}) }
  }

  useEffect(() => {
    const fetchAllData = () => { fetchDashboard(); fetchIBs(); fetchApplications(); fetchPlans(); fetchSettings(); fetchAllUsers(); fetchIBLevels(); }
    fetchAllData();
    const interval = setInterval(() => { fetchDashboard(); fetchIBs(); fetchApplications(); }, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/dashboard`, { headers: getAdminHeaders() })
      const data = await res.json()
      if (data.stats) {
        setDashboard({
          ibs: { total: data.stats.totalIBs, active: data.stats.activeIBs, pending: data.stats.pendingIBs },
          referrals: { total: 0 },
          commissions: { total: { totalCommission: data.stats.totalCommissionPaid || 0 }, today: { totalCommission: 0 } },
          withdrawals: { pending: { totalPending: 0, count: 0 } }
        })
      } else if (data.dashboard) setDashboard(data.dashboard)
    } catch (e) { console.error(e) }
  }

  const fetchIBs = async () => {
    try { const res = await fetch(`${API_URL}/ib/admin/all`, { headers: getAdminHeaders() }); const data = await res.json(); setIbs(data.ibs || []); setLoading(false); } catch (error) {}
  }
  const fetchApplications = async () => {
    try { const res = await fetch(`${API_URL}/ib/admin/pending`, { headers: getAdminHeaders() }); const data = await res.json(); setApplications(data.pending || []); } catch (error) {}
  }
  const fetchPlans = async () => {
    try { const res = await fetch(`${API_URL}/ib/admin/plans`, { headers: getAdminHeaders() }); const data = await res.json(); setPlans(data.plans || []); } catch (error) {}
  }
  const fetchSettings = async () => {
    try { const res = await fetch(`${API_URL}/ib/admin/settings`, { headers: getAdminHeaders() }); const data = await res.json(); if (data.settings) setSettings(data.settings); } catch (error) {}
  }
  const fetchIBLevels = async () => {
    try { const res = await fetch(`${API_URL}/ib/admin/levels`, { headers: getAdminHeaders() }); const data = await res.json(); setIbLevels(data.levels || []); } catch (error) {}
  }
  const fetchAllUsers = async () => {
    try { const res = await fetch(`${API_URL}/admin/users`, { headers: getAdminHeaders() }); const data = await res.json(); setAllUsers(data.users || []); } catch (error) {}
  }

  const handleTransferReferrals = async () => {
    if (!selectedUsers.length || !targetIB) return alert('Select users and an IB to transfer');
    setTransferLoading(true)
    try {
      const res = await fetch(`${API_URL}/ib/admin/transfer-referrals`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify({ userIds: selectedUsers, targetIBId: targetIB }) })
      const data = await res.json()
      if (data.success) { alert(`Users transferred successfully`); setSelectedUsers([]); setTargetIB(''); fetchAllUsers(); fetchIBs(); }
    } catch(e) {}
    setTransferLoading(false)
  }

  const handleSaveLevel = async (levelData) => {
    try {
      const url = editingLevel ? `${API_URL}/ib/admin/levels/${editingLevel._id}` : `${API_URL}/ib/admin/levels`
      const res = await fetch(url, { method: editingLevel ? 'PUT' : 'POST', headers: getAdminHeaders(), body: JSON.stringify(levelData) })
      if ((await res.json()).success) { setShowLevelModal(false); setEditingLevel(null); fetchIBLevels(); }
    } catch (e) {}
  }

  const handleDeleteLevel = async (id) => {
    if (!confirm('Are you sure you want to delete this level?')) return;
    try { await fetch(`${API_URL}/ib/admin/levels/${id}`, { method: 'DELETE', headers: getAdminHeaders() }); fetchIBLevels(); } catch(e){}
  }

  const handleApprove = async (id, planId) => {
    try { await fetch(`${API_URL}/ib/admin/approve/${id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ planId }) }); fetchApplications(); fetchIBs(); fetchDashboard(); } catch(e){}
  }

  const handleReject = async (id) => {
    const reason = prompt('Please provide a reason for rejection:'); if (!reason) return;
    try { await fetch(`${API_URL}/ib/admin/reject/${id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ reason }) }); fetchApplications(); } catch(e){}
  }

  const handleBlock = async (id) => {
    const reason = prompt('Please provide a reason for blocking:'); if (!reason) return;
    try { await fetch(`${API_URL}/ib/admin/block/${id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ reason }) }); fetchIBs(); } catch(e){}
  }

  const handleSavePlan = async (planData) => {
    try {
      const url = editingPlan ? `${API_URL}/ib/admin/plans/${editingPlan._id}` : `${API_URL}/ib/admin/plans`
      const res = await fetch(url, { method: editingPlan ? 'PUT' : 'POST', headers: getAdminHeaders(), body: JSON.stringify(planData) })
      if ((await res.json()).success) { setShowPlanModal(false); fetchPlans(); }
    } catch(e){}
  }

  const handleSaveIBDetails = async () => {
    if (!viewingIB) return; setSavingIB(true);
    try {
      const res = await fetch(`${API_URL}/ib/admin/update/${viewingIB._id}`, {
        method: 'PUT', headers: getAdminHeaders(),
        body: JSON.stringify({
          levelId: ibCommission || null, planId: ibPlan || null, autoUpgradeEnabled: ibAutoUpgradeEnabled,
          commissionOverride: { enabled: ibManualCommissionEnabled, commissionType: ibManualCommissionType, levels: ibManualCommissionLevels, notes: ibManualCommissionNotes }
        })
      });
      if ((await res.json()).success) { setShowIBModal(false); fetchIBs(); }
    } catch(e){}
    setSavingIB(false);
  }

  const handleUpdateSettings = async (newSettings) => {
    try {
      const res = await fetch(`${API_URL}/ib/admin/settings`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify(newSettings) })
      const data = await res.json(); if (data.settings) setSettings(data.settings);
    } catch (e) { console.error(e) }
  }

  const filteredIBs = ibs.filter(ib => 
    ib.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ib.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ib.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredUsers = allUsers.filter(u => 
    u.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="IB Management" subtitle="Manage Introducing Brokers, levels, and commission plans">
      {/* Modern Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active IBs', value: dashboard?.ibs?.total || '0', sub: `${dashboard?.ibs?.pending || 0} pending`, icon: UserCog, color: 'blue' },
          { label: 'Total Referrals', value: dashboard?.referrals?.total || '0', sub: 'Active network', icon: Users, color: 'slate' },
          { label: 'Commissions Paid', value: `$${(dashboard?.commissions?.total?.totalCommission || 0).toLocaleString()}`, sub: 'Lifetime paid', icon: DollarSign, color: 'slate' },
          { label: 'Pending Withdrawals', value: `$${(dashboard?.withdrawals?.pending?.totalPending || 0).toLocaleString()}`, sub: 'Requires Review', icon: Wallet, color: 'slate' }
        ].map((stat, idx) => (
          <div key={idx} className={`${cardBase} p-5 flex items-center justify-between`}>
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</h4>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <div className="text-xs font-medium text-slate-400 mt-1">{stat.sub}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <stat.icon size={20} className="text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 overflow-x-auto mb-8 bg-slate-100 p-1 rounded-xl">
        {[
          { id: 'ibs', label: 'Active IBs' },
          { id: 'applications', label: 'Pending Applications' },
          { id: 'levels', label: 'IB Levels' },
          { id: 'plans', label: 'Commission Plans' },
          { id: 'transfer', label: 'Transfer Referrals' },
          { id: 'settings', label: 'Settings' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} 
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === t.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Content Interface */}
      <div>
        {activeTab === 'ibs' && (
          <div className={`${cardBase} overflow-hidden`}>
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-bold text-slate-900">Active IB Database</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search partners..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputBase} pl-10`} />
                </div>
                <button onClick={() => { fetchIBs(); fetchDashboard(); }} className={`${secondaryBtn} px-3`}><RefreshCw size={16} className={loading ? 'animate-spin' : ''}/></button>
              </div>
            </div>
            {loading ? (
              <div className="py-20 text-center text-slate-400">Loading data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Partner Name / Email</th>
                      <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Referral Code</th>
                      <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Level & Plan</th>
                      <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase text-center">Referrals</th>
                      <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="py-3 px-6 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIBs.map(ib => (
                      <tr key={ib._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{ib.firstName} {ib.lastName}</div>
                          <div className="text-xs text-slate-400">{ib.email}</div>
                        </td>
                        <td className="py-4 px-6 font-mono text-sm">{ib.referralCode || '-'}</td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-semibold">{ib.ibLevelId?.name || `Level ${ib.ibLevel || 1}`}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{ib.ibPlanId?.name || 'Default Plan'}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{ib.referralCount || 0}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            ib.ibStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {ib.ibStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => {
                              setViewingIB(ib); setIbCommission(ib.ibLevelId?._id || ''); setIbPlan(ib.ibPlanId?._id || '');
                              setIbAutoUpgradeEnabled(ib.autoUpgradeEnabled !== false); setIbManualCommissionEnabled(Boolean(ib.ibCommissionOverride?.enabled));
                              setIbManualCommissionType(ib.ibCommissionOverride?.commissionType || 'PER_LOT');
                              setIbManualCommissionLevels(ib.ibCommissionOverride?.levels || { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 });
                              setIbManualCommissionNotes(ib.ibCommissionOverride?.notes || '');
                              setShowIBModal(true);
                            }} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                            {ib.ibStatus === 'ACTIVE' && <button onClick={() => handleBlock(ib._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={16} /></button>}
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

        {activeTab === 'applications' && (
          <div className={`${cardBase} p-6`}>
            <h2 className="text-lg font-bold text-slate-900 mb-6">Pending Applications</h2>
            {applications.length === 0 ? <p className="text-slate-400 text-sm">No applications to review.</p> : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app._id} className="border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-900">{app.firstName} {app.lastName}</div>
                      <div className="text-xs text-slate-400">{app.email} &bull; Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <select id={`plan-${app._id}`} className={`${inputBase} w-40 h-10`}>
                        <option value="">Assign Plan...</option>
                        {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        <option value="default">Default Plan</option>
                      </select>
                      <button onClick={() => {
                        const val = document.getElementById(`plan-${app._id}`).value;
                        if (!val) return alert('Select plan first');
                        handleApprove(app._id, val === 'default' ? null : val);
                      }} className={primaryBtn}>Approve</button>
                      <button onClick={() => handleReject(app._id)} className={dangerBtn}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'levels' && (
          <div className={`${cardBase} p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">IB Levels</h2>
              <button onClick={() => { setEditingLevel(null); setShowLevelModal(true); }} className={primaryBtn}><Plus size={16}/> Add New Level</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ibLevels.map(level => (
                <div key={level._id} className="border border-slate-200 rounded-lg p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-bold text-slate-900">{level.name}</div>
                    <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 rounded-full">Level {level.order}</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Target</span><span className="font-bold">{level.referralTarget} Referrals</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Commission</span><span className="font-bold text-green-600">{level.commissionRate}{level.commissionType === 'PER_LOT' ? ' $/Lot' : '%'}</span></div>
                  </div>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => { setEditingLevel(level); setShowLevelModal(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteLevel(level._id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className={`${cardBase} p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">Commission Plans</h2>
              <button onClick={() => { setEditingPlan(null); setShowPlanModal(true); }} className={primaryBtn}><Plus size={16}/> Create Plan</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {plans.map(plan => (
                <div key={plan._id} className="border border-slate-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {plan.name}
                        {plan.isDefault && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 rounded-full">Default</span>}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{plan.description}</p>
                    </div>
                    <button onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                  </div>
                  <div className="grid grid-cols-5 gap-1 pt-4 border-t border-slate-100">
                    {[1,2,3,4,5].map(lvl => (
                      <div key={lvl} className="text-center">
                        <div className="text-[10px] font-bold text-slate-300 uppercase">G{lvl}</div>
                        <div className="text-sm font-bold text-slate-600">{(plan.levelCommissions?.[`level${lvl}`] || 0)}{plan.commissionType === 'PERCENTAGE' ? '%' : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className={`${cardBase} p-8`}>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Transfer Referrals</h2>
            <p className="text-xs text-slate-400 mb-8">Move users from one IB to another. This will update the user's parent IB reference.</p>
            
            <div className="grid lg:grid-cols-2 gap-10">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">1. Choose New Parent IB</h3>
                <select value={targetIB} onChange={e => setTargetIB(e.target.value)} className={`${inputBase} h-12`}>
                  <option value="">Select target IB...</option>
                  {ibs.filter(ib => ib.ibStatus === 'ACTIVE').map(ib => <option key={ib._id} value={ib._id}>{ib.firstName} {ib.lastName} ({ib.referralCode})</option>)}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">2. Select Users to Move</h3>
                  <span className="text-xs font-bold text-blue-600">{selectedUsers.length} selected</span>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Filter users..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className={`${inputBase} pl-9 h-11`} />
                </div>
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50/30">
                  {filteredUsers.map(user => (
                    <div key={user._id} onClick={() => { setSelectedUsers(p => p.includes(user._id) ? p.filter(id => id !== user._id) : [...p, user._id]) }}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${selectedUsers.includes(user._id) ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-transparent'}`}>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedUsers.includes(user._id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                        {selectedUsers.includes(user._id) && <Check size={12} className="text-white" />}
                      </div>
                      <div className="text-xs font-semibold">{user.firstName} {user.lastName} <span className="text-slate-400 font-normal">({user.email})</span></div>
                    </div>
                  ))}
                </div>
                <button disabled={transferLoading || !targetIB || !selectedUsers.length} onClick={handleTransferReferrals} 
                  className={`${primaryBtn} w-full h-12 mt-4`}> 
                  {transferLoading ? 'Processing...' : 'Transfer Selected Users'} 
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className={`${cardBase} p-8 max-w-2xl`}>
            <h2 className="text-lg font-bold text-slate-900 mb-6">System Settings</h2>
            <div className="space-y-6">
              {[
                { label: 'Enable IB System', key: 'isEnabled', val: settings.isEnabled },
                { label: 'Allow Public Applications', key: 'allowNewApplications', val: settings.allowNewApplications },
                { label: 'Auto-Approve Applications', key: 'autoApprove', val: settings.autoApprove }
              ].map(t => (
                <div key={t.key} className="flex justify-between items-center py-4 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-semibold text-slate-700">{t.label}</span>
                  <button onClick={() => handleUpdateSettings({ [t.key]: !t.val })} 
                    className={`w-12 h-6 rounded-full transition-all relative ${t.val ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${t.val ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              ))}
              <div className="pt-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Minimum Withdrawal ($)</label>
                <input type="number" value={settings.commissionSettings?.minWithdrawalAmount || 50} 
                  onChange={e => handleUpdateSettings({ commissionSettings: { ...settings.commissionSettings, minWithdrawalAmount: parseFloat(e.target.value) } })} 
                  className={`${inputBase} w-32 font-bold`} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simplified Modal Components */}
      {showPlanModal && <PlanModal plan={editingPlan} onSave={handleSavePlan} onClose={() => {setShowPlanModal(false); setEditingPlan(null)}} colors={modeColors} />}
      {showLevelModal && <LevelModal level={editingLevel} onSave={handleSaveLevel} onClose={() => {setShowLevelModal(false); setEditingLevel(null)}} orders={ibLevels.map(l=>l.order)} colors={modeColors} />}
      {showIBModal && <IBDetailsModal ib={viewingIB} plans={plans} levels={ibLevels} ibCommission={ibCommission} setIbCommission={setIbCommission} ibPlan={ibPlan} setIbPlan={setIbPlan} autoUpgrade={ibAutoUpgradeEnabled} setAutoUpgrade={setIbAutoUpgradeEnabled} overrideEnabled={ibManualCommissionEnabled} setOverrideEnabled={setIbManualCommissionEnabled} overrideType={ibManualCommissionType} setOverrideType={setIbManualCommissionType} overrideLevels={ibManualCommissionLevels} setOverrideLevels={setIbManualCommissionLevels} notes={ibManualCommissionNotes} setNotes={setIbManualCommissionNotes} onSave={handleSaveIBDetails} onClose={()=>setShowIBModal(false)} saving={savingIB} colors={modeColors} />}
    </AdminLayout>
  )
}

const ModalWrapper = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/50" onClick={onClose}></div>
    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden relative z-[101]">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
      </div>
      <div className="p-8 overflow-y-auto">{children}</div>
    </div>
  </div>
)

const PlanModal = ({ plan, onSave, onClose }) => {
  const [fd, setFd] = useState({ name: plan?.name||'', description: plan?.description||'', maxLevels: plan?.maxLevels||3, commissionType: plan?.commissionType||'PER_LOT', levelCommissions: plan?.levelCommissions||{level1:5, level2:3, level3:2, level4:1, level5:0.5}, isDefault: plan?.isDefault||false })
  return (
    <ModalWrapper title={plan ? "Edit Commission Plan" : "Create Commission Plan"} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(fd); }} className="space-y-5">
        <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Plan Name</label><input required className={inputBase} value={fd.name} onChange={e=>setFd({...fd, name: e.target.value})} /></div>
        <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Description</label><textarea className={inputBase} value={fd.description} onChange={e=>setFd({...fd, description: e.target.value})} rows={2} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Commission Type</label><select className={inputBase} value={fd.commissionType} onChange={e=>setFd({...fd, commissionType: e.target.value})}><option value="PER_LOT">$/Lot</option><option value="PERCENTAGE">%</option></select></div>
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Max Levels</label><select className={inputBase} value={fd.maxLevels} onChange={e=>setFd({...fd, maxLevels: parseInt(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Levels</option>)}</select></div>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <label className="text-xs font-bold text-slate-500 mb-3 block text-center">Commission per Generation</label>
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5].map(l => (
              <div key={l}><label className="text-[10px] text-slate-400 mb-1 block text-center">G{l}</label><input type="number" step="0.1" disabled={l > fd.maxLevels} className={`${inputBase} px-1 text-center font-bold ${l > fd.maxLevels ? 'opacity-30' : ''}`} value={fd.levelCommissions[`level${l}`]||0} onChange={e=>setFd({...fd, levelCommissions:{...fd.levelCommissions, [`level${l}`]: parseFloat(e.target.value)}})} /></div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={fd.isDefault} onChange={e=>setFd({...fd, isDefault: e.target.checked})} /> Set as Default Plan</label>
        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className={`${secondaryBtn} flex-1`}>Cancel</button>
          <button type="submit" className={`${primaryBtn} flex-1`}>Save Plan</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

const LevelModal = ({ level, onSave, onClose, orders }) => {
  const [fd, setFd] = useState({ name: level?.name||'', order: level?.order||(Math.max(0, ...orders)+1), referralTarget: level?.referralTarget||0, commissionRate: level?.commissionRate||0, commissionType: level?.commissionType||'PER_LOT', isActive: level?.isActive!==false })
  return (
    <ModalWrapper title={level ? "Edit Level" : "New IB Level"} onClose={onClose}>
      <form onSubmit={e => { e.preventDefault(); onSave(fd); }} className="space-y-5">
        <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Level Name</label><input required className={inputBase} value={fd.name} onChange={e=>setFd({...fd, name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Order #</label><input type="number" required className={inputBase} value={fd.order} onChange={e=>setFd({...fd, order: parseInt(e.target.value)})} /></div>
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Target Referrals</label><input type="number" required className={inputBase} value={fd.referralTarget} onChange={e=>setFd({...fd, referralTarget: parseInt(e.target.value)})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Base Rate</label><input type="number" step="0.1" required className={inputBase} value={fd.commissionRate} onChange={e=>setFd({...fd, commissionRate: parseFloat(e.target.value)})} /></div>
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Rate Type</label><select className={inputBase} value={fd.commissionType} onChange={e=>setFd({...fd, commissionType: e.target.value})}><option value="PER_LOT">$/Lot</option><option value="PERCENTAGE">%</option></select></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fd.isActive} onChange={e=>setFd({...fd, isActive: e.target.checked})} /> Level Active</label>
        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className={`${secondaryBtn} flex-1`}>Cancel</button>
          <button type="submit" className={`${primaryBtn} flex-1`}>Save Level</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

const IBDetailsModal = ({ ib, plans, levels, ibCommission, setIbCommission, ibPlan, setIbPlan, autoUpgrade, setAutoUpgrade, overrideEnabled, setOverrideEnabled, overrideType, setOverrideType, overrideLevels, setOverrideLevels, notes, setNotes, onSave, onClose, saving }) => {
  if(!ib) return null;
  return (
    <ModalWrapper title="IB Configuration" onClose={onClose}>
      <div className="space-y-6">
        <div className="p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl">{ib.firstName?.[0]}</div>
          <div>
            <h4 className="font-bold text-slate-900">{ib.firstName} {ib.lastName}</h4>
            <p className="text-xs text-slate-400 font-medium">{ib.email} &bull; Code: {ib.referralCode || '-'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Assigned Level</label><select className={inputBase} value={ibCommission} onChange={e=>setIbCommission(e.target.value)}><option value="">Select Level...</option>{levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}</select></div>
          <div><label className="text-xs font-bold text-slate-500 mb-1.5 block">Commission Plan</label><select className={inputBase} value={ibPlan} onChange={e=>setIbPlan(e.target.value)}><option value="">Use Default Plan</option>{plans.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" checked={autoUpgrade} onChange={e=>setAutoUpgrade(e.target.checked)} /> Automatic Level Upgrades</label>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Manual Override</label>
            <button onClick={() => setOverrideEnabled(!overrideEnabled)} 
              className={`w-10 h-5 rounded-full transition-all relative ${overrideEnabled ? 'bg-orange-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all ${overrideEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {overrideEnabled && (
            <div className="p-5 border border-orange-100 rounded-lg space-y-5 bg-orange-50/20">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-orange-900 uppercase">Override Rates</span>
                <select className="bg-white border border-orange-200 rounded px-2 py-1 text-[10px] font-bold" value={overrideType} onChange={e=>setOverrideType(e.target.value)}><option value="PER_LOT">$/Lot</option><option value="PERCENTAGE">%</option></select>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5].map(l => (
                  <div key={l}><label className="text-[9px] font-bold text-orange-400 mb-1 block text-center">G{l}</label><input type="number" step="0.1" className={`${inputBase} px-1 text-center h-9 border-orange-100`} value={overrideLevels[`level${l}`]||0} onChange={e=>setOverrideLevels({...overrideLevels, [`level${l}`]: parseFloat(e.target.value)})} /></div>
                ))}
              </div>
              <textarea className={`${inputBase} border-orange-100 text-xs`} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Reason for override..." rows={2} />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className={`${secondaryBtn} flex-1`}>Close</button>
          <button onClick={onSave} disabled={saving} className={`${primaryBtn} flex-1`}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export default AdminIBManagement;
