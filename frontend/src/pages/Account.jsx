// Account.jsx

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { TrendingUp } from "lucide-react";
import { API_URL } from "../config/api";
import Sidebar from "../components/Sidebar";
import NavbarClient from "../components/NavbarClient";
import { useSidebar } from "../context/SidebarContext";

export default function Account() {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
    const { sidebarExpanded } = useSidebar();

  const [accounts, setAccounts] = useState([]);
  const [openTrades, setOpenTrades] = useState([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  const [wallet, setWallet] = useState(null);

  const dropdownRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/user/login");
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/${user._id}`);
      const data = await res.json();
      setWallet(data.wallet);
    } catch (err) {
      console.error("Error fetching wallet", err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
      const data = await res.json();

      const accs = data.accounts || [];
      setAccounts(accs);
      /* 
      if (accs.length > 0) {
        setSelectedAccount(accs[0]); // default first account
      }
 */
      const storedAccount = JSON.parse(localStorage.getItem("selectedAccount"));

      if (storedAccount) {
        const matched = accs.find((a) => a._id === storedAccount._id);
        if (matched) {
          setSelectedAccount(matched);
          return;
        }
      }

      if (accs.length > 0) {
        setSelectedAccount(accs[0]);
      }
    } catch (err) {
      console.error("Error fetching accounts", err);
    }
  };

  const fetchOpenTrades = async () => {
    if (!selectedAccount) return;

    setLoadingTrades(true);

    try {
      const res = await fetch(`${API_URL}/trade/open/${selectedAccount._id}`);

      const data = await res.json();

      setOpenTrades(data.trades || []);
    } catch (err) {
      console.error("Error fetching trades", err);
    }

    setLoadingTrades(false);
  };

  useEffect(() => {
    if (user._id) {
      fetchAccounts();
      fetchWallet(); // ✅ ADDED
    }
  }, [user._id]);

  useEffect(() => {
    if (selectedAccount) {
      fetchOpenTrades();
    }
  }, [selectedAccount]);

  const balance = selectedAccount?.balance || 0;
  const credit = selectedAccount?.credit || 0;
  const leverage = selectedAccount?.leverage || "-";
  const walletBalance = wallet?.balance || 0; // ✅ ADDED
  const equity = balance + credit;
  const freeMargin = equity;

  // ✅ ADD THIS ABOVE return()

  const priorityOrder = ["Starter", "Pro Trader", "Zero", "Elite"];

  const sortedAccounts = [...accounts].sort((a, b) => {
    const aType = a.accountTypeId?.name || "";
    const bType = b.accountTypeId?.name || "";

    // ✅ Check using "includes" instead of exact match
    const getPriorityIndex = (type) => {
      const index = priorityOrder.findIndex((p) =>
        type.toLowerCase().includes(p.toLowerCase()),
      );
      return index === -1 ? 999 : index;
    };

    return getPriorityIndex(aType) - getPriorityIndex(bType);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen flex bg-[#f4f6fb] text-gray-800">
      {/* SIDEBAR */}
      <Sidebar activeMenu="Account" />

      {/* MAIN CONTENT */}
      <div
  className={`flex-1 flex flex-col p-6 transition-all duration-300 ${
    sidebarExpanded ? "ml-[280px]" : "ml-[64px]"
  }`}
>
        {/* TOP BAR */}

        <NavbarClient
          title="My Account"
          subtitle="Manage your trading accounts"
        />

        {/* PAGE CONTENT */}
        <div className="flex-1  sm:p-6 space-y-6 overflow-y-auto">
          {/* PROFILE SECTION */}
          <div className="bg-white rounded-xl border p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={`https://ui-avatars.com/api/?name=${storedUser.firstName || "User"}&background=random`}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
              />

              <div>
                <p className="text-xs sm:text-sm text-gray-500">
                  Trading Account
                </p>

                <h2 className="text-base sm:text-xl font-semibold">
                  {storedUser.firstName} {storedUser.lastName}
                </h2>

                <p className="text-xs sm:text-sm text-gray-500">
                  Account ID: {selectedAccount?.accountId || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* SWITCH ACCOUNT */}

              <button
                onClick={() =>
                  window.open(`/trade/${selectedAccount?._id}`, "_blank")
                }
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow"
              >
                <TrendingUp size={16} />
                Trade Now
              </button>

              {/* Switch Account */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm"
                >
                  Switch Account ▼
                </button>

                {showAccountDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50">
                    {/* ✅ If no accounts */}
                    {sortedAccounts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-600 text-center">
                        You don't have any Trading Account.
                        <br />
                        <button
                          onClick={() => {
                            // 👉 navigate to create account page (update route if needed)
                            window.location.href =
                              "/switch-account?create=true";
                          }}
                          className="mt-2 text-blue-500 hover:underline"
                        >
                          Create it
                        </button>
                      </div>
                    ) : (
                      /* ✅ If accounts exist */
                      sortedAccounts.map((acc) => (
                        <button
                          key={acc._id}
                          onClick={() => {
                            setSelectedAccount(acc);
                            localStorage.setItem(
                              "selectedAccount",
                              JSON.stringify(acc),
                            );
                            setShowAccountDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedAccount?._id === acc._id
                              ? "bg-gray-100 font-semibold"
                              : ""
                          }`}
                        >
                          {/* Account Type */}
                          <div className="font-medium">
                            {acc.accountTypeId?.name || "Account"}
                          </div>

                          {/* Account Number */}
                          <div className="text-gray-500 text-xs">
                            {acc.accountId}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* CREATE ACCOUNT */}

              <button
                onClick={() => navigate("/switch-account?create=true")}
                className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm"
              >
                + Create Account
              </button>
            </div>
          </div>

          {/* ACCOUNT STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-500">Available Balance</p>
              <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                ${balance.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-500">Equity</p>
              <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                ${equity.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-500">Credit</p>
              <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                ${credit.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-500">Free Margin</p>
              <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                ${freeMargin.toLocaleString()}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-500">Leverage</p>
              <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                {leverage}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-500">Wallet Balance</p>
              <h2 className="text-xl sm:text-2xl font-semibold mt-1">
                ${walletBalance.toLocaleString()} {/* ✅ CHANGED */}
              </h2>
            </div>
          </div>

          {/* BOTTOM SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* POSITIONS TABLE */}
            <div className="lg:col-span-2 bg-white border rounded-xl p-4 sm:p-5 overflow-x-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-sm sm:text-base">
                  Positions
                </h2>

                <button className="bg-blue-500 text-white px-3 py-2 rounded text-xs sm:text-sm">
                  Close All
                </button>
              </div>

              <table className="w-full text-sm min-w-[600px]">
                <thead className="border-b text-gray-500">
                  <tr>
                    <th className="text-left py-2">Symbol</th>
                    <th>Type</th>
                    <th>Lots</th>
                    <th>Entry Price</th>
                    <th>SL / TP</th>
                    <th>Profit</th>
                  </tr>
                </thead>

                <tbody>
                  {loadingTrades ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-gray-500"
                      >
                        Loading trades...
                      </td>
                    </tr>
                  ) : openTrades.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-4 text-gray-500"
                      >
                        No open positions
                      </td>
                    </tr>
                  ) : (
                    openTrades.map((trade) => (
                      <tr key={trade._id} className="border-b">
                        <td>{trade.symbol}</td>

                        <td
                          className={
                            trade.side === "BUY"
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {trade.side}
                        </td>

                        <td>{trade.quantity}</td>

                        <td>{trade.openPrice?.toFixed(5)}</td>

                        <td>
                          SL: {trade.stopLoss || "-"} <br />
                          TP: {trade.takeProfit || "-"}
                        </td>

                        <td className="text-blue-500">
                          {trade.realizedPnl
                            ? `$${trade.realizedPnl.toFixed(2)}`
                            : "Live"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ACCOUNT INFO */}
            <div className="bg-white border rounded-xl p-4 sm:p-5">
              <h2 className="font-semibold mb-4 text-sm sm:text-base">
                Account Information
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Account Number</span>

                  <span className="font-medium">
                    {selectedAccount?.accountId || "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Registration Date</span>

                  <span>
                    {selectedAccount?.createdAt
                      ? new Date(selectedAccount.createdAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Leverage</span>

                  <span>{selectedAccount?.leverage || "-"}</span>
                </div>

                <div className="flex justify-between">
                  <span>Open Date</span>

                  <span>
                    {selectedAccount?.createdAt
                      ? new Date(selectedAccount.createdAt).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Close Date</span>

                  <span>N/A</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}