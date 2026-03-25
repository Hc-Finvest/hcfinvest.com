
// New_Dashboard.jsx

import {
  ArrowRight,
  Gift,
  Wallet,
  BarChart2,
  Shield,
  Gauge,
  ArrowLeft,
  CircleDollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/api";
import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { Internal_Transfer } from "./Internal_Transfer";

const New_Dashboard = () => {
  const banners = [
    {
      title: "Deposit Now & Get",
      highlight: "20% Bonus",
      desc: "Trade with extra capital. Activate your bonus.",
      bg: "from-[#0f2027] via-[#203a43] to-[#2c5364]",
    },
    {
      title: "Invite Friends & Earn",
      highlight: "$50 Reward",
      desc: "Refer your friends and earn rewards instantly.",
      bg: "from-purple-600 via-indigo-600 to-blue-600",
    },
    {
      title: "Trade Gold & Forex",
      highlight: "Low Spread",
      desc: "Start trading with lowest spread in market.",
      bg: "from-green-600 via-emerald-600 to-teal-600",
    },
  ];

  const [current, setCurrent] = useState(0);

  const [showTransferModal, setShowTransferModal] = useState(false);

  const [userAccounts, setUserAccounts] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [openTrades, setOpenTrades] = useState([]);
const [livePrices, setLivePrices] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const navigate = useNavigate();

  const liveAccounts = userAccounts.filter(
    (acc) => !acc.isDemo && !acc.accountTypeId?.isDemo,
  );

  const demoAccounts = userAccounts.filter(
    (acc) => acc.isDemo || acc.accountTypeId?.isDemo,
  );

  const fetchWalletBalance = async () => {
  try {
    const res = await fetch(`${API_URL}/wallet/${user._id}`);
    const data = await res.json();
    setWalletBalance(data.wallet?.balance || 0);
  } catch (error) {
    console.error("Error fetching wallet:", error);
  }
};

useEffect(() => {
  if (user._id) {
    fetchWalletBalance();
    
    const fetchUserAccounts = async () => {
      try {
        const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
        const data = await res.json();
        setUserAccounts(data.accounts || []);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    fetchUserAccounts();
  }
}, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const fetchUserAccounts = async () => {
      try {
        const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
        const data = await res.json();
        setUserAccounts(data.accounts || []);
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };

    if (user._id) fetchUserAccounts();
  }, []);
  // 👉 Auto Slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 👉 Manual Controls
  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };





  const fetchOpenTrades = async () => {
  try {
    let allTrades = [];

    for (const acc of userAccounts) {
      const res = await fetch(`${API_URL}/trade/open/${acc._id}`);
      const data = await res.json();

      if (data.success && data.trades) {
        allTrades = [
          ...allTrades,
          ...data.trades.map(t => ({
            ...t,
            accountName: acc.accountId
          }))
        ];
      }
    }

    setOpenTrades(allTrades);
  } catch (error) {
    console.error("Error fetching open trades:", error);
  }
};



useEffect(() => {
  if (userAccounts.length > 0) {
    fetchOpenTrades();
  }
}, [userAccounts]);




useEffect(() => {
  const fetchPrices = async () => {
    const symbols = [...new Set(openTrades.map(t => t.symbol))];
    if (symbols.length === 0) return;

    try {
      const res = await fetch(`${API_URL}/prices/batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ symbols })
      });

      const data = await res.json();
      if (data.success) {
        setLivePrices(data.prices);
      }
    } catch (err) {
      console.error("Price fetch error:", err);
    }
  };

  fetchPrices();
  const interval = setInterval(fetchPrices, 3000);

  return () => clearInterval(interval);
}, [openTrades]);




const calculatePnl = (trade) => {
  const prices = livePrices[trade.symbol];
  if (!prices) return 0;

  const currentPrice =
    trade.side === "BUY" ? prices.bid : prices.ask;

  if (!currentPrice) return 0;

  const contractSize = trade.contractSize || getContractSize(trade.symbol);

  const pnl =
    trade.side === "BUY"
      ? (currentPrice - trade.openPrice) *
        trade.quantity *
        contractSize
      : (trade.openPrice - currentPrice) *
        trade.quantity *
        contractSize;

  return pnl - (trade.commission || 0) - (trade.swap || 0);
};



const totalPnl = openTrades.reduce(
  (sum, trade) => sum + calculatePnl(trade),
  0
);


  return (
    <div className="flex h-screen  bg-[#fafafa]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Dashboard
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
              Pro Trader
            </span>
          </h1>
          <p className="text-gray-500">
            Welcome back, {/* John. */} Here's your trading overview for today.
          </p>
        </div>

        {/* Banner */}
        {/* Banner Wrapper */}
        <div className="relative overflow-hidden rounded-2xl mb-6">
          {/* Slides */}
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {banners.map((banner, index) => (
              <div
                key={index}
                className={`min-w-full h-80 p-6 text-white bg-gradient-to-r ${banner.bg} relative`}
              >
                <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
                  Limited Time
                </span>

                <h2 className="text-3xl font-bold mt-2">
                  {banner.title}
                  <span className="text-green-400"> {banner.highlight}</span>
                </h2>

                <p className="text-gray-300 mt-2">{banner.desc}</p>

                <button className="mt-4 bg-green-500 px-4 py-2 rounded-lg">
                  Action
                </button>

                <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 p-4 rounded-full">
                  <Gift />
                </div>
              </div>
            ))}
          </div>

          {/* LEFT BUTTON */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-10"
          >
            <ArrowLeft size={18} />
          </button>

          {/* RIGHT BUTTON */}
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full z-10"
          >
            <ArrowRight size={18} />
          </button>

          {/* DOTS */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  current === i ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${
                current === i ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <div className="bg-green-100 p-2 rounded-lg w-fit">
                <CircleDollarSign className="text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm">Total Balance</h3>
            <p className="text-xl font-bold">$000</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <div className="bg-blue-100 p-2 rounded-lg w-fit">
                <BarChart2 className="text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm">Current Equity</h3>
            <p className="text-xl font-bold">$000</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <div className="bg-orange-100 p-2 rounded-lg w-fit">
                <Wallet className="text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm">Wallet Balance</h3>
            <p className="text-xl font-bold">${walletBalance}</p>
          </div>
        </div>

        {/* ===== LOWER DASHBOARD SECTION ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* QUICK ACTIONS */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-gray-700 font-semibold mb-4">
                Quick Actions
              </h3>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
                {/* Deposit */}
                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition" onClick={() => navigate("/wallet?action=deposit")}>
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-green-100 text-green-600">
                    ↓
                  </div>
                  <p className="text-sm font-medium">Deposit</p>
                  <p className="text-xs text-gray-500">Add funds instantly</p>
                </div>

                {/* Withdraw */}
                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition"  onClick={() => navigate("/wallet?action=withdraw")} >
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-blue-100 text-blue-600">
                    ↑
                  </div>
                  <p className="text-sm font-medium">Withdraw</p>
                  <p className="text-xs text-gray-500">Cash out your profits</p>
                </div>

                {/* Transfer */}
                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition" onClick={() => setShowTransferModal(true)}>
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-orange-100 text-orange-600">
                    ⇄
                  </div>
                  <p className="text-sm font-medium">Transfer</p>
                  <p className="text-xs text-gray-500">Between accounts</p>
                </div>

                <Internal_Transfer
                  show={showTransferModal}
                  onClose={() => setShowTransferModal(false)}
                />

                {/* Account */}
                <div className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 text-center cursor-pointer transition" onClick={() => navigate("/account") }>
                  <div className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg mb-2 bg-purple-100 text-purple-600">
                    👤
                  </div>
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-gray-500">Manage your accounts</p>
                </div>
              </div>
            </div>

            {/* Account section */}
            {/* ACCOUNTS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LIVE ACCOUNTS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Live Accounts</h3>

                  <button
                    onClick={() => navigate("/account")}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    See All →
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">Total Live Accounts</p>
                    <p className="text-3xl font-bold mt-1">
                      {liveAccounts.length}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/switch-account?create=true")}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Create Account
                  </button>
                </div>
              </div>

              {/* DEMO ACCOUNTS */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">Demo Accounts</h3>

                  <button
                    onClick={() => navigate("/account")}
                    className="text-blue-500 text-sm hover:underline"
                  >
                    See All →
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-sm">Total Demo Accounts</p>
                    <p className="text-3xl font-bold mt-1">
                      {demoAccounts.length}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      navigate("/switch-account?create=true&demo=true")
                    }
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Create Demo
                  </button>
                </div>
              </div>
            </div>

            {/* BALANCE + ACTIVE POSITIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BALANCE DISTRIBUTION */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between mb-4">
                  <h3 className="font-semibold">Balance Distribution</h3>
                  <span className="text-green-500 text-sm">+12.5%</span>
                </div>

                {/* Fake Chart */}
                <div className="flex justify-center items-center h-40">
                  <div className="w-32 h-32 rounded-full border-[20px] border-blue-400 border-t-green-400 border-r-purple-400 border-b-orange-400 flex items-center justify-center">
                    <span className="font-bold">$124,580</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                  <div>🟢 EUR/USD 28%</div>
                  <div>🔵 GBP/USD 22%</div>
                  <div>🟠 USD/JPY 18%</div>
                  <div>🟣 Available 32%</div>
                </div>
              </div>

              {/* ACTIVE POSITIONS */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
  <div className="flex justify-between mb-4">
    <h3 className="font-semibold">Active Positions</h3>
    <span
      onClick={() => navigate("/order-book")}
      className="text-blue-500 text-sm cursor-pointer"
    >
      View All →
    </span>
  </div>

  <p className="text-gray-400 text-sm mb-2">
    {openTrades.length} open trades
  </p>

  {/* Total P/L */}
  <div className="bg-gray-100 rounded-lg p-3 mb-3 flex justify-between">
    <span>Total P/L</span>
    <span
      className={`font-semibold ${
        totalPnl >= 0 ? "text-green-600" : "text-red-500"
      }`}
    >
      {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
    </span>
  </div>

  {/* Trades List */}
  {openTrades.length === 0 ? (
    <p className="text-gray-400 text-sm text-center">
      No active trades
    </p>
  ) : (
    openTrades.slice(0, 4).map((trade) => {
      const pnl = calculatePnl(trade);

      return (
        <div
          key={trade._id}
          className="flex justify-between items-center border rounded-lg px-3 py-2 mb-2"
        >
          <span className="font-medium">{trade.symbol}</span>
          <span
            className={
              pnl >= 0 ? "text-green-600" : "text-red-500"
            }
          >
            {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
          </span>
        </div>
      );
    })
  )}
</div>
            </div>
          </div>

          {/* RIGHT SIDE - APP CARD */}
          <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs bg-green-500 px-2 py-1 rounded-full">
                NEW APP
              </span>

              <h3 className="text-lg font-bold mt-3">Trade on the Go</h3>

              <p className="text-sm text-gray-300 mt-2">
                Full trading power in your pocket. Scan the QR code to download.
              </p>
            </div>

            {/* QR */}
            {/* QR */}
            <div className="flex justify-center items-center flex-1 mt-5">
              <div className="w-[90%] max-w-[300px] aspect-square bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
                QR
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-4 space-y-2">
              <button className="w-full bg-white/10 py-2 rounded-lg text-sm">
                App Store
              </button>
              <button className="w-full bg-white/10 py-2 rounded-lg text-sm">
                Google Play
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New_Dashboard;
