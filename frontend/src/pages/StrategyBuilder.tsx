import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  Settings,
  TrendingUp,
  Target,
  Shield,
  Info,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import ConditionBuilder, { ConditionGroup } from '../components/strategy/ConditionBuilder';
import { ExpressionParser } from '../services/expressionParser';

interface IndicatorConfig {
  useEMA: boolean;
  emaFast: number;
  emaMiddle: number;
  emaSlow: number;
  ema200: boolean;

  useSMA: boolean;
  smaFast: number;
  smaMiddle: number;
  smaSlow: number;
  sma200: boolean;

  useRSI: boolean;
  rsiPeriod: number;

  useMACD: boolean;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;

  useBB: boolean;
  bbPeriod: number;
  bbStdDev: number;

  useADX: boolean;
  adxPeriod: number;

  useATR: boolean;
  atrPeriod: number;

  useStochastic: boolean;
  stochKPeriod: number;
  stochDPeriod: number;

  useVolume: boolean;
  volumePeriod: number;

  useVWAP: boolean;
}

export default function StrategyBuilder() {
  const navigate = useNavigate();
  const location = useLocation();

  // Edit mode: Check if we have a strategy to edit
  const editingStrategy = location.state?.strategy || null;
  const isEditMode = !!editingStrategy;
  const strategyId = editingStrategy?.id || null;

  // Basic Strategy Info
  const [name, setName] = useState(editingStrategy?.name || '');
  const [description, setDescription] = useState(editingStrategy?.description || '');
  const [category, setCategory] = useState<'CUSTOM' | 'MEAN_REVERSION' | 'TREND_FOLLOWING' | 'VOLUME_BREAKOUT' | 'MOMENTUM'>(
    editingStrategy?.category || 'CUSTOM'
  );

  // Entry/Exit Conditions
  const [entryConditions, setEntryConditions] = useState<ConditionGroup>(
    editingStrategy?.entry_conditions || {
      operator: 'AND',
      conditions: []
    }
  );

  const [exitConditions, setExitConditions] = useState<ConditionGroup>(
    editingStrategy?.exit_conditions || {
      operator: 'OR',
      conditions: []
    }
  );

  // Indicator Configuration
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(
    editingStrategy?.indicators_config || {
      useEMA: true,
      emaFast: 9,
      emaMiddle: 20,
      emaSlow: 50,
      ema200: false,

      useSMA: false,
      smaFast: 9,
      smaMiddle: 20,
      smaSlow: 50,
      sma200: false,

      useRSI: true,
      rsiPeriod: 14,

      useMACD: true,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,

      useBB: false,
      bbPeriod: 20,
      bbStdDev: 2,

      useADX: false,
      adxPeriod: 14,

      useATR: false,
      atrPeriod: 14,

      useStochastic: false,
      stochKPeriod: 14,
      stochDPeriod: 3,

      useVolume: true,
      volumePeriod: 20,

      useVWAP: false
    }
  );

  // Risk Management
  const [recommendedStopLoss, setRecommendedStopLoss] = useState(editingStrategy?.recommended_stop_loss_percent || 3.0);
  const [recommendedTarget, setRecommendedTarget] = useState(editingStrategy?.recommended_target_percent || 5.0);
  const [minCapital, setMinCapital] = useState(editingStrategy?.min_capital_required || 50000);
  const [recommendedTimeframes, setRecommendedTimeframes] = useState<string[]>(
    editingStrategy?.recommended_timeframes || ['5m', '15m']
  );

  const [showIndicatorConfig, setShowIndicatorConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect required indicators from conditions
  const getRequiredIndicators = () => {
    const allConditions = [
      ...entryConditions.conditions,
      ...exitConditions.conditions
    ];

    const indicators = new Set<string>();

    allConditions.forEach(condition => {
      const used = ExpressionParser.getUsedIndicators(condition.expression);
      used.forEach(ind => indicators.add(ind));
    });

    return Array.from(indicators);
  };

  // Validate strategy
  const validateStrategy = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!name.trim()) errors.push('Strategy name is required');
    if (!description.trim()) errors.push('Strategy description is required');
    if (entryConditions.conditions.length === 0) errors.push('At least one entry condition is required');
    if (exitConditions.conditions.length === 0) errors.push('At least one exit condition is required');

    // Validate all expressions
    entryConditions.conditions.forEach((cond, idx) => {
      const validation = ExpressionParser.validate(cond.expression);
      if (!validation.valid) {
        errors.push(`Entry condition ${idx + 1}: ${validation.error}`);
      }
    });

    exitConditions.conditions.forEach((cond, idx) => {
      const validation = ExpressionParser.validate(cond.expression);
      if (!validation.valid) {
        errors.push(`Exit condition ${idx + 1}: ${validation.error}`);
      }
    });

    return { valid: errors.length === 0, errors };
  };

  // Save or Update strategy
  const handleSave = async () => {
    const validation = validateStrategy();
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsSaving(true);

    try {
      const strategy = {
        name: name.trim(),
        description: description.trim(),
        category,
        entry_conditions: entryConditions,
        exit_conditions: exitConditions,
        indicators_config: indicatorConfig,
        recommended_stop_loss_percent: recommendedStopLoss,
        recommended_target_percent: recommendedTarget,
        min_capital_required: minCapital,
        recommended_timeframes: recommendedTimeframes,
        is_system: false,
        is_active: true,
        created_by: isEditMode ? editingStrategy.created_by : 'user'
      };

      if (isEditMode && strategyId) {
        // Update existing strategy
        await axios.put(`http://localhost:3001/api/strategies/${strategyId}`, strategy);
        toast.success('Strategy updated successfully!');
      } else {
        // Create new strategy
        await axios.post('http://localhost:3001/api/strategies', strategy);
        toast.success('Strategy saved successfully!');
      }

      navigate('/strategies');
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'save'} strategy`);
    } finally {
      setIsSaving(false);
    }
  };

  // Test strategy
  const handleTest = () => {
    const validation = validateStrategy();
    if (!validation.valid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    // Navigate to live simulation with this strategy
    navigate('/live-simulation', {
      state: {
        strategy: {
          strategy: {
            name: name.trim(),
            description: description.trim(),
            category,
            entry_conditions: entryConditions,
            exit_conditions: exitConditions,
            indicators_config: indicatorConfig,
            recommended_stop_loss_percent: recommendedStopLoss,
            recommended_target_percent: recommendedTarget
          }
        }
      }
    });
  };

  const requiredIndicators = getRequiredIndicators();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/strategies')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-purple-600" />
                {isEditMode ? 'Edit Strategy' : 'Professional Strategy Builder'}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode ? `Editing: ${editingStrategy.name}` : 'Create custom trading strategies with powerful expressions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Test Strategy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Strategy' : 'Save Strategy')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Strategy Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., 'RSI + EMA Crossover Strategy'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your strategy logic and expected behavior..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CUSTOM">Custom Strategy</option>
                  <option value="MEAN_REVERSION">Mean Reversion</option>
                  <option value="TREND_FOLLOWING">Trend Following</option>
                  <option value="VOLUME_BREAKOUT">Volume Breakout</option>
                  <option value="MOMENTUM">Momentum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Entry Conditions */}
          <ConditionBuilder
            value={entryConditions}
            onChange={setEntryConditions}
            title="📈 Entry Conditions"
            type="entry"
          />

          {/* Exit Conditions */}
          <ConditionBuilder
            value={exitConditions}
            onChange={setExitConditions}
            title="📉 Exit Conditions"
            type="exit"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Risk Management
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Stop Loss (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={recommendedStopLoss}
                  onChange={(e) => setRecommendedStopLoss(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recommended Target (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={recommendedTarget}
                  onChange={(e) => setRecommendedTarget(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Capital Required (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={minCapital}
                  onChange={(e) => setMinCapital(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk-Reward Ratio
                </label>
                <div className="text-2xl font-bold text-green-600">
                  1:{(recommendedTarget / recommendedStopLoss).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Timeframes */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Timeframes
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'].map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    if (recommendedTimeframes.includes(tf)) {
                      setRecommendedTimeframes(recommendedTimeframes.filter(t => t !== tf));
                    } else {
                      setRecommendedTimeframes([...recommendedTimeframes, tf]);
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    recommendedTimeframes.includes(tf)
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Required Indicators */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Required Indicators
            </h3>

            {requiredIndicators.length === 0 ? (
              <p className="text-sm text-gray-500">No indicators detected yet. Add conditions to see required indicators.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {requiredIndicators.map(indicator => (
                  <span key={indicator} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    {indicator}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowIndicatorConfig(!showIndicatorConfig)}
              className="mt-4 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Configure Indicators
            </button>
          </div>

          {/* Strategy Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Strategy Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Entry Conditions:</span>
                <span className="font-semibold">{entryConditions.conditions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Exit Conditions:</span>
                <span className="font-semibold">{exitConditions.conditions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Required Indicators:</span>
                <span className="font-semibold">{requiredIndicators.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk-Reward:</span>
                <span className="font-semibold text-green-600">1:{(recommendedTarget / recommendedStopLoss).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Config Modal */}
      {showIndicatorConfig && (
        <IndicatorConfigModal
          config={indicatorConfig}
          onChange={setIndicatorConfig}
          onClose={() => setShowIndicatorConfig(false)}
        />
      )}
    </div>
  );
}

// Indicator Configuration Modal Component
interface IndicatorConfigModalProps {
  config: IndicatorConfig;
  onChange: (config: IndicatorConfig) => void;
  onClose: () => void;
}

function IndicatorConfigModal({ config, onChange, onClose }: IndicatorConfigModalProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onChange(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Configure Indicators</h2>
          <p className="text-sm text-gray-600 mt-1">Customize indicator parameters for your strategy</p>
        </div>

        <div className="p-6 space-y-6">
          {/* EMA Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Exponential Moving Average (EMA)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.useEMA}
                  onChange={(e) => setLocalConfig({ ...localConfig, useEMA: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable</span>
              </label>
            </div>
            {localConfig.useEMA && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fast Period</label>
                  <input
                    type="number"
                    value={localConfig.emaFast}
                    onChange={(e) => setLocalConfig({ ...localConfig, emaFast: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Middle Period</label>
                  <input
                    type="number"
                    value={localConfig.emaMiddle}
                    onChange={(e) => setLocalConfig({ ...localConfig, emaMiddle: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Slow Period</label>
                  <input
                    type="number"
                    value={localConfig.emaSlow}
                    onChange={(e) => setLocalConfig({ ...localConfig, emaSlow: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localConfig.ema200}
                      onChange={(e) => setLocalConfig({ ...localConfig, ema200: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs text-gray-700">EMA 200</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* RSI Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Relative Strength Index (RSI)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.useRSI}
                  onChange={(e) => setLocalConfig({ ...localConfig, useRSI: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable</span>
              </label>
            </div>
            {localConfig.useRSI && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">RSI Period</label>
                <input
                  type="number"
                  value={localConfig.rsiPeriod}
                  onChange={(e) => setLocalConfig({ ...localConfig, rsiPeriod: parseInt(e.target.value) })}
                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* MACD Configuration */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">MACD</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.useMACD}
                  onChange={(e) => setLocalConfig({ ...localConfig, useMACD: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable</span>
              </label>
            </div>
            {localConfig.useMACD && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fast Period</label>
                  <input
                    type="number"
                    value={localConfig.macdFast}
                    onChange={(e) => setLocalConfig({ ...localConfig, macdFast: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Slow Period</label>
                  <input
                    type="number"
                    value={localConfig.macdSlow}
                    onChange={(e) => setLocalConfig({ ...localConfig, macdSlow: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Signal Period</label>
                  <input
                    type="number"
                    value={localConfig.macdSignal}
                    onChange={(e) => setLocalConfig({ ...localConfig, macdSignal: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Volume */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Volume</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.useVolume}
                  onChange={(e) => setLocalConfig({ ...localConfig, useVolume: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable</span>
              </label>
            </div>
            {localConfig.useVolume && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Volume Average Period</label>
                <input
                  type="number"
                  value={localConfig.volumePeriod}
                  onChange={(e) => setLocalConfig({ ...localConfig, volumePeriod: parseInt(e.target.value) })}
                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
