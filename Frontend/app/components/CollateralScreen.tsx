"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getCollateralInfo, getGasFee, getConfirmationTime } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import { ethers } from 'ethers';
import './components.css';

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
3
  return (
    <div className="collateral-container max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center mb-4">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
          <h2 className="text-2xl font-bold text-gray-800">SonicFi Collateral</h2>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center">
            <span className="mr-1">⚡</span>
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">⏰</span>
            <span>{confirmationTime}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-1">💎</span>
            <span>{gasFee}</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded p-3 mb-4 flex items-center">
          <span className="mr-2">⚠️</span>
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md p-6">
          <div className="max-w-md mx-auto">
            <span className="text-3xl mb-4 block">💼</span>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-4">Connect your wallet to view collateral status</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="collateral-card">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🛡️</span>
            Collateral Status
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading collateral info...</p>
            </div>
          ) : collateralInfo ? (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <div className="flex items-center">
                    {collateralInfo.isLocked ? (
                      <span className="text-green-500 mr-2">🔒</span>
                    ) : (
                      <span className="text-yellow-500 mr-2">🔓</span>
                    )}
                    <span className="font-medium">Status:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        collateralInfo.isLocked
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {collateralInfo.isLocked ? 'Locked' : 'Unlocked'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Asset:</span>
                  <p className="font-medium">{collateralInfo.asset}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Token ID:</span>
                  <p className="font-medium">#{collateralInfo.tokenId}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">Value:</span>
                  <p className="text-xl font-bold text-blue-600">
                    {collateralInfo.value} USDC
                  </p>
                </div>
              </div>
              <button
                onClick={handleLockUnlock}
                disabled={isProcessing}
                className={`w-full mt-4 font-bold py-2 px-4 rounded ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : collateralInfo.isLocked
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
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
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <span className="text-2xl mb-3 block">🛡️</span>
              <p className="text-gray-500">No collateral information available</p>
            </div>
          )}

          <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
              <span className="mr-2">🛡️</span>
              About Collateral
            </h4>
            <p className="text-sm text-blue-700">
              Collateral is required to secure loans in the SonicFi protocol. Your NFT assets are locked as collateral and can be reclaimed when loans are repaid.
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Mock implementation. Real NFTs would be used in production.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollateralScreen;