'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getBalance, sendTokens, TOKEN_ADDRESSES, TOKEN_DECIMALS } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';
import { useTransactionTracker } from '../hooks/useTransactionTracker';
import ConnectWalletButton from './ConnectWalletButton';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { usePersistentLoan } from '../hooks/usePersistentLoan';
import { NFT } from '../hooks/useNFTData';
import FiatGatewayScreen from './FiatGatewayScreen';
import {
  ArrowRight, Banknote, Copy, CreditCard, ExternalLink,
  Gem, Home, Loader2, RefreshCw, Send, Shield, Smartphone,
  Sparkles, TrendingUp, Wallet, Zap, ChevronRight, History,
  ArrowLeftRight, Plus, Minus, AlertCircle, CheckCircle, Lock
} from 'lucide-react';

interface TokenBalance {
  symbol: string;
  balance: string;
  address: string;
  decimals: number;
  formattedBalance: string;
}

interface LoanInfo {
  amount: string;
  interest: string;
  dueDate: string;
}

interface Transaction {
  hash: string;
  type: 'send' | 'deposit' | 'withdraw' | 'swap' | 'loan' | 'repay';
  status: 'success' | 'failed' | 'pending' | 'unknown';
  amount?: string;
  token?: string;
}

interface WalletViewProps {
  fetchWalletBalances: () => Promise<void>;
  loading: boolean;
  walletBalance: { STK: string; USDC: string };
  formatLastUpdate: () => string;
  userAddress: string | null;
  copyAddress: (address: string) => void;
  handleSendTokens: (e: React.FormEvent) => Promise<void>;
  sendToken: string;
  setSendToken: (token: string) => void;
  sendAmount: string;
  setSendAmount: (amount: string) => void;
  recipient: string;
  setRecipient: (recipient: string) => void;
  isSending: boolean;
}



const WalletView: React.FC<WalletViewProps> = ({
  fetchWalletBalances,
  loading,
  walletBalance,
  formatLastUpdate,
  userAddress,
  copyAddress,
  handleSendTokens,
  sendToken,
  setSendToken,
  sendAmount,
  setSendAmount,
  recipient,
  setRecipient,
  isSending,
}) => (
  <div className="space-y-6">
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
            className={`text-sm font-medium transition-all duration-200 text-[var(--primary-color)] hover:scale-105 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label="Refresh balances"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw size={16} />}
          </button>
          <ConnectWalletButton size="small" variant="outline" />
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-[var(--card-background)] rounded-xl p-4 border border-[var(--border-color)] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gray-700/50 rounded-lg mr-3 h-10 w-10"></div>
                  <div>
                    <div className="h-4 bg-gray-700/50 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-24"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-gray-700/50 rounded w-20 mb-2"></div>
                  <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-[var(--card-background)] rounded-xl p-4 border border-[var(--border-color)] hover:border-emerald-500 transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                  <Gem className="text-[var(--primary-color)]" />
                </div>
                <div>
                  <span className="font-medium text-[var(--foreground)]">STK</span>
                  <p className="text-xs text-[var(--primary-color)]">Native Token</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--foreground)]">{walletBalance.STK}</p>
                <p className="text-xs text-[var(--primary-color)]">≈ ${(parseFloat(walletBalance.STK) * 1.30).toFixed(2)}</p>
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
      )}
      <div className="text-xs text-[var(--primary-color)] flex items-center justify-between">
        <span>Last updated: {formatLastUpdate()}</span>
        {userAddress && (
          <button
            onClick={() => copyAddress(userAddress)}
            className="flex items-center hover:text-[var(--primary-color)] transition-colors"
            aria-label="Copy wallet address"
          >
            <span>{userAddress.substring(0, 6)}...{userAddress.substring(38)}</span>
            <Copy size={12} className="ml-1" />
          </button>
        )}
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
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
              <ArrowRight className="mr-2 text-[var(--primary-color)]" size={16} />
              Token to Send
            </label>
            <select
              value={sendToken}
              onChange={(e) => setSendToken(e.target.value)}
              className="w-full p-3 bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary-color)] focus:border-[var(--primary-color)] transition-all"
              aria-label="Select token to send"
            >
              <option value="STK">STK</option>
              <option value="USDC">USDC</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
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
              aria-label="Amount to send"
            />
            <div className="text-xs text-[var(--primary-color)] mt-1">
              Available: {walletBalance[sendToken as keyof typeof walletBalance]} {sendToken}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 text-[var(--foreground)] flex items-center">
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
              aria-label="Recipient address"
            />
          </div>
          <button
            type="submit"
            disabled={isSending || loading}
            className={`w-full flex items-center justify-center space-x-2 font-bold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
              isSending || loading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-[var(--primary-color)] hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
            }`}
            aria-label="Send tokens"
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
      <FiatGatewayScreen />
    </div>
  </div>
);

interface OverviewViewProps {
  balances: TokenBalance[];
  lockedNFT: NFT | null;
  loanInfo: LoanInfo | null;
  handleRefresh: () => Promise<void>;
  loading: boolean;
  copyAddress: (address: string) => void;
  transactions: Transaction[];
  showAllTransactions: boolean;
  setShowAllTransactions: (show: boolean) => void;
  getTransactionIcon: (type: string) => JSX.Element;
  getTransactionStatusIcon: (status: string) => JSX.Element;
}

const OverviewView: React.FC<OverviewViewProps> = ({
  balances,
  lockedNFT,
  loanInfo,
  handleRefresh,
  loading,
  copyAddress,
  transactions,
  showAllTransactions,
  setShowAllTransactions,
  getTransactionIcon,
  getTransactionStatusIcon,
}) => {
  const totalTokenValue = balances.reduce((acc, token) => {
    const value = parseFloat(token.formattedBalance) * (token.symbol === 'STK' ? 1.30 : 1);
    return acc + value;
  }, 0);
  const netWorth = totalTokenValue + (lockedNFT ? lockedNFT.estimatedValue : 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
            <Sparkles className="mr-2 text-[var(--primary-color)]" />
            Net Worth
          </h3>
          <p className="text-4xl font-bold text-[var(--foreground)]">
            ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-[var(--primary-color)]">Total value of your tokens and NFTs.</p>
        </div>
        {loanInfo && (
          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <Banknote className="mr-2 text-[var(--primary-color)]" />
              Loan Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]">Loan Amount:</span>
                <span className="font-mono text-[var(--foreground)]">{loanInfo.amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]">Interest:</span>
                <span className="font-mono text-[var(--foreground)]">{loanInfo.interest} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--foreground)]">Due Date:</span>
                <span className="font-mono text-[var(--foreground)]">{loanInfo.dueDate}</span>
              </div>
            </div>
          </div>
        )}
        {lockedNFT && (
          <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
            <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
              <Lock className="mr-2 text-purple-400" />
              Locked Collateral
            </h3>
            <div className="flex items-center gap-4">
              <img
                src={lockedNFT.image || '/placeholder-nft.png'}
                alt={lockedNFT.name}
                className="w-20 h-20 rounded-lg object-cover border-2 border-purple-400"
                onError={(e) => (e.currentTarget.src = '/placeholder-nft.png')}
              />
              <div>
                <p className="font-bold text-lg text-[var(--foreground)]">{lockedNFT.name}</p>
                <p className="text-sm text-[var(--foreground)]">{lockedNFT.collection}</p>
                <p className="text-sm text-[var(--primary-color)]">
                  Value: ${lockedNFT.estimatedValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
            <Gem className="mr-2 text-[var(--primary-color)]" />
            Your Assets
          </h3>
          <button
            onClick={handleRefresh}
            className={`flex items-center space-x-1 bg-[var(--primary-color)] hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
            aria-label="Refresh assets"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-gray-700/50 rounded-lg mr-3 h-10 w-10"></div>
                      <div className="h-5 bg-gray-700/50 rounded w-16"></div>
                    </div>
                    <div className="h-3 bg-gray-700/50 rounded w-24"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-6 bg-gray-700/50 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
            {balances.map((token) => (
              <div
                key={token.symbol}
                className="bg-[var(--input-background)] rounded-xl p-6 border border-[var(--border-color)] hover:border-emerald-500 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                        {token.symbol === 'STK' ? (
                          <Gem className="text-[var(--primary-color)]" />
                        ) : (
                          <Banknote className="text-[var(--primary-color)]" />
                        )}
                      </div>
                      <h4 className="font-semibold text-lg text-[var(--foreground)]">{token.symbol}</h4>
                    </div>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-[var(--primary-color)] mr-2">
                        {token.address.substring(0, 6)}...{token.address.substring(38)}
                      </p>
                      <button
                        onClick={() => copyAddress(token.address)}
                        className="text-[var(--primary-color)] hover:text-emerald-400"
                        aria-label={`Copy ${token.symbol} address`}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[var(--foreground)]">{token.formattedBalance}</p>
                    <p className="text-sm text-[var(--primary-color)]">
                      ≈ ${(parseFloat(token.formattedBalance) * (token.symbol === 'STK' ? 1.30 : 1)).toFixed(2)}
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
              aria-label="Swap tokens"
            >
              <div className="flex items-center">
                <div className="p-2 bg-blue-500/10 rounded-lg mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <ArrowLeftRight className="text-blue-400" />
                </div>
                <span>Swap Tokens</span>
              </div>
              <ChevronRight className="text-[var(--foreground)] group-hover:text-[var(--primary-color)]" />
            </Link>
            <Link
              href="/treasury"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
              aria-label="View treasury"
            >
              <div className="flex items-center">
                <div className="p-2 bg-purple-500/10 rounded-lg mr-3 group-hover:bg-purple-500/20 transition-colors">
                  <Banknote className="text-purple-400" />
                </div>
                <span>View Treasury</span>
              </div>
              <ChevronRight className="text-[var(--foreground)] group-hover:text-[var(--primary-color)]" />
            </Link>
            <Link
              href="/loan"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
              aria-label="Manage loans"
            >
              <div className="flex items-center">
                <div className="p-2 bg-emerald-500/10 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="text-emerald-400" />
                </div>
                <span>Manage Loans</span>
              </div>
              <ChevronRight className="text-[var(--foreground)] group-hover:text-[var(--primary-color)]" />
            </Link>
            <Link
              href="/collateral"
              className="w-full flex items-center justify-between bg-[var(--input-background)] hover:bg-[var(--input-background-hover)] text-[var(--foreground)] p-4 rounded-lg transition-all duration-200 group"
              aria-label="Manage collateral"
            >
              <div className="flex items-center">
                <div className="p-2 bg-amber-500/10 rounded-lg mr-3 group-hover:bg-amber-500/20 transition-colors">
                  <Shield className="text-amber-400" />
                </div>
                <span>Manage Collateral</span>
              </div>
              <ChevronRight className="text-[var(--foreground)] group-hover:text-[var(--primary-color)]" />
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
              aria-label={showAllTransactions ? 'Show less transactions' : 'Show all transactions'}
            >
              {showAllTransactions ? 'Show Less' : 'View All'}
            </button>
          </div>
          {transactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((tx) => (
                <div
                  key={tx.hash}
                  className="p-3 bg-[var(--input-background)] rounded-lg hover:bg-[var(--input-background-hover)] transition-colors"
                >
                  <div className="flex items-start">
                    <div className="mt-1 mr-3">{getTransactionIcon(tx.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <span className="capitalize font-medium text-[var(--foreground)]">{tx.type}</span>
                          <span className="ml-2">{getTransactionStatusIcon(tx.status)}</span>
                        </div>
                        {tx.amount && tx.token && (
                          <span className="text-sm font-medium text-[var(--foreground)]">
                            {tx.amount} {tx.token}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-xs text-[var(--foreground)]">
                        <a
                          href={`https://explorer.soniclabs.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center hover:text-[var(--primary-color)]"
                          aria-label={`View transaction ${tx.hash} on explorer`}
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
              <Home className="w-10 h-10 text-[var(--foreground)] mx-auto mb-3" />
              <p className="text-[var(--foreground)]">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DashboardScreen: React.FC = () => {
  const { isConnected, userAddress } = useWallet();
  const { transactions, trackTransaction } = useTransactionTracker();
  const [activeTab, setActiveTab] = useState<'wallet' | 'overview' | 'activity'>('wallet');
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [walletBalance, setWalletBalance] = useState({ STK: '0', USDC: '0' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendToken, setSendToken] = useState('STK');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const { loanInfo } = usePersistentLoan();
  const [lockedNFT, setLockedNFT] = useState<NFT | null>(null);

  const tokens = [
    { symbol: 'STK', address: TOKEN_ADDRESSES['STK'], decimals: TOKEN_DECIMALS['STK'] },
    { symbol: 'USDC', address: TOKEN_ADDRESSES['USDC'], decimals: TOKEN_DECIMALS['USDC'] },
  ];

  useEffect(() => {
    const storedNFT = localStorage.getItem('lockedNFT');
    if (storedNFT) {
      setLockedNFT(JSON.parse(storedNFT));
    }
  }, []);

  const fetchWalletBalances = useCallback(async () => {
    if (!isConnected || !userAddress) return;
    try {
      const sBalance = await getBalance('STK');
      const usdcBalance = await getBalance('USDC');
      setWalletBalance({ STK: sBalance, USDC: usdcBalance });
      setLastUpdateTime(Date.now());
    } catch (error: any) {
      console.error('Error fetching wallet balances:', error);
      setError('Failed to fetch wallet balances');
      toast.error('Failed to fetch wallet balances', { style: { background: '#1a1a1a', color: '#ffffff' } });
    }
  }, [isConnected, userAddress]);

  const handleSendTokens = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isConnected || !userAddress) {
        toast.error('Wallet not connected', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      if (!ethers.isAddress(recipient)) {
        toast.error('Invalid recipient address', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      if (parseFloat(sendAmount) <= 0 || isNaN(parseFloat(sendAmount))) {
        toast.error('Invalid amount', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      if (parseFloat(sendAmount) > parseFloat(walletBalance[sendToken as keyof typeof walletBalance])) {
        toast.error(`Insufficient ${sendToken} balance`, { style: { background: '#1a1a1a', color: '#ffffff' } });
        return;
      }
      setIsSending(true);
      const toastId = toast.loading(`Sending ${sendAmount} ${sendToken}...`, {
        style: { background: '#1a1a1a', color: '#ffffff' },
      });
      try {
        const { success, transactionHash } = await sendTokens(sendToken, recipient, sendAmount);
        if (success && transactionHash) {
          trackTransaction(transactionHash, 'send', sendAmount, sendToken);
          toast.success(`Sent ${sendAmount} ${sendToken}!`, { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
          setSendAmount('');
          setRecipient('');
          await fetchWalletBalances();
        } else {
          toast.error('Failed to send tokens', { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
        }
      } catch (error: any) {
        toast.error(`Error: ${error.message}`, { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
      } finally {
        setIsSending(false);
      }
    },
    [isConnected, userAddress, walletBalance, sendToken, sendAmount, recipient, trackTransaction, fetchWalletBalances]
  );

  

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
            formattedBalance: parseFloat(balance).toFixed(token.decimals === 6 ? 2 : 4),
          };
        } catch (err) {
          console.error(`Error loading ${token.symbol} balance:`, err);
          return {
            symbol: token.symbol,
            balance: '0',
            address: token.address,
            decimals: token.decimals,
            formattedBalance: '0.00',
          };
        }
      });
      const tokenBalances = await Promise.all(balancePromises);
      setBalances(tokenBalances);
    } catch (err) {
      setError('Failed to load balances');
      toast.error('Failed to load balances', { style: { background: '#1a1a1a', color: '#ffffff' } });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, userAddress]);

  const handleRefresh = useCallback(async () => {
    if (loading) return;
    const toastId = toast.loading('Refreshing balances...', { style: { background: '#1a1a1a', color: '#ffffff' } });
    try {
      await loadRealBalances();
      await fetchWalletBalances();
      toast.success('Balances refreshed!', { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
    } catch (error) {
      toast.error('Failed to refresh balances', { id: toastId, style: { background: '#1a1a1a', color: '#ffffff' } });
    }
  }, [loading, loadRealBalances, fetchWalletBalances]);

  const copyAddress = useCallback((address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard', { style: { background: '#1a1a1a', color: '#ffffff' } });
  }, []);

  const getTransactionIcon = useCallback((type: string) => {
    switch (type) {
      case 'send':
        return <Send size={16} className="text-emerald-400" />;
      case 'deposit':
        return <Plus size={16} className="text-emerald-400" />;
      case 'withdraw':
        return <Minus size={16} className="text-amber-400" />;
      case 'swap':
        return <ArrowLeftRight size={16} className="text-blue-400" />;
      case 'loan':
        return <Banknote size={16} className="text-purple-400" />;
      default:
        return <RefreshCw size={16} className="text-gray-400" />;
    }
  }, []);

  const getTransactionStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'failed':
        return <AlertCircle size={14} className="text-red-400" />;
      default:
        return <Loader2 size={14} className="animate-spin text-yellow-400" />;
    }
  }, []);

  const formatLastUpdate = useCallback(() => {
    const now = Date.now();
    const diff = now - lastUpdateTime;
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }, [lastUpdateTime]);

  useEffect(() => {
    if (isConnected) {
      loadRealBalances();
      fetchWalletBalances();
    }
  }, [isConnected, loadRealBalances, fetchWalletBalances]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--border-color)] mb-6">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('wallet')}
            className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'wallet'
                ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                : 'border-transparent text-[var(--background)] hover:text-[var(--primary-color)] hover:border-gray-500'
            }`}
            aria-label="View wallet tab"
          >
            <Wallet className="inline-block mr-2 h-4 w-4" />
            Wallet
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'overview'
                ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                : 'border-transparent text-[var(--background)] hover:text-[var(--primary-color)] hover:border-gray-500'
            }`}
            aria-label="View overview tab"
          >
            <Home className="inline-block mr-2 h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
              activeTab === 'activity'
                ? 'border-[var(--primary-color)] text-[var(--primary-color)]'
                : 'border-transparent text-[var(--background)] hover:text-[var(--primary-color)] hover:border-gray-500'
            }`}
            aria-label="View activity tab"
          >
            <History className="inline-block mr-2 h-4 w-4" />
            Activity
          </button>
        </nav>
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
            <p className="text-[var(--foreground)] mb-6">Connect your wallet to access all features</p>
            <ConnectWalletButton size="large" variant="primary" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'wallet' && (
            <WalletView
              fetchWalletBalances={fetchWalletBalances}
              loading={loading}
              walletBalance={walletBalance}
              formatLastUpdate={formatLastUpdate}
              userAddress={userAddress}
              copyAddress={copyAddress}
              handleSendTokens={handleSendTokens}
              sendToken={sendToken}
              setSendToken={setSendToken}
              sendAmount={sendAmount}
              setSendAmount={setSendAmount}
              recipient={recipient}
              setRecipient={setRecipient}
              isSending={isSending}
            />
          )}
          {activeTab === 'overview' && (
            <OverviewView
              balances={balances}
              lockedNFT={lockedNFT}
              loanInfo={loanInfo}
              handleRefresh={handleRefresh}
              loading={loading}
              copyAddress={copyAddress}
              transactions={transactions}
              showAllTransactions={showAllTransactions}
              setShowAllTransactions={setShowAllTransactions}
              getTransactionIcon={getTransactionIcon}
              getTransactionStatusIcon={getTransactionStatusIcon}
            />
          )}
          {activeTab === 'activity' && (
            <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg text-[var(--foreground)] border border-[var(--border-color)]">
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-5 flex items-center">
                <History className="mr-2 text-[var(--primary-color)]" />
                Transaction History
              </h3>
              {transactions.length > 0 ? (
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.hash}
                      className="p-4 bg-[var(--input-background)] rounded-lg hover:bg-[var(--input-background-hover)] transition-colors"
                    >
                      <div className="flex items-start">
                        <div className="mt-1 mr-3">{getTransactionIcon(tx.type)}</div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start text-[var(--primary-color)]">
                            <div>
                              <span className="capitalize font-medium text-[var(--foreground)]">{tx.type}</span>
                              <div className="flex items-center mt-1">
                                {getTransactionStatusIcon(tx.status)}
                                <span className="text-xs text-[var(--foreground)] ml-1 capitalize">{tx.status}</span>
                              </div>
                            </div>
                            {tx.amount && tx.token && (
                              <span className="text-sm font-medium text-[var(--foreground)]">
                                {tx.type === 'send' ? '-' : '+'}
                                {tx.amount} {tx.token}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center text-xs text-[var(--foreground)]">
                            <a
                              href={`https://blaze.soniclabs.com/tx/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center hover:text-[var(--primary-color)]"
                              aria-label={`View transaction ${tx.hash} on explorer`}
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
                  <Home className="w-10 h-10 text-[var(--foreground)] mx-auto mb-3" />
                  <p className="text-[var(--foreground)]">No transactions yet</p>
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