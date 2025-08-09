"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getBalance, swapTokens, getGasFee, getConfirmationTime, TOKEN_ADDRESSES, TOKEN_DECIMALS, UniswapV3Service } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import './components.css';

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

const EnhancedSwapScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [fromToken, setFromToken] = useState<Token>({
    symbol: 'S',
    name: 'S Token',
    address: TOKEN_ADDRESSES['S'],
    decimals: TOKEN_DECIMALS['S']
  });
  const [toToken, setToToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USDC',
    address: TOKEN_ADDRESSES['USDC'],
    decimals: TOKEN_DECIMALS['USDC']
  });
  const [amount, setAmount] = useState('');
  const [estimatedOutput, setEstimatedOutput] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [gasEstimate, setGasEstimate] = useState('~21000 gas');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [gasFee, setGasFee] = useState('~$0.001');
  const [confirmationTime, setConfirmationTime] = useState('~2s');

  const tokens: Token[] = [
    { symbol: 'S', name: 'S Token', address: TOKEN_ADDRESSES['S'], decimals: TOKEN_DECIMALS['S'] },
    { symbol: 'USDC', name: 'USDC', address: TOKEN_ADDRESSES['USDC'], decimals: TOKEN_DECIMALS['USDC'] }
  ];

  const uniswapService = UniswapV3Service.getInstance();

  const loadBalances = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const newBalances: { [key: string]: string } = {};
      for (const token of tokens) {
        const balance = await getBalance(token.symbol);
        newBalances[token.symbol] = balance;
      }
      setBalances(newBalances);
      setErrorMessage('');
    } catch (error: any) {
      setErrorMessage('Error loading token balances');
      console.error('Error loading balances:', error);
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
      loadBalances();
      fetchMetrics();
    }
  }, [isConnected, userAddress, loadBalances, fetchMetrics]);

  useEffect(() => {
    if (amount && fromToken && toToken) {
      estimateOutput();
    }
  }, [amount, fromToken, toToken]);

  const estimateOutput = async () => {
    if (!amount || fromToken.address === toToken.address) {
      setEstimatedOutput('');
      setNeedsApproval(false);
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setEstimatedOutput('');
      setNeedsApproval(false);
      return;
    }

    try {
      const output = await uniswapService.calculateExactSwapAmounts(
        fromToken.symbol,
        toToken.symbol,
        amount,
        slippageTolerance
      );
      setEstimatedOutput(output.amountOut);
      setNeedsApproval(true); // Mock: always require approval
      setGasEstimate('~21000 gas'); // Mock gas estimate
      setErrorMessage('');
    } catch (error: any) {
      setEstimatedOutput('');
      setErrorMessage('Error getting swap quote');
      toast.error('Error getting swap quote');
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading('Simulating token approval...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s approval delay
      toast.success('Token approved successfully!', { id: toastId });
      setNeedsApproval(false);
    } catch (error: any) {
      toast.error(`Approval failed: ${error.message}`, { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !userAddress) {
      toast.error('Wallet not connected');
      return;
    }
    if (!amount || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      toast.error('Invalid amount');
      return;
    }
    if (parseFloat(amount) > parseFloat(balances[fromToken.symbol] || '0')) {
      toast.error(`Insufficient ${fromToken.symbol} balance`);
      return;
    }
    if (fromToken.address === toToken.address) {
      toast.error('Cannot swap same token');
      return;
    }

    setIsSwapping(true);
    const toastId = toast.loading('Executing swap...');
    try {
      const swapDetails = await swapTokens(fromToken.symbol, toToken.symbol, amount, slippageTolerance);
      if (swapDetails) {
        trackTransaction(swapDetails.transactionHash, 'send', amount, `${fromToken.symbol}->${toToken.symbol}`);
        setBalances(prev => ({
          ...prev,
          [fromToken.symbol]: (parseFloat(prev[fromToken.symbol] || '0') - parseFloat(amount)).toFixed(fromToken.decimals === 6 ? 2 : 4),
          [toToken.symbol]: (parseFloat(prev[toToken.symbol] || '0') + parseFloat(swapDetails.amountOut)).toFixed(toToken.decimals === 6 ? 2 : 4)
        }));
        toast.success(`Swapped ${amount} ${fromToken.symbol} for ${swapDetails.amountOut} ${toToken.symbol}!`, { id: toastId });
        setAmount('');
        setEstimatedOutput('');
        setNeedsApproval(true); // Reset for next swap
      } else {
        toast.error('Swap failed', { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Swap failed: ${error.message}`, { id: toastId });
    } finally {
      setIsSwapping(false);
    }
  };

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setEstimatedOutput('');
    setNeedsApproval(false);
  };

  return (
    <div className="swap-container max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-center mb-4">
        <img src="/sonic-logo.png" alt="SonicFi" className="h-8 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800">SonicFi Swap</h2>
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
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Connect your wallet to swap tokens</p>
          <ConnectWalletButton size="large" variant="primary" />
        </div>
      ) : (
        <form onSubmit={handleSwap} className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">From</label>
            <div className="flex items-center space-x-2">
              <select
                value={fromToken.symbol}
                onChange={(e) => {
                  const selected = tokens.find(t => t.symbol === e.target.value)!;
                  setFromToken(selected);
                }}
                className="form-select w-1/3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tokens.map(token => (
                  <option key={token.symbol} value={token.symbol}>{token.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="form-input w-2/3 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Balance: {balances[fromToken.symbol] || '0'} {fromToken.symbol}
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={switchTokens}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-full"
            >
              ↓↑
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">To</label>
            <select
              value={toToken.symbol}
              onChange={(e) => {
                const selected = tokens.find(t => t.symbol === e.target.value)!;
                setToToken(selected);
              }}
              className="form-select w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tokens.map(token => (
                <option key={token.symbol} value={token.symbol}>{token.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Estimated Output: {estimatedOutput || '0'} {toToken.symbol}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Slippage Tolerance (%)</label>
            <input
              type="number"
              value={slippageTolerance}
              onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
              placeholder="0.5"
              className="form-input w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0.1"
              max="5"
              step="0.1"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">Swap Details</h4>
            <p className="text-xs text-blue-700">Gas Estimate: {gasEstimate}</p>
            <p className="text-xs text-blue-700">Minimum Received: {estimatedOutput ? (parseFloat(estimatedOutput) * (1 - slippageTolerance / 100)).toFixed(2) : '0'} {toToken.symbol}</p>
            <p className="text-xs text-blue-700">Price Impact: {estimatedOutput && amount ? (Math.random() * 0.5).toFixed(2) : '0'}%</p>
          </div>

          {needsApproval ? (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || isSwapping}
              className={`w-full font-bold py-2 px-4 rounded ${
                isApproving || isSwapping ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isApproving ? 'Approving...' : 'Approve Token'}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSwapping || isApproving}
              className={`w-full font-bold py-2 px-4 rounded ${
                isSwapping || isApproving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
            >
              {isSwapping ? 'Swapping...' : 'Swap Tokens'}
            </button>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Mock implementation. Real Uniswap V3 swaps would be used in production.
          </p>
        </form>
      )}
    </div>
  );
};

export default EnhancedSwapScreen;
