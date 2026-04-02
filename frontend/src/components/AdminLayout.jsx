
// AdminLayout.js

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
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
  Megaphone,
  Palette,
  Mail,
  Bitcoin,
  Image,
  Images
} from 'lucide-react'
import { MdLeaderboard } from "react-icons/md";

const AdminLayout = ({ children, title, subtitle }) => {
  const navigate = useNavigate()
  const location = useLocation()
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
    // { name: 'Carousel Management', icon: Images, path: '/admin/carousel' },
    { name: 'Competitions', icon: MdLeaderboard, path: '/admin/competition' },
    { name: 'Email Management', icon: Mail, path: '/admin/email' },
    { name: 'Oxapay Gateway', icon: Bitcoin, path: '/admin/oxapay' },
    { name: 'Admin Management', icon: Shield, path: '/admin/admin-management' },
    { name: 'KYC Verification', icon: FileCheck, path: '/admin/kyc' },
    { name: 'Support Tickets', icon: HeadphonesIcon, path: '/admin/support' },
  
    { name: 'Announcement Managment', icon: Megaphone, path: '/admin/announcement' },

  ]

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken')
    // Handle both missing token and the literal string "undefined"
    if (!adminToken || adminToken === 'undefined' || adminToken === 'null') {
      localStorage.removeItem('adminToken') // Clear if it's the "undefined" string
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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarExpanded ? 'w-64' : 'w-20'} 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-white border-r border-slate-200 flex flex-col 
          transition-all duration-300 ease-in-out shadow-lg lg:shadow-none
        `}
      >
        {/* Logo Section */}
        <div className="h-24 flex items-center justify-center relative border-b border-slate-100 bg-white">
          <div className="flex items-center justify-center p-4">
            <img 
              src="/hcfinvest_orange_logo.png" 
              alt="hcfinvest" 
              className={`${sidebarExpanded ? 'w-16 h-16' : 'w-10 h-10'} object-contain flex-shrink-0 transition-all duration-300`}
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
              }}
            />
            <div className={`${sidebarExpanded ? 'w-16 h-16' : 'w-10 h-10'} bg-orange-500 rounded-xl items-center justify-center flex-shrink-0 hidden transition-all duration-300`}>
              <span className="text-white font-bold text-sm">HCF</span>
            </div>
          </div>
          
          {/* Desktop Toggle Button */}
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm hover:shadow-md hover:border-blue-300 transition-all z-10"
          >
            {sidebarExpanded ? <ChevronDown className="-rotate-90 w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Mobile Close Button */}
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path)
                setMobileMenuOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 border border-blue-500' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
              title={!sidebarExpanded ? item.name : ''}
            >
              <item.icon size={20} className={`${isActive(item.path) ? 'text-white' : 'text-slate-400'} flex-shrink-0`} />
              {sidebarExpanded && (
                <span className="text-sm font-semibold tracking-wide whitespace-nowrap truncate">{item.name}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all rounded-xl border border-transparent"
            title={!sidebarExpanded ? 'Log Out' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarExpanded && <span className="text-sm font-semibold whitespace-nowrap">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-w-0 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 py-5 border-b border-slate-200 shadow-sm shadow-slate-100/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <Menu size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title || 'Admin Dashboard'}</h1>
              {subtitle && <p className="text-slate-500 text-sm font-medium mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold border border-slate-200">
            <span className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-pulse"></span>
            <span>SYSTEM SECURE</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout;
