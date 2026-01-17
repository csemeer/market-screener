import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, BarChart3, Zap, Activity, Eye, Copy, Edit2, Trash2, AlertCircle, Plus, Play, Video } from 'lucide-react';
import { strategyAPI } from '../api/client';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import StrategyBuilder from '../components/strategy/StrategyBuilder';

interface Strategy {
  id: number;
  name: string;
  description: string;
  category: 'MEAN_REVERSION' | 'TREND_FOLLOWING' | 'VOLUME_BREAKOUT' | 'MOMENTUM' | 'CUSTOM';
  entry_conditions: any;
  exit_conditions: any;
  indicators_config: any;
  is_system: boolean;
  is_active: boolean;
  total_uses: number;
  avg_win_rate?: number;
  avg_return_percent?: number;
  recommended_timeframes?: string[];
  recommended_stop_loss_percent?: number;
  recommended_target_percent?: number;
  min_capital_required?: number;
  created_by?: string;
  created_at: string;
}

const categoryConfig = {
  MEAN_REVERSION: {
    label: 'Mean Reversion',
    icon: TrendingUp,
    color: 'blue',
    description: 'Strategies that profit from price returning to average'
  },
  TREND_FOLLOWING: {
    label: 'Trend Following',
    icon: Activity,
    color: 'green',
    description: 'Strategies that ride strong directional moves'
  },
  VOLUME_BREAKOUT: {
    label: 'Volume Breakout',
    icon: Zap,
    color: 'purple',
    description: 'Strategies based on volume spikes and breakouts'
  },
  MOMENTUM: {
    label: 'Momentum',
    icon: BarChart3,
    color: 'orange',
    description: 'Strategies that capitalize on price momentum'
  },
  CUSTOM: {
    label: 'Custom',
    icon: Edit2,
    color: 'gray',
    description: 'User-created custom strategies'
  }
};

