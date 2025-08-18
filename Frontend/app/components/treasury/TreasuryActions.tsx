'use client';

import { Wallet, PiggyBank, TrendingUp, Coins } from 'lucide-react';

interface UserBalance {
  total: number;
  profits: number;
  withdrawable: number;
  walletUSDC: number;
}

interface TreasuryActionsProps {
  userBalance: UserBalance;
}

const TreasuryActions: React.FC<TreasuryActionsProps> = ({ userBalance }) => {
  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all" aria-label="Your balance overview">
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <Wallet className="mr-2 text-[var(--primary-color)]" size={20} />
        Your Balance
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-[var(--input-background)] p-4 rounded-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
          <p className="text-sm text-[var(--primary-color)] flex items-center justify-center">
            <PiggyBank className="mr-1" size={14} />
            Total Balance
          </p>
          <p className="text-lg font-bold text-[var(--foreground)]">${userBalance.total.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--input-background)] p-4 rounded-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
          <p className="text-sm text-[var(--primary-color)] flex items-center justify-center">
            <TrendingUp className="mr-1" size={14} />
            Profits
          </p>
          <p className="text-lg font-bold text-emerald-500">+${userBalance.profits.toFixed(2)}</p>
        </div>
        <div className="bg-[var(--input-background)] p-4 rounded-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
          <p className="text-sm text-[var(--primary-color)] flex items-center justify-center">
            <Coins className="mr-1" size={14} />
            Withdrawable
          </p>
          <p className="text-lg font-bold text-[var(--foreground)]">${userBalance.withdrawable.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default TreasuryActions;