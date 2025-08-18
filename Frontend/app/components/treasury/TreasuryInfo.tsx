'use client';

import { Banknote, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface TreasuryInfoProps {
  treasuryContractAddress: string;
}

const TreasuryInfo: React.FC<TreasuryInfoProps> = ({ treasuryContractAddress }) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(treasuryContractAddress);
    toast.success('Contract address copied to clipboard', { style: { background: '#1a1a1a', color: '#ffffff' } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
          <Banknote className="mr-2 text-[var(--primary-color)]" size={20} />
          About the Treasury
        </h3>
        <p className="text-sm text-[var(--foreground)]">
          Your deposits to the SonicFi Treasury are lent to users as micro-loans, enabling financial access for the unbanked. As a depositor, you earn the majority of the profits from loan interest, supporting a sustainable lending ecosystem powered by Sonic’s fast and low-cost transactions.
        </p>
      </div>
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
          <Banknote className="mr-2 text-[var(--primary-color)]" size={20} />
          Treasury Contract
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[var(--primary-color)]">Contract Address:</span>
            <div className="flex items-center">
              <span className="font-mono text-sm text-[var(--foreground)]">
                {treasuryContractAddress.substring(0, 6)}...{treasuryContractAddress.substring(38)}
              </span>
              <button
                onClick={copyAddress}
                className="ml-2 text-[var(--primary-color)] hover:text-emerald-400 transition-colors"
                aria-label="Copy treasury contract address"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--primary-color)]">Network:</span>
            <span className="font-medium text-[var(--foreground)]">Sonic Testnet</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--primary-color)]">Status:</span>
            <span className="text-[var(--primary-color)] font-medium flex items-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryInfo;