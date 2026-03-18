
// Internal_Transfer.jsx

import { API_URL } from "../config/api";
import { ArrowRightLeft, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export const Internal_Transfer = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [wallet, setWallet] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [showInternalTransferModal, setShowInternalTransferModal] = useState(false);

  const [transferAmount, setTransferAmount] = useState("");
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  const [isMobile] = useState(window.innerWidth < 768);

  /* =========================
        FETCH ACCOUNTS
  ========================== */

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/trading-accounts/user/${user._id}`);
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error("Error fetching accounts", err);
    }
  };

  /* =========================
        FETCH WALLET
  ========================== */

  const fetchWallet = async () => {
    try {
      const res = await fetch(`${API_URL}/wallet/${user._id}`);
      const data = await res.json();
      setWallet(data.wallet);
    } catch (err) {
      console.error("Error fetching wallet", err);
    }
  };

  /* =========================
        BALANCE CHECK
  ========================== */

  const getFromBalance = () => {
    if (!fromAccount) return 0;

    if (fromAccount === "wallet") {
      return Number(wallet?.balance || 0);
    }

    const acc = accounts.find((a) => a._id === fromAccount);
    return Number(acc?.balance || 0);
  };

  const fromBalance = getFromBalance();
  const amountNum = Number(transferAmount || 0);
  const isInsufficientBalance = amountNum > fromBalance;

  /* =========================
        INTERNAL TRANSFER
  ========================== */

  const handleInternalTransfer = async () => {
    setError("");
    setSuccess("");

    if (!fromAccount || !toAccount) {
      return setError("Please select both accounts");
    }

    if (fromAccount === toAccount) {
      return setError("Cannot transfer to same account");
    }

    if (!transferAmount || amountNum <= 0) {
      return setError("Enter valid amount");
    }

    if (isInsufficientBalance) {
      return setError("Insufficient balance");
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/transfer/internal-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: user._id,
          fromAccount,
          toAccount,
          amount: amountNum
        })
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setSuccess("Transfer Successful ✔");

      // Reset fields
      setTransferAmount("");
      setFromAccount("");
      setToAccount("");

      // Refresh UI data
      fetchAccounts();
      fetchWallet();

    } catch (err) {
      console.error(err);
      setError("Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
        LOAD DATA
  ========================== */

  useEffect(() => {
    if (user._id) {
      fetchAccounts();
      fetchWallet();
    }
  }, []);

  /* =========================
        UI
  ========================== */

  return (
    <>
      {/* BUTTON */}
      <button
        onClick={() => {
          setShowInternalTransferModal(true);
          setError("");
          setSuccess("");
        }}
        className={`flex items-center gap-2 bg-blue-500 text-white font-medium ${
          isMobile ? "px-4 py-2 text-sm" : "px-6 py-3"
        } rounded-lg hover:bg-blue-600 transition`}
      >
        <ArrowRightLeft size={isMobile ? 16 : 20} />
        Internal Transfer
      </button>

      {/* MODAL */}
      {showInternalTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl border border-gray-200">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Internal Transfer
              </h3>

              <button
                onClick={() => setShowInternalTransferModal(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>

            {/* FROM / TO */}
            <div className="grid grid-cols-2 gap-4 mb-6">

              {/* FROM */}
              <div>
                <label className="text-sm text-gray-500">From</label>

                <select
                  value={fromAccount}
                  onChange={(e) => {
                    setFromAccount(e.target.value);
                    setToAccount("");
                  }}
                  className="w-full border rounded-lg px-3 py-3 mt-2"
                >
                  <option value="">Select Account</option>

                  <option value="wallet">
                    Wallet - ${wallet?.balance?.toLocaleString() || "0"}
                  </option>

                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.accountId} - $
                      {Number(acc.balance || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* TO */}
              <div>
                <label className="text-sm text-gray-500">To</label>

                <select
                  value={toAccount}
                  onChange={(e) => setToAccount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-3 mt-2"
                >
                  <option value="">Select Account</option>

                  {fromAccount !== "wallet" && (
                    <option value="wallet">
                      Wallet - ${wallet?.balance?.toLocaleString() || "0"}
                    </option>
                  )}

                  {accounts
                    .filter((acc) => acc._id !== fromAccount)
                    .map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.accountId} - $
                        {Number(acc.balance || 0).toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* AMOUNT */}
            <div className="mb-4">
              <label className="text-sm text-gray-500">Amount ($)</label>

              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full border rounded-lg px-4 py-3 mt-2"
              />

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInternalTransferModal(false)}
                className="px-6 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                disabled={loading}
                onClick={handleInternalTransfer}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};