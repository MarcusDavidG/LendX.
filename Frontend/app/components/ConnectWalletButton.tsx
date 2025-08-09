"use client";

import React from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import './components.css';

interface ConnectWalletButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  showAddress?: boolean;
  className?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  size = 'medium',
  variant = 'primary',
  showAddress = false,
  className = '',
}) => {
  const { isConnected, userAddress, isConnecting, connectWallet, disconnectWallet } = useWallet();

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-1 px-2 text-sm';
      case 'large':
        return 'py-3 px-6 text-lg';
      default:
        return 'py-2 px-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-500 hover:bg-gray-600 text-white';
      case 'outline':
        return 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    const toastId = toast.loading('Connecting wallet...');
    try {
      await connectWallet();
      toast.success('Wallet connected successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`, { id: toastId });
    }
  };

  const handleDisconnect = async () => {
    const toastId = toast.loading('Disconnecting wallet...');
    try {
      disconnectWallet();
      toast.success('Wallet disconnected successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(`Disconnection failed: ${error.message}`, { id: toastId });
    }
  };

  return (
    <div className={`connect-wallet-button ${className}`}>
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`${getSizeClasses()} ${getVariantClasses()} rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDisconnect}
            className={`${getSizeClasses()} bg-red-500 hover:bg-red-600 text-white rounded font-medium transition-colors duration-200`}
          >
            Disconnect
          </button>
          {showAddress && userAddress && (
            <span
              className="text-xs text-gray-600 truncate max-w-32 cursor-pointer"
              title={userAddress}
            >
              {formatAddress(userAddress)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;
