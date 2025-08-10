"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import './components.css';

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
      case 'deposit': return <TrendingUp size={16} className="text-green-500" />;
      case 'loan': return <Banknote size={16} className="text-blue-500" />;
      case 'send': return <ArrowRight size={16} className="text-purple-500" />;
      default: return <RefreshCw size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="treasury-container max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-10 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SonicFi Treasury
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-yellow-500" />
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-blue-500" />
            <span>{confirmationTime} confirmations</span>
          </div>
          <div className="flex items-center">
            <Shield size={16} className="mr-1 text-green-500" />
            <span>{gasFee} fees</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <Shield className="text-red-500 mr-2" />
          <p className="text-red-600">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm p-6">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-6">Connect your wallet to view treasury data</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-2">
                <TrendingUp className="text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-500">Total Deposits</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ${loading ? '...' : treasuryData.totalDeposits}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-2">
                <Banknote className="text-blue-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-500">Total Loans</h3>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                ${loading ? '...' : treasuryData.totalLoans}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-2">
                <PieChart className="text-purple-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-500">Available Liquidity</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${loading ? '...' : treasuryData.availableLiquidity}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center mb-2">
                <Shield className="text-orange-500 mr-2" />
                <h3 className="text-sm font-medium text-gray-500">Utilization Rate</h3>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? '...' : treasuryData.utilizationRate}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Banknote className="mr-2 text-blue-500" />
              Treasury Contract
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Contract Address:</span>
                <div className="flex items-center">
                  <span className="font-mono text-sm">
                    {TREASURY_CONTRACT_ADDRESS.substring(0, 6)}...
                    {TREASURY_CONTRACT_ADDRESS.substring(38)}
                  </span>
                  <button 
                    onClick={copyAddress}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Sonic Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl shadow-sm p-6 border border-green-100">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 text-green-500" />
              Deposit to Treasury
            </h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-green-700 flex items-center">
                  <Banknote className="mr-2 text-green-500" size={16} />
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="100"
                  className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                disabled={isDepositing || loading}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all ${
                  isDepositing || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg'
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
              <p className="text-xs text-green-600 mt-2">
                Mock implementation. Real treasury deposits would be used in production.
              </p>
            </form>
          </div>

          {transactions.filter(tx => tx.type === 'deposit').length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <RefreshCw className="mr-2 text-blue-500" />
                Recent Treasury Transactions
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {transactions
                  .filter(tx => tx.type === 'deposit')
                  .map(tx => (
                    <div key={tx.hash} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="capitalize font-medium text-gray-800">{tx.type}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : tx.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          {tx.amount && tx.token && (
                            <div className="text-sm text-gray-600 mt-1">
                              {tx.amount} {tx.token}
                            </div>
                          )}
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <a
                              href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-blue-600"
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

          <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <Shield className="mr-2 text-blue-500" />
              Treasury Management
            </h4>
            <p className="text-sm text-blue-700">
              The SonicFi treasury manages all deposits and loans, enabling micro-lending for unbanked users. Powered by Sonic's fast transactions and low fees.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryScreen;