"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getBalance, mockRequestLoan, getCollateralInfo, getUserLoan } from '../utils/web3';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import './components.css';

const EnhancedLoanScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('30'); // Default 30 days
  const [sBalance, setSBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loanInfo, setLoanInfo] = useState<{
    amount: string;
    interest: string;
    dueDate: string;
  } | null>(null);
  const [collateralInfo, setCollateralInfo] = useState<{
    isLocked: boolean;
    value: string;
    asset: string;
    tokenId: string;
  } | null>(null);

  const fetchLoanDetails = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const sBal = await getBalance('S');
      setSBalance(sBal);
      const loan = await getUserLoan(userAddress);
      setLoanInfo(loan || { amount: '0', interest: '0', dueDate: 'N/A' });
      const collateral = await getCollateralInfo(userAddress);
      setCollateralInfo(collateral);
    } catch (error: any) {
      setErrorMessage(`Error fetching loan details: ${error.message}`);
    }
  }, [isConnected, userAddress]);

  useEffect(() => {
    if (isConnected && userAddress) {
      fetchLoanDetails();
    }
  }, [isConnected, userAddress, fetchLoanDetails]);

  const handleRequestLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !userAddress) {
      toast.error('Wallet not connected');
      return;
    }
    if (parseFloat(loanAmount) <= 0 || isNaN(parseFloat(loanAmount))) {
      toast.error('Invalid loan amount');
      return;
    }
    if (!collateralInfo?.isLocked) {
      toast.error('Collateral not locked');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Requesting loan...');
    try {
      const { success, transactionHash } = await mockRequestLoan(loanAmount, duration);
      if (success && transactionHash) {
        trackTransaction(transactionHash, 'loan', loanAmount, 'USDC');
        setLoanInfo({
          amount: loanAmount,
          interest: (parseFloat(loanAmount) * 0.05).toFixed(2), // Mock 5% interest
          dueDate: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toLocaleDateString()
        });
        toast.success(`Loan of ${loanAmount} USDC approved!`, { id: toastId });
        setLoanAmount('');
        setDuration('30');
      } else {
        toast.error('Failed to request loan', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loan-container max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">SonicFi Loans</h2>
      </div>
      <p className="text-xs text-center text-gray-500 mb-4">
        Powered by Sonic: ~2s confirmations, ~$0.001 fees
      </p>

      {errorMessage && (
        <div className="bg-red-50 p-3 rounded mb-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center">
          <ConnectWalletButton size="large" variant="primary" />
        </div>
      ) : (
        <div className="loan-card">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Your Loan</h3>
            <p className="text-xs text-gray-500 truncate w-32">{userAddress}</p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
              <span className="font-medium">S Token Balance</span>
              <span className="font-mono text-lg">{sBalance} S</span>
            </div>
            {loanInfo && (
              <div className="p-3 bg-gray-100 rounded">
                <h4 className="font-medium">Current Loan</h4>
                <p>Amount: {loanInfo.amount} USDC</p>
                <p>Interest: {loanInfo.interest} USDC</p>
                <p>Due Date: {loanInfo.dueDate}</p>
              </div>
            )}
            {collateralInfo && (
              <div className="p-3 bg-gray-100 rounded">
                <h4 className="font-medium">Collateral</h4>
                <p>Status: {collateralInfo.isLocked ? 'Locked' : 'Unlocked'}</p>
                <p>Asset: {collateralInfo.asset} #{collateralInfo.tokenId}</p>
                <p>Value: {collateralInfo.value} USDC</p>
              </div>
            )}
          </div>

          <form onSubmit={handleRequestLoan} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Request Loan</h3>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Loan Amount (USDC)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="100"
                className="form-input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Duration (days)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="form-select w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <h4 className="font-medium text-blue-800">Loan Terms</h4>
              <p>Interest Rate: 5% (fixed)</p>
              <p>Repayment: {loanAmount ? (parseFloat(loanAmount) * 1.05).toFixed(2) : '0'} USDC</p>
              <p>Collateral: Mock NFT (Locked)</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-2 px-4 rounded ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? 'Processing...' : 'Request Loan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnhancedLoanScreen;