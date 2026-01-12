import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, User, Wallet, Users, Copy, UserCircle, HelpCircle, FileText, LogOut,
  Mail, Phone, MapPin, Calendar, Shield, Edit2, Save, X, Camera, Building2, Smartphone, CreditCard, Trophy,
  ArrowLeft, Home
} from 'lucide-react'

const API_URL = 'http://localhost:5001/api'

const ProfilePage = () => {
  const navigate = useNavigate()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchChallengeStatus()
  }, [])

  const fetchChallengeStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/prop/status`)
      const data = await res.json()
      if (data.success) {
        setChallengeModeEnabled(data.enabled)
      }
    } catch (error) {
      console.error('Error fetching challenge status:', error)
    }
  }
  
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
  const [profile, setProfile] = useState({
    firstName: storedUser.firstName || '',
    lastName: storedUser.lastName || '',
    email: storedUser.email || '',
    phone: storedUser.phone || '',
    address: storedUser.address || '',
    city: storedUser.city || '',
    country: storedUser.country || '',
    dateOfBirth: storedUser.dateOfBirth || '',
    bankDetails: storedUser.bankDetails || {
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      ifscCode: '',
      branchName: ''
    },
    upiId: storedUser.upiId || ''
  })

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Account', icon: User, path: '/account' },
    { name: 'Wallet', icon: Wallet, path: '/wallet' },
    { name: 'IB', icon: Users, path: '/ib' },
    { name: 'Copytrade', icon: Copy, path: '/copytrade' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
    { name: 'Support', icon: HelpCircle, path: '/support' },
    { name: 'Instructions', icon: FileText, path: '/instructions' },
  ]

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: storedUser._id,
          ...profile
        })
      })
      const data = await res.json()
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        setEditing(false)
        alert('Profile updated successfully!')
      } else {
        alert(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/user/login')
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col md:flex-row">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-dark-800 border-b border-gray-800 px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate('/mobile')} className="p-2 -ml-2 hover:bg-dark-700 rounded-lg">
            <ArrowLeft size={22} className="text-white" />
          </button>
          <h1 className="text-white font-semibold text-lg flex-1">Profile</h1>
          <button onClick={() => navigate('/mobile')} className="p-2 hover:bg-dark-700 rounded-lg">
            <Home size={20} className="text-gray-400" />
          </button>
        </header>
      )}

      {/* Sidebar - Hidden on Mobile */}
      {!isMobile && (
        <aside 
          className={`${sidebarExpanded ? 'w-48' : 'w-16'} bg-dark-900 border-r border-gray-800 flex flex-col transition-all duration-300`}
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <div className="p-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-accent-green rounded flex items-center justify-center">
              <span className="text-black font-bold text-sm">CL</span>
            </div>
          </div>
          <nav className="flex-1 px-2">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  item.name === 'Profile' ? 'bg-accent-green text-black' : 'text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarExpanded && <span className="text-sm font-medium">{item.name}</span>}
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-gray-800">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white rounded-lg">
              <LogOut size={18} />
              {sidebarExpanded && <span className="text-sm">Log Out</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}>
        {!isMobile && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h1 className="text-xl font-semibold text-white">My Profile</h1>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 bg-accent-green text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-green/90"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 bg-dark-700 text-white px-4 py-2 rounded-lg hover:bg-dark-600"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-accent-green text-black px-4 py-2 rounded-lg font-medium hover:bg-accent-green/90 disabled:opacity-50"
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </header>
        )}

        <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
          <div className={`${isMobile ? '' : 'max-w-3xl'}`}>
            {/* Profile Header */}
            <div className={`bg-dark-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} border border-gray-800 mb-4`}>
              <div className={`flex ${isMobile ? 'flex-col' : ''} items-center gap-4`}>
                <div className="relative">
                  <div className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-accent-green/20 rounded-full flex items-center justify-center`}>
                    <span className={`text-accent-green font-bold ${isMobile ? 'text-xl' : 'text-3xl'}`}>
                      {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                    </span>
                  </div>
                  {editing && (
                    <button className="absolute bottom-0 right-0 w-6 h-6 bg-accent-green rounded-full flex items-center justify-center">
                      <Camera size={12} className="text-black" />
                    </button>
                  )}
                </div>
                <div className={isMobile ? 'text-center' : ''}>
                  <h2 className={`font-bold text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>{profile.firstName} {profile.lastName}</h2>
                  <p className="text-gray-400 text-sm">{profile.email}</p>
                  <div className={`flex ${isMobile ? 'justify-center flex-wrap' : ''} items-center gap-2 mt-2`}>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      storedUser.kycApproved ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {storedUser.kycApproved ? 'Verified' : 'Pending'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-500">
                      Since {new Date(storedUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className={`bg-dark-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} border border-gray-800`}>
              <h3 className={`text-white font-semibold ${isMobile ? 'mb-4 text-sm' : 'mb-6'}`}>Personal Information</h3>
              
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 gap-6'}`}>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">First Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.firstName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Last Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.lastName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                    <Mail size={14} /> Email
                  </label>
                  <p className="text-white">{profile.email}</p>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                    <Phone size={14} /> Phone
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.phone || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                    <Calendar size={14} /> Date of Birth
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={profile.dateOfBirth}
                      onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.dateOfBirth || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                    <MapPin size={14} /> Country
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.country}
                      onChange={(e) => setProfile({...profile, country: e.target.value})}
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.country || '-'}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-gray-400 text-sm mb-2 block flex items-center gap-2">
                    <MapPin size={14} /> Address
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.address || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="bg-dark-800 rounded-xl p-6 border border-gray-800 mt-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Building2 size={18} /> Bank Details (For Withdrawals)
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Bank Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.bankDetails?.bankName || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        bankDetails: {...profile.bankDetails, bankName: e.target.value}
                      })}
                      placeholder="e.g., HDFC Bank"
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.bankDetails?.bankName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Account Holder Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.bankDetails?.accountHolderName || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        bankDetails: {...profile.bankDetails, accountHolderName: e.target.value}
                      })}
                      placeholder="Name as per bank account"
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.bankDetails?.accountHolderName || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">Account Number</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.bankDetails?.accountNumber || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        bankDetails: {...profile.bankDetails, accountNumber: e.target.value}
                      })}
                      placeholder="Enter account number"
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.bankDetails?.accountNumber || '-'}</p>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">IFSC Code</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.bankDetails?.ifscCode || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        bankDetails: {...profile.bankDetails, ifscCode: e.target.value.toUpperCase()}
                      })}
                      placeholder="e.g., HDFC0001234"
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white uppercase"
                    />
                  ) : (
                    <p className="text-white">{profile.bankDetails?.ifscCode || '-'}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-gray-400 text-sm mb-2 block">Branch Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.bankDetails?.branchName || ''}
                      onChange={(e) => setProfile({
                        ...profile, 
                        bankDetails: {...profile.bankDetails, branchName: e.target.value}
                      })}
                      placeholder="e.g., Mumbai Main Branch"
                      className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                  ) : (
                    <p className="text-white">{profile.bankDetails?.branchName || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* UPI Section */}
            <div className="bg-dark-800 rounded-xl p-6 border border-gray-800 mt-6">
              <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
                <Smartphone size={18} /> UPI Details
              </h3>
              
              <div>
                <label className="text-gray-400 text-sm mb-2 block">UPI ID</label>
                {editing ? (
                  <input
                    type="text"
                    value={profile.upiId || ''}
                    onChange={(e) => setProfile({...profile, upiId: e.target.value})}
                    placeholder="e.g., yourname@upi"
                    className="w-full bg-dark-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                ) : (
                  <p className="text-white">{profile.upiId || '-'}</p>
                )}
              </div>

              {!editing && (!profile.bankDetails?.accountNumber && !profile.upiId) && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-500 text-sm">
                    ⚠️ Please add your bank details or UPI ID to receive withdrawals. Click "Edit Profile" to add.
                  </p>
                </div>
              )}
            </div>

            {/* Security Section */}
            <div className="bg-dark-800 rounded-xl p-6 border border-gray-800 mt-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield size={18} /> Security
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <p className="text-white">Password</p>
                    <p className="text-gray-500 text-sm">Last changed: Never</p>
                  </div>
                  <button className="text-accent-green hover:underline text-sm">Change Password</button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <div>
                    <p className="text-white">Two-Factor Authentication</p>
                    <p className="text-gray-500 text-sm">Add an extra layer of security</p>
                  </div>
                  <button className="text-accent-green hover:underline text-sm">Enable</button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white">Login History</p>
                    <p className="text-gray-500 text-sm">View recent login activity</p>
                  </div>
                  <button className="text-accent-green hover:underline text-sm">View</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ProfilePage
