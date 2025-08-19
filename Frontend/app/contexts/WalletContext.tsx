"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { connectWallet, getBalance, getUserAddress } from '../utils/web3';

interface WalletContextType {
  isConnected: boolean;
  userAddress: string | null;
  balance: { STK: string; USDC: string };
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<string | null>;
  disconnectWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState({ STK: '0', USDC: '0' });
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced connection state persistence
  useEffect(() => {
    const loadWalletState = async () => {
      try {
        const savedAddress = localStorage.getItem('walletAddress');
        const savedConnected = localStorage.getItem('walletConnected') === 'true';
        const savedTimestamp = localStorage.getItem('walletConnectionTimestamp');
        
        // Check if connection is still valid (within 24 hours)
        const isConnectionValid = savedTimestamp && 
          (Date.now() - parseInt(savedTimestamp)) < (24 * 60 * 60 * 1000);
        
        if (savedAddress && savedConnected && isConnectionValid) {
          // Try to reconnect silently
          await attemptSilentReconnection(savedAddress);
        } else {
          // Clear expired connection
          clearWalletState();
        }
      } catch (error) {
        console.error('Failed to load wallet state:', error);
        clearWalletState();
      }
    };

    loadWalletState();
  }, []);

  // Enhanced tab visibility handling
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && isConnected) {
        // Tab became visible, verify connection
        await verifyConnection();
      }
    };

    const handleFocus = async () => {
      if (isConnected) {
        // Window gained focus, refresh state
        await refreshBalance();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isConnected]);

  const attemptSilentReconnection = async (expectedAddress: string) => {
    try {
      const currentAddress = await getUserAddress();
      if (currentAddress && currentAddress.toLowerCase() === expectedAddress.toLowerCase()) {
        setUserAddress(currentAddress);
        setIsConnected(true);
        setError(null);
        await refreshBalance();
      } else {
        clearWalletState();
      }
    } catch (error) {
      clearWalletState();
    }
  };

  const verifyConnection = async () => {
    try {
      const currentAddress = await getUserAddress();
      if (!currentAddress || currentAddress !== userAddress) {
        // Connection lost, try to reconnect
        await connectWalletHandler();
      } else {
        // Connection valid, refresh balance
        await refreshBalance();
      }
    } catch (error) {
      setError('Connection verification failed');
      await disconnectWallet();
    }
  };

  const clearWalletState = () => {
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletConnectionTimestamp');
    
    // Clear cookie for middleware
    document.cookie = 'wallet-connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    setIsConnected(false);
    setUserAddress(null);
    setBalance({ STK: '0', USDC: '0' });
  };

  const connectWalletHandler = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const address = await connectWallet();
      if (address) {
        setUserAddress(address);
        setIsConnected(true);
        setError(null);
        
        // Save connection state
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletConnectionTimestamp', Date.now().toString());
        
        // Set cookie for middleware
        document.cookie = 'wallet-connected=true; path=/; max-age=86400'; // 24 hours
        
        await refreshBalance();
        return address;
      } else {
        throw new Error('No wallet address found');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      await disconnectWallet();
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Check if MetaMask is installed and connected
      if (window.ethereum) {
        try {
          // Attempt to disconnect from MetaMask by revoking permissions
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [
              {
                eth_accounts: {},
              },
            ],
          });
        } catch (err) {
          console.warn('MetaMask revoke permissions not supported:', err);
        }

        // Remove MetaMask event listeners
        if (window.ethereum.isMetaMask) {
          window.ethereum.removeAllListeners(['accountsChanged', 'chainChanged']);
        }
      }

      // Clear app state
      clearWalletState();
      setError(null);
    } catch (error: any) {
      console.error('Disconnection error:', error);
      setError(error.message || 'Failed to disconnect wallet');
      throw error; // Propagate error to the caller
    }
  };

  const refreshBalance = async () => {
    if (isConnected && userAddress) {
      try {
        const [sBalance, usdcBalance] = await Promise.all([
          getBalance('STK'),
          getBalance('USDC')
        ]);
        
        setBalance({ STK: sBalance, USDC: usdcBalance });
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  };

  const value: WalletContextType = {
    isConnected,
    userAddress,
    balance,
    isConnecting,
    error,
    connectWallet: connectWalletHandler,
    disconnectWallet,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};