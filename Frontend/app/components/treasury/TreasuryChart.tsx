'use client';

import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Loader2, PieChart } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TreasuryData {
  totalValueLocked: string;
  totalLoans: string;
  availableLiquidity: string;
}

interface TreasuryChartProps {
  loading: boolean;
  treasuryData: TreasuryData;
}

const TreasuryChart: React.FC<TreasuryChartProps> = ({ loading, treasuryData }) => {
  if (loading) {
    return (
      <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] animate-pulse">
        <div className="h-64 w-full bg-[var(--input-background)] rounded"></div>
      </div>
    );
  }

  const chartData = {
    labels: ['Total Value Locked', 'Total Loans', 'Available Liquidity'],
    datasets: [
      {
        data: [
          parseFloat(treasuryData.totalValueLocked),
          parseFloat(treasuryData.totalLoans),
          parseFloat(treasuryData.availableLiquidity),
        ],
        backgroundColor: [
          'var(--primary-color)', // #10b981
          'rgba(59, 130, 246, 0.8)', // blue-500
          'rgba(147, 51, 234, 0.8)', // purple-500
        ],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'var(--text-secondary)', // #9ca3af
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'var(--card-background)', // #1a1a1a
        titleColor: 'var(--foreground)', // #ffffff
        bodyColor: 'var(--foreground)', // #ffffff
        callbacks: {
          label: function (context: any) {
            return `${context.label}: $${context.parsed.toFixed(2)}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all" aria-label="Treasury distribution chart">
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <PieChart className="mr-2 text-[var(--primary-color)]" size={20} />
        Treasury Distribution
      </h3>
      <div className="h-64">
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default TreasuryChart;