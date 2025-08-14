"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useWallet } from "../contexts/WalletContext";
import { useTransactionTracker } from "../hooks/useTransactionTracker";
import {
  getBalance,
  swapTokens,
  getGasFee,
  getConfirmationTime,
  TOKEN_ADDRESSES,
  TOKEN_DECIMALS,
  UniswapV3Service,
} from "../utils/web3";
import ConnectWalletButton from "./ConnectWalletButton";
import { ArrowDownUp, Clock, Loader2, Shield, Wallet, Zap } from "lucide-react";

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
    symbol: "S",
    name: "S Token",
    address: TOKEN_ADDRESSES["S"],
    decimals: TOKEN_DECIMALS["S"],
    icon: "/s-token-icon.png",
  });
  const [toToken, setToToken] = useState<Token>({
    symbol: "USDC",
    name: "USDC",
    address: TOKEN_ADDRESSES["USDC"],
    decimals: TOKEN_DECIMALS["USDC"],
    icon: "/usdc-icon.png",
  });
  const [amount, setAmount] = useState("");
  const [estimatedOutput, setEstimatedOutput] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [balances, setBalances] = useState<{ [key: string]: string }>({});
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [gasEstimate, setGasEstimate] = useState("~21000 gas");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [gasFee, setGasFee] = useState("~$0.001");
  const [confirmationTime, setConfirmationTime] = useState("~2s");
  const [priceImpact, setPriceImpact] = useState("0.00");

  const tokens: Token[] = [
    {
      symbol: "S",
      name: "S Token",
      address: TOKEN_ADDRESSES["S"],
      decimals: TOKEN_DECIMALS["S"],
      icon: "/s-token-icon.png",
    },
    {
      symbol: "USDC",
      name: "USDC",
      address: TOKEN_ADDRESSES["USDC"],
      decimals: TOKEN_DECIMALS["USDC"],
      icon: "/usdc-icon.png",
    },
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
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage("Error loading token balances");
      console.error("Error loading balances:", error);
    }
  }, [isConnected, userAddress]);

  const fetchMetrics = useCallback(async () => {
    try {
      const fee = await getGasFee();
      const time = await getConfirmationTime();
      setGasFee(fee);
      setConfirmationTime(time);
    } catch (error) {
      console.error("Error fetching metrics:", error);
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
      setEstimatedOutput("");
      setNeedsApproval(false);
      setPriceImpact("0.00");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setEstimatedOutput("");
      setNeedsApproval(false);
      setPriceImpact("0.00");
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
      setGasEstimate("~21000 gas");
      setPriceImpact((Math.random() * 0.5).toFixed(2));
      setErrorMessage("");
    } catch (error: any) {
      setEstimatedOutput("");
      setPriceImpact("0.00");
      setErrorMessage("Error getting swap quote");
      toast.error("Error getting swap quote");
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    const toastId = toast.loading("Simulating token approval...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Token approved successfully!", { id: toastId });
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
      toast.error("Wallet not connected");
      return;
    }
    if (!amount || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      toast.error("Invalid amount");
      return;
    }
    if (parseFloat(amount) > parseFloat(balances[fromToken.symbol] || "0")) {
      toast.error(`Insufficient ${fromToken.symbol} balance`);
      return;
    }
    if (fromToken.address === toToken.address) {
      toast.error("Cannot swap same token");
      return;
    }

    setIsSwapping(true);
    const toastId = toast.loading("Executing swap...");
    try {
      const swapDetails = await swapTokens(fromToken.symbol, toToken.symbol, amount, slippageTolerance);
      if (swapDetails) {
        trackTransaction(swapDetails.transactionHash, "send", amount, `${fromToken.symbol}->${toToken.symbol}`);
        setBalances((prev) => ({
          ...prev,
          [fromToken.symbol]: (parseFloat(prev[fromToken.symbol] || "0") - parseFloat(amount)).toFixed(
            fromToken.decimals === 6 ? 2 : 4
          ),
          [toToken.symbol]: (parseFloat(prev[toToken.symbol] || "0") + parseFloat(swapDetails.amountOut)).toFixed(
            toToken.decimals === 6 ? 2 : 4
          ),
        }));
        toast.success(`Swapped ${amount} ${fromToken.symbol} for ${swapDetails.amountOut} ${toToken.symbol}!`, {
          id: toastId,
        });
        setAmount("");
        setEstimatedOutput("");
        setNeedsApproval(true);
      } else {
        toast.error("Swap failed", { id: toastId });
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
    setAmount("");
    setEstimatedOutput("");
    setNeedsApproval(false);
  };

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return "0.00";
    const num = parseFloat(balance);
    return num.toFixed(num < 1 ? 4 : 2);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 bg-[var(--background)] rounded-2xl shadow-xl border border-[var(--border-color)]">
      <div className="flex flex-col items-center mb-6">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-white">
          <div className="flex items-center">
            <Zap size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>Powered by Sonic</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>{confirmationTime} confirmations</span>
          </div>
          <div className="flex items-center">
            <Shield size={16} className="mr-1 text-[var(--primary-color)]" />
            <span>{gasFee} fees</span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-800 border-l-4 border-red-500 rounded p-4 mb-6 flex items-center">
          <Shield className="text-red-400 mr-2" />
          <p className="text-red-200">{errorMessage}</p>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-12 bg-[var(--card-background)] rounded-2xl shadow-lg p-6 border border-[var(--border-color)]">
          <div className="max-w-md mx-auto">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Connect Your Wallet</h3>
            <p className="text-gray-400 mb-6">Connect your wallet to swap tokens</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSwap} className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] space-y-4">
          <div className="space-y-4">
            <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
              <div className="flex justify-between items-center mb-2">
                <label className=" text-sm font-medium text-[var(--foreground)] flex items-center">
                  <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                  From
                </label>
                <div className="text-xs text-white flex items-center">
                  <span>Balance: {formatBalance(balances[fromToken.symbol])}</span>
                  <button
                    type="button"
                    onClick={() => setAmount(balances[fromToken.symbol] || "0")}
                    className="ml-2 text-[var(--primary-color)] hover:text-emerald-600 text-xs"
                  >
                    Max
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.0"
                    className="w-full p-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-[var(--foreground)]"
                    required
                  />
                </div>
                <div className="w-32">
                  <select
                    value={fromToken.symbol}
                    onChange={(e) => {
                      const selected = tokens.find((t) => t.symbol === e.target.value)!;
                      setFromToken(selected);
                    }}
                    className="w-full p-2 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                  >
                    {tokens.map((token) => (
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
                className="bg-[var(--input-background)] hover:bg-gray-700 text-[var(--primary-color)] p-2 rounded-full border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all"
              >
                <ArrowDownUp size={16} />
              </button>
            </div>

            <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
              <div className="flex justify-between items-center mb-2">
                <label className=" text-sm font-medium text-[var(--foreground)] flex items-center">
                  <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
                  To
                </label>
                <div className="text-xs text-white">
                  <span>Balance: {formatBalance(balances[toToken.symbol])}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={estimatedOutput || "0.0"}
                    readOnly
                    className="w-full p-3 bg-transparent border-0 focus:ring-0 focus:outline-none text-white"
                  />
                </div>
                <div className="w-32">
                  <select
                    value={toToken.symbol}
                    onChange={(e) => {
                      const selected = tokens.find((t) => t.symbol === e.target.value)!;
                      setToToken(selected);
                    }}
                    className="w-full p-2 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
                  >
                    {tokens.map((token) => (
                      <option key={token.symbol} value={token.symbol}>
                        {token.symbol}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--input-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center">
              <Shield className="mr-2 text-[var(--primary-color)]" size={16} />
              Swap Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[var(--primary-color)]">Slippage Tolerance:</span>
                <p className="text-[var(--foreground)]">{slippageTolerance}%</p>
              </div>
              <div>
                <span className="text-[var(--primary-color)]">Minimum Received:</span>
                <p className="text-[var(--foreground)]">
                  {estimatedOutput ? (parseFloat(estimatedOutput) * (1 - slippageTolerance / 100)).toFixed(4) : "0"}{" "}
                  {toToken.symbol}
                </p>
              </div>
              <div>
                <span className="text-[var(--primary-color)]">Price Impact:</span>
                <p className="text-[var(--foreground)]">{priceImpact}%</p>
              </div>
              <div>
                <span className="text-[var(--primary-color)]">Gas Estimate:</span>
                <p className="text-[var(--foreground)]">{gasEstimate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {needsApproval ? (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving || isSwapping}
                className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                  isApproving || isSwapping
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700 text-[var(--foreground)] shadow-md hover:shadow-lg"
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
              className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                isSwapping || isApproving || !amount || !estimatedOutput
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-[var(--primary-color)] hover:bg-emerald-600 text-[var(--foreground)] shadow-md hover:shadow-lg"
              }`}
            >
              {isSwapping ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Swapping...</span>
                </>
              ) : (
                <>
                  <ArrowDownUp size={18} />
                  <span>Swap {fromToken.symbol} to {toToken.symbol}</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-white text-center mt-4">
            Mock implementation. Real Uniswap V3 swaps would be used in production.
          </p>
        </form>
      )}
    </div>
  );
};

export default EnhancedSwapScreen;

