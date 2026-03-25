import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
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


function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminOverview />} />
        <Route path="/admin/users" element={<AdminUserManagement />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
        <Route path="/admin/accounts" element={<AdminAccounts />} />
        <Route path="/admin/account-types" element={<AdminAccountTypes />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/payment-methods" element={<AdminPaymentMethods />} />
        <Route path="/admin/trades" element={<AdminTradeManagement />} />
        <Route path="/admin/funds" element={<AdminFundManagement />} />
        <Route path="/admin/bank-settings" element={<AdminBankSettings />} />
        <Route path="/admin/ib-management" element={<AdminIBManagement />} />
        <Route path="/admin/forex-charges" element={<AdminForexCharges />} />
        <Route path="/admin/indian-charges" element={<AdminIndianCharges />} />
        <Route path="/admin/copy-trade" element={<AdminCopyTrade />} />
        <Route path="/admin/prop-firm" element={<AdminPropFirm />} />
        <Route path="/admin/admin-management" element={<AdminManagement />} />
        <Route path="/admin/kyc" element={<AdminKYC />} />
        <Route path="/admin/support" element={<AdminSupport />} />
        <Route path="/admin/prop-trading" element={<AdminPropTrading />} />
        <Route path="/admin/earnings" element={<AdminEarnings />} />
        <Route path="/admin/theme" element={<AdminThemeSettings />} />
        <Route path="/admin/email" element={<AdminEmailManagement />} />
        <Route path="/admin/oxapay" element={<AdminOxapay />} />
        <Route path="/admin/banners" element={<AdminBannerManagement />} />
        <Route path="/admin/carousel" element={<AdminCarouselManagement />} />
        <Route path="/admin/competition" element={<AdminCompetition />} />
        <Route path="/admin/create-competition" element={<AdminCreateCompitition />} />
        <Route path="/admin/competition-details/:id" element={<AdminCompetitionDetails />} />
        <Route path="/buy-challenge" element={<BuyChallengePage />} />
        <Route path="/challenge-dashboard" element={<ChallengeDashboardPage />} />
        <Route path="/:slug/login" element={<BrandedLogin />} />
        <Route path="/:slug/signup" element={<BrandedSignup />} />
      </Routes>
    </Router>
  )
}

export default App
