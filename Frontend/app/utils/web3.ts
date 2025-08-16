declare global {
  interface Window {
    ethereum?: any;
  }
}

import { ethers } from 'ethers';

// Sonic network configuration
const SONIC_RPC_URL = 'https://rpc.blaze.soniclabs.com/';
const SONIC_CHAIN_ID = 57054;

// Token addresses
export const TOKEN_ADDRESSES: Record<string, string> = {
  'STK': '0x90b88C638A233EF78d8f54e60e0e27352C03F59e',
  'USDC': '0x97a15306364e1025e07010a7f79B9664638598AE'
};

// Token decimals
export const TOKEN_DECIMALS: Record<string, number> = {
  'STK': 18,
  'USDC': 6
};

// Treasury token
const TREASURY_TOKEN_ADDRESS = TOKEN_ADDRESSES['USDC'];

// ABI definitions
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

// Event emitter for balance refresh
class BalanceRefreshEmitter {
  private listeners: (() => void)[] = [];
  onRefresh(callback: () => void) {
    this.listeners.push(callback);
  }
  offRefresh(callback: () => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }
  emitRefresh() {
    this.listeners.forEach(callback => callback());
  }
}

export const balanceRefreshEmitter = new BalanceRefreshEmitter();

// Interfaces
export interface SwapDetails {
  amountIn: string;
  amountOut: string;
  exchangeRate: string;
  priceImpact: string;
  transactionHash: string;
  gasUsed: string;
  gasPrice: string;
}

export interface LoanSwapDetails {
  swapRoute: string;
  priceImpact: string;
  exchangeRate: string;
  minimumOutput: string;
  transactionHash: string;
}

export interface TransactionReceipt {
  hash: string;
  status: 'success' | 'failed';
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
}

export interface CollateralInfo {
  isLocked: boolean;
  value: string;
  asset: string;
  tokenId: string;
}

export interface LoanInfo {
  amount: string;
  interest: string;
  dueDate: string;
  collateral: string;
}

export interface SwapInfo {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: string;
  transactionHash: string;
}

// MetaMask SDK instance
let mmSdk: any = null;
let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;

// Initialize MetaMask SDK
const initializeMetaMaskSDK = async () => {
  if (typeof window === 'undefined') {
    throw new Error('MetaMask SDK can only be initialized in the browser');
  }
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }
  if (!mmSdk) {
    try {
      const { default: MetaMaskSDK } = await import('@metamask/sdk');
      mmSdk = new MetaMaskSDK({
        dappMetadata: {
          name: 'SonicFi Micro-Lending dApp',
          url: window.location.href
        }
      });
      await mmSdk.init();
    } catch (error) {
      console.error('Failed to initialize MetaMask SDK:', error);
      throw new Error('Failed to initialize MetaMask SDK');
    }
  }
  return mmSdk;
};

// Switch to Sonic network
const switchToSonicNetwork = async (ethereum: any): Promise<void> => {
  try {
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    if (parseInt(currentChainId, 16) !== SONIC_CHAIN_ID) {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${SONIC_CHAIN_ID.toString(16)}` }]
      });
    }
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${SONIC_CHAIN_ID.toString(16)}`,
          chainName: 'Sonic',
          rpcUrls: [SONIC_RPC_URL],
          nativeCurrency: { name: 'Sonic', symbol: '', decimals: 18 },
          blockExplorerUrls: ['https://explorer.soniclabs.com/']
        }]
      });
    } else {
      throw new Error(`Failed to switch to Sonic network: ${switchError.message}`);
    }
  }
};

// Initialize provider
const initializeProvider = async (): Promise<ethers.BrowserProvider> => {
  if (!provider) {
    await initializeMetaMaskSDK();
    const ethereum = mmSdk?.getProvider();
    if (!ethereum) {
      throw new Error('MetaMask provider not found. Please ensure MetaMask is installed.');
    }
    await switchToSonicNetwork(ethereum);
    provider = new ethers.BrowserProvider(ethereum, SONIC_CHAIN_ID);
  }
  return provider;
};

// Mock Uniswap V3 Service
export class MockUniswapV3Service {
  private static instance: MockUniswapV3Service;
  private constructor() {}

  static getInstance(): MockUniswapV3Service {
    if (!MockUniswapV3Service.instance) {
      MockUniswapV3Service.instance = new MockUniswapV3Service();
    }
    return MockUniswapV3Service.instance;
  }

  async getExchangeRate(tokenIn: string, tokenOut: string): Promise<string> {
    return tokenIn === '' && tokenOut === 'USDC' ? '0.5' : '2'; // 1 S = 0.5 USDC, 1 USDC = 2 S
  }

  async calculateExactSwapAmounts(tokenIn: string, tokenOut: string, amountIn: string, slippageTolerance: number) {
    const exchangeRate = parseFloat(await this.getExchangeRate(tokenIn, tokenOut));
    const amountOut = (parseFloat(amountIn) * exchangeRate).toFixed(2);
    return {
      swapRoute: `${tokenIn}->${tokenOut}`,
      priceImpact: (Math.random() * 0.5).toFixed(2), // Random 0-0.5%
      exchangeRate: exchangeRate.toString(),
      minimumOutput: (parseFloat(amountOut) * (1 - slippageTolerance / 100)).toFixed(2),
      amountIn,
      amountOut
    };
  }
}

export const UniswapV3Service = MockUniswapV3Service;

// Mock implementations
export const mockRequestLoan = async (loanAmount: string, duration: string): Promise<{ success: boolean; transactionHash: string }> => {
  try {
    console.log(`Mock loan request for ${loanAmount} USDC for ${duration} days`);
    
    // Get current user address to store loan data
    const userAddress = await getUserAddress();
    if (!userAddress) {
      throw new Error('User address not found');
    }
    
    // Calculate interest (5% fixed rate)
    const interest = (parseFloat(loanAmount) * 0.05).toFixed(2);
    
    // Calculate due date based on duration
    const dueDate = new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toLocaleDateString();
    
    // Store loan data in localStorage
    const loanData = {
      amount: loanAmount,
      interest: interest,
      dueDate: dueDate,
      collateral: 'Mock NFT Collection #1234'
    };
    
    localStorage.setItem(`loan_${userAddress}`, JSON.stringify(loanData));
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s delay
    return {
      success: true,
      transactionHash: ethers.hexlify(ethers.randomBytes(32))
    };
  } catch (error: any) {
    console.error(`Error simulating loan request: ${error.message}`);
    return { success: false, transactionHash: '' };
  }
};

export const mockGetCollateralInfo = async (userAddress: string): Promise<CollateralInfo> => {
  console.log(`Mock get collateral info for ${userAddress}`);
  return {
    isLocked: true,
    value: '1500', // Mock collateral value in USDC
    asset: 'Mock NFT Collection',
    tokenId: '#1234'
  };
};

export const mockRepayLoan = async (amount: string, tokenIn: string): Promise<boolean> => {
  try {
    console.log(`Mock repay loan of ${amount} ${tokenIn}`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s delay
    return true;
  } catch (error: any) {
    console.error(`Error simulating loan repayment: ${error.message}`);
    return false;
  }
};

export const mockLockCollateral = async (nftAddress: string, tokenId: string): Promise<boolean> => {
  try {
    console.log(`Mock lock collateral for NFT ${tokenId} at ${nftAddress}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s delay
    return true;
  } catch (error: any) {
    console.error(`Error simulating lock collateral: ${error.message}`);
    return false;
  }
};

export const mockReleaseCollateral = async (userAddress: string): Promise<boolean> => {
  try {
    console.log(`Mock release collateral for ${userAddress}`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s delay
    return true;
  } catch (error: any) {
    console.error(`Error simulating release collateral: ${error.message}`);
    return false;
  }
};

export const mockDepositFunds = async (amount: string): Promise<boolean> => {
  try {
    console.log(`Mock deposit ${amount} USDC to treasury`);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s delay
    return true;
  } catch (error: any) {
    console.error(`Error simulating deposit funds: ${error.message}`);
    return false;
  }
};

export const mockGetTreasuryBalance = async (): Promise<string> => {
  try {
    console.log('Mock fetching treasury balance');
    return '10000'; // Mock 10,000 USDC
  } catch (error: any) {
    console.error('Error simulating treasury balance: ', error.message);
    return '0';
  }
};

export const mockGetFeeMRewards = async (userAddress: string): Promise<string> => {
  try {
    console.log(`Mock fetching FeeM rewards for ${userAddress}`);
    return '100'; // Mock 100 USDC rewards
  } catch (error: any) {
    console.error(`Error simulating FeeM rewards: ${error.message}`);
    return '0';
  }
};

// Real implementations
export const connectWallet = async (): Promise<string | null> => {
  try {
    await initializeMetaMaskSDK();
    const ethereum = mmSdk?.getProvider();
    if (!ethereum) {
      throw new Error('MetaMask provider not found. Please ensure MetaMask is installed.');
    }
    await switchToSonicNetwork(ethereum);
    provider = new ethers.BrowserProvider(ethereum, SONIC_CHAIN_ID);
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
    const currentChainId = await ethereum.request({ method: 'eth_chainId' });
    if (parseInt(currentChainId, 16) !== SONIC_CHAIN_ID) {
      throw new Error('Connected to wrong network. Please switch to Sonic.');
    }
    if (accounts?.length > 0) {
      signer = await provider.getSigner();
      return accounts[0];
    }
    return null;
  } catch (error: any) {
    console.error('Error connecting wallet:', error.message);
    throw error;
  }
};

export const getBalance = async (token: string): Promise<string> => {
  try {
    if (!provider) {
      provider = await initializeProvider();
    }
    const tokenAddress = TOKEN_ADDRESSES[token];
    if (!tokenAddress) {
      throw new Error(`Token ${token} not supported`);
    }
    if (!signer) {
      signer = await provider.getSigner();
    }
    const userAddress = await signer.getAddress();
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = TOKEN_DECIMALS[token] || (await tokenContract.decimals());
    const balance = await Promise.race([
      tokenContract.balanceOf(userAddress),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout fetching balance')), 10000))
    ]);
    return ethers.formatUnits(balance, decimals);
  } catch (error: any) {
    console.error(`Error fetching ${token} balance:`, error.message);
    return '0';
  }
};

export const getGasFee = async (): Promise<string> => {
  try {
    if (!provider) {
      provider = await initializeProvider();
    }
    const feeData = await provider.getFeeData();
    if (feeData.gasPrice) {
      const gasPriceInGwei = ethers.formatUnits(feeData.gasPrice, 'gwei');
      return `~${parseFloat(gasPriceInGwei).toFixed(3)} GWEI`;
    }
    return '~$0.001';
  } catch (error: any) {
    console.error('Error fetching gas fee:', error.message);
    return '~$0.001';
  }
};

export const getConfirmationTime = async (): Promise<string> => {
  try {
    if (!provider) {
      provider = await initializeProvider();
    }
    const block = await provider.getBlock('latest');
    if (block && block.timestamp) {
      const previousBlock = await provider.getBlock(block.number - 1);
      if (previousBlock && previousBlock.timestamp) {
        const timeDifference = block.timestamp - previousBlock.timestamp;
        return `~${timeDifference}s`;
      }
    }
    return '~2s';
  } catch (error: any) {
    console.error('Error fetching confirmation time:', error.message);
    return '~2s';
  }
};

export const sendTokens = async (
  token: string,
  to: string,
  amount: string
): Promise<{ success: boolean; transactionHash: string }> => {
  try {
    if (!provider) {
      provider = await initializeProvider();
    }
    const tokenAddress = TOKEN_ADDRESSES[token];
    if (!tokenAddress) {
      throw new Error(`Token ${token} not supported`);
    }
    if (!signer) {
      signer = await provider.getSigner();
    }
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = TOKEN_DECIMALS[token] || (await tokenContract.decimals());
    const amountInWei = ethers.parseUnits(amount, decimals);
    const tx = await tokenContract.transfer(to, amountInWei);
    const receipt = await tx.wait();
    balanceRefreshEmitter.emitRefresh();
    return { success: true, transactionHash: receipt.hash };
  } catch (error: any) {
    console.error(`Error sending ${token} tokens to ${to}:`, error.message);
    return { success: false, transactionHash: '' };
  }
};

export const swapTokens = async (
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  slippageTolerance: number = 0.5
): Promise<SwapDetails | null> => {
  try {
    const uniswapService = UniswapV3Service.getInstance();
    const swapDetails = await uniswapService.calculateExactSwapAmounts(tokenIn, tokenOut, amountIn, slippageTolerance);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1s delay
    return {
      amountIn,
      amountOut: swapDetails.amountOut,
      exchangeRate: swapDetails.exchangeRate,
      priceImpact: swapDetails.priceImpact,
      transactionHash: ethers.hexlify(ethers.randomBytes(32)),
      gasUsed: '21000', // Mock gas used
      gasPrice: '1' // Mock gas price in GWEI
    };
  } catch (error: any) {
    console.error(`Error simulating swap ${tokenIn} to ${tokenOut}:`, error.message);
    return null;
  }
};

export const requestLoan = mockRequestLoan;
export const repayLoan = mockRepayLoan;
export const lockCollateral = mockLockCollateral;
export const getCollateralInfo = mockGetCollateralInfo;
export const releaseCollateral = mockReleaseCollateral;
export const depositFunds = mockDepositFunds;
export const getTreasuryBalance = mockGetTreasuryBalance;
export const getFeeMRewards = mockGetFeeMRewards;

export const trackTransaction = async (txHash: string): Promise<string> => {
  try {
    if (!provider) {
      provider = await initializeProvider();
    }
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt === null) {
      return 'pending';
    }
    if (receipt.status === 1) {
      balanceRefreshEmitter.emitRefresh();
      return 'success';
    } else {
      return 'failed';
    }
  } catch (error: any) {
    console.error(`Error tracking transaction ${txHash}:`, error.message);
    return 'unknown';
  }
};

export const getUserLoan = async (userAddress: string): Promise<LoanInfo | null> => {
  try {
    console.log(`Mock fetching loan for ${userAddress}`);
    // Simulate having an active loan for demo purposes
    // In production, this would fetch from the actual lending contract
    const hasActiveLoan = localStorage.getItem(`loan_${userAddress}`);
    if (hasActiveLoan) {
      const loanData = JSON.parse(hasActiveLoan);
      return {
        amount: loanData.amount || '1000',
        interest: loanData.interest || '50',
        dueDate: loanData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        collateral: loanData.collateral || 'Mock NFT Collection #1234'
      };
    }
    return null;
  } catch (error: any) {
    console.error(`Error simulating loan info for ${userAddress}:`, error.message);
    return null;
  }
};

export const getUserLoanHistory = async (userAddress: string): Promise<LoanInfo[]> => {
  try {
    console.log(`Mock fetching loan history for ${userAddress}`);
    return [];
  } catch (error: any) {
    console.error(`Error simulating loan history for ${userAddress}:`, error.message);
    return [];
  }
};

export const getUserSwapHistory = async (userAddress: string): Promise<SwapInfo[]> => {
  try {
    console.log(`Mock fetching swap history for ${userAddress}`);
    return [];
  } catch (error: any) {
    console.error(`Error simulating swap history for ${userAddress}:`, error.message);
    return [];
  }
};

export const getUserAddress = async (): Promise<string | null> => {
  try {
    if (!provider) {
      provider = await initializeProvider();
    }
    if (!signer) {
      signer = await provider.getSigner();
    }
    const userAddress = await signer.getAddress();
    return userAddress;
  } catch (error: any) {
    console.error('Error fetching user address:', error.message);
    return null;
  }
};

export const refreshAllBalances = async (): Promise<void> => {
  balanceRefreshEmitter.emitRefresh();
};

export const onBalanceRefresh = (callback: () => void) => {
  balanceRefreshEmitter.onRefresh(callback);
};

export const offBalanceRefresh = (callback: () => void) => {
  balanceRefreshEmitter.offRefresh(callback);
};