export default function StrategyLibrary() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showSystemOnly, setShowSystemOnly] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [strategies, searchQuery, selectedCategory, showSystemOnly]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const response = await strategyAPI.getAllStrategies();
      setStrategies(response.data.strategies || []);
    } catch (error) {
      console.error('Error loading strategies:', error);
      toast.error('Failed to load strategies');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...strategies];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    // System strategies filter
    if (showSystemOnly) {
      filtered = filtered.filter(s => s.is_system);
    }

    setFilteredStrategies(filtered);
  };

  const handleViewDetails = (strategy: Strategy) => {
    setSelectedStrategy(strategy);
    setShowBuilder(true);
  };

  const handleCreateNew = () => {
    setSelectedStrategy(null);
    setShowBuilder(true);
  };

  const handleCloseBuilder = (saved: boolean) => {
    setShowBuilder(false);
    setSelectedStrategy(null);
    if (saved) {
      loadStrategies();
    }
  };

  const handleBacktest = (strategy: Strategy) => {
    // Create a temporary scalper config with this strategy for backtesting
    const backtestConfig = {
      strategy: {
        id: strategy.id,
        name: strategy.name,
        category: strategy.category,
        entry_conditions: strategy.entry_conditions,
        exit_conditions: strategy.exit_conditions,
        indicators_config: strategy.indicators_config,
        recommended_timeframes: strategy.recommended_timeframes,
        recommended_stop_loss_percent: strategy.recommended_stop_loss_percent,
        recommended_target_percent: strategy.recommended_target_percent
      }
    };

    // Store in session storage for the scalper dashboard to pick up
    sessionStorage.setItem('backtest_strategy', JSON.stringify(backtestConfig));

    // Navigate to scalper dashboard
    toast.success(`Opening backtest for ${strategy.name}...`);
    navigate('/scalper');
  };

  const handleLiveSimulation = (strategy: Strategy) => {
    // Create simulation config with this strategy
    const simulationConfig = {
      strategy: {
        id: strategy.id,
        name: strategy.name,
        category: strategy.category,
        entry_conditions: strategy.entry_conditions,
        exit_conditions: strategy.exit_conditions,
        indicators_config: strategy.indicators_config,
        recommended_timeframes: strategy.recommended_timeframes,
        recommended_stop_loss_percent: strategy.recommended_stop_loss_percent,
        recommended_target_percent: strategy.recommended_target_percent
      }
    };

    // Store in session storage for the live simulation page to pick up
    sessionStorage.setItem('live_simulation_strategy', JSON.stringify(simulationConfig));

    // Navigate to live simulation
    toast.success(`Opening live simulation for ${strategy.name}...`);
    navigate('/live-simulation');
  };

  const handleCloneStrategy = async (strategy: Strategy) => {
    const newName = prompt(`Clone "${strategy.name}" as:`, `${strategy.name} (Copy)`);
    if (!newName) return;

    try {
      await strategyAPI.cloneStrategy(strategy.id, {
        new_name: newName,
        created_by: 'user'
      });
      toast.success(`Strategy "${newName}" created successfully!`);
      loadStrategies();
    } catch (error: any) {
      console.error('Error cloning strategy:', error);
      toast.error(error.response?.data?.error || 'Failed to clone strategy');
    }
  };

  const handleDeleteStrategy = async (strategy: Strategy) => {
    if (strategy.is_system) {
      toast.error('Cannot delete system strategies');
      return;
    }

    if (!confirm(`Delete strategy "${strategy.name}"?`)) return;

    try {
      await strategyAPI.deleteStrategy(strategy.id);
      toast.success('Strategy deleted successfully');
      loadStrategies();
    } catch (error: any) {
      console.error('Error deleting strategy:', error);
      toast.error(error.response?.data?.error || 'Failed to delete strategy');
    }
  };

  const handleToggleActive = async (strategy: Strategy) => {
    try {
      await strategyAPI.updateStrategy(strategy.id, {
        is_active: !strategy.is_active
      });
      toast.success(`Strategy ${strategy.is_active ? 'deactivated' : 'activated'}`);
      loadStrategies();
    } catch (error: any) {
      console.error('Error updating strategy:', error);
      toast.error(error.response?.data?.error || 'Failed to update strategy');
    }
  };

  // Group strategies by category
  const groupedStrategies = filteredStrategies.reduce((acc, strategy) => {
    if (!acc[strategy.category]) {
      acc[strategy.category] = [];
    }
    acc[strategy.category].push(strategy);
    return acc;
  }, {} as Record<string, Strategy[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading strategy library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Strategy Library</h1>
            <p className="text-gray-600">
              Professional trading strategies ready to use or customize
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create New Strategy
            </button>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">Total Strategies</div>
              <div className="text-2xl font-bold text-gray-900">{strategies.length}</div>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="text-sm text-gray-600">System Strategies</div>
              <div className="text-2xl font-bold text-blue-600">
                {strategies.filter(s => s.is_system).length}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strategies..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* System Filter */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="systemOnly"
                checked={showSystemOnly}
                onChange={(e) => setShowSystemOnly(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="systemOnly" className="text-sm font-medium text-gray-700">
                System Strategies Only
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies Grid by Category */}
      {Object.keys(groupedStrategies).length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Strategies Found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedStrategies).map(([category, categoryStrategies]) => {
            const config = categoryConfig[category as keyof typeof categoryConfig];
            const Icon = config.icon;

            return (
              <div key={category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 bg-${config.color}-100 rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 text-${config.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{config.label}</h2>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                  <div className="ml-auto bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-semibold text-gray-700">
                      {categoryStrategies.length} {categoryStrategies.length === 1 ? 'Strategy' : 'Strategies'}
                    </span>
                  </div>
                </div>

                {/* Strategy Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`bg-white rounded-lg shadow-sm border-2 ${
                        strategy.is_active ? 'border-gray-200 hover:border-blue-400' : 'border-gray-200 opacity-60'
                      } p-5 transition-all hover:shadow-md`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg">{strategy.name}</h3>
                            {strategy.is_system && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                SYSTEM
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{strategy.description}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600">R:R Ratio</div>
                          <div className="text-sm font-bold text-gray-900">
                            1:{strategy.recommended_target_percent && strategy.recommended_stop_loss_percent
                              ? (strategy.recommended_target_percent / strategy.recommended_stop_loss_percent).toFixed(1)
                              : 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-xs text-gray-600">Uses</div>
                          <div className="text-sm font-bold text-blue-600">{strategy.total_uses}</div>
                        </div>
                        {strategy.avg_win_rate ? (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600">Win Rate</div>
                            <div className="text-sm font-bold text-green-600">
                              {strategy.avg_win_rate.toFixed(0)}%
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-600">Capital</div>
                            <div className="text-sm font-bold text-gray-900">
                              ₹{(strategy.min_capital_required || 0) / 1000}K
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Timeframes */}
                      {strategy.recommended_timeframes && strategy.recommended_timeframes.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-gray-600 mb-1">Timeframes:</div>
                          <div className="flex gap-1 flex-wrap">
                            {strategy.recommended_timeframes.map((tf) => (
                              <span key={tf} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                {tf}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleViewDetails(strategy)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          {strategy.is_system ? 'View' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleBacktest(strategy)}
                          className="px-3 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50"
                          title="Backtest Strategy"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleLiveSimulation(strategy)}
                          className="px-3 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50"
                          title="Live Simulation"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCloneStrategy(strategy)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          title="Clone Strategy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {!strategy.is_system && (
                          <button
                            onClick={() => handleDeleteStrategy(strategy)}
                            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete Strategy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Active Toggle */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
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
              </div>
            );
          })}
        </div>
      )}

      {/* Strategy Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 overflow-y-auto">
          <StrategyBuilder
            strategy={selectedStrategy}
            onClose={handleCloseBuilder}
          />
        </div>
      )}
    </div>
  );
}
