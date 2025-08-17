import { useState, useEffect, useCallback, useRef } from 'react';
import { trackTransaction as web3TrackTransaction } from '../utils/web3';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'unknown';

interface TransactionInfo {
  hash: string;
  status: TransactionStatus;
  timestamp: number;
  type: 'send' | 'deposit' | 'loan' | 'swap' | 'withdraw' | 'repay';
  amount?: string;
  token?: string;
}

interface UseTransactionTrackerReturn {
  transactions: TransactionInfo[];
  trackTransaction: (hash: string, type: TransactionInfo['type'], amount?: string, token?: string) => void;
  getTransactionStatus: (hash: string) => TransactionStatus;
  loading: boolean;
}

export const useTransactionTracker = (): UseTransactionTrackerReturn => {
  const [transactions, setTransactions] = useState<TransactionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    try {
      const savedTransactions = localStorage.getItem('nftTransactions');
      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions) as TransactionInfo[];
        setTransactions(parsed.slice(0, 10)); // Limit to 10 transactions
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nftTransactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }, [transactions]);

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current.clear();
    };
  }, []);

  const mapWeb3StatusToTransactionStatus = (web3Status: string): TransactionStatus => {
    switch (web3Status) {
      case 'pending':
        return 'pending';
      case 'success':
        return 'success';
      case 'failed':
        return 'failed';
      default:
        return 'unknown';
    }
  };

  const trackTransaction = useCallback((hash: string, type: TransactionInfo['type'], amount?: string, token?: string) => {
    if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
      console.error('Invalid transaction hash:', hash);
      return;
    }

    setTransactions(prev => {
      if (prev.some(tx => tx.hash === hash)) return prev;
      const newTransaction: TransactionInfo = {
        hash,
        status: 'pending',
        timestamp: Date.now(),
        type,
        amount,
        token
      };
      return [newTransaction, ...prev.slice(0, 9)]; // Keep last 10
    });

    monitorTransaction(hash);
  }, []);

  const monitorTransaction = useCallback(async (hash: string) => {
    setLoading(true);
    try {
      const initialStatus = await web3TrackTransaction(hash);
      const mappedStatus = mapWeb3StatusToTransactionStatus(initialStatus);
      
      if (initialStatus === 'success' || initialStatus === 'failed') {
        setTransactions(prev =>
          prev.map(tx =>
            tx.hash === hash ? { ...tx, status: mappedStatus } : tx
          )
        );
        setLoading(false);
        return;
      }

      const maxAttempts = 15; // 30 seconds at 2-second intervals
      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await web3TrackTransaction(hash);
          const mappedStatus = mapWeb3StatusToTransactionStatus(status);
          
          setTransactions(prev =>
            prev.map(tx =>
              tx.hash === hash ? { ...tx, status: mappedStatus } : tx
            )
          );
          
          if (status === 'success' || status === 'failed') {
            clearInterval(interval);
            intervalRefs.current.delete(hash);
            setLoading(false);
          } else if (attempts >= maxAttempts) {
            setTransactions(prev =>
              prev.map(tx =>
                tx.hash === hash ? { ...tx, status: 'unknown' } : tx
              )
            );
            clearInterval(interval);
            intervalRefs.current.delete(hash);
            setLoading(false);
          }
        } catch (error) {
          console.error(`Error tracking ${hash}:`, error);
          if (attempts >= maxAttempts) {
            setTransactions(prev =>
              prev.map(tx =>
                tx.hash === hash ? { ...tx, status: 'unknown' } : tx
              )
            );
            clearInterval(interval);
            intervalRefs.current.delete(hash);
            setLoading(false);
          }
        }
      }, 2000);
      intervalRefs.current.set(hash, interval);
    } catch (error) {
      console.error(`Error monitoring ${hash}:`, error);
      setTransactions(prev =>
        prev.map(tx =>
          tx.hash === hash ? { ...tx, status: 'unknown' } : tx
        )
      );
      setLoading(false);
    }
  }, []);

  const getTransactionStatus = useCallback((hash: string): TransactionStatus => {
    const transaction = transactions.find(tx => tx.hash === hash);
    return transaction?.status || 'unknown';
  }, [transactions]);

  return { transactions, trackTransaction, getTransactionStatus, loading };
};
