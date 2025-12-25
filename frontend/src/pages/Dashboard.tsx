import { useState, useEffect } from 'react';
import { TrendingUp, Activity, BarChart3, Target, Zap, Shield, Award, ArrowRight } from 'lucide-react';
import { screenerAPI } from '../api/client';
import { Link } from 'react-router-dom';

interface MarketStats {
  totalSignals: number;
  strongBuys: number;
  avgConfluence: number;
  topPerformers: number;
}

export default function Dashboard() {
  const [intradaySignals, setIntradaySignals] = useState<any[]>([]);
  const [swingSignals, setSwingSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalSignals: 0,
    strongBuys: 0,
    avgConfluence: 0,
    topPerformers: 0
  });

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

      const intradayData = intradayRes.data.signals.slice(0, 5);
      const swingData = swingRes.data.signals.slice(0, 5);

      setIntradaySignals(intradayData);
      setSwingSignals(swingData);

      // Calculate market stats
      const allSignals = [...intradayData, ...swingData];
      const strongBuys = allSignals.filter(s => s.strength >= 80).length;
      const topPerformers = allSignals.filter(s => s.strength >= 70).length;

      setMarketStats({
        totalSignals: allSignals.length,
        strongBuys,
        avgConfluence: allSignals.length > 0
          ? Math.round(allSignals.reduce((sum, s) => sum + s.strength, 0) / allSignals.length)
          : 0,
        topPerformers
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Momentum Stocks',
      description: 'High volume breakouts with strong RSI',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      link: '/screener?preset=momentum'
    },
    {
      title: 'Value Opportunities',
      description: 'Low P/E, strong fundamentals',
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      link: '/screener?preset=value'
    },
    {
      title: 'Quality Growth',
      description: 'High ROE with revenue growth',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      link: '/screener?preset=growth'
    },
    {
      title: 'Low Risk',
      description: 'Strong financials, low debt',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      link: '/screener?preset=quality'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Market Screener Pro
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Professional stock screening with 20+ technical indicators and comprehensive fundamental analysis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Markets</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-1">4</p>
          <p className="text-xs sm:text-sm opacity-90">NSE, BSE, NYSE, NASDAQ</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Live Signals</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-1">{marketStats.totalSignals}</p>
          <p className="text-xs sm:text-sm opacity-90">Active opportunities</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Strong Buys</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-1">{marketStats.strongBuys}</p>
          <p className="text-xs sm:text-sm opacity-90">80%+ confidence</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 sm:p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
            <span className="text-xs sm:text-sm font-medium opacity-90">Avg Confluence</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold mb-1">{marketStats.avgConfluence}%</p>
          <p className="text-xs sm:text-sm opacity-90">Multi-indicator score</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.link}
              className={`border-2 ${action.borderColor} ${action.bgColor} rounded-lg p-5 hover:shadow-lg transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-3">
                <action.icon className={`w-8 h-8 ${action.color}`} />
                <ArrowRight className={`w-5 h-5 ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </Link>
          ))}
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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Technical Analysis */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 ml-3">Technical Analysis</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>20+ Indicators:</strong> RSI, MACD, ADX, Stochastic, Bollinger Bands</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Moving Averages:</strong> EMA/SMA (9, 20, 50, 200)</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>Volume Analysis:</strong> OBV, VWAP, Volume Profile</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span><strong>15+ Patterns:</strong> Candlestick pattern recognition</span>
              </li>
            </ul>
          </div>

          {/* Fundamental Analysis */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 ml-3">Fundamental Analysis</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span><strong>25+ Metrics:</strong> P/E, P/B, ROE, ROA, Margins</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span><strong>Growth Analysis:</strong> Revenue & EPS growth tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span><strong>Financial Health:</strong> Debt ratios, liquidity metrics</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span><strong>Quality Grading:</strong> A+ to F stock quality scores</span>
              </li>
            </ul>
          </div>

          {/* Advanced Features */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 ml-3">Pro Features</h3>
            </div>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span><strong>Confluence Scoring:</strong> Multi-indicator agreement</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span><strong>CSV Import/Export:</strong> Bulk analysis & data export</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span><strong>Smart Filtering:</strong> Sortable, filterable data tables</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span><strong>Risk Management:</strong> Stop loss & R:R calculations</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 sm:p-8 text-white text-center">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3">Ready to Find Your Next Winning Trade?</h2>
        <p className="text-sm sm:text-base lg:text-lg mb-6 opacity-90">
          Start screening stocks with professional-grade tools and institutional-quality analysis
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link
            to="/screener"
            className="w-full sm:w-auto bg-white text-primary-700 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
          >
            Launch Screener
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <Link
            to="/intraday"
            className="w-full sm:w-auto bg-primary-800 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-primary-900 transition-colors inline-flex items-center justify-center border-2 border-white/30"
          >
            <span className="hidden sm:inline">View Intraday Signals</span>
            <span className="sm:hidden">Intraday Signals</span>
            <Activity className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
