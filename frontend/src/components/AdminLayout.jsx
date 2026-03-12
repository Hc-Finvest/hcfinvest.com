import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { 
  LayoutDashboard, 
  Users,
  LogOut,
  TrendingUp,
  Wallet,
  Building2,
  UserCog,
  DollarSign,
  IndianRupee,
  Copy,
  Trophy,
  CreditCard,
  Shield,
  FileCheck,
  HeadphonesIcon,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Palette,
  Mail,
  Bitcoin,
  Image,
  Images
} from 'lucide-react'

const AdminLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { modeColors } = useTheme()
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  const menuItems = [
    { name: 'Overview Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'User Management', icon: Users, path: '/admin/users' },
    { name: 'Trade Management', icon: TrendingUp, path: '/admin/trades' },
    { name: 'Fund Management', icon: Wallet, path: '/admin/funds' },
    { name: 'Bank Settings', icon: Building2, path: '/admin/bank-settings' },
    { name: 'IB Management', icon: UserCog, path: '/admin/ib-management' },
    { name: 'Forex Charges', icon: DollarSign, path: '/admin/forex-charges' },
    { name: 'Earnings Report', icon: TrendingUp, path: '/admin/earnings' },
    { name: 'Copy Trade Management', icon: Copy, path: '/admin/copy-trade' },
    { name: 'Prop Firm Challenges', icon: Trophy, path: '/admin/prop-firm' },
    { name: 'Account Types', icon: CreditCard, path: '/admin/account-types' },
    { name: 'Theme Settings', icon: Palette, path: '/admin/theme' },
    { name: 'Banner Management', icon: Image, path: '/admin/banners' },
    { name: 'Carousel Management', icon: Images, path: '/admin/carousel' },
    { name: 'Email Management', icon: Mail, path: '/admin/email' },
    { name: 'Oxapay Gateway', icon: Bitcoin, path: '/admin/oxapay' },
    { name: 'Admin Management', icon: Shield, path: '/admin/admin-management' },
    { name: 'KYC Verification', icon: FileCheck, path: '/admin/kyc' },
    { name: 'Support Tickets', icon: HeadphonesIcon, path: '/admin/support' },
    { name: 'Competitions', icon: HeadphonesIcon, path: '/admin/competition' },
  ]

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      navigate('/admin')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    navigate('/admin')
  }

  const isActive = (path) => location.pathname === path

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: modeColors.bgPrimary }}>
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarExpanded ? 'w-64' : 'w-16'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col 
          transition-all duration-300 ease-in-out border-r
        `}
        style={{ 
          backgroundColor: modeColors.adminSidebar,
          borderColor: modeColors.border
        }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: modeColors.border }}>
          <div className="flex items-center gap-2 min-w-0">
            <img 
              src="/hcfinvest_orange_logo.png" 
              alt="hcfinvest" 
              className="w-8 h-8 object-contain flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className="w-8 h-8 bg-orange-500 rounded items-center justify-center flex-shrink-0 hidden">
              <span className="text-white font-bold text-sm">HCF</span>
            </div>
            {sidebarExpanded && <span className="font-semibold whitespace-nowrap truncate" style={{ color: modeColors.textPrimary }}>hcfinvest Admin</span>}
          </div>
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden lg:block p-1 hover:bg-gray-700 rounded transition-colors"
            style={{ color: modeColors.textMuted }}
          >
            <Menu size={18} />
          </button>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-700 rounded transition-colors"
            style={{ color: modeColors.textMuted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                isActive(item.path)
                  ? '' 
                  : ''
              }`}
              style={{
                backgroundColor: isActive(item.path) ? modeColors.adminAccent : 'transparent',
                color: isActive(item.path) ? '#FFFFFF' : modeColors.textMuted
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.backgroundColor = modeColors.adminSidebarHover
                  e.target.style.color = modeColors.textPrimary
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.backgroundColor = 'transparent'
                  e.target.style.color = modeColors.textMuted
                }
              }}
              title={!sidebarExpanded ? item.name : ''}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {sidebarExpanded && (
                <span className="text-sm font-medium whitespace-nowrap truncate">{item.name}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t" style={{ borderColor: modeColors.border }}>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors rounded-lg"
            style={{ color: modeColors.textMuted }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = modeColors.adminSidebarHover
              e.target.style.color = modeColors.textPrimary
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent'
              e.target.style.color = modeColors.textMuted
            }}
            title={!sidebarExpanded ? 'Log Out' : ''}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-4 border-b" style={{ 
          backgroundColor: modeColors.bgCard,
          borderColor: modeColors.border
        }}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              style={{ color: modeColors.textMuted }}
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold" style={{ color: modeColors.textPrimary }}>{title || 'Admin Dashboard'}</h1>
              {subtitle && <p className="text-sm hidden sm:block" style={{ color: modeColors.textSecondary }}>{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm" style={{ 
            backgroundColor: modeColors.adminError + '20',
            color: modeColors.adminError
          }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: modeColors.adminError }}></span>
            <span className="hidden sm:inline">Admin Mode</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-6" style={{ backgroundColor: modeColors.bgSecondary }}>
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
