"use client";

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import { getBalance, swapTokens, getGasFee, getConfirmationTime, TOKEN_ADDRESSES, TOKEN_DECIMALS, UniswapV3Service } from '../utils/web3';
import ConnectWalletButton from './ConnectWalletButton';
import { 
  ArrowDownUp, ArrowRight, Clock, Copy, 
  Loader2, RefreshCw, Shield, 
  Wallet, Zap 
} from 'lucide-react';
import './components.css';

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon?: string;
}

const EnhancedSwapScreen = () => {
  const { isConnected, userAddress } = useWallet();
  const { trackTransaction } = useTransactionTracker();
  const [fromToken, setFromToken] = useState<Token>({
    symbol: 'S',
    name: 'S Token',
    address: TOKEN_ADDRESSES['S'],
    decimals: TOKEN_DECIMALS['S'],
    icon: '/s-token-icon.png'
  });
  const [toToken, setToToken] = useState<Token>({
    symbol: 'USDC',
    name: 'USDC',
    address: TOKEN_ADDRESSES['USDC'],
    decimals: TOKEN_DECIMALS['USDC'],
    icon: '/usdc-icon.png'
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
  const [priceImpact, setPriceImpact] = useState('0.00');

  const tokens: Token[] = [
    { 
      symbol: 'S', 
      name: 'S Token', 
      address: TOKEN_ADDRESSES['S'], 
      decimals: TOKEN_DECIMALS['S'],
      icon: '/s-token-icon.png'
    },
    { 
      symbol: 'USDC', 
      name: 'USDC', 
      address: TOKEN_ADDRESSES['USDC'], 
      decimals: TOKEN_DECIMALS['USDC'],
      icon: '/usdc-icon.png'
    }
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
  }, [amount, fromToken, toToken, slippageTolerance]);

  const estimateOutput = async () => {
    if (!amount || fromToken.address === toToken.address) {
      setEstimatedOutput('');
      setNeedsApproval(false);
      setPriceImpact('0.00');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setEstimatedOutput('');
      setNeedsApproval(false);
      setPriceImpact('0.00');
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
      setNeedsApproval(true);
      setGasEstimate('~21000 gas');
      setPriceImpact((Math.random() * 0.5).toFixed(2));
      setErrorMessage('');
    } catch (error: any) {
      setEstimatedOutput('');
      setPriceImpact('0.00');
      setErrorMessage('Error getting swap quote');
      toast.error('Error getting swap quote');
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading('Simulating token approval...');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
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
        setNeedsApproval(true);
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

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return '0.00';
    const num = parseFloat(balance);
    return num.toFixed(num < 1 ? 4 : 2);
  };

  return (
    <div className="swap-container max-w-md mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-lg">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img src="/sonic-logo.png" alt="SonicFi" className="h-10 mr-3" />
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SonicFi Swap
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
            <Shield size={16} className="mr-1 text-green-500" />
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
            <p className="text-gray-500 mb-6">Connect your wallet to swap tokens</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSwap} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">From</label>
                <div className="text-xs text-gray-500 flex items-center">
                  <span>Balance: {formatBalance(balances[fromToken.symbol])}</span>
                  <button 
                    type="button" 
                    onClick={() => setAmount(balances[fromToken.symbol] || '0')}
                    className="ml-2 text-blue-500 hover:text-blue-700 text-xs"
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full p-3 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none"
                    required
                    min="0"
                    step="0.0001"
                  />
                </div>
                <div className="w-32">
                  <select
                    value={fromToken.symbol}
                    onChange={(e) => {
                      const selected = tokens.find(t => t.symbol === e.target.value)!;
                      setFromToken(selected);
                    }}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={switchTokens}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full border border-gray-200 shadow-sm"
              >
                <ArrowDownUp size={16} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">To</label>
                <div className="text-xs text-gray-500">
                  <span>Balance: {formatBalance(balances[toToken.symbol])}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={estimatedOutput || '0.0'}
                    readOnly
                    className="w-full p-3 text-lg border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-500"
                  />
                </div>
                <div className="w-32">
                  <select
                    value={toToken.symbol}
                    onChange={(e) => {
                      const selected = tokens.find(t => t.symbol === e.target.value)!;
                      setToToken(selected);
                    }}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {tokens.map(token => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
              <Shield className="mr-2 text-blue-500" size={16} />
              Swap Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-blue-600">Slippage Tolerance:</span>
                <p>{slippageTolerance}%</p>
              </div>
              <div>
                <span className="text-blue-600">Minimum Received:</span>
                <p>{estimatedOutput ? (parseFloat(estimatedOutput) * (1 - slippageTolerance / 100)).toFixed(4) : '0'} {toToken.symbol}</p>
              </div>
              <div>
                <span className="text-blue-600">Price Impact:</span>
                <p>{priceImpact}%</p>
              </div>
              <div>
                <span className="text-blue-600">Gas Estimate:</span>
                <p>{gasEstimate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {needsApproval ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || isSwapping}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all ${
                  isApproving || isSwapping
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} />
                    <span>Approve {fromToken.symbol}</span>
                  </>
                )}
              </button>
            ) : null}

            <button
              type="submit"
              disabled={isSwapping || isApproving || !amount || !estimatedOutput}
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all ${
                isSwapping || isApproving || !amount || !estimatedOutput
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg'
              }`}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Swapping...</span>
                </>
              ) : (
                <>
                  <span>Swap {fromToken.symbol} to {toToken.symbol}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Mock implementation. Real Uniswap V3 swaps would be used in production.
          </p>
        </form>
      )}
    </div>
  );
};

export default EnhancedSwapScreen;