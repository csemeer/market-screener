/**
 * EOD Dashboard - End-of-Day Analysis and Watchlist Management
 * Displays EOD scan results, watchlists, and trading setups for next-day execution
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface WatchlistStock {
  id: number;
  symbol: string;
  company_name: string;
  exchange: string;
  currency: 'USD' | 'INR';
  setup_type: 'BREAKOUT' | 'BREAKDOWN' | 'PULLBACK' | 'REVERSAL' | 'CONSOLIDATION';
  timeframe: 'INTRADAY' | 'SWING' | 'POSITIONAL';
  score: number;
  entry_price: number;
  entry_trigger?: number;
  entry_condition?: string;
  stop_loss: number;
  target_1: number;
  target_2?: number;
  target_3?: number;
  trailing_stop_percent?: number;
  risk_reward_ratio: number;
  position_size_percent?: number;
  max_loss_amount?: number;
  status: 'PENDING' | 'TRIGGERED' | 'ENTERED' | 'EXITED' | 'CANCELLED' | 'EXPIRED';
  technical_data?: string;
  signals?: string;
  chart_patterns?: string;
  setup_notes?: string;
  created_at: string;
}

interface Watchlist {
  id: number;
  date: string;
  exchange: string;
  scan_timestamp: string;
  total_stocks_analyzed: number;
  stocks_selected: number;
  notes?: string;
}

interface ScannerStatus {
  isScanning: boolean;
  lastScanDate: string | null;
}

const EODDashboard: React.FC = () => {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Filters
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [selectedSetupType, setSelectedSetupType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [minScore, setMinScore] = useState<number>(0);

  // Fetch latest watchlist
  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/eod/watchlist`);
      const data = await response.json();

      if (data.success && data.watchlist) {
        setWatchlist(data.watchlist);
        setStocks(data.stocks || []);
        setFilteredStocks(data.stocks || []);
      } else {
        setWatchlist(null);
        setStocks([]);
        setFilteredStocks([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch watchlist');
      console.error('Error fetching watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch scanner status
  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/eod/status`);
      const data = await response.json();
      if (data.success) {
        setScannerStatus(data);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    }
  };

  // Trigger EOD scan
  const triggerScan = async () => {
    try {
      setIsScanning(true);
      const response = await fetch(`${API_BASE_URL}/api/eod/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchanges: ['NSE', 'BSE', 'NYSE', 'NASDAQ'],
          minScore: 70,
          maxStocks: 20,
          lookbackDays: 50,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('EOD scan started! Refresh in a few minutes to see results.');
        setTimeout(() => {
          fetchWatchlist();
          fetchStatus();
        }, 3000);
      } else {
        alert('Failed to start EOD scan: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error triggering scan: ' + err);
    } finally {
      setIsScanning(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = stocks;

    if (selectedTimeframe !== 'ALL') {
      filtered = filtered.filter(s => s.timeframe === selectedTimeframe);
    }

    if (selectedSetupType !== 'ALL') {
      filtered = filtered.filter(s => s.setup_type === selectedSetupType);
    }

    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(s => s.status === selectedStatus);
    }

    if (minScore > 0) {
      filtered = filtered.filter(s => s.score >= minScore);
    }

    setFilteredStocks(filtered);
  }, [stocks, selectedTimeframe, selectedSetupType, selectedStatus, minScore]);

  // Initial load
  useEffect(() => {
    fetchWatchlist();
    fetchStatus();

    // Refresh every 30 seconds during market hours
    const interval = setInterval(() => {
      fetchWatchlist();
      fetchStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getCurrencySymbol = (currency: 'USD' | 'INR'): string => {
    return currency === 'USD' ? '$' : '₹';
  };

  const getSetupColor = (setupType: string): string => {
    switch (setupType) {
      case 'BREAKOUT': return 'bg-green-100 text-green-800';
      case 'BREAKDOWN': return 'bg-red-100 text-red-800';
      case 'PULLBACK': return 'bg-blue-100 text-blue-800';
      case 'REVERSAL': return 'bg-purple-100 text-purple-800';
      case 'CONSOLIDATION': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-700';
      case 'TRIGGERED': return 'bg-yellow-100 text-yellow-700';
      case 'ENTERED': return 'bg-blue-100 text-blue-700';
      case 'EXITED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'EXPIRED': return 'bg-gray-100 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 font-bold';
    if (score >= 75) return 'text-blue-600 font-semibold';
    if (score >= 65) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading && !watchlist) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-600">Loading EOD Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">EOD Trading Dashboard</h1>
              <p className="text-gray-600">
                End-of-Day analysis and next-day trading setups
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={triggerScan}
                disabled={isScanning}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  isScanning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isScanning ? 'Scanning...' : 'Run EOD Scan'}
              </button>

              {scannerStatus?.lastScanDate && (
                <p className="text-sm text-gray-500 text-center">
                  Last scan: {new Date(scannerStatus.lastScanDate).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Watchlist Summary */}
      {watchlist && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Watchlist Date</p>
              <p className="text-2xl font-bold text-gray-800">
                {new Date(watchlist.date).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Stocks Analyzed</p>
              <p className="text-2xl font-bold text-blue-600">
                {watchlist.total_stocks_analyzed || 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Top Setups Found</p>
              <p className="text-2xl font-bold text-green-600">
                {watchlist.stocks_selected || stocks.length}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-600">Primary Exchange</p>
              <p className="text-2xl font-bold text-purple-600">
                {watchlist.exchange}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Timeframe Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Timeframes</option>
                <option value="INTRADAY">Intraday</option>
                <option value="SWING">Swing</option>
                <option value="POSITIONAL">Positional</option>
              </select>
            </div>

            {/* Setup Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setup Type
              </label>
              <select
                value={selectedSetupType}
                onChange={(e) => setSelectedSetupType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Setups</option>
                <option value="BREAKOUT">Breakout</option>
                <option value="BREAKDOWN">Breakdown</option>
                <option value="PULLBACK">Pullback</option>
                <option value="REVERSAL">Reversal</option>
                <option value="CONSOLIDATION">Consolidation</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="TRIGGERED">Triggered</option>
                <option value="ENTERED">Entered</option>
                <option value="EXITED">Exited</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Score Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Score: {minScore}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Cards */}
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!watchlist && !loading && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-800 text-lg mb-4">
              No watchlist found. Run an EOD scan to generate today's watchlist.
            </p>
            <button
              onClick={triggerScan}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Run EOD Scan Now
            </button>
          </div>
        )}

        {filteredStocks.length === 0 && watchlist && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">No stocks match your filter criteria.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStocks.map((stock) => (
            <div
              key={stock.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{stock.symbol}</h3>
                  <p className="text-sm text-gray-600">{stock.exchange}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getScoreColor(stock.score)}`}>
                    Score: {stock.score}
                  </span>
                </div>
              </div>

              {/* Setup Info */}
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSetupColor(stock.setup_type)}`}>
                  {stock.setup_type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                  {stock.timeframe}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(stock.status)}`}>
                  {stock.status}
                </span>
              </div>

              {/* Price Levels */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Entry:</span>
                  <span className="font-semibold text-blue-600">
                    {getCurrencySymbol(stock.currency)}{stock.entry_price.toFixed(2)}
                  </span>
                </div>

                {stock.entry_trigger && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Trigger:</span>
                    <span className="font-semibold text-purple-600">
                      {getCurrencySymbol(stock.currency)}{stock.entry_trigger.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Stop Loss:</span>
                  <span className="font-semibold text-red-600">
                    {getCurrencySymbol(stock.currency)}{stock.stop_loss.toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Target 1:</span>
                    <span className="font-semibold text-green-600">
                      {getCurrencySymbol(stock.currency)}{stock.target_1.toFixed(2)}
                    </span>
                  </div>

                  {stock.target_2 && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Target 2:</span>
                      <span className="font-semibold text-green-600">
                        {getCurrencySymbol(stock.currency)}{stock.target_2.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {stock.target_3 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Target 3:</span>
                      <span className="font-semibold text-green-600">
                        {getCurrencySymbol(stock.currency)}{stock.target_3.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk/Reward */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">R:R Ratio:</span>
                  <span className="font-bold text-indigo-600">
                    1:{stock.risk_reward_ratio.toFixed(2)}
                  </span>
                </div>

                {stock.position_size_percent && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Position Size:</span>
                    <span className="font-semibold text-gray-700">
                      {stock.position_size_percent.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Setup Notes */}
              {stock.setup_notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-700">{stock.setup_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EODDashboard;
