import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Copy, Trash2, Play, TrendingUp, Activity, BarChart3, Target } from 'lucide-react';
import { strategyAPI } from '../../api/client';
import StrategyBuilder from './StrategyBuilder';

interface Strategy {
  id: number;
  name: string;
  description: string;
  category: string;
  entry_conditions: any;
  exit_conditions: any;
  indicators_config: any;
  recommended_timeframes: string[];
  recommended_stop_loss_percent: number;
  recommended_target_percent: number;
  min_capital_required: number;
  is_system: boolean;
  is_active: boolean;
  avg_win_rate?: number;
  avg_return_percent?: number;
  total_uses?: number;
  usage_count?: number;
}

export default function StrategyLibrary() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    filterStrategies();
  }, [strategies, searchTerm, categoryFilter]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const response = await strategyAPI.getAllStrategies();
      setStrategies(response.data.strategies || []);
    } catch (error) {
      console.error('Error loading strategies:', error);
      alert('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const filterStrategies = () => {
    let filtered = strategies;

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(s => s.category === categoryFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term)
      );
    }

    setFilteredStrategies(filtered);
  };

  const handleCreateNew = () => {
    setEditingStrategy(null);
    setShowBuilder(true);
  };

  const handleEdit = (strategy: Strategy) => {
    if (strategy.is_system) {
      if (window.confirm('System strategies cannot be edited directly. Would you like to create a copy instead?')) {
        handleClone(strategy);
      }
      return;
    }
    setEditingStrategy(strategy);
    setShowBuilder(true);
  };

  const handleClone = async (strategy: Strategy) => {
    const newName = prompt('Enter name for cloned strategy:', `${strategy.name} (Copy)`);
    if (!newName) return;

    try {
      await strategyAPI.cloneStrategy(strategy.id, { new_name: newName });
      alert('Strategy cloned successfully!');
      loadStrategies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to clone strategy');
    }
  };

  const handleDelete = async (strategy: Strategy) => {
    if (strategy.is_system) {
      alert('Cannot delete system strategies');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${strategy.name}"?`)) {
      return;
    }

    try {
      await strategyAPI.deleteStrategy(strategy.id);
      alert('Strategy deleted successfully!');
      loadStrategies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete strategy');
    }
  };

  const handleToggleActive = async (strategy: Strategy) => {
    try {
      await strategyAPI.updateStrategy(strategy.id, {
        is_active: !strategy.is_active
      });
      loadStrategies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update strategy');
    }
  };

  const handleBuilderClose = (saved: boolean) => {
    setShowBuilder(false);
    setEditingStrategy(null);
    if (saved) {
      loadStrategies();
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MEAN_REVERSION': return <TrendingUp className="w-5 h-5" />;
      case 'TREND_FOLLOWING': return <BarChart3 className="w-5 h-5" />;
      case 'VOLUME_BREAKOUT': return <Activity className="w-5 h-5" />;
      case 'MOMENTUM': return <Target className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MEAN_REVERSION': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'TREND_FOLLOWING': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'VOLUME_BREAKOUT': return 'bg-green-100 text-green-800 border-green-300';
      case 'MOMENTUM': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (showBuilder) {
    return <StrategyBuilder strategy={editingStrategy} onClose={handleBuilderClose} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Strategy Library</h1>
            <p className="text-gray-600 mt-1">Manage and create your trading strategies</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Strategy
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search strategies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="MEAN_REVERSION">Mean Reversion</option>
            <option value="TREND_FOLLOWING">Trend Following</option>
            <option value="VOLUME_BREAKOUT">Volume Breakout</option>
            <option value="MOMENTUM">Momentum</option>
            <option value="CUSTOM">Custom</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading strategies...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredStrategies.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Strategies Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || categoryFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first strategy'}
          </p>
          {!searchTerm && categoryFilter === 'ALL' && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create Strategy
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!loading && viewMode === 'grid' && filteredStrategies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrategies.map(strategy => (
            <div
              key={strategy.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(strategy.category)}`}>
                      {getCategoryIcon(strategy.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
                      <p className="text-sm text-gray-600">{strategy.category.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {strategy.is_system && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      SYSTEM
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{strategy.description}</p>
              </div>

              {/* Metrics */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-600">Stop Loss</div>
                    <div className="text-lg font-semibold text-red-600">
                      {strategy.recommended_stop_loss_percent}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Target</div>
                    <div className="text-lg font-semibold text-green-600">
                      {strategy.recommended_target_percent}%
                    </div>
                  </div>
                  {strategy.avg_win_rate !== undefined && (
                    <>
                      <div>
                        <div className="text-xs text-gray-600">Win Rate</div>
                        <div className="text-lg font-semibold text-blue-600">
                          {strategy.avg_win_rate?.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Avg Return</div>
                        <div className="text-lg font-semibold text-purple-600">
                          {strategy.avg_return_percent?.toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Timeframes */}
                <div className="mb-4">
                  <div className="text-xs text-gray-600 mb-1">Timeframes</div>
                  <div className="flex flex-wrap gap-1">
                    {strategy.recommended_timeframes?.map(tf => (
                      <span key={tf} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border">
                        {tf}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(strategy)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    <Edit className="w-4 h-4" />
                    {strategy.is_system ? 'View' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleClone(strategy)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                    Clone
                  </button>
                  {!strategy.is_system && (
                    <button
                      onClick={() => handleDelete(strategy)}
                      className="px-3 py-2 bg-white border border-red-300 text-red-600 rounded hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strategy.is_active}
                    onChange={() => handleToggleActive(strategy)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {strategy.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && filteredStrategies.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Strategy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stop / Target</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Win Rate</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStrategies.map(strategy => (
                <tr key={strategy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded ${getCategoryColor(strategy.category)}`}>
                        {getCategoryIcon(strategy.category)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{strategy.name}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">{strategy.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(strategy.category)}`}>
                      {strategy.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm">
                      <span className="text-red-600 font-semibold">{strategy.recommended_stop_loss_percent}%</span>
                      {' / '}
                      <span className="text-green-600 font-semibold">{strategy.recommended_target_percent}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {strategy.avg_win_rate !== undefined ? (
                      <div className="text-sm font-semibold text-blue-600">
                        {strategy.avg_win_rate.toFixed(1)}%
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">—</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      strategy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {strategy.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(strategy)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title={strategy.is_system ? 'View' : 'Edit'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleClone(strategy)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Clone"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {!strategy.is_system && (
                        <button
                          onClick={() => handleDelete(strategy)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && filteredStrategies.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Strategies</div>
            <div className="text-2xl font-bold text-gray-900">{strategies.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Active Strategies</div>
            <div className="text-2xl font-bold text-green-600">
              {strategies.filter(s => s.is_active).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">System Strategies</div>
            <div className="text-2xl font-bold text-blue-600">
              {strategies.filter(s => s.is_system).length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Custom Strategies</div>
            <div className="text-2xl font-bold text-purple-600">
              {strategies.filter(s => !s.is_system).length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
