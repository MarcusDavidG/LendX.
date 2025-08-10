"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getBalance, sendTokens, onBalanceRefresh, offBalanceRefresh, getGasFee, getConfirmationTime } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { 
  ArrowRight, Banknote, Clock, Copy, CreditCard, 
  ExternalLink, Loader2, RefreshCw, Send, 
  Shield, Smartphone, Wallet, Zap, Gem
} from 'lucide-react';
import './components.css';

const WalletScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { transactions, trackTransaction, loading } = useTransactionTracker();
  const [balance, setBalance] = useState({ S: '0', USDC: '0' });
  const [sendAmount, setSendAmount] = useState('');
  const [sendToken, setSendToken] = useState('S');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [isMpesaProcessing, setIsMpesaProcessing] = useState(false);
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');

  const fetchBalances = useCallback(async () => {
    if (!isConnected || !userAddress) {
      setErrorMessage('Wallet not connected');
      return;
    }
    try {
      const sBalance = await getBalance('S');
      const usdcBalance = await getBalance('USDC');
      setBalance({ S: sBalance, USDC: usdcBalance });
      setLastUpdateTime(Date.now());
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage(`Error fetching balances: ${error.message}`);
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
      fetchBalances();
      fetchMetrics();
      onBalanceRefresh(fetchBalances);
      return () => offBalanceRefresh(fetchBalances);
    }
  }, [isConnected, userAddress, fetchBalances, fetchMetrics]);

  const handleSendTokens = async (e: React.FormEvent) => {
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
    if (parseFloat(sendAmount) > parseFloat(balance[sendToken as keyof typeof balance])) {
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
      } else {
        toast.error('Failed to send tokens', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } finally {
      setIsSending(false);
    }
  };

  const handleMpesaDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPhone.match(/^2547\d{8}$/)) {
      toast.error('Invalid M-Pesa phone number (e.g., 2547XXXXXXXX)');
      return;
    }
    if (parseFloat(mpesaAmount) <= 0 || isNaN(parseFloat(mpesaAmount))) {
      toast.error('Invalid KES amount');
      return;
    }

    setIsMpesaProcessing(true);
    const toastId = toast.loading('Processing M-Pesa deposit...');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      toast.success('Enter PIN for M-Pesa deposit', { id: toastId, duration: 2000 });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate PIN confirmation
      const usdcAmount = (parseFloat(mpesaAmount) / 130).toFixed(2); // Mock KES to USDC rate
      setBalance(prev => ({
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
  };

  const formatLastUpdate = () => {
    const now = Date.now();
    const diff = now - lastUpdateTime;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const copyAddress = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      toast.success('Address copied to clipboard');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return <Send size={16} className="text-blue-500" />;
      case 'deposit': return <ArrowRight size={16} className="text-green-500" />;
      case 'loan': return <CreditCard size={16} className="text-purple-500" />;
      default: return <RefreshCw size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="wallet-container max-w-lg mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-10 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SonicFi Wallet
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
            <Banknote size={16} className="mr-1 text-green-500" />
            <span>{gasFee} fees</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <Shield className="text-red-500 mr-2" />
          <p className="text-red-600">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm p-6">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-6">Connect your wallet to view balances and make transactions</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <Wallet className="mr-2 text-blue-500" />
                Wallet Balances
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchBalances}
                  disabled={loading}
                  className={`flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  <span>Refresh</span>
                </button>
                <ConnectWalletButton size="small" variant="outline" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gem className="text-blue-500 mr-2" />
                    <span className="font-medium">S Token</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{balance.S}</p>
                    <p className="text-xs text-gray-500">S</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Banknote className="text-green-500 mr-2" />
                    <span className="font-medium">USDC</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{balance.USDC}</p>
                    <p className="text-xs text-gray-500">USDC</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>Last updated: {formatLastUpdate()}</span>
              <button
                onClick={copyAddress}
                className="flex items-center hover:text-blue-600"
              >
                <span>{userAddress?.substring(0, 6)}...{userAddress?.substring(38)}</span>
                <Copy size={12} className="ml-1" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Send className="mr-2 text-blue-500" />
              Send Tokens
            </h3>
            
            <form onSubmit={handleSendTokens} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <ArrowRight className="mr-2 text-blue-500" size={16} />
                  Token to Send
                </label>
                <select
                  value={sendToken}
                  onChange={(e) => setSendToken(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="S">S Token</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <CreditCard className="mr-2 text-blue-500" size={16} />
                  Amount
                </label>
                <input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <Wallet className="mr-2 text-blue-500" size={16} />
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isSending || loading}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all ${
                  isSending || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg'
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

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Smartphone className="mr-2 text-green-500" />
              M-Pesa Deposit (Mock)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Deposit KES to receive USDC (1 USDC = 130 KES). This is a mock integration.
            </p>
            
            <form onSubmit={handleMpesaDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <Smartphone className="mr-2 text-green-500" size={16} />
                  M-Pesa Number
                </label>
                <input
                  type="text"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 flex items-center">
                  <Banknote className="mr-2 text-green-500" size={16} />
                  Amount (KES)
                </label>
                <input
                  type="number"
                  value={mpesaAmount}
                  onChange={(e) => setMpesaAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              
              <button
                type="submit"
                disabled={isMpesaProcessing}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all ${
                  isMpesaProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg'
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
            
            <p className="text-xs text-gray-500 mt-4">
              Mock implementation. Real M-Pesa API would be used in production.
            </p>
          </div>

          {transactions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <RefreshCw className="mr-2 text-blue-500" />
                Recent Transactions
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {transactions.map(tx => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletScreen;