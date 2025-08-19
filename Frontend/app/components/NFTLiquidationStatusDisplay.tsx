import React from 'react';
import { useNFTLiquidationStatus } from '../hooks/useNFTLiquidationStatus';
import { NFT } from '../hooks/useNFTData';
import { LoanInfo } from '../hooks/usePersistentLoan'; // Assuming Loan type is defined here

interface NFTLiquidationStatusDisplayProps {
  nft: NFT;
  loan: LoanInfo;
}

const NFTLiquidationStatusDisplay: React.FC<NFTLiquidationStatusDisplayProps> = ({ nft, loan }) => {
  const { isAtRisk, isLiquidated, currentPrice, liquidationPrice, message } = useNFTLiquidationStatus(nft, loan);

  if (!nft || !loan) {
    return <div className="text-gray-500 text-sm">No NFT or loan data available.</div>;
  }

  return (
    <div className=" rounded-md text-sm">
      {isLiquidated ? (
        <div className="text-red-500 font-bold">
          {message}
        </div>
      ) : isAtRisk ? (
        <div className="text-yellow-500 font-semibold">
          {message}
          <p>Current Price: {currentPrice.toFixed(2)} ETH</p>
          <p>Liquidation Price: {liquidationPrice.toFixed(2)} ETH</p>
        </div>
      ) : (
        <div className="text-green-500">
          {message}
        </div>
      )}
    </div>
  );
};

export default NFTLiquidationStatusDisplay;
