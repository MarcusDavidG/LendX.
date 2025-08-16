"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "../contexts/WalletContext";
import { getTreasuryBalance, depositFunds, withdrawFunds, getGasFee, getConfirmationTime } from "../utils/web3";
import { useTransactionTracker } from "../hooks/useTransactionTracker";
import ConnectWalletButton from "./ConnectWalletButton";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import { Shield, Wallet, Zap, Clock } from "lucide-react";
import TreasuryStats from "./treasury/TreasuryStats";
import TreasuryChart from "./treasury/TreasuryChart";
import TreasuryActions from "./treasury/TreasuryActions";
import TreasuryInfo from "./treasury/TreasuryInfo";
import RecentTransactions from "./treasury/RecentTransactions";
import KeyMetrics from "./treasury/KeyMetrics";
import HistoricalPerformanceChart from "./treasury/HistoricalPerformanceChart";

interface TreasuryData {
  totalDeposits: string;
  totalLoans: string;
  availableLiquidity: string;
  utilizationRate: string;
}

const TreasuryScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { transactions, trackTransaction } = useTransactionTracker();
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({
    totalDeposits: "0",
    totalLoans: "0",
    availableLiquidity: "0",
    utilizationRate: "0",
  });
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gasFee, setGasFee] = useState("~$0.001");
  const [confirmationTime, setConfirmationTime] = useState("~2s");

  const TREASURY_CONTRACT_ADDRESS = "0x793310d9254D801EF86f829264F04940139e9297";

  const loadTreasuryData = useCallback(async () => {
    setLoading(true);
    try {
      const balance = await getTreasuryBalance();
      const totalDeposits = parseFloat(balance).toFixed(2);
      const totalLoans = (parseFloat(totalDeposits) * 0.7).toFixed(2); // Mock 70% loans
      const availableLiquidity = (parseFloat(totalDeposits) - parseFloat(totalLoans)).toFixed(2);
      const utilizationRate = totalDeposits !== "0.00" ? ((parseFloat(totalLoans) / parseFloat(totalDeposits)) * 100).toFixed(0) : "0";
      setTreasuryData({
        totalDeposits,
        totalLoans,
        availableLiquidity,
        utilizationRate,
      });
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(`Error fetching treasury data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const fee = await getGasFee();
      const time = await getConfirmationTime();
      setGasFee(fee);
      setConfirmationTime(time);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      loadTreasuryData();
      fetchMetrics();
    }
  }, [isConnected, loadTreasuryData, fetchMetrics]);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !userAddress) {
      toast.error("Wallet not connected");
      return;
    }
    if (parseFloat(depositAmount) <= 0 || isNaN(parseFloat(depositAmount))) {
      toast.error("Invalid deposit amount");
      return;
    }

    setIsDepositing(true);
    const toastId = toast.loading(`Depositing ${depositAmount} USDC...`);
    try {
      const success = await depositFunds(depositAmount);
      if (success) {
        const transactionHash = ethers.hexlify(ethers.randomBytes(32));
        trackTransaction(transactionHash, "deposit", depositAmount, "USDC");
        loadTreasuryData(); // Refresh data
        toast.success(`Deposited ${depositAmount} USDC to treasury!`, { id: toastId });
        setDepositAmount("");
      } else {
        toast.error("Failed to deposit funds", { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !userAddress) {
      toast.error("Wallet not connected");
      return;
    }
    if (parseFloat(withdrawAmount) <= 0 || isNaN(parseFloat(withdrawAmount))) {
      toast.error("Invalid withdraw amount");
      return;
    }
    if (parseFloat(withdrawAmount) > parseFloat(treasuryData.availableLiquidity)) {
      toast.error("Withdrawal amount exceeds available liquidity.");
      return;
    }

    setIsWithdrawing(true);
    const toastId = toast.loading(`Withdrawing ${withdrawAmount} USDC...`);
    try {
      const success = await withdrawFunds(withdrawAmount);
      if (success) {
        const transactionHash = ethers.hexlify(ethers.randomBytes(32));
        trackTransaction(transactionHash, "withdraw", withdrawAmount, "USDC");
        loadTreasuryData(); // Refresh data
        toast.success(`Withdrew ${withdrawAmount} USDC from treasury!`, { id: toastId });
        setWithdrawAmount("");
      } else {
        toast.error("Failed to withdraw funds", { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border-color)]">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-">
          <h2 className="text-3xl font-bold text-[var(--primary-color)]">LendX Treasury</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-white">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>{confirmationTime} confirmations</span>
          </div>
          <div className="flex items-center">
            <Shield size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>{gasFee} fees</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-800 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <Shield className="text-red-400 mr-2" />
          <p className="text-red-200">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to view treasury data</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <TreasuryStats loading={loading} treasuryData={treasuryData} />
          <KeyMetrics />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <HistoricalPerformanceChart loading={loading} />
            </div>
            <div className="lg:col-span-2">
              <TreasuryChart loading={loading} treasuryData={treasuryData} />
            </div>
          </div>
          <TreasuryActions
            isDepositing={isDepositing}
            loading={loading}
            handleDeposit={handleDeposit}
            depositAmount={depositAmount}
            setDepositAmount={setDepositAmount}
            isWithdrawing={isWithdrawing}
            handleWithdraw={handleWithdraw}
            withdrawAmount={withdrawAmount}
            setWithdrawAmount={setWithdrawAmount}
          />
          <TreasuryInfo treasuryContractAddress={TREASURY_CONTRACT_ADDRESS} />
          {transactions.filter((tx) => tx.type === "deposit" || tx.type === "withdraw").length > 0 && (
            <RecentTransactions transactions={transactions} />
          )}
        </div>
      )}
    </div>
  );
};

export default TreasuryScreen;
