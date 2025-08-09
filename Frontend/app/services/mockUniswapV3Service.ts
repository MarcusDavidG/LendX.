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
    return tokenIn === 'S' && tokenOut === 'USDC' ? '0.5' : '2'; // 1 S = 0.5 USDC, 1 USDC = 2 S
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