"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getUserLoan, repayLoan, getBalance, getGasFee, getConfirmationTime, TOKEN_ADDRESSES, TOKEN_DECIMALS } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import { ethers } from 'ethers';
import { Clock, Loader2, Shield, Wallet, Zap } from 'lucide-react';

interface LoanInfo {
  amount: string;
  interest: string;
  dueDate: string;
  collateral: string;
}

const EnhancedRepayScreen = () => {
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
    <div className="max-w-md mx-auto p-6 bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border-color)]">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-10 mr-3" />
          <h2 className="text-3xl font-bold text-[var(--primary-color)]">
            SonicFi Loan Repayment
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-300">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-yellow-400" />
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>{confirmationTime}</span>
          </div>
          <div className="flex items-center">
            <Shield size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>{gasFee}</span>
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
            <p className="text-gray-400 mb-6">Connect your wallet to repay loans</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleRepay} className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)] flex items-center">
                <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                Loan Amount
              </label>
              <input
                type="text"
                value={loanInfo ? `${loanInfo.amount} ${selectedToken}` : 'Loading...'}
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)] flex items-center">
                <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                Interest
              </label>
              <input
                type="text"
                value={loanInfo ? `${loanInfo.interest} ${selectedToken}` : 'Loading...'}
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)] flex items-center">
                <Clock className="mr-2 text-[var(--primary-color)]" size={16} />
                Due Date
              </label>
              <input
                type="text"
                value={loanInfo ? loanInfo.dueDate : 'Loading...'}
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)] flex items-center">
                <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                Collateral
              </label>
              <input
                type="text"
                value={loanInfo ? loanInfo.collateral : 'Loading...'}
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)] flex items-center">
                <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                Repay Amount
              </label>
              <input
                type="text"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.0"
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Balance: {balances[selectedToken] || '0'} {selectedToken}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)] flex items-center">
                <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                Token
              </label>
              <select
                value={selectedToken}
                onChange={(e) => setSelectedToken(e.target.value)}
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              >
                {tokens.map(token => (
                  <option key={token} value={token}>{token}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !repayAmount || !loanInfo}
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                isProcessing || !repayAmount || !loanInfo
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>Repay Loan</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Mock implementation. Real loan repayments would be used in production.
            </p>
          </form>
        </div>
      )}
    </div>
  );
};

export default EnhancedRepayScreen;