'use client';

import { TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react';

interface TreasuryData {
  apy: string;
  protocolRevenue: string;
  depositors: number;
}

interface KeyMetricsProps {
  treasuryData: TreasuryData;
  loading: boolean;
}

const KeyMetrics: React.FC<KeyMetricsProps> = ({ treasuryData, loading }) => {
  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <TrendingUp className="mr-2 text-[var(--primary-color)]" size={20} />
        Key Metrics
      </h3>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <TrendingUp className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">APY</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{treasuryData.apy}%</p>
          </div>
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <DollarSign className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Protocol Revenue</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">${treasuryData.protocolRevenue}</p>
          </div>
          <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
            <div className="flex items-center mb-3">
              <Users className="text-[var(--primary-color)] mr-2" size={16} />
              <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Depositors</h4>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">{treasuryData.depositors}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyMetrics;