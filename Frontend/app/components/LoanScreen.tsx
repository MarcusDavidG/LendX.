"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getBalance, mockRequestLoan, getCollateralInfo, getUserLoan } from '../utils/web3';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { usePersistentLoan } from '../hooks/usePersistentLoan';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { 
  ArrowRight, Banknote, Clock, Copy, CreditCard, 
  Gem, HandCoins, Loader2, Lock, Shield, 
  Unlock, Wallet, Zap, RefreshCw 
} from 'lucide-react';

const EnhancedLoanScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [sBalance, setSBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [collateralInfo, setCollateralInfo] = useState<{
    isLocked: boolean;
    value: string;
    asset: string;
    tokenId: string;
  } | null>(null);
  const { loanInfo, refreshLoan, hasActiveLoan } = usePersistentLoan();

  const fetchLoanDetails = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const sBal = await getBalance('S');
      setSBalance(sBal);
      const collateral = await getCollateralInfo(userAddress);
      setCollateralInfo(collateral);
      refreshLoan();
    } catch (error: any) {
      setErrorMessage(`Error fetching loan details: ${error.message}`);
    }
  }, [isConnected, userAddress, refreshLoan]);

  useEffect(() => {
    if (isConnected && userAddress) {
      fetchLoanDetails();
    }
  }, [isConnected, userAddress, fetchLoanDetails]);

  useEffect(() => {
    if (!isConnected || !userAddress) return;
    
    const interval = setInterval(() => {
      fetchLoanDetails();
    }, 3000);

    return () => clearInterval(interval);
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
        refreshLoan();
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

  const copyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      toast.success('Address copied to clipboard');
    }
  };

  return (
    <div className="max-w-lg  max-h-full bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border-color)]">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center">
          <h2 className="text-3xl font-bold text-[var(--primary-color)]">
            Request A Loan
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-white">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>Powered by Sonic</span> 
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>~2s confirmations</span>
          </div>
          <div className="flex items-center">
            <Gem size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>~$0.001 fees</span>
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
            <p className="text-gray-400 mb-6">Connect your wallet to access loan services</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
                <CreditCard className="mr-2 text-[var(--primary-color)]" />
                Loan Overview
              </h3>
              <button
                onClick={refreshLoan}
                className={`flex items-center space-x-1 bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Gem className="text-[var(--primary-color)] mr-2" />
                    <span className="font-medium text-[var(--foreground)]">S Token Balance</span>
                  </div>
                  <span className="font-mono text-lg font-bold text-[var(--foreground)]">{sBalance} S</span>
                </div>
              </div>

              {loanInfo && (
                <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                  <h4 className="font-semibold text-[var(--foreground)] mb-2 flex items-center">
                    <Banknote className="mr-2 text-[var(--primary-color)]" />
                    Current Loan
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--primary-color)]">Amount:</span>
                      <p className="font-medium text-[var(--foreground)]">{loanInfo.amount} USDC</p>
                    </div>
                    <div>
                      <span className="text-[var(--primary-color)]">Interest:</span>
                      <p className="font-medium text-[var(--foreground)]">{loanInfo.interest} USDC</p>
                    </div>
                    <div>
                      <span className="text-[var(--primary-color)]">Due Date:</span>
                      <p className="font-medium text-[var(--foreground)]">{loanInfo.dueDate}</p>
                    </div>
                    <div>
                      <span className="text-[var(--primary-color)]">Total Due:</span>
                      <p className="font-medium text-[var(--foreground)]">
                        {(parseFloat(loanInfo.amount) + parseFloat(loanInfo.interest)).toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/repay'}
                    className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-[var(--foreground)] font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2">💰</span>
                    Repay Loan
                  </button>
                </div>
              )}

              {collateralInfo && (
                <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                  <h4 className="font-semibold text-[var(--foreground)] mb-2 flex items-center">
                    {collateralInfo.isLocked ? (
                      <Lock className="mr-2 text-purple-400" />
                    ) : (
                      <Unlock className="mr-2 text-green-50 " />
                    )}
                    Collateral
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[var(--primary-color)]">Status:</span>
                      <p className="font-medium text-[var(--foreground)]">
                        {collateralInfo.isLocked ? (
                          <span className="text-emerald-400">Locked</span>
                        ) : (
                          <span className="text-green-50 ">Unlocked</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--primary-color)]">Asset:</span>
                      <p className="font-medium text-[var(--foreground)]">
                        {collateralInfo.asset} #{collateralInfo.tokenId}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--primary-color)]">Value:</span>
                      <p className="font-medium text-[var(--foreground)]">{collateralInfo.value} USDC</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/collateral'}
                    className="mt-3 w-full bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    <span className="mr-2">🔗</span>
                    Lock Collateral
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <HandCoins className="mr-2 text-[var(--primary-color)]" />
              Request Loan
            </h3>
            
            <form onSubmit={handleRequestLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                  <ArrowRight className="mr-1 text-[var(--primary-color)]" size={16} />
                  Loan Amount (USDC)
                </label>
                <input
                  type="text"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="100"
                  className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                  <Clock className="mr-1 text-[var(--primary-color)]" size={16} />
                  Duration (days)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <h4 className="font-medium text-[var(--foreground)] mb-2 flex items-center">
                  <Shield className="mr-2 text-[var(--primary-color)]" />
                  Loan Terms
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--primary-color)]">Interest Rate:</span>
                    <p className="text-[var(--foreground)]">5% (fixed)</p>
                  </div>
                  <div>
                    <span className="text-[var(--primary-color)]">Repayment:</span>
                    <p className="text-[var(--foreground)]">{loanAmount ? (parseFloat(loanAmount) * 1.05).toFixed(2) : '0'} USDC</p>
                  </div>
                  <div>
                    <span className="text-[var(--primary-color)]">Collateral:</span>
                    <p className="text-[var(--foreground)]">Mock NFT</p>
                  </div>
                  <div>
                    <span className="text-[var(--primary-color)]">Status:</span>
                    <p className="text-[var(--foreground)]">{collateralInfo?.isLocked ? 'Locked' : 'Unlocked'}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !collateralInfo?.isLocked || !loanAmount || !duration || parseFloat(loanAmount) <= 0 || isNaN(parseFloat(loanAmount))}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                  isLoading || !collateralInfo?.isLocked || !loanAmount || !duration || parseFloat(loanAmount) <= 0 || isNaN(parseFloat(loanAmount))
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Processing...</span>
                  </>
                ) : !collateralInfo?.isLocked ? (
                  <>
                    <Lock size={18} />
                    <span>Lock Collateral First</span>
                  </>
                ) : !loanAmount || parseFloat(loanAmount) <= 0 || isNaN(parseFloat(loanAmount)) ? (
                  <>
                    <HandCoins size={18} />
                    <span>Enter Valid Amount</span>
                  </>
                ) : (
                  <>
                    <HandCoins size={18} />
                    <span>Request Loan</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedLoanScreen;