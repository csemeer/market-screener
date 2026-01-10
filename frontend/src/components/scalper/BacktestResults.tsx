import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
  Activity,
  Play,
  Trash2,
  RefreshCw,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { backtestAPI } from '../../api/client';
import EquityCurveChart from './EquityCurveChart';
import RunBacktestForm from './RunBacktestForm';
import BacktestComparison from './BacktestComparison';
import TradingChart from './TradingChart';

interface BacktestRun {
  id: number;
  scalper_id: number;
  name: string;
  backtest_type: 'PERIOD' | 'INTRADAY' | 'CUSTOM';
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  total_return_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  gross_profit: number;
  gross_loss: number;
  net_profit: number;
  profit_factor: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  avg_win: number;
  avg_loss: number;
  largest_win: number;
  largest_loss: number;
  avg_trade_duration_minutes: number;
  total_brokerage: number;
  status: string;
  created_at: string;
  completed_at?: string;
  equity_curve?: any[];
}

interface BacktestTrade {
  id: number;
  symbol: string;
  exchange: string;
  side: string;
  quantity: number;
  entry_price: number;
  entry_time: string;
  exit_price?: number;
  exit_time?: string;
  stop_loss: number;
  target: number;
  status: string;
  close_reason?: string;
  net_pnl?: number;
  pnl_percent?: number;
  duration_minutes?: number;
  entry_signals?: string[];
}

interface BacktestResultsProps {
  scalperId: number;
}

