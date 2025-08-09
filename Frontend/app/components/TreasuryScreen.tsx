"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getTreasuryBalance, depositFunds, getGasFee, getConfirmationTime } from '../utils/web3';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💸';
      case 'loan': return '🏦';
      case 'send': return '➡️';
      default: return '🔄';
    }
  };

  return (
    <div className="treasury-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">SonicFi Treasury</h2>
      </div>
      <p className="text-xs text-center text-gray-500 mb-4">
        Powered by Sonic: {confirmationTime} confirmations, {gasFee} fees
      </p>

      {errorMessage && (
        <div className="bg-red-50 p-3 rounded mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Connect your wallet to view treasury data</p>
          <ConnectWalletButton size="large" variant="primary" />
        </div>
      ) : (
        <div className="treasury-card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Deposits</h3>
              <p className="text-2xl font-bold text-green-600">
                ${loading ? '...' : treasuryData.totalDeposits}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Loans</h3>
              <p className="text-2xl font-bold text-blue-600">
                ${loading ? '...' : treasuryData.totalLoans}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Available Liquidity</h3>
              <p className="text-2xl font-bold text-purple-600">
                ${loading ? '...' : treasuryData.availableLiquidity}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Utilization Rate</h3>
              <p className="text-2xl font-bold text-orange-600">
                {loading ? '...' : treasuryData.utilizationRate}%
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4">Treasury Contract Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Contract Address:</span>
                <span className="font-mono text-sm">
                  {TREASURY_CONTRACT_ADDRESS.substring(0, 6)}...
                  {TREASURY_CONTRACT_ADDRESS.substring(38)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-medium">Sonic Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 text-green-800">Deposit to Treasury</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-green-700">Amount (USDC)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="100"
                  className="form-input w-full p-2 border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                disabled={isDepositing || loading}
                className={`w-full font-bold py-2 px-4 rounded ${
                  isDepositing || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-800 text-white'
                }`}
              >
                {isDepositing || loading ? 'Processing...' : 'Deposit USDC'}
              </button>
              <p className="text-xs text-green-600 mt-2">
                Mock implementation. Real treasury deposits would be used in production.
              </p>
            </form>
          </div>

          {transactions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-lg font-semibold mb-4">Recent Treasury Transactions</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transactions
                  .filter(tx => tx.type === 'deposit')
                  .map(tx => (
                    <div key={tx.hash} className="p-2 bg-gray-50 rounded text-xs flex items-center">
                      <span className="mr-2">{getTransactionIcon(tx.type)}</span>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="capitalize">{tx.type}</span>
                          <span
                            className={`${
                              tx.status === 'success'
                                ? 'text-green-600'
                                : tx.status === 'failed'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        {tx.amount && tx.token && (
                          <div>
                            {tx.amount} {tx.token}
                          </div>
                        )}
                        <div className="text-gray-500 truncate">
                          <a
                            href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            {tx.hash.substring(0, 10)}...{tx.hash.substring(38)}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Treasury Management</h4>
            <p className="text-sm text-blue-700">
              The SonicFi treasury manages all deposits and loans, enabling micro-lending for unbanked users. Powered by Sonic’s fast transactions and low fees.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryScreen;