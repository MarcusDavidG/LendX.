"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { 
  ArrowLeftRight,
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
  ChevronDown,
  Loader2,
  Check
} from 'lucide-react';
import './components.css';

interface ConnectWalletButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
  showAddress?: boolean;
  className?: string;
  redirectOnConnect?: boolean;
  redirectTo?: string;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  size = 'medium',
  variant = 'primary',
  showAddress = false,
  className = '',
  redirectOnConnect = true,
  redirectTo = '/dashboard',
}) => {
  const { isConnected, userAddress, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-1 px-3 text-sm';
      case 'large':
        return 'py-3 px-6 text-lg';
      default:
        return 'py-2 px-4';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white';
      case 'outline':
        return 'border border-blue-500 text-blue-500 hover:bg-blue-50';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white';
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
      
      // Redirect to dashboard after successful connection
      if (redirectOnConnect) {
        router.push(redirectTo);
      }
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`, { id: toastId });
    }
  };

  const handleDisconnect = async () => {
    const toastId = toast.loading('Disconnecting wallet...');
    try {
      disconnectWallet();
      setIsDropdownOpen(false);
      toast.success('Wallet disconnected successfully!', { id: toastId });
    } catch (error: any) {
      toast.error(`Disconnection failed: ${error.message}`, { id: toastId });
    }
  };

  const copyAddress = () => {
    if (!userAddress) return;
    navigator.clipboard.writeText(userAddress);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const viewOnExplorer = () => {
    if (!userAddress) return;
    window.open(`https://explorer.soniclabs.com/address/${userAddress}`, '_blank');
  };

  return (
    <div className={`connect-wallet-button relative ${className}`} ref={dropdownRef}>
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className={`
            ${getSizeClasses()} 
            ${getVariantClasses()} 
            rounded-lg font-medium 
            transition-all duration-200 
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center
            shadow-md hover:shadow-lg
            ${variant === 'outline' ? 'hover:shadow-blue-100' : 'hover:shadow-blue-200'}
          `}
        >
          {isConnecting ? (
            <>
              <Loader2 className="animate-spin mr-2 h-4 w-4" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              ${getSizeClasses()} 
              bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
              text-white rounded-lg font-medium 
              transition-all duration-200
              flex items-center justify-center
              shadow-md hover:shadow-lg hover:shadow-blue-200
              ${isDropdownOpen ? 'rounded-b-none' : ''}
            `}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {formatAddress(userAddress || '')}
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-1 w-56 origin-top-left rounded-md rounded-t-none bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 animate-dropdownFade">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <p className="font-medium">Connected Wallet</p>
                  <p className="text-xs text-gray-500 truncate">{userAddress}</p>
                </div>

                <button
                  onClick={copyAddress}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {copied ? (
                    <Check className="mr-3 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-3 h-4 w-4 text-gray-500" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>

                <button
                  onClick={viewOnExplorer}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <ExternalLink className="mr-3 h-4 w-4 text-gray-500" />
                  View on Explorer
                </button>

                <button
                  onClick={handleDisconnect}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-500" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;