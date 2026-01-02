import { useState, useEffect } from 'react';
import {
  Settings,
  Play,
  RefreshCw,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

interface StrategyConfig {
  enabled: boolean;
  scanInterval: number;
  markets: string[];
  minConfidenceScore: number;
  maxResultsPerScan: number;
  lastScanTime?: string;
  nextScanTime?: string;
}

interface Strategy {
  key: string;
  name: string;
  description: string;
  type: string;
  category: 'INTRADAY' | 'SWING';
  criteria: Record<string, any>;
  defaultStopLossPercent: number;
  defaultTargetPercent: number;
  config: StrategyConfig;
}

interface EditingConfig {
  enabled: boolean;
  scanInterval: number;
  markets: string[];
  minConfidenceScore: number;
  maxResultsPerScan: number;
}

const AVAILABLE_MARKETS = ['NSE', 'BSE', 'NYSE', 'NASDAQ'];

export default function AutoScanSettings() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<EditingConfig | null>(null);
  const [savingStrategy, setSavingStrategy] = useState<string | null>(null);
  const [runningStrategy, setRunningStrategy] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'INTRADAY' | 'SWING'>('ALL');
  const [filterEnabled, setFilterEnabled] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/auto-scan/strategies`);
      if (response.data.success) {
        setStrategies(response.data.strategies);
      }
    } catch (error) {
      console.error('Error loading strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStrategy = (strategy: Strategy) => {
    setEditingStrategy(strategy.key);
    setEditingConfig({
      enabled: strategy.config.enabled,
      scanInterval: strategy.config.scanInterval,
      markets: [...strategy.config.markets],
      minConfidenceScore: strategy.config.minConfidenceScore,
      maxResultsPerScan: strategy.config.maxResultsPerScan,
    });
  };

  const handleCancelEdit = () => {
    setEditingStrategy(null);
    setEditingConfig(null);
  };

  const handleSaveConfig = async (strategyKey: string) => {
    if (!editingConfig) return;

    try {
      setSavingStrategy(strategyKey);
      const response = await axios.put(
        `${API_BASE_URL}/auto-scan/strategies/${strategyKey}`,
        editingConfig
      );

      if (response.data.success) {
        // Update local state
        setStrategies(prev =>
          prev.map(s =>
            s.key === strategyKey ? { ...s, config: { ...s.config, ...response.data.config } } : s
          )
        );
        setEditingStrategy(null);
        setEditingConfig(null);
      }
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      alert(error.response?.data?.error || 'Failed to save configuration');
    } finally {
      setSavingStrategy(null);
    }
  };

  const handleToggleEnabled = async (strategy: Strategy) => {
    try {
      const newEnabled = !strategy.config.enabled;
      const response = await axios.put(`${API_BASE_URL}/auto-scan/strategies/${strategy.key}`, {
        enabled: newEnabled,
      });

      if (response.data.success) {
        setStrategies(prev =>
          prev.map(s =>
            s.key === strategy.key ? { ...s, config: { ...s.config, enabled: newEnabled } } : s
          )
        );
      }
    } catch (error: any) {
      console.error('Error toggling strategy:', error);
      alert(error.response?.data?.error || 'Failed to toggle strategy');
    }
  };

  const handleRunManualScan = async (strategyKey: string) => {
    try {
      setRunningStrategy(strategyKey);
      const response = await axios.post(`${API_BASE_URL}/auto-scan/strategies/${strategyKey}/run`);
      if (response.data.success) {
        alert(response.data.message + '\n\n' + response.data.note);
      }
    } catch (error: any) {
      console.error('Error running manual scan:', error);
      alert(error.response?.data?.error || 'Failed to run manual scan');
    } finally {
      setRunningStrategy(null);
    }
  };

  const handleMarketToggle = (market: string) => {
    if (!editingConfig) return;

    setEditingConfig(prev => {
      if (!prev) return prev;
      const markets = prev.markets.includes(market)
        ? prev.markets.filter(m => m !== market)
        : [...prev.markets, market];
      return { ...prev, markets };
    });
  };

  const filteredStrategies = strategies.filter(s => {
    if (filterCategory !== 'ALL' && s.category !== filterCategory) return false;
    if (filterEnabled === 'ENABLED' && !s.config.enabled) return false;
    if (filterEnabled === 'DISABLED' && s.config.enabled) return false;
    return true;
  });

  const intradayCount = strategies.filter(s => s.category === 'INTRADAY').length;
  const swingCount = strategies.filter(s => s.category === 'SWING').length;
  const enabledCount = strategies.filter(s => s.config.enabled).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-white text-xl">Loading strategies...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Auto Scanner Settings</h1>
                <p className="text-blue-200 text-sm mt-1">
                  Configure and manage automated scanning strategies
                </p>
              </div>
            </div>
            <button
              onClick={loadStrategies}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-200 text-sm">Total Strategies</div>
              <div className="text-white text-2xl font-bold mt-1">{strategies.length}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-200 text-sm">Enabled</div>
              <div className="text-green-400 text-2xl font-bold mt-1">{enabledCount}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-200 text-sm">Intraday</div>
              <div className="text-cyan-400 text-2xl font-bold mt-1">{intradayCount}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-200 text-sm">Swing</div>
              <div className="text-purple-400 text-2xl font-bold mt-1">{swingCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-blue-200 text-sm block mb-2">Category</label>
              <div className="flex gap-2">
                {['ALL', 'INTRADAY', 'SWING'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat as any)}
                    className={`px-4 py-2 rounded-lg ${
                      filterCategory === cat
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-blue-200 text-sm block mb-2">Status</label>
              <div className="flex gap-2">
                {['ALL', 'ENABLED', 'DISABLED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterEnabled(status as any)}
                    className={`px-4 py-2 rounded-lg ${
                      filterEnabled === status
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white/10 text-blue-200 hover:bg-white/20'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Strategies List */}
        <div className="space-y-4">
          {filteredStrategies.map(strategy => {
            const isExpanded = expandedStrategy === strategy.key;
            const isEditing = editingStrategy === strategy.key;
            const isSaving = savingStrategy === strategy.key;
            const isRunning = runningStrategy === strategy.key;

            return (
              <div
                key={strategy.key}
                className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden"
              >
                {/* Strategy Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => handleToggleEnabled(strategy)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${
                          strategy.config.enabled ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                            strategy.config.enabled ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-white">{strategy.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              strategy.category === 'INTRADAY'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {strategy.category}
                          </span>
                          {strategy.config.enabled && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                        <p className="text-blue-200 text-sm mt-1">{strategy.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunManualScan(strategy.key)}
                        disabled={isRunning}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        {isRunning ? 'Running...' : 'Run Now'}
                      </button>
                      <button
                        onClick={() =>
                          setExpandedStrategy(isExpanded ? null : strategy.key)
                        }
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-blue-200" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-blue-200" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-white/20 p-6 bg-white/5">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Configuration */}
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-cyan-400" />
                          Configuration
                        </h4>

                        {isEditing && editingConfig ? (
                          <div className="space-y-4">
                            {/* Scan Interval */}
                            <div>
                              <label className="text-blue-200 text-sm block mb-2">
                                Scan Interval (minutes)
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editingConfig.scanInterval}
                                onChange={e =>
                                  setEditingConfig({
                                    ...editingConfig,
                                    scanInterval: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                              />
                            </div>

                            {/* Markets */}
                            <div>
                              <label className="text-blue-200 text-sm block mb-2">Markets</label>
                              <div className="flex flex-wrap gap-2">
                                {AVAILABLE_MARKETS.map(market => (
                                  <button
                                    key={market}
                                    onClick={() => handleMarketToggle(market)}
                                    className={`px-4 py-2 rounded-lg ${
                                      editingConfig.markets.includes(market)
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-white/10 text-blue-200'
                                    }`}
                                  >
                                    {market}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Min Confidence Score */}
                            <div>
                              <label className="text-blue-200 text-sm block mb-2">
                                Min Confidence Score
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editingConfig.minConfidenceScore}
                                onChange={e =>
                                  setEditingConfig({
                                    ...editingConfig,
                                    minConfidenceScore: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                              />
                            </div>

                            {/* Max Results */}
                            <div>
                              <label className="text-blue-200 text-sm block mb-2">
                                Max Results Per Scan
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editingConfig.maxResultsPerScan}
                                onChange={e =>
                                  setEditingConfig({
                                    ...editingConfig,
                                    maxResultsPerScan: parseInt(e.target.value) || 1,
                                  })
                                }
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                              />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveConfig(strategy.key)}
                                disabled={isSaving}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-blue-200">Scan Interval:</span>
                              <span className="text-white font-semibold">
                                {strategy.config.scanInterval} min
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Markets:</span>
                              <span className="text-white font-semibold">
                                {strategy.config.markets.join(', ')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Min Confidence:</span>
                              <span className="text-white font-semibold">
                                {strategy.config.minConfidenceScore}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Max Results:</span>
                              <span className="text-white font-semibold">
                                {strategy.config.maxResultsPerScan}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Stop Loss:</span>
                              <span className="text-white font-semibold">
                                {strategy.defaultStopLossPercent}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-200">Target:</span>
                              <span className="text-white font-semibold">
                                {strategy.defaultTargetPercent}%
                              </span>
                            </div>

                            <button
                              onClick={() => handleEditStrategy(strategy)}
                              className="w-full mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              Edit Configuration
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Criteria & Status */}
                      <div className="space-y-6">
                        {/* Criteria */}
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            Scan Criteria
                          </h4>
                          <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            {Object.entries(strategy.criteria).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-blue-200">
                                  {key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())}
                                  :
                                </span>
                                <span className="text-white font-semibold">
                                  {typeof value === 'boolean'
                                    ? value
                                      ? '✓'
                                      : '✗'
                                    : value}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Last Scan */}
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-400" />
                            Scan Status
                          </h4>
                          <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-200">Last Scan:</span>
                              <span className="text-white font-semibold">
                                {strategy.config.lastScanTime
                                  ? new Date(strategy.config.lastScanTime).toLocaleString()
                                  : 'Never'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-200">Next Scan:</span>
                              <span className="text-white font-semibold">
                                {strategy.config.nextScanTime
                                  ? new Date(strategy.config.nextScanTime).toLocaleString()
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredStrategies.length === 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
            <AlertCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Strategies Found</h3>
            <p className="text-blue-200">
              No strategies match your current filter criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
