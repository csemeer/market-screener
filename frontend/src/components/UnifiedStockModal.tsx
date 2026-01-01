/**
 * Unified Stock Modal - Comprehensive stock analysis modal
 * Used across Auto Scan, Live Scan, and Custom Screener for consistent UX
 * Shows: price levels, technical indicators, fundamentals, patterns, evidence chart
 */

import { useState, useEffect } from 'react';
import {
  XCircle,
  ListPlus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  DollarSign,
  Target,
  Shield,
  Zap,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { watchlistAPI } from '../api/client';
import StockEvidenceChart from './StockEvidenceChart';

// Comprehensive stock data interface supporting all scan types
export interface UnifiedStockData {
  // Basic Information
  symbol: string;
  exchange: string;
  companyName?: string;

  // Price Information
  currentPrice: number;
  change?: number;
  changePercent?: number;
  volume?: number;

  // Entry/Exit Levels
  entryPrice?: number;
  stopLoss?: number;
  target?: number;
  target1?: number;
  target2?: number;
  target3?: number;
  riskReward?: number;

  // Scores and Ratings
  score?: number; // Technical score
  combinedScore?: number;
  confluenceScore?: number;
  confidence?: number; // Auto scan confidence
  strength?: number; // Live scan strength

  // Recommendation
  recommendation?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  setupType?: string;
  signal?: 'BUY' | 'SELL';
  signalType?: string; // MOMENTUM, BREAKOUT, etc.

  // Technical Indicators
  indicators?: {
    rsi?: number;
    adx?: number;
    macd?: {
      macd?: number;
      signal?: number;
      histogram?: number;
    };
    ema9?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
    atr?: number;
    stochastic?: {
      k?: number;
      d?: number;
    };
    volumeProfile?: {
      volumeRatio?: number;
      avgVolume?: number;
    };
  };

  // Fundamental Metrics
  fundamentals?: {
    peRatio?: number;
    pbRatio?: number;
    roe?: number;
    debtToEquity?: number;
    revenueGrowth?: number;
    epsGrowth?: number;
    marketCap?: number;
    dividendYield?: number;
  };
  fundamentalScore?: {
    overall?: number;
    quality?: string;
    category?: string;
  };

  // Patterns and Signals
  signals?: string[];
  patterns?: string[];

  // Chart Data
  historicalData?: any[];
  chartData?: any;

  // Source Metadata
  source?: 'AUTO_SCAN' | 'LIVE_SCAN' | 'SCREENER';
  sourceId?: number; // For auto-scan results
  strategy?: string; // Auto scan strategy name
  timeframe?: string;
  trendDirection?: string;

  // Quality badge
  quality?: string;
}

interface UnifiedStockModalProps {
  stock: UnifiedStockData;
  onClose: () => void;
  onRefresh?: () => void;
}

// Helper function to get currency symbol
const getCurrencySymbol = (exchange: string): string => {
  return ['NYSE', 'NASDAQ'].includes(exchange) ? '$' : '₹';
};

// Helper function to get currency code
const getCurrency = (exchange: string): 'USD' | 'INR' => {
  return ['NYSE', 'NASDAQ'].includes(exchange) ? 'USD' : 'INR';
};

export default function UnifiedStockModal({ stock, onClose, onRefresh }: UnifiedStockModalProps) {
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);

  const currencySymbol = getCurrencySymbol(stock.exchange);
  const currency = getCurrency(stock.exchange);

  // Load additional data if needed (for sources that don't pre-load everything)
  useEffect(() => {
    // If we don't have complete data, try to enrich it via API
    if (stock.source === 'LIVE_SCAN' && !stock.chartData) {
      loadEnrichedData();
    }
  }, [stock]);

  const loadEnrichedData = async () => {
    try {
      setLoading(true);
      const res = await watchlistAPI.analyzeStock(stock.symbol, stock.exchange);
      if (res.data.success) {
        setEnrichedData(res.data.data);
      }
    } catch (error) {
      console.error('Error loading enriched data:', error);
      // Non-critical error, continue with existing data
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async () => {
    try {
      setAddingToWatchlist(true);

      // Get or create appropriate watchlist based on source
      const watchlistsRes = await watchlistAPI.getWatchlists();
      const watchlistName = stock.source === 'AUTO_SCAN' ? 'Auto Scan Signals' :
                           stock.source === 'LIVE_SCAN' ? 'Live Scan Signals' :
                           'Screener Results';

      let watchlist = watchlistsRes.data.find((w: any) => w.name === watchlistName);

      if (!watchlist) {
        const createRes = await watchlistAPI.createWatchlist({
          name: watchlistName,
          description: `Stocks from ${stock.source === 'AUTO_SCAN' ? 'Auto Scan' : stock.source === 'LIVE_SCAN' ? 'Live Scan' : 'Custom Screener'}`,
        });
        watchlist = createRes.data.watchlist;
      }

      // For Auto Scan, use the specialized endpoint
      if (stock.source === 'AUTO_SCAN' && stock.sourceId) {
        await watchlistAPI.addStockFromScan(watchlist.id, stock.sourceId);
      } else {
        // For Live Scan and Screener, use manual endpoint
        const entryPrice = stock.entryPrice || enrichedData?.recommendations?.entryPrice || stock.currentPrice;
        const stopLoss = stock.stopLoss || enrichedData?.recommendations?.stopLoss || stock.currentPrice * 0.95;
        const target1 = stock.target1 || stock.target || enrichedData?.recommendations?.target1 || stock.currentPrice * 1.10;

        await watchlistAPI.addStockToWatchlist(watchlist.id, {
          symbol: stock.symbol,
          exchange: stock.exchange,
          companyName: stock.companyName,
          source: stock.source === 'SCREENER' ? 'SCREENER' : 'MANUAL', // API only accepts MANUAL or SCREENER
          entryPrice,
          stopLoss,
          target1,
          target2: stock.target2 || enrichedData?.recommendations?.target2,
          target3: stock.target3 || enrichedData?.recommendations?.target3,
          setupType: stock.setupType as any,
          timeframe: stock.timeframe as any,
          notes: buildWatchlistNotes(),
          status: 'PENDING',
        });
      }

      toast.success(`✅ ${stock.symbol} added to watchlist!`);
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add to watchlist';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const buildWatchlistNotes = (): string => {
    const parts: string[] = [];

    if (stock.source === 'AUTO_SCAN' && stock.strategy) {
      parts.push(`Strategy: ${stock.strategy}`);
    }
    if (stock.source === 'LIVE_SCAN' && stock.signalType) {
      parts.push(`Signal: ${stock.signalType}`);
    }
    if (stock.score || stock.combinedScore || stock.confidence || stock.strength) {
      const scoreValue = stock.combinedScore || stock.score || stock.confidence || stock.strength;
      parts.push(`Score: ${scoreValue}/100`);
    }
    if (stock.recommendation) {
      parts.push(`Rating: ${stock.recommendation.replace('_', ' ')}`);
    }
    if (stock.confluenceScore) {
      parts.push(`Confluence: ${stock.confluenceScore.toFixed(0)}%`);
    }

    return parts.join(' | ') || 'Added from scan';
  };

  // Merge enriched data if available
  const displayData = enrichedData ? {
    ...stock,
    chartData: enrichedData.chartData,
    indicators: enrichedData.indicators || stock.indicators,
    signals: enrichedData.signals || stock.signals,
    patterns: enrichedData.patterns || stock.patterns,
    confluenceScore: enrichedData.confluenceScore || stock.confluenceScore,
    trendDirection: enrichedData.trendDirection || stock.trendDirection,
  } : stock;

  // Calculate percentages for targets and stop loss
  const entryPrice = displayData.entryPrice || displayData.currentPrice;
  const stopLoss = displayData.stopLoss;
  const target = displayData.target1 || displayData.target;

  const stopLossPct = stopLoss ? (((stopLoss - entryPrice) / entryPrice) * 100).toFixed(2) : null;
  const targetPct = target ? (((target - entryPrice) / entryPrice) * 100).toFixed(2) : null;

  // Get the primary score to display
  const primaryScore = displayData.combinedScore || displayData.score || displayData.confidence || displayData.strength;

  // Prepare chart data
  let chartDataForDisplay = null;
  if (displayData.chartData) {
    chartDataForDisplay = {
      ...displayData.chartData,
      currency,
    };
  } else if (displayData.historicalData && displayData.historicalData.length > 0) {
    chartDataForDisplay = {
      symbol: displayData.symbol,
      currentPrice: displayData.currentPrice,
      historicalPrices: displayData.historicalData,
      indicators: displayData.indicators || {},
      levels: (entryPrice && stopLoss && target) ? {
        entry: entryPrice,
        stopLoss,
        target,
      } : undefined,
      currency,
    };
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white sm:rounded-lg shadow-2xl w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-b border-blue-700 p-4 sm:p-6 z-10 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate flex items-center gap-2">
                <Activity className="h-6 w-6" />
                {stock.symbol}
              </h2>
              <p className="text-sm sm:text-base text-blue-100 mt-1 truncate">
                {stock.companyName || stock.exchange}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2 hover:bg-blue-700 rounded-lg transition-all flex-shrink-0"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-blue-700 rounded-lg transition-all flex-shrink-0"
              >
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Badges and Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
            {/* Change Percent Badge */}
            {displayData.changePercent !== undefined && (
              <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                displayData.changePercent >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {displayData.changePercent >= 0 ? '+' : ''}{displayData.changePercent.toFixed(2)}%
              </span>
            )}

            {/* Score Badge */}
            {primaryScore !== undefined && (
              <span className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-purple-100 text-purple-800">
                Score: {primaryScore}/100
              </span>
            )}

            {/* Recommendation Badge */}
            {displayData.recommendation && (
              <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                displayData.recommendation === 'STRONG_BUY' ? 'bg-green-600 text-white' :
                displayData.recommendation === 'BUY' ? 'bg-green-500 text-white' :
                displayData.recommendation === 'HOLD' ? 'bg-yellow-500 text-white' :
                displayData.recommendation === 'SELL' ? 'bg-red-500 text-white' :
                'bg-red-700 text-white'
              }`}>
                {displayData.recommendation.replace('_', ' ')}
              </span>
            )}

            {/* Signal Badge (Live Scan) */}
            {displayData.signal && (
              <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                displayData.signal === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {displayData.signal}
              </span>
            )}

            {/* Signal Type Badge */}
            {displayData.signalType && (
              <span className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-blue-100 text-blue-800 truncate max-w-full">
                {displayData.signalType}
              </span>
            )}

            {/* Quality Badge */}
            {displayData.fundamentalScore?.quality && (
              <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold ${
                ['A+', 'A'].includes(displayData.fundamentalScore.quality) ? 'bg-green-100 text-green-800' :
                ['B+', 'B'].includes(displayData.fundamentalScore.quality) ? 'bg-blue-100 text-blue-800' :
                ['C+', 'C'].includes(displayData.fundamentalScore.quality) ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                Quality: {displayData.fundamentalScore.quality}
              </span>
            )}

            {/* Confluence Score Badge */}
            {displayData.confluenceScore !== undefined && (
              <span className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold bg-purple-100 text-purple-800">
                Confluence: {displayData.confluenceScore.toFixed(0)}%
              </span>
            )}

            {/* Add to Watchlist Button */}
            <button
              onClick={handleAddToWatchlist}
              disabled={addingToWatchlist}
              className="ml-auto flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold shadow-md border-2 border-white"
            >
              <ListPlus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{addingToWatchlist ? 'Adding...' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Price Levels Section */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* Current Price */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 sm:p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-blue-700" />
                <p className="text-xs sm:text-sm text-blue-700 font-medium">Current Price</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{currencySymbol}{displayData.currentPrice.toFixed(2)}</p>
              {displayData.change !== undefined && (
                <p className={`text-xs mt-1 ${displayData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {displayData.change >= 0 ? '+' : ''}{displayData.change.toFixed(2)}
                </p>
              )}
            </div>

            {/* Entry Price */}
            {entryPrice && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 sm:p-4 border border-purple-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-purple-700" />
                  <p className="text-xs sm:text-sm text-purple-700 font-medium">Entry Price</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-900">{currencySymbol}{entryPrice.toFixed(2)}</p>
              </div>
            )}

            {/* Target */}
            {target && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 sm:p-4 border border-green-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-green-700" />
                  <p className="text-xs sm:text-sm text-green-700 font-medium">Target</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-green-900">{currencySymbol}{target.toFixed(2)}</p>
                {targetPct && (
                  <p className="text-xs text-green-600 mt-1">
                    +{targetPct}%
                  </p>
                )}
              </div>
            )}

            {/* Stop Loss */}
            {stopLoss && (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 sm:p-4 border border-red-200 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-red-700" />
                  <p className="text-xs sm:text-sm text-red-700 font-medium">Stop Loss</p>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-900">{currencySymbol}{stopLoss.toFixed(2)}</p>
                {stopLossPct && (
                  <p className="text-xs text-red-600 mt-1">
                    {stopLossPct}%
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Additional Targets */}
          {(displayData.target2 || displayData.target3) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">Extended Targets</h4>
              <div className="grid grid-cols-2 gap-3">
                {displayData.target2 && (
                  <div>
                    <p className="text-xs text-green-700">Target 2</p>
                    <p className="text-lg font-bold text-green-900">{currencySymbol}{displayData.target2.toFixed(2)}</p>
                  </div>
                )}
                {displayData.target3 && (
                  <div>
                    <p className="text-xs text-green-700">Target 3</p>
                    <p className="text-lg font-bold text-green-900">{currencySymbol}{displayData.target3.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Risk/Reward Ratio */}
          {displayData.riskReward && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Risk/Reward Ratio</span>
                <span className="text-2xl font-bold text-blue-600">{displayData.riskReward.toFixed(1)}:1</span>
              </div>
            </div>
          )}

          {/* Evidence Chart */}
          {chartDataForDisplay && chartDataForDisplay.historicalPrices && chartDataForDisplay.historicalPrices.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Technical Evidence Chart
              </h3>
              <StockEvidenceChart data={chartDataForDisplay} />
            </div>
          )}

          {/* Technical Indicators */}
          {displayData.indicators && Object.keys(displayData.indicators).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Technical Indicators
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {displayData.indicators.rsi !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">RSI</p>
                    <p className={`text-lg font-bold ${
                      displayData.indicators.rsi > 70 ? 'text-red-600' :
                      displayData.indicators.rsi < 30 ? 'text-green-600' :
                      'text-gray-900'
                    }`}>
                      {displayData.indicators.rsi.toFixed(1)}
                    </p>
                  </div>
                )}
                {displayData.indicators.adx !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">ADX</p>
                    <p className={`text-lg font-bold ${
                      displayData.indicators.adx > 25 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {displayData.indicators.adx.toFixed(1)}
                    </p>
                  </div>
                )}
                {displayData.indicators.macd?.histogram !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">MACD</p>
                    <p className={`text-lg font-bold ${
                      displayData.indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {displayData.indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'}
                    </p>
                  </div>
                )}
                {displayData.indicators.volumeProfile?.volumeRatio !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Volume Ratio</p>
                    <p className="text-lg font-bold text-gray-900">
                      {displayData.indicators.volumeProfile.volumeRatio.toFixed(2)}x
                    </p>
                  </div>
                )}
                {displayData.indicators.atr !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">ATR</p>
                    <p className="text-lg font-bold text-gray-900">
                      {displayData.indicators.atr.toFixed(2)}
                    </p>
                  </div>
                )}
                {displayData.indicators.stochastic?.k !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Stochastic</p>
                    <p className="text-lg font-bold text-gray-900">
                      {displayData.indicators.stochastic.k.toFixed(1)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fundamental Analysis */}
          {displayData.fundamentals && Object.keys(displayData.fundamentals).filter(k => displayData.fundamentals?.[k as keyof typeof displayData.fundamentals] !== undefined).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Fundamental Analysis
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {displayData.fundamentals.peRatio !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">P/E Ratio</p>
                    <p className="text-lg font-bold text-gray-900">{displayData.fundamentals.peRatio.toFixed(2)}</p>
                  </div>
                )}
                {displayData.fundamentals.pbRatio !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">P/B Ratio</p>
                    <p className="text-lg font-bold text-gray-900">{displayData.fundamentals.pbRatio.toFixed(2)}</p>
                  </div>
                )}
                {displayData.fundamentals.roe !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">ROE</p>
                    <p className="text-lg font-bold text-gray-900">{displayData.fundamentals.roe.toFixed(1)}%</p>
                  </div>
                )}
                {displayData.fundamentals.debtToEquity !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Debt/Equity</p>
                    <p className="text-lg font-bold text-gray-900">{displayData.fundamentals.debtToEquity.toFixed(2)}</p>
                  </div>
                )}
                {displayData.fundamentals.revenueGrowth !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Revenue Growth</p>
                    <p className={`text-lg font-bold ${
                      displayData.fundamentals.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {displayData.fundamentals.revenueGrowth.toFixed(1)}%
                    </p>
                  </div>
                )}
                {displayData.fundamentals.epsGrowth !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">EPS Growth</p>
                    <p className={`text-lg font-bold ${
                      displayData.fundamentals.epsGrowth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {displayData.fundamentals.epsGrowth.toFixed(1)}%
                    </p>
                  </div>
                )}
                {displayData.fundamentals.marketCap !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Market Cap</p>
                    <p className="text-lg font-bold text-gray-900">
                      {currencySymbol}{(displayData.fundamentals.marketCap / 1000000000).toFixed(2)}B
                    </p>
                  </div>
                )}
                {displayData.fundamentals.dividendYield !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Dividend Yield</p>
                    <p className="text-lg font-bold text-gray-900">{displayData.fundamentals.dividendYield.toFixed(2)}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Signals */}
          {displayData.signals && displayData.signals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Technical Signals
              </h3>
              <div className="flex flex-wrap gap-2">
                {displayData.signals.map((signal: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {signal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Candlestick Patterns */}
          {displayData.patterns && displayData.patterns.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Candlestick Patterns
              </h3>
              <div className="flex flex-wrap gap-2">
                {displayData.patterns.map((pattern: string, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Volume Information */}
          {displayData.volume && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Volume</span>
                <span className="text-lg font-bold text-gray-900">{displayData.volume.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Trend Direction */}
          {displayData.trendDirection && (
            <div className={`border rounded-lg p-4 ${
              displayData.trendDirection === 'UPTREND' ? 'bg-green-50 border-green-200' :
              displayData.trendDirection === 'DOWNTREND' ? 'bg-red-50 border-red-200' :
              'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2">
                {displayData.trendDirection === 'UPTREND' ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : displayData.trendDirection === 'DOWNTREND' ? (
                  <TrendingDown className="h-5 w-5 text-red-600" />
                ) : (
                  <Activity className="h-5 w-5 text-yellow-600" />
                )}
                <span className="text-sm font-semibold">
                  Trend: {displayData.trendDirection}
                </span>
              </div>
            </div>
          )}

          {/* Strategy Info (Auto Scan) */}
          {displayData.strategy && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Strategy</h4>
              <p className="text-sm text-blue-700">{displayData.strategy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
