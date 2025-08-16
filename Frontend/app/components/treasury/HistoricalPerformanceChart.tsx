"use client";

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Loader2, TrendingUp } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HistoricalPerformanceChartProps {
  loading: boolean;
}

const HistoricalPerformanceChart = ({ loading }: HistoricalPerformanceChartProps) => {
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Treasury Value",
        data: [100000, 120000, 110000, 130000, 150000, 170000, 180000],
        fill: true,
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        borderColor: "rgba(34, 197, 94, 1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.dataset.label}: $${context.formattedValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgb(156, 163, 175)", // gray-400
        },
      },
      y: {
        grid: {
          color: "rgba(156, 163, 175, 0.1)", // gray-400
        },
        ticks: {
          color: "rgb(156, 163, 175)", // gray-400
          callback: function (value: any) {
            return "$" + value / 1000 + "k";
          },
        },
      },
    },
  };

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all">
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center">
        <TrendingUp className="mr-2 text-[var(--primary-color)]" size={20} />
        Historical Performance
      </h3>
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="animate-spin rounded-full h-8 w-8 text-[var(--primary-color)] mx-auto" />
          <p className="text-gray-400 mt-2">Loading chart data...</p>
        </div>
      ) : (
        <div className="h-80">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default HistoricalPerformanceChart;
