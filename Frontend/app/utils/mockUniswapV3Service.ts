import { ethers } from 'ethers';

const MOCK_EXCHANGE_RATES: Record<string, Record<string, number>> = {
  S: { USDC: 0.5 },
  USDC: { S: 2 },
};

const TOKEN_DECIMALS: Record<string, number> = {
  S: 18,
  USDC: 6,
};

export class MockUniswapV3Service {
  private static instance: MockUniswapV3Service;

  static getInstance(): MockUniswapV3Service {
    if (!MockUniswapV3Service.instance) {
      MockUniswapV3Service.instance = new MockUniswapV3Service();
    }
    return MockUniswapV3Service.instance;
  }

  async getExchangeRate(tokenIn: string, tokenOut: string): Promise<string> {
    return (MOCK_EXCHANGE_RATES[tokenIn]?.[tokenOut] || 1).toString();
  }

  async calculatePriceImpact(tokenIn: string, tokenOut: string, amount: string): Promise<string> {
    const amountInNumber = parseFloat(amount);
    // Mock price impact: 0.1% for every 1000 tokens
    const priceImpact = (amountInNumber / 1000) * 0.1;
    return priceImpact.toFixed(4);
  }

  async getQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number = 0.5
  ): Promise<{
    amountOut: string;
    exchangeRate: string;
    priceImpact: string;
    minimumAmountOut: string;
    swapRoute: string;
  }> {
    const exchangeRate = await this.getExchangeRate(tokenIn, tokenOut);
    const priceImpact = await this.calculatePriceImpact(tokenIn, tokenOut, amountIn);
    
    const amountInWei = ethers.parseUnits(amountIn, TOKEN_DECIMALS[tokenIn]);
    const amountOutWei = amountInWei * BigInt(Math.floor(parseFloat(exchangeRate) * 1e6)) / BigInt(1e6);

    const amountOut = ethers.formatUnits(amountOutWei, TOKEN_DECIMALS[tokenOut]);
    const minimumAmountOut = (parseFloat(amountOut) * (1 - slippageTolerance / 100)).toString();

    return {
      amountOut,
      exchangeRate,
      priceImpact,
      minimumAmountOut,
      swapRoute: `${tokenIn} -> ${tokenOut} (Mock)`,
    };
  }
}
