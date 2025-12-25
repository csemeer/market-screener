import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, BarChart3, FileText, Lightbulb, GitCompare } from 'lucide-react';
import { stockAPI } from '../api/client';
import PriceChart from '../components/charts/PriceChart';
import TechnicalAnalysis from '../components/analysis/TechnicalAnalysis';
import FundamentalAnalysis from '../components/analysis/FundamentalAnalysis';
import SignalEvidence from '../components/analysis/SignalEvidence';
import AIInsights from '../components/analysis/AIInsights';

type TabType = 'chart' | 'technical' | 'fundamental' | 'signals' | 'ai';

interface StockData {
  symbol: string;
  exchange: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  indicators: any;
  fundamentals: any;
  historicalData: any[];
  recommendation: string;
  combinedScore: number;
  confluenceScore: number;
  fundamentalScore: any;
}

export default function StockDetail() {
  const { exchange, symbol } = useParams<{ exchange: string; symbol: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('chart');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockDetail = async () => {
      if (!exchange || !symbol) return;

      try {
        setLoading(true);
        setError(null);
        const response = await stockAPI.getDetail(exchange, symbol);
        setStockData(response.data);
      } catch (err: any) {
        console.error('Error fetching stock detail:', err);
        setError(err.response?.data?.error || 'Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockDetail();
  }, [exchange, symbol]);

  const tabs = [
    { id: 'chart' as TabType, label: 'Price Chart', icon: Activity },
    { id: 'technical' as TabType, label: 'Technical', icon: BarChart3 },
    { id: 'fundamental' as TabType, label: 'Fundamental', icon: FileText },
    { id: 'signals' as TabType, label: 'Signal Evidence', icon: GitCompare },
    { id: 'ai' as TabType, label: 'AI Insights', icon: Lightbulb },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !stockData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">{error || 'Stock not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Results</span>
          </button>

          {/* Stock Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{stockData.symbol}</h1>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    {stockData.exchange}
                  </span>
                </div>
                <div className="flex items-baseline space-x-4">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    ${stockData.price.toFixed(2)}
                  </span>
                  <div className={`flex items-center text-lg font-semibold ${
                    stockData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stockData.changePercent >= 0 ? (
                      <TrendingUp className="w-5 h-5 mr-1" />
                    ) : (
                      <TrendingDown className="w-5 h-5 mr-1" />
                    )}
                    {stockData.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Score</div>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary-100 text-primary-800">
                    {stockData.combinedScore}/100
                  </div>
                </div>
                {stockData.fundamentalScore && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Quality</div>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                      ['A+', 'A'].includes(stockData.fundamentalScore.quality) ? 'bg-green-100 text-green-800' :
                      ['B+', 'B'].includes(stockData.fundamentalScore.quality) ? 'bg-blue-100 text-blue-800' :
                      ['C+', 'C'].includes(stockData.fundamentalScore.quality) ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {stockData.fundamentalScore.quality}
                    </span>
                  </div>
                )}
                {stockData.recommendation && (
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Action</div>
                    <span className={`inline-block px-2 py-1 rounded text-sm font-bold ${
                      stockData.recommendation === 'STRONG_BUY' ? 'bg-green-600 text-white' :
                      stockData.recommendation === 'BUY' ? 'bg-green-500 text-white' :
                      stockData.recommendation === 'HOLD' ? 'bg-yellow-500 text-white' :
                      stockData.recommendation === 'SELL' ? 'bg-red-500 text-white' :
                      'bg-red-700 text-white'
                    }`}>
                      {stockData.recommendation.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Mobile Dropdown */}
            <div className="sm:hidden p-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden sm:flex border-b border-gray-200">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                      isActive
                        ? 'border-primary-600 text-primary-600 bg-primary-50'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {activeTab === 'chart' && <PriceChart stockData={stockData} />}
          {activeTab === 'technical' && <TechnicalAnalysis stockData={stockData} />}
          {activeTab === 'fundamental' && <FundamentalAnalysis stockData={stockData} />}
          {activeTab === 'signals' && <SignalEvidence stockData={stockData} />}
          {activeTab === 'ai' && <AIInsights stockData={stockData} />}
        </div>
      </div>
    </div>
  );
}
