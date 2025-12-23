import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Target } from 'lucide-react';
import { screenerAPI } from '../api/client';

export default function SwingScanner() {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['NSE', 'NYSE']);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    scanSwing();
  }, []);

  const scanSwing = async () => {
    try {
      setLoading(true);
      const res = await screenerAPI.scanSwing(selectedMarkets);
      setSignals(res.data.signals);
    } catch (error) {
      console.error('Error scanning swing:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(signal => {
    if (filter === 'all') return true;
    if (filter === 'buy') return signal.signal === 'BUY';
    if (filter === 'sell') return signal.signal === 'SELL';
    if (filter === 'trend') return signal.type === 'TREND_FOLLOWING';
    if (filter === 'sr') return signal.type === 'SUPPORT_RESISTANCE';
    if (filter === 'pattern') return signal.type === 'PATTERN_BREAKOUT';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
          Swing Trade Scanner
        </h1>
        <p className="text-gray-600">
          Identify multi-day trend following and pattern breakout opportunities
        </p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Market Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Markets
            </label>
            <div className="flex space-x-2">
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
                    className="mr-1"
                  />
                  <span className="text-sm text-gray-700">{market}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strategy
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Strategies</option>
              <option value="buy">Buy Only</option>
              <option value="sell">Sell Only</option>
              <option value="trend">Trend Following</option>
              <option value="sr">Support/Resistance</option>
              <option value="pattern">Pattern Breakout</option>
            </select>
          </div>

          {/* Scan Button */}
          <div className="ml-auto">
            <button
              onClick={scanSwing}
              disabled={loading}
              className="btn-primary flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Scanning...' : 'Refresh Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Signals</div>
          <div className="text-2xl font-bold text-gray-900">{filteredSignals.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Uptrends</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredSignals.filter(s => s.trend === 'UPTREND').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Downtrends</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredSignals.filter(s => s.trend === 'DOWNTREND').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Sideways</div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredSignals.filter(s => s.trend === 'SIDEWAYS').length}
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-600" />
          Swing Opportunities
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Analyzing swing opportunities...
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No signals found. Try adjusting your filters or refresh the scan.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSignals.map((signal, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-5 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-bold text-2xl text-gray-900">{signal.symbol}</span>
                        <span className={`badge ${signal.signal === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                          {signal.signal}
                        </span>
                        <span className="badge badge-info">{signal.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`badge ${
                          signal.trend === 'UPTREND' ? 'badge-success' :
                          signal.trend === 'DOWNTREND' ? 'badge-danger' :
                          'badge-warning'
                        }`}>
                          {signal.trend}
                        </span>
                        <span className="text-sm text-gray-600">Timeframe: {signal.timeframe}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Strength</div>
                    <div className="text-2xl font-bold text-primary-600">{signal.strength}%</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded">{signal.description}</p>

                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded px-3 py-2 border border-blue-200">
                    <div className="text-xs text-blue-600 mb-1">Entry Price</div>
                    <div className="text-lg font-bold text-blue-900">${signal.entry.toFixed(2)}</div>
                  </div>
                  <div className="bg-red-50 rounded px-3 py-2 border border-red-200">
                    <div className="text-xs text-red-600 mb-1">Stop Loss</div>
                    <div className="text-lg font-bold text-red-900">${signal.stopLoss.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-50 rounded px-3 py-2 border border-green-200">
                    <div className="text-xs text-green-600 mb-1">Target</div>
                    <div className="text-lg font-bold text-green-900">${signal.target.toFixed(2)}</div>
                  </div>
                  <div className="bg-purple-50 rounded px-3 py-2 border border-purple-200">
                    <div className="text-xs text-purple-600 mb-1">Risk:Reward</div>
                    <div className="text-lg font-bold text-purple-900">
                      1:{(Math.abs(signal.target - signal.entry) / Math.abs(signal.entry - signal.stopLoss)).toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <strong>Risk per share:</strong> ${Math.abs(signal.entry - signal.stopLoss).toFixed(2)}
                  </div>
                  <div>
                    <strong>Reward per share:</strong> ${Math.abs(signal.target - signal.entry).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Info */}
      <div className="mt-6 card bg-purple-50 border border-purple-200">
        <h3 className="font-semibold text-purple-900 mb-2">Swing Trade Strategy Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
          <div>
            <strong>TREND FOLLOWING:</strong> Strong directional trends confirmed by multiple EMAs and ADX.
          </div>
          <div>
            <strong>SUPPORT/RESISTANCE:</strong> Price bouncing from key levels with RSI confirmation.
          </div>
          <div>
            <strong>PATTERN BREAKOUT:</strong> Candlestick patterns indicating potential reversals or continuations.
          </div>
        </div>
      </div>
    </div>
  );
}
