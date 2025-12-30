/**
 * Custom Watchlist Page - User-defined stock watchlists with live monitoring
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
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
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Watchlist {
  id: number;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stockCount: number;
  activeStockCount: number;
}

interface WatchlistStock {
  id: number;
  watchlistId: number;
  symbol: string;
  exchange: string;
  companyName?: string;
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
      fetchStocks(selectedWatchlist.id);
    }
  }, [selectedWatchlist]);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/watchlist`);
      setWatchlists(response.data);
    } catch (error) {
      console.error('Error fetching watchlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async (watchlistId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/watchlist/${watchlistId}/stocks`);
      setStocks(response.data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const createWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/watchlist`, watchlistForm);
      setShowCreateWatchlist(false);
      setWatchlistForm({ name: '', description: '', isActive: true });
      fetchWatchlists();
    } catch (error) {
      console.error('Error creating watchlist:', error);
      alert('Failed to create watchlist. Please try again.');
    }
  };

  const deleteWatchlist = async (id: number) => {
    if (!confirm('Are you sure you want to delete this watchlist? All stocks will be removed.')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/watchlist/${id}`);
      if (selectedWatchlist?.id === id) {
        setSelectedWatchlist(null);
        setStocks([]);
      }
      fetchWatchlists();
    } catch (error) {
      console.error('Error deleting watchlist:', error);
      alert('Failed to delete watchlist.');
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

      await axios.post(`${API_BASE_URL}/api/watchlist/${selectedWatchlist.id}/stocks`, stockData);
      setShowAddStock(false);
      resetStockForm();
      fetchStocks(selectedWatchlist.id);
      fetchWatchlists(); // Refresh counts
    } catch (error: any) {
      console.error('Error adding stock:', error);
      const message = error.response?.data?.error || 'Failed to add stock. Please try again.';
      alert(message);
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

      await axios.put(
        `${API_BASE_URL}/api/watchlist/${selectedWatchlist.id}/stocks/${editingStock.id}`,
        stockData
      );
      setEditingStock(null);
      setShowAddStock(false);
      resetStockForm();
      fetchStocks(selectedWatchlist.id);
    } catch (error: any) {
      console.error('Error updating stock:', error);
      const message = error.response?.data?.error || 'Failed to update stock. Please try again.';
      alert(message);
    }
  };

  const deleteStock = async (stockId: number) => {
    if (!selectedWatchlist) return;
    if (!confirm('Remove this stock from watchlist?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/watchlist/${selectedWatchlist.id}/stocks/${stockId}`);
      fetchStocks(selectedWatchlist.id);
      fetchWatchlists(); // Refresh counts
    } catch (error) {
      console.error('Error deleting stock:', error);
      alert('Failed to remove stock.');
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
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {getSetupIcon(stock.setupType)}
                              <h3 className="text-lg font-semibold text-gray-900">
                                {stock.symbol}
                              </h3>
                              <span className="text-xs text-gray-500">({stock.exchange})</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(stock.status)}`}>
                                {stock.status}
                              </span>
                            </div>
                            {stock.companyName && (
                              <p className="text-sm text-gray-600 mt-1">{stock.companyName}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditStock(stock)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteStock(stock.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
    </div>
  );
}
