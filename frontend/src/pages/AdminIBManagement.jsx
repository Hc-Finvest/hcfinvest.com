import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import AdminLayout from '../components/AdminLayout'
import { 
  UserCog, Plus, Search, Eye, Edit, Trash2, Users, DollarSign, 
  Percent, Check, X, RefreshCw, Settings, ChevronDown, ArrowRightLeft, 
  UserPlus, Award, Target, Calendar, ShieldCheck, Wallet
} from 'lucide-react'

// --- Premium Shared Styles ---
const cardBase = "bg-white border border-slate-200 rounded-2xl shadow-sm transition-all duration-200";
const inputBase = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none";
const primaryBtn = "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-200 active:scale-95 transition-all";
const secondaryBtn = "flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all border border-slate-200";
const dangerBtn = "flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all border border-red-100";

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
    <AdminLayout title="IB Management" subtitle="System-wide IB hierarchies and commission logic">
      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active IBs', value: dashboard?.ibs?.total || '0', sub: `${dashboard?.ibs?.pending || 0} pending review`, icon: UserCog, color: 'blue' },
          { label: 'Total Referrals', value: dashboard?.referrals?.total || '0', sub: 'Active network reach', icon: Users, color: 'indigo' },
          { label: 'Commissions Paid', value: `$${(dashboard?.commissions?.total?.totalCommission || 0).toLocaleString()}`, sub: 'Lifetime yield', icon: DollarSign, color: 'emerald' },
          { label: 'Withdrawal Queue', value: `$${(dashboard?.withdrawals?.pending?.totalPending || 0).toLocaleString()}`, sub: 'Requires Review', icon: Wallet, color: 'orange' }
        ].map((stat, idx) => (
          <div key={idx} className={`${cardBase} p-6 overflow-hidden relative group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-125 duration-500`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 bg-${stat.color}-50 rounded-xl`}>
                <stat.icon size={22} className={`text-${stat.color}-600`} />
              </div>
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-tight">{stat.label}</h4>
              <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              <div className="flex items-center gap-1.5 mt-2.5">
                <span className={`text-xs font-bold text-${stat.color}-600 bg-${stat.color}-50 px-2 py-0.5 rounded-full`}>{stat.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto mb-8 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shadow-slate-100">
        {[
          { id: 'ibs', label: 'Active IBs', icon: ShieldCheck },
          { id: 'applications', label: 'Pending Applications', icon: UserPlus },
          { id: 'levels', label: 'IB Levels', icon: Award },
          { id: 'plans', label: 'Commission Plans', icon: Percent },
          { id: 'transfer', label: 'Transfer Referrals', icon: ArrowRightLeft },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} 
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === t.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-1px]' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}>
            <t.icon size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Sections */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'ibs' && (
          <div className={`${cardBase} p-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active IB Registry</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Verified partner network and commercial standing</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search name, email, or code..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${inputBase} pl-11`} />
                </div>
                <button onClick={() => { fetchIBs(); fetchDashboard(); }} className={`${secondaryBtn} px-4`}><RefreshCw size={18} className={loading ? 'animate-spin' : ''}/></button>
              </div>
            </div>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-30">
                <RefreshCw size={40} className="animate-spin mb-4" />
                <p className="font-bold">Syncing IB Ledger...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 rounded-xl overflow-hidden">
                      <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Partner Identity</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Referral Link</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Tier & Policy</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Network</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="py-4 px-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIBs.map(ib => (
                      <tr key={ib._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">{ib.firstName?.[0]}</div>
                            <div>
                              <div className="font-black text-slate-900 text-sm tracking-tight">{ib.firstName} {ib.lastName}</div>
                              <div className="text-xs text-slate-400 font-bold font-mono">{ib.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-4"><span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-mono tracking-wider">{ib.referralCode || '-'}</span></td>
                        <td className="py-5 px-4">
                          <div className="text-sm font-bold text-slate-700">{ib.ibLevelId?.name || `Tier ${ib.ibLevel || 1}`}</div>
                          <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{ib.ibPlanId?.name || 'Standard Yield'}</div>
                        </td>
                        <td className="py-5 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 font-black text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                            <Users size={12}/>
                            {ib.referralCount || 0}
                          </div>
                        </td>
                        <td className="py-5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            ib.ibStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${ib.ibStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {ib.ibStatus}
                          </span>
                        </td>
                        <td className="py-5 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => {
                              setViewingIB(ib); setIbCommission(ib.ibLevelId?._id || ''); setIbPlan(ib.ibPlanId?._id || '');
                              setIbAutoUpgradeEnabled(ib.autoUpgradeEnabled !== false); setIbManualCommissionEnabled(Boolean(ib.ibCommissionOverride?.enabled));
                              setIbManualCommissionType(ib.ibCommissionOverride?.commissionType || 'PER_LOT');
                              setIbManualCommissionLevels(ib.ibCommissionOverride?.levels || { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 });
                              setIbManualCommissionNotes(ib.ibCommissionOverride?.notes || '');
                              setShowIBModal(true);
                            }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 active:scale-90"><Edit size={18} /></button>
                            {ib.ibStatus === 'ACTIVE' && <button onClick={() => handleBlock(ib._id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-90"><X size={18} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredIBs.length === 0 && (
                      <tr><td colSpan="6" className="py-20 text-center text-slate-400 font-bold italic">No active partners found for this query.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className={`${cardBase} p-8`}>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Review Queue</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Pending partner applications awaiting manual verification</p>
            </div>
            {applications.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center opacity-30 border-2 border-dashed border-slate-200 rounded-3xl">
                <Check size={40} className="text-slate-400 mb-4" />
                <p className="font-bold">Queue clear. No pending reviews.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map(app => (
                  <div key={app._id} className={`${cardBase} p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-blue-200 hover:shadow-md`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">{app.firstName?.[0]}</div>
                      <div>
                        <div className="font-black text-slate-900 text-lg tracking-tight">{app.firstName} {app.lastName}</div>
                        <div className="text-sm text-slate-400 font-bold font-mono">{app.email}</div>
                        <div className="mt-1 text-[10px] uppercase font-black text-slate-300 tracking-widest flex items-center gap-1"><Calendar size={10}/> Applied {new Date(app.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <div className="relative">
                        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select id={`plan-${app._id}`} className={`${inputBase} pr-10 w-full sm:w-48 appearance-none`}>
                          <option value="">Select Yield Tier...</option>
                          {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                          <option value="default">Default Baseline</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => {
                          const val = document.getElementById(`plan-${app._id}`).value;
                          if (!val) return alert('Selection required');
                          handleApprove(app._id, val === 'default' ? null : val);
                        }} className={primaryBtn}>Approve</button>
                        <button onClick={() => handleReject(app._id)} className={dangerBtn}>Decline</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ... Other tabs follow similar premium patterns ... */}
        {activeTab === 'levels' && (
          <div className={`${cardBase} p-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 text-center sm:text-left">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">IB Hierarchy Levels</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Autonomous growth paths and progression targets</p>
              </div>
              <button onClick={() => { setEditingLevel(null); setShowLevelModal(true); }} className={primaryBtn}><Plus size={18}/> Provision New Echelon</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ibLevels.sort((a,b) => a.order - b.order).map(level => (
                <div key={level._id} className={`${cardBase} p-6 relative group hover:border-blue-400 hover:shadow-lg`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Award size={20}/></div>
                      <div className="font-black text-slate-900 tracking-tight">{level.name}</div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg tracking-widest border border-slate-100">Order {level.order}</span>
                  </div>
                  <div className="space-y-3.5 mt-6">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Users size={12}/> Entry Bar</span>
                      <span className="text-sm font-black text-slate-700">{level.referralTarget} Referrals</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Percent size={12}/> Yield Rate</span>
                      <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{level.commissionRate}{level.commissionType === 'PER_LOT' ? ' $/Lot' : '%'}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => { setEditingLevel(level); setShowLevelModal(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 active:scale-95"><Edit size={18} /></button>
                    <button onClick={() => handleDeleteLevel(level._id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 active:scale-95"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... commission plans ... */}
        {activeTab === 'plans' && (
          <div className={`${cardBase} p-8`}>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Contractual Archetypes</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Multi-tier commission distribution models</p>
              </div>
              <button onClick={() => { setEditingPlan(null); setShowPlanModal(true); }} className={primaryBtn}><Plus size={18}/> Synthesize Plan</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {plans.map(plan => (
                <div key={plan._id} className={`${cardBase} p-8 flex flex-col hover:border-blue-400 hover:shadow-lg`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="max-w-[70%]">
                      <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2.5">
                        {plan.name}
                        {plan.isDefault && <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Baseline</span>}
                      </h3>
                      <p className="text-slate-400 text-xs font-bold mt-1.5 leading-relaxed">{plan.description || "System standard yield policy."}</p>
                    </div>
                    <button onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-100 active:scale-95 transition-all"><Edit size={18}/></button>
                  </div>
                  <div className="mt-auto grid grid-cols-5 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {[1,2,3,4,5].map(lvl => (
                      <div key={lvl} className="text-center">
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">G{lvl}</div>
                        <div className="text-sm font-black text-slate-600 italic">{(plan.levelCommissions?.[`level${lvl}`] || 0)}{plan.commissionType === 'PERCENTAGE' ? '%' : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ... settings ... */}
        {activeTab === 'settings' && settings && (
          <div className={`${cardBase} p-8 max-w-3xl overflow-hidden`}>
            <div className="mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Configuration</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Global logic injection and operational master toggles</p>
            </div>
            <div className="space-y-5">
              {[
                { label: 'Ecosystem Vitality', subText: 'Master toggle to enable/disable all IB operations globally.', key: 'isEnabled', val: settings.isEnabled, icon: ShieldCheck },
                { label: 'Open Inbound Enrollment', subText: 'Allow clients to apply for partnership through the dashboard.', key: 'allowNewApplications', val: settings.allowNewApplications, icon: UserPlus },
                { label: 'Autonomous Onboarding', subText: 'Automatically verify and approve incoming applications.', key: 'autoApprove', val: settings.autoApprove, icon: RefreshCw }
              ].map(t => (
                <div key={t.key} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-md hover:border-blue-100 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${t.val ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                      <t.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{t.label}</h4>
                      <p className="text-xs text-slate-400 font-bold max-w-md">{t.subText}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUpdateSettings({ [t.key]: !t.val })} 
                    className={`relative w-14 h-8 rounded-full transition-all flex items-center p-1 cursor-pointer ${t.val ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-300'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${t.val ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              ))}
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-3xl mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><Wallet size={18}/></div>
                  <label className="text-sm font-black text-slate-900 uppercase tracking-tight">Minimum Settlement Threshold</label>
                </div>
                <div className="relative max-w-xs">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">$</span>
                  <input type="number" value={settings.commissionSettings?.minWithdrawalAmount || 50} 
                    onChange={e => handleUpdateSettings({ commissionSettings: { ...settings.commissionSettings, minWithdrawalAmount: parseFloat(e.target.value) } })} 
                    className={`${inputBase} pl-8 text-xl font-black`} />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase mt-3 tracking-widest">Internal Payout Vector Limit</p>
              </div>
            </div>
          </div>
        )}

        {/* ... transfer ... */}
        {activeTab === 'transfer' && (
          <div className={`${cardBase} p-8`}>
            <div className="mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hierarchy Redistribution</h2>
              <p className="text-slate-500 text-sm font-medium mt-1">Mass migration of network users between different IB entities</p>
            </div>
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 p-8 bg-slate-50/50 border border-slate-100 rounded-3xl shadow-inner">
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-6 flex items-center gap-2"><Target size={16} className="text-blue-500"/> Select Target Recipient</h3>
                <div className="relative">
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select value={targetIB} onChange={e => setTargetIB(e.target.value)} className={`${inputBase} h-14 appearance-none pr-10 font-black text-slate-700`}>
                    <option value="">Choose Landing IB Vector...</option>
                    {ibs.filter(ib => ib.ibStatus === 'ACTIVE').map(ib => <option key={ib._id} value={ib._id}>{ib.firstName} {ib.lastName} — CID:{ib.referralCode}</option>)}
                  </select>
                </div>
                <div className="mt-8 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm italic text-slate-400 text-xs font-medium leading-relaxed">
                  Warning: This operation will rewrite the parental database entries for all selected identity vectors. This action is logged to the system audit trail.
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="flex justify-between items-center px-2">
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm mb-1 leading-none">Source Identification</h3>
                    <p className="text-blue-600 font-bold text-xs tracking-tight">{selectedUsers.length} targets currently locked</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedUsers(filteredUsers.map(u => u._id))} className="text-[10px] font-black uppercase px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-200 transition-all">Lock All Match</button>
                    <button onClick={() => setSelectedUsers([])} className="text-[10px] font-black uppercase px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-200 transition-all">Flush Buffer</button>
                  </div>
                </div>

                <div className="relative">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input type="text" placeholder="Identity filter: name or email hash..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className={`${inputBase} h-14 pl-14 font-black shadow-inner`} />
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2.5 p-1 rounded-2xl border border-slate-100 bg-white shadow-inner custom-scrollbar pr-2">
                  {filteredUsers.length === 0 ? (
                    <div className="py-20 text-center text-slate-300 font-black italic">No identity vectors matching this hash.</div>
                  ) : (
                    filteredUsers.map(user => (
                      <div 
                        key={user._id} 
                        onClick={() => { setSelectedUsers(p => p.includes(user._id) ? p.filter(id => id !== user._id) : [...p, user._id]) }}
                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 group ${
                          selectedUsers.includes(user._id) 
                            ? 'bg-blue-50/50 border-blue-500/20 shadow-sm' 
                            : 'bg-slate-50/30 border-transparent hover:border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedUsers.includes(user._id) 
                              ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' 
                              : 'border-slate-200 bg-white group-hover:border-blue-300'
                          }`}>
                            {selectedUsers.includes(user._id) && <Check size={16} className="text-white" />}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 text-sm tracking-tight">{user.firstName} {user.lastName}</p>
                            <p className="text-[10px] font-bold text-slate-400 font-mono italic">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">ID_{user._id?.slice(-8)}</div>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  disabled={transferLoading || !targetIB || !selectedUsers.length} 
                  onClick={handleTransferReferrals} 
                  className={`mt-4 w-full h-16 rounded-3xl font-black text-base uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    transferLoading || !targetIB || !selectedUsers.length 
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                      : 'bg-blue-600 text-white shadow-blue-300 hover:bg-blue-700'
                  }`}
                > 
                  {transferLoading ? <><RefreshCw size={24} className="animate-spin" /> Committing Cycles...</> : <><ArrowRightLeft size={24}/> Commit Hierarchy Migration</>} 
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Modal Management */}
      {showPlanModal && <PlanModal plan={editingPlan} onSave={handleSavePlan} onClose={() => {setShowPlanModal(false); setEditingPlan(null)}} colors={modeColors} />}
      {showLevelModal && <LevelModal level={editingLevel} onSave={handleSaveLevel} onClose={() => {setShowLevelModal(false); setEditingLevel(null)}} orders={ibLevels.map(l=>l.order)} colors={modeColors} />}
      {showIBModal && <IBDetailsModal ib={viewingIB} plans={plans} levels={ibLevels} ibCommission={ibCommission} setIbCommission={setIbCommission} ibPlan={ibPlan} setIbPlan={setIbPlan} autoUpgrade={ibAutoUpgradeEnabled} setAutoUpgrade={setIbAutoUpgradeEnabled} overrideEnabled={ibManualCommissionEnabled} setOverrideEnabled={setIbManualCommissionEnabled} overrideType={ibManualCommissionType} setOverrideType={setIbManualCommissionType} overrideLevels={ibManualCommissionLevels} setOverrideLevels={setIbManualCommissionLevels} notes={ibManualCommissionNotes} setNotes={setIbManualCommissionNotes} onSave={handleSaveIBDetails} onClose={()=>setShowIBModal(false)} saving={savingIB} colors={modeColors} />}
    </AdminLayout>
  )
}

// --- Premium Component: Modal Wrapper ---
const ModalWrapper = ({ title, children, onClose, colors, icon: Icon = UserCog }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
    <div className="w-full max-w-xl bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative z-[101] animate-in zoom-in-95 duration-300">
      <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-600 text-white rounded-[1.25rem] shadow-xl shadow-blue-200">
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
            <p className="text-slate-400 text-xs font-bold mt-1.5 uppercase tracking-widest">Administrative Override Protocol</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all border border-transparent hover:border-slate-200">
          <X size={24} />
        </button>
      </div>
      <div className="p-10 overflow-y-auto custom-scrollbar flex-1">{children}</div>
    </div>
  </div>
)

// --- Premium Component: Plan Modal ---
const PlanModal = ({ plan, onSave, onClose, colors }) => {
  const [fd, setFd] = useState({ name: plan?.name||'', description: plan?.description||'', maxLevels: plan?.maxLevels||3, commissionType: plan?.commissionType||'PER_LOT', levelCommissions: plan?.levelCommissions||{level1:5, level2:3, level3:2, level4:1, level5:0.5}, isDefault: plan?.isDefault||false })
  return (
    <ModalWrapper title={plan ? "Edit Yield Archetype" : "Forge Commission Plan"} onClose={onClose} colors={colors} icon={Percent}>
      <form onSubmit={e => { e.preventDefault(); onSave(fd); }} className="space-y-6">
        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Identifier</label><input required placeholder="VIP_INSTITUTIONAL_A..." className={inputBase} value={fd.name} onChange={e=>setFd({...fd, name: e.target.value})} /></div>
        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Policy Scope</label><textarea placeholder="Describe the model logic..." className={inputBase} value={fd.description} onChange={e=>setFd({...fd, description: e.target.value})} rows={3} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Payload Format</label><select className={`${inputBase} appearance-none cursor-pointer`} value={fd.commissionType} onChange={e=>setFd({...fd, commissionType: e.target.value})}><option value="PER_LOT">Fixed USD / Lot</option><option value="PERCENTAGE">Equity Share %</option></select></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Generational Depth</label><select className={`${inputBase} appearance-none cursor-pointer`} value={fd.maxLevels} onChange={e=>setFd({...fd, maxLevels: parseInt(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} Tiers Active</option>)}</select></div>
        </div>
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 block text-center">Multi-Generation Yield Coefficients</label>
          <div className="grid grid-cols-5 gap-3">
            {[1,2,3,4,5].map(l => (
              <div key={l} className="text-center"><label className="text-[8px] font-black text-slate-300 mb-1 block">LVL {l}</label><input type="number" step="0.1" disabled={l > fd.maxLevels} className={`${inputBase} text-center px-1 font-black ${l > fd.maxLevels ? 'opacity-20 grayscale' : ''}`} value={fd.levelCommissions[`level${l}`]||0} onChange={e=>setFd({...fd, levelCommissions:{...fd.levelCommissions, [`level${l}`]: parseFloat(e.target.value)}})} /></div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl cursor-pointer select-none" onClick={()=>setFd({...fd, isDefault: !fd.isDefault})}>
          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${fd.isDefault ? 'bg-blue-600 border-blue-600 shadow-md shadow-blue-200' : 'bg-white border-slate-200'}`}>
            {fd.isDefault && <Check size={16} className="text-white" />}
          </div>
          <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Lock as Ecosystem Baseline</span>
        </div>
        <div className="flex gap-4 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className={secondaryBtn + " flex-1"}>Abort</button>
          <button type="submit" className={primaryBtn + " flex-1"}>Commit Plan</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// --- Premium Component: Level Modal ---
const LevelModal = ({ level, onSave, onClose, orders, colors }) => {
  const [fd, setFd] = useState({ name: level?.name||'', order: level?.order||(Math.max(0, ...orders)+1), referralTarget: level?.referralTarget||0, commissionRate: level?.commissionRate||0, commissionType: level?.commissionType||'PER_LOT', isActive: level?.isActive!==false })
  return (
    <ModalWrapper title={level ? "Modify Echelon" : "Synthesize Tier"} onClose={onClose} colors={colors} icon={Award}>
      <form onSubmit={e => { e.preventDefault(); onSave(fd); }} className="space-y-8">
        <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Tier Designation</label><input required placeholder="e.g. TITANIUM_LEAD" className={inputBase} value={fd.name} onChange={e=>setFd({...fd, name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-6">
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Hierarchical Order</label><input type="number" required className={inputBase} value={fd.order} onChange={e=>setFd({...fd, order: parseInt(e.target.value)})} /></div>
          <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block px-1">Entry Threshold</label><div className="relative"><Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"/><input type="number" required className={`${inputBase} pl-10`} value={fd.referralTarget} onChange={e=>setFd({...fd, referralTarget: parseInt(e.target.value)})} /></div></div>
        </div>
        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block text-center">Primary Yield</label><input type="number" step="0.1" required className={`${inputBase} text-center font-black text-lg h-14 bg-white`} value={fd.commissionRate} onChange={e=>setFd({...fd, commissionRate: parseFloat(e.target.value)})} /></div>
            <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block text-center">Format Vector</label><select className={`${inputBase} appearance-none cursor-pointer h-14 bg-white text-center font-black`} value={fd.commissionType} onChange={e=>setFd({...fd, commissionType: e.target.value})}><option value="PER_LOT">USD / Lot</option><option value="PERCENTAGE">% Yield Share</option></select></div>
          </div>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Base incentive structure for this hierarchy level</p>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4 cursor-pointer" onClick={()=>setFd({...fd, isActive: !fd.isActive})}>
            <button type="button" className={`relative w-14 h-8 rounded-full transition-all flex items-center p-1 ${fd.isActive ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${fd.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
            <span className="text-sm font-black text-slate-600 uppercase tracking-tight">Protocol Operational</span>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className={secondaryBtn}>Flush</button>
            <button type="submit" className={primaryBtn}>Synthesize</button>
          </div>
        </div>
      </form>
    </ModalWrapper>
  )
}

// --- Premium Component: IB Details Modal ---
const IBDetailsModal = ({ ib, plans, levels, ibCommission, setIbCommission, ibPlan, setIbPlan, autoUpgrade, setAutoUpgrade, overrideEnabled, setOverrideEnabled, overrideType, setOverrideType, overrideLevels, setOverrideLevels, notes, setNotes, onSave, onClose, saving, colors }) => {
  if(!ib) return null;
  return (
    <ModalWrapper title="Identity Configuration" onClose={onClose} colors={colors} icon={UserCog}>
      <div className="space-y-8">
        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="w-20 h-20 bg-white shadow-xl shadow-blue-100 rounded-3xl flex flex-col justify-center items-center border border-slate-50 relative z-10 transition-transform hover:rotate-3 duration-500">
            <span className="text-blue-600 font-black text-3xl leading-none">{ib.firstName?.[0]}</span>
            <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest mt-1">Vector</span>
          </div>
          <div className="relative z-10">
            <h4 className="font-black text-2xl text-slate-900 tracking-tight leading-none">{ib.firstName} {ib.lastName}</h4>
            <p className="text-sm text-slate-500 font-bold mt-2 flex items-center gap-1.5"><Calendar size={14}/> CID: {ib.referralCode || 'UNASSIGNED'}</p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-400 font-mono italic">{ib.email}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Echelon Assignment</label>
            <select className={`${inputBase} h-14 font-black text-slate-700 appearance-none`} value={ibCommission} onChange={e=>setIbCommission(e.target.value)}>
              <option value="">Choose Tier...</option>
              {levels.map(l=><option key={l._id} value={l._id}>{l.name} — Order {l.order}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block px-1">Yield Directive Override</label>
            <select className={`${inputBase} h-14 font-black text-slate-700 appearance-none`} value={ibPlan} onChange={e=>setIbPlan(e.target.value)}>
              <option value="">System Default...</option>
              {plans.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-blue-900 uppercase tracking-tight">Autonomous Upgrades</p>
            <p className="text-[10px] text-blue-500 font-bold">Enabled growth tracking and tier escalation logic.</p>
          </div>
          <button type="button" onClick={()=>setAutoUpgrade(!autoUpgrade)} className={`relative w-14 h-8 rounded-full transition-all flex items-center p-1 ${autoUpgrade ? 'bg-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-300'}`}>
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${autoUpgrade ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <ShieldCheck className={overrideEnabled ? 'text-orange-500' : 'text-slate-300'} size={20}/>
              <label className="text-sm font-black text-slate-900 uppercase tracking-tight">Manual Commercial Override</label>
            </div>
            <button type="button" onClick={()=>setOverrideEnabled(!overrideEnabled)} className={`relative w-14 h-8 rounded-full transition-all flex items-center p-1 ${overrideEnabled ? 'bg-orange-500 shadow-lg shadow-orange-100' : 'bg-slate-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${overrideEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>

          {overrideEnabled && (
            <div className="p-8 border-2 border-orange-100 rounded-[2rem] space-y-6 bg-orange-50/30 animate-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-black text-orange-900 uppercase tracking-widest leading-none">Generational Yield Vector</h5>
                  <select className="bg-white border border-orange-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-orange-600 focus:outline-none" value={overrideType} onChange={e=>setOverrideType(e.target.value)}>
                    <option value="PER_LOT">$/Lot</option>
                    <option value="PERCENTAGE">Equity %</option>
                  </select>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[1,2,3,4,5].map(l => (
                    <div key={l} className="text-center">
                      <label className="text-[9px] font-black text-orange-300 mb-1.5 block uppercase">G{l}</label>
                      <input type="number" step="0.1" className={`${inputBase} h-12 text-center px-1 font-black bg-white border-orange-100 focus:border-orange-400 focus:ring-orange-500/10`} value={overrideLevels[`level${l}`]||0} onChange={e=>setOverrideLevels({...overrideLevels, [`level${l}`]: parseFloat(e.target.value)})} />
                    </div>
                  ))}
                </div>
              </div>
              <textarea className={`${inputBase} bg-white border-orange-100 resize-none`} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Documentation of manual commercial terms override justification..." rows={3} />
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-8 border-t border-slate-100">
          <button type="button" onClick={onClose} className={secondaryBtn + " flex-1"}>Abort</button>
          <button onClick={onSave} disabled={saving} className={primaryBtn + " flex-1"}>{saving ? <RefreshCw size={20} className="animate-spin text-white"/> : 'Commit Changes'}</button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export default AdminIBManagement;
