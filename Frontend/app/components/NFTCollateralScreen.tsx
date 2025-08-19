'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@/app/contexts/WalletContext';
import { useNFTData } from '@/app/hooks/useNFTData';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { Check, ChevronDown, Search, X, Loader2, Lock } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useRouter } from 'next/navigation';
import ConnectWalletButton from './ConnectWalletButton';
import NFTLiquidationStatusDisplay from './NFTLiquidationStatusDisplay';
import { usePersistentLoan, LoanInfo } from '@/app/hooks/usePersistentLoan'; // Assuming Loan type is defined here

interface NFT {
  id: string;
  contractAddress: string;
  tokenId: string;
  name: string;
  image: string;
  collection: string;
  estimatedValue: number;
  rarity?: string;
  attributes?: any[];
}

interface NFTCollateralScreenProps {
  onNFTSelect?: (nft: NFT) => void;
  selectedNFT?: NFT | null;
}

export default function NFTCollateralScreen({ onNFTSelect, selectedNFT: initialSelectedNFT }: NFTCollateralScreenProps) {
  const { isConnected, userAddress } = useWallet();
  const { nfts: userNFTs, loading: nftsLoading, getUserNFTs, getNFTEstimatedValue, importNFT } = useNFTData();
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState(false);
  const [importForm, setImportForm] = useState({
    contractAddress: '',
    tokenId: '',
    collectionName: '',
  });
  const [importLoading, setImportLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [showDetailsModal, setShowDetailsModal] = useState<NFT | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;
  const router = useRouter();

  // Mock Loan Object for demonstration purposes
  // In a real application, this would come from a context or fetched data
   const mockLoan: LoanInfo = {                                                                                                                                                                
      interest: "50", // Mock interest                                                                                                                                                          
      dueDate: "2025-12-31", // Mock due date                                                                                                                                                   
      amount: "1000", // Mock loan amount                                                                                                                                                      
      };


  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(initialSelectedNFT || null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (userAddress) {
      loadUserNFTs();
    }
  }, [userAddress]);

  const loadUserNFTs = async () => {
    if (!userAddress) return;
    setLoading(true);
    try {
      await getUserNFTs(userAddress);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      toast.error('Failed to load NFTs', { style: { background: '#1a1a1a', color: '#ffffff' } });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNFT = (nft: NFT) => {
    setSelectedNFT(nft);
    setIsVerified(false);
    setIsLocked(false);
    if (onNFTSelect) {
      onNFTSelect(nft);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    toast.loading('Verifying with Chainlink CCIP...', { id: 'verify-toast', style: { background: '#1a1a1a', color: '#ffffff' } });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate verification
    setIsVerifying(false);
    setIsVerified(true);
    toast.success('NFT Verified Successfully!', { id: 'verify-toast', style: { background: '#1a1a1a', color: '#ffffff' } });
  };

  const handleLock = async () => {
    setIsLocking(true);
    toast.loading('Locking NFT as collateral...', { id: 'lock-toast', style: { background: '#1a1a1a', color: '#ffffff' } });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate locking
    setIsLocking(false);
    setIsLocked(true);
    localStorage.setItem('lockedNFT', JSON.stringify(selectedNFT));
    toast.success('NFT Locked! You can now proceed to get a loan.', { id: 'lock-toast', style: { background: '#1a1a1a', color: '#ffffff' } });
  };
  
  const handleProceedToLoan = () => {
    router.push('/loan');
  };

  const handleImportNFT = async () => {
    if (!importForm.contractAddress || !importForm.tokenId) {
      toast.error('Please fill in all required fields', { style: { background: '#1a1a1a', color: '#ffffff' } });
      return;
    }

    if (!ethers.isAddress(importForm.contractAddress)) {
      toast.error('Invalid contract address', { style: { background: '#1a1a1a', color: '#ffffff' } });
      return;
    }

    setImportLoading(true);
    try {
      await importNFT(
        importForm.contractAddress,
        importForm.tokenId,
        importForm.collectionName
      );
      setImportForm({ contractAddress: '', tokenId: '', collectionName: '' });
      setImportMode(false);
      toast.success('NFT imported successfully!', { style: { background: '#1a1a1a', color: '#ffffff' } });
      loadUserNFTs(); // Refresh the list
    } catch (error) {
      console.error('Error importing NFT:', error);
      toast.error('Failed to import NFT', { style: { background: '#1a1a1a', color: '#ffffff' } });
    } finally {
      setImportLoading(false);
    }
  };

  const filteredNFTs = userNFTs
    .filter((nft) => {
      if (filter === 'all') return true;
      if (filter === 'high-value') return nft.estimatedValue > 1000;
      if (filter === 'collections') return nft.collection.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return true;
    })
    .filter(
      (nft) =>
        nft.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        nft.collection.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'value') return b.estimatedValue - a.estimatedValue;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'collection') return a.collection.localeCompare(b.collection);
      return 0;
    });

  const paginatedNFTs = filteredNFTs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case 'legendary':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'epic':
        return 'text-purple-500 bg-purple-500/10';
      case 'rare':
        return 'text-blue-500 bg-blue-500/10';
      case 'uncommon':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const isValidAddress = ethers.isAddress(importForm.contractAddress);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] p-4 sm:p-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4">Connect Your Wallet</h2>
          <p className="text-[var(--foreground)] mb-6 text-sm md:text-base">
            Please connect your wallet to view your NFTs
          </p>
                    <ConnectWalletButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[var(--card-background)] rounded-lg shadow-lg p-6 mb-6 border border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">NFT Collateral</h1>
              <p className="text-[var(--primary-color)] mb-6 text-sm md:text-base">
                Select NFTs from your collection to use as collateral
              </p>
            </div>
            <button
              onClick={() => setImportMode(!importMode)}
              className="mt-4 md:mt-0 bg-[var(--primary-color)] text-[var(--foreground)] px-6 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-300 hover:scale-101 active:scale-95"
              aria-label={importMode ? 'Cancel NFT import' : 'Import NFT'}
            >
              {importMode ? 'Cancel Import' : 'Import NFT'}
            </button>
          </div>

          {importMode && (
            <div className="bg-[var(--input-background)] border border-[var(--border-color)] rounded-lg p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Import NFT</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Contract Address *
                  </label>
                  <input
                    type="text"
                    value={importForm.contractAddress}
                    onChange={(e) => setImportForm({ ...importForm, contractAddress: e.target.value })}
                    placeholder="0x..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-[var(--card-background)] text-[var(--foreground)] ${
                      importForm.contractAddress && !isValidAddress ? 'border-red-500' : 'border-[var(--border-color)]'
                    }`}
                    aria-invalid={!!(importForm.contractAddress && !isValidAddress)}
                  />
                  {importForm.contractAddress && !isValidAddress && (
                    <p className="text-xs text-red-400 mt-1">Invalid contract address</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Token ID *
                  </label>
                  <input
                    type="text"
                    value={importForm.tokenId}
                    onChange={(e) => setImportForm({ ...importForm, tokenId: e.target.value })}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-[var(--card-background)] text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Collection Name
                  </label>
                  <input
                    type="text"
                    value={importForm.collectionName}
                    onChange={(e) => setImportForm({ ...importForm, collectionName: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-[var(--card-background)] text-[var(--foreground)]"
                  />
                </div>
              </div>
              <button
                onClick={handleImportNFT}
                disabled={importLoading || !isValidAddress || !importForm.tokenId}
                className="mt-4 bg-[var(--primary-color)] text-[var(--foreground)] px-6 py-2 rounded-md hover:bg-emerald-600 disabled:opacity-50 transition-all duration-300 hover:scale-101 active:scale-95 flex items-center gap-2"
                aria-label="Import NFT"
              >
                {importLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  'Import NFT'
                )}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]" />
              <input
                type="text"
                placeholder="Search NFTs by name or collection..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 'calc(1.5rem + 0.75rem)' }}
                className="w-full pl-10 pr-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-[var(--card-background)] text-[var(--foreground)] text-sm md:text-base"
                aria-label="Search NFTs"
              />
            </div>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ paddingLeft: 'calc(1.5rem + 0.75rem)' }}
                className="appearance-none w-full sm:w-48 px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-[var(--card-background)] text-[var(--foreground)] text-sm md:text-base pr-10"
                aria-label="Filter NFTs"
              >
                <option value="all">All NFTs</option>
                <option value="high-value">High Value ($1000+)</option>
                <option value="collections">By Collection</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]" />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ paddingLeft: 'calc(1.5rem + 0.75rem)' }}
                className="appearance-none w-full sm:w-48 px-4 py-2 border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] bg-[var(--card-background)] text-[var(--foreground)] text-sm md:text-base pr-10"
                aria-label="Sort NFTs"
              >
                <option value="value">Sort by Value</option>
                <option value="name">Sort by Name</option>
                <option value="collection">Sort by Collection</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]" />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg animate-pulse">
                  <div className="aspect-square bg-gray-700/50 rounded-t-lg"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-700/50 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNFTs.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-[var(--foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">No NFTs Found</h3>
              <p className="text-[var(--foreground)] mb-4 text-sm md:text-base">
                {debouncedSearchTerm
                  ? 'No NFTs match your search criteria'
                  : "You don't have any NFTs in your wallet. Import one or purchase NFTs to use as collateral."}
              </p>
              <button
                onClick={() => setImportMode(true)}
                className="bg-[var(--primary-color)] text-[var(--foreground)] px-6 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-300 hover:scale-101 active:scale-95"
                aria-label="Import NFT"
              >
                Import NFT
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
              {paginatedNFTs.map((nft) => (
                <div
                  key={`${nft.contractAddress}-${nft.tokenId}`}
                  className={`relative bg-[var(--card-background)] border border-white/10 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-101 hover:shadow-lg hover:shadow-emerald-700/50 ${
                    selectedNFT?.id === nft.id ? 'ring-4 ring-[var(--primary-color)]' : ''
                  } animate-in fade-in duration-200`}
                  onClick={() => handleSelectNFT(nft)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${nft.name}`}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectNFT(nft)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={nft.image || '/placeholder-nft.png'}
                      alt={nft.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                      }}
                    />
                    {nft.rarity && (
                      <span
                        className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${getRarityColor(
                          nft.rarity
                        )}`}
                      >
                        {nft.rarity}
                      </span>
                    )}
                    {selectedNFT?.id === nft.id && (
                      <span className="absolute top-2 left-2 px-2 py-1 text-xs font-semibold text-[var(--foreground)] bg-[var(--primary-color)] rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-[var(--foreground)] truncate text-sm md:text-base">
                      {nft.name}
                    </h4>
                    <p className="text-sm text-[var(--foreground)] truncate">{nft.collection}</p>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-[var(--primary-color)]">
                        {formatValue(nft.estimatedValue)}
                      </span>
                    </div>
                    {/* NFT Liquidation Status Display */}
                    <NFTLiquidationStatusDisplay nft={nft} loan={mockLoan} />
                    {nft.attributes && nft.attributes.length > 0 && (
                      <div className="mt-2 text-xs text-[var(--foreground)]">
                        {nft.attributes.slice(0, 2).map((attr) => (
                          <span key={attr.trait_type} className="mr-2">
                            {attr.trait_type}: {attr.value}
                          </span>
                        ))}
                        {nft.attributes.length > 2 && '...'}
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDetailsModal(nft);
                      }}
                      className="mt-2 text-sm text-[var(--primary-color)] hover:underline"
                      aria-label={`View details for ${nft.name}`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredNFTs.length > itemsPerPage && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[var(--card-background)] text-[var(--foreground)] rounded-lg disabled:opacity-50 hover:bg-[var(--input-background)] transition-all duration-300"
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-[var(--foreground)]">
                Page {page} of {Math.ceil(filteredNFTs.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * itemsPerPage >= filteredNFTs.length}
                className="px-4 py-2 bg-[var(--card-background)] text-[var(--foreground)] rounded-lg disabled:opacity-50 hover:bg-[var(--input-background)] transition-all duration-300"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {selectedNFT && (
          <div className="bg-[var(--card-background)] rounded-lg shadow-lg p-6 mt-6 border border-white/10">
            <h3 className="text-lg md:text-xl font-semibold text-[var(--foreground)] mb-4">
              Collateral Actions for {selectedNFT.name}
            </h3>
            {!isVerified ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isVerifying ? <><Loader2 className="animate-spin h-5 w-5" /> Verifying...</> : 'Verify with Chainlink CCIP'}
              </button>
            ) : !isLocked ? (
              <button
                onClick={handleLock}
                disabled={isLocking}
                className="w-full bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-600 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isLocking ? <><Loader2 className="animate-spin h-5 w-5" /> Locking...</> : <><Lock className="h-5 w-5" /> Lock Collateral</>}
              </button>
            ) : (
              <button
                onClick={handleProceedToLoan}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300"
              >
                Proceed to Loan
              </button>
            )}
          </div>
        )}

        {showDetailsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card-background)] rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{showDetailsModal.name}</h3>
                <button
                  onClick={() => setShowDetailsModal(null)}
                  className="text-[var(--foreground)] hover:text-[var(--foreground)]"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img
                src={showDetailsModal.image || '/placeholder-nft.png'}
                alt={showDetailsModal.name}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <p className="text-sm text-[var(--foreground)] mb-2">
                <strong>Collection:</strong> {showDetailsModal.collection}
              </p>
              <p className="text-sm text-[var(--foreground)] mb-2">
                <strong>Value:</strong> {formatValue(showDetailsModal.estimatedValue)}
              </p>
              {showDetailsModal.rarity && (
                <p className="text-sm text-[var(--foreground)] mb-2">
                  <strong>Rarity:</strong>{' '}
                  <span className={getRarityColor(showDetailsModal.rarity)}>{showDetailsModal.rarity}</span>
                </p>
              )}
              {showDetailsModal.attributes && showDetailsModal.attributes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-[var(--secondary)] mb-2">Attributes</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-[var(--foreground)]">
                    {showDetailsModal.attributes.map((attr) => (
                      <div key={attr.trait_type} className="bg-[var(--input-background)] p-2 rounded-md">
                        <strong>{attr.trait_type}:</strong> {attr.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowDetailsModal(null)}
                className="mt-4 w-full bg-[var(--primary-color)] text-[var(--foreground)] px-4 py-2 rounded-md hover:bg-emerald-600 transition-all duration-300 hover:scale-101 active:scale-95"
                aria-label="Close modal"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="bg-[var(--card-background)] rounded-lg shadow-lg p-6 mt-6 border border-white/10">
          <h3 className="text-lg md:text-xl font-semibold text-[var(--foreground)] mb-4">
            NFT Collateral Information
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols gap-4 text-sm m-auto">
            <div>
              <h4 className="font-medium text-[var(--primary-color)] mb-2">How it works</h4>
              <ul className="text-[var(--foreground)] space-y-1">
                <li>• Select NFTs from your collection</li>
                <li>• Get instant valuation estimates</li>
                <li>• Use as collateral for loans</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[var(--primary-color)] mb-2">Requirements</h4>
              <ul className="text-[var(--foreground)] space-y-1">
                <li>• NFT must be ERC-721 or ERC-1155</li>
                <li>• Minimum value: $50</li>
                <li>• Verified collections preferred</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[var(--primary-color)] mb-2">Risk Notice</h4>
              <ul className="text-[var(--foreground)] space-y-1">
                <li>• NFT values are estimates only</li>
                <li>• Market volatility affects value</li>
                <li>• Liquidation risk if value drops</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
