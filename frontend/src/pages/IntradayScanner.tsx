import { useState, useEffect } from 'react';
import { Activity, RefreshCw, Zap } from 'lucide-react';
import { screenerAPI } from '../api/client';

export default function IntradayScanner() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['NSE', 'NYSE']);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    scanIntraday();
  }, []);

  const scanIntraday = async () => {
    try {
      setLoading(true);
      const res = await screenerAPI.scanIntraday(selectedMarkets);
      setSignals(res.data.signals);
    } catch (error) {
      console.error('Error scanning intraday:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true;
    if (filter === 'buy') return signal.signal === 'BUY';
    if (filter === 'sell') return signal.signal === 'SELL';
    if (filter === 'momentum') return signal.type === 'MOMENTUM';
    if (filter === 'breakout') return signal.type === 'BREAKOUT';
    if (filter === 'gap') return signal.type === 'GAP';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2 sm:gap-3">
          <Activity className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
          <span className="truncate">Intraday Scanner</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Real-time detection of momentum, breakout, and gap trading opportunities
        </p>
      </div>

      {/* Controls */}
      <div className="card mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Market Selection */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Markets
            </label>
            <div className="flex flex-wrap gap-2">
              {['NSE', 'BSE', 'NYSE', 'NASDAQ'].map((market) => (
                <label key={market} className="flex items-center whitespace-nowrap">
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
                  <span className="text-xs sm:text-sm text-gray-700">{market}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="flex-1 min-w-0 sm:min-w-[180px]">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-full text-sm"
            >
              <option value="all">All Signals</option>
              <option value="buy">Buy Only</option>
              <option value="sell">Sell Only</option>
              <option value="momentum">Momentum</option>
              <option value="breakout">Breakout</option>
              <option value="gap">Gap</option>
            </select>
          </div>

          {/* Scan Button */}
          <div className="sm:ml-auto">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 invisible">
              Action
            </label>
            <button
              onClick={scanIntraday}
              disabled={loading}
              className="btn-primary flex items-center justify-center w-full sm:w-auto px-4 py-2"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm">{loading ? 'Scanning...' : 'Refresh Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Total Signals</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{filteredSignals.length}</div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Buy Signals</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">
            {filteredSignals.filter(s => s.signal === 'BUY').length}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Sell Signals</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">
            {filteredSignals.filter(s => s.signal === 'SELL').length}
          </div>
        </div>
        <div className="card p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600 mb-1">Avg Strength</div>
          <div className="text-xl sm:text-2xl font-bold text-primary-600">
            {filteredSignals.length > 0
              ? Math.round(filteredSignals.reduce((sum, s) => sum + s.strength, 0) / filteredSignals.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="card p-3 sm:p-4 md:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
          <span>Active Signals</span>
        </h2>

        {loading ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
            Scanning for opportunities...
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
            No signals found. Try adjusting your filters or refresh the scan.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredSignals.map((signal, idx) => (
              <div
                key={idx}
                className={`border-l-4 ${
                  signal.signal === 'BUY' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                } rounded-r-lg p-3 sm:p-4 transition-all hover:shadow-md active:scale-[0.99]`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                      <span className="font-bold text-lg sm:text-xl text-gray-900 whitespace-nowrap">{signal.symbol}</span>
                      <span className={`badge ${signal.signal === 'BUY' ? 'badge-success' : 'badge-danger'} text-xs whitespace-nowrap`}>
                        {signal.signal}
                      </span>
                      <span className="badge badge-info text-xs whitespace-nowrap">{signal.type}</span>
                      <span className="badge badge-warning text-xs whitespace-nowrap">{signal.timeframe}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-xs sm:text-sm text-gray-600">Strength</div>
                    <div className="text-lg sm:text-xl font-bold text-primary-600">{signal.strength}%</div>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-gray-700 mb-3">{signal.description}</p>

                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  <div className="bg-white rounded px-2 sm:px-3 py-2">
                    <div className="text-xs text-gray-600 mb-0.5 sm:mb-1">Entry</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">${signal.entry.toFixed(2)}</div>
                  </div>
                  <div className="bg-white rounded px-2 sm:px-3 py-2">
                    <div className="text-xs text-gray-600 mb-0.5 sm:mb-1">Stop</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-red-600 truncate">${signal.stopLoss.toFixed(2)}</div>
                  </div>
                  <div className="bg-white rounded px-2 sm:px-3 py-2">
                    <div className="text-xs text-gray-600 mb-0.5 sm:mb-1">Target</div>
                    <div className="text-sm sm:text-base md:text-lg font-bold text-green-600 truncate">${signal.target.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 text-xs sm:text-sm">
                  <div className="text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="whitespace-nowrap">Risk: ${Math.abs(signal.entry - signal.stopLoss).toFixed(2)}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="whitespace-nowrap">Reward: ${Math.abs(signal.target - signal.entry).toFixed(2)}</span>
                    <span className="hidden sm:inline">|</span>
                    <span className="whitespace-nowrap">R:R = {(Math.abs(signal.target - signal.entry) / Math.abs(signal.entry - signal.stopLoss)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Info */}
      <div className="mt-4 sm:mt-6 card bg-blue-50 border border-blue-200 p-3 sm:p-4 md:p-6">
        <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2 sm:mb-3">Intraday Strategy Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-blue-800">
          <div className="bg-white bg-opacity-50 rounded p-2 sm:p-3">
            <strong className="block mb-1">MOMENTUM:</strong>
            <span>Strong price movement with high volume, indicating continued direction.</span>
          </div>
          <div className="bg-white bg-opacity-50 rounded p-2 sm:p-3">
            <strong className="block mb-1">BREAKOUT:</strong>
            <span>Price breaking above/below recent highs/lows with volume confirmation.</span>
          </div>
          <div className="bg-white bg-opacity-50 rounded p-2 sm:p-3">
            <strong className="block mb-1">GAP:</strong>
            <span>Significant gap in opening price with follow-through movement.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
