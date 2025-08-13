"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getCollateralInfo, getGasFee, getConfirmationTime } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import { ethers } from 'ethers';
import { Clock, Lock, Shield, Unlock, Wallet, Zap } from 'lucide-react';

interface CollateralInfo {
  isLocked: boolean;
  value: string;
  asset: string;
  tokenId: string;
}

const CollateralScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [collateralInfo, setCollateralInfo] = useState<CollateralInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');

  const fetchCollateralInfo = useCallback(async () => {
    if (!isConnected || !userAddress) {
      setErrorMessage('Wallet not connected');
      return;
    }
    setLoading(true);
    try {
      const collateral = await getCollateralInfo(userAddress);
      setCollateralInfo(collateral);
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(`Error fetching collateral: ${error.message}`);
    } finally {
      setLoading(false);
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
      fetchCollateralInfo();
      fetchMetrics();
    }
  }, [isConnected, userAddress, fetchCollateralInfo, fetchMetrics]);

  const handleLockUnlock = async () => {
    if (!isConnected || !userAddress || !collateralInfo) {
      toast.error('Wallet not connected or no collateral found');
      return;
    }

    setIsProcessing(true);
    const action = collateralInfo.isLocked ? 'unlock' : 'lock';
    const toastId = toast.loading(`${action === 'lock' ? 'Locking' : 'Unlocking'} collateral...`);
    try {
      // Mock lock/unlock with 2s delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      const success = true; // Mock success
      if (success) {
        const transactionHash = ethers.hexlify(ethers.randomBytes(32));
        trackTransaction(transactionHash, 'deposit', collateralInfo.value, collateralInfo.asset);
        setCollateralInfo(prev => prev ? { ...prev, isLocked: !prev.isLocked } : prev);
        toast.success(`Collateral ${action === 'lock' ? 'locked' : 'unlocked'} successfully!`, { id: toastId });
      } else {
        toast.error(`Failed to ${action} collateral`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`${action === 'lock' ? 'Locking' : 'Unlocking'} failed: ${error.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border-color)]">
      <div className="flex flex-col items-center mb-6">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-white">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-[var(--primary-color)]" />
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
            <Wallet className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
            <p className="text-white mb-6">Connect your wallet to view collateral status</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <Shield className="mr-2 text-[var(--primary-color)]" />
              Collateral Status
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-color)] mx-auto"></div>
                <p className="text-white mt-2">Loading collateral info...</p>
              </div>
            ) : collateralInfo ? (
              <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="flex items-center">
                      {collateralInfo.isLocked ? (
                        <Lock className="text-[var(--primary-color)]" size={16} />
                      ) : (
                        <Unlock className="text-[var(--primary-color)] mr-2" size={16} />
                      )}
                      <span className="font-medium  text-[var(--primary-color)]">Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          collateralInfo.isLocked
                            ? 'bg-emerald-600 text-[var(--foreground)]'
                            : 'bg-yellow-600 text-[var(--foreground)]'
                        }`}
                      >
                        {collateralInfo.isLocked ? 'Locked' : 'Unlocked'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--primary-color)]">Asset:</span>
                    <p className="font-medium text-[var(--foreground)]">{collateralInfo.asset}</p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--primary-color)]">Token ID:</span>
                    <p className="font-medium text-[var(--foreground)]">#{collateralInfo.tokenId}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-[var(--primary-color)]">Value:</span>
                    <p className="text-xl font-bold text-white">
                      {collateralInfo.value} USDC
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLockUnlock}
                  disabled={isProcessing}
                  className={`w-full mt-4 font-bold py-2 px-4 rounded-lg transition-all duration-200 ${
                    isProcessing
                      ? 'bg-gray-600 cursor-not-allowed'
                      : collateralInfo.isLocked
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-[var(--foreground)] shadow-md hover:shadow-lg'
                      : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg'
                  }`}
                >
                  {isProcessing
                    ? 'Processing...'
                    : collateralInfo.isLocked
                    ? 'Unlock Collateral'
                    : 'Lock Collateral'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8 bg-[var(--input-background)] rounded-xl border border-[var(--border-color)]">
                <Shield className="text-white text-2xl mb-3 mx-auto" />
                <p className="text-white">No collateral information available</p>
              </div>
            )}
          </div>

          <div className="bg-[var(--card-background)] rounded-2xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
            <h4 className="font-semibold text-[var(--foreground)] mb-2 flex items-center">
              <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
              About Collateral
            </h4>
            <p className="text-sm text-white">
              Collateral is required to secure loans in the SonicFi protocol. Your NFT assets are locked as collateral and can be reclaimed when loans are repaid.
            </p>
          </div>
          <p className="text-xs text-white text-center">
            Mock implementation. Real NFTs would be used in production.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollateralScreen;