// ib.jsx

import { API_URL } from "../config/api";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Copy,
  TrendingUp,
  DollarSign,
  UserPlus,
  ChevronRight,
  Award,
  Trophy,
  ArrowLeft,
  Home,
  Crown,
  Share2,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import NavbarClient from "../components/NavbarClient";
import { useSidebar } from "../context/SidebarContext.jsx";

const IBPage = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const [ibProfile, setIbProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [downline, setDownline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [levelProgress, setLevelProgress] = useState(null);
  const { sidebarExpanded } = useSidebar();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchChallengeStatus();
    fetchIBProfile();

    // Auto-refresh every 15 seconds
    const refreshInterval = setInterval(() => {
      fetchIBProfile();
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchChallengeStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/prop/status`);
      const data = await res.json();
      if (data.success) setChallengeModeEnabled(data.enabled);
    } catch (error) {
      console.error("Error fetching challenge status:", error);
    }
  };

  const fetchIBProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/my-profile/${user._id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.ibUser) {
        // Merge ibUser, wallet, and stats into one profile object
        console.log(data.data);
        setIbProfile({
          ...data.ibUser,
          ibWalletBalance: data.wallet?.balance || 0,
          totalCommissionEarned: data.wallet?.totalEarned || 0,
          pendingWithdrawal: data.wallet?.pendingWithdrawal || 0,
          totalWithdrawn: data.wallet?.totalWithdrawn || 0,
          stats: data.stats || {},
          commissionProfile: data.commissionProfile || null,
        });
        // Set level progress data
        if (data.levelProgress) {
          setLevelProgress(data.levelProgress);
        }
        // Check both status and ibStatus for compatibility
        if (
          data.ibUser.status === "ACTIVE" ||
          data.ibUser.ibStatus === "ACTIVE"
        ) {
          fetchReferrals();
          fetchCommissions();
          fetchDownline();
        }
      }
    } catch (error) {
      console.error("Error fetching IB profile:", error);
    }
    setLoading(false);
  };

  const fetchReferrals = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/my-referrals/${user._id}`, { headers: authHeaders() });
      const data = await res.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error("Error fetching referrals:", error);
    }
  };

  const fetchCommissions = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/my-commissions/${user._id}`, { headers: authHeaders() });
      const data = await res.json();
      setCommissions(data.commissions || []);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    }
  };

  const fetchDownline = async () => {
    try {
      const res = await fetch(`${API_URL}/ib/my-downline/${user._id}`, { headers: authHeaders() });
      const data = await res.json();
      // The API returns tree with downlines array
      setDownline(data.tree?.downlines || []);
    } catch (error) {
      console.error("Error fetching downline:", error);
    }
  };

  const handleTransferToWallet = async () => {
  if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
    alert("Please enter a valid amount");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/wallet-transfer/from-ib`, {
      method: "POST",
      headers: {
        ...authHeaders(),
      },
      body: JSON.stringify({
        userId: user._id,
        amount: parseFloat(withdrawAmount),
      }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Amount transferred to wallet successfully");

      setWithdrawAmount("");

      // 🔥 Refresh IB + Wallet
      fetchIBProfile();
    } else {
      alert(data.message || "Transfer failed");
    }
  } catch (error) {
    console.error("Transfer error:", error);
    alert("Transfer failed");
  }
};


  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/ib/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        headers: authHeaders(),
        body: JSON.stringify({ userId: user._id }),
      });
      const data = await res.json();
      if (data.success || data.ibUser || data.user) {
        // Set the profile with PENDING status immediately
        const userData = data.ibUser || data.user || {};
        setIbProfile({
          ...userData,
          status: userData.ibStatus || "PENDING",
          ibStatus: userData.ibStatus || "PENDING",
        });
        alert("IB application submitted successfully!");
        // Refresh profile to get latest data
        setTimeout(() => fetchIBProfile(), 500);
      } else {
        alert(data.message || "Failed to apply");
      }
    } catch (error) {
      console.error("Error applying:", error);
      alert("Failed to submit application");
    }
    setApplying(false);
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/ib/withdraw`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          userId: user._id,
          amount: parseFloat(withdrawAmount),
        }),
      });
      const data = await res.json();
      if (data.status) {
        alert(data.message);
        setWithdrawAmount("");
        fetchIBProfile();
      } else {
        alert(data.message || "Failed to withdraw");
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      alert("Failed to process withdrawal");
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/user/signup?ref=${ibProfile?.referralCode}`;
    navigator.clipboard.writeText(link);
    alert("Referral link copied!");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
  };

  const renderDownlineTree = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return null;
    return nodes.map((node, idx) => (
      <div
        key={node._id || idx}
        className="ml-4 border-l border-gray-700 pl-4 py-2"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${node.isIB ? "bg-accent-green/20" : "bg-gray-700"}`}
          >
            <span className={node.isIB ? "text-accent-green" : "text-gray-400"}>
              {node.firstName?.charAt(0) || "?"}
            </span>
          </div>
          <div>
            <p className="text-white text-sm">{node.firstName || "Unknown"}</p>
            <p className="text-gray-500 text-xs">{node.email}</p>
          </div>
          <div className="ml-auto text-right">
            <span
              className={`px-2 py-1 rounded text-xs ${node.isIB ? "bg-accent-green/20 text-accent-green" : "bg-gray-700 text-gray-400"}`}
            >
              {node.isIB ? "IB" : "User"} • Level {(node.level || 0) + 1}
            </span>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6fb] text-gray-800">
      {/* Sidebar */}
      {!isMobile && <Sidebar activeMenu="IB" />}

      {/* Main */}
      <div
  className={`flex-1 p-6 flex flex-col transition-all duration-300 ${
    isMobile
      ? ""
      : sidebarExpanded
      ? "ml-[280px]"
      : "ml-[64px]"
  }`}
>
        {/* Header */}
        {/* <div className="h-14 bg-[#2f3f74] flex items-center justify-between px-6 text-white">
          <h1 className="text-lg font-semibold">Introducing Broker (IB)</h1>
        </div> */}

        <NavbarClient title="Introducing Broker (IB) Dashboard"  subtitle="Manage your referrals and earnings"/>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : !ibProfile ? (
            /* Apply IB */
            <div className="max-w-lg mx-auto text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={40} className="text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Become an Introducing Broker
              </h2>

              <p className="text-gray-600 mb-6">
                Earn commissions by referring traders and build your referral
                network.
              </p>

              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 text-left shadow-sm">
                <h3 className="font-semibold mb-3">Benefits</h3>

                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex gap-2">
                    <ChevronRight size={14} className="text-green-500" />
                    Earn commission on every trade
                  </li>

                  <li className="flex gap-2">
                    <ChevronRight size={14} className="text-green-500" />
                    Multi-level commissions
                  </li>

                  <li className="flex gap-2">
                    <ChevronRight size={14} className="text-green-500" />
                    Real-time commission tracking
                  </li>

                  <li className="flex gap-2">
                    <ChevronRight size={14} className="text-green-500" />
                    Easy withdrawal
                  </li>
                </ul>
              </div>

              <button
                onClick={handleApply}
                disabled={applying}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                {applying ? "Applying..." : "Apply Now"}
              </button>
            </div>
          ) : (
            /* IB Dashboard */
            <div>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${ibProfile.ibWalletBalance?.toFixed(2) || "0.00"}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${ibProfile.totalCommissionEarned?.toFixed(2) || "0.00"}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <p className="text-sm text-gray-500">Direct Referrals</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {ibProfile.stats?.directReferrals || 0}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                  <p className="text-sm text-gray-500">Total Downline</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {ibProfile.stats?.totalDownline || 0}
                  </p>
                </div>
              </div>

              <div className="">
                {/* Commission Rate + Referral Link */}
                {levelProgress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Commission Rate */}
                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                      <p className="text-sm text-gray-500 mb-2">
                        Your Commission Rate
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-900">
                            ${(
                              ibProfile?.commissionProfile?.effectiveRate ??
                              levelProgress?.commissionProfile?.effectiveRate ??
                              levelProgress?.currentLevel?.commissionRate
                            ) || 0}
                            <span className="text-sm text-gray-500"> /lot</span>
                          </p>

                          <p className="text-sm text-gray-600 mt-1">
                            Level:{" "}
                            <span className="font-semibold text-gray-900">
                              {levelProgress?.currentLevel?.name || "Standard"}
                            </span>
                          </p>
                          {ibProfile?.commissionProfile?.manualOverrideEnabled && (
                            <p className="text-xs text-blue-600 mt-1 font-semibold">
                              Manual override active
                            </p>
                          )}
                        </div>

                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${levelProgress?.currentLevel?.color || "#10B981"}20`,
                          }}
                        >
                          <DollarSign
                            size={22}
                            style={{
                              color:
                                levelProgress?.currentLevel?.color || "#10B981",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Referral Link */}
                      <div className="bg-green-50 border border-green-300 rounded-xl p-5 text-gray-900">
                        
                        <p className="text-sm text-gray-600 mb-1">
                          Your Referral Link
                        </p>

                        <p className="text-sm font-mono truncate mb-2 text-gray-800">
                          {window.location.origin}/user/signup?ref=
                          {ibProfile.referralCode}
                        </p>

                        <p className="text-xs mb-3 text-gray-600">
                          Code:{" "}
                          <span className="font-bold text-gray-900">
                            {ibProfile.referralCode}
                          </span>
                        </p>

                        <div className="flex gap-2">

                          <button
                            onClick={copyReferralLink}
                            className="flex-1 bg-green-500 text-white hover:bg-green-600 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                          >
                            <Copy size={16} />
                            Copy
                          </button>

                          {/* <button className="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition">
                            <Share2 size={18} />
                          </button> */}

                        </div>

                      </div>
                  </div>
                )}

                {/* Commission Levels */}
                {levelProgress && (
                  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Award size={20} className="text-green-500" />
                        <h3 className="font-semibold text-gray-900">
                          Commission Levels
                        </h3>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          levelProgress.autoUpgradeEnabled
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {levelProgress.autoUpgradeEnabled
                          ? "Auto Upgrade ON"
                          : "OFF"}
                      </span>
                    </div>

                    {/* Progress */}
                    {levelProgress.nextLevel && (
                      <div className="mb-5">
                        <div className="flex justify-between text-sm mb-1">
                          <span>
                            Progress to {levelProgress.nextLevel.name}
                          </span>
                          <span className="text-green-600 font-semibold">
                            {levelProgress.progressPercent}%
                          </span>
                        </div>

                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${levelProgress.progressPercent}%`,
                              background: `linear-gradient(90deg, ${levelProgress.currentLevel.color}, ${levelProgress.nextLevel.color})`,
                            }}
                          />
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          {levelProgress.referralsNeeded} more referrals needed
                        </p>
                      </div>
                    )}

                    {/* Levels */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {levelProgress.allLevels?.map((level) => (
                        <div
                          key={level._id}
                          className={`rounded-xl p-3 border ${
                            level.isCurrentLevel
                              ? "border-green-500 bg-green-50"
                              : level.isUnlocked
                                ? "border-gray-200 bg-white"
                                : "border-gray-200 bg-gray-50 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${level.color}20` }}
                            >
                              {level.icon === "crown" ? (
                                <Crown
                                  size={16}
                                  style={{ color: level.color }}
                                />
                              ) : level.icon === "trophy" ? (
                                <Trophy
                                  size={16}
                                  style={{ color: level.color }}
                                />
                              ) : (
                                <Award
                                  size={16}
                                  style={{ color: level.color }}
                                />
                              )}
                            </div>

                            <span className="text-sm font-medium">
                              {level.name}
                            </span>
                          </div>

                          <p className="text-lg font-bold">
                            ${level.commissionRate}
                            <span className="text-xs text-gray-500"> /lot</span>
                          </p>

                          <p className="text-xs text-gray-500">
                            {level.referralTarget === 0
                              ? "Default"
                              : `${level.referralTarget}+ referrals`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div
                className={`flex ${isMobile ? "gap-1 overflow-x-auto pb-2" : "gap-4"} mb-4`}
              >
                {[
                  "overview",
                  "referrals",
                  "commissions",
                  "downline",
                  "Transfer to Wallet",
                ].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${isMobile ? "px-3 py-1.5 text-xs whitespace-nowrap" : "px-4 py-2"} 
                    rounded-lg font-medium capitalize transition-colors ${
                      activeTab === tab
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {activeTab === "overview" && (
                <div
                  className={`grid ${isMobile ? "grid-cols-2 gap-2" : "grid-cols-5 gap-4"}`}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`${isDarkMode ? "bg-dark-800 border-gray-800" : "bg-white border-gray-200 shadow-sm"} rounded-xl ${isMobile ? "p-3" : "p-4"} border text-center`}
                    >
                      <p
                        className={`text-xs mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-600"}`}
                      >
                        Level {level} Commissions
                      </p>
                      <p
                        className={`font-bold ${isMobile ? "text-lg" : "text-xl"} ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {ibProfile.stats?.[`level${level}Count`] || 0}
                      </p>
                      <p
                        className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-500"}`}
                      >
                        trades
                      </p>
                      <p className="text-accent-green text-sm mt-1">
                        $
                        {(
                          ibProfile.stats?.[`level${level}Commission`] || 0
                        ).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Referrals */}
              {activeTab === "referrals" && (
                <div
                  className={`${isDarkMode ? "bg-dark-800 border-gray-800" : "bg-white border-gray-200 shadow-sm"} rounded-xl border overflow-hidden`}
                >
                  {referrals.length === 0 ? (
                    <div
                      className={`text-center ${isMobile ? "py-8" : "py-12"} text-gray-500 text-sm`}
                    >
                      No referrals yet
                    </div>
                  ) : isMobile ? (
                    <div
                      className={`divide-y ${isDarkMode ? "divide-gray-800" : "divide-gray-200"}`}
                    >
                      {referrals.map((ref) => (
                        <div key={ref._id} className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <p
                              className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {ref.firstName} {ref.lastName}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-gray-400 text-xs">{ref.email}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead
                        className={isDarkMode ? "bg-dark-700" : "bg-gray-50"}
                      >
                        <tr>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            User
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Email
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Joined
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Volume
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Commission
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((ref) => (
                          <tr
                            key={ref._id}
                            className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
                          >
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {ref.firstName} {ref.lastName}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {ref.email}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              -
                            </td>
                            <td className="px-4 py-3 text-accent-green text-sm">
                              -
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* commissions */}

              {activeTab === "commissions" && (
                <div
                  className={`${isDarkMode ? "bg-dark-800 border-gray-800" : "bg-white border-gray-200 shadow-sm"} rounded-xl border overflow-hidden`}
                >
                  {commissions.length === 0 ? (
                    <div
                      className={`text-center ${isMobile ? "py-8" : "py-12"} text-gray-500 text-sm`}
                    >
                      No commissions yet
                    </div>
                  ) : isMobile ? (
                    <div
                      className={`divide-y ${isDarkMode ? "divide-gray-800" : "divide-gray-200"}`}
                    >
                      {commissions.map((comm) => (
                        <div key={comm._id} className="p-3">
                          <div className="flex justify-between items-start mb-1">
                            <p
                              className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {comm.symbol}
                            </p>
                            <p className="text-accent-green text-sm font-medium">
                              ${comm.commissionAmount?.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-gray-400 text-xs">
                              Level {comm.level} •{" "}
                              {comm.tradeLotSize?.toFixed(2)} lots
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                comm.status === "CREDITED"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {comm.status}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs mt-1">
                            {new Date(comm.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead
                        className={isDarkMode ? "bg-dark-700" : "bg-gray-50"}
                      >
                        <tr>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Date
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Trader
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Symbol
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Level
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Lots
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Commission
                          </th>
                          <th
                            className={`text-left text-xs font-medium px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((comm) => (
                          <tr
                            key={comm._id}
                            className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
                          >
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              {new Date(comm.createdAt).toLocaleDateString()}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {comm.traderUserId?.firstName || "Unknown"}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {comm.symbol}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Level {comm.level}
                            </td>
                            <td
                              className={`px-4 py-3 text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
                            >
                              {comm.tradeLotSize?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-accent-green text-sm">
                              ${comm.commissionAmount?.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  comm.status === "CREDITED"
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-red-500/20 text-red-500"
                                }`}
                              >
                                {comm.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* downline */}

              {activeTab === "downline" && (
                <div
                  className={`${isDarkMode ? "bg-dark-800 border-gray-800" : "bg-white border-gray-200 shadow-sm"} rounded-xl ${isMobile ? "p-3" : "p-5"} border`}
                >
                  {downline.length === 0 ? (
                    <div
                      className={`text-center ${isMobile ? "py-8" : "py-12"} text-gray-500 text-sm`}
                    >
                      No downline yet
                    </div>
                  ) : (
                    <div>{renderDownlineTree(downline)}</div>
                  )}
                </div>
              )}

              {/* withdraw */}
              {activeTab === "Transfer to Wallet" && (
                <div className={isMobile ? "" : "max-w-md"}>
                  <div
                    className={`${isDarkMode ? "bg-dark-800 border-gray-800" : "bg-white border-gray-200 shadow-sm"} rounded-xl ${isMobile ? "p-4" : "p-6"} border`}
                  >
                    <h3
                      className={`font-semibold ${isMobile ? "mb-3 text-sm" : "mb-4"} ${isDarkMode ? "text-white" : "text-gray-900"}`}
                    >
                      Transfer Commission to Wallet
                    </h3>
                    <div className="mb-3">
                      <p className="text-gray-400 text-xs mb-1">
                        Available Balance
                      </p>
                      <p
                        className={`text-accent-green font-bold ${isMobile ? "text-xl" : "text-2xl"}`}
                      >
                        ${ibProfile.ibWalletBalance?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="mb-3">
                      <label className="text-gray-400 text-xs mb-1 block">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Enter amount"
                        className={`w-full bg-white border border-gray-600 rounded-lg px-3 py-2 text-black ${isMobile ? "text-sm" : ""}`}
                      />
                    </div>
                    <button
                      onClick={handleTransferToWallet}
                      disabled={
                        !withdrawAmount || parseFloat(withdrawAmount) <= 0
                      }
                      className={`w-full bg-accent-green text-black py-2 rounded-lg font-medium hover:bg-accent-green/90 disabled:opacity-50 ${isMobile ? "text-sm" : ""}`}
                    >
                      Transfer
                    </button>
                    {ibProfile.pendingWithdrawal > 0 && (
                      <p className="text-yellow-500 text-sm mt-3">
                        Pending withdrawal: $
                        {ibProfile.pendingWithdrawal.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default IBPage;