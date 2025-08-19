'use client';

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getUserLoan, repayLoan } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import { ethers } from 'ethers';
import { Clock, Loader2, Shield, Wallet, Zap, Lock, Banknote, HandCoins, ArrowLeft } from 'lucide-react';
import { NFT } from '../hooks/useNFTData';
import { useRouter } from 'next/navigation';

interface LoanInfo {
  amount: string;
  interest: string;
  dueDate: string;
}

const EnhancedRepayScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockedNFT, setLockedNFT] = useState<NFT | null>(null);
  const [isRepaid, setIsRepaid] = useState(false);
  const router = useRouter();

  const loadLoanInfo = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const loan = await getUserLoan(userAddress);
      if (loan) {
        setLoanInfo(loan);
        setErrorMessage('');
      } else {
        setLoanInfo(null);
        setErrorMessage('No active loan found');
      }
    } catch (error: any) {
      setErrorMessage(`Error fetching loan: ${error.message}`);
    }
  }, [isConnected, userAddress]);

  useEffect(() => {
    const storedNFT = localStorage.getItem('lockedNFT');
    if (storedNFT) {
      setLockedNFT(JSON.parse(storedNFT));
    }
    if (isConnected && userAddress) {
      loadLoanInfo();
    }
  }, [isConnected, userAddress, loadLoanInfo]);

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
    if (!loanInfo || parseFloat(repayAmount) < (parseFloat(loanInfo.amount) + parseFloat(loanInfo.interest))) {
      toast.error(`Repayment must be at least the total due amount.`);
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(`Repaying ${repayAmount} USDC...`);
    try {
      const success = await repayLoan(repayAmount, 'USDC');
      if (success) {
        const transactionHash = ethers.hexlify(ethers.randomBytes(32)); // Mock hash
        trackTransaction(transactionHash, 'repay', repayAmount, 'USDC');
        setLoanInfo(null);
        localStorage.removeItem('lockedNFT');
        setLockedNFT(null);
        toast.success(`Repaid ${repayAmount} USDC successfully! Your NFT is now unlocked.`, { id: toastId });
        setRepayAmount('');
        setIsRepaid(true);
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
    <div className="min-h-screen bg-[var(--background)] p-6">
      <div className="max-w-4xl mx-auto bg-[var(--card-background)] rounded-2xl shadow-xl border border-[var(--border-color)] p-6">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-3xl font-bold text-[var(--primary-color)] mb-2">
            {isRepaid ? 'Loan Repaid Successfully' : 'Repay Your Loan'}
          </h2>
          <p className="text-[var(--foreground)]">
            {isRepaid ? 'Your collateral is now unlocked.' : 'Settle your outstanding loan to unlock your NFT collateral.'}
          </p>
        </div>

        {errorMessage && !isRepaid && (
          <div className="bg-red-800 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
            <Shield className="text-red-400 mr-2" />
            <p className="text-red-200">{errorMessage}</p>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
            <div className="max-w-md mx-auto">
              <Wallet className="w-12 h-12 text-[var(--foreground)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
              <p className="text-[var(--foreground)] mb-6">Connect your wallet to repay loans</p>
              <ConnectWalletButton size="large" variant="primary" />
            </div>
          </div>
        ) : isRepaid ? (
          <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Loan Cleared</h3>
            <p className="text-[var(--foreground)] mb-6">Your loan has been successfully repaid and your collateral is unlocked.</p>
            <button
              onClick={() => router.push('/loan')}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft />
              Go back to Loan Screen
            </button>
          </div>
        ) : !loanInfo ? (
          <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No Active Loan</h3>
            <p className="text-[var(--foreground)] mb-6">You do not have any active loans to repay.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] space-y-4">
              <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
                <Banknote className="mr-2 text-[var(--primary-color)]" />
                Loan Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--primary-color)]">Principal:</span>
                  <span className="font-mono text-[var(--foreground)]">{loanInfo.amount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--primary-color)]">Interest:</span>
                  <span className="font-mono text-[var(--foreground)]">{loanInfo.interest} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--primary-color)]">Due Date:</span>
                  <span className="font-mono text-[var(--foreground)]">{loanInfo.dueDate}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[var(--primary-color)]">Total Due:</span>
                  <span className="font-mono text-[var(--foreground)]">{(parseFloat(loanInfo.amount) + parseFloat(loanInfo.interest)).toFixed(2)} USDC</span>
                </div>
              </div>
              {lockedNFT && (
                <div className="pt-4" aria-label="Locked NFT collateral">
                  <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center mb-2">
                    <Lock className="mr-2 text-[var(--primary-color)]" />
                    Locked Collateral
                  </h3>
                  <div className="flex items-center gap-4 bg-[var(--input-background)] p-3 rounded-lg w-full">
                    <div className="max-w-[80px] md:max-w-[96px]">
                      <img
                        src={lockedNFT.image}
                        alt={lockedNFT.name}
                        className="w-full h-auto rounded-lg object-cover aspect-square border-2 border-[var(--primary-color)]"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base md:text-lg text-[var(--foreground)] truncate" title={lockedNFT.name}>
                        {lockedNFT.name}
                      </p>
                      <p className="text-sm text-[var(--foreground)] truncate" title={lockedNFT.collection}>
                        {lockedNFT.collection}
                      </p>
                      <p className="text-sm text-[var(--primary-color)] whitespace-nowrap">
                        Value: ${lockedNFT.estimatedValue.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] space-y-4">
              <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
                <HandCoins className="mr-2 text-[var(--primary-color)]" />
                Repayment
              </h3>
              <form onSubmit={handleRepay} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 text-[var(--foreground)] flex justify-between items-center">
                    <span>Repay Amount (USDC)</span>
                    <button
                      type="button"
                      onClick={() => setRepayAmount((parseFloat(loanInfo.amount) + parseFloat(loanInfo.interest)).toFixed(2))}
                      className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded-md"
                    >
                      Max
                    </button>
                  </label>
                  <input
                    type="text"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="Enter amount to repay"
                    className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                    required
                  />
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
                      <span>Processing Repayment...</span>
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      <span>Submit Repayment</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRepayScreen;
