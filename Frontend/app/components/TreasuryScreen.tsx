"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NextRequest } from 'next/server';
import { useWallet } from '../contexts/WalletContext';
import { getTreasuryBalance, depositFunds, getGasFee, getConfirmationTime } from '../utils/web3';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { 
  ArrowRight, Banknote, Clock, Copy, 
  ExternalLink, Loader2, PieChart, 
  RefreshCw, Shield, TrendingUp, Wallet, Zap 
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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
    totalDeposits: '0',
    totalLoans: '0',
    availableLiquidity: '0',
    utilizationRate: '0'
  });
  const [loading, setLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');

  const TREASURY_CONTRACT_ADDRESS = '0x793310d9254D801EF86f829264F04940139e9297';

  const loadTreasuryData = useCallback(async () => {
    setLoading(true);
    try {
      const balance = await getTreasuryBalance();
      const totalDeposits = parseFloat(balance).toFixed(2);
      const totalLoans = (parseFloat(totalDeposits) * 0.7).toFixed(2); // Mock 70% loans
      const availableLiquidity = (parseFloat(totalDeposits) - parseFloat(totalLoans)).toFixed(2);
      const utilizationRate = ((parseFloat(totalLoans) / parseFloat(totalDeposits)) * 100).toFixed(0);
      setTreasuryData({
        totalDeposits,
        totalLoans,
        availableLiquidity,
        utilizationRate
      });
      setErrorMessage('');
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
      console.error('Error fetching metrics:', error);
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
      toast.error('Wallet not connected');
      return;
    }
    if (parseFloat(depositAmount) <= 0 || isNaN(parseFloat(depositAmount))) {
      toast.error('Invalid deposit amount');
      return;
    }

    setIsDepositing(true);
    const toastId = toast.loading(`Depositing ${depositAmount} USDC...`);
    try {
      const success = await depositFunds(depositAmount);
      if (success) {
        const transactionHash = ethers.hexlify(ethers.randomBytes(32));
        trackTransaction(transactionHash, 'deposit', depositAmount, 'USDC');
        setTreasuryData(prev => {
          const newDeposits = (parseFloat(prev.totalDeposits) + parseFloat(depositAmount)).toFixed(2);
          const newLoans = (parseFloat(newDeposits) * 0.7).toFixed(2);
          const newLiquidity = (parseFloat(newDeposits) - parseFloat(newLoans)).toFixed(2);
          const newUtilization = ((parseFloat(newLoans) / parseFloat(newDeposits)) * 100).toFixed(0);
          return {
            totalDeposits: newDeposits,
            totalLoans: newLoans,
            availableLiquidity: newLiquidity,
            utilizationRate: newUtilization
          };
        });
        toast.success(`Deposited ${depositAmount} USDC to treasury!`, { id: toastId });
        setDepositAmount('');
      } else {
        toast.error('Failed to deposit funds', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsDepositing(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(TREASURY_CONTRACT_ADDRESS);
    toast.success('Contract address copied to clipboard');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return <TrendingUp size={16} className="text-[var(--primary-color)]" />;
      case 'loan': return <Banknote size={16} className="text-[var(--primary-color)]" />;
      case 'send': return <ArrowRight size={16} className="text-purple-400" />;
      default: return <RefreshCw size={16} className="text-white" />;
    }
  };

  const chartData = {
    labels: ['Total Deposits', 'Total Loans', 'Available Liquidity'],
    datasets: [
      {
        data: [
          parseFloat(treasuryData.totalDeposits),
          parseFloat(treasuryData.totalLoans),
          parseFloat(treasuryData.availableLiquidity)
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // emerald-500
          'rgba(59, 130, 246, 0.8)', // blue-500
          'rgba(147, 51, 234, 0.8)'  // purple-500
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(147, 51, 234, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: $${context.parsed}`;
          }
        }
      }
    }
  };

  return (
    <div className="max-w-full mx-auto p-6 bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border-color)]">
      <div className="flex flex-col items-center mb-6">

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
          <Shield className="text-[var(--primary-color)] mr-2" />
          <p className="text-red-200">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
            <p className="text-white mb-6">Connect your wallet to view treasury data</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <PieChart className="mr-2 text-[var(--primary-color)]" />
              Treasury Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <div className="flex items-center mb-2">
                  <TrendingUp className="text-[var(--primary-color)] mr-2" />
                  <h3 className="text-sm font-medium text-white">Total Deposits</h3>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  ${loading ? '...' : treasuryData.totalDeposits}
                </p>
              </div>
              <div className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <div className="flex items-center mb-2">
                  <Banknote className="text-[var(--primary-color)] mr-2" />
                  <h3 className="text-sm font-medium text-white">Total Loans</h3>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  ${loading ? '...' : treasuryData.totalLoans}
                </p>
              </div>
              <div className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <div className="flex items-center mb-2">
                  <PieChart className="text-[var(--primary-color)] mr-2" />
                  <h3 className="text-sm font-medium text-white">Available Liquidity</h3>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  ${loading ? '...' : treasuryData.availableLiquidity}
                </p>
              </div>
              <div className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <div className="flex items-center mb-2">
                  <Shield className="text-[var(--primary-color)] mr-2" />
                  <h3 className="text-sm font-medium text-white">Utilization Rate</h3>
                </div>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {loading ? '...' : treasuryData.utilizationRate}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <PieChart className="mr-2 text-[var(--primary-color)]" />
              Treasury Distribution
            </h3>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin rounded-full h-8 w-8 text-[var(--primary-color)] mx-auto" />
                <p className="text-white mt-2">Loading treasury data...</p>
              </div>
            ) : (
              <div className="h-64">
                <Pie data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <Banknote className="mr-2 text-[var(--primary-color)]" />
              Treasury Contract
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white">Contract Address:</span>
                <div className="flex items-center">
                  <span className="font-mono text-sm text-[var(--foreground)]">
                    {TREASURY_CONTRACT_ADDRESS.substring(0, 6)}...
                    {TREASURY_CONTRACT_ADDRESS.substring(38)}
                  </span>
                  <button 
                    onClick={copyAddress}
                    className="ml-2 text-white hover:text-[var(--primary-color)]"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Network:</span>
                <span className="font-medium text-[var(--foreground)]">Sonic Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Status:</span>
                <span className="text-[var(--primary-color)] font-medium flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <TrendingUp className="mr-2 text-[var(--primary-color)]" />
              Deposit to Treasury
            </h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                  <Banknote className="mr-2 text-[var(--primary-color)]" size={16} />
                  Amount (USDC)
                </label>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.]/g, ''))}
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
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg'
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
              <p className="text-xs text-white mt-2">
                Mock implementation. Real treasury deposits would be used in production.
              </p>
            </form>
          </div>

          {transactions.filter(tx => tx.type === 'deposit').length > 0 && (
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
                <RefreshCw className="mr-2 text-[var(--primary-color)]" />
                Recent Treasury Transactions
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {transactions
                  .filter(tx => tx.type === 'deposit')
                  .map(tx => (
                    <div key={tx.hash} className="p-3 bg-[var(--input-background)] rounded-lg hover:bg-gray-700 transition-colors">
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="capitalize font-medium text-[var(--foreground)]">{tx.type}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'success'
                                  ? 'bg-emerald-600 text-[var(--foreground)]'
                                  : tx.status === 'failed'
                                  ? 'bg-red-600 text-[var(--foreground)]'
                                  : 'bg-yellow-600 text-[var(--foreground)]'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          {tx.amount && tx.token && (
                            <div className="text-sm text-white mt-1">
                              {tx.amount} {tx.token}
                            </div>
                          )}
                          <div className="mt-2 flex items-center text-xs text-white">
                            <a
                              href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-[var(--primary-color)]"
                            >
                              {tx.hash.substring(0, 8)}...{tx.hash.substring(36)}
                              <ExternalLink size={12} className="ml-1" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h4 className="font-semibold text-[var(--foreground)] mb-2 flex items-center">
              <Shield className="mr-2 text-[var(--primary-color)]" />
              Treasury Management
            </h4>
            <p className="text-sm text-white">
              The SonicFi treasury manages all deposits and loans, enabling micro-lending for unbanked users. Powered by Sonic's fast transactions and low fees.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryScreen;
