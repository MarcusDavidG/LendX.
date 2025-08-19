'use client';

import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Loader2, TrendingUp } from 'lucide-react';
import 'chartjs-adapter-date-fns';

ChartJS.register(LineElement, PointElement, LinearScale, TimeScale, Tooltip, Legend);

interface HistoricalPerformanceChartProps {
  loading: boolean;
  totalValueLocked: number;
}

const generateData = (days: number, baseValue: number) => {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const value = baseValue + (Math.random() - 0.45) * baseValue * 0.1; // ±10% variation
    data.push({ x: date, y: value });
  }
  return data;
};

const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({ loading, totalValueLocked }) => {
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D' | 'All'>('90D');

  const allData = useMemo(() => generateData(365, totalValueLocked || 10000), [totalValueLocked]);

  const getChartData = () => {
    let data = allData;
    switch (timeRange) {
      case '7D':
        data = allData.slice(-7);
        break;
      case '30D':
        data = allData.slice(-30);
        break;
      case '90D':
        data = allData.slice(-90);
        break;
      case 'All':
      default:
        data = allData;
    }

    return {
      datasets: [
        {
          label: 'Treasury Value ($)',
          data,
          fill: true,
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          tension: 0.4,
        },
      ],
    };
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#FFFFFF',
        },
      },
      tooltip: {
        backgroundColor: 'green',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'white',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '7D' ? 'day' : 'month',
        },
        grid: {
          display: false,
        },
        ticks: {
          color: '#FFFFFF',
        },
        title: {
          display: true,
          text: 'Date',
          color: '#FFFFFF',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
        },
        ticks: {
          color: '#FFFFFF',
          callback: function (value) {
            return '$' + (Number(value) / 1000) + 'k';
          },
        },
        title: {
          display: true,
          text: 'Value ($)',
          color: '#FFFFFF',
        },
      },
    },
  };

  return (
    <div className="bg-[var(--card-background)] rounded-2xl p-6 shadow-lg border border-[var(--border-color)] hover:border-emerald-500 transition-all" aria-label="Historical performance chart">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-[var(--foreground)] flex items-center">
          <TrendingUp className="mr-2 text-[var(--primary-color)]" size={20} />
          Historical Performance
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('7D')}
            className={`px-3 py-1 text-sm rounded-md transition-all hover:scale-101 ${
              timeRange === '7D'
                ? 'text-[var(--primary-color)]'
                : 'bg-[var(--input-background)] text-[var(--foreground)] hover:bg-[var(--input-background-hover)]'
            }`}
            aria-label="Show last 7 days"
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange('30D')}
            className={`px-3 py-1 text-sm rounded-md transition-all hover:scale-101 ${
              timeRange === '30D'
                ? 'text-[var(--primary-color)]'
                : 'bg-[var(--input-background)] text-[var(--foreground)] hover:bg-[var(--input-background-hover)]'
            }`}
            aria-label="Show last 30 days"
          >
            30D
          </button>
          <button
            onClick={() => setTimeRange('90D')}
            className={`px-3 py-1 text-sm rounded-md transition-all hover:scale-101 ${
              timeRange === '90D'
                ? 'text-[var(--primary-color)]'
                : 'bg-[var(--input-background)] text-[var(--foreground)] hover:bg-[var(--input-background-hover)]'
            }`}
            aria-label="Show last 90 days"
          >
            90D
          </button>
          <button
            onClick={() => setTimeRange('All')}
            className={`px-3 py-1 text-sm rounded-md transition-all hover:scale-101 ${
              timeRange === 'All'
                ? 'text-[var(--primary-color)]'
                : 'bg-[var(--input-background)] text-[var(--foreground)] hover:bg-[var(--input-background-hover)]'
            }`}
            aria-label="Show all time"
          >
            All
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="animate-spin rounded-full h-8 w-8 text-[var(--primary-color)] mx-auto" />
          <p className="text-[var(--foreground)] mt-2">Loading chart data...</p>
        </div>
      ) : (
        <div className="h-80">
          <Line data={getChartData()} options={chartOptions} />
        </div>
      )}
    </div>
  );
};

export default HistoricalPerformanceChart;
