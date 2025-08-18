'use client';

import { PieChart, TrendingUp, Banknote, Shield, Loader2 } from 'lucide-react';

interface TreasuryData {
  totalValueLocked: string;
  totalLoans: string;
  availableLiquidity: string;
  utilizationRate: string;
}

interface TreasuryStatsProps {
  loading: boolean;
  treasuryData: TreasuryData;
}

const TreasuryStats: React.FC<TreasuryStatsProps> = ({ loading, treasuryData }) => {
  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <PieChart className="mr-2 text-[var(--primary-color)]" size={20} />
        Treasury Overview
      </h3>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[var(--input-background)] rounded-2xl p-6 border border-[var(--border-color)] animate-pulse"
            >
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-gray-700/50 rounded mr-2"></div>
                <div className="h-5 w-32 bg-gray-700/50 rounded"></div>
              </div>
              <div className="h-6 w-20 bg-gray-700/50 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <TrendingUp className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Total Value Locked (TVL)</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">${treasuryData.totalValueLocked}</p>
          </div>
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <Banknote className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Total Loans</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">${treasuryData.totalLoans}</p>
          </div>
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <PieChart className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Available Liquidity</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">${treasuryData.availableLiquidity}</p>
          </div>
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <Shield className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Utilization Rate</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{treasuryData.utilizationRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryStats;