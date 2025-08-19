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
  Check,
  User
} from 'lucide-react';
import './components.css';

interface ConnectWalletButtonProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  showAddress?: boolean;
  className?: string;
  redirectOnConnect?: boolean;
  redirectTo?: string;
  showFullAddress?: boolean;
  showWalletIcon?: boolean;
}

const ConnectWalletButton: React.FC<ConnectWalletButtonProps> = ({
  size = 'medium',
  variant = 'primary',
  showAddress = false,
  className = '',
  redirectOnConnect = true,
  redirectTo = '/dashboard',
  showFullAddress = false,
  showWalletIcon = true,
}) => {
  const { isConnected, userAddress, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
        return 'h-8 px-3 text-xs';
      case 'large':
        return 'h-12 px-6 text-base';
      default:
        return 'h-10 px-4 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white';
      case 'outline':
        return 'border border-blue-500 text-blue-500 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/30';
      case 'ghost':
        return 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg';
    }
  };

  const formatAddress = (address: string) => {
    if (showFullAddress) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleConnect = async () => {
    if (isConnecting) return;
    const toastId = toast.loading('Connecting wallet...');
    try {
      const address = await connectWallet();
      if (address) {
        toast.success('Wallet connected successfully!', { id: toastId });
        if (redirectOnConnect) {
          router.push(redirectTo);
        }
      }
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`, { id: toastId });
    }
  };

  const handleDisconnect = async () => {
    const toastId = toast.loading('Disconnecting wallet...');
    try {
      await disconnectWallet();
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

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          Connecting...
        </>
      );
    }

    if (isConnected) {
      return (
        <>
          {showWalletIcon && <Wallet className="mr-2 h-4 w-4" />}
          {formatAddress(userAddress || '')}
          <ChevronDown 
            className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        </>
      );
    }

    return (
      <>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </>
    );
  };

  return (
    <div 
      className={`relative inline-block ${className}`} 
      ref={dropdownRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            ${variant === 'outline' ? 'hover:shadow-blue-100' : ''}
            ${variant === 'ghost' ? 'shadow-none' : ''}
            whitespace-nowrap
          `}
        >
          {getButtonContent()}
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              ${getSizeClasses()} 
              ${variant === 'ghost' ? getVariantClasses() : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'}
              rounded-lg font-medium 
              transition-all duration-200
              flex items-center justify-center
              ${variant === 'ghost' ? '' : 'shadow-md hover:shadow-lg hover:shadow-blue-200'}
              ${isDropdownOpen && variant !== 'ghost' ? 'rounded-b-none' : ''}
              whitespace-nowrap
            `}
          >
            {getButtonContent()}
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-1 w-56 origin-top-left rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none z-50 animate-dropdownFade">
              <div className="py-1">
                <div className="px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        Wallet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {formatAddress(userAddress || '')}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={copyAddress}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {copied ? (
                    <Check className="mr-3 h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>

                <button
                  onClick={viewOnExplorer}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <ExternalLink className="mr-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  View on Explorer
                </button>

                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                <button
                  onClick={handleDisconnect}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <LogOut className="mr-3 h-4 w-4 text-red-500 dark:text-red-400" />
                  Disconnect Wallet
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