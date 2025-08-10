import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getUserAddress } from '../utils/web3';

interface NFTData {
  tokenId: string;
  name: string;
  image: string;
  owner: string;
  verified: boolean;
}

interface UseNFTDataReturn {
  nfts: NFTData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  verifyOwnership: (tokenId: string) => Promise<boolean>;
}

export const useNFTData = (address: string | null): UseNFTDataReturn => {
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTs = useCallback(async () => {
    if (!address) {
      setNfts([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock NFT data for demonstration
      const mockNFTs: NFTData[] = [
        {
          tokenId: '1',
          name: 'Ethereum Genesis NFT',
          image: '/api/placeholder/300/300',
          owner: address,
          verified: false
        },
        {
          tokenId: '2',
          name: 'Sonic Pioneer NFT',
          image: '/api/placeholder/300/300',
          owner: address,
          verified: false
        },
        {
          tokenId: '3',
          name: 'DeFi Elite NFT',
          image: '/api/placeholder/300/300',
          owner: address,
          verified: false
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setNfts(mockNFTs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NFTs');
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const verifyOwnership = useCallback(async (tokenId: string): Promise<boolean> => {
    if (!address) return false;

    try {
      const userAddress = await getUserAddress();
      if (!userAddress) return false;

      // In a real implementation, this would check the NFT contract
      // For now, we'll simulate verification
      const nft = nfts.find(n => n.tokenId === tokenId);
      return nft?.owner.toLowerCase() === userAddress.toLowerCase() || false;
    } catch (err) {
      console.error('Error verifying NFT ownership:', err);
      return false;
    }
  }, [address, nfts]);

  useEffect(() => {
    fetchNFTs();
  }, [fetchNFTs]);

  return {
    nfts,
    loading,
    error,
    refetch: fetchNFTs,
    verifyOwnership
  };
};
