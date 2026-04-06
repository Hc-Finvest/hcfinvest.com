import { API_URL } from '../config/api'
import { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import AdminLayout from '../components/AdminLayout'
import { 
  UserCog, Plus, Search, Eye, Edit, Trash2, Users, DollarSign, 
  Percent, Check, X, RefreshCw, Settings, ChevronDown, ArrowRightLeft, 
  UserPlus, Award, Target, Calendar, ShieldCheck
} from 'lucide-react'

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
  
  // IB Editing States
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
    const fetchAll = () => { fetchDashboard(); fetchIBs(); fetchApplications(); fetchPlans(); fetchSettings(); fetchAllUsers(); fetchIBLevels(); }
    fetchAll();
    const interval = setInterval(() => { fetchDashboard(); fetchIBs(); fetchApplications(); }, 10000)
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

  // Common UI Styles
  const cardStyle = { backgroundColor: modeColors.card, borderColor: modeColors.border, color: modeColors.text }
  const bgSecondaryStyle = { backgroundColor: modeColors.bgSecondary, color: modeColors.text }
  
  const handleTransferReferrals = async () => {
    if (!selectedUsers.length || !targetIB) return alert('Select users and an IB to transfer');
    setTransferLoading(true)
    try {
      const res = await fetch(`${API_URL}/ib/admin/transfer-referrals`, { method: 'POST', headers: getAdminHeaders(), body: JSON.stringify({ userIds: selectedUsers, targetIBId: targetIB }) })
      const data = await res.json()
      if (data.success) { alert(`Successfully transferred users`); setSelectedUsers([]); setTargetIB(''); fetchAllUsers(); fetchIBs(); }
    } catch(e) {}
    setTransferLoading(false)
  }

  const handleSaveLevel = async (levelData) => {
    try {
      const url = editingLevel ? `${API_URL}/ib/admin/levels/${editingLevel._id}` : `${API_URL}/ib/admin/levels`
      const res = await fetch(url, { method: editingLevel ? 'PUT' : 'POST', headers: getAdminHeaders(), body: JSON.stringify(levelData) })
      const data = await res.json()
      if (data.success) { setShowLevelModal(false); setEditingLevel(null); fetchIBLevels(); } else alert('Failed to save')
    } catch (e) {}
  }

  const handleDeleteLevel = async (id) => {
    if (!confirm('Delete this level?')) return;
    try { await fetch(`${API_URL}/ib/admin/levels/${id}`, { method: 'DELETE', headers: getAdminHeaders() }); fetchIBLevels(); } catch(e){}
  }

  const handleApprove = async (id, planId) => {
    try { await fetch(`${API_URL}/ib/admin/approve/${id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ planId }) }); fetchApplications(); fetchIBs(); fetchDashboard(); } catch(e){}
  }

  const handleReject = async (id) => {
    const reason = prompt('Reject reason?'); if (!reason) return;
    try { await fetch(`${API_URL}/ib/admin/reject/${id}`, { method: 'PUT', headers: getAdminHeaders(), body: JSON.stringify({ reason }) }); fetchApplications(); } catch(e){}
  }

  const handleBlock = async (id) => {
    const reason = prompt('Block reason?'); if (!reason) return;
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

  const filteredIBs = ibs.filter(ib => ib.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || ib.email?.toLowerCase().includes(searchTerm.toLowerCase()) || ib.referralCode?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsers = allUsers.filter(u => u.firstName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()));

  return (
    <AdminLayout title="IB Management" subtitle="Manage Introducing Brokers, levels, and plans">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active IBs', value: dashboard?.ibs?.total || 0, sub: `${dashboard?.ibs?.pending || 0} pending review` },
          { label: 'Total Referrals', value: dashboard?.referrals?.total || 0, sub: 'Network users' },
          { label: 'Commissions Paid', value: `$${(dashboard?.commissions?.total?.totalCommission || 0).toFixed(2)}`, sub: 'Lifetime paid' },
          { label: 'Pending Withdrawals', value: `$${(dashboard?.withdrawals?.pending?.totalPending || 0).toFixed(2)}`, sub: 'Requires Review' }
        ].map((stat, idx) => (
          <div key={idx} style={cardStyle} className="rounded-lg p-5 border shadow-sm flex flex-col justify-between">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">{stat.label}</h4>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <span className="text-sm text-blue-500 font-medium mt-1">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2 border-b" style={{ borderColor: modeColors.border }}>
        {[
          { id: 'ibs', label: 'Active IBs' }, { id: 'applications', label: 'Pending Applications' },
          { id: 'levels', label: 'IB Levels' }, { id: 'plans', label: 'Commission Plans' },
          { id: 'transfer', label: 'Transfer Referrals' }, { id: 'settings', label: 'Settings' }
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition border-b-2`}
            style={{ color: activeTab === t.id ? '#3b82f6' : modeColors.textSecondary, borderColor: activeTab === t.id ? '#3b82f6' : 'transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {activeTab === 'ibs' && (
        <div style={cardStyle} className="rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Active IBs</h2>
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border rounded-md px-3 py-2 text-sm max-w-sm" style={bgSecondaryStyle} />
              <button onClick={() => { fetchIBs(); fetchDashboard(); }} className="p-2 border rounded-md hover:bg-gray-100" style={bgSecondaryStyle}><RefreshCw size={16} /></button>
            </div>
          </div>
          {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b text-gray-500" style={{ borderColor: modeColors.border }}>
                  <tr><th className="py-3 font-semibold">Name / Email</th><th className="py-3 font-semibold">Referral Code</th><th className="py-3 font-semibold">Level & Plan</th><th className="py-3 font-semibold">Referrals</th><th className="py-3 font-semibold">Status</th><th className="py-3 text-right font-semibold">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIBs.map(ib => (
                    <tr key={ib._id}>
                      <td className="py-3">
                        <div className="font-semibold">{ib.firstName} {ib.lastName}</div>
                        <div className="text-xs text-gray-500">{ib.email}</div>
                      </td>
                      <td className="py-3 font-mono">{ib.referralCode || '-'}</td>
                      <td className="py-3">
                        <div>{ib.ibLevelId?.name || `Level ${ib.ibLevel || 1}`}</div>
                        <div className="text-xs text-gray-500">{ib.ibPlanId?.name || 'No Plan'}</div>
                      </td>
                      <td className="py-3">{ib.referralCount || 0}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${ib.ibStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ib.ibStatus}</span>
                      </td>
                      <td className="py-3 flex justify-end gap-2">
                        <button onClick={() => {
                          setViewingIB(ib); setIbCommission(ib.ibLevelId?._id || ''); setIbPlan(ib.ibPlanId?._id || '');
                          setIbAutoUpgradeEnabled(ib.autoUpgradeEnabled !== false); setIbManualCommissionEnabled(Boolean(ib.ibCommissionOverride?.enabled));
                          setShowIBModal(true);
                        }} className="p-1 hover:text-blue-500"><Edit size={16} /></button>
                        {ib.ibStatus === 'ACTIVE' && <button onClick={() => handleBlock(ib._id)} className="p-1 hover:text-red-500"><X size={16} /></button>}
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
        <div style={cardStyle} className="rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Pending Applications</h2>
          {applications.length === 0 ? <p className="text-gray-500 italic">No pending applications.</p> : (
            <div className="grid gap-4">
              {applications.map(app => (
                <div key={app._id} className="flex flex-col md:flex-row md:items-center justify-between border rounded-lg p-4" style={cardStyle}>
                  <div>
                    <div className="font-bold">{app.firstName} {app.lastName}</div>
                    <div className="text-sm text-gray-500">{app.email}</div>
                  </div>
                  <div className="flex gap-2 items-center mt-4 md:mt-0">
                    <select id={`plan-${app._id}`} className="border rounded-md px-3 py-2 text-sm" style={bgSecondaryStyle}>
                      <option value="">Select Plan...</option>
                      {plans.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                      <option value="default">Default Plan</option>
                    </select>
                    <button onClick={() => document.getElementById(`plan-${app._id}`).value ? handleApprove(app._id, document.getElementById(`plan-${app._id}`).value === 'default' ? null : document.getElementById(`plan-${app._id}`).value) : alert('Select plan')} className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-700">Approve</button>
                    <button onClick={() => handleReject(app._id)} className="border border-red-500 text-red-500 px-4 py-2 rounded-md font-semibold text-sm hover:bg-red-50">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'levels' && (
        <div style={cardStyle} className="rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">IB Levels</h2>
            <button onClick={() => { setEditingLevel(null); setShowLevelModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold text-sm"><Plus size={16}/> Add Level</button>
          </div>
          <div className="grid gap-4">
            {ibLevels.map(level => (
              <div key={level._id} className="border rounded-lg p-4 flex justify-between items-center" style={cardStyle}>
                <div>
                  <div className="font-bold flex items-center gap-2">{level.name} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">Level {level.order}</span></div>
                  <div className="text-sm text-gray-500">Requires {level.referralTarget} Referrals &bull; Pays ${level.commissionRate}/{level.commissionType === 'PER_LOT' ? 'Lot' : '%'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingLevel(level); setShowLevelModal(true); }} className="p-2 hover:bg-gray-100 rounded-md"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteLevel(level._id)} className="p-2 hover:bg-gray-100 rounded-md text-red-500"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'plans' && (
        <div style={cardStyle} className="rounded-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Commission Plans</h2>
            <button onClick={() => { setEditingPlan(null); setShowPlanModal(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md font-semibold text-sm"><Plus size={16}/> Create Plan</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(plan => (
              <div key={plan._id} className="border rounded-lg p-5" style={cardStyle}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">{plan.name} {plan.isDefault && <span className="text-xs text-blue-600 bg-blue-100 px-2 rounded-md">Default</span>}</h3>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                  <button onClick={() => { setEditingPlan(plan); setShowPlanModal(true); }} className="p-1 text-gray-400 hover:text-blue-500"><Edit size={16}/></button>
                </div>
                <div className="grid grid-cols-5 text-center text-sm bg-gray-50 rounded-md p-2">
                  {[1,2,3,4,5].map(lvl => <div key={lvl}><div className="text-xs text-gray-400 font-bold">L{lvl}</div><div>{plan.levelCommissions?.[`level${lvl}`] || 0}</div></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && settings && (
        <div style={cardStyle} className="rounded-lg border p-6 max-w-2xl">
          <h2 className="text-xl font-bold mb-6">Settings</h2>
          <div className="space-y-4">
            {[{ label: 'Enable IB System', key: 'isEnabled', val: settings.isEnabled }, { label: 'Allow New Applications', key: 'allowNewApplications', val: settings.allowNewApplications }, { label: 'Auto Approve Applications', key: 'autoApprove', val: settings.autoApprove }].map(t => (
              <div key={t.key} className="flex justify-between items-center py-2 border-b">
                <span className="font-medium text-sm">{t.label}</span>
                <input type="checkbox" checked={t.val} onChange={() => handleUpdateSettings({ [t.key]: !t.val })} className="w-4 h-4 cursor-pointer" />
              </div>
            ))}
            <div className="py-2">
              <label className="block text-sm font-medium mb-1">Minimum Withdrawal Amount ($)</label>
              <input type="number" value={settings.commissionSettings?.minWithdrawalAmount || 50} onChange={e => handleUpdateSettings({ commissionSettings: { ...settings.commissionSettings, minWithdrawalAmount: parseFloat(e.target.value) } })} className="border rounded-md px-3 py-2 w-32" style={bgSecondaryStyle} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div style={cardStyle} className="rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-6">Transfer Referrals</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2">1. Select Target IB</h3>
              <select value={targetIB} onChange={e => setTargetIB(e.target.value)} className="w-full border rounded-md px-3 py-2" style={bgSecondaryStyle}>
                <option value="">-- Choose New Parent IB --</option>
                {ibs.filter(ib => ib.ibStatus === 'ACTIVE').map(ib => <option key={ib._id} value={ib._id}>{ib.firstName} {ib.lastName} ({ib.referralCode})</option>)}
              </select>
            </div>
            <div className="border p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex justify-between">2. Select Users <span className="text-sm font-normal text-blue-500">{selectedUsers.length} selected</span></h3>
              <input type="text" placeholder="Search users by name or email..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} className="w-full border rounded-md px-3 py-2 mb-3" style={bgSecondaryStyle} />
              <div className="flex gap-2 mb-3">
                <button onClick={() => setSelectedUsers(filteredUsers.map(u => u._id))} className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-800">Select All Found</button>
                <button onClick={() => setSelectedUsers([])} className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-800">Clear</button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredUsers.map(user => (
                  <label key={user._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input type="checkbox" checked={selectedUsers.includes(user._id)} onChange={() => { setSelectedUsers(p => p.includes(user._id) ? p.filter(id => id !== user._id) : [...p, user._id]) }} />
                    <span className="text-sm">{user.firstName} {user.lastName} <span className="text-xs text-gray-500 ml-1">({user.email})</span></span>
                  </label>
                ))}
              </div>
              <button disabled={transferLoading || !targetIB || !selectedUsers.length} onClick={handleTransferReferrals} className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 rounded-md disabled:opacity-50 hover:bg-blue-700"> {transferLoading ? 'Transferring...' : 'Execute Transfer'} </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showPlanModal && <PlanModal plan={editingPlan} onSave={handleSavePlan} onClose={() => {setShowPlanModal(false); setEditingPlan(null)}} colors={modeColors} />}
      {showLevelModal && <LevelModal level={editingLevel} onSave={handleSaveLevel} onClose={() => {setShowLevelModal(false); setEditingLevel(null)}} orders={ibLevels.map(l=>l.order)} colors={modeColors} />}
      {showIBModal && <IBDetailsModal ib={viewingIB} plans={plans} levels={ibLevels} ibCommission={ibCommission} setIbCommission={setIbCommission} ibPlan={ibPlan} setIbPlan={setIbPlan} autoUpgrade={ibAutoUpgradeEnabled} setAutoUpgrade={setIbAutoUpgradeEnabled} overrideEnabled={ibManualCommissionEnabled} setOverrideEnabled={setIbManualCommissionEnabled} overrideType={ibManualCommissionType} setOverrideType={setIbManualCommissionType} overrideLevels={ibManualCommissionLevels} setOverrideLevels={setIbManualCommissionLevels} notes={ibManualCommissionNotes} setNotes={setIbManualCommissionNotes} onSave={handleSaveIBDetails} onClose={()=>setShowIBModal(false)} saving={savingIB} colors={modeColors} />}
    </AdminLayout>
  )
}

const ModalWrapper = ({ title, children, onClose, colors }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div style={{ backgroundColor: colors.card, borderColor: colors.border, color: colors.text }} className="w-full max-w-lg rounded-lg border shadow-xl flex flex-col max-h-[90vh]">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-bold">{title}</h3>
        <button onClick={onClose} className="p-1 text-gray-500 hover:text-black"><X size={20}/></button>
      </div>
      <div className="p-6 overflow-y-auto">{children}</div>
    </div>
  </div>
)

const inputClass = "w-full border rounded-md px-3 py-2 text-sm focus:border-blue-500 outline-none";

const PlanModal = ({ plan, onSave, onClose, colors }) => {
  const [fd, setFd] = useState({ name: plan?.name||'', description: plan?.description||'', maxLevels: plan?.maxLevels||3, commissionType: plan?.commissionType||'PER_LOT', levelCommissions: plan?.levelCommissions||{level1:5, level2:3, level3:2, level4:1, level5:0.5}, isDefault: plan?.isDefault||false })
  return (
    <ModalWrapper title={plan ? "Edit Commission Plan" : "Create Commission Plan"} onClose={onClose} colors={colors}>
      <form onSubmit={e => { e.preventDefault(); onSave(fd); }} className="space-y-4">
        <div><label className="text-xs font-semibold mb-1 block">Plan Name</label><input required className={inputClass} style={{background:colors.bgSecondary}} value={fd.name} onChange={e=>setFd({...fd, name: e.target.value})} /></div>
        <div><label className="text-xs font-semibold mb-1 block">Description</label><textarea className={inputClass} style={{background:colors.bgSecondary}} value={fd.description} onChange={e=>setFd({...fd, description: e.target.value})} rows={2} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold mb-1 block">Commission Type</label><select className={inputClass} style={{background:colors.bgSecondary}} value={fd.commissionType} onChange={e=>setFd({...fd, commissionType: e.target.value})}><option value="PER_LOT">Fixed USD / Lot</option><option value="PERCENTAGE">Percentage %</option></select></div>
          <div><label className="text-xs font-semibold mb-1 block">Max Levels</label><select className={inputClass} style={{background:colors.bgSecondary}} value={fd.maxLevels} onChange={e=>setFd({...fd, maxLevels: parseInt(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        </div>
        <div>
          <label className="text-xs font-semibold mb-2 block">Commission Rates per Level</label>
          <div className="grid grid-cols-5 gap-2">
            {[1,2,3,4,5].map(l => (
              <div key={l}><label className="text-xs text-gray-500 mb-1 block text-center">L{l}</label><input type="number" step="0.1" disabled={l > fd.maxLevels} className={inputClass + ' text-center px-1'} style={{background:colors.bgSecondary}} value={fd.levelCommissions[`level${l}`]||0} onChange={e=>setFd({...fd, levelCommissions:{...fd.levelCommissions, [`level${l}`]: parseFloat(e.target.value)}})} /></div>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fd.isDefault} onChange={e=>setFd({...fd, isDefault: e.target.checked})} /> Set as Default Plan</label>
        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">Save Plan</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

const LevelModal = ({ level, onSave, onClose, orders, colors }) => {
  const [fd, setFd] = useState({ name: level?.name||'', order: level?.order||(Math.max(0, ...orders)+1), referralTarget: level?.referralTarget||0, commissionRate: level?.commissionRate||0, commissionType: level?.commissionType||'PER_LOT', isActive: level?.isActive!==false })
  return (
    <ModalWrapper title={level ? "Edit IB Level" : "Create IB Level"} onClose={onClose} colors={colors}>
      <form onSubmit={e => { e.preventDefault(); onSave(fd); }} className="space-y-4">
        <div><label className="text-xs font-semibold mb-1 block">Level Name</label><input required className={inputClass} style={{background:colors.bgSecondary}} value={fd.name} onChange={e=>setFd({...fd, name: e.target.value})} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold mb-1 block">Order (Hierarchy)</label><input type="number" required className={inputClass} style={{background:colors.bgSecondary}} value={fd.order} onChange={e=>setFd({...fd, order: parseInt(e.target.value)})} /></div>
          <div><label className="text-xs font-semibold mb-1 block">Referral Target</label><input type="number" required className={inputClass} style={{background:colors.bgSecondary}} value={fd.referralTarget} onChange={e=>setFd({...fd, referralTarget: parseInt(e.target.value)})} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs font-semibold mb-1 block">Base Rate</label><input type="number" step="0.1" required className={inputClass} style={{background:colors.bgSecondary}} value={fd.commissionRate} onChange={e=>setFd({...fd, commissionRate: parseFloat(e.target.value)})} /></div>
          <div><label className="text-xs font-semibold mb-1 block">Rate Type</label><select className={inputClass} style={{background:colors.bgSecondary}} value={fd.commissionType} onChange={e=>setFd({...fd, commissionType: e.target.value})}><option value="PER_LOT">$/Lot</option><option value="PERCENTAGE">% Share</option></select></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fd.isActive} onChange={e=>setFd({...fd, isActive: e.target.checked})} /> Level Active</label>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">Save Level</button>
        </div>
      </form>
    </ModalWrapper>
  )
}

const IBDetailsModal = ({ ib, plans, levels, ibCommission, setIbCommission, ibPlan, setIbPlan, autoUpgrade, setAutoUpgrade, overrideEnabled, setOverrideEnabled, overrideType, setOverrideType, overrideLevels, setOverrideLevels, notes, setNotes, onSave, onClose, saving, colors }) => {
  if(!ib) return null;
  return (
    <ModalWrapper title="IB Details & Configuration" onClose={onClose} colors={colors}>
      <div className="space-y-5">
        <div className="p-4 bg-gray-50 rounded-lg flex gap-4 items-center border">
          <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-full flex justify-center items-center font-bold text-xl">{ib.firstName?.[0]}</div>
          <div>
            <h4 className="font-bold">{ib.firstName} {ib.lastName}</h4>
            <p className="text-xs text-gray-500">{ib.email} &bull; Code: {ib.referralCode || '-'}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div><label className="text-xs font-semibold mb-1 block">Level Assignement</label><select className={inputClass} style={{background:colors.bgSecondary}} value={ibCommission} onChange={e=>setIbCommission(e.target.value)}><option value="">Select Level...</option>{levels.map(l=><option key={l._id} value={l._id}>{l.name}</option>)}</select></div>
          <div><label className="text-xs font-semibold mb-1 block">Plan Override</label><select className={inputClass} style={{background:colors.bgSecondary}} value={ibPlan} onChange={e=>setIbPlan(e.target.value)}><option value="">No Plan Override</option>{plans.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={autoUpgrade} onChange={e=>setAutoUpgrade(e.target.checked)} /> Enable Automatic Level Upgrades</label>
        </div>
        <div className="space-y-3 pt-4 border-t">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={overrideEnabled} onChange={e=>setOverrideEnabled(e.target.checked)} /> Manual Commission Override</label>
          {overrideEnabled && (
            <div className="p-4 border rounded-md space-y-3" style={{background:colors.bgSecondary}}>
              <div><label className="text-xs mb-1 block">Type</label><select className={inputClass} value={overrideType} onChange={e=>setOverrideType(e.target.value)}><option value="PER_LOT">$/Lot</option><option value="PERCENTAGE">Percentage</option></select></div>
              <div className="grid grid-cols-5 gap-2">
                {[1,2,3,4,5].map(l => (
                  <div key={l}><label className="text-xs text-gray-500 mb-1 block text-center">L{l}</label><input type="number" step="0.1" className={inputClass + ' text-center px-1'} value={overrideLevels[`level${l}`]||0} onChange={e=>setOverrideLevels({...overrideLevels, [`level${l}`]: parseFloat(e.target.value)})} /></div>
                ))}
              </div>
              <div><label className="text-xs mb-1 block">Notes</label><input className={inputClass} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Reason for override..." /></div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md text-sm font-semibold hover:bg-gray-50 text-gray-800">Close</button>
          <button onClick={onSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">{saving?'Saving...':'Save Changes'}</button>
        </div>
      </div>
    </ModalWrapper>
  )
}
export default AdminIBManagement;
