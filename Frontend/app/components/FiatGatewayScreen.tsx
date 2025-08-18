'use client';

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useWallet } from "../contexts/WalletContext";
import { useTransactionTracker } from "../hooks/useTransactionTracker";
import { getBalance, TOKEN_ADDRESSES, TOKEN_DECIMALS } from "../utils/web3";
import { Loader2, Banknote, AlertCircle } from "lucide-react";

const MOCK_EXCHANGE_RATES = {
  USDC: 1600,
  STK: 2080, 
};

const FiatGatewayScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();

  const [gatewayType, setGatewayType] = useState('deposit'); // 'deposit' or 'withdraw'

  // Off-ramp state
  const [token, setToken] = useState("USDC");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [nairaAmount, setNairaAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [balance, setBalance] = useState("0");

  // On-ramp state
  const [depositAmount, setDepositAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  type Transaction = {
    id: string;
    type: 'Deposit' | 'Withdrawal';
    nairaAmount: string;
    usdcAmount?: string;
    token?: string;
    amount?: string;
    bankName?: string;
    accountNumber?: string;
    status: 'Success' | 'Failed';
    date: string;
  };

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (isConnected && userAddress) {
      fetchBalance();
      loadTransactions();
    }
  }, [isConnected, userAddress, token]);

  useEffect(() => {
    if (gatewayType === 'withdraw') {
      const rate = MOCK_EXCHANGE_RATES[token as keyof typeof MOCK_EXCHANGE_RATES];
      const numericAmount = parseFloat(withdrawAmount);
      if (rate && numericAmount > 0) {
        setNairaAmount((numericAmount * rate).toFixed(2));
      } else {
        setNairaAmount("");
      }
    } else {
      const rate = MOCK_EXCHANGE_RATES["USDC"];
      const numericAmount = parseFloat(depositAmount);
      if (rate && numericAmount > 0) {
        setUsdcAmount((numericAmount / rate).toFixed(2));
      } else {
        setUsdcAmount("");
      }
    }
  }, [withdrawAmount, token, depositAmount, gatewayType]);

  useEffect(() => {
    setNairaAmount("");
  }, [token]);

  const fetchBalance = async () => {
    try {
      const bal = await getBalance(token);
      setBalance(bal);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      toast.error("Failed to fetch token balance.");
    }
  };

  const loadTransactions = () => {
    const storedTransactions = localStorage.getItem("fiatGatewayTransactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  };

  const saveTransaction = (newTx: Transaction) => {
    const newTransactions = [newTx, ...transactions].slice(0, 5);
    setTransactions(newTransactions);
    localStorage.setItem("fiatGatewayTransactions", JSON.stringify(newTransactions));
  };

  const handleOnramp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(depositAmount) <= 0) {
      return toast.error("Invalid deposit amount.");
    }

    setIsDepositing(true);
    const toastId = toast.loading("Processing deposit...");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      toast.success("Deposit successful!", { id: toastId });
      const txId = `TXN${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'Deposit',
        nairaAmount: depositAmount,
        usdcAmount,
        status: "Success",
        date: new Date().toLocaleString(),
      };
      saveTransaction(newTx);
      trackTransaction(txId, "deposit", usdcAmount, "USDC");
      setDepositAmount("");
      fetchBalance(); // Refetch balance to show updated USDC
    } else {
      toast.error("Deposit failed. Please try again.", { id: toastId });
      const txId = `TXN${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'Deposit',
        nairaAmount: depositAmount,
        usdcAmount,
        status: "Failed",
        date: new Date().toLocaleString(),
      };
      saveTransaction(newTx);
    }

    setIsDepositing(false);
  };

  const handleOfframp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(withdrawAmount) > parseFloat(balance)) {
      return toast.error("Insufficient balance.");
    }
    if (!bankName || !accountNumber) {
      return toast.error("Please provide bank details.");
    }

    setIsWithdrawing(true);
    const toastId = toast.loading("Processing withdrawal...");

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      toast.success("Withdrawal successful!", { id: toastId });
      const txId = `TXN${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'Withdrawal',
        token,
        amount: withdrawAmount,
        nairaAmount,
        bankName,
        accountNumber: `****${accountNumber.slice(-4)}`,
        status: "Success",
        date: new Date().toLocaleString(),
      };
      saveTransaction(newTx);
      trackTransaction(txId, "withdraw", withdrawAmount, token);
      setWithdrawAmount("");
      setBankName("");
      setAccountNumber("");
      fetchBalance();
    } else {
      toast.error("Withdrawal failed. Please try again.", { id: toastId });
      const txId = `TXN${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'Withdrawal',
        token,
        amount: withdrawAmount,
        nairaAmount,
        bankName,
        accountNumber: `****${accountNumber.slice(-4)}`,
        status: "Failed",
        date: new Date().toLocaleString(),
      };
      saveTransaction(newTx);
    }

    setIsWithdrawing(false);
  };

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
      <div className="flex border-b border-[var(--border-color)] mb-4">
        <button
          className={`px-4 py-2 text-lg font-semibold transition-colors ${
            gatewayType === 'deposit'
              ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]"
              : "text-gray-400"
          }`}
          onClick={() => setGatewayType('deposit')}
        >
          Deposit (Naira to Crypto)
        </button>
        <button
          className={`px-4 py-2 text-lg font-semibold transition-colors ${
            gatewayType === 'withdraw'
              ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]"
              : "text-gray-400"
          }`}
          onClick={() => setGatewayType('withdraw')}
        >
          Withdraw (Crypto to Naira)
        </button>
      </div>

      {gatewayType === 'deposit' ? (
        <form onSubmit={handleOnramp} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
              Amount (NGN)
            </label>
            <input
              type="text"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="10000"
              className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              required
            />
            {usdcAmount && (
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                You'll receive: {usdcAmount} USDC
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isDepositing || !isConnected}
            className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              isDepositing || !isConnected
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-[var(--primary-color)] hover:bg-emerald-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {isDepositing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Processing...</span>
              </>
            ) : (
              "Deposit Naira"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOfframp} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
              Token to Withdraw
            </label>
            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
            >
              <option value="USDC">USDC</option>
              <option value="STK">STK</option>
            </select>
            <div className="text-xs text-[var(--primary-color)] mt-1">
              Available: {parseFloat(balance).toFixed(4)} {token}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
              Amount ({token})
            </label>
            <input
              type="text"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.0"
              className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              required
            />
            {nairaAmount && (
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                You'll receive: ₦{nairaAmount}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
              Bank Name
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g., Guaranty Trust Bank"
              className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0123456789"
              className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isWithdrawing || !isConnected}
            className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              isWithdrawing || !isConnected
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-[var(--primary-color)] hover:bg-emerald-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Processing...</span>
              </>
            ) : (
              "Withdraw to Bank"
            )}
          </button>
        </form>
      )}

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">Recent Transactions</h4>
        <div className="space-y-2">
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="bg-[var(--input-background)] p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold">
                      {tx.type === 'Deposit'
                        ? `₦${tx.nairaAmount} → ${tx.usdcAmount} USDC`
                        : `${tx.amount} ${tx.token} → ₦${tx.nairaAmount}`}
                    </p>
                    {tx.type === 'Withdrawal' && (
                        <p className="text-xs text-[var(--text-secondary)]">{tx.bankName} - {tx.accountNumber}</p>
                    )}
                  </div>
                  <div className={`font-bold ${tx.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.status}
                  </div>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{tx.date}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No recent transactions.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiatGatewayScreen;