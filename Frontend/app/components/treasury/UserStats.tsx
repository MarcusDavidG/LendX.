'use client';

import { PiggyBank, TrendingUp, Loader2 } from 'lucide-react';

interface UserStatsData {
  userDeposit: string;
  estimatedEarnings: string;
}

interface UserStatsProps {
  userStats: UserStatsData;
  loading: boolean;
}

const UserStats: React.FC<UserStatsProps> = ({ userStats, loading }) => {
  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <PiggyBank className="mr-2 text-[var(--primary-color)]" size={20} />
        Your Stats
      </h3>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--input-background)] rounded-2xl p-6 border border-[var(--border-color)] animate-pulse"
            >
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-gray-700/50 rounded mr-2"></div>
                <div className="h-5 w-24 bg-gray-700/50 rounded"></div>
              </div>
              <div className="h-6 w-16 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <PiggyBank className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Your Deposits</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">${userStats.userDeposit}</p>
          </div>
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <TrendingUp className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Estimated Earnings</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">${userStats.estimatedEarnings}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStats;