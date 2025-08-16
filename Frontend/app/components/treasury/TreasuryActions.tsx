"use client";

import { useState } from "react";
import { Banknote, Loader2, TrendingUp } from "lucide-react";

interface TreasuryActionsProps {
  isDepositing: boolean;
  loading: boolean;
  handleDeposit: (e: React.FormEvent) => Promise<void>;
  depositAmount: string;
  setDepositAmount: (value: string) => void;
  isWithdrawing: boolean;
  handleWithdraw: (e: React.FormEvent) => Promise<void>;
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
}

const TreasuryActions = ({ 
  isDepositing, 
  loading, 
  handleDeposit, 
  depositAmount, 
  setDepositAmount, 
  isWithdrawing, 
  handleWithdraw, 
  withdrawAmount, 
  setWithdrawAmount 
}: TreasuryActionsProps) => {
  const [activeTab, setActiveTab] = useState("deposit");

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <div className="flex border-b border-[var(--border-color)] mb-4">
        <button
          className={`px-4 py-2 text-lg font-semibold transition-colors ${
            activeTab === "deposit" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`px-4 py-2 text-lg font-semibold transition-colors ${
            activeTab === "withdraw" ? "text-[var(--primary-color)] border-b-2 border-[var(--primary-color)]" : "text-gray-400"
          }`}
          onClick={() => setActiveTab("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {activeTab === "deposit" && (
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
            <TrendingUp className="mr-2 text-[var(--primary-color)]" size={20} />
            Deposit to Treasury
          </h3>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <Banknote className="mr-2 text-[var(--primary-color)]" size={16} />
                Amount (USDC)
              </label>
              <input
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="100"
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isDepositing || loading}
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                isDepositing || loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg"
              }`}
            >
              {isDepositing || loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={18} />
                  <span>Deposit USDC</span>
                </>
              )}
            </button>
            <p className="text-xs text-[var(--primary-color)] mt-2">
              Mock implementation. Real treasury deposits would be used in production.
            </p>
          </form>
        </div>
      )}

      {activeTab === "withdraw" && (
        <div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
            <Banknote className="mr-2 text-[var(--primary-color)]" size={20} />
            Withdraw from Treasury
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <Banknote className="mr-2 text-[var(--primary-color)]" size={16} />
                Amount (USDC)
              </label>
              <input
                type="text"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="100"
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isWithdrawing || loading}
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                isWithdrawing || loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg"
              }`}
            >
              {isWithdrawing || loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Banknote size={18} />
                  <span>Withdraw USDC</span>
                </>
              )}
            </button>
            <p className="text-xs text-[var(--primary-color)] mt-2">
              Mock implementation. Real treasury withdrawals would be used in production.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default TreasuryActions;