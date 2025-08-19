'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getTreasuryBalance, depositFunds, withdrawFunds } from '../utils/web3';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { Shield, Wallet, Zap, ChevronDown, ChevronUp, Banknote, TrendingUp, Loader2 } from 'lucide-react';
import TreasuryStats from './treasury/TreasuryStats';
import TreasuryActions from './treasury/TreasuryActions';
import TreasuryInfo from './treasury/TreasuryInfo';
import KeyMetrics from './treasury/KeyMetrics';
import UserStats from './treasury/UserStats';
import RecentTransactions from './treasury/RecentTransactions';
import dynamic from 'next/dynamic';

// Dynamically import charts to reduce initial bundle size
const TreasuryChart = dynamic(() => import('./treasury/TreasuryChart'), { ssr: false });
const HistoricalPerformanceChart = dynamic(() => import('./treasury/HistoricalPerformanceChart'), { ssr: false });

interface TreasuryData {
  totalValueLocked: string;
  totalLoans: string;
  availableLiquidity: string;
  utilizationRate: string;
  apy: string;
  protocolRevenue: string;
  depositors: number;
  userDeposit: string;
  estimatedEarnings: string;
}

interface UserBalance {
  total: number;
  profits: number;
  withdrawable: number;
  walletUSDC: number;
}

