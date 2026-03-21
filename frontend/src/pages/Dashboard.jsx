// Dashboard.jsx

import { API_URL } from "../config/api";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Sun,
  Moon,
  UserCircle,
  Settings,
  User,
  ShieldCheck,
  LogOut,
} from "lucide-react";

import { MdLeaderboard } from "react-icons/md";

import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [economicEvents, setEconomicEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalCharges, setTotalCharges] = useState(0);
  const [totalPnl, setTotalPnl] = useState(0);
  const [userAccounts, setUserAccounts] = useState([]);
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false);
  const [marketNews, setMarketNews] = useState([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [banners, setBanners] = useState([]);

  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const tradingViewRef = useRef(null);
  const economicCalendarRef = useRef(null);
  const forexHeatmapRef = useRef(null);
  const forexScreenerRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Handle responsive view switching
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Only redirect on initial load if mobile, not on resize
    };
    window.addEventListener("resize", handleResize);

    // Initial check - redirect to mobile only on first load
    if (window.innerWidth < 768 && !sessionStorage.getItem("viewChecked")) {
      sessionStorage.setItem("viewChecked", "true");
      navigate("/mobile");
    }

    return () => window.removeEventListener("resize", handleResize);
  }, [navigate]);

  // Check auth status on mount
  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token || !user._id) {
      navigate("/user/login");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.forceLogout || res.status === 403) {
        alert(data.message || "Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/user/login");
        return;
      }
    } catch (error) {
      console.error("Auth check error:", error);
    }
  };

  // Fetch wallet balance and user data
  useEffect(() => {
    checkAuthStatus();
    fetchChallengeStatus();
    // fetchBanners();
    if (user._id) {
      fetchWalletBalance();
      fetchUserAccounts();
      fetchTransactions();
    }
  }, [user._id]);

  // Fetch active banners
  // const fetchBanners = async () => {
  //   try {
  //     const res = await fetch(`${API_URL}/banners/active`);
  //     const data = await res.json();
  //     if (data.success) {
  //       setBanners(data.banners || []);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching banners:", error);
  //   }
  // };

  // Fetch trades after accounts are loaded
  useEffect(() => {
    if (userAccounts.length > 0) {
      fetchTrades();
    }
  }, [userAccounts]);

  const fetchChallengeStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/prop/status`);
      const data = await res.json();
      if (data.success) {
        setChallengeModeEnabled(data.enabled);
      }
    } catch (error) {
      console.error("Error fetching challenge status:", error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/${user._id}`);
      const data = await res.json();
      setWalletBalance(data.wallet?.balance || 0);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const res = await fetch(`${API_URL}/wallet/transactions/${user._id}`);
      const data = await res.json();

      if (data.transactions) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
    setLoadingTransactions(false);
  };

  const fetchUserAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
      const data = await res.json();
      setUserAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchTrades = async () => {
    try {
      // Fetch trades for all user accounts (exclude demo accounts)
      let allTrades = [];
      let charges = 0;
      let pnl = 0;

      // Filter out demo accounts - only show live account trades
      const liveAccounts = userAccounts.filter(
        (acc) => !acc.isDemo && !acc.accountTypeId?.isDemo,
      );

      for (const account of liveAccounts) {
        // Fetch closed trades for history
        const historyRes = await fetch(
          `${API_URL}/trade/history/${account._id}`,
        );
        const historyData = await historyRes.json();
        if (historyData.success && historyData.trades) {
          allTrades = [...allTrades, ...historyData.trades];
          // Calculate charges (commission + swap)
          historyData.trades.forEach((trade) => {
            charges += (trade.commission || 0) + (trade.swap || 0);
            pnl += trade.realizedPnl || 0;
          });
        }

        // Fetch open trades
        const openRes = await fetch(`${API_URL}/trade/open/${account._id}`);
        const openData = await openRes.json();
        if (openData.success && openData.trades) {
          allTrades = [...allTrades, ...openData.trades];
        }
      }

      setTotalTrades(allTrades.length);
      setTotalCharges(Math.abs(charges));
      setTotalPnl(pnl);
    } catch (error) {
      console.error("Error fetching trades:", error);
    }
  };

  // Crypto news - using curated sample data
  useEffect(() => {
    setNewsLoading(true);
    // Sample crypto news (replace with real API if you have a valid key)
    setNews([
      {
        title: "Bitcoin Surges Past $100K Milestone",
        description: "BTC reaches new all-time high amid institutional buying",
        updated_at: Date.now(),
        url: "#",
      },
      {
        title: "Ethereum 2.0 Staking Rewards Increase",
        description: "ETH staking yields hit 5.2% APY",
        updated_at: Date.now() - 3600000,
        url: "#",
      },
      {
        title: "SEC Approves New Crypto ETFs",
        description: "Multiple spot crypto ETFs get regulatory approval",
        updated_at: Date.now() - 7200000,
        url: "#",
      },
      {
        title: "DeFi Total Value Locked Hits $200B",
        description: "Decentralized finance continues rapid growth",
        updated_at: Date.now() - 10800000,
        url: "#",
      },
      {
        title: "Major Bank Launches Crypto Custody",
        description: "Traditional finance embraces digital assets",
        updated_at: Date.now() - 14400000,
        url: "#",
      },
      {
        title: "NFT Market Shows Recovery Signs",
        description: "Trading volume up 40% month-over-month",
        updated_at: Date.now() - 18000000,
        url: "#",
      },
    ]);
    setNewsLoading(false);
  }, []);

  // Economic calendar events
  useEffect(() => {
    setEventsLoading(true);
    // Sample economic events (in production, use a real API like Forex Factory or Trading Economics)
    const sampleEvents = [
      {
        date: "2026-01-08",
        time: "08:30",
        country: "US",
        event: "Non-Farm Payrolls",
        impact: "high",
        forecast: "180K",
        previous: "227K",
      },
      {
        date: "2026-01-08",
        time: "10:00",
        country: "US",
        event: "ISM Services PMI",
        impact: "high",
        forecast: "53.5",
        previous: "52.1",
      },
      {
        date: "2026-01-09",
        time: "08:30",
        country: "US",
        event: "Initial Jobless Claims",
        impact: "medium",
        forecast: "210K",
        previous: "211K",
      },
      {
        date: "2026-01-09",
        time: "14:00",
        country: "US",
        event: "FOMC Meeting Minutes",
        impact: "high",
        forecast: "-",
        previous: "-",
      },
      {
        date: "2026-01-10",
        time: "08:30",
        country: "US",
        event: "CPI m/m",
        impact: "high",
        forecast: "0.3%",
        previous: "0.3%",
      },
      {
        date: "2026-01-10",
        time: "08:30",
        country: "US",
        event: "Core CPI m/m",
        impact: "high",
        forecast: "0.2%",
        previous: "0.3%",
      },
      {
        date: "2026-01-13",
        time: "08:30",
        country: "US",
        event: "PPI m/m",
        impact: "medium",
        forecast: "0.2%",
        previous: "0.4%",
      },
      {
        date: "2026-01-14",
        time: "08:30",
        country: "US",
        event: "Retail Sales m/m",
        impact: "high",
        forecast: "0.5%",
        previous: "0.7%",
      },
    ];
    setEconomicEvents(sampleEvents);
    setEventsLoading(false);
  }, []);

  // Market news - using curated sample data
  useEffect(() => {
    // Sample market news with images (replace with real API if you have a valid key)
    setMarketNews([
      {
        title: "EUR/USD Breaks Key Resistance Level",
        description: "Euro surges against dollar amid ECB hawkish stance",
        image_url:
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "Fed Signals Potential Rate Cuts in 2026",
        description: "Federal Reserve hints at monetary policy shift",
        image_url:
          "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "GBP/JPY Volatility Spikes on BOJ News",
        description: "Bank of Japan policy decision creates market turbulence",
        image_url:
          "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "Gold Prices Hit New Record High",
        description: "Safe-haven demand drives precious metals rally",
        image_url:
          "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "Oil Markets React to OPEC+ Decision",
        description: "Crude prices fluctuate on production cut news",
        image_url:
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "USD/CHF Tests Critical Support Zone",
        description: "Swiss franc strengthens on risk-off sentiment",
        image_url:
          "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "AUD/USD Rallies on China Data",
        description: "Australian dollar gains on positive trade figures",
        image_url:
          "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
      {
        title: "Crypto Markets Show Correlation with Forex",
        description: "Bitcoin movements mirror dollar index trends",
        image_url:
          "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400",
        pubDate: new Date().toISOString(),
        link: "#",
      },
    ]);
  }, []);

  // Auto-slide news
  useEffect(() => {
    if (marketNews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % marketNews.length);
    }, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [marketNews.length]);

  const nextNews = () => {
    setCurrentNewsIndex((prev) => (prev + 1) % marketNews.length);
  };

  const prevNews = () => {
    setCurrentNewsIndex(
      (prev) => (prev - 1 + marketNews.length) % marketNews.length,
    );
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Load TradingView widgets with proper initialization
  useEffect(() => {
    // Helper function to safely load TradingView widget
    const loadWidget = (containerRef, scriptSrc, config) => {
      if (!containerRef.current) return;

      // Clear previous content
      containerRef.current.innerHTML = "";

      // Create the inner widget container that TradingView expects
      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      widgetContainer.style.height = "100%";
      widgetContainer.style.width = "100%";
      containerRef.current.appendChild(widgetContainer);

      // Create and append the script
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.type = "text/javascript";
      script.innerHTML = JSON.stringify(config);
      containerRef.current.appendChild(script);
    };

    // Small delay to ensure DOM is ready
    const colorTheme = isDarkMode ? "dark" : "light";

    const timer = setTimeout(() => {
      // TradingView Timeline Widget (News)
      loadWidget(
        tradingViewRef,
        "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js",
        {
          feedMode: "all_symbols",
          colorTheme: colorTheme,
          isTransparent: true,
          displayMode: "regular",
          width: "100%",
          height: "100%",
          locale: "en",
        },
      );

      // TradingView Economic Calendar Widget
      loadWidget(
        economicCalendarRef,
        "https://s3.tradingview.com/external-embedding/embed-widget-events.js",
        {
          colorTheme: colorTheme,
          isTransparent: true,
          width: "100%",
          height: "100%",
          locale: "en",
          importanceFilter: "0,1",
          countryFilter: "us,eu,gb,jp,cn",
        },
      );

      // TradingView Forex Heatmap Widget
      loadWidget(
        forexHeatmapRef,
        "https://s3.tradingview.com/external-embedding/embed-widget-forex-heat-map.js",
        {
          width: "100%",
          height: "100%",
          currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "NZD"],
          isTransparent: true,
          colorTheme: colorTheme,
          locale: "en",
        },
      );

      // TradingView Forex Screener Widget
      loadWidget(
        forexScreenerRef,
        "https://s3.tradingview.com/external-embedding/embed-widget-screener.js",
        {
          width: "100%",
          height: "100%",
          defaultColumn: "overview",
          defaultScreen: "general",
          market: "forex",
          showToolbar: true,
          colorTheme: colorTheme,
          locale: "en",
          isTransparent: true,
        },
      );
    }, 100);

    return () => clearTimeout(timer);
  }, [isDarkMode]);

  const liveAccounts = userAccounts.filter(
    (acc) => !acc.isDemo && !acc.accountTypeId?.isDemo,
  );

  const demoAccounts = userAccounts.filter(
    (acc) => acc.isDemo || acc.accountTypeId?.isDemo,
  );

  const handleLogout = () => {
    console.log("onCLick on Logout button");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6fb] text-gray-800">
      {/* SIDEBAR */}
      {/* <div className="hidden md:block"> */}
        <Sidebar activeMenu="Dashboard" />
      {/* </div> */}

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* TOP NAVBAR */}
        <div className="h-14 bg-[#2f3f74] flex items-center justify-between px-3 sm:px-6 text-white">
          <div className="font-semibold text-sm sm:text-base">
            User Dashboard
          </div>

          <div className="flex items-center gap-4 sm:gap-5">
            <RefreshCw size={18} className="cursor-pointer" />

            <div className="relative">
              <Settings
                size={20}
                className="cursor-pointer hover:text-blue-300 transition"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              />

              {showSettingsMenu && (
                <div className="absolute right-0 mt-3 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {/* Profile */}
                  <button
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    <User size={16} />
                    Profile
                  </button>

                  {/* KYC */}
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                    <ShieldCheck size={16} />
                    KYC
                  </button>

                  {/* Theme */}
                  <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    Theme
                  </button>

                  {/* Divider */}
                  <div className="border-t border-gray-200"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {/* BALANCE CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Total Balance</p>
              <p className="text-xl sm:text-2xl font-semibold mt-2">$0</p>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Current Equity</p>
              <p className="text-xl sm:text-2xl font-semibold mt-2">$0</p>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Wallet Balance</p>
              <p className="text-xl sm:text-2xl font-semibold mt-2">
                ${walletBalance}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col items-center justify-center hover:shadow transition cursor-pointer"
            onClick={() => navigate("/wallet?action=deposit")}
            >
              <TrendingUp size={22} />
              <span className="mt-2 sm:mt-3 font-medium text-sm sm:text-base">
                Deposit
              </span>
            </div>

            <div className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col items-center justify-center hover:shadow transition cursor-pointer"
            onClick={() => navigate("/wallet?action=withdraw")}
            >
              <DollarSign size={22} />
              <span className="mt-2 sm:mt-3 font-medium text-sm sm:text-base">
                Withdraw
              </span>
            </div>

            <div className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col items-center justify-center hover:shadow transition cursor-pointer">
              <RefreshCw size={22} />
              <span className="mt-2 sm:mt-3 font-medium text-sm sm:text-base">
                Transfer
              </span>
            </div>

            <div className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col items-center justify-center hover:shadow transition cursor-pointer" onClick={() => navigate("/account") }>
              <User size={22} />
              <span className="mt-2 sm:mt-3 font-medium text-sm sm:text-base">
                Accounts
              </span>
            </div>
          </div>

          {/* ACCOUNTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LIVE ACCOUNTS */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                  Live Accounts
                </h2>

                <button
                  onClick={() => navigate("/account")}
                  className="text-xs sm:text-sm text-blue-600 hover:underline"
                >
                  See All →
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Live Accounts</p>

                  <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1">
                    {liveAccounts.length}
                  </p>
                </div>

                <button
                  onClick={() => navigate("/switch-account?create=true")}
                  className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm"
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* DEMO ACCOUNTS */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4" onClick={() => navigate("/account")} >
                <h2 className="font-semibold text-base sm:text-lg text-gray-800">
                  Demo Accounts
                </h2>

                <button
                  onClick={() => navigate("/account")}
                  className="text-xs sm:text-sm text-blue-600 hover:underline"
                >
                  See All →
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Demo Accounts</p>

                  <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1">
                    {demoAccounts.length}
                  </p>
                </div>

                <button
                  onClick={() => navigate("/switch-account?create=true&demo=true")}
                  className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm"
                >
                  Create Demo
                </button>
              </div>
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="bg-white rounded-xl border p-4 sm:p-5 overflow-x-auto">
            <h2 className="font-semibold mb-4 text-sm sm:text-base">
              Transaction History
            </h2>

            <table className="w-full text-xs sm:text-sm min-w-[600px]">
              <thead className="text-gray-500 border-b">
                <tr>
                  <th className="text-left py-2">Description</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Fee</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {loadingTransactions ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((tx) => (
                    <tr key={tx._id} className="border-b">
                      <td className="py-3">
                        {tx.type === "Deposit"
                          ? "Deposit"
                          : tx.type === "Withdrawal"
                            ? "Withdrawal"
                            : tx.type}
                      </td>

                      <td>{tx.tradingAccountName || "-"}</td>

                      <td
                        className={
                          tx.type === "Deposit"
                            ? "text-green-500"
                            : "text-red-500"
                        }
                      >
                        {tx.type === "Deposit" ? "+" : "-"}${tx.amount} USD
                      </td>

                      <td>{tx.fee || 0}</td>

                      <td>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            tx.status === "Completed" ||
                            tx.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : tx.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
