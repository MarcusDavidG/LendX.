'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { mockNFTs } from '../utils/mockNFTs';

// Define NFT interface to match NFTCollateralScreen
export interface NFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  estimatedValue: number;
  tokenId: string;
  contractAddress: string;
  rarity?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

interface UseNFTDataReturn {
  nfts: NFT[];
  loading: boolean;
  error: string | null;
  getUserNFTs: (address: string) => Promise<void>;
  getNFTEstimatedValue: (contractAddress: string, tokenId: string) => Promise<number>;
  importNFT: (contractAddress: string, tokenId: string, collectionName?: string) => Promise<NFT>;
}

// ERC-721 ABI (minimal for balanceOf, tokenURI, and ownerOf)
const ERC721_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function name() view returns (string)',
];

// ERC-1155 ABI (minimal for balanceOf and uri)
const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function uri(uint256 id) view returns (string)',
];

// Alchemy API base URL
const ALCHEMY_API_URL = `https://eth-mainnet.alchemyapi.io/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`;

// Mock price oracle (replace with actual API like OpenSea or Chainlink)
const getMockPrice = (tokenId: string) => {
  // Simulate price based on tokenId for demo
  return parseInt(tokenId) % 1000 + 50; // $50-$1049
};

// Simple rarity calculation based on attributes
const calculateRarity = (attributes: Array<{ trait_type: string; value: string }>, totalSupply: number = 10000) => {
  if (!attributes || attributes.length === 0) return 'Common';
  const rareTraits = attributes.filter((attr) => attr.trait_type.includes('Rare') || attr.value.includes('Rare')).length;
  if (rareTraits >= 2) return 'Legendary';
  if (rareTraits === 1) return 'Epic';
  if (attributes.length < 3) return 'Rare';
  return 'Uncommon';
};

export function useNFTData(provider?: ethers.BrowserProvider): UseNFTDataReturn {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserNFTs = useCallback(
    async (address: string) => {
      setLoading(true);
      setError(null);
      // Simulate a network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNfts(mockNFTs);
      setLoading(false);
    },
    []
  );

  const getNFTEstimatedValue = useCallback(
    async (contractAddress: string, tokenId: string): Promise<number> => {
      if (!ethers.isAddress(contractAddress)) {
        throw new Error('Invalid contract address');
      }

      try {
        // Replace with actual API call (e.g., OpenSea, Chainlink, or Alchemy floor price)
        const value = getMockPrice(tokenId);
        return value;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to fetch NFT value';
        toast.error(errorMessage, { style: { background: '#1a1a1a', color: '#ffffff' } });
        throw new Error(errorMessage);
      }
    },
    []
  );

  const importNFT = useCallback(
    async (contractAddress: string, tokenId: string, collectionName?: string): Promise<NFT> => {
      if (!provider || !ethers.isAddress(contractAddress)) {
        const errorMessage = 'Invalid contract address or no provider';
        setError(errorMessage);
        toast.error(errorMessage, { style: { background: '#1a1a1a', color: '#ffffff' } });
        throw new Error(errorMessage);
      }

      setLoading(true);
      setError(null);

      try {
        // Verify ownership and fetch metadata
        const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
        let tokenURI: string;
        try {
          tokenURI = await contract.tokenURI(tokenId);
        } catch (err) {
          // Try ERC-1155 if ERC-721 fails
          const erc1155Contract = new ethers.Contract(contractAddress, ERC1155_ABI, provider);
          tokenURI = await erc1155Contract.uri(tokenId);
        }

        // Fetch metadata from tokenURI
        let metadata: any = {};
        try {
          const response = await axios.get(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
          metadata = response.data;
        } catch (err) {
          console.warn(`Failed to fetch metadata for ${contractAddress}-${tokenId}:`, err);
        }

        // Fetch collection name from contract if not provided
        let finalCollectionName = collectionName || metadata.collection?.name || metadata.name || 'Imported Collection';
        try {
          finalCollectionName = (await contract.name()) || finalCollectionName;
        } catch (err) {
          console.warn(`Failed to fetch contract name for ${contractAddress}:`, err);
        }

        // Calculate rarity
        const attributes = metadata.attributes || [];
        const rarity = calculateRarity(attributes);

        const newNFT: NFT = {
          id: `${contractAddress}-${tokenId}`,
          name: metadata.name || `NFT #${tokenId}`,
          image: metadata.image || metadata.image_url || '/placeholder-nft.png',
          collection: finalCollectionName,
          estimatedValue: await getNFTEstimatedValue(contractAddress, tokenId),
          tokenId,
          contractAddress,
          rarity,
          attributes,
        };

        setNfts((prev) => [...prev, newNFT]);
        toast.success('NFT imported successfully!', { style: { background: '#1a1a1a', color: '#ffffff' } });
        return newNFT;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to import NFT';
        setError(errorMessage);
        toast.error(errorMessage, { style: { background: '#1a1a1a', color: '#ffffff' } });
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [provider, getNFTEstimatedValue]
  );

  return {
    nfts,
    loading,
    error,
    getUserNFTs,
    getNFTEstimatedValue,
    importNFT,
  };
}