/**
 * Custom Watchlist Page - User-defined stock watchlists with live monitoring
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ListPlus,
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  ChevronRight,
  X,
  Search,
  Check,
  Loader2,
  Sparkles,
  Activity,
  BarChart3,
  AlertCircle,
  Filter, // Phase 4: Source filter icon
} from 'lucide-react';
import SourceBadge from '../components/SourceBadge'; // Phase 4: Source badge component
import { watchlistAPI } from '../api/client'; // Use centralized API client

interface Watchlist {
  id: number;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Phase 4: Source counts
  stockCount: number;
  autoScanCount?: number;
  manualCount?: number;
  screenerCount?: number;
  activeStockCount?: number;
}

interface WatchlistStock {
  id: number;
  watchlistId: number;
  symbol: string;
  exchange: string;
  companyName?: string;
  // Phase 4: Source tracking
  source?: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';
  sourceId?: number;
  sourceMetadata?: string; // JSON string
  setupType?: 'BREAKOUT' | 'BREAKDOWN' | 'PULLBACK' | 'REVERSAL' | 'CONSOLIDATION' | 'CUSTOM';
  timeframe?: 'INTRADAY' | 'SWING' | 'POSITIONAL';
  entryPrice: number;
  entryTrigger?: number;
  stopLoss: number;
  target1: number;
  target2?: number;
  target3?: number;
  trailingStopPercent?: number;
  positionSizePercent?: number;
  notes?: string;
  status: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED';
  triggerPrice?: number;
  triggerTime?: Date;
  addedAt: Date;
  updatedAt: Date;
}

export default function CustomWatchlist() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateWatchlist, setShowCreateWatchlist] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState<WatchlistStock | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showStockReport, setShowStockReport] = useState(false);
  const [stockReportData, setStockReportData] = useState<any>(null);

  // Phase 4: Source filter
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'AUTO_SCAN' | 'MANUAL' | 'SCREENER'>('ALL');

  // Form states
  const [watchlistForm, setWatchlistForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const [stockForm, setStockForm] = useState<{
    symbol: string;
    exchange: string;
    companyName: string;
    setupType: 'BREAKOUT' | 'BREAKDOWN' | 'PULLBACK' | 'REVERSAL' | 'CONSOLIDATION' | 'CUSTOM';
    timeframe: 'INTRADAY' | 'SWING' | 'POSITIONAL';
    entryPrice: string;
    entryTrigger: string;
    stopLoss: string;
    target1: string;
    target2: string;
    target3: string;
    trailingStopPercent: string;
    positionSizePercent: string;
    notes: string;
  }>({
    symbol: '',
    exchange: 'NSE',
    companyName: '',
    setupType: 'BREAKOUT',
    timeframe: 'INTRADAY',
    entryPrice: '',
    entryTrigger: '',
    stopLoss: '',
    target1: '',
    target2: '',
    target3: '',
    trailingStopPercent: '1.0',
    positionSizePercent: '1.0',
    notes: '',
  });

  useEffect(() => {
    fetchWatchlists();
  }, []);

  useEffect(() => {
    if (selectedWatchlist) {
      // Phase 4: Pass source filter to fetchStocks
      const source = sourceFilter === 'ALL' ? undefined : sourceFilter;
      fetchStocks(selectedWatchlist.id, source);
    }
  }, [selectedWatchlist, sourceFilter]); // Phase 4: Added sourceFilter dependency

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await watchlistAPI.getWatchlists();
      setWatchlists(response.data);
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      toast.error('Failed to fetch watchlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async (watchlistId: number, source?: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER') => {
    try {
      // Phase 4: Add source filter
      const response = await watchlistAPI.getWatchlistStocks(watchlistId, source ? { source } : undefined);
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Failed to fetch stocks');
    }
  };

  const createWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await watchlistAPI.createWatchlist(watchlistForm);
      setShowCreateWatchlist(false);
      setWatchlistForm({ name: '', description: '', isActive: true });
      fetchWatchlists();
      toast.success(`✅ Watchlist "${watchlistForm.name}" created successfully!`);
    } catch (error) {
      console.error('Error creating watchlist:', error);
      toast.error('❌ Failed to create watchlist. Please try again.');
    }
  };

  const deleteWatchlist = async (id: number) => {
    if (!confirm('Are you sure you want to delete this watchlist? All stocks will be removed.')) {
      return;
    }

    try {
      await watchlistAPI.deleteWatchlist(id);
      if (selectedWatchlist?.id === id) {
        setSelectedWatchlist(null);
        setStocks([]);
      }
      fetchWatchlists();
      toast.success('✅ Watchlist deleted successfully');
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      toast.error('❌ Failed to delete watchlist.');
    }
  };

  const addStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWatchlist) return;

    try {
      const stockData = {
        symbol: stockForm.symbol.toUpperCase().trim(),
        exchange: stockForm.exchange,
        companyName: stockForm.companyName || undefined,
        setupType: stockForm.setupType,
        timeframe: stockForm.timeframe,
        entryPrice: parseFloat(stockForm.entryPrice),
        entryTrigger: stockForm.entryTrigger ? parseFloat(stockForm.entryTrigger) : undefined,
        stopLoss: parseFloat(stockForm.stopLoss),
        target1: parseFloat(stockForm.target1),
        target2: stockForm.target2 ? parseFloat(stockForm.target2) : undefined,
        target3: stockForm.target3 ? parseFloat(stockForm.target3) : undefined,
        trailingStopPercent: parseFloat(stockForm.trailingStopPercent),
        positionSizePercent: parseFloat(stockForm.positionSizePercent),
        notes: stockForm.notes || undefined,
      };

      await watchlistAPI.addStockToWatchlist(selectedWatchlist.id, stockData);
      setShowAddStock(false);
      resetStockForm();
      fetchStocks(selectedWatchlist.id);
      fetchWatchlists(); // Refresh counts
      toast.success(`✅ ${stockForm.symbol} added to watchlist!`);
    } catch (error: any) {
      console.error('Error adding stock:', error);
      const message = error.response?.data?.error || 'Failed to add stock. Please try again.';
      toast.error(`❌ ${message}`);
    }
  };

  const updateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWatchlist || !editingStock) return;

    try {
      const stockData = {
        companyName: stockForm.companyName || undefined,
        setupType: stockForm.setupType,
        timeframe: stockForm.timeframe,
        entryPrice: parseFloat(stockForm.entryPrice),
        entryTrigger: stockForm.entryTrigger ? parseFloat(stockForm.entryTrigger) : undefined,
        stopLoss: parseFloat(stockForm.stopLoss),
        target1: parseFloat(stockForm.target1),
        target2: stockForm.target2 ? parseFloat(stockForm.target2) : undefined,
        target3: stockForm.target3 ? parseFloat(stockForm.target3) : undefined,
        trailingStopPercent: parseFloat(stockForm.trailingStopPercent),
        positionSizePercent: parseFloat(stockForm.positionSizePercent),
        notes: stockForm.notes || undefined,
      };

      await watchlistAPI.updateWatchlistStock(selectedWatchlist.id, editingStock.id, stockData);
      setEditingStock(null);
      setShowAddStock(false);
      resetStockForm();
      fetchStocks(selectedWatchlist.id);
      toast.success(`✅ ${stockForm.symbol} updated successfully!`);
    } catch (error: any) {
      console.error('Error updating stock:', error);
      const message = error.response?.data?.error || 'Failed to update stock. Please try again.';
      toast.error(`❌ ${message}`);
    }
  };

  const deleteStock = async (stockId: number) => {
    if (!selectedWatchlist) return;
    if (!confirm('Remove this stock from watchlist?')) return;

    try {
      await watchlistAPI.deleteWatchlistStock(selectedWatchlist.id, stockId);
      fetchStocks(selectedWatchlist.id);
      fetchWatchlists(); // Refresh counts
      toast.success('✅ Stock removed from watchlist');
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error('❌ Failed to remove stock.');
    }
  };

  const startEditStock = (stock: WatchlistStock) => {
    setEditingStock(stock);
    setStockForm({
      symbol: stock.symbol,
      exchange: stock.exchange,
      companyName: stock.companyName || '',
      setupType: stock.setupType || 'BREAKOUT',
      timeframe: stock.timeframe || 'INTRADAY',
      entryPrice: stock.entryPrice.toString(),
      entryTrigger: stock.entryTrigger?.toString() || '',
      stopLoss: stock.stopLoss.toString(),
      target1: stock.target1.toString(),
      target2: stock.target2?.toString() || '',
      target3: stock.target3?.toString() || '',
      trailingStopPercent: stock.trailingStopPercent?.toString() || '1.0',
      positionSizePercent: stock.positionSizePercent?.toString() || '1.0',
      notes: stock.notes || '',
    });
    setShowAddStock(true);
  };

  const resetStockForm = () => {
    setStockForm({
      symbol: '',
      exchange: 'NSE',
      companyName: '',
      setupType: 'BREAKOUT',
      timeframe: 'INTRADAY',
      entryPrice: '',
      entryTrigger: '',
      stopLoss: '',
      target1: '',
      target2: '',
      target3: '',
      trailingStopPercent: '1.0',
      positionSizePercent: '1.0',
      notes: '',
    });
    setEditingStock(null);
  };

  /**
   * Analyze stock and auto-populate entry/stop/target prices
   */
  const analyzeStock = async () => {
    if (!stockForm.symbol || !stockForm.exchange) {
      toast.error('⚠️ Please enter a symbol and select an exchange first');
      return;
    }

    try {
      setAnalyzing(true);
      const response = await watchlistAPI.analyzeStock(
        stockForm.symbol.toUpperCase(),
        stockForm.exchange
      );

      if (response.data.success) {
        const { data } = response.data;
        const { recommendations, currentPrice } = data;

        // Auto-populate form fields with intelligent recommendations
        setStockForm({
          ...stockForm,
          symbol: data.symbol,
          companyName: stockForm.companyName || data.symbol,
          setupType: recommendations.setupType || stockForm.setupType,
          timeframe: stockForm.timeframe, // Keep user's selection
          entryPrice: recommendations.entryPrice.toString(),
          stopLoss: recommendations.stopLoss.toString(),
          target1: recommendations.target1.toString(),
          target2: recommendations.target2?.toString() || '',
          target3: recommendations.target3?.toString() || '',
          trailingStopPercent: '1.0',
          positionSizePercent: '1.0',
          notes: `Auto-analyzed at ₹${currentPrice.toFixed(2)} | R:R ${recommendations.riskRewardRatio}:1 | ${data.trendDirection}`,
        });

        toast.success(`✅ Analysis complete! Entry, stop, and target prices have been auto-populated based on technical analysis.`);
      } else {
        toast.error(`❌ Failed to analyze ${stockForm.symbol}: ${response.data.error}`);
      }
    } catch (error: any) {
      console.error('Error analyzing stock:', error);
      const message = error.response?.data?.error || 'Failed to analyze stock. Please try again.';
      toast.error(`❌ ${message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Show professional stock report modal
   */
  const showStockAnalysis = async (stock: WatchlistStock) => {
    try {
      setAnalyzing(true);
      const response = await watchlistAPI.analyzeStock(stock.symbol, stock.exchange);

      if (response.data.success) {
        setStockReportData({
          ...response.data.data,
          // Add watchlist-specific data
          watchlistEntry: stock.entryPrice,
          watchlistStop: stock.stopLoss,
          watchlistTarget: stock.target1,
        });
        setShowStockReport(true);
      } else {
        toast.error(`❌ Failed to load analysis: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Error fetching stock analysis:', error);
      toast.error('❌ Failed to load stock analysis');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'TRIGGERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSetupIcon = (setupType?: string) => {
    switch (setupType) {
      case 'BREAKOUT': return <TrendingUp className="w-4 h-4" />;
      case 'BREAKDOWN': return <TrendingDown className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading watchlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ListPlus className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
            Custom Watchlists
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Create and manage your custom stock watchlists with live monitoring
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Watchlists Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Watchlists</h2>
                <button
                  onClick={() => setShowCreateWatchlist(true)}
                  className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                  title="Create Watchlist"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {watchlists.length === 0 ? (
                <div className="text-center py-8">
                  <ListPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No watchlists yet</p>
                  <button
                    onClick={() => setShowCreateWatchlist(true)}
                    className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Create your first watchlist
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {watchlists.map((watchlist) => (
                    <div
                      key={watchlist.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedWatchlist?.id === watchlist.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 bg-white'
                      }`}
                      onClick={() => setSelectedWatchlist(watchlist)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{watchlist.name}</h3>
                          {watchlist.description && (
                            <p className="text-xs text-gray-500 mt-1">{watchlist.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {watchlist.stockCount} stocks
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {watchlist.activeStockCount} active
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteWatchlist(watchlist.id);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stocks Grid */}
          <div className="lg:col-span-2">
            {selectedWatchlist ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedWatchlist.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {stocks.length} {stocks.length === 1 ? 'stock' : 'stocks'} in this watchlist
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      resetStockForm();
                      setShowAddStock(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Stock</span>
                  </button>
                </div>

                {/* Phase 4: Source Filter */}
                {selectedWatchlist && selectedWatchlist.stockCount > 0 && (
                  <div className="mb-4 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Filter by source:</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value as any)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    >
                      <option value="ALL">All Sources</option>
                      <option value="AUTO_SCAN">🤖 Auto-Scan ({selectedWatchlist.autoScanCount || 0})</option>
                      <option value="MANUAL">✋ Manual ({selectedWatchlist.manualCount || 0})</option>
                      <option value="SCREENER">🔍 Screener ({selectedWatchlist.screenerCount || 0})</option>
                    </select>
                    {sourceFilter !== 'ALL' && (
                      <button
                        onClick={() => setSourceFilter('ALL')}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                )}

                {stocks.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No stocks in this watchlist</p>
                    <button
                      onClick={() => {
                        resetStockForm();
                        setShowAddStock(true);
                      }}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Add your first stock
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stocks.map((stock) => (
                      <div
                        key={stock.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer hover:border-primary-300 relative group"
                        onClick={() => showStockAnalysis(stock)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getSetupIcon(stock.setupType)}
                              <h3 className="text-lg font-semibold text-gray-900">
                                {stock.symbol}
                              </h3>
                              <span className="text-xs text-gray-500">({stock.exchange})</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(stock.status)}`}>
                                {stock.status}
                              </span>
                              {/* Phase 4: Source badge */}
                              {stock.source && (
                                <SourceBadge
                                  source={stock.source}
                                  sourceMetadata={stock.sourceMetadata}
                                  showTooltip={true}
                                />
                              )}
                            </div>
                            {stock.companyName && (
                              <p className="text-sm text-gray-600 mt-1">{stock.companyName}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditStock(stock);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStock(stock.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Click indicator */}
                          <div className="absolute top-4 right-16 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1 text-xs text-primary-600 font-medium bg-primary-50 px-2 py-1 rounded-full">
                              <BarChart3 className="w-3 h-3" />
                              View Report
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs">Entry</p>
                            <p className="font-medium text-gray-900">₹{stock.entryPrice.toFixed(2)}</p>
                          </div>
                          {stock.entryTrigger && (
                            <div>
                              <p className="text-gray-500 text-xs">Trigger</p>
                              <p className="font-medium text-blue-900">₹{stock.entryTrigger.toFixed(2)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 text-xs">Stop Loss</p>
                            <p className="font-medium text-red-900">₹{stock.stopLoss.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs">Target 1</p>
                            <p className="font-medium text-green-900">₹{stock.target1.toFixed(2)}</p>
                          </div>
                          {stock.target2 && (
                            <div>
                              <p className="text-gray-500 text-xs">Target 2</p>
                              <p className="font-medium text-green-900">₹{stock.target2.toFixed(2)}</p>
                            </div>
                          )}
                          {stock.target3 && (
                            <div>
                              <p className="text-gray-500 text-xs">Target 3</p>
                              <p className="font-medium text-green-900">₹{stock.target3.toFixed(2)}</p>
                            </div>
                          )}
                        </div>

                        {stock.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
                            <strong>Notes:</strong> {stock.notes}
                          </div>
                        )}

                        {stock.status === 'TRIGGERED' && stock.triggerPrice && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                            <strong>Triggered at:</strong> ₹{stock.triggerPrice.toFixed(2)} on{' '}
                            {stock.triggerTime && new Date(stock.triggerTime).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <ChevronRight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select a watchlist to view stocks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Watchlist Modal */}
      {showCreateWatchlist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Create Watchlist</h3>
              <button
                onClick={() => {
                  setShowCreateWatchlist(false);
                  setWatchlistForm({ name: '', description: '', isActive: true });
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={createWatchlist}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={watchlistForm.name}
                    onChange={(e) => setWatchlistForm({ ...watchlistForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={watchlistForm.description}
                    onChange={(e) => setWatchlistForm({ ...watchlistForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateWatchlist(false);
                    setWatchlistForm({ name: '', description: '', isActive: true });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Stock Modal */}
      {showAddStock && selectedWatchlist && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingStock ? 'Edit Stock' : 'Add Stock'}
              </h3>
              <button
                onClick={() => {
                  setShowAddStock(false);
                  resetStockForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingStock ? updateStock : addStock}>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Stock Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={stockForm.symbol}
                      onChange={(e) => setStockForm({ ...stockForm, symbol: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="RELIANCE"
                      required
                      disabled={!!editingStock}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exchange *
                    </label>
                    <select
                      value={stockForm.exchange}
                      onChange={(e) => setStockForm({ ...stockForm, exchange: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={!!editingStock}
                    >
                      <option value="NSE">NSE</option>
                      <option value="BSE">BSE</option>
                      <option value="NYSE">NYSE</option>
                      <option value="NASDAQ">NASDAQ</option>
                    </select>
                  </div>

                  {/* Auto-Analyze Button */}
                  {!editingStock && (
                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={analyzeStock}
                        disabled={analyzing || !stockForm.symbol}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analyzing Stock...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Auto-Analyze & Populate Prices
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Click to automatically calculate entry, stop loss, and target prices based on technical analysis
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={stockForm.companyName}
                      onChange={(e) => setStockForm({ ...stockForm, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="Reliance Industries"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Setup Type
                    </label>
                    <select
                      value={stockForm.setupType}
                      onChange={(e) => setStockForm({ ...stockForm, setupType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="BREAKOUT">Breakout</option>
                      <option value="BREAKDOWN">Breakdown</option>
                      <option value="PULLBACK">Pullback</option>
                      <option value="REVERSAL">Reversal</option>
                      <option value="CONSOLIDATION">Consolidation</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeframe
                    </label>
                    <select
                      value={stockForm.timeframe}
                      onChange={(e) => setStockForm({ ...stockForm, timeframe: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="INTRADAY">Intraday</option>
                      <option value="SWING">Swing</option>
                      <option value="POSITIONAL">Positional</option>
                    </select>
                  </div>
                </div>

                {/* Price Levels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stockForm.entryPrice}
                      onChange={(e) => setStockForm({ ...stockForm, entryPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="2500.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entry Trigger
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stockForm.entryTrigger}
                      onChange={(e) => setStockForm({ ...stockForm, entryTrigger: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="2510.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stop Loss *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stockForm.stopLoss}
                      onChange={(e) => setStockForm({ ...stockForm, stopLoss: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="2450.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target 1 *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stockForm.target1}
                      onChange={(e) => setStockForm({ ...stockForm, target1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="2600.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target 2
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stockForm.target2}
                      onChange={(e) => setStockForm({ ...stockForm, target2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="2700.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target 3
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={stockForm.target3}
                      onChange={(e) => setStockForm({ ...stockForm, target3: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="2800.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trailing Stop %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={stockForm.trailingStopPercent}
                      onChange={(e) => setStockForm({ ...stockForm, trailingStopPercent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="1.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position Size %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={stockForm.positionSizePercent}
                      onChange={(e) => setStockForm({ ...stockForm, positionSizePercent: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      placeholder="1.0"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={stockForm.notes}
                    onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStock(false);
                    resetStockForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {editingStock ? 'Update Stock' : 'Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Stock Report Modal */}
      {showStockReport && stockReportData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stockReportData.symbol} <span className="text-sm text-gray-500">({stockReportData.exchange})</span>
                  </h2>
                  <p className="text-sm text-gray-600">Professional Stock Analysis Report</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStockReport(false);
                  setStockReportData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Current Price & Change */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Current Price</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stockReportData.currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Change</p>
                    <p className={`text-2xl font-bold ${stockReportData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stockReportData.change >= 0 ? '+' : ''}{stockReportData.change.toFixed(2)} ({stockReportData.changePercent.toFixed(2)}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Technical Score</p>
                    <p className="text-2xl font-bold text-blue-600">{stockReportData.technicalScore}/100</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Confluence</p>
                    <p className="text-2xl font-bold text-purple-600">{stockReportData.confluenceScore}%</p>
                  </div>
                </div>
              </div>

              {/* AI Recommendations vs Watchlist Values */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Price Levels Comparison
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AI Recommendations */}
                  <div className="bg-white rounded-lg p-3 border border-green-300">
                    <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      AI Recommended Levels
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entry:</span>
                        <span className="font-bold text-blue-900">₹{stockReportData.recommendations.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stop Loss:</span>
                        <span className="font-bold text-red-900">₹{stockReportData.recommendations.stopLoss.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target 1:</span>
                        <span className="font-bold text-green-900">₹{stockReportData.recommendations.target1.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">R:R Ratio:</span>
                        <span className="font-bold text-purple-900">{stockReportData.recommendations.riskRewardRatio}:1</span>
                      </div>
                    </div>
                  </div>

                  {/* Your Watchlist Levels */}
                  <div className="bg-white rounded-lg p-3 border border-blue-300">
                    <p className="text-sm font-semibold text-blue-700 mb-2">Your Watchlist Levels</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Entry:</span>
                        <span className="font-bold text-blue-900">₹{stockReportData.watchlistEntry.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stop Loss:</span>
                        <span className="font-bold text-red-900">₹{stockReportData.watchlistStop.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Target 1:</span>
                        <span className="font-bold text-green-900">₹{stockReportData.watchlistTarget.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Trend Analysis */}
              {stockReportData.trendDirection && (
                <div className={`rounded-lg p-4 border-2 ${
                  stockReportData.trendDirection === 'UPTREND' ? 'bg-green-50 border-green-500' :
                  stockReportData.trendDirection === 'DOWNTREND' ? 'bg-red-50 border-red-500' :
                  'bg-gray-50 border-gray-300'
                }`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Market Trend Analysis
                  </h3>
                  <p className={`text-xl font-bold ${
                    stockReportData.trendDirection === 'UPTREND' ? 'text-green-700' :
                    stockReportData.trendDirection === 'DOWNTREND' ? 'text-red-700' :
                    'text-gray-700'
                  }`}>
                    {stockReportData.trendDirection === 'UPTREND' && '📈 Strong Uptrend'}
                    {stockReportData.trendDirection === 'DOWNTREND' && '📉 Strong Downtrend'}
                    {stockReportData.trendDirection === 'SIDEWAYS' && '↔️ Sideways/Consolidation'}
                    {stockReportData.trendDirection === 'UNKNOWN' && '❓ Trend Unclear'}
                  </p>
                </div>
              )}

              {/* Technical Indicators Grid */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Technical Indicators
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* RSI */}
                  {stockReportData.indicators?.rsi && (
                    <div className={`rounded-lg p-3 border-2 ${
                      stockReportData.indicators.rsi > 70 ? 'bg-red-50 border-red-200' :
                      stockReportData.indicators.rsi < 30 ? 'bg-green-50 border-green-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <p className="text-xs text-gray-600 mb-1">RSI (14)</p>
                      <p className="text-lg font-bold text-gray-900">{stockReportData.indicators.rsi.toFixed(2)}</p>
                      <p className="text-xs mt-1 text-gray-500">
                        {stockReportData.indicators.rsi > 70 ? 'Overbought' :
                         stockReportData.indicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                      </p>
                    </div>
                  )}

                  {/* EMA 20 */}
                  {stockReportData.indicators?.ema?.ema20 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">EMA 20</p>
                      <p className="text-lg font-bold text-gray-900">₹{stockReportData.indicators.ema.ema20.toFixed(2)}</p>
                      <p className="text-xs mt-1">
                        {stockReportData.currentPrice > stockReportData.indicators.ema.ema20 ? '🟢 Above' : '🔴 Below'}
                      </p>
                    </div>
                  )}

                  {/* EMA 50 */}
                  {stockReportData.indicators?.ema?.ema50 && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">EMA 50</p>
                      <p className="text-lg font-bold text-gray-900">₹{stockReportData.indicators.ema.ema50.toFixed(2)}</p>
                      <p className="text-xs mt-1">
                        {stockReportData.currentPrice > stockReportData.indicators.ema.ema50 ? '🟢 Above' : '🔴 Below'}
                      </p>
                    </div>
                  )}

                  {/* EMA 200 */}
                  {stockReportData.indicators?.ema?.ema200 && (
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">EMA 200</p>
                      <p className="text-lg font-bold text-gray-900">₹{stockReportData.indicators.ema.ema200.toFixed(2)}</p>
                      <p className="text-xs mt-1">
                        {stockReportData.currentPrice > stockReportData.indicators.ema.ema200 ? '🟢 Above' : '🔴 Below'}
                      </p>
                    </div>
                  )}

                  {/* ADX */}
                  {stockReportData.indicators?.adx && (
                    <div className={`rounded-lg p-3 border ${
                      stockReportData.indicators.adx > 25 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className="text-xs text-gray-600 mb-1">ADX</p>
                      <p className="text-lg font-bold text-gray-900">{stockReportData.indicators.adx.toFixed(2)}</p>
                      <p className="text-xs mt-1 text-gray-500">
                        {stockReportData.indicators.adx > 25 ? 'Strong Trend' : 'Weak Trend'}
                      </p>
                    </div>
                  )}

                  {/* ATR */}
                  {stockReportData.indicators?.atr && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">ATR</p>
                      <p className="text-lg font-bold text-gray-900">₹{stockReportData.indicators.atr.toFixed(2)}</p>
                      <p className="text-xs mt-1 text-gray-500">Volatility</p>
                    </div>
                  )}

                  {/* MACD */}
                  {stockReportData.indicators?.macd && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">MACD</p>
                      <p className="text-lg font-bold text-gray-900">{stockReportData.indicators.macd.histogram.toFixed(2)}</p>
                      <p className="text-xs mt-1 text-gray-500">Histogram</p>
                    </div>
                  )}

                  {/* Volume */}
                  {stockReportData.volume && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">Volume</p>
                      <p className="text-lg font-bold text-gray-900">{(stockReportData.volume / 1000000).toFixed(2)}M</p>
                      <p className="text-xs mt-1 text-gray-500">Shares</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pattern Recognition */}
              {stockReportData.patterns && stockReportData.patterns.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    Candlestick Patterns Detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {stockReportData.patterns.map((pattern: string, idx: number) => (
                      <span key={idx} className="px-3 py-2 bg-white border-2 border-amber-300 text-amber-800 rounded-lg text-sm font-semibold">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Signals */}
              {stockReportData.signals && stockReportData.signals.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Trading Signals
                  </h3>
                  <div className="space-y-1">
                    {stockReportData.signals.map((signal: string, idx: number) => (
                      <p key={idx} className="text-sm text-gray-700">• {signal}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={() => {
                  setShowStockReport(false);
                  setStockReportData(null);
                }}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {analyzing && !showStockReport && !showAddStock && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              <p className="text-gray-900 font-medium">Analyzing stock...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
