"use client";

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getUserLoan } from '../utils/web3';

interface LoanInfo {
  amount: string;
  interest: string;
  dueDate: string;
}

export const usePersistentLoan = () => {
  const { isConnected, userAddress } = useWallet();
  const [loanInfo, setLoanInfo] = useState<LoanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoanDetails = useCallback(async () => {
    if (!isConnected || !userAddress) {
      setLoanInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const loan = await getUserLoan(userAddress);
      
      // Only update if we have actual loan data or if we want to clear it
      if (loan) {
        setLoanInfo(loan);
      } else {
        // Keep existing loan info if we had one, only clear if explicitly needed
        // This prevents flickering when data temporarily returns null
        setLoanInfo(null);
      }
    } catch (error: any) {
      console.error('Error fetching loan details:', error);
      setError(error.message);
      // Don't clear existing loan info on error to prevent flickering
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, userAddress]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  // Add interval to continuously check for loan updates
  useEffect(() => {
    if (!isConnected || !userAddress) return;

    const interval = setInterval(() => {
      fetchLoanDetails();
    }, 2000); // Check every 2 seconds for updates

    return () => clearInterval(interval);
  }, [fetchLoanDetails, isConnected, userAddress]);

  // Force refresh function
  const refreshLoan = useCallback(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  return {
    loanInfo,
    isLoading,
    error,
    refreshLoan,
    hasActiveLoan: loanInfo !== null
  };
};
