// import logo from "./logo.svg";
import "./App.css";
import Navbar from "./Components/Navbar";
import MainContent from "./Components/MainContent";
import { Route, Routes } from "react-router-dom";
import About from "./Components/About";
import Advantages from "./Components/Advantages";
import RegulationAndLicence from "./Components/RegulationAndLicence";
import SecurityOfFunds from "./Components/SecurityOfFunds";
import Blogs from "./Components/Blogs";
import ContactUs from "./Components/ContactUs";
import MetaTrader5Pc from "./Components/MetaTrader5Pc";
// import AddBlogs from "./Components/Admin/BlogManagement";
import AccountsTypes from "./Components/AccountsTypes";
import Starter from "./Components/Starter";
import ProTrader from "./Components/ProTrader";
import ZeroSpread from "./Components/ZeroSpread";
import Elite from "./Components/Elite";
import Forex from "./Components/Forex";
import Promotion from "./Components/Promotion";
import IntroducingBroker from "./Components/IntroducingBroker";
import WelcomeAccount from "./Components/WelcomeAccount";
import EconomicCalander from "./Components/EconomicCalander";
import MetaTrader5forAndroid from "./Components/MetaTrader5forAndroid";
import DepositAndWithdrawal from "./Components/DepositAndWithdrawal";
import Metals from "./Components/Metals";
import Indices from "./Components/Indices";
import Stocks from "./Components/Stocks";
import Footer from "./Components/Footer";
import Commodities from "./Components/Commodities";
import Cryptocurrency from "./Components/Cryptocurrency";
import HelpCenter from "./Components/HelpCenter";
import AccountCMfaq from "./Components/AccountCMfaq";
import DepositWithdrawalfaq from "./Components/DepositWithdrawalfaq";
import TradingAccountfaq from "./Components/TradingAccountfaq";
import TradingConditionfaq from "./Components/TradingConditionfaq";
import Promotionfaq from "./Components/Promotionfaq";
import CopyTradingfaq from "./Components/CopyTradingfaq";
import IntroducingBrokerfaq from "./Components/IntroducingBrokerfaq";
import Swap from "./Components/Swap";
import MarginLeverage from "./Components/MarginLeverage";
import BlogDetails from "./Components/BlogDetails";
// import Admin from "./Components/Admin/AdminPanel";
// import DynamicArticleFormMUI from "./Components/Admin/DynamicForm";
import EnquiryData from "./Components/Admin/EnquiryData";
import TermsConditions from "./Components/TermsConditions";
import PrivacyPolicies from "./Components/PrivacyPolicies";
import AMLPolicy from "./Components/AMLPolicies";
import ContactUsData from "./Components/Admin/ContactUsData";
import SwapManagement from "./Components/Admin/SwapManagement";
import SpreadManagement from "./Components/Admin/SpreadManagement";
import AdminPanel from "./Components/Admin/AdminPanel";
import BlogManagement from "./Components/Admin/BlogManagement";
import ForexBrokerArticle from "./Components/ForexBrokerArticle";
import AddSpread from "./Components/Admin/AddSpread";
import AddSwap from "./Components/Admin/AddSwap";
import AdminLogin from "./Components/Admin/AdminLogin";
import ProtectedAdminRoute from "./Components/Admin/ProtectedAdminRoute";
import BonusPage from "./Components/Bonus";
import Snowfall from "react-snowfall";

function App() {

  return (
    <div className="App">      
        {/* Snow Fall Start */}
      <Snowfall 
        snowflakeCount={100} 
        style={{ position: "fixed", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 9999 }}
      />
      {/* Snow Fall End */}

      <Navbar />
      <Routes>
        {/* <Navbar /> */}
        <Route path="/" element={<MainContent />}></Route>
        <Route path="about" element={<About />}></Route>
        <Route path="advantages" element={<Advantages />}></Route>
        <Route
          path="regulationAndLicence"
          element={<RegulationAndLicence />}
        ></Route>
        <Route path="securityOfFunds" element={<SecurityOfFunds />}></Route>
        <Route path="blogs" element={<Blogs />}></Route>
        <Route path="/blogs/:id" element={<BlogDetails />} />
        <Route path="contactUs" element={<ContactUs />}></Route>
        <Route path="metaTrade5forPc" element={<MetaTrader5Pc />}></Route>
        <Route
          path="metaTrade5Android"
          element={<MetaTrader5forAndroid />}
        ></Route>
        <Route path="accountsTypesAccount" element={<AccountsTypes />}></Route>
        <Route path="starterAccount" element={<Starter />}></Route>
        <Route path="proTraderAccount" element={<ProTrader />}></Route>
        <Route path="zeroSpreadAccount" element={<ZeroSpread />}></Route>
        <Route path="eliteAccount" element={<Elite />}></Route>
        <Route path="forexMarket" element={<Forex />}></Route>
        {/* <Route path="login" element={<Login />}></Route> */}
        {/* <Route path="register" element={<Register />}></Route> */}
        <Route path="promotions" element={<Promotion />}></Route>
        <Route path="introducingBroker" element={<IntroducingBroker />}></Route>
        <Route path="welcomeAccount" element={<WelcomeAccount />}></Route>
        <Route path="economicCalander" element={<EconomicCalander />}></Route>
        {/* <Route path="news" element={<News />}></Route> */}
        <Route
          path="depositWithdrawal"
          element={<DepositAndWithdrawal />}
        ></Route>
        <Route path="metalsMarket" element={<Metals />}></Route>
        <Route path="indicesMarket" element={<Indices />}></Route>
        <Route path="stocksMarket" element={<Stocks />}></Route>
        <Route path="commoditiesMarket" element={<Commodities />}></Route>
        <Route path="cryptocurrencyMarket" element={<Cryptocurrency />}></Route>
        <Route path="swapMarket" element={<Swap />}></Route>
        <Route path="helpCenter" element={<HelpCenter />}></Route>
        <Route path="accountcmfaq" element={<AccountCMfaq />}></Route>
        <Route
          path="depositWithdrawalfaq"
          element={<DepositWithdrawalfaq />}
        ></Route>
        <Route path="tradingAccountfaq" element={<TradingAccountfaq />}></Route>
        <Route
          path="tradingConditionfaq"
          element={<TradingConditionfaq />}
        ></Route>
        <Route path="promotionfaq" element={<Promotionfaq />}></Route>
        <Route path="copyTradingfaq" element={<CopyTradingfaq />}></Route>
        <Route
          path="introducingBrokerfaq"
          element={<IntroducingBrokerfaq />}
        ></Route>
        <Route path="marginLeverage" element={<MarginLeverage />}></Route>
        <Route path="termsConditions" element={<TermsConditions />}></Route>
        <Route path="privacyPolicies" element={<PrivacyPolicies />}></Route>
        <Route path="amlPolicies" element={<AMLPolicy />}></Route>
        <Route
          path="forexBrokerArticle"
          element={<ForexBrokerArticle />}
        ></Route>

        <Route
          path="bonus"
          element={<BonusPage />}
        ></Route>
        {/* Blelow are the optional pages  */}
        <Route path="adminAddSwap" element={<AddSwap />} />
        <Route path="adminAddSpread" element={<AddSpread />} />

        <Route path="/admin" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        >
          <Route path="adminBlogManagement" element={<BlogManagement />} />
          <Route path="adminEnquiryData" element={<EnquiryData />} />
          <Route path="adminContactUsData" element={<ContactUsData />} />
          <Route path="adminSwapManagement" element={<SwapManagement />} />
          <Route path="adminSpreadManagement" element={<SpreadManagement />} />
        </Route>
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
