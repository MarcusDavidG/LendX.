import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingDown } from 'lucide-react';
import { NFT } from './useNFTData';
import { LoanInfo } from './usePersistentLoan';

interface NFTLiquidationStatus {
  isAtRisk: boolean;
  isLiquidated: boolean;
  currentPrice: number;
  liquidationPrice: number;
  message: string;
  loanToValueRatio: number;
  healthFactor: number;
  icon: React.ComponentType<{ className?: string }>;
  statusType: 'liquidated' | 'at-risk' | 'healthy';
}

export const useNFTLiquidationStatus = (nft: NFT, loan: LoanInfo | null): NFTLiquidationStatus => {
  const [status, setStatus] = useState<NFTLiquidationStatus>({
    isAtRisk: false,
    isLiquidated: false,
    currentPrice: 0,
    liquidationPrice: 0,
    message: 'Loading status...',
    loanToValueRatio: 0,
    healthFactor: 0,
    icon: TrendingDown,
    statusType: 'healthy',
  });

  useEffect(() => {
    if (!nft || !loan) {
      setStatus({
        isAtRisk: false,
        isLiquidated: false,
        currentPrice: 0,
        liquidationPrice: 0,
        message: 'NFT or loan data missing.',
        loanToValueRatio: 0,
        healthFactor: 0,
        icon: TrendingDown,
        statusType: 'healthy',
      });
      return;
    }

    // Use the NFT's estimatedValue as the current price
    const currentPrice = nft.estimatedValue;
    
    // Parse loan amount from string to number
    const loanAmount = parseFloat(loan.amount) || 0;
    
    // Mock liquidation parameters
    const liquidationThreshold = 0.75; // 75% LTV triggers liquidation
    const warningThreshold = 0.85; // 85% LTV shows warning
    
    // Calculate liquidation price based on loan amount
    const liquidationPrice = loanAmount / liquidationThreshold;
    
    // Calculate LTV ratio
    const loanToValueRatio = loanAmount / currentPrice;
    
    // Calculate health factor (1.0 = at liquidation threshold)
    const healthFactor = currentPrice / liquidationPrice;

    let isAtRisk = false;
    let isLiquidated = false;
    let message = '';
    let icon = CheckCircle;
    let statusType: 'liquidated' | 'at-risk' | 'healthy' = 'healthy';

    if (currentPrice <= liquidationPrice) {
      isLiquidated = true;
      message = `NFT LIQUIDATED! Current: $${currentPrice.toLocaleString()}, Liquidation: $${liquidationPrice.toLocaleString()}`;
      icon = XCircle;
      statusType = 'liquidated';
    } else if (loanToValueRatio >= warningThreshold) {
      isAtRisk = true;
      message = `NFT at risk! LTV: ${(loanToValueRatio * 100).toFixed(1)}%, Liquidation: $${liquidationPrice.toLocaleString()}`;
      icon = AlertTriangle;
      statusType = 'at-risk';
    } else {
      message = `NFT Healthy! LTV: ${(loanToValueRatio * 100).toFixed(1)}%, Health: ${healthFactor.toFixed(2)}x`;
      icon = CheckCircle;
      statusType = 'healthy';
    }

    setStatus({
      isAtRisk,
      isLiquidated,
      currentPrice,
      liquidationPrice,
      message,
      loanToValueRatio,
      healthFactor,
      icon,
      statusType,
    });

  }, [nft, loan]);

  return status;
};
