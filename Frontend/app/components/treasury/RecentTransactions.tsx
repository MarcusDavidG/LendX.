'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { TransactionInfo } from '../../hooks/useTransactionTracker';

interface RecentTransactionsProps {
  transactions: TransactionInfo[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedTransactions = showAll ? transactions : transactions.slice(0, 5);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4">Recent Transactions</h3>
        <p className="text-sm text-[var(--foreground)]">No recent transactions.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-[var(--foreground)]">Recent Transactions</h3>
        {transactions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-[var(--primary-color)] hover:underline"
            aria-label={showAll ? 'Show fewer transactions' : 'Show all transactions'}
          >
            {showAll ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {displayedTransactions.map((tx) => (
          <div
            key={tx.hash}
            className="flex items-center justify-between p-3 bg-[var(--input-background)] rounded-lg hover:bg-[var(--input-background-hover)] transition-all"
          >
            <div className="flex items-center">
              {tx.type === 'deposit' ? (
                <div className="p-2 bg-green-500/10 rounded-full mr-4">
                  <ArrowDownLeft className="text-green-500" size={16} />
                </div>
              ) : (
                <div className="p-2 bg-red-500/10 rounded-full mr-4">
                  <ArrowUpRight className="text-red-500" size={16} />
                </div>
              )}
              <div>
                <p className="font-semibold text-[var(--foreground)] capitalize">{tx.type}</p>
                <p className="text-xs text-[var(--foreground)]">{new Date(tx.timestamp).toLocaleString()}</p>
                <a
                  href={`https://blaze.soniclabs.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--primary-color)] hover:underline flex items-center mt-1"
                  aria-label={`View transaction ${tx.hash} on explorer`}
                >
                  {tx.hash.substring(0, 8)}...{tx.hash.substring(36)}
                  <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            </div>
            <div className={`font-bold text-right ${tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
              {tx.type === 'deposit' ? '+' : '-'}${tx.amount} {tx.token}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;