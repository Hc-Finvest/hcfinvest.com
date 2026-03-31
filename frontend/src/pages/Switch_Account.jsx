// Switch_Account.jsx

import { API_URL } from "../config/api";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Copy,
  Plus,
  Minus,
  RefreshCw,
  X,
  Check,
  TrendingUp,
  ArrowRight,
  MoreHorizontal,
  Trophy,
  ArrowLeft,
  Home,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";

const Switch_Account = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [activeMenu, setActiveMenu] = useState("Account");
  const [activeTab, setActiveTab] = useState("Real");
  const [accountTypes, setAccountTypes] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [challengeAccounts, setChallengeAccounts] = useState([]);
  const [challengeModeEnabled, setChallengeModeEnabled] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAccountTransferModal, setShowAccountTransferModal] =
    useState(false);
  const [targetAccount, setTargetAccount] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedChallengeAccount, setSelectedChallengeAccount] =
    useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [pinSecurityEnabled, setPinSecurityEnabled] = useState(() => {
    const saved = localStorage.getItem("pinSecurityEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [selectedType, setSelectedType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [newPin, setNewPin] = useState(["", "", "", ""]);
  const [currentPin, setCurrentPin] = useState(["", "", "", ""]);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferPin, setTransferPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [createAccountTab, setCreateAccountTab] = useState("live");
  const { sidebarExpanded } = useSidebar();

  const [createOnlyMode, setCreateOnlyMode] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tabs = challengeModeEnabled
    ? ["Real", "Demo", "Challenge", "Archived"]
    : ["Real", "Demo", "Archived"];
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const failed = searchParams.get("failed");
    const reason = searchParams.get("reason");

    if (failed === "true" && reason) {
      setFailReason(decodeURIComponent(reason));
      setShowFailModal(true);
      setActiveTab("Challenge");

      navigate("/account", { replace: true });
    }

    // ⭐ detect create account mode
    const openCreate = searchParams.get("create");
    if (openCreate === "true") {
      setCreateOnlyMode(true);
      fetchAccountTypes();
      setShowCreateModal(true);
    }

    fetchAccountTypes();
    fetchChallengeStatus();

    if (user._id) {
      fetchUserAccounts();
      fetchWalletBalance();
      fetchChallengeAccounts();
    } else {
      setLoading(false);
    }
  }, [user._id]);

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

  const fetchChallengeAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/prop/my-accounts/${user._id}`);
      const data = await res.json();
      if (data.success) {
        setChallengeAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching challenge accounts:", error);
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

  const fetchAccountTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/account-types`);
      const data = await res.json();
      setAccountTypes(data.accountTypes || []);
    } catch (error) {
      console.error("Error fetching account types:", error);
    }
  };

  const fetchUserAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
      const data = await res.json();
      setUserAccounts(data.accounts || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
    setLoading(false);
  };

  const handlePinChange = (
    index,
    value,
    pinArray,
    setPinArray,
    prefix = "pin",
  ) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (value && !/^\d$/.test(value)) return;

    const newPinArray = [...pinArray];
    newPinArray[index] = value;
    setPinArray(newPinArray);

    // Auto focus next input when digit entered
    if (value && index < 3) {
      const nextInput = document.getElementById(`${prefix}-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handlePinKeyDown = (
    e,
    index,
    pinArray,
    setPinArray,
    prefix = "pin",
  ) => {
    // Handle backspace - move to previous input
    if (e.key === "Backspace") {
      if (!pinArray[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        const prevInput = document.getElementById(`${prefix}-${index - 1}`);
        if (prevInput) {
          const newPinArray = [...pinArray];
          newPinArray[index - 1] = "";
          setPinArray(newPinArray);
          prevInput.focus();
        }
      }
    }
    // Handle left arrow
    else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(`${prefix}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
    // Handle right arrow
    else if (e.key === "ArrowRight" && index < 3) {
      const nextInput = document.getElementById(`${prefix}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    // Handle Enter - submit if all filled
    else if (e.key === "Enter") {
      const allFilled = pinArray.every((d) => d !== "");
      if (allFilled) {
        // Trigger the appropriate action based on which modal is open
        if (showCreateModal) handleCreateAccount();
        else if (showTransferModal) handleTransferFunds();
        else if (showWithdrawModal) handleWithdrawFromAccount();
        else if (showPinModal) handleChangePin();
      }
    }
  };

  const handlePinFocus = (e) => {
    e.target.select();
  };

  const handleCreateAccount = async () => {
    if (!selectedType) {
      setError("Please select an account type");
      return;
    }

    if (!user._id) {
      setError("Please login to create an account");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/trading-accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          accountTypeId: selectedType._id,
          pin: "0000", // Default PIN - not used anymore
        }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully!");

        setShowCreateModal(false);
        setPin(["", "", "", ""]);
        setSelectedType(null);
        fetchUserAccounts();

        // ✅ redirect after short delay (so user can see toast)
        setTimeout(() => {
          navigate("/account");
        }, 2000);
      } else {
        setError(data.message || "Failed to create account");
      }
    } catch (error) {
      console.error("Account creation error:", error);
      setError("Error creating account. Please try again.");
    }
  };

  const handleChangePin = async () => {
    const currentPinValue = currentPin.join("");
    const newPinValue = newPin.join("");

    if (currentPinValue.length !== 4 || newPinValue.length !== 4) {
      setError("Please enter valid 4-digit PINs");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/trading-accounts/${selectedAccount._id}/change-pin`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPin: currentPinValue,
            newPin: newPinValue,
          }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess("PIN changed successfully!");
        setShowPinModal(false);
        setCurrentPin(["", "", "", ""]);
        setNewPin(["", "", "", ""]);
        setSelectedAccount(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("Error changing PIN");
    }
  };

  const togglePinSecurity = () => {
    const newValue = !pinSecurityEnabled;
    setPinSecurityEnabled(newValue);
    localStorage.setItem("pinSecurityEnabled", JSON.stringify(newValue));
    setSuccess(newValue ? "PIN security enabled" : "PIN security disabled");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleArchiveAccount = async (accountId) => {
    try {
      const res = await fetch(
        `${API_URL}/trading-accounts/${accountId}/archive`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();

      if (data.success) {
        setSuccess("Account archived successfully!");
        setShowArchiveConfirm(null);
        fetchUserAccounts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to archive account");
      }
    } catch (error) {
      console.error("Archive error:", error);
      setError("Error archiving account");
    }
  };

  const handleUnarchiveAccount = async (accountId) => {
    try {
      const res = await fetch(
        `${API_URL}/trading-accounts/${accountId}/unarchive`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();

      if (data.success) {
        setSuccess("Account restored successfully!");
        fetchUserAccounts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to restore account");
      }
    } catch (error) {
      console.error("Unarchive error:", error);
      setError("Error restoring account");
    }
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/${accountId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        setSuccess("Account deleted permanently!");
        setShowDeleteConfirm(null);
        fetchUserAccounts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setError("Error deleting account");
    }
  };

  const handleResetDemo = async (accountId) => {
    if (
      !confirm(
        "Are you sure you want to reset this demo account? All open trades will be closed and balance will be reset.",
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/trading-accounts/${accountId}/reset-demo`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || "Demo account reset successfully!");
        fetchUserAccounts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to reset demo account");
      }
    } catch (error) {
      console.error("Demo reset error:", error);
      setError("Error resetting demo account");
    }
  };

  const handleTransferFunds = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (parseFloat(transferAmount) > walletBalance) {
      setError("Insufficient wallet balance");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/trading-accounts/${selectedAccount._id}/transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            amount: parseFloat(transferAmount),
            direction: "deposit",
            skipPinVerification: true,
          }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess("Funds transferred successfully!");
        setShowTransferModal(false);
        setTransferAmount("");
        setTransferPin(["", "", "", ""]);
        setSelectedAccount(null);
        fetchUserAccounts();
        fetchWalletBalance();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Transfer failed");
      }
    } catch (error) {
      console.error("Transfer error:", error);
      setError("Error transferring funds");
    }
  };

  const handleWithdrawFromAccount = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (parseFloat(transferAmount) > selectedAccount.balance) {
      setError("Insufficient account balance");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/trading-accounts/${selectedAccount._id}/transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user._id,
            amount: parseFloat(transferAmount),
            direction: "withdraw",
            skipPinVerification: true,
          }),
        },
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess("Funds withdrawn to main wallet!");
        setShowWithdrawModal(false);
        setTransferAmount("");
        setTransferPin(["", "", "", ""]);
        setSelectedAccount(null);
        fetchUserAccounts();
        fetchWalletBalance();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Withdrawal failed");
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      setError("Error withdrawing funds");
    }
  };

  const handleAccountToAccountTransfer = async () => {
    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (!targetAccount) {
      setError("Please select a target account");
      return;
    }
    if (parseFloat(transferAmount) > selectedAccount.balance) {
      setError("Insufficient account balance");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/trading-accounts/account-transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          fromAccountId: selectedAccount._id,
          toAccountId: targetAccount._id,
          amount: parseFloat(transferAmount),
          skipPinVerification: true,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(
          `$${transferAmount} transferred from ${selectedAccount.accountId} to ${targetAccount.accountId}!`,
        );
        setShowAccountTransferModal(false);
        setTransferAmount("");
        setTransferPin(["", "", "", ""]);
        setSelectedAccount(null);
        setTargetAccount(null);
        fetchUserAccounts();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Transfer failed");
      }
    } catch (error) {
      console.error("Account transfer error:", error);
      setError("Error transferring funds");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
  };

  /* return (
    <div className={`h-screen flex flex-col md:flex-row transition-colors duration-300 ${isDarkMode ? 'bg-[#f4f6fb] text-gray-800' : 'bg-gray-100'}`}> */

  return (
    <div
      className={`h-screen flex flex-col md:flex-row transition-colors duration-300 ${isDarkMode ? "bg-[#f4f6fb] text-gray-800" : "bg-gray-100"}`}
    >
      {/* Hide sidebar when createOnlyMode */}
      {!isMobile && <Sidebar activeMenu="Account" />}

      {/* {/* Main Content .*}
      {!createOnlyMode && (
        <main className={`flex-1 overflow-y-auto ${isMobile ? "pt-14" : ""}`}> */}

      {/* Main Content */}
      {/* <main className={`flex-1 overflow-y-auto ${isMobile ? "pt-14" : ""}`}> */}
          <main
            className={`flex-1 overflow-y-auto transition-all duration-300 ${
              isMobile
                ? "pt-14"
                : sidebarExpanded
                ? "ml-[280px]"
                : "ml-[64px]"
            }`}
          >
        <div className={`${isMobile ? "p-4" : "p-6"}`}>
          {createOnlyMode && (
            <div className="w-full max-w-4xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Open New Account
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-3 mb-8">
                <button
                  onClick={() => setCreateAccountTab("live")}
                  className={`px-5 py-2.5 rounded-lg font-medium transition ${
                    createAccountTab === "live"
                      ? "bg-blue-500 text-white shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Live Account
                </button>

                <button
                  onClick={() => setCreateAccountTab("demo")}
                  className={`px-5 py-2.5 rounded-lg font-medium transition ${
                    createAccountTab === "demo"
                      ? "bg-yellow-500 text-black shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Demo Account
                </button>
              </div>

              {/* Account Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accountTypes
                  .filter((t) =>
                    createAccountTab === "demo" ? t.isDemo : !t.isDemo,
                  )
                  .map((type) => {
                    const isSelected = selectedType?._id === type._id;

                    return (
                      <button
                        key={type._id}
                        onClick={() => setSelectedType(type)}
                        className={`relative bg-white shadow-md border rounded-xl p-6 text-left transition ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Selected Icon */}
                        {isSelected && (
                          <Check
                            size={18}
                            className="absolute top-4 right-4 text-blue-500"
                          />
                        )}

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {type.name}
                        </h3>

                        <p className="text-sm text-gray-500 mb-6">
                          {type.description || "Trading account"}
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-5 text-sm">
                          <div>
                            <p className="text-gray-400 text-xs">Min Deposit</p>
                            <p className="font-medium text-gray-900">
                              ${type.minDeposit || 0}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs">Leverage</p>
                            <p className="font-medium text-gray-900">
                              {type.leverage || "1:100"}
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs">Spread</p>
                            <p className="font-medium text-gray-900">
                              {type.minSpread ?? 2} pips
                            </p>
                          </div>

                          <div>
                            <p className="text-gray-400 text-xs">Commission</p>
                            <p className="font-medium text-gray-900">
                              {type.commission ? `$${type.commission}` : "None"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-center gap-4 mt-10">
                <button
                  onClick={() => window.close()}
                  className={`flex items-center gap-2 font-medium ${isMobile ? "px-4 py-2 text-sm" : "px-6 py-3"} rounded-lg border bg-gray-100 text-gray-900 hover:bg-gray-200 border-gray-300`}
                >
                  Cancel
                </button>

                <button
                  onClick={handleCreateAccount}
                  disabled={!selectedType}
                  className="px-10 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
          {/* Mobile Header */}
          {isMobile && (
            <header
              className={`fixed top-0 left-0 right-0 z-40 px-4 py-3 flex items-center gap-4 ${isDarkMode ? "bg-[#2f3f74] text-gray-900 border-b border-gray-200" : "bg-white border-b border-gray-200"}`}
            >
              <button
                onClick={() => navigate("/mobile")}
                className={`p-2 -ml-2 rounded-lg ${isDarkMode ? "hover:bg-gray-100" : "hover:bg-gray-100"}`}
              >
                <ArrowLeft
                  size={22}
                  className={isDarkMode ? "text-gray-900" : "text-gray-900"}
                />
              </button>
              <h1
                className={`font-semibold text-lg flex-1 ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
              >
                Account
              </h1>
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg ${isDarkMode ? "text-yellow-400 hover:bg-gray-100" : "text-blue-500 hover:bg-gray-100"}`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => navigate("/mobile")}
                className={`p-2 rounded-lg ${isDarkMode ? "hover:bg-gray-100" : "hover:bg-gray-100"}`}
              >
                <Home size={20} className="text-gray-600" />
              </button>
            </header>
          )}

          {/* Sidebar - Hidden on Mobile, Fixed height with scroll for nav */}

          {/* Main Content - Scrollable */}
          <main className={`flex-1 overflow-y-auto ${isMobile ? "pt-14" : ""}`}>
            <div className={`${isMobile ? "p-4" : "p-6"}`}>
              {/* Success/Error Messages */}
              {success && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500 flex items-center gap-2">
                  <Check size={18} /> {success}
                </div>
              )}
              {error && (
                <div
                  className={`mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 ${isMobile ? "text-sm" : ""}`}
                >
                  {error}
                </div>
              )}

              {/* Header with Title and Buttons */}
              {/* 
                <div
                  className={`flex ${isMobile ? "flex-col gap-3" : "items-center justify-between"} mb-4`}
                >
                  {!isMobile && (
                    <h1
                      className={`text-2xl font-semibold ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                    >
                      My Accounts
                    </h1>
                  )}
                  <div
                    className={`flex items-center ${isMobile ? "justify-between" : "gap-3"}`}
                  >
                    <button
                      onClick={fetchUserAccounts}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-100" : "hover:bg-gray-100"}`}
                    >
                      <RefreshCw
                        size={18}
                        className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        fetchAccountTypes();
                        setShowCreateModal(true);
                      }}
                      className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-black font-medium ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5"} rounded-lg hover:bg-blue-500 hover:bg-blue-600 text-white/90 transition-colors`}
                    >
                      <Plus size={isMobile ? 16 : 18} />{" "}
                      {isMobile ? "New Account" : "Open Account"}
                    </button>
                  </div>
                </div>
 
                {/* Tabs *}
                <div
                  className={`flex items-center ${isMobile ? "gap-1 overflow-x-auto pb-2" : "gap-1"} mb-4`}
                >
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`${isMobile ? "px-3 py-1.5 text-xs whitespace-nowrap" : "px-4 py-2 text-sm"} rounded-lg font-medium transition-colors ${
                        activeTab === tab
                          ? isDarkMode
                            ? "bg-gray-100 text-gray-900 border border-gray-600"
                            : "bg-white text-gray-900 border border-gray-300 shadow-sm"
                          : isDarkMode
                            ? "text-gray-600 hover:text-gray-900 hover:bg-white"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
*/}
              {/* Accounts Content */}
              {!createOnlyMode &&
                (loading ? (
                  <div className="flex items-center justify-center py-16">
                    <RefreshCw
                      size={24}
                      className="text-gray-600 animate-spin"
                    />
                  </div>
                ) : activeTab === "Challenge" ? (
                  /* Challenge Tab Content */
                  <div>
                    {/* Buy Challenge Button */}
                    <div className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <Trophy size={28} className="text-yellow-500" />
                          </div>
                          <div>
                            <h3 className="text-gray-900 font-semibold text-lg">
                              Prop Trading Challenge
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Get funded up to $200,000. Keep up to 80% of
                              profits.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate("/buy-challenge")}
                          className="flex items-center gap-2 bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors"
                        >
                          <Trophy size={18} /> Buy Challenge
                        </button>
                      </div>
                    </div>

                    {/* Challenge Accounts List */}
                    {challengeAccounts.length === 0 ? (
                      <div
                        className={`border border-dashed border-gray-700 rounded-xl ${isMobile ? "p-8" : "p-16"} text-center`}
                      >
                        <div
                          className={`${isMobile ? "w-12 h-12" : "w-14 h-14"} bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4`}
                        >
                          <Trophy
                            size={isMobile ? 20 : 24}
                            className="text-gray-600"
                          />
                        </div>
                        <h3
                          className={`text-gray-900 font-medium ${isMobile ? "text-base" : "text-lg"} mb-2`}
                        >
                          No challenge accounts yet
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          Buy a challenge to start your prop trading journey
                        </p>
                        <button
                          onClick={() => navigate("/buy-challenge")}
                          className="inline-flex items-center gap-2 text-yellow-500 hover:text-yellow-400 font-medium transition-colors text-sm"
                        >
                          Buy your first challenge <ArrowRight size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}`}
                      >
                        {challengeAccounts.map((account) => (
                          <div
                            key={account._id}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                          >
                            {/* Card Header */}
                            <div className="p-4 border-b border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                      account.status === "FUNDED"
                                        ? "bg-purple-500/20"
                                        : account.status === "PASSED"
                                          ? "bg-green-500/20"
                                          : account.status === "FAILED"
                                            ? "bg-red-500/20"
                                            : "bg-yellow-500/20"
                                    }`}
                                  >
                                    <Trophy
                                      size={20}
                                      className={
                                        account.status === "FUNDED"
                                          ? "text-purple-500"
                                          : account.status === "PASSED"
                                            ? "text-green-500"
                                            : account.status === "FAILED"
                                              ? "text-red-500"
                                              : "text-yellow-500"
                                      }
                                    />
                                  </div>
                                  <div>
                                    <h3 className="text-gray-900 font-semibold">
                                      {account.accountId}
                                    </h3>
                                    <p className="text-gray-600 text-xs uppercase">
                                      {account.challengeId?.name || "Challenge"}{" "}
                                      • Phase {account.currentPhase}/
                                      {account.totalPhases}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    account.status === "FUNDED"
                                      ? "bg-purple-500/20 text-purple-500"
                                      : account.status === "PASSED"
                                        ? "bg-green-500/20 text-green-500"
                                        : account.status === "FAILED"
                                          ? "bg-red-500/20 text-red-500"
                                          : account.status === "EXPIRED"
                                            ? "bg-orange-500/20 text-orange-500"
                                            : "bg-blue-500/20 text-blue-500"
                                  }`}
                                >
                                  {account.status}
                                </span>
                              </div>
                            </div>

                            {/* Card Body - Stats */}
                            <div className="p-4">
                              <div className="text-center mb-4">
                                <p className="text-gray-900 text-2xl font-bold">
                                  $
                                  {(
                                    account.currentBalance || 0
                                  ).toLocaleString()}
                                </p>
                                <p className="text-gray-600 text-sm">Balance</p>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-100 rounded-lg p-2 text-center">
                                  <p className="text-gray-600 text-xs">
                                    Profit
                                  </p>
                                  <p
                                    className={`font-medium ${account.currentProfitPercent >= 0 ? "text-green-500" : "text-red-500"}`}
                                  >
                                    {account.currentProfitPercent >= 0
                                      ? "+"
                                      : ""}
                                    {(
                                      account.currentProfitPercent || 0
                                    ).toFixed(2)}
                                    %
                                  </p>
                                </div>
                                <div className="bg-gray-100 rounded-lg p-2 text-center">
                                  <p className="text-gray-600 text-xs">
                                    Daily DD
                                  </p>
                                  <p className="text-red-500 font-medium">
                                    {(
                                      account.currentDailyDrawdownPercent || 0
                                    ).toFixed(2)}
                                    %
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer - Actions */}
                            <div className="flex border-t border-gray-200">
                              {account.status === "ACTIVE" ||
                              account.status === "FUNDED" ? (
                                <button
                                  onClick={() => {
                                    setSelectedChallengeAccount(account);
                                    setShowRulesModal(true);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition-colors"
                                >
                                  <ArrowRight size={16} /> Start Trading
                                </button>
                              ) : (
                                <div className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 bg-gray-100">
                                  {account.status === "PASSED"
                                    ? "Awaiting Funded Account"
                                    : account.status}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : userAccounts.length === 0 ? (
                  <div className="border border-dashed border-gray-700 rounded-xl p-16 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp size={24} className="text-gray-600" />
                    </div>
                    <h3 className="text-gray-900 font-medium text-lg mb-2">
                      No {activeTab.toLowerCase()} accounts yet
                    </h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Open your first {activeTab.toLowerCase()} trading account
                      to start trading
                    </p>
                    <button
                      onClick={() => {
                        fetchAccountTypes();
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-2 text-accent-green hover:text-accent-green/80 font-medium transition-colors"
                    >
                      Open your first {activeTab.toLowerCase()} account{" "}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={`grid ${isMobile ? "grid-cols-1 gap-3" : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"}`}
                  >
                    {userAccounts
                      .filter((acc) => {
                        if (activeTab === "Real")
                          return (
                            !acc.accountTypeId?.isDemo &&
                            !acc.isDemo &&
                            acc.status === "Active"
                          );
                        if (activeTab === "Demo")
                          return (
                            (acc.accountTypeId?.isDemo || acc.isDemo) &&
                            acc.status === "Active"
                          );
                        if (activeTab === "Archived")
                          return (
                            acc.status === "Archived" || acc.status !== "Active"
                          );
                        return true;
                      })
                      .map((account) => (
                        <div
                          key={account._id}
                          className={`${isDarkMode ? "bg-white border-gray-200" : "bg-white border-gray-200 shadow-sm"} rounded-xl border overflow-hidden`}
                        >
                          {/* Card Header */}
                          <div
                            className={`${isMobile ? "p-3" : "p-4"} border-b ${isDarkMode ? "border-gray-200" : "border-gray-200"}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`${isMobile ? "w-8 h-8" : "w-10 h-10"} bg-blue-500/20 rounded-lg flex items-center justify-center`}
                                >
                                  <TrendingUp
                                    size={isMobile ? 16 : 20}
                                    className="text-blue-500"
                                  />
                                </div>
                                <div>
                                  <h3
                                    className={`font-semibold ${isMobile ? "text-sm" : ""} ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                                  >
                                    {account.accountId}
                                  </h3>
                                  <p className="text-gray-600 text-xs uppercase">
                                    {account.accountTypeId?.name || "STANDARD"}
                                  </p>
                                </div>
                              </div>
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setShowAccountMenu(
                                      showAccountMenu === account._id
                                        ? null
                                        : account._id,
                                    )
                                  }
                                  className="text-gray-600 hover:text-gray-900 p-1"
                                >
                                  <MoreHorizontal size={18} />
                                </button>
                                {showAccountMenu === account._id && (
                                  <div
                                    className="absolute right-0 top-8 bg-gray-100 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {account.status === "Archived" ? (
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAccountMenu(null);
                                            handleUnarchiveAccount(account._id);
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-gray-200 rounded-t-lg flex items-center gap-2"
                                        >
                                          <RefreshCw size={14} /> Unarchive
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowAccountMenu(null);
                                            setShowDeleteConfirm(account);
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-200 rounded-b-lg flex items-center gap-2"
                                        >
                                          <X size={14} /> Delete Permanently
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowAccountMenu(null);
                                          setShowArchiveConfirm(account);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-200 rounded-lg flex items-center gap-2"
                                      >
                                        <X size={14} /> Archive Account
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <span
                                className={`w-2 h-2 rounded-full ${account.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                              ></span>
                              <span
                                className={`text-xs ${account.status === "Active" ? "text-green-500" : "text-red-500"}`}
                              >
                                {account.status === "Active"
                                  ? "Live"
                                  : account.status}
                              </span>
                            </div>
                          </div>

                          {/* Card Body - Balance & Details */}
                          <div className={`${isMobile ? "p-3" : "p-4"}`}>
                            <div className="text-center mb-3">
                              <p
                                className={`font-bold ${isMobile ? "text-2xl" : "text-3xl"} ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                              >
                                ${account.balance.toLocaleString()}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                Balance
                              </p>
                            </div>

                            {/* Account Details Grid */}
                            <div
                              className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t ${isDarkMode ? "border-gray-200" : "border-gray-200"}`}
                            >
                              <div className="text-center">
                                <p className="text-gray-600 text-xs">
                                  Leverage
                                </p>
                                <p
                                  className={`font-medium text-sm ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                                >
                                  {account.leverage || "1:100"}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-600 text-xs">Credit</p>
                                <p
                                  className={`font-medium text-sm ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                                >
                                  ${(account.credit || 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-600 text-xs">
                                  Min Deposit
                                </p>
                                <p
                                  className={`font-medium text-sm ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                                >
                                  $
                                  {account.accountTypeId?.minDeposit?.toLocaleString() ||
                                    "0"}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-600 text-xs">Equity</p>
                                <p
                                  className={`font-medium text-sm ${isDarkMode ? "text-gray-900" : "text-gray-900"}`}
                                >
                                  $
                                  {(
                                    (account.balance || 0) +
                                    (account.credit || 0)
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer - Actions */}
                          <div
                            className={`flex border-t ${isDarkMode ? "border-gray-200" : "border-gray-200"}`}
                          >
                            <button
                              onClick={() =>
                                isMobile
                                  ? navigate(`/mobile?account=${account._id}`)
                                  : navigate(`/trade/${account._id}`)
                              }
                              className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2 text-xs" : "py-3"} bg-blue-500 hover:bg-blue-600 text-white text-black font-medium hover:bg-blue-500 hover:bg-blue-600 text-white/90 transition-colors`}
                            >
                              <ArrowRight size={isMobile ? 12 : 16} /> Trade
                            </button>
                            {account.isDemo || account.accountTypeId?.isDemo ? (
                              // Demo account - show Reset button only
                              <button
                                onClick={() => handleResetDemo(account._id)}
                                className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2 text-xs" : "py-3"} text-yellow-400 hover:text-yellow-300 hover:bg-gray-100 transition-colors border-l border-gray-200`}
                              >
                                <RefreshCw size={isMobile ? 12 : 16} /> Reset
                              </button>
                            ) : (
                              // Real account - show Deposit/Withdraw/Transfer
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setShowTransferModal(true);
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2 text-xs" : "py-3"} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border-l border-gray-200`}
                                >
                                  <Plus size={isMobile ? 12 : 16} /> Deposit
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setShowWithdrawModal(true);
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2 text-xs" : "py-3"} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors border-l border-gray-200`}
                                >
                                  <Minus size={isMobile ? 12 : 16} /> Withdraw
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAccount(account);
                                    setShowAccountTransferModal(true);
                                  }}
                                  className={`flex-1 flex items-center justify-center gap-1 ${isMobile ? "py-2 text-xs" : "py-3"} text-blue-400 hover:text-blue-300 hover:bg-gray-100 transition-colors border-l border-gray-200`}
                                >
                                  <Copy size={isMobile ? 12 : 16} /> Transfer
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </main>
        </div>
      </main>

      {/* Create Account Modal */}
      {showCreateModal && !createOnlyMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">
                Open New Account
              </h3>
              <button
                /* onClick={() => {
                  setShowCreateModal(false)
                  setPin(['', '', '', ''])
                  setSelectedType(null)
                  setError('')
                }} */
                onClick={() => {
                  setShowCreateModal(false);
                  setPin(["", "", "", ""]);
                  setSelectedType(null);
                  setError("");

                  if (createOnlyMode) {
                    window.close();
                  }
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* Account Type Category Selection */}
            <div className="mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setCreateAccountTab("live")}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    createAccountTab === "live"
                      ? "bg-blue-500 hover:bg-blue-600 text-white text-black"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Live Account
                </button>
                <button
                  onClick={() => setCreateAccountTab("demo")}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    createAccountTab === "demo"
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Demo Account
                </button>
              </div>
            </div>

            {/* Account Type Selection - 2 Column Grid Like Screenshot */}
            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-4">
                {createAccountTab === "demo"
                  ? "Select Demo Account Type"
                  : "Select Live Account Type"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {accountTypes.filter((t) =>
                  createAccountTab === "demo" ? t.isDemo : !t.isDemo,
                ).length === 0 ? (
                  <p className="text-gray-600 text-sm text-center py-8 col-span-2">
                    No {createAccountTab === "demo" ? "demo" : "live"} account
                    types available
                  </p>
                ) : (
                  accountTypes
                    .filter((t) =>
                      createAccountTab === "demo" ? t.isDemo : !t.isDemo,
                    )
                    .map((type) => {
                      const isSelected = selectedType?._id === type._id;
                      const icons = {
                        DEMO: "💳",
                        STANDARD: "📊",
                        PRO: "📈",
                        "PRO+": "⚡",
                        ELITE: "👑",
                        HNI: "💎",
                      };
                      const icon = icons[type.name?.toUpperCase()] || "📊";

                      return (
                        <button
                          key={type._id}
                          onClick={() => setSelectedType(type)}
                          className={`relative bg-gray-100 rounded-xl p-5 text-left transition-all duration-200 border ${
                            isSelected
                              ? "border-white ring-1 ring-white"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{icon}</span>
                            <span className="text-gray-900 font-bold text-lg">
                              {type.name}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border-2 ml-auto ${isSelected ? "border-white bg-white" : "border-gray-500"}`}
                            >
                              {isSelected && (
                                <div className="w-full h-full rounded-full bg-white" />
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 text-sm mb-4">
                            {type.description ||
                              (type.isDemo
                                ? "Practice trading with virtual funds. No risk involved."
                                : "Live trading account")}
                          </p>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <p className="text-gray-600 text-xs">
                                {type.isDemo
                                  ? "Virtual Balance"
                                  : "Min deposit"}
                              </p>
                              <p className="text-gray-900 font-semibold">
                                $
                                {type.isDemo
                                  ? "10,000"
                                  : type.minDeposit?.toLocaleString() ||
                                    "100"}{" "}
                                {!type.isDemo && "USD"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">
                                Min spread
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {type.minSpread ?? 2} pips
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">
                                Max leverage
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {type.leverage || "1:100"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">
                                Commission
                              </p>
                              <p className="text-gray-900 font-semibold">
                                {type.commission
                                  ? `$${type.commission}/lot`
                                  : "NO COMM"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {selectedType && (
              <div
                className={`mb-4 p-4 rounded-xl ${selectedType.isDemo ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-blue-500 hover:bg-blue-600 text-white/10 border border-accent-green/30"}`}
              >
                <p
                  className={`text-sm text-center ${selectedType.isDemo ? "text-yellow-500" : "text-accent-green"}`}
                >
                  ✓ <strong>{selectedType.name}</strong>{" "}
                  {selectedType.isDemo
                    ? `demo account will be created with $${selectedType.demoBalance?.toLocaleString() || "10,000"} virtual balance.`
                    : "account will be created with $0 balance. Deposit funds after creation."}
                </p>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              {/* 
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setPin(['', '', '', ''])
                  setSelectedType(null)
                  setError('')
                }}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                 */}
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setPin(["", "", "", ""]);
                  setSelectedType(null);
                  setError("");

                  if (createOnlyMode) {
                    window.close();
                  }
                }}
              >
                Cancel
              </button>
              {selectedType && (
                <button
                  onClick={handleCreateAccount}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-black font-medium py-3 rounded-lg hover:bg-blue-500 hover:bg-blue-600 text-white/90 transition-colors"
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {showPinModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">
                Change PIN
              </h3>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setCurrentPin(["", "", "", ""]);
                  setNewPin(["", "", "", ""]);
                  setError("");
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-3">
                Current PIN
              </label>
              <div className="flex gap-3 justify-center">
                {currentPin.map((digit, index) => (
                  <input
                    key={`current-${index}`}
                    id={`currentpin-${index}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handlePinChange(
                        index,
                        e.target.value,
                        currentPin,
                        setCurrentPin,
                        "currentpin",
                      )
                    }
                    onKeyDown={(e) =>
                      handlePinKeyDown(
                        e,
                        index,
                        currentPin,
                        setCurrentPin,
                        "currentpin",
                      )
                    }
                    onFocus={handlePinFocus}
                    autoFocus={index === 0}
                    className="w-12 h-12 bg-gray-100 border border-gray-700 rounded-lg text-center text-gray-900 text-xl focus:outline-none focus:border-accent-green"
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-gray-600 text-sm mb-3">
                New PIN
              </label>
              <div className="flex gap-3 justify-center">
                {newPin.map((digit, index) => (
                  <input
                    key={`new-${index}`}
                    id={`newpin-${index}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handlePinChange(
                        index,
                        e.target.value,
                        newPin,
                        setNewPin,
                        "newpin",
                      )
                    }
                    onKeyDown={(e) =>
                      handlePinKeyDown(e, index, newPin, setNewPin, "newpin")
                    }
                    onFocus={handlePinFocus}
                    className="w-12 h-12 bg-gray-100 border border-gray-700 rounded-lg text-center text-gray-900 text-xl focus:outline-none focus:border-accent-green"
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setCurrentPin(["", "", "", ""]);
                  setNewPin(["", "", "", ""]);
                  setError("");
                }}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePin}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-black font-medium py-3 rounded-lg hover:bg-blue-500 hover:bg-blue-600 text-white/90 transition-colors"
              >
                Change PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal (Main Wallet → Account Wallet) */}
      {showTransferModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">
                Transfer to Account
              </h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferAmount("");
                  setTransferPin(["", "", "", ""]);
                  setError("");
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-gray-100 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                  <TrendingUp size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    {selectedAccount.accountId}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {selectedAccount.accountTypeId?.name}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-600">
                <span className="text-gray-600">Account Balance:</span>
                <span className="text-gray-900 font-medium">
                  ${selectedAccount.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-500 hover:bg-blue-600 text-white/10 border border-accent-green/30 rounded-lg mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Main Wallet Balance:</span>
                <span className="text-accent-green font-medium">
                  ${walletBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">
                Transfer Amount
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={transferAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/,/g, ".");
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setTransferAmount(val);
                  }
                }}
                placeholder="Enter amount (e.g., 100.50)"
                className="w-full bg-gray-100 border border-gray-700 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={() => setTransferAmount(walletBalance.toString())}
                  className="text-accent-green text-xs hover:underline"
                >
                  Max: ${walletBalance.toLocaleString()}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferAmount("");
                  setError("");
                }}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferFunds}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-black font-medium py-3 rounded-lg hover:bg-blue-500 hover:bg-blue-600 text-white/90 transition-colors"
              >
                Transfer Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw from Account Modal (Account Wallet → Main Wallet) */}
      {showWithdrawModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">
                Withdraw to Main Wallet
              </h3>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setTransferAmount("");
                  setTransferPin(["", "", "", ""]);
                  setError("");
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-gray-100 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
                  <TrendingUp size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    {selectedAccount.accountId}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {selectedAccount.accountTypeId?.name}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-600">
                <span className="text-gray-600">Available Balance:</span>
                <span className="text-gray-900 font-medium">
                  ${selectedAccount.balance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">
                Withdraw Amount
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={transferAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/,/g, ".");
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setTransferAmount(val);
                  }
                }}
                placeholder="Enter amount (e.g., 100.50)"
                className="w-full bg-gray-100 border border-gray-700 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-accent-green"
              />
              <div className="flex justify-between mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setTransferAmount(selectedAccount.balance.toString())
                  }
                  className="text-accent-green text-xs hover:underline"
                >
                  Max: ${selectedAccount.balance.toLocaleString()}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setTransferAmount("");
                  setError("");
                }}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawFromAccount}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-black font-medium py-3 rounded-lg hover:bg-blue-500 hover:bg-blue-600 text-white/90 transition-colors"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account to Account Transfer Modal */}
      {showAccountTransferModal && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900 font-semibold text-lg">
                Transfer Between Accounts
              </h3>
              <button
                onClick={() => {
                  setShowAccountTransferModal(false);
                  setTransferAmount("");
                  setTransferPin(["", "", "", ""]);
                  setTargetAccount(null);
                  setError("");
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* From Account */}
            <div className="p-3 bg-gray-100 rounded-lg mb-4">
              <p className="text-gray-600 text-xs mb-1">From Account</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  <span className="text-gray-900 font-medium">
                    {selectedAccount.accountId}
                  </span>
                </div>
                <span className="text-gray-900">
                  ${selectedAccount.balance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* To Account Selection - Only show live accounts (exclude demo) */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">
                To Account
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {userAccounts
                  .filter(
                    (acc) =>
                      acc._id !== selectedAccount._id &&
                      acc.status === "Active" &&
                      !acc.isDemo &&
                      !acc.accountTypeId?.isDemo,
                  )
                  .map((acc) => (
                    <button
                      key={acc._id}
                      onClick={() => setTargetAccount(acc)}
                      className={`w-full p-3 rounded-lg border flex items-center justify-between ${
                        targetAccount?._id === acc._id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-100 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp size={14} className="text-gray-600" />
                        <span className="text-gray-900 text-sm">
                          {acc.accountId}
                        </span>
                        <span className="text-gray-600 text-xs">
                          ({acc.accountTypeId?.name})
                        </span>
                      </div>
                      <span className="text-gray-600 text-sm">
                        ${acc.balance.toLocaleString()}
                      </span>
                    </button>
                  ))}
                {userAccounts.filter(
                  (acc) =>
                    acc._id !== selectedAccount._id &&
                    acc.status === "Active" &&
                    !acc.isDemo &&
                    !acc.accountTypeId?.isDemo,
                ).length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-2">
                    No live accounts available for transfer
                  </p>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm mb-2">
                Transfer Amount
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={transferAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  setTransferAmount(value);
                }}
                placeholder="Enter amount"
                className="w-full bg-gray-100 border border-gray-700 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() =>
                  setTransferAmount(selectedAccount.balance.toString())
                }
                className="text-blue-400 text-xs hover:underline mt-2"
              >
                Max: ${selectedAccount.balance.toLocaleString()}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAccountTransferModal(false);
                  setTransferAmount("");
                  setTargetAccount(null);
                  setError("");
                }}
                className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAccountToAccountTransfer}
                disabled={!targetAccount}
                className="flex-1 bg-blue-500 text-gray-900 font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Rules Modal */}
      {showRulesModal && selectedChallengeAccount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Trophy size={20} className="text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Challenge Rules
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {selectedChallengeAccount.accountId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Challenge Info */}
              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-gray-600 text-xs">Account Size</p>
                    <p className="text-gray-900 font-bold">
                      $
                      {(
                        selectedChallengeAccount.initialBalance || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Current Balance</p>
                    <p className="text-gray-900 font-bold">
                      $
                      {(
                        selectedChallengeAccount.currentBalance || 0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Phase</p>
                    <p className="text-gray-900 font-bold">
                      {selectedChallengeAccount.currentPhase}/
                      {selectedChallengeAccount.totalPhases}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Status</p>
                    <p
                      className={`font-bold ${
                        selectedChallengeAccount.status === "ACTIVE"
                          ? "text-blue-500"
                          : selectedChallengeAccount.status === "FUNDED"
                            ? "text-purple-500"
                            : "text-gray-600"
                      }`}
                    >
                      {selectedChallengeAccount.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rules */}
              <h3 className="text-gray-900 font-semibold mb-4">
                Trading Rules You Must Follow
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <span className="text-gray-600">Daily Drawdown Limit</span>
                  <span className="text-red-500 font-bold">
                    {selectedChallengeAccount.challengeId?.rules
                      ?.maxDailyDrawdownPercent || 5}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <span className="text-gray-600">Overall Drawdown Limit</span>
                  <span className="text-red-500 font-bold">
                    {selectedChallengeAccount.challengeId?.rules
                      ?.maxOverallDrawdownPercent || 10}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <span className="text-gray-600">Profit Target</span>
                  <span className="text-green-500 font-bold">
                    {selectedChallengeAccount.challengeId?.rules
                      ?.profitTargetPhase1Percent || 8}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <span className="text-gray-600">Min Lot Size</span>
                  <span className="text-gray-900 font-bold">
                    {selectedChallengeAccount.challengeId?.rules?.minLotSize ||
                      0.01}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <span className="text-gray-600">Max Lot Size</span>
                  <span className="text-gray-900 font-bold">
                    {selectedChallengeAccount.challengeId?.rules?.maxLotSize ||
                      100}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-gray-100 rounded-lg p-3">
                  <span className="text-gray-600">Max Leverage</span>
                  <span className="text-gray-900 font-bold">
                    1:
                    {selectedChallengeAccount.challengeId?.rules?.maxLeverage ||
                      100}
                  </span>
                </div>
                {selectedChallengeAccount.challengeId?.rules
                  ?.stopLossMandatory && (
                  <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <Check size={18} className="text-yellow-500" />
                    <span className="text-yellow-500">
                      Stop Loss is REQUIRED on all trades
                    </span>
                  </div>
                )}
              </div>

              {/* Warning */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-500 font-medium mb-2">
                  ⚠️ Important Warning
                </p>
                <p className="text-gray-600 text-sm">
                  Breaking any of the above rules will result in immediate
                  account failure. Your challenge will be terminated and no
                  refund will be provided.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRulesModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRulesModal(false);
                    if (isMobile) {
                      navigate(
                        `/mobile?account=${selectedChallengeAccount._id}`,
                      );
                    } else {
                      navigate(
                        `/trade/${selectedChallengeAccount._id}?type=challenge`,
                      );
                    }
                  }}
                  className="flex-1 py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
                >
                  I Agree, Start Trading <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Failed Modal */}
      {showFailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-red-500/30">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <X size={24} className="text-red-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-500">
                    Challenge Failed
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Your challenge account has been terminated
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 font-medium mb-2">
                  Reason for Failure:
                </p>
                <p className="text-gray-900">{failReason}</p>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <p className="text-gray-600 text-sm mb-2">What happened?</p>
                <p className="text-gray-300 text-sm">
                  You violated the challenge rules multiple times. After 3
                  warnings for the same rule violation, your challenge account
                  is automatically failed. No refund is available for failed
                  challenges.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setShowFailModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View My Accounts
                </button>
                <button
                  onClick={() => {
                    setShowFailModal(false);
                    navigate("/challenge");
                  }}
                  className="w-full py-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Try a New Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <h3 className="text-gray-900 font-semibold text-lg mb-2">
                Archive Account?
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to archive{" "}
                <span className="text-gray-900 font-medium">
                  {showArchiveConfirm.accountId}
                </span>
                ? The account will be moved to archived and you won't be able to
                trade on it.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowArchiveConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleArchiveAccount(showArchiveConfirm._id)}
                className="flex-1 py-3 bg-red-500 text-gray-900 font-medium rounded-lg hover:bg-red-600 transition-colors"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm border border-gray-700">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X size={32} className="text-red-500" />
              </div>
              <h3 className="text-gray-900 font-semibold text-lg mb-2">
                Delete Permanently?
              </h3>
              <p className="text-gray-600 text-sm">
                Are you sure you want to permanently delete{" "}
                <span className="text-gray-900 font-medium">
                  {showDeleteConfirm.accountId}
                </span>
                ? This action cannot be undone and all account data will be lost
                forever.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAccount(showDeleteConfirm._id)}
                className="flex-1 py-3 bg-red-600 text-gray-900 font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Switch_Account;
