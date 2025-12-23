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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Activity className="w-8 h-8 mr-3 text-green-600" />
          Intraday Scanner
        </h1>
        <p className="text-gray-600">
          Real-time detection of momentum, breakout, and gap trading opportunities
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
              Filter
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field"
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
          <div className="ml-auto">
            <button
              onClick={scanIntraday}
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
          <div className="text-sm text-gray-600 mb-1">Buy Signals</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredSignals.filter(s => s.signal === 'BUY').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Sell Signals</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredSignals.filter(s => s.signal === 'SELL').length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Avg Strength</div>
          <div className="text-2xl font-bold text-primary-600">
            {filteredSignals.length > 0
              ? Math.round(filteredSignals.reduce((sum, s) => sum + s.strength, 0) / filteredSignals.length)
              : 0}%
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          Active Signals
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Scanning for opportunities...
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No signals found. Try adjusting your filters or refresh the scan.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal, idx) => (
              <div
                key={idx}
                className={`border-l-4 ${
                  signal.signal === 'BUY' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                } rounded-r-lg p-4`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xl text-gray-900">{signal.symbol}</span>
                        <span className={`badge ${signal.signal === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                          {signal.signal}
                        </span>
                        <span className="badge badge-info">{signal.type}</span>
                        <span className="badge badge-warning">{signal.timeframe}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Strength</div>
                    <div className="text-xl font-bold text-primary-600">{signal.strength}%</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{signal.description}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-xs text-gray-600 mb-1">Entry Price</div>
                    <div className="text-lg font-bold text-gray-900">${signal.entry.toFixed(2)}</div>
                  </div>
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-xs text-gray-600 mb-1">Stop Loss</div>
                    <div className="text-lg font-bold text-red-600">${signal.stopLoss.toFixed(2)}</div>
                  </div>
                  <div className="bg-white rounded px-3 py-2">
                    <div className="text-xs text-gray-600 mb-1">Target</div>
                    <div className="text-lg font-bold text-green-600">${signal.target.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Risk: ${Math.abs(signal.entry - signal.stopLoss).toFixed(2)} |
                    Reward: ${Math.abs(signal.target - signal.entry).toFixed(2)} |
                    R:R = {(Math.abs(signal.target - signal.entry) / Math.abs(signal.entry - signal.stopLoss)).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Strategy Info */}
      <div className="mt-6 card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">Intraday Strategy Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong>MOMENTUM:</strong> Strong price movement with high volume, indicating continued direction.
          </div>
          <div>
            <strong>BREAKOUT:</strong> Price breaking above/below recent highs/lows with volume confirmation.
          </div>
          <div>
            <strong>GAP:</strong> Significant gap in opening price with follow-through movement.
          </div>
        </div>
      </div>
    </div>
  );
}
