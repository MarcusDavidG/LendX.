"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getBalance, onBalanceRefresh, offBalanceRefresh, getGasFee, getConfirmationTime, TOKEN_ADDRESSES, TOKEN_DECIMALS, sendTokens } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { 
  ArrowRight, Banknote, Clock, Copy, CreditCard, ExternalLink, 
  Gem, Home, Loader2, RefreshCw, Send, Shield, Smartphone, 
  Sparkles, TrendingUp, Wallet, Zap, ChevronRight, History, 
  ArrowLeftRight, Plus, Minus, AlertCircle, CheckCircle
} from 'lucide-react';

interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  decimals: number;
  formattedBalance: string;
}

const DashboardScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { transactions, trackTransaction } = useTransactionTracker();
  const [activeTab, setActiveTab] = useState<'wallet' | 'overview' | 'activity'>('wallet');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [walletBalance, setWalletBalance] = useState({ S: '0', USDC: '0' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');
  const [sendAmount, setSendAmount] = useState('');
  const [sendToken, setSendToken] = useState('S');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [isMpesaProcessing, setIsMpesaProcessing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const tokens = [
    { symbol: 'S', address: TOKEN_ADDRESSES['S'], decimals: TOKEN_DECIMALS['S'] },
    { symbol: 'USDC', address: TOKEN_ADDRESSES['USDC'], decimals: TOKEN_DECIMALS['USDC'] }
  ];

  // Wallet functions
  const fetchWalletBalances = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const sBalance = await getBalance('S');
      const usdcBalance = await getBalance('USDC');
      setWalletBalance({ S: sBalance, USDC: usdcBalance });
      setLastUpdateTime(Date.now());
    } catch (error: any) {
      console.error('Error fetching wallet balances:', error);
    }
  }, [isConnected, userAddress]);

  const handleSendTokens = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !userAddress) {
      toast.error('Wallet not connected');
      return;
    }
    if (!ethers.isAddress(recipient)) {
      toast.error('Invalid recipient address');
      return;
    }
    if (parseFloat(sendAmount) <= 0 || isNaN(parseFloat(sendAmount))) {
      toast.error('Invalid amount');
      return;
    }
    if (parseFloat(sendAmount) > parseFloat(walletBalance[sendToken as keyof typeof walletBalance])) {
      toast.error(`Insufficient ${sendToken} balance`);
      return;
    }

    setIsSending(true);
    const toastId = toast.loading(`Sending ${sendAmount} ${sendToken}...`);
    try {
      const { success, transactionHash } = await sendTokens(sendToken, recipient, sendAmount);
      if (success && transactionHash) {
        trackTransaction(transactionHash, 'send', sendAmount, sendToken);
        toast.success(`Sent ${sendAmount} ${sendToken}!`, { id: toastId });
        setSendAmount('');
        setRecipient('');
        await fetchWalletBalances();
      } else {
        toast.error('Failed to send tokens', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsSending(false);
    }
  }, [isConnected, userAddress, walletBalance, sendToken, sendAmount, recipient]);

  const handleMpesaDeposit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone.match(/^2547\d{8}$/)) {
      toast.error('Invalid M-Pesa phone number (e.g., 2547XXXXXXXX)');
      return;
    }
    if (parseFloat(mpesaAmount) <= 0 || isNaN(parseFloat(mpesaAmount))) {
      toast.error('Invalid NGN amount');
      return;
    }

    setIsMpesaProcessing(true);
    const toastId = toast.loading('Processing M-Pesa deposit...');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Enter PIN for M-Pesa deposit', { id: toastId, duration: 2000 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      const usdcAmount = (parseFloat(mpesaAmount) / 1550).toFixed(2);
      setWalletBalance(prev => ({
        ...prev,
        USDC: (parseFloat(prev.USDC) + parseFloat(usdcAmount)).toFixed(2)
      }));
      trackTransaction(
        ethers.hexlify(ethers.randomBytes(32)),
        'deposit',
        usdcAmount,
        'USDC'
      );
      toast.success(`Deposited ${usdcAmount} USDC via M-Pesa!`, { id: toastId });
      setMpesaPhone('');
      setMpesaAmount('');
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsMpesaProcessing(false);
    }
  }, [isConnected, userAddress, mpesaPhone, mpesaAmount]);

  // Dashboard functions
  const loadRealBalances = useCallback(async () => {
    if (!isConnected || !userAddress) return;

    setLoading(true);
    setError('');

    try {
      const balancePromises = tokens.map(async (token) => {
        try {
          const balance = await getBalance(token.symbol);
          return {
            symbol: token.symbol,
            balance,
            address: token.address,
            decimals: token.decimals,
            formattedBalance: parseFloat(balance).toFixed(token.decimals === 6 ? 2 : 4)
          };
        } catch (err) {
          console.error(`Error loading ${token.symbol} balance:`, err);
          return {
            symbol: token.symbol,
            balance: '0',
            address: token.address,
            decimals: token.decimals,
            formattedBalance: '0.00'
          };
        }
      });

      const tokenBalances = await Promise.all(balancePromises);
      setBalances(tokenBalances);
    } catch (err) {
      setError('Failed to load balances');
      console.error(err);
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

  const handleRefresh = useCallback(async () => {
    if (loading) return;
    const toastId = toast.loading('Refreshing balances...');
    try {
      await loadRealBalances();
      await fetchWalletBalances();
      toast.success('Balances refreshed!', { id: toastId });
    } catch (error) {
      toast.error('Failed to refresh balances', { id: toastId });
    }
  }, [loading, loadRealBalances, fetchWalletBalances]);

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <Send size={16} className="text-emerald-400" />;
      case 'deposit': return <Plus size={16} className="text-emerald-400" />;
      case 'withdraw': return <Minus size={16} className="text-amber-400" />;
      case 'swap': return <ArrowLeftRight size={16} className="text-blue-400" />;
      case 'loan': return <Banknote size={16} className="text-purple-400" />;
      default: return <RefreshCw size={16} className="text-gray-400" />;
    }
  };

  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'failed': return <AlertCircle size={14} className="text-red-400" />;
      default: return <Loader2 size={14} className="animate-spin text-yellow-400" />;
    }
  };

  const formatLastUpdate = () => {
    const now = Date.now();
    const diff = now - lastUpdateTime;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  useEffect(() => {
    if (isConnected) {
      loadRealBalances();
      fetchWalletBalances();
      fetchMetrics();
    }
  }, [isConnected, loadRealBalances, fetchWalletBalances, fetchMetrics]);

  // Wallet View Component
  const WalletView = () => (
    <div className="space-y-6 ">
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
            <Wallet className="mr-2 text-[var(--primary-color)]" />
            Balances
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchWalletBalances}
              disabled={loading}
              className={`text-sm font-medium transition-all duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <RefreshCw size={16} />
              )}
            </button>
            <ConnectWalletButton size="small" variant="outline" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-[var(--card-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                  <Gem className="text-[var(--primary-color)]" />
                </div>
                <div>
                  <span className="font-medium text-[var(--foreground)]">S Token</span>
                  <p className="text-xs text-[var(--primary-color)]">Native Token</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--foreground)]">{walletBalance.S}</p>
                <p className="text-xs text-[var(--primary-color)]">≈ ${(parseFloat(walletBalance.S) * 1.30).toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-[var(--card-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <Banknote className="text-[var(--primary-color)]" />
                </div>
                <div>
                  <span className="font-medium text-[var(--foreground)]">USDC</span>
                  <p className="text-xs text-[var(--primary-color)]">Stablecoin</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--foreground)]">{walletBalance.USDC}</p>
                <p className="text-xs text-[var(--primary-color)]">≈ ${walletBalance.USDC}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-[var(--primary-color)] flex items-center justify-between">
          <span>Last updated: {formatLastUpdate()}</span>
          <button
            onClick={() => userAddress && copyAddress(userAddress)}
            className="flex items-center hover:text-[var(--primary-color)] transition-colors"
          >
            <span>{userAddress?.substring(0, 6)}...{userAddress?.substring(38)}</span>
            <Copy size={12} className="ml-1" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
            <Send className="mr-2 text-[var(--primary-color)]" />
            Send Tokens
          </h3>
          
          <form onSubmit={handleSendTokens} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <ArrowRight className="mr-2 text-[var(--primary-color)]" size={16} />
                Token to Send
              </label>
              <select
                value={sendToken}
                onChange={(e) => setSendToken(e.target.value)}
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              >
                <option value="S">S Token</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <CreditCard className="mr-2 text-[var(--primary-color)]" size={16} />
                Amount
              </label>
              <input
                type="text"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.0"
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                required
              />
              <div className="text-xs text-[var(--primary-color)] mt-1">
                Available: {walletBalance[sendToken as keyof typeof walletBalance]} {sendToken}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <Wallet className="mr-2 text-[var(--primary-color)]" size={16} />
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSending || loading}
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                isSending || loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-[var(--primary-color)] hover:from-emerald-900 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isSending || loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Tokens</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
            <Smartphone className="mr-2 text-[var(--primary-color)]" />
            Fiat To Crypto Deposit (Mock)
          </h3>
          <p className="text-sm text-white mb-4">
            Deposit NGN to receive USDC (1 USDC = 1550 NGN). This is a mock integration.
          </p>
          
          <form onSubmit={handleMpesaDeposit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <Smartphone className="mr-2 text-[var(--primary-color)]" size={16} />
                M-Pesa Number
              </label>
              <input
                type="text"
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                placeholder="2547XXXXXXXX"
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
                <Banknote className="mr-2 text-[var(--primary-color)]" size={16} />
                Amount (NGN)
              </label>
              <input
                type="text"
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="1000"
                className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              />
              {mpesaAmount && (
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  You'll receive: {(parseFloat(mpesaAmount) / 1550).toFixed(2)} USDC
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isMpesaProcessing}
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                isMpesaProcessing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-[var(--primary-color)] hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isMpesaProcessing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Smartphone size={18} />
                  <span>Deposit via M-Pesa</span>
                </>
              )}
            </button>
          </form>
          
          <p className="text-xs text-[var(--primary-color)] mt-4">
            Mock implementation. Real M-Pesa API would be used in production.
          </p>
        </div>
      </div>
    </div>
  );

  // Overview View Component
  const OverviewView = () => (
    <div className="space-y-6">
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
            <Gem className="mr-2 text-[var(--primary-color)]" />
            Your Assets
          </h3>
          <button
            onClick={handleRefresh}
            className={`flex items-center space-x-1 bg-[var(--primary-color)] hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin rounded-full h-8 w-8 text-[var(--primary-color)] mx-auto" />
            <p className="text-white mt-2">Loading balances...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {balances.map((token) => (
              <div key={token.symbol} className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] hover:border-emerald-500 transition-all group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                        {token.symbol === 'S' ? (
                          <Gem className="text-emerald-400" />
                        ) : (
                          <Banknote className="text-blue-400" />
                        )}
                      </div>
                      <h4 className="font-semibold text-lg text-[var(--foreground)]">{token.symbol}</h4>
                    </div>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-[var(--text-secondary)] mr-2">
                        {token.address.substring(0, 6)}...{token.address.substring(38)}
                      </p>
                      <button 
                        onClick={() => copyAddress(token.address)}
                        className="text-[var(--text-secondary)] hover:text-[var(--primary-color)]"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--foreground)]">{token.formattedBalance}</p>
                    <p className="text-sm text-[var(--primary-color)]">
                      ≈ ${(parseFloat(token.formattedBalance) * (token.symbol === 'S' ? 1.30 : 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-5 flex items-center">
            <Zap className="mr-2 text-[var(--primary-color)]" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/swap"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <ArrowLeftRight className="text-blue-400" />
                </div>
                <span>Swap Tokens</span>
              </div>
              <ChevronRight className="text-[var(--text-secondary)] group-hover:text-[var(--primary-color)]" />
            </Link>
            <Link
              href="/treasury"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/10 rounded-lg mr-3 group-hover:bg-purple-500/20 transition-colors">
                  <Banknote className="text-purple-400" />
                </div>
                <span>View Treasury</span>
              </div>
              <ChevronRight className="text-[var(--text-secondary)] group-hover:text-[var(--primary-color)]" />
            </Link>
            <Link
              href="/loan"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="text-emerald-400" />
                </div>
                <span>Manage Loans</span>
              </div>
              <ChevronRight className="text-[var(--text-secondary)] group-hover:text-[var(--primary-color)]" />
            </Link>
            <Link
              href="/collateral"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
            >
              <div className="flex items-center">
                <div className="p-2 bg-amber-500/10 rounded-lg mr-3 group-hover:bg-amber-500/20 transition-colors">
                  <Shield className="text-amber-400" />
                </div>
                <span>Manage Collateral</span>
              </div>
              <ChevronRight className="text-[var(--text-secondary)] group-hover:text-[var(--primary-color)]" />
            </Link>
          </div>
        </div>

        <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
              <History className="mr-2 text-[var(--primary-color)]" />
              Recent Activity
            </h3>
            <button 
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="text-sm text-[var(--primary-color)] hover:underline"
            >
              {showAllTransactions ? 'Show Less' : 'View All'}
            </button>
          </div>
          {transactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((tx) => (
                <div key={tx.hash} className="p-3 bg-[var(--input-background)] rounded-lg hover:bg-[var(--input-background-hover)] transition-colors">
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="capitalize font-medium text-[var(--foreground)]">{tx.type}</span>
                          <span className="ml-2">
                            {getTransactionStatusIcon(tx.status)}
                          </span>
                        </div>
                        {tx.amount && tx.token && (
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {tx.amount} {tx.token}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-xs text-[var(--text-secondary)]">
                        <a
                          href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:text-[var(--primary-color)]"
                        >
                          {tx.hash.substring(0, 8)}...{tx.hash.substring(36)}
                          <ExternalLink size={12} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[var(--input-background)] rounded-lg">
              <Home className="w-10 h-10 text-white mx-auto mb-3" />
              <p className="text-white">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto ">


      {/* Tab Navigation */}
      <div className="">
        <div className="border-b border-[var(--border-color)]">
          <nav className="-mb-px flex gap-8">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'wallet'
                  ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:border-gray-500'
              }`}
            >
              <Wallet className="inline-block mr-2 h-4 w-4" />
              Wallet
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'overview'
                  ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:border-gray-500'
              }`}
            >
              <Home className="inline-block mr-2 h-4 w-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'activity'
                  ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--primary-color)] hover:border-gray-500'
              }`}
            >
              <History className="inline-block mr-2 h-4 w-4" />
              Activity
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="bg-red-800/30 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <AlertCircle className="text-red-400 mr-2" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-[var(--primary-color)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
            <p className="text-[var(--text-secondary)] mb-6">Connect your wallet to access all features</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'wallet' && <WalletView />}
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'activity' && (
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-5 flex items-center">
                <History className="mr-2 text-[var(--primary-color)]" />
                Transaction History
              </h3>
              {transactions.length > 0 ? (
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {transactions.map((tx) => (
                    <div key={tx.hash} className="p-4 bg-[var(--input-background)] rounded-lg hover:bg-[var(--input-background-hover)] transition-colors">
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="capitalize font-medium text-[var(--foreground)]">{tx.type}</span>
                              <div className="flex items-center mt-1">
                                {getTransactionStatusIcon(tx.status)}
                                <span className="text-xs text-[var(--text-secondary)] ml-1 capitalize">{tx.status}</span>
                              </div>
                            </div>
                            {tx.amount && tx.token && (
                              <span className="text-sm font-medium text-[var(--foreground)]">
                                {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-xs text-[var(--text-secondary)]">
                            <a
                              href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-[var(--primary-color)]"
                            >
                              {tx.hash.substring(0, 8)}...{tx.hash.substring(36)}
                              <ExternalLink size={12} className="ml-1" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[var(--input-background)] rounded-lg">
                  <Home className="w-10 h-10 text-white mx-auto mb-3" />
                  <p className="text-white">No transactions yet</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardScreen;