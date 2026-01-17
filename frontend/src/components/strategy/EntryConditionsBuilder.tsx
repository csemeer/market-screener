import { Info } from 'lucide-react';

interface EntryConditionsBuilderProps {
  conditions: any;
  onChange: (conditions: any) => void;
  readOnly?: boolean;
}

export default function EntryConditionsBuilder({ conditions, onChange, readOnly = false }: EntryConditionsBuilderProps) {
  const updateCondition = (field: string, value: any) => {
    onChange({ ...conditions, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Entry Conditions:</strong> Define the criteria that must be met before entering a trade.
          More selective conditions lead to higher quality trades but fewer opportunities.
        </div>
      </div>

      {/* Strategy Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Strategy Type <span className="text-red-500">*</span>
        </label>
        <select
          value={conditions.type || 'CUSTOM'}
          onChange={(e) => updateCondition('type', e.target.value)}
          disabled={readOnly}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
            readOnly ? 'bg-gray-50 text-gray-600' : ''
          }`}
        >
          <option value="MEAN_REVERSION">Mean Reversion</option>
          <option value="TREND_FOLLOWING">Trend Following</option>
          <option value="VOLUME_BREAKOUT">Volume Breakout</option>
          <option value="MOMENTUM">Momentum</option>
          <option value="BREAKOUT">Breakout</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      {/* Volume Breakout Specific */}
      {conditions.type === 'VOLUME_BREAKOUT' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Volume Breakout Settings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume Multiple (minimum volume spike required)
            </label>
            <input
              type="number"
              value={conditions.volumeMultiple || 2.0}
              onChange={(e) => updateCondition('volumeMultiple', parseFloat(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              step="0.1"
              min="1.0"
              max="10.0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current volume must be this many times the average volume
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.priceBreakout !== false}
                onChange={(e) => updateCondition('priceBreakout', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require price breakout of recent high</span>
            </label>
          </div>
        </div>
      )}

      {/* Mean Reversion Specific */}
      {conditions.type === 'MEAN_REVERSION' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Mean Reversion Settings</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSI Oversold Level
              </label>
              <input
                type="number"
                value={conditions.rsiOversold || 30}
                onChange={(e) => updateCondition('rsiOversold', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="10"
                max="40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSI Overbought Level
              </label>
              <input
                type="number"
                value={conditions.rsiOverbought || 70}
                onChange={(e) => updateCondition('rsiOverbought', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="60"
                max="90"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.bbPullback === true}
                onChange={(e) => updateCondition('bbPullback', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Use Bollinger Band pullback confirmation</span>
            </label>
          </div>
        </div>
      )}

      {/* Trend Following Specific */}
      {conditions.type === 'TREND_FOLLOWING' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Trend Following Settings</h3>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.emaCrossover !== false}
                onChange={(e) => updateCondition('emaCrossover', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require EMA crossover for entry</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ADX Minimum Strength
            </label>
            <input
              type="number"
              value={conditions.adxStrength || 25}
              onChange={(e) => updateCondition('adxStrength', parseInt(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              min="15"
              max="40"
            />
            <p className="text-xs text-gray-500 mt-1">
              ADX above this value indicates strong trend
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.volumeConfirmation === true}
                onChange={(e) => updateCondition('volumeConfirmation', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require volume confirmation</span>
            </label>
          </div>
        </div>
      )}

      {/* Momentum Specific */}
      {conditions.type === 'MOMENTUM' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="font-medium text-gray-900">Momentum Settings</h3>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.macdCrossover === true}
                onChange={(e) => updateCondition('macdCrossover', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require MACD bullish crossover</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Volume Multiple
            </label>
            <input
              type="number"
              value={conditions.minVolumeMultiplier || 2.5}
              onChange={(e) => updateCondition('minVolumeMultiplier', parseFloat(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              step="0.5"
              min="1.0"
              max="10.0"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.volumeConfirmation === true}
                onChange={(e) => updateCondition('volumeConfirmation', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require volume confirmation</span>
            </label>
          </div>
        </div>
      )}

      {/* Custom Entry */}
      {conditions.type === 'CUSTOM' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Custom Entry Conditions</h3>
          <p className="text-sm text-gray-600 mb-4">
            Define your custom entry logic. You can add specific conditions in the backend code
            or use a combination of existing indicator signals.
          </p>

          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={conditions.volumeConfirmation === true}
                onChange={(e) => updateCondition('volumeConfirmation', e.target.checked)}
                disabled={readOnly}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Require volume confirmation</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Volume Multiplier
              </label>
              <input
                type="number"
                value={conditions.minVolumeMultiplier || 1.5}
                onChange={(e) => updateCondition('minVolumeMultiplier', parseFloat(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                step="0.1"
                min="1.0"
                max="10.0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
