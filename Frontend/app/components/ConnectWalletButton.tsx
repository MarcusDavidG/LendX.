"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { 
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        return 'h-9 px-4 text-xs';
      case 'large':
        return 'h-12 px-8 text-base';
      default:
        return 'h-10 px-5 text-sm';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-700 hover:bg-gray-600 text-white';
      case 'outline':
        return 'border border-green-500 text-green-500 hover:bg-green-900/30';
      case 'ghost':
        return 'hover:bg-gray-700 text-gray-200';
      default:
        return 'bg-transparent border border-green-500 text-white hover:bg-green-500/10';
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
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
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
              bg-gray-800 hover:bg-gray-700 text-white
              rounded-lg font-medium 
              transition-all duration-200
              flex items-center justify-center
              shadow-md
              whitespace-nowrap
            `}
          >
            {getButtonContent()}
          </button>

          {isDropdownOpen && (
            <div style={{backgroundColor: '#161b22'}} className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl shadow-2xl ring-1 ring-black/10 focus:outline-none z-50 animate-dropdownFade">
              <div className="py-2 px-2">
                <div className="px-3 py-3 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 text-green-400">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-base text-white truncate">
                        My Wallet
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {formatAddress(userAddress || '')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={copyAddress}
                    className="flex w-full items-center px-3 py-2.5 text-sm text-white hover:bg-gray-700/50 rounded-md transition-colors"
                  >
                    {copied ? (
                      <Check className="mr-3 h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="mr-3 h-4 w-4 text-green-400" />
                    )}
                    {copied ? 'Copied!' : 'Copy Address'}
                  </button>

                  <button
                    onClick={viewOnExplorer}
                    className="flex w-full items-center px-3 py-2.5 text-sm text-white hover:bg-gray-700/50 rounded-md transition-colors"
                  >
                    <ExternalLink className="mr-3 h-4 w-4 text-green-400" />
                    View on Explorer
                  </button>
                </div>

                <div className="border-t border-gray-700 mx-1"></div>

                <div className="py-2">
                  <button
                    onClick={handleDisconnect}
                    className="flex w-full items-center px-3 py-2.5 text-sm text-white hover:bg-red-500/10 rounded-md transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-red-400" />
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectWalletButton;