"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getBalance, onBalanceRefresh, offBalanceRefresh, getGasFee, getConfirmationTime, TOKEN_ADDRESSES, TOKEN_DECIMALS } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { 
  ArrowRight, Banknote, Clock, Copy, ExternalLink, 
  Gem, Home, Loader2, RefreshCw, Send, 
  Shield, Sparkles, TrendingUp, Wallet, Zap 
} from 'lucide-react';
import './components.css';

interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  decimals: number;
  formattedBalance: string;
}

const DashboardScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { transactions } = useTransactionTracker();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');

  const tokens = [
    { symbol: 'S', address: TOKEN_ADDRESSES['S'], decimals: TOKEN_DECIMALS['S'] },
    { symbol: 'USDC', address: TOKEN_ADDRESSES['USDC'], decimals: TOKEN_DECIMALS['USDC'] }
  ];

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

  useEffect(() => {
    if (isConnected) {
      loadRealBalances();
      fetchMetrics();
      onBalanceRefresh(loadRealBalances);
      return () => offBalanceRefresh(loadRealBalances);
    }
  }, [isConnected, loadRealBalances, fetchMetrics]);

  const handleRefresh = async () => {
    if (loading) return;
    const toastId = toast.loading('Refreshing balances...');
    try {
      await loadRealBalances();
      toast.success('Balances refreshed!', { id: toastId });
    } catch (error) {
      toast.error('Failed to refresh balances', { id: toastId });
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <Send size={16} className="text-blue-500" />;
      case 'deposit': return <TrendingUp size={16} className="text-green-500" />;
      case 'loan': return <Banknote size={16} className="text-purple-500" />;
      default: return <RefreshCw size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="dashboard-container max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-10 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SonicFi Dashboard
          </h2>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-yellow-500" />
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-blue-500" />
            <span>{confirmationTime} confirmations</span>
          </div>
          <div className="flex items-center">
            <Sparkles size={16} className="mr-1 text-green-500" />
            <span>{gasFee} fees</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <Shield className="text-red-500 mr-2" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm p-6">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-6">Connect your wallet to view your balances and start transacting</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Gem className="mr-2 text-blue-500" />
                Your Balances
              </h3>
              <button
                onClick={handleRefresh}
                className={`flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                <Loader2 className="animate-spin rounded-full h-8 w-8 text-blue-500 mx-auto" />
                <p className="text-gray-600 mt-2">Loading balances...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                {balances.map((token) => (
                  <div key={token.symbol} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border border-gray-100 hover:border-blue-100 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-800">{token.symbol}</h4>
                        <div className="flex items-center mt-1">
                          <p className="text-xs text-gray-500 mr-2">
                            {token.address.substring(0, 6)}...{token.address.substring(38)}
                          </p>
                          <button 
                            onClick={() => copyAddress(token.address)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">{token.formattedBalance}</p>
                        <p className="text-sm text-gray-500">{token.symbol}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-5 flex items-center">
                <Zap className="mr-2 text-blue-500" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href="/swap"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <ArrowRight size={18} />
                  <span>Swap Tokens</span>
                </Link>
                <Link
                  href="/treasury"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Banknote size={18} />
                  <span>View Treasury</span>
                </Link>
                <Link
                  href="/loan"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <TrendingUp size={18} />
                  <span>Manage Loans</span>
                </Link>
                <Link
                  href="/collateral"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-3 px-4 rounded-lg text-center font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Shield size={18} />
                  <span>Manage Collateral</span>
                </Link>
                <Link
                  href="/wallet"
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 px-4 rounded-lg text-center font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Wallet size={18} />
                  <span>Wallet</span>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-5 flex items-center">
                <Clock className="mr-2 text-blue-500" />
                Recent Activity
              </h3>
              {transactions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.hash} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="capitalize font-medium text-gray-800">{tx.type}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                tx.status === 'success'
                                  ? 'bg-green-100 text-green-800'
                                  : tx.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                          {tx.amount && tx.token && (
                            <div className="text-sm text-gray-600 mt-1">
                              {tx.amount} {tx.token}
                            </div>
                          )}
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <a
                              href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-blue-600"
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
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;