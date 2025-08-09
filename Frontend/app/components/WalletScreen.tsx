"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getBalance, sendTokens, onBalanceRefresh, offBalanceRefresh, getGasFee, getConfirmationTime } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send': return '➡️';
      case 'deposit': return '💸';
      case 'loan': return '🏦';
      default: return '🔄';
    }
  };

  return (
    <div className="wallet-container max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">SonicFi Wallet</h2>
      </div>
      <p className="text-xs text-center text-gray-500 mb-4">
        Powered by Sonic: {confirmationTime} confirmations, {gasFee} fees
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
        <div className="wallet-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Balances</h3>
              <p className="text-xs text-gray-500 truncate w-32">{userAddress}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchBalances}
                disabled={loading}
                className="text-sm bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded"
                title="Refresh balances"
              >
                {loading ? '⟳' : '↻'}
              </button>
              <ConnectWalletButton size="small" variant="outline" />
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
              <span className="font-medium">S Token</span>
              <div className="text-right">
                <span className="font-mono text-lg">{balance.S}</span>
                <p className="text-xs text-gray-500">S</p>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-100 rounded">
              <span className="font-medium">USDC</span>
              <div className="text-right">
                <span className="font-mono text-lg">{balance.USDC}</span>
                <p className="text-xs text-gray-500">USDC</p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mb-4">
            Last updated: {formatLastUpdate()}
          </div>

          <form onSubmit={handleSendTokens} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Send Tokens</h3>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Token</label>
              <select
                value={sendToken}
                onChange={(e) => setSendToken(e.target.value)}
                className="form-select w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="S">S Token</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Amount</label>
              <input
                type="number"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.0"
                className="form-input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="form-input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSending || loading}
              className={`w-full font-bold py-2 px-4 rounded ${
                isSending || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-700 text-white'
              }`}
            >
              {isSending || loading ? 'Processing...' : 'Send Tokens'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-bold mb-2 text-green-800">M-Pesa Deposit (Mock)</h3>
            <p className="text-sm text-green-700 mb-3">
              Deposit KES to receive USDC (1 USDC = 130 KES). This is a mock integration.
            </p>
            <form onSubmit={handleMpesaDeposit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">M-Pesa Number</label>
                <input
                  type="text"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  placeholder="2547XXXXXXXX"
                  className="w-full p-2 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Amount (KES)</label>
                <input
                  type="number"
                  value={mpesaAmount}
                  onChange={(e) => setMpesaAmount(e.target.value)}
                  placeholder="1000"
                  className="w-full p-2 border border-green-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                type="submit"
                disabled={isMpesaProcessing}
                className={`col-span-2 mt-3 w-full bg-green-600 hover:bg-green-800 text-white font-medium py-2 px-4 rounded text-sm ${
                  isMpesaProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isMpesaProcessing ? 'Processing...' : 'Deposit via M-Pesa'}
              </button>
            </form>
            <p className="text-xs text-green-600 mt-2">
              Mock implementation. Real M-Pesa API would be used in production.
            </p>
          </div>

          {transactions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2 text-gray-800">Recent Transactions</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {transactions.map(tx => (
                  <div key={tx.hash} className="p-2 bg-gray-50 rounded text-xs flex items-center">
                    <span className="mr-2">{getTransactionIcon(tx.type)}</span>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="capitalize">{tx.type}</span>
                        <span
                          className={`${
                            tx.status === 'success'
                              ? 'text-green-600'
                              : tx.status === 'failed'
                              ? 'text-red-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      {tx.amount && tx.token && (
                        <div>
                          {tx.amount} {tx.token}
                        </div>
                      )}
                      <div className="text-gray-500 truncate">
                        <a
                          href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {tx.hash.substring(0, 10)}...{tx.hash.substring(38)}
                        </a>
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