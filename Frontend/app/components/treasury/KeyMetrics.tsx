"use client";

import { TrendingUp, Zap, Shield } from "lucide-react";

const KeyMetrics = () => {
  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl sm:text-2xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <Zap className="mr-2 text-[var(--primary-color)]" size={20} />
        Key Metrics
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
          <div className="flex items-center mb-3">
            <TrendingUp className="text-[var(--primary-color)] mr-2" size={16} />
            <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">APY</h4>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">5.2%</p>
        </div>
        <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
          <div className="flex items-center mb-3">
            <Shield className="text-[var(--primary-color)] mr-2" size={16} />
            <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Default Rate</h4>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">0.1%</p>
        </div>
        <div className="bg-[var(--input-background)] rounded-2xl p-4 sm:p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:bg-gradient-to-br hover:from-[var(--input-background)] hover:to-emerald-950/50 transition-all shadow-md hover:shadow-lg hover:shadow-emerald-700/50">
          <div className="flex items-center mb-3">
            <Zap className="text-[var(--primary-color)] mr-2" size={16} />
            <h4 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Average Loan Size</h4>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-[var(--foreground)]">$5,000</p>
        </div>
      </div>
    </div>
  );
};

export default KeyMetrics;
