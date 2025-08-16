"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Loader2, PieChart } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface TreasuryChartProps {
  loading: boolean;
  treasuryData: {
    totalDeposits: string;
    totalLoans: string;
    availableLiquidity: string;
  };
}

const TreasuryChart = ({ loading, treasuryData }: TreasuryChartProps) => {
  const chartData = {
    labels: ["Total Deposits", "Total Loans", "Available Liquidity"],
    datasets: [
      {
        data: [
          parseFloat(treasuryData.totalDeposits),
          parseFloat(treasuryData.totalLoans),
          parseFloat(treasuryData.availableLiquidity),
        ],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)", // emerald-500
          "rgba(59, 130, 246, 0.8)", // blue-500
          "rgba(147, 51, 234, 0.8)", // purple-500
        ],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(59, 130, 246, 1)", "rgba(147, 51, 234, 1)"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "rgb(156, 163, 175)", // gray-400
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: $${context.parsed}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <PieChart className="mr-2 text-[var(--primary-color)]" size={20} />
        Treasury Distribution
      </h3>
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="animate-spin rounded-full h-8 w-8 text-[var(--primary-color)] mx-auto" />
          <p className="text-gray-400 mt-2">Loading treasury data...</p>
        </div>
      ) : (
        <div className="h-64">
          <Pie data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default TreasuryChart;