export default function BacktestResults({ scalperId }: BacktestResultsProps) {
  const [backtestRuns, setBacktestRuns] = useState<BacktestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<BacktestRun | null>(null);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'chart' | 'trades'>('metrics');
  const [showRunForm, setShowRunForm] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    loadBacktestRuns();
  }, [scalperId]);

  useEffect(() => {
    if (selectedRun) {
      loadRunDetails(selectedRun.id);
      loadTrades(selectedRun.id);
    }
  }, [selectedRun?.id]); // Only re-run when the ID changes, not the entire object

  // Load chart data when Chart tab is selected
  useEffect(() => {
    if (activeTab === 'chart' && selectedRun && !chartData) {
      loadChartData(selectedRun.id);
    }
  }, [activeTab, selectedRun?.id]);

  const loadBacktestRuns = async () => {
    try {
      setLoading(true);
      const response = await backtestAPI.getAllRuns({ scalperId, limit: 20 });
      setBacktestRuns(response.data.runs || []);
      if (response.data.runs && response.data.runs.length > 0) {
        setSelectedRun(response.data.runs[0]);
      }
    } catch (error) {
      console.error('Error loading backtest runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRunDetails = async (runId: number) => {
    try {
      const response = await backtestAPI.getRunDetails(runId);
      if (response.data.run) {
        setSelectedRun(response.data.run);
      }
    } catch (error) {
      console.error('Error loading run details:', error);
    }
  };

  const loadTrades = async (runId: number) => {
    try {
      const response = await backtestAPI.getRunTrades(runId, { limit: 100 });
      setTrades(response.data.trades || []);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const loadChartData = async (runId: number) => {
    try {
      setLoadingChart(true);
      const response = await backtestAPI.getChartData(runId);
      setChartData(response.data.chartData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleRunQuickTest = async () => {
    if (!confirm('Run a quick backtest for the last market day?')) return;

    try {
      setRunning(true);
      await backtestAPI.quickTest(scalperId);
      alert('Quick backtest completed successfully!');
      await loadBacktestRuns();
    } catch (error: any) {
      console.error('Error running quick test:', error);
      alert(error.response?.data?.error || 'Failed to run backtest');
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteRun = async (runId: number) => {
    if (!confirm('Are you sure you want to delete this backtest run?')) return;

    try {
      await backtestAPI.deleteRun(runId);
      await loadBacktestRuns();
    } catch (error) {
      console.error('Error deleting backtest run:', error);
      alert('Failed to delete backtest run');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number | null | undefined) => {
    if (minutes === null || minutes === undefined) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (backtestRuns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Backtest Results</h3>
        <p className="text-gray-600 mb-6">
          Run a backtest to analyze strategy performance on historical data
        </p>
        <button
          onClick={handleRunQuickTest}
          disabled={running}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Play className="w-5 h-5 mr-2" />
          {running ? 'Running...' : 'Quick Test (Last Day)'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Run Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Backtest Runs</h3>
          <div className="flex gap-2">
            <button
              onClick={handleRunQuickTest}
              disabled={running}
              className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running...' : 'Quick Test'}
            </button>
            <button
              onClick={() => setShowRunForm(true)}
              disabled={running}
              className="inline-flex items-center px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Custom Backtest
            </button>
            <button
              onClick={() => setShowComparison(true)}
              disabled={backtestRuns.length < 2}
              className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare ({backtestRuns.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {backtestRuns.map((run) => (
            <div
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedRun?.id === run.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 text-sm">{run.name}</h4>
                  <p className="text-xs text-gray-500">
                    {run.backtest_type} • {formatDate(run.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRun(run.id);
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-gray-500">Return</p>
                  <p className={`font-semibold ${
                    run.total_return_percent === null || run.total_return_percent === undefined
                      ? 'text-gray-500'
                      : run.total_return_percent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(run.total_return_percent)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Win Rate</p>
                  <p className="font-semibold text-gray-800">
                    {run.win_rate !== null && run.win_rate !== undefined ? `${run.win_rate.toFixed(1)}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Run Details */}
      {selectedRun && (
        <>
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'metrics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Performance Metrics
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'chart'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Chart Analysis
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('trades')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'trades'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <div className="flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Trades ({selectedRun.total_trades})
                  </div>
                </button>
              </div>
            </div>

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div className="p-6 space-y-6">
                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm text-gray-600">Total Return</p>
                    <p className={`text-2xl font-bold ${
                      selectedRun.total_return === null || selectedRun.total_return === undefined
                        ? 'text-gray-500'
                        : selectedRun.total_return >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(selectedRun.total_return_percent)}
                    </p>
                    <p className="text-xs text-gray-500">{formatCurrency(selectedRun.total_return)}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedRun.win_rate?.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedRun.winning_trades}/{selectedRun.total_trades} trades
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600">Sharpe Ratio</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedRun.sharpe_ratio?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Sortino: {selectedRun.sortino_ratio?.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-sm text-gray-600">Max Drawdown</p>
                    <p className="text-2xl font-bold text-red-600">
                      {selectedRun.max_drawdown_percent?.toFixed(2)}%
                    </p>
                    <p className="text-xs text-gray-500">{formatCurrency(selectedRun.max_drawdown)}</p>
                  </div>
                </div>

                {/* Equity Curve Chart */}
                {selectedRun.equity_curve && Array.isArray(selectedRun.equity_curve) && selectedRun.equity_curve.length > 0 && (
                  <EquityCurveChart
                    equityCurve={selectedRun.equity_curve}
                    initialCapital={selectedRun.initial_capital}
                    maxDrawdownPercent={selectedRun.max_drawdown_percent}
                  />
                )}

                {/* Detailed Metrics */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Profit Metrics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Profit & Loss</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Initial Capital</span>
                        <span className="font-medium">{formatCurrency(selectedRun.initial_capital)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Final Capital</span>
                        <span className="font-medium">{formatCurrency(selectedRun.final_capital)}</span>
                      </div>
                      <div className="h-px bg-gray-300"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gross Profit</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedRun.gross_profit)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Gross Loss</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedRun.gross_loss)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Net Profit</span>
                        <span className={`font-medium ${
                          selectedRun.net_profit === null || selectedRun.net_profit === undefined
                            ? 'text-gray-500'
                            : selectedRun.net_profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(selectedRun.net_profit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Profit Factor</span>
                        <span className="font-medium">{selectedRun.profit_factor?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Brokerage</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedRun.total_brokerage)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trade Metrics */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Trade Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Trades</span>
                        <span className="font-medium">{selectedRun.total_trades}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Winning Trades</span>
                        <span className="font-medium text-green-600">{selectedRun.winning_trades}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Losing Trades</span>
                        <span className="font-medium text-red-600">{selectedRun.losing_trades}</span>
                      </div>
                      <div className="h-px bg-gray-300"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Win</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedRun.avg_win)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Loss</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedRun.avg_loss)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Largest Win</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedRun.largest_win)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Largest Loss</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedRun.largest_loss)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Duration</span>
                        <span className="font-medium">
                          {formatDuration(selectedRun.avg_trade_duration_minutes)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Analysis Tab */}
            {activeTab === 'chart' && (
              <div className="p-6">
                {loadingChart ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <span className="ml-3 text-gray-600">Loading chart data...</span>
                  </div>
                ) : chartData ? (
                  <TradingChart
                    runId={selectedRun.id}
                    tradeMarkers={chartData.tradeMarkers || []}
                    priceData={chartData.priceData || []}
                    indicatorData={chartData.indicatorSample || []}
                    symbol={chartData.symbol}
                    exchange={chartData.exchange}
                  />
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Chart Data Available</h3>
                    <p className="text-gray-600">
                      Chart data could not be loaded for this backtest run.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Trades Tab */}
            {activeTab === 'trades' && (
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exit</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PnL</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PnL %</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Close Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {trades.map((trade) => (
                        <tr key={trade.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{trade.symbol}</div>
                            <div className="text-xs text-gray-500">{trade.exchange}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">₹{trade.entry_price.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(trade.entry_time).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {trade.exit_price ? (
                              <>
                                <div className="text-sm text-gray-900">₹{trade.exit_price.toFixed(2)}</div>
                                <div className="text-xs text-gray-500">
                                  {trade.exit_time &&
                                    new Date(trade.exit_time).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm font-medium ${(trade.net_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.net_pnl ? formatCurrency(trade.net_pnl) : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm font-medium ${(trade.pnl_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trade.pnl_percent ? formatPercent(trade.pnl_percent) : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {trade.duration_minutes ? formatDuration(trade.duration_minutes) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                trade.close_reason === 'TARGET_HIT'
                                  ? 'bg-green-100 text-green-800'
                                  : trade.close_reason === 'STOP_LOSS'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {trade.close_reason?.replace(/_/g, ' ') || 'OPEN'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Run Backtest Form Modal */}
      {showRunForm && (
        <RunBacktestForm
          scalperId={scalperId}
          onClose={() => setShowRunForm(false)}
          onSuccess={() => {
            loadBacktestRuns();
          }}
        />
      )}

      {/* Comparison Modal */}
      {showComparison && (
        <BacktestComparison
          runs={backtestRuns}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
}
