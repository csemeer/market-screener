/**
 * Signals Hub - Unified trading signals dashboard
 * Consolidates IntradayScanner, SwingScanner, and AutoScanDashboard into one cohesive interface
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  RefreshCw,
  Filter,
  Bell,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronUp,
  XCircle,
  ListPlus,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { screenerAPI, dashboardAPI } from '../api/client';
import StockEvidenceChart from '../components/StockEvidenceChart';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type TabType = 'live-scan' | 'auto-scan' | 'screener';
type ScanType = 'intraday' | 'swing';

// Helper function to get currency symbol
const getCurrencySymbol = (currency?: 'USD' | 'INR'): string => {
  return currency === 'USD' ? '$' : '₹';
};

interface LiveScanSignal {
  symbol: string;
  exchange: string;
  company_name?: string;
  current_price: number;
  signal: 'BUY' | 'SELL';
  type: string;
  strength: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  indicators: any;
}

interface AutoScanResult {
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

export default function SignalsHub() {
  const [activeTab, setActiveTab] = useState<TabType>('auto-scan');

  // Live Scan State
  const [scanType, setScanType] = useState<ScanType>('intraday');
  const [liveScanLoading, setLiveScanLoading] = useState(false);
  const [liveScanSignals, setLiveScanSignals] = useState<LiveScanSignal[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['NSE', 'NYSE']);
  const [signalFilter, setSignalFilter] = useState<string>('all');

  // Auto Scan State
  const [autoScanLoading, setAutoScanLoading] = useState(false);
  const [autoScanResults, setAutoScanResults] = useState<Record<string, AutoScanResult[]>>({});
  const [expandedStrategies, setExpandedStrategies] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<AutoScanResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedType, setSelectedType] = useState<'ALL' | 'INTRADAY' | 'SWING'>('ALL');

  // Load data on tab or type change
  useEffect(() => {
    if (activeTab === 'live-scan') {
      loadLiveScan();
    } else if (activeTab === 'auto-scan') {
      loadAutoScan();
    }
  }, [activeTab, scanType, selectedType]);

  // Auto-refresh for auto-scan
  useEffect(() => {
    if (activeTab === 'auto-scan' && autoRefresh) {
      const interval = setInterval(() => {
        loadAutoScan(true);
      }, 120000); // 2 minutes
      return () => clearInterval(interval);
    }
  }, [activeTab, autoRefresh, selectedType]);

  const loadLiveScan = async () => {
    try {
      setLiveScanLoading(true);
      const res = scanType === 'intraday'
        ? await screenerAPI.scanIntraday(selectedMarkets)
        : await screenerAPI.scanSwing(selectedMarkets);
      setLiveScanSignals(res.data.signals || []);
    } catch (error) {
      console.error('Error loading live scan:', error);
      toast.error('❌ Failed to load live scan results');
    } finally {
      setLiveScanLoading(false);
    }
  };

  const loadAutoScan = async (silent = false) => {
    try {
      if (!silent) setAutoScanLoading(true);
      const res = await dashboardAPI.getScanResults(24, selectedType === 'ALL' ? undefined : selectedType);
      setAutoScanResults(res.data.results || {});

      // Auto-expand first 3 strategies
      const strategies = Object.keys(res.data.results || {}).slice(0, 3);
      setExpandedStrategies(new Set(strategies));
    } catch (error) {
      console.error('Error loading auto scan:', error);
      if (!silent) toast.error('❌ Failed to load auto-scan results');
    } finally {
      if (!silent) setAutoScanLoading(false);
    }
  };

  const filteredLiveScanSignals = liveScanSignals.filter(signal => {
    if (signalFilter === 'all') return true;
    if (signalFilter === 'buy') return signal.signal === 'BUY';
    if (signalFilter === 'sell') return signal.signal === 'SELL';

    // Intraday filters
    if (signalFilter === 'momentum') return signal.type === 'MOMENTUM';
    if (signalFilter === 'breakout') return signal.type === 'BREAKOUT';
    if (signalFilter === 'gap') return signal.type === 'GAP';

    // Swing filters
    if (signalFilter === 'trend') return signal.type === 'TREND_FOLLOWING';
    if (signalFilter === 'sr') return signal.type === 'SUPPORT_RESISTANCE';
    if (signalFilter === 'pattern') return signal.type === 'PATTERN_BREAKOUT';

    return true;
  });

  const totalAutoScanSignals = Object.values(autoScanResults).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
          <span>Signals Hub</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          All your trading signals in one place - live scans, automated scans, and custom screener
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            <button
              onClick={() => setActiveTab('auto-scan')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'auto-scan'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Auto Scan</span>
                <span className="sm:hidden">Auto</span>
                {totalAutoScanSignals > 0 && (
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">
                    {totalAutoScanSignals}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('live-scan')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'live-scan'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Live Scan</span>
                <span className="sm:hidden">Live</span>
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('screener');
                window.location.href = '/screener';
              }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'screener'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Custom Screener</span>
                <span className="sm:hidden">Screener</span>
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Auto Scan Tab */}
          {activeTab === 'auto-scan' && (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedType('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedType('INTRADAY')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === 'INTRADAY'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Intraday
                  </button>
                  <button
                    onClick={() => setSelectedType('SWING')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === 'SWING'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Swing
                  </button>
                </div>

                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                      autoRefresh
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Auto-Refresh {autoRefresh ? 'ON' : 'OFF'}</span>
                  </button>

                  <button
                    onClick={() => loadAutoScan()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Auto Scan Results */}
              {autoScanLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : Object.keys(autoScanResults).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No auto-scan results available</p>
                  <p className="text-sm text-gray-500 mt-1">Auto-scans run every 4 hours</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">
                        Found {totalAutoScanSignals} signals across {Object.keys(autoScanResults).length} strategies
                      </p>
                    </div>
                  </div>

                  {Object.entries(autoScanResults).map(([strategy, stocks]) => (
                    <StrategyGroup
                      key={strategy}
                      strategy={strategy}
                      stocks={stocks}
                      expanded={expandedStrategies.has(strategy)}
                      onToggle={() => {
                        const newExpanded = new Set(expandedStrategies);
                        if (newExpanded.has(strategy)) {
                          newExpanded.delete(strategy);
                        } else {
                          newExpanded.add(strategy);
                        }
                        setExpandedStrategies(newExpanded);
                      }}
                      onStockClick={setSelectedStock}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Scan Tab */}
          {activeTab === 'live-scan' && (
            <div className="space-y-6">
              {/* Scan Type Toggle */}
              <div className="flex gap-3">
                <button
                  onClick={() => setScanType('intraday')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    scanType === 'intraday'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Zap className="h-5 w-5" />
                  <span>Intraday</span>
                </button>
                <button
                  onClick={() => setScanType('swing')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    scanType === 'swing'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span>Swing</span>
                </button>
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Market Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Markets
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['NSE', 'BSE', 'NYSE', 'NASDAQ'].map((market) => (
                      <label key={market} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMarkets.includes(market)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMarkets([...selectedMarkets, market]);
                            } else {
                              setSelectedMarkets(selectedMarkets.filter(m => m !== market));
                            }
                          }}
                          className="mr-1.5"
                        />
                        <span className="text-sm text-gray-700">{market}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter
                  </label>
                  <select
                    value={signalFilter}
                    onChange={(e) => setSignalFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="all">All Signals</option>
                    <option value="buy">Buy Only</option>
                    <option value="sell">Sell Only</option>
                    {scanType === 'intraday' ? (
                      <>
                        <option value="momentum">Momentum</option>
                        <option value="breakout">Breakout</option>
                        <option value="gap">Gap</option>
                      </>
                    ) : (
                      <>
                        <option value="trend">Trend Following</option>
                        <option value="sr">Support/Resistance</option>
                        <option value="pattern">Pattern Breakout</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Scan Button */}
                <div className="flex items-end">
                  <button
                    onClick={loadLiveScan}
                    disabled={liveScanLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${liveScanLoading ? 'animate-spin' : ''}`} />
                    <span>{liveScanLoading ? 'Scanning...' : 'Scan Now'}</span>
                  </button>
                </div>
              </div>

              {/* Live Scan Results */}
              {liveScanLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
                </div>
              ) : filteredLiveScanSignals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No signals found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or markets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-green-900">
                      Found {filteredLiveScanSignals.length} {scanType} signals
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLiveScanSignals.map((signal, index) => (
                      <LiveSignalCard key={index} signal={signal} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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

// Strategy Group Component
function StrategyGroup({
  strategy,
  stocks,
  expanded,
  onToggle,
  onStockClick,
}: {
  strategy: string;
  stocks: AutoScanResult[];
  expanded: boolean;
  onToggle: () => void;
  onStockClick: (stock: AutoScanResult) => void;
}) {
  const avgConfidence = stocks.reduce((sum, s) => sum + s.confidence_score, 0) / stocks.length;
  const strategyType = stocks[0]?.strategy_type || 'SWING';

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-1 h-12 rounded-full ${
            strategyType === 'INTRADAY' ? 'bg-orange-500' :
            strategyType === 'SWING' ? 'bg-blue-500' : 'bg-green-500'
          }`} />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{strategy}</h3>
            <p className="text-sm text-gray-600">
              {stocks.length} signals • Avg confidence: {avgConfidence.toFixed(0)}%
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stocks.map((stock) => (
              <AutoScanCard key={stock.id} stock={stock} onClick={() => onStockClick(stock)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Auto Scan Card Component
function AutoScanCard({ stock, onClick }: { stock: AutoScanResult; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-900">{stock.symbol}</h4>
          <p className="text-xs text-gray-600">{stock.exchange}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          stock.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
          stock.confidence_score >= 70 ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {stock.confidence_score}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-600">Entry</p>
          <p className="font-semibold text-blue-700">{getCurrencySymbol(stock.currency)}{stock.entry_price.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Target</p>
          <p className="font-semibold text-green-700">{getCurrencySymbol(stock.currency)}{stock.target.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">R:R</p>
          <p className="font-semibold text-purple-700">{stock.risk_reward_ratio.toFixed(1)}:1</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {new Date(stock.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <Eye className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

// Live Signal Card Component
function LiveSignalCard({ signal }: { signal: LiveScanSignal }) {
  const profitPct = ((signal.target - signal.entryPrice) / signal.entryPrice * 100).toFixed(2);
  const lossPct = ((signal.stopLoss - signal.entryPrice) / signal.entryPrice * 100).toFixed(2);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-lg text-gray-900">{signal.symbol}</h4>
          <p className="text-sm text-gray-600">{signal.exchange} • {signal.type}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
          signal.signal === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {signal.signal}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs text-blue-700 font-medium">Entry</p>
          <p className="text-lg font-bold text-blue-900">${signal.entryPrice.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded p-2">
          <p className="text-xs text-purple-700 font-medium">Strength</p>
          <p className="text-lg font-bold text-purple-900">{signal.strength}/100</p>
        </div>
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs text-green-700 font-medium">Target</p>
          <p className="text-sm font-bold text-green-900">${signal.target.toFixed(2)} (+{profitPct}%)</p>
        </div>
        <div className="bg-red-50 rounded p-2">
          <p className="text-xs text-red-700 font-medium">Stop Loss</p>
          <p className="text-sm font-bold text-red-900">${signal.stopLoss.toFixed(2)} ({lossPct}%)</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">R:R {signal.riskReward.toFixed(1)}:1</span>
        <span className="text-xs text-gray-500">${signal.current_price.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Stock Evidence Modal Component (reused from AutoScanDashboard)
function StockEvidenceModal({ stock, onClose }: { stock: AutoScanResult; onClose: () => void }) {
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  let chartData: any = { currency: stock.currency };
  let signals: string[] = [];

  try {
    const parsedChartData = JSON.parse(stock.evidence_chart_data || '{}');
    chartData = { ...parsedChartData, currency: stock.currency };
    signals = JSON.parse(stock.signals || '[]');
  } catch (error) {
    console.error('Error parsing stock data:', error);
  }

  const addToWatchlist = async () => {
    try {
      setAddingToWatchlist(true);

      // Step 1: Get or create "Auto-Scan Signals" watchlist
      const watchlistsRes = await axios.get(`${API_BASE_URL}/api/watchlist`);
      let watchlist = watchlistsRes.data.find((w: any) => w.name === 'Auto-Scan Signals (Legacy)');

      // If no auto-scan watchlist exists, create one
      if (!watchlist) {
        const createRes = await axios.post(`${API_BASE_URL}/api/watchlist`, {
          name: 'Auto-Scan Signals (Legacy)',
          description: 'Automatically generated from Signals Hub',
        });
        watchlist = createRes.data.watchlist;
      }

      // Step 2: Add stock to the watchlist using the new unified endpoint
      await axios.post(`${API_BASE_URL}/api/watchlist/${watchlist.id}/stocks/from-scan/${stock.id}`, {});

      toast.success(`✅ ${stock.symbol} added to watchlist!`);
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add to watchlist';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setAddingToWatchlist(false);
    }
  };

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
            >
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${
              stock.confidence_score >= 80 ? 'bg-green-100 text-green-800' :
              stock.confidence_score >= 70 ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              Confidence: {stock.confidence_score}
            </span>
            <span className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 truncate max-w-full">
              {stock.strategy}
            </span>
            <button
              onClick={addToWatchlist}
              disabled={addingToWatchlist}
              className="ml-auto flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-md"
            >
              <ListPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{addingToWatchlist ? 'Adding...' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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

          {/* Signals */}
          {signals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Signals</h3>
              <div className="flex flex-wrap gap-2">
                {signals.map((signal, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