const TreasuryScreen: React.FC = () => {
  const { isConnected, userAddress } = useWallet();
  const { transactions, trackTransaction } = useTransactionTracker();
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({
    totalValueLocked: '0',
    totalLoans: '0',
    availableLiquidity: '0',
    utilizationRate: '0',
    apy: '0',
    protocolRevenue: '0',
    depositors: 0,
    userDeposit: '0',
    estimatedEarnings: '0',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'deposit' | 'withdraw' | 'details'>('overview');
  const [isChartsOpen, setIsChartsOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const TREASURY_CONTRACT_ADDRESS = '0x793310d9254D801EF86f829264F04940139e9297';

  // Simple in-memory cache
  let cache: TreasuryData | null = null;

  const userBalance: UserBalance = {
    total: parseFloat(treasuryData.userDeposit),
    profits: parseFloat(treasuryData.estimatedEarnings),
    withdrawable: parseFloat(treasuryData.userDeposit) + parseFloat(treasuryData.estimatedEarnings),
    walletUSDC: 500, // Mock, replace with real wallet balance
  };

  const loadTreasuryData = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    if (cache) {
      setTreasuryData(cache);
      return;
    }
    setLoading(true);
    try {
      const balance = await getTreasuryBalance();
      const totalValueLocked = parseFloat(balance);
      const totalLoans = totalValueLocked * 0.7; // Mock 70% loans
      const availableLiquidity = totalValueLocked - totalLoans;
      const utilizationRate = totalValueLocked > 0 ? (totalLoans / totalValueLocked) * 100 : 0;
      const baseApy = 2.5;
      const apy = baseApy + (utilizationRate / 100) * 5;
      const protocolRevenue = totalLoans * 0.05;
      const depositors = Math.floor(totalValueLocked / 5000);
      const userDeposit = parseFloat(balance) * 0.1; // Mock: 10% of TVL as user deposit
      const estimatedEarnings = (userDeposit * (apy / 100)).toFixed(2);

      const data: TreasuryData = {
        totalValueLocked: totalValueLocked.toFixed(2),
        totalLoans: totalLoans.toFixed(2),
        availableLiquidity: availableLiquidity.toFixed(2),
        utilizationRate: utilizationRate.toFixed(0),
        apy: apy.toFixed(2),
        protocolRevenue: protocolRevenue.toFixed(2),
        depositors,
        userDeposit: userDeposit.toFixed(2),
        estimatedEarnings,
      };
      cache = data;
      setTreasuryData(data);
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(`Error fetching treasury data: ${error.message}`);
      toast.error(`Error: ${error.message}`, { style: { background: '#1a1a1a', color: '#ffffff' } });
    } finally {
      setLoading(false);
    }
  }, [isConnected, userAddress]);

  const handleDeposit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isConnected || !userAddress) {
        toast.error('Wallet not connected', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      if (parseFloat(depositAmount) <= 0 || isNaN(parseFloat(depositAmount))) {
        toast.error('Invalid deposit amount', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      setIsDepositing(true);
      const toastId = toast.loading(`Depositing ${depositAmount} USDC...`, {
        style: { background: '#1a1a1a', color: '#ffffff' },
      });
      try {
        const success = await depositFunds(depositAmount);
        if (success) {
          const transactionHash = ethers.hexlify(ethers.randomBytes(32));
          trackTransaction(transactionHash, 'deposit', depositAmount, 'USDC');
          await loadTreasuryData();
          toast.success(`Deposited ${depositAmount} USDC to treasury!`, {
            id: toastId,
            style: { background: '#1a1a1a', color: '#ffffff' },
          });
          setDepositAmount('');
        } else {
          toast.error('Failed to deposit funds', { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message}`, { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
      } finally {
        setIsDepositing(false);
      }
    },
    [isConnected, userAddress, depositAmount, trackTransaction, loadTreasuryData]
  );

  const handleWithdraw = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isConnected || !userAddress) {
        toast.error('Wallet not connected', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      if (parseFloat(withdrawAmount) <= 0 || isNaN(parseFloat(withdrawAmount))) {
        toast.error('Invalid withdraw amount', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      if (parseFloat(withdrawAmount) > parseFloat(treasuryData.availableLiquidity)) {
        toast.error('Withdrawal exceeds available liquidity', {
          style: { background: '#1a1a1a', color: '#ffffff' },
        });
        return;
      }
      setIsWithdrawing(true);
      const toastId = toast.loading(`Withdrawing ${withdrawAmount} USDC...`, {
        style: { background: '#1a1a1a', color: '#ffffff' },
      });
      try {
        const success = await withdrawFunds(withdrawAmount);
        if (success) {
          const transactionHash = ethers.hexlify(ethers.randomBytes(32));
          trackTransaction(transactionHash, 'withdraw', withdrawAmount, 'USDC');
          await loadTreasuryData();
          toast.success(`Withdrew ${withdrawAmount} USDC from treasury!`, {
            id: toastId,
            style: { background: '#1a1a1a', color: '#ffffff' },
          });
          setWithdrawAmount('');
        } else {
          toast.error('Failed to withdraw funds', { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message}`, { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
      } finally {
        setIsWithdrawing(false);
      }
    },
    [isConnected, userAddress, withdrawAmount, treasuryData.availableLiquidity, trackTransaction, loadTreasuryData]
  );

  useEffect(() => {
    if (isConnected) {
      loadTreasuryData();
    }
  }, [isConnected, loadTreasuryData]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8 bg-[var(--background)]">
      <div className="flex flex-col items-center ">
        <h2 className="text-3xl font-bold text-[var(--primary-color)] flex items-center">
        Treasury
        </h2>
      </div>

      {errorMessage && (
        <div className="bg-red-800/30 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <Shield className="text-red-400 mr-2" />
          <p className="text-red-200">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
            <p className="text-[var(--foreground)] mb-6">Connect your wallet to view treasury data</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-[var(--border-color)] mb-6">
            <nav className="-mb-px flex gap-4 sm:gap-6 ">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === 'overview'
                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                    : 'border-transparent text-[var(--foreground)] hover:text-[var(--primary-color)] hover:border-gray-500'
                }`}
                aria-label="View treasury overview"
              >
                <Zap className="mr-2 h-4 w-4" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === 'stats'
                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                    : 'border-transparent text-[var(--foreground)] hover:text-[var(--primary-color)] hover:border-gray-500'
                }`}
                aria-label="View your stats"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Your Stats
              </button>
              <button
                onClick={() => setActiveTab('deposit')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === 'deposit'
                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                    : 'border-transparent text-[var(--foreground)] hover:text-[var(--primary-color)] hover:border-gray-500'
                }`}
                aria-label="Deposit to treasury"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Deposit
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === 'withdraw'
                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                    : 'border-transparent text-[var(--foreground)] hover:text-[var(--primary-color)] hover:border-gray-500'
                }`}
                aria-label="Withdraw from treasury"
              >
                <Banknote className="mr-2 h-4 w-4" />
                Withdraw
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-3 sm:px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === 'details'
                    ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                    : 'border-transparent text-[var(--foreground)] hover:text-[var(--primary-color)] hover:border-gray-500'
                }`}
                aria-label="View treasury details"
              >
                <Shield className="mr-2 h-4 w-4" />
                Details
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <TreasuryStats loading={loading} treasuryData={treasuryData} />
              <KeyMetrics treasuryData={treasuryData} loading={loading} />
            </div>
          )}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <UserStats userStats={treasuryData} loading={loading} />
              <TreasuryActions userBalance={userBalance} />
            </div>
          )}
          {activeTab === 'deposit' && (
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
                <TrendingUp className="mr-2 text-[var(--primary-color)]" size={20} />
                Deposit to Treasury
              </h3>
              <form onSubmit={handleDeposit} className="space-y-4 max-w-md mx-auto">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-[var(--foreground)] flex items-center">
                      <Banknote className="mr-2 text-[var(--primary-color)]" size={16} />
                      Amount (USDC)
                    </label>
                    <span className="text-xs text-[var(--primary-color)]">
                      Wallet Balance: {userBalance.walletUSDC.toFixed(2)} USDC
                    </span>
                  </div>
                  <input
                    type="text"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="100"
                    className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                    required
                    aria-label="Deposit amount in USDC"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isDepositing || loading}
                  className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isDepositing || loading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg'
                  }`}
                  aria-label="Deposit USDC"
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
          {activeTab === 'withdraw' && (
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
                <Banknote className="mr-2 text-[var(--primary-color)]" size={20} />
                Withdraw from Treasury
              </h3>
              <form onSubmit={handleWithdraw} className="space-y-4 max-w-md mx-auto">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-[var(--foreground)] flex items-center">
                      <Banknote className="mr-2 text-[var(--primary-color)]" size={16} />
                      Amount (USDC)
                    </label>
                    <span className="text-xs text-[var(--primary-color)]">
                      Withdrawable: {userBalance.withdrawable.toFixed(2)} USDC
                    </span>
                  </div>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="100"
                    className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                    required
                    aria-label="Withdraw amount in USDC"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isWithdrawing || loading}
                  className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                    isWithdrawing || loading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg'
                  }`}
                  aria-label="Withdraw USDC"
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
          {activeTab === 'details' && (
            <TreasuryInfo treasuryContractAddress={TREASURY_CONTRACT_ADDRESS} />
          )}

          {/* Charts Dropdown */}
          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <button
              onClick={() => setIsChartsOpen(!isChartsOpen)}
              className="w-full flex items-center justify-between text-xl font-semibold text-[var(--foreground)]"
              aria-label={isChartsOpen ? 'Collapse charts' : 'Expand charts'}
            >
              <span className="flex items-center">
                View Charts
              </span>
              {isChartsOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isChartsOpen && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  <HistoricalPerformanceChart loading={loading} totalValueLocked={parseFloat(treasuryData.totalValueLocked)} />
                </div>
                <div className="lg:col-span-2">
                  <TreasuryChart loading={loading} treasuryData={treasuryData} />
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <RecentTransactions transactions={transactions} />
        </div>
      )}
    </div>
  );
};

export default TreasuryScreen;