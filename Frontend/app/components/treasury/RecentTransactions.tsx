"use client";

import { ArrowRight, Banknote, ExternalLink, RefreshCw, TrendingUp } from "lucide-react";

interface Transaction {
  hash: string;
  type: string;
  amount?: string;
  token?: string;
  status: "success" | "failed" | "pending";
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <TrendingUp size={16} className="text-[var(--foreground)]" />;
      case "loan":
        return <Banknote size={16} className="text-[var(--foreground)]" />;
      case "send":
        return <ArrowRight size={16} className="text-[var(--foreground)]" />;
      default:
        return <RefreshCw size={16} className="text-[var(--foreground)]" />;
    }
  };

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <RefreshCw className="mr-2 text-[var(--primary-color)]" size={20} />
        Recent Treasury Transactions
      </h3>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {transactions
          .filter((tx) => tx.type === "deposit" || tx.type === "withdraw")
          .map((tx) => (
            <div
              key={tx.hash}
              className="p-3 bg-[var(--input-background)] rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-start text-[var(--foreground)]">
                <div className="mt-1 mr-3">{getTransactionIcon(tx.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="capitalize font-medium text-[var(--foreground)]">{tx.type}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        tx.status === "success"
                          ? "bg-emerald-600 text-[var(--foreground)]"
                          : tx.status === "failed"
                          ? "bg-red-600 text-[var(--foreground)]"
                          : "bg-yellow-600 text-[var(--foreground)]"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  {tx.amount && tx.token && (
                    <div className="text-sm text-gray-400 mt-1">
                      {tx.amount} {tx.token}
                    </div>
                  )}
                  <div className="mt-2 flex items-center text-xs text-gray-400">
                    <a
                      href={`https://testnet.soniclabs.com/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:text-[var(--primary-color)]"
                    >
                      {tx.hash.substring(0, 8)}...{tx.hash.substring(36)}
                      <ExternalLink size={12} className="ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
