import React, { useState } from 'react';
import { X, BarChart3 } from 'lucide-react';

interface BacktestRun {
  id: number;
  name: string;
  backtest_type: string;
  initial_capital: number;
  final_capital: number;
  total_return_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  gross_profit: number;
  gross_loss: number;
  net_profit: number;
  profit_factor: number;
  max_drawdown_percent: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  avg_win: number;
  avg_loss: number;
  avg_trade_duration_minutes: number;
  total_brokerage: number;
  created_at: string;
}

interface MetricItem {
  label: string;
  key?: string | null;
  format: (value: number) => string;
  calculate?: (run: BacktestRun) => number;
  higherIsBetter: boolean;
  colorCode?: boolean;
}

interface BacktestComparisonProps {
  runs: BacktestRun[];
  onClose: () => void;
}

export default function BacktestComparison({ runs, onClose }: BacktestComparisonProps) {
  const [selectedRuns, setSelectedRuns] = useState<number[]>(
    runs.slice(0, Math.min(3, runs.length)).map(r => r.id)
  );

  const handleToggleRun = (runId: number) => {
    if (selectedRuns.includes(runId)) {
      setSelectedRuns(selectedRuns.filter(id => id !== runId));
    } else {
      if (selectedRuns.length < 3) {
        setSelectedRuns([...selectedRuns, runId]);
      }
    }
  };

  const comparedruns = runs.filter(r => selectedRuns.includes(r.id));

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getBestValue = (values: number[], higherIsBetter: boolean = true) => {
    if (values.length === 0) return null;
    return higherIsBetter ? Math.max(...values) : Math.min(...values);
  };

  const metrics: { category: string; items: MetricItem[] }[] = [
    {
      category: 'Performance',
      items: [
        {
          label: 'Total Return',
          key: 'total_return_percent',
          format: formatPercent,
          higherIsBetter: true,
          colorCode: true,
        },
        {
          label: 'Net Profit',
          key: 'net_profit',
          format: formatCurrency,
          higherIsBetter: true,
          colorCode: true,
        },
        {
          label: 'Final Capital',
          key: 'final_capital',
          format: formatCurrency,
          higherIsBetter: true,
        },
      ],
    },
    {
      category: 'Risk Metrics',
      items: [
        {
          label: 'Max Drawdown',
          key: 'max_drawdown_percent',
          format: (v: number) => `${v.toFixed(2)}%`,
          higherIsBetter: false,
          colorCode: true,
        },
        {
          label: 'Sharpe Ratio',
          key: 'sharpe_ratio',
          format: (v: number) => v.toFixed(2),
          higherIsBetter: true,
        },
        {
          label: 'Sortino Ratio',
          key: 'sortino_ratio',
          format: (v: number) => v.toFixed(2),
          higherIsBetter: true,
        },
      ],
    },
    {
      category: 'Trade Statistics',
      items: [
        {
          label: 'Total Trades',
          key: 'total_trades',
          format: (v: number) => v.toString(),
          higherIsBetter: false,
        },
        {
          label: 'Win Rate',
          key: 'win_rate',
          format: (v: number) => `${v.toFixed(1)}%`,
          higherIsBetter: true,
        },
        {
          label: 'Profit Factor',
          key: 'profit_factor',
          format: (v: number) => v.toFixed(2),
          higherIsBetter: true,
        },
        {
          label: 'Avg Win',
          key: 'avg_win',
          format: formatCurrency,
          higherIsBetter: true,
        },
        {
          label: 'Avg Loss',
          key: 'avg_loss',
          format: formatCurrency,
          higherIsBetter: false,
        },
        {
          label: 'Avg Duration',
          key: 'avg_trade_duration_minutes',
          format: formatDuration,
          higherIsBetter: false,
        },
      ],
    },
    {
      category: 'Costs',
      items: [
        {
          label: 'Total Brokerage',
          key: 'total_brokerage',
          format: formatCurrency,
          higherIsBetter: false,
        },
        {
          label: 'Brokerage per Trade',
          key: null,
          format: (v: number) => formatCurrency(v),
          calculate: (run: BacktestRun) => run.total_brokerage / (run.total_trades || 1),
          higherIsBetter: false,
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Compare Backtest Runs</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select up to 3 backtest runs to compare side-by-side
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Run Selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {runs.map((run) => (
              <button
                key={run.id}
                onClick={() => handleToggleRun(run.id)}
                disabled={!selectedRuns.includes(run.id) && selectedRuns.length >= 3}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRuns.includes(run.id)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {run.name}
              </button>
            ))}
          </div>

          {selectedRuns.length < 2 && (
            <p className="mt-3 text-sm text-amber-600">
              Select at least 2 backtest runs to compare
            </p>
          )}
        </div>

        {/* Comparison Table */}
        {comparedruns.length >= 2 && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10">
                      Metric
                    </th>
                    {comparedruns.map((run) => (
                      <th key={run.id} className="py-3 px-4 text-center text-sm font-semibold text-gray-700 min-w-[180px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold">{run.name}</span>
                          <span className="text-xs font-normal text-gray-500">{run.backtest_type}</span>
                          <span className="text-xs font-normal text-gray-500">
                            {new Date(run.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((category, categoryIndex) => (
                    <React.Fragment key={category.category}>
                      {/* Category Header */}
                      <tr className="bg-gray-50">
                        <td
                          colSpan={comparedruns.length + 1}
                          className="py-3 px-4 text-sm font-semibold text-gray-800 sticky left-0 z-10 bg-gray-50"
                        >
                          {category.category}
                        </td>
                      </tr>

                      {/* Metrics Rows */}
                      {category.items.map((metric, metricIndex) => {
                        const values = comparedruns.map((run) =>
                          metric.calculate
                            ? metric.calculate(run)
                            : (run as any)[metric.key!]
                        );
                        const bestValue = getBestValue(values, metric.higherIsBetter);

                        return (
                          <tr
                            key={`${categoryIndex}-${metricIndex}`}
                            className="border-b border-gray-200 hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 text-sm text-gray-700 font-medium sticky left-0 z-10 bg-white">
                              {metric.label}
                            </td>
                            {comparedruns.map((run, runIndex) => {
                              const value = values[runIndex];
                              const isBest = value === bestValue;

                              return (
                                <td
                                  key={run.id}
                                  className={`py-3 px-4 text-center text-sm ${
                                    isBest ? 'font-bold' : 'font-medium'
                                  } ${
                                    metric.colorCode
                                      ? metric.higherIsBetter
                                        ? value >= 0
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                        : value <= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                      : 'text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    {metric.format(value)}
                                    {isBest && (
                                      <span className="text-yellow-500 text-xs">★</span>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">★</span>
                <span>Best Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>Positive/Better</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>Negative/Worse</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {comparedruns.length < 2 && (
          <div className="p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Select Runs to Compare
            </h3>
            <p className="text-gray-600">
              Choose at least 2 backtest runs from the options above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
