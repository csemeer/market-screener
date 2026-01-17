import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, TrendingUp, BarChart3, Activity, Target, Info } from 'lucide-react';
import { strategyAPI } from '../../api/client';
import EntryConditionsBuilder from './EntryConditionsBuilder';
import ExitConditionsBuilder from './ExitConditionsBuilder';
import IndicatorConfigurator from './IndicatorConfigurator';

interface Strategy {
  id?: number;
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
  is_system?: boolean;
}

interface StrategyBuilderProps {
  strategy: Strategy | null;
  onClose: (saved: boolean) => void;
}

export default function StrategyBuilder({ strategy, onClose }: StrategyBuilderProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'entry' | 'exit' | 'indicators' | 'risk'>('basic');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<Strategy>({
    name: strategy?.name || '',
    description: strategy?.description || '',
    category: strategy?.category || 'CUSTOM',
    entry_conditions: strategy?.entry_conditions || { type: 'CUSTOM', conditions: [] },
    exit_conditions: strategy?.exit_conditions || {
      targetPercent: 2.0,
      stopLossPercent: 1.0,
      useTrailingStop: false,
      maxHoldTimeMinutes: 60
    },
    indicators_config: strategy?.indicators_config || {
      useEMA: true,
      emaFast: 9,
      emaMiddle: 20,
      emaSlow: 50,
      useRSI: true,
      rsiPeriod: 14,
      useMACD: true,
      macdFast: 12,
      macdSlow: 26,
      macdSignal: 9,
      useVolume: true,
      volumePeriod: 20
    },
    recommended_timeframes: strategy?.recommended_timeframes || ['5m', '15m'],
    recommended_stop_loss_percent: strategy?.recommended_stop_loss_percent || 1.0,
    recommended_target_percent: strategy?.recommended_target_percent || 2.0,
    min_capital_required: strategy?.min_capital_required || 50000
  });

  const isReadOnly = strategy?.is_system || false;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Strategy name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (formData.recommended_stop_loss_percent >= formData.recommended_target_percent) {
      newErrors.risk = 'Target must be greater than stop loss for positive risk/reward ratio';
    }

    if (formData.recommended_stop_loss_percent <= 0 || formData.recommended_stop_loss_percent > 100) {
      newErrors.stopLoss = 'Stop loss must be between 0 and 100%';
    }

    if (formData.recommended_target_percent <= 0 || formData.recommended_target_percent > 100) {
      newErrors.target = 'Target must be between 0 and 100%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (isReadOnly) {
      onClose(false);
      return;
    }

    if (!validateForm()) {
      alert('Please fix the errors before saving');
      return;
    }

    try {
      setLoading(true);

      // Sync exit conditions with recommended values
      const dataToSave = {
        ...formData,
        exit_conditions: {
          ...formData.exit_conditions,
          targetPercent: formData.recommended_target_percent,
          stopLossPercent: formData.recommended_stop_loss_percent
        }
      };

      if (strategy?.id) {
        // Update existing strategy
        await strategyAPI.updateStrategy(strategy.id, dataToSave);
        alert('Strategy updated successfully!');
      } else {
        // Create new strategy
        await strategyAPI.createStrategy(dataToSave);
        alert('Strategy created successfully!');
      }

      onClose(true);
    } catch (error: any) {
      console.error('Error saving strategy:', error);
      alert(error.response?.data?.error || 'Failed to save strategy');
    } finally {
      setLoading(false);
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

  const riskRewardRatio = formData.recommended_stop_loss_percent > 0
    ? (formData.recommended_target_percent / formData.recommended_stop_loss_percent).toFixed(2)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                {getCategoryIcon(formData.category)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isReadOnly ? 'View Strategy' : strategy?.id ? 'Edit Strategy' : 'Create New Strategy'}
                </h1>
                <p className="text-gray-600">
                  {isReadOnly ? 'System strategies are read-only. Clone to create a custom version.' : 'Build your custom trading strategy'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onClose(false)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isReadOnly && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>System Strategy:</strong> This is a built-in strategy and cannot be modified.
                You can clone it to create your own customizable version.
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'basic'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('entry')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'entry'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Entry Conditions
              </button>
              <button
                onClick={() => setActiveTab('exit')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'exit'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Exit Conditions
              </button>
              <button
                onClick={() => setActiveTab('indicators')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'indicators'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Indicators
              </button>
              <button
                onClick={() => setActiveTab('risk')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'risk'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Risk Management
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strategy Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50 text-gray-600' : ''}`}
                      placeholder="e.g., My Custom Breakout Strategy"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50 text-gray-600' : ''}`}
                    >
                      <option value="MEAN_REVERSION">Mean Reversion</option>
                      <option value="TREND_FOLLOWING">Trend Following</option>
                      <option value="VOLUME_BREAKOUT">Volume Breakout</option>
                      <option value="MOMENTUM">Momentum</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isReadOnly}
                    rows={4}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    } ${isReadOnly ? 'bg-gray-50 text-gray-600' : ''}`}
                    placeholder="Describe your strategy, its approach, and ideal market conditions..."
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommended Timeframes
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'].map(tf => (
                      <label key={tf} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.recommended_timeframes.includes(tf)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                recommended_timeframes: [...formData.recommended_timeframes, tf]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                recommended_timeframes: formData.recommended_timeframes.filter(t => t !== tf)
                              });
                            }
                          }}
                          disabled={isReadOnly}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{tf}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Capital Required (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.min_capital_required}
                    onChange={(e) => setFormData({ ...formData, min_capital_required: parseInt(e.target.value) })}
                    disabled={isReadOnly}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      isReadOnly ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>
            )}

            {/* Entry Conditions Tab */}
            {activeTab === 'entry' && (
              <EntryConditionsBuilder
                conditions={formData.entry_conditions}
                onChange={(conditions) => setFormData({ ...formData, entry_conditions: conditions })}
                readOnly={isReadOnly}
              />
            )}

            {/* Exit Conditions Tab */}
            {activeTab === 'exit' && (
              <ExitConditionsBuilder
                conditions={formData.exit_conditions}
                onChange={(conditions) => setFormData({ ...formData, exit_conditions: conditions })}
                readOnly={isReadOnly}
              />
            )}

            {/* Indicators Tab */}
            {activeTab === 'indicators' && (
              <IndicatorConfigurator
                config={formData.indicators_config}
                onChange={(config) => setFormData({ ...formData, indicators_config: config })}
                readOnly={isReadOnly}
              />
            )}

            {/* Risk Management Tab */}
            {activeTab === 'risk' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <strong>Risk Management:</strong> These values determine your stop loss and profit targets.
                    A good risk/reward ratio is 2:1 or higher (target is 2x the stop loss).
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stop Loss % <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.recommended_stop_loss_percent}
                      onChange={(e) => setFormData({
                        ...formData,
                        recommended_stop_loss_percent: parseFloat(e.target.value)
                      })}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.stopLoss ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50 text-gray-600' : ''}`}
                      step="0.1"
                      min="0.1"
                      max="100"
                    />
                    {errors.stopLoss && <p className="text-red-500 text-sm mt-1">{errors.stopLoss}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum loss per trade
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profit Target % <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.recommended_target_percent}
                      onChange={(e) => setFormData({
                        ...formData,
                        recommended_target_percent: parseFloat(e.target.value)
                      })}
                      disabled={isReadOnly}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.target ? 'border-red-500' : 'border-gray-300'
                      } ${isReadOnly ? 'bg-gray-50 text-gray-600' : ''}`}
                      step="0.1"
                      min="0.1"
                      max="100"
                    />
                    {errors.target && <p className="text-red-500 text-sm mt-1">{errors.target}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Profit target per trade
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk/Reward Ratio
                    </label>
                    <div className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 ${
                      parseFloat(riskRewardRatio) >= 2 ? 'text-green-600' :
                      parseFloat(riskRewardRatio) >= 1.5 ? 'text-yellow-600' : 'text-red-600'
                    } font-semibold text-lg flex items-center justify-center`}>
                      1:{riskRewardRatio}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {parseFloat(riskRewardRatio) >= 2 ? '✓ Excellent ratio' :
                       parseFloat(riskRewardRatio) >= 1.5 ? '⚠ Acceptable ratio' : '❌ Poor ratio'}
                    </p>
                  </div>
                </div>

                {errors.risk && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{errors.risk}</p>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Risk Management Guidelines</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Keep stop loss tight (0.5-2% for scalping, 2-5% for swing trading)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Target should be at least 2x your stop loss (2:1 risk/reward minimum)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Higher risk/reward ratios (3:1, 4:1) are ideal for long-term profitability</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>Use trailing stops to protect profits as price moves in your favor</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => onClose(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            {isReadOnly ? 'Close' : 'Cancel'}
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : strategy?.id ? 'Update Strategy' : 'Create Strategy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
