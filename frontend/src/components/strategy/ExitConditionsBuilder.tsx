import { Info } from 'lucide-react';

interface ExitConditionsBuilderProps {
  conditions: any;
  onChange: (conditions: any) => void;
  readOnly?: boolean;
}

export default function ExitConditionsBuilder({ conditions, onChange, readOnly = false }: ExitConditionsBuilderProps) {
  const updateCondition = (field: string, value: any) => {
    onChange({ ...conditions, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Exit Conditions:</strong> Define when to exit trades to protect capital and lock in profits.
          Multiple exit conditions work together to maximize profit and minimize loss.
        </div>
      </div>

      {/* Profit Target & Stop Loss */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">Primary Exit Levels</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profit Target % <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={conditions.targetPercent || 2.0}
              onChange={(e) => updateCondition('targetPercent', parseFloat(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              step="0.1"
              min="0.1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exit when profit reaches this percentage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stop Loss % <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={conditions.stopLossPercent || 1.0}
              onChange={(e) => updateCondition('stopLossPercent', parseFloat(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              step="0.1"
              min="0.1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exit when loss reaches this percentage
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-3 bg-white border border-gray-300 rounded-lg">
          <div className="text-sm text-gray-600">
            Risk/Reward Ratio:{' '}
            <span className={`font-semibold ${
              (conditions.targetPercent / conditions.stopLossPercent) >= 2 ? 'text-green-600' :
              (conditions.targetPercent / conditions.stopLossPercent) >= 1.5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              1:{((conditions.targetPercent || 2.0) / (conditions.stopLossPercent || 1.0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Trailing Stop */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Trailing Stop</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={conditions.useTrailingStop === true}
              onChange={(e) => updateCondition('useTrailingStop', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable trailing stop</span>
          </label>
        </div>

        {conditions.useTrailingStop && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Trailing stop automatically raises your stop loss as the price moves in your favor,
              protecting profits while giving the trade room to grow.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activation Profit %
              </label>
              <input
                type="number"
                value={conditions.trailingStopActivationPercent || 1.0}
                onChange={(e) => updateCondition('trailingStopActivationPercent', parseFloat(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                step="0.1"
                min="0.1"
                max="50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Trailing stop activates after this much profit
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trailing Distance %
              </label>
              <input
                type="number"
                value={conditions.trailingStopDistance || 0.5}
                onChange={(e) => updateCondition('trailingStopDistance', parseFloat(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                step="0.1"
                min="0.1"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">
                Distance from current price to trailing stop
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Time-Based Exit */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900">Time-Based Exit</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Hold Time (minutes)
          </label>
          <input
            type="number"
            value={conditions.maxHoldTimeMinutes || 60}
            onChange={(e) => updateCondition('maxHoldTimeMinutes', parseInt(e.target.value))}
            disabled={readOnly}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
            min="5"
            max="1440"
            step="5"
          />
          <p className="text-xs text-gray-500 mt-1">
            Exit trade after this many minutes regardless of profit/loss (0 = no time limit)
          </p>
        </div>
      </div>

      {/* Partial Exits */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Partial Exits (Scale Out)</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={conditions.usePartialExits === true}
              onChange={(e) => updateCondition('usePartialExits', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable partial exits</span>
          </label>
        </div>

        {conditions.usePartialExits && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Take partial profits at multiple levels to lock in gains while keeping exposure for larger moves.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Exit % (profit level)
                </label>
                <input
                  type="number"
                  value={conditions.partialExit1Percent || 1.0}
                  onChange={(e) => updateCondition('partialExit1Percent', parseFloat(e.target.value))}
                  disabled={readOnly}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exit Quantity %
                </label>
                <input
                  type="number"
                  value={conditions.partialExit1Quantity || 50}
                  onChange={(e) => updateCondition('partialExit1Quantity', parseInt(e.target.value))}
                  disabled={readOnly}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                  min="10"
                  max="90"
                  step="10"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Exit Conditions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-gray-900">Advanced Exit Signals</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.exitOnMACDReversal === true}
            onChange={(e) => updateCondition('exitOnMACDReversal', e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Exit on MACD bearish crossover</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.exitOnRSIOverbought === true}
            onChange={(e) => updateCondition('exitOnRSIOverbought', e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Exit when RSI becomes overbought (&gt; 70)</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.exitOnEMABreak === true}
            onChange={(e) => updateCondition('exitOnEMABreak', e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Exit when price closes below EMA9</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={conditions.exitOnVolumeSpike === true}
            onChange={(e) => updateCondition('exitOnVolumeSpike', e.target.checked)}
            disabled={readOnly}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Exit on unusual volume spike (potential reversal)</span>
        </label>
      </div>

      {/* Exit Strategy Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Exit Strategy Summary</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <div>✓ Profit Target: {conditions.targetPercent}%</div>
          <div>✓ Stop Loss: {conditions.stopLossPercent}%</div>
          {conditions.useTrailingStop && <div>✓ Trailing stop enabled (activates at {conditions.trailingStopActivationPercent}%)</div>}
          {conditions.maxHoldTimeMinutes > 0 && <div>✓ Max hold time: {conditions.maxHoldTimeMinutes} minutes</div>}
          {conditions.usePartialExits && <div>✓ Partial exits enabled</div>}
          <div className="pt-2 mt-2 border-t border-blue-300">
            <strong>Risk/Reward:</strong> 1:{((conditions.targetPercent || 2.0) / (conditions.stopLossPercent || 1.0)).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
