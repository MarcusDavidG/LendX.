"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getUserLoan, repayLoan, getBalance, getGasFee, getConfirmationTime, TOKEN_ADDRESSES, TOKEN_DECIMALS } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import { ethers } from 'ethers';
import './components.css';

interface LoanInfo {
  amount: string;
  interest: string;
  dueDate: string;
  collateral: string;
}

const RepayScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');

  const tokens = ['S', 'USDC'];

  const loadLoanInfo = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const loan = await getUserLoan(userAddress);
      if (loan) {
        setLoanInfo(loan);
        setErrorMessage('');
      } else {
        setErrorMessage('No active loan found');
      }
    } catch (error: any) {
      setErrorMessage(`Error fetching loan: ${error.message}`);
    }
  }, [isConnected, userAddress]);

  const loadBalances = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const newBalances: { [key: string]: string } = {};
      for (const token of tokens) {
        const balance = await getBalance(token);
        newBalances[token] = balance;
      }
      setBalances(newBalances);
    } catch (error: any) {
      setErrorMessage(`Error loading balances: ${error.message}`);
    }
  }, [isConnected, userAddress]);

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
    if (isConnected && userAddress) {
      loadLoanInfo();
      loadBalances();
      fetchMetrics();
    }
  }, [isConnected, userAddress, loadLoanInfo, loadBalances, fetchMetrics]);

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !userAddress) {
      toast.error('Wallet not connected');
      return;
    }
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast.error('Invalid repayment amount');
      return;
    }
    if (!loanInfo || parseFloat(repayAmount) < parseFloat(loanInfo.amount)) {
      toast.error(`Repayment must be at least ${loanInfo?.amount} ${selectedToken}`);
      return;
    }
    if (parseFloat(repayAmount) > parseFloat(balances[selectedToken] || '0')) {
      toast.error(`Insufficient ${selectedToken} balance`);
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(`Repaying ${repayAmount} ${selectedToken}...`);
    try {
      const success = await repayLoan(repayAmount, selectedToken);
      if (success) {
        const transactionHash = ethers.hexlify(ethers.randomBytes(32)); // Mock hash
        trackTransaction(transactionHash, 'loan', repayAmount, selectedToken);
        setBalances(prev => ({
          ...prev,
          [selectedToken]: (parseFloat(prev[selectedToken] || '0') - parseFloat(repayAmount)).toFixed(selectedToken === 'USDC' ? 2 : 4)
        }));
        setLoanInfo({ amount: '0', interest: '0', dueDate: 'N/A', collateral: loanInfo?.collateral || 'None' });
        toast.success(`Repaid ${repayAmount} ${selectedToken} successfully!`, { id: toastId });
        setRepayAmount('');
      } else {
        toast.error('Repayment failed', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Repayment failed: ${error.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="repay-container max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">SonicFi Loan Repayment</h2>
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
          <p className="text-gray-600 mb-4">Connect your wallet to repay loans</p>
          <ConnectWalletButton size="large" variant="primary" />
        </div>
      ) : (
        <div className="repay-card">
          <form onSubmit={handleRepay} className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Loan Amount</label>
              <input
                type="text"
                value={loanInfo ? `${loanInfo.amount} ${selectedToken}` : 'Loading...'}
                className="form-input w-full bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Interest</label>
              <input
                type="text"
                value={loanInfo ? `${loanInfo.interest} ${selectedToken}` : 'Loading...'}
                className="form-input w-full bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Due Date</label>
              <input
                type="text"
                value={loanInfo ? loanInfo.dueDate : 'Loading...'}
                className="form-input w-full bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Collateral</label>
              <input
                type="text"
                value={loanInfo ? loanInfo.collateral : 'Loading...'}
                className="form-input w-full bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Repay Amount</label>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="0.0"
                className="form-input w-full"
                required
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">
                Balance: {balances[selectedToken] || '0'} {selectedToken}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Token</label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="form-select w-full"
              >
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !repayAmount || !loanInfo}
              className={`w-full font-bold py-2 px-4 rounded ${
                isProcessing || !repayAmount || !loanInfo
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Repay Loan'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Mock implementation. Real loan repayments would be used in production.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default RepayScreen;