import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import MobileTradingApp from './pages/MobileTradingApp'
import Account from './pages/Account'
import WalletPage from './pages/WalletPage'
import OrderBook from './pages/OrderBook'
import TradingPage from './pages/TradingPage'
import CopyTradePage from './pages/CopyTradePage'
import IBPage from './pages/IBPage'
import ProfilePage from './pages/ProfilePage'
import SupportPage from './pages/SupportPage'
import InstructionsPage from './pages/InstructionsPage'
import AdminLogin from './pages/AdminLogin'
import AdminOverview from './pages/AdminOverview'
import AdminUserManagement from './pages/AdminUserManagement'
import AdminUserDetails from './pages/AdminUserDetails'
import AdminAccounts from './pages/AdminAccounts'
import AdminAccountTypes from './pages/AdminAccountTypes'
import AdminTransactions from './pages/AdminTransactions'
import AdminPaymentMethods from './pages/AdminPaymentMethods'
import AdminTradeManagement from './pages/AdminTradeManagement'
import AdminFundManagement from './pages/AdminFundManagement'
import AdminBankSettings from './pages/AdminBankSettings'
import AdminIBManagement from './pages/AdminIBManagement'
import AdminForexCharges from './pages/AdminForexCharges'
import AdminIndianCharges from './pages/AdminIndianCharges'
import AdminCopyTrade from './pages/AdminCopyTrade'
import AdminPropFirm from './pages/AdminPropFirm'
import AdminManagement from './pages/AdminManagement'
import AdminKYC from './pages/AdminKYC'
import AdminSupport from './pages/AdminSupport'
import BuyChallengePage from './pages/BuyChallengePage'
import ChallengeDashboardPage from './pages/ChallengeDashboardPage'
import AdminPropTrading from './pages/AdminPropTrading'
import AdminEarnings from './pages/AdminEarnings'
import ForgotPassword from './pages/ForgotPassword'
import AdminThemeSettings from './pages/AdminThemeSettings'
import BrandedLogin from './pages/BrandedLogin'
import BrandedSignup from './pages/BrandedSignup'
import AdminEmailManagement from './pages/AdminEmailManagement'
import AdminOxapay from './pages/AdminOxapay'
import AdminBannerManagement from './pages/AdminBannerManagement'
import AdminCarouselManagement from './pages/AdminCarouselManagement'
import Trial from './pages/Trial'
import AdminCompetition from './pages/AdminCompitition.jsx'
import AdminCreateCompitition from './pages/AdminCreateCompitition.jsx';
import Competitions from './pages/Competitions.jsx'
import LeaderBoard  from './pages/LeaderBoard.jsx'
import AdminCompetitionDetails from './pages/AdminCompititionDetails.jsx'
import Switch_Account from "./pages/Switch_Account";
import New_Dashboard from './pages/New_Dashboard.jsx'


// 🛡️ Guard to restrict admin access to admin.hcfinvest.com
const AdminHostGuard = ({ children }) => {
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAdminSubdomain = hostname === 'admin.hcfinvest.com' || hostname === 'testing.hcfinvest.com';

  if (!isDevelopment && !isAdminSubdomain) {
    // Redirect non-admin origins to the main trading site if they try to access /admin
    window.location.href = 'https://trade.hcfinvest.com';
    return null;
  }
  return children;
};

// 🕒 Monitor to automatically logout users after 4 hours (JWT expiration)
const SessionMonitor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Manual JWT decode to check expiration claim (exp)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        const now = Math.floor(Date.now() / 1000);
        
        // If token is expired, clear session and redirect
        if (payload.exp && payload.exp < now) {
          console.log('[Security] Session expired (4h limit reached). Logging out...');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/user/login', { 
            state: { message: 'Your session has expired for security. Please login again.' },
            replace: true 
          });
        }
      } catch (e) {
        console.error('Session check error:', e);
      }
    };

    // check on route change
    checkSession();
    
    // check every minute
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [location.pathname, navigate]);

  return null;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionMonitor />
      <Routes>
        <Route path="/" element={<Signup />} />
         <Route path="/switch-account" element={<Switch_Account />} />
        <Route path="/user/signup" element={<Signup />} />
        <Route path="/user/trial" element={<Trial />} />
        <Route path="/user/login" element={<Login />} />
        <Route path="/user/forgot-password" element={<ForgotPassword />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/dashboard" element={<New_Dashboard />} />
        <Route path="/competition" element={<Competitions />} />
        <Route path="/leader-board" element={<LeaderBoard />} />
        <Route path="/mobile" element={<MobileTradingApp />} />
        <Route path="/account" element={<Account />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/orders" element={<OrderBook />} />
        <Route path="/trade/:accountId" element={<TradingPage />} />
        <Route path="/copytrade" element={<CopyTradePage />} />
        <Route path="/ib" element={<IBPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/instructions" element={<InstructionsPage />} />

        {/* 🛡️ All /admin routes are guarded — only accessible from admin.hcfinvest.com */}
        <Route path="/admin" element={<AdminHostGuard><AdminLogin /></AdminHostGuard>} />
        <Route path="/admin/login" element={<AdminHostGuard><AdminLogin /></AdminHostGuard>} />
        <Route path="/admin/dashboard" element={<AdminHostGuard><AdminOverview /></AdminHostGuard>} />
        <Route path="/admin/users" element={<AdminHostGuard><AdminUserManagement /></AdminHostGuard>} />
        <Route path="/admin/users/:userId" element={<AdminHostGuard><AdminUserDetails /></AdminHostGuard>} />
        <Route path="/admin/accounts" element={<AdminHostGuard><AdminAccounts /></AdminHostGuard>} />
        <Route path="/admin/account-types" element={<AdminHostGuard><AdminAccountTypes /></AdminHostGuard>} />
        <Route path="/admin/transactions" element={<AdminHostGuard><AdminTransactions /></AdminHostGuard>} />
        <Route path="/admin/payment-methods" element={<AdminHostGuard><AdminPaymentMethods /></AdminHostGuard>} />
        <Route path="/admin/trades" element={<AdminHostGuard><AdminTradeManagement /></AdminHostGuard>} />
        <Route path="/admin/funds" element={<AdminHostGuard><AdminFundManagement /></AdminHostGuard>} />
        <Route path="/admin/bank-settings" element={<AdminHostGuard><AdminBankSettings /></AdminHostGuard>} />
        <Route path="/admin/ib-management" element={<AdminHostGuard><AdminIBManagement /></AdminHostGuard>} />
        <Route path="/admin/forex-charges" element={<AdminHostGuard><AdminForexCharges /></AdminHostGuard>} />
        <Route path="/admin/indian-charges" element={<AdminHostGuard><AdminIndianCharges /></AdminHostGuard>} />
        <Route path="/admin/copy-trade" element={<AdminHostGuard><AdminCopyTrade /></AdminHostGuard>} />
        <Route path="/admin/prop-firm" element={<AdminHostGuard><AdminPropFirm /></AdminHostGuard>} />
        <Route path="/admin/admin-management" element={<AdminHostGuard><AdminManagement /></AdminHostGuard>} />
        <Route path="/admin/kyc" element={<AdminHostGuard><AdminKYC /></AdminHostGuard>} />
        <Route path="/admin/support" element={<AdminHostGuard><AdminSupport /></AdminHostGuard>} />
        <Route path="/admin/prop-trading" element={<AdminHostGuard><AdminPropTrading /></AdminHostGuard>} />
        <Route path="/admin/earnings" element={<AdminHostGuard><AdminEarnings /></AdminHostGuard>} />
        <Route path="/admin/theme" element={<AdminHostGuard><AdminThemeSettings /></AdminHostGuard>} />
        <Route path="/admin/email" element={<AdminHostGuard><AdminEmailManagement /></AdminHostGuard>} />
        <Route path="/admin/oxapay" element={<AdminHostGuard><AdminOxapay /></AdminHostGuard>} />
        <Route path="/admin/banners" element={<AdminHostGuard><AdminBannerManagement /></AdminHostGuard>} />
        <Route path="/admin/carousel" element={<AdminHostGuard><AdminCarouselManagement /></AdminHostGuard>} />
        <Route path="/admin/competition" element={<AdminHostGuard><AdminCompetition /></AdminHostGuard>} />
        <Route path="/admin/create-competition" element={<AdminHostGuard><AdminCreateCompitition /></AdminHostGuard>} />
        <Route path="/admin/competition-details/:id" element={<AdminHostGuard><AdminCompetitionDetails /></AdminHostGuard>} />
        
        <Route path="/buy-challenge" element={<BuyChallengePage />} />
        <Route path="/challenge-dashboard" element={<ChallengeDashboardPage />} />
        <Route path="/:slug/login" element={<BrandedLogin />} />
        <Route path="/:slug/signup" element={<BrandedSignup />} />
      </Routes>
    </Router>
  )
}

export default App
