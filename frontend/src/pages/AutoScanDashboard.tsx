/**
 * Auto-Scan Dashboard - Real-time view of automated stock scans
 * Displays results grouped by strategy with evidence charts
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Filter,
  Bell,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from 'lucide-react';
import { dashboardAPI } from '../api/client';
import StockEvidenceChart from '../components/StockEvidenceChart';

interface ScanResult {
  id: number;
  symbol: string;
  exchange: string;
  company_name: string;
  currency: 'USD' | 'INR';
  current_price: number;
  entry_price: number;
  stop_loss: number;
  target: number;
  risk_reward_ratio: number;
  confidence_score: number;
  signals: string;
  technical_data: string;
  evidence_chart_data: string;
  timestamp: string;
  strategy: string;
  strategy_type: 'INTRADAY' | 'SWING' | 'LONG_TERM';
}

interface StrategyPerformance {
  totalSignals: number;
  activeSignals: number;
  completedSignals: number;
  winRate: number;
  averageReturn: number;
  totalProfit: number;
}

interface Alert {
  id: number;
  timestamp: string;
  symbol: string;
  strategy: string;
  alert_type: string;
  message: string;
  priority: string;
  read: boolean;
}

// Helper function to get currency symbol
const getCurrencySymbol = (currency: 'USD' | 'INR'): string => {
  return currency === 'USD' ? '$' : '₹';
};

export default function AutoScanDashboard() {
  const [scanResults, setScanResults] = useState<Record<string, ScanResult[]>>({});
  const [performance, setPerformance] = useState<Record<string, StrategyPerformance>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'ALL' | 'INTRADAY' | 'SWING'>('ALL');
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<ScanResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 2 minutes if enabled
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadDashboardData(true);
      }, 120000); // 2 minutes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedType, autoRefresh]);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const [resultsRes] = await Promise.all([
        dashboardAPI.getScanResults(24, selectedType === 'ALL' ? undefined : selectedType),
      ]);

      setScanResults(resultsRes.data.results || {});
      setPerformance(resultsRes.data.performance || {});
      setAlerts(resultsRes.data.alerts || []);

      // Auto-expand first 3 strategies
      const strategies = Object.keys(resultsRes.data.results || {}).slice(0, 3);
      setExpandedStrategies(new Set(strategies));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const toggleStrategy = (strategy: string) => {
    const newExpanded = new Set(expandedStrategies);
    if (newExpanded.has(strategy)) {
      newExpanded.delete(strategy);
    } else {
      newExpanded.add(strategy);
    }
    setExpandedStrategies(newExpanded);
  };

  const getStrategyIcon = (strategyName: string) => {
    if (strategyName.includes('Momentum') || strategyName.includes('Breakout')) {
      return <TrendingUp className="h-5 w-5" />;
    } else if (strategyName.includes('Support') || strategyName.includes('Pullback')) {
      return <Target className="h-5 w-5" />;
    } else if (strategyName.includes('Scalping') || strategyName.includes('Gap')) {
      return <Activity className="h-5 w-5" />;
    }
    return <BarChart3 className="h-5 w-5" />;
  };

  const getStrategyColor = (strategyType: string) => {
    switch (strategyType) {
      case 'INTRADAY':
        return 'border-l-4 border-orange-500 bg-orange-50';
      case 'SWING':
        return 'border-l-4 border-blue-500 bg-blue-50';
      default:
        return 'border-l-4 border-green-500 bg-green-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const totalActiveSignals = Object.values(scanResults).reduce((sum, arr) => sum + arr.length, 0);
  const unreadAlerts = alerts.filter(a => !a.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading auto-scan dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <span className="truncate">Auto-Scan Dashboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
              Real-time automated stock scanning with {Object.keys(scanResults).length} active strategies
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg border transition-all text-xs sm:text-sm ${
                autoRefresh
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-300 text-gray-700'
              }`}
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}</span>
              <span className="sm:hidden">{autoRefresh ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => loadDashboardData()}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs sm:text-sm"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Refresh Now</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Active Signals</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalActiveSignals}</p>
              </div>
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Active Strategies</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{Object.keys(scanResults).length}</p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Unread Alerts</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{unreadAlerts}</p>
              </div>
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Last Updated</p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          {['ALL', 'INTRADAY', 'SWING'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type as any)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm ${
                selectedType === type
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Panel */}
      {unreadAlerts > 0 && (
        <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">
                {unreadAlerts} New Alert{unreadAlerts > 1 ? 's' : ''}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {alerts.filter(a => !a.read).slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-2 p-2 rounded border ${getPriorityColor(alert.priority)}`}
                  >
                    <Bell className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(alert.timestamp).toLocaleString()} • {alert.strategy}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Results */}
      <div className="space-y-4">
        {Object.entries(scanResults).length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No active signals found. Auto-scan is running...</p>
            <p className="text-sm text-gray-500 mt-2">Signals will appear here as they are detected.</p>
          </div>
        ) : (
          Object.entries(scanResults).map(([strategy, stocks]) => {
            const isExpanded = expandedStrategies.has(strategy);
            const perf = performance[strategy] || {};
            const strategyType = stocks[0]?.strategy_type || 'INTRADAY';

            return (
              <div
                key={strategy}
                className={`bg-white rounded-lg shadow-sm border overflow-hidden ${getStrategyColor(strategyType)}`}
              >
                {/* Strategy Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-all"
                  onClick={() => toggleStrategy(strategy)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        {getStrategyIcon(strategy)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{strategy}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {stocks.length} signals
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Win Rate: {perf.winRate?.toFixed(1) || 0}%
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            strategyType === 'INTRADAY' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {strategyType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {perf.totalProfit !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total P&L</p>
                          <p className={`text-lg font-bold ${
                            perf.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {perf.totalProfit >= 0 ? '+' : ''}{perf.totalProfit.toFixed(2)}%
                          </p>
                        </div>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Cards */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {stocks.map(stock => (
                        <StockSignalCard
                          key={stock.id}
                          stock={stock}
                          onClick={() => setSelectedStock(stock)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stock Evidence Modal */}
      {selectedStock && (
        <StockEvidenceModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
}

// Stock Signal Card Component
function StockSignalCard({ stock, onClick }: { stock: ScanResult; onClick: () => void }) {
  const signals = JSON.parse(stock.signals || '[]');
  const profitPotential = ((stock.target - stock.entry_price) / stock.entry_price) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
         onClick={onClick}>
      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base sm:text-lg text-gray-900 truncate">{stock.symbol}</h4>
          <p className="text-xs sm:text-sm text-gray-600 truncate">{stock.company_name || stock.exchange}</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs font-bold whitespace-nowrap ${
            stock.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
            stock.confidence_score >= 70 ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {stock.confidence_score}
          </span>
          <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div>
          <p className="text-xs text-gray-600">Entry</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{getCurrencySymbol(stock.currency)}{stock.entry_price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Current</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{getCurrencySymbol(stock.currency)}{stock.current_price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Target</p>
          <p className="text-sm font-semibold text-green-600 truncate">{getCurrencySymbol(stock.currency)}{stock.target.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Stop</p>
          <p className="text-sm font-semibold text-red-600 truncate">{getCurrencySymbol(stock.currency)}{stock.stop_loss.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 gap-2">
        <div className="text-xs sm:text-sm min-w-0">
          <span className="text-gray-600">Profit:</span>
          <span className="ml-1 font-bold text-green-600">+{profitPotential.toFixed(1)}%</span>
        </div>
        <div className="text-xs sm:text-sm flex-shrink-0">
          <span className="text-gray-600">R:R</span>
          <span className="ml-1 font-bold text-blue-600">{stock.risk_reward_ratio.toFixed(1)}</span>
        </div>
      </div>

      {signals.length > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {signals.slice(0, 3).map((signal: string, idx: number) => (
              <span key={idx} className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-50 text-blue-700 rounded truncate">
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stock Evidence Modal Component
function StockEvidenceModal({ stock, onClose }: { stock: ScanResult; onClose: () => void }) {
  let chartData: any = { currency: stock.currency };
  let technicalData: any = {};
  let signals: string[] = [];
  let parseError: string | null = null;

  try {
    // Parse evidence chart data
    const parsedChartData = JSON.parse(stock.evidence_chart_data || '{}');
    console.log('📊 Parsed chart data:', parsedChartData);
    chartData = { ...parsedChartData, currency: stock.currency };

    // Verify chart data structure
    if (!chartData.historicalPrices || chartData.historicalPrices.length === 0) {
      console.warn('⚠️ No historical prices in chart data');
    }

    // Parse technical data
    technicalData = JSON.parse(stock.technical_data || '{}');

    // Parse signals
    signals = JSON.parse(stock.signals || '[]');
  } catch (error) {
    console.error('❌ Error parsing stock data:', error);
    parseError = error instanceof Error ? error.message : 'Unknown error';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-2xl w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 z-10 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stock.symbol}</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">{stock.company_name || stock.exchange}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all flex-shrink-0"
              aria-label="Close"
            >
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap ${
              stock.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
              stock.confidence_score >= 70 ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              Confidence: {stock.confidence_score}
            </span>
            <span className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 truncate max-w-full">
              {stock.strategy}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Message */}
          {parseError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-semibold">Error loading stock data</p>
              <p className="text-red-600 text-sm mt-1">{parseError}</p>
              <p className="text-red-600 text-sm mt-2">Please check the browser console for more details.</p>
            </div>
          )}

          {/* Price Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
              <p className="text-xs sm:text-sm text-blue-700 font-medium mb-1">Entry Price</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{getCurrencySymbol(stock.currency)}{stock.entry_price.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
              <p className="text-xs sm:text-sm text-green-700 font-medium mb-1">Target</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">{getCurrencySymbol(stock.currency)}{stock.target.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">
                +{(((stock.target - stock.entry_price) / stock.entry_price) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
              <p className="text-xs sm:text-sm text-red-700 font-medium mb-1">Stop Loss</p>
              <p className="text-xl sm:text-2xl font-bold text-red-900">{getCurrencySymbol(stock.currency)}{stock.stop_loss.toFixed(2)}</p>
              <p className="text-xs text-red-600 mt-1">
                {(((stock.stop_loss - stock.entry_price) / stock.entry_price) * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Evidence Chart */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Technical Evidence Chart
            </h3>
            <StockEvidenceChart data={chartData} />
          </div>

          {/* Risk/Reward Analysis */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Risk/Reward Analysis
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Risk/Reward Ratio</p>
                <p className="text-2xl font-bold text-purple-900">{stock.risk_reward_ratio.toFixed(2)}:1</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Potential Profit</p>
                <p className="text-2xl font-bold text-green-600">
                  +{(((stock.target - stock.entry_price) / stock.entry_price) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Potential Loss</p>
                <p className="text-2xl font-bold text-red-600">
                  {(((stock.stop_loss - stock.entry_price) / stock.entry_price) * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Confidence</p>
                <p className={`text-2xl font-bold ${
                  stock.confidence_score >= 80 ? 'text-green-600' :
                  stock.confidence_score >= 70 ? 'text-blue-600' : 'text-yellow-600'
                }`}>
                  {stock.confidence_score}/100
                </p>
              </div>
            </div>
          </div>

          {/* Trend Analysis */}
          {chartData.analysis?.trendDirection && (
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Trend Analysis
              </h3>
              <div className="flex items-center gap-4">
                <div className={`flex-1 rounded-lg p-4 ${
                  chartData.analysis.trendDirection === 'UPTREND' ? 'bg-green-50 border-2 border-green-500' :
                  chartData.analysis.trendDirection === 'DOWNTREND' ? 'bg-red-50 border-2 border-red-500' :
                  'bg-gray-50 border-2 border-gray-300'
                }`}>
                  <p className="text-sm text-gray-600 mb-1">Trend Direction</p>
                  <p className={`text-xl font-bold ${
                    chartData.analysis.trendDirection === 'UPTREND' ? 'text-green-700' :
                    chartData.analysis.trendDirection === 'DOWNTREND' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {chartData.analysis.trendDirection === 'UPTREND' && '📈 Strong Uptrend'}
                    {chartData.analysis.trendDirection === 'DOWNTREND' && '📉 Strong Downtrend'}
                    {chartData.analysis.trendDirection === 'SIDEWAYS' && '↔️ Sideways/Consolidation'}
                    {chartData.analysis.trendDirection === 'UNKNOWN' && '❓ Trend Unclear'}
                  </p>
                </div>
                {chartData.analysis.confluenceScore > 0 && (
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-600 mb-1">Confluence Score</p>
                    <p className="text-3xl font-bold text-blue-600">{chartData.analysis.confluenceScore}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Indicators - Enhanced Grid */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Technical Indicators
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Momentum Indicators */}
              {technicalData.rsi && (
                <div className={`rounded-lg p-3 border-2 ${
                  technicalData.rsi > 70 ? 'bg-red-50 border-red-200' :
                  technicalData.rsi < 30 ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">RSI (14)</p>
                  <p className="text-lg font-bold text-gray-900">{technicalData.rsi.toFixed(2)}</p>
                  <p className="text-xs mt-1 text-gray-500">
                    {technicalData.rsi > 70 ? 'Overbought' :
                     technicalData.rsi < 30 ? 'Oversold' : 'Neutral'}
                  </p>
                </div>
              )}

              {technicalData.macd && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">MACD</p>
                  <p className="text-lg font-bold text-gray-900">
                    {technicalData.macd.macd ? technicalData.macd.macd.toFixed(2) : 'N/A'}
                  </p>
                  <p className="text-xs mt-1">
                    {(technicalData.macd.macd || 0) > (technicalData.macd.signal || 0) ?
                      '🟢 Bullish' : '🔴 Bearish'}
                  </p>
                </div>
              )}

              {technicalData.adx && (
                <div className={`rounded-lg p-3 border-2 ${
                  technicalData.adx > 25 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-xs text-gray-600 mb-1">ADX</p>
                  <p className="text-lg font-bold text-gray-900">{technicalData.adx.toFixed(2)}</p>
                  <p className="text-xs mt-1 text-gray-500">
                    {technicalData.adx > 25 ? 'Strong Trend' : 'Weak Trend'}
                  </p>
                </div>
              )}

              {technicalData.atr && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">ATR (14)</p>
                  <p className="text-lg font-bold text-gray-900">{technicalData.atr.toFixed(2)}</p>
                  <p className="text-xs mt-1 text-gray-500">Volatility</p>
                </div>
              )}

              {/* Moving Averages */}
              {chartData.indicators?.ema20 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs text-gray-600 mb-1">EMA 20</p>
                  <p className="text-lg font-bold text-gray-900">
                    {getCurrencySymbol(stock.currency)}{chartData.indicators.ema20.toFixed(2)}
                  </p>
                </div>
              )}

              {chartData.indicators?.ema50 && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-gray-600 mb-1">EMA 50</p>
                  <p className="text-lg font-bold text-gray-900">
                    {getCurrencySymbol(stock.currency)}{chartData.indicators.ema50.toFixed(2)}
                  </p>
                </div>
              )}

              {chartData.indicators?.ema200 && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">EMA 200</p>
                  <p className="text-lg font-bold text-gray-900">
                    {getCurrencySymbol(stock.currency)}{chartData.indicators.ema200.toFixed(2)}
                  </p>
                  <p className="text-xs mt-1">
                    {stock.current_price > chartData.indicators.ema200 ? '🟢 Above' : '🔴 Below'}
                  </p>
                </div>
              )}

              {/* Bollinger Bands */}
              {technicalData.bollingerBands && (
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <p className="text-xs text-gray-600 mb-1">Bollinger Bands</p>
                  <p className="text-xs text-gray-700">
                    Upper: {getCurrencySymbol(stock.currency)}{technicalData.bollingerBands.upper?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-700">
                    Lower: {getCurrencySymbol(stock.currency)}{technicalData.bollingerBands.lower?.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Volume */}
              {chartData.analysis?.volumeAnalysis && (
                <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                  <p className="text-xs text-gray-600 mb-1">Volume Ratio</p>
                  <p className="text-lg font-bold text-gray-900">
                    {chartData.analysis.volumeAnalysis.volumeRatio?.toFixed(2)}x
                  </p>
                  <p className="text-xs mt-1 text-gray-500">vs Avg</p>
                </div>
              )}
            </div>
          </div>

          {/* Pattern Recognition */}
          {chartData.analysis?.patterns && chartData.analysis.patterns.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Candlestick Patterns Detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {chartData.analysis.patterns.map((pattern: string, idx: number) => (
                  <span key={idx} className="px-3 py-2 bg-white border-2 border-amber-300 text-amber-800 rounded-lg text-sm font-semibold">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Signals */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Buy Signals</h3>
            <div className="flex flex-wrap gap-2">
              {signals.map((signal: string, idx: number) => (
                <span key={idx} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {signal}
                </span>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
            Signal generated: {new Date(stock.timestamp).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
