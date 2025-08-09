"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getCollateralInfo } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import './components.css';

const CollateralScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const [collateralInfo, setCollateralInfo] = useState<{
    isLocked: boolean;
    value: string;
    asset: string;
    tokenId: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCollateralInfo = useCallback(async () => {
    if (!isConnected || !userAddress) {
      setErrorMessage('Wallet not connected');
      return;
    }
    try {
      const collateral = await getCollateralInfo(userAddress);
      setCollateralInfo(collateral);
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(`Error fetching collateral: ${error.message}`);
    }
  }, [isConnected, userAddress]);

  useEffect(() => {
    if (isConnected && userAddress) {
      fetchCollateralInfo();
    }
  }, [isConnected, userAddress, fetchCollateralInfo]);

  return (
    <div className="collateral-container max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">SonicFi Collateral</h2>
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
        <div className="collateral-card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Collateral Status</h3>
          {collateralInfo ? (
            <div className="p-3 bg-gray-100 rounded">
              <p>Status: {collateralInfo.isLocked ? 'Locked' : 'Unlocked'}</p>
              <p>Asset: {collateralInfo.asset} #{collateralInfo.tokenId}</p>
              <p>Value: {collateralInfo.value} USDC</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No collateral information available</p>
          )}
          <p className="text-xs text-gray-500 mt-4">
            Mock implementation. Real NFTs would be used in production.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollateralScreen;