import { BrowserProvider, Contract, Signer, formatUnits, parseUnits } from 'ethers';
import { CONTRACT_ADDRESSES } from '../config/addresses';
import { TOKEN_DECIMALS } from '../config/addresses';

// Uniswap V3 Router ABI (simplified for swap functionality)
const UNISWAP_V3_ROUTER_ABI = [
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  "function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)",
  "function refundETH() external payable",
  "function unwrapWETH9(uint256 amountMinimum, address recipient) external payable"
];

// ERC20 ABI for token approvals
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

// Quoter ABI for price estimation
const QUOTER_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)"
];

// Pool fee tiers
const POOL_FEES = {
  LOW: 500,      // 0.05%
  MEDIUM: 3000,  // 0.3%
  HIGH: 10000    // 1%
};

export class UniswapV3Service {
  private provider: BrowserProvider;
  private signer: Signer;
  private router: Contract;
  private quoter: Contract;

  constructor(provider: BrowserProvider, signer: Signer) {
    this.provider = provider;
    this.signer = signer;
    this.router = new Contract(
      CONTRACT_ADDRESSES.UNISWAP_V3_ROUTER,
      UNISWAP_V3_ROUTER_ABI,
      signer
    );
    
    // Updated quoter contract address for Sonic testnet - Quoter V2
    this.quoter = new Contract(
      "0x0FBeB0140063940f2dC2975D221D1692E9fE3aE5", // Sonic testnet Quoter V2
      QUOTER_ABI,
      provider
    );
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.provider);
    const balance = await tokenContract.balanceOf(userAddress);
    return formatUnits(balance, this.getTokenDecimals(tokenAddress));
  }

  async getAllowance(tokenAddress: string, owner: string, spender: string): Promise<string> {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.provider);
    const allowance = await tokenContract.allowance(owner, spender);
    return formatUnits(allowance, this.getTokenDecimals(tokenAddress));
  }

  async approveToken(tokenAddress: string, amount: string): Promise<string> {
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, this.signer);
    const decimals = this.getTokenDecimals(tokenAddress);
    const amountInWei = parseUnits(amount, decimals);
    
    const tx = await tokenContract.approve(CONTRACT_ADDRESSES.UNISWAP_V3_ROUTER, amountInWei);
    return tx.hash;
  }

  async getQuote(tokenIn: string, tokenOut: string, amountIn: string, fee: number = POOL_FEES.MEDIUM): Promise<string> {
    try {
      // Validate inputs
      if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) <= 0) {
        throw new Error('Invalid input parameters');
      }

      // Ensure token addresses are valid
      if (!tokenIn.match(/^0x[a-fA-F0-9]{40}$/) || !tokenOut.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid token address format');
      }

      // Prevent same token swap
      if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
        return amountIn;
      }

      const decimals = this.getTokenDecimals(tokenIn);
      const amountInWei = parseUnits(amountIn, decimals);
      
      // Check if amount is too small
      if (amountInWei === BigInt(0)) {
        console.warn('Amount too small after decimal conversion');
        return '0';
      }

      // Add a reasonable upper bound check to prevent overflow
      if (amountInWei > BigInt('1000000000000000000000000')) { // 1M tokens max
        throw new Error('Amount too large');
      }

      console.log('Getting quote for:', {
        tokenIn,
        tokenOut,
        amountInWei: amountInWei.toString(),
        fee
      });

      const amountOut = await this.quoter.quoteExactInputSingle.staticCall(
        tokenIn,
        tokenOut,
        fee,
        amountInWei,
        BigInt(0)
      );

      // Handle empty response
      if (!amountOut || amountOut === BigInt(0)) {
        console.warn('Quoter returned empty or zero amount - likely no liquidity pool');
        return '0';
      }
      
      const formattedOutput = formatUnits(amountOut, this.getTokenDecimals(tokenOut));
      console.log('Quote result:', formattedOutput);
      return formattedOutput;
      
    } catch (error: any) {
      console.error('Error getting quote:', error);
      
      // Handle specific error cases
      if (error.message?.includes('0x') || error.code === 'BAD_DATA' || error.message?.includes('revert')) {
        console.warn('Quoter returned empty data or reverted - no liquidity pool or invalid pair');
        return '0';
      }
      
      if (error.message?.includes('network') || error.message?.includes('connection')) {
        throw new Error('Network error - please check your connection');
      }
      
      throw new Error(`Failed to get price quote: ${error.message}`);
    }
  }

  async executeSwap(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number = 0.5,
    deadlineMinutes: number = 20
  ): Promise<string> {
    try {
      const amountInWei = parseUnits(amountIn, this.getTokenDecimals(tokenIn));
      
      // Get current quote
      const expectedOutput = await this.getQuote(tokenIn, tokenOut, amountIn);
      const amountOutMinimum = parseUnits(
        expectedOutput,
        this.getTokenDecimals(tokenOut)
      ) * BigInt(100 - Math.floor(slippageTolerance * 100)) / BigInt(100);

      const deadline = Math.floor(Date.now() / 1000) + (deadlineMinutes * 60);

      // Check if approval is needed
      const userAddress = await this.signer.getAddress();
      const allowance = await this.getAllowance(tokenIn, userAddress, CONTRACT_ADDRESSES.UNISWAP_V3_ROUTER);
      if (parseFloat(allowance) < parseFloat(amountIn)) {
        throw new Error('Token approval required');
      }

      const tx = await this.router.exactInputSingle({
        tokenIn,
        tokenOut,
        fee: POOL_FEES.MEDIUM,
        recipient: userAddress,
        deadline,
        amountIn: amountInWei,
        amountOutMinimum,
        sqrtPriceLimitX96: 0
      });

      return tx.hash;
    } catch (error) {
      console.error('Error executing swap:', error);
      throw error;
    }
  }

  async waitForTransaction(txHash: string): Promise<any> {
    const receipt = await this.provider.waitForTransaction(txHash);
    return receipt;
  }

  private getTokenDecimals(tokenAddress: string): number {
    // Map token addresses to their decimals
    const tokenMap: { [key: string]: number } = {
      [CONTRACT_ADDRESSES.TEST_S]: TOKEN_DECIMALS.S,
      [CONTRACT_ADDRESSES.TEST_USDC]: TOKEN_DECIMALS.USDC,
      [CONTRACT_ADDRESSES.TEST_ETH]: TOKEN_DECIMALS.ETH
    };
    
    return tokenMap[tokenAddress] || 18;
  }

  async estimateGasPrice(): Promise<string> {
    const gasPrice = await this.provider.getFeeData();
    return formatUnits(gasPrice.gasPrice || 'gwei');
  }
}

// Helper function to format token amounts
export const formatTokenAmount = (amount: string, decimals: number): string => {
  return formatUnits(amount, decimals);
};

// Helper function to parse token amounts
export const parseTokenAmount = (amount: string, decimals: number): string => {
  return parseUnits(amount, decimals).toString();
};

// Error handling utilities
export class SwapError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SwapError';
  }
}

export const getErrorMessage = (error: any): string => {
  if (error.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user';
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for transaction';
  }
  if (error.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
    return 'Price impact too high. Try a smaller amount or increase slippage tolerance';
  }
  return error.message || 'Transaction failed';
};
