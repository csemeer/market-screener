import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';
import { screenerAPI } from '../api/client';

export default function Dashboard() {
  const [intradaySignals, setIntradaySignals] = useState<any[]>([]);
  const [swingSignals, setSwingSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [intradayRes, swingRes] = await Promise.all([
        screenerAPI.scanIntraday(['NSE', 'NYSE']),
        screenerAPI.scanSwing(['NSE', 'NYSE']),
      ]);

      setIntradaySignals(intradayRes.data.signals.slice(0, 5));
      setSwingSignals(swingRes.data.signals.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Market Screener Pro
        </h1>
        <p className="text-gray-600">
          Advanced stock screening and analysis for Indian (NSE/BSE) and US (NYSE/NASDAQ) markets
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Markets Covered</p>
              <p className="text-2xl font-bold text-gray-900">4</p>
            </div>
            <BarChart3 className="w-10 h-10 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Intraday Signals</p>
              <p className="text-2xl font-bold text-green-600">{intradaySignals.length}</p>
            </div>
            <Activity className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Swing Signals</p>
              <p className="text-2xl font-bold text-blue-600">{swingSignals.length}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Technical Indicators</p>
              <p className="text-2xl font-bold text-purple-600">15+</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Intraday Signals */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Top Intraday Signals
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading signals...</div>
          ) : intradaySignals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No signals available</div>
          ) : (
            <div className="space-y-3">
              {intradaySignals.map((signal, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{signal.symbol}</span>
                      <span className={`badge ${signal.signal === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                        {signal.signal}
                      </span>
                      <span className="badge badge-info">{signal.type}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {signal.strength}% strength
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{signal.description}</p>
                  <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                    <span>Entry: ${signal.entry.toFixed(2)}</span>
                    <span>SL: ${signal.stopLoss.toFixed(2)}</span>
                    <span>Target: ${signal.target.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Swing Signals */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Top Swing Signals
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading signals...</div>
          ) : swingSignals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No signals available</div>
          ) : (
            <div className="space-y-3">
              {swingSignals.map((signal, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900">{signal.symbol}</span>
                      <span className={`badge ${signal.signal === 'BUY' ? 'badge-success' : 'badge-danger'}`}>
                        {signal.signal}
                      </span>
                      <span className="badge badge-warning">{signal.trend}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {signal.strength}% strength
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{signal.description}</p>
                  <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                    <span>Entry: ${signal.entry.toFixed(2)}</span>
                    <span>SL: ${signal.stopLoss.toFixed(2)}</span>
                    <span>Target: ${signal.target.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Technical Indicators</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• RSI, MACD, Bollinger Bands</li>
              <li>• EMA/SMA (9, 20, 50, 200)</li>
              <li>• ADX, ATR, Stochastic</li>
              <li>• Volume Profile Analysis</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Screening Strategies</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Momentum & Breakout Detection</li>
              <li>• Trend Following Analysis</li>
              <li>• Support/Resistance Levels</li>
              <li>• Pattern Recognition</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Risk Management</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Position Size Calculator</li>
              <li>• Stop Loss Optimization</li>
              <li>• Risk/Reward Ratio Analysis</li>
              <li>• Portfolio Heat Tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
