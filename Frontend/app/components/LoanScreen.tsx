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
import './components.css';

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
      // Loan info is now handled by usePersistentLoan hook
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

  // Add refresh interval to check for collateral changes
  useEffect(() => {
    if (!isConnected || !userAddress) return;
    
    const interval = setInterval(() => {
      fetchLoanDetails();
    }, 3000); // Refresh every 3 seconds

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
        // The loan info will be updated by the persistent loan hook
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
    <div className="loan-container max-w-lg mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-10 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SonicFi Loans
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-yellow-500" />
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-blue-500" />
            <span>~2s confirmations</span>
          </div>
          <div className="flex items-center">
            <Gem size={16} className="mr-1 text-green-500" />
            <span>~$0.001 fees</span>
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
            <p className="text-gray-500 mb-6">Connect your wallet to access loan services</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <CreditCard className="mr-2 text-blue-500" />
                Loan Overview
              </h3>
              <button
                onClick={refreshLoan}
                className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw size={16} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Gem className="text-blue-500 mr-2" />
                    <span className="font-medium">S Token Balance</span>
                  </div>
                  <span className="font-mono text-lg font-bold">{sBalance} S</span>
                </div>
              </div>

              {loanInfo && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Banknote className="mr-2 text-green-500" />
                    Current Loan
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <p className="font-medium">{loanInfo.amount} USDC</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Interest:</span>
                      <p className="font-medium">{loanInfo.interest} USDC</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <p className="font-medium">{loanInfo.dueDate}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Due:</span>
                      <p className="font-medium">
                        {(parseFloat(loanInfo.amount) + parseFloat(loanInfo.interest)).toFixed(2)} USDC
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/repay'}
                    className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    <span className="mr-2">💰</span>
                    Repay Loan
                  </button>
                </div>
              )}

              {collateralInfo && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    {collateralInfo.isLocked ? (
                      <Lock className="mr-2 text-purple-500" />
                    ) : (
                      <Unlock className="mr-2 text-yellow-500" />
                    )}
                    Collateral
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p className="font-medium">
                        {collateralInfo.isLocked ? (
                          <span className="text-green-600">Locked</span>
                        ) : (
                          <span className="text-yellow-600">Unlocked</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Asset:</span>
                      <p className="font-medium">
                        {collateralInfo.asset} #{collateralInfo.tokenId}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Value:</span>
                      <p className="font-medium">{collateralInfo.value} USDC</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/collateral'}
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center whitespace-nowrap"
                  >
                    <span className="mr-2">🔗</span>
                    Lock Collateral
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <HandCoins className="mr-2 text-blue-500" />
              Request Loan
            </h3>
            
            <form onSubmit={handleRequestLoan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <ArrowRight className="mr-1 text-blue-500" size={16} />
                  Loan Amount (USDC)
                </label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="100"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <Clock className="mr-1 text-blue-500" size={16} />
                  Duration (days)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <Shield className="mr-2 text-blue-500" />
                  Loan Terms
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-600">Interest Rate:</span>
                    <p>5% (fixed)</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Repayment:</span>
                    <p>{loanAmount ? (parseFloat(loanAmount) * 1.05).toFixed(2) : '0'} USDC</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Collateral:</span>
                    <p>Mock NFT</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Status:</span>
                    <p>{collateralInfo?.isLocked ? 'Locked' : 'Unlocked'}</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !collateralInfo?.isLocked || !loanAmount || !duration || parseFloat(loanAmount) <= 0 || isNaN(parseFloat(loanAmount))}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all ${
                  isLoading || !collateralInfo?.isLocked || !loanAmount || !duration || parseFloat(loanAmount) <= 0 || isNaN(parseFloat(loanAmount))
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg'
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
