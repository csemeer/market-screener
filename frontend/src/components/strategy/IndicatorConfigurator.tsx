import { Info, TrendingUp, Activity, BarChart3 } from 'lucide-react';

interface IndicatorConfiguratorProps {
  config: any;
  onChange: (config: any) => void;
  readOnly?: boolean;
}

export default function IndicatorConfigurator({ config, onChange, readOnly = false }: IndicatorConfiguratorProps) {
  const updateConfig = (field: string, value: any) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong>Technical Indicators:</strong> Select and configure the indicators used in your strategy.
          More indicators provide confirmation but may reduce trading opportunities.
        </div>
      </div>

      {/* EMA Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Exponential Moving Average (EMA)</h3>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useEMA !== false}
              onChange={(e) => updateConfig('useEMA', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable EMA</span>
          </label>
        </div>

        {config.useEMA !== false && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fast EMA Period
              </label>
              <input
                type="number"
                value={config.emaFast || 9}
                onChange={(e) => updateConfig('emaFast', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="3"
                max="50"
              />
              <p className="text-xs text-gray-500 mt-1">Short-term trend (typically 9)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Middle EMA Period
              </label>
              <input
                type="number"
                value={config.emaMiddle || 20}
                onChange={(e) => updateConfig('emaMiddle', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="10"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Medium-term trend (typically 20)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slow EMA Period
              </label>
              <input
                type="number"
                value={config.emaSlow || 50}
                onChange={(e) => updateConfig('emaSlow', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="20"
                max="200"
              />
              <p className="text-xs text-gray-500 mt-1">Long-term trend (typically 50)</p>
            </div>
          </div>
        )}
      </div>

      {/* RSI Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900">Relative Strength Index (RSI)</h3>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useRSI !== false}
              onChange={(e) => updateConfig('useRSI', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable RSI</span>
          </label>
        </div>

        {config.useRSI !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RSI Period
            </label>
            <input
              type="number"
              value={config.rsiPeriod || 14}
              onChange={(e) => updateConfig('rsiPeriod', parseInt(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              min="7"
              max="30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Standard is 14. Lower values (7-10) are more sensitive, higher values (20-30) are smoother.
            </p>
          </div>
        )}
      </div>

      {/* MACD Configuration */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">MACD (Moving Average Convergence Divergence)</h3>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useMACD === true}
              onChange={(e) => updateConfig('useMACD', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable MACD</span>
          </label>
        </div>

        {config.useMACD === true && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fast Period
              </label>
              <input
                type="number"
                value={config.macdFast || 12}
                onChange={(e) => updateConfig('macdFast', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="6"
                max="24"
              />
              <p className="text-xs text-gray-500 mt-1">Standard: 12</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slow Period
              </label>
              <input
                type="number"
                value={config.macdSlow || 26}
                onChange={(e) => updateConfig('macdSlow', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="13"
                max="50"
              />
              <p className="text-xs text-gray-500 mt-1">Standard: 26</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signal Period
              </label>
              <input
                type="number"
                value={config.macdSignal || 9}
                onChange={(e) => updateConfig('macdSignal', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="5"
                max="20"
              />
              <p className="text-xs text-gray-500 mt-1">Standard: 9</p>
            </div>
          </div>
        )}
      </div>

      {/* Bollinger Bands */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Bollinger Bands</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useBB === true}
              onChange={(e) => updateConfig('useBB', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable Bollinger Bands</span>
          </label>
        </div>

        {config.useBB === true && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <input
                type="number"
                value={config.bbPeriod || 20}
                onChange={(e) => updateConfig('bbPeriod', parseInt(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                min="10"
                max="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Deviations
              </label>
              <input
                type="number"
                value={config.bbStdDev || 2}
                onChange={(e) => updateConfig('bbStdDev', parseFloat(e.target.value))}
                disabled={readOnly}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
                step="0.1"
                min="1"
                max="3"
              />
            </div>
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Volume Analysis</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useVolume !== false}
              onChange={(e) => updateConfig('useVolume', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable Volume Analysis</span>
          </label>
        </div>

        {config.useVolume !== false && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume Average Period
            </label>
            <input
              type="number"
              value={config.volumePeriod || 20}
              onChange={(e) => updateConfig('volumePeriod', parseInt(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              min="10"
              max="50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Period for calculating average volume
            </p>
          </div>
        )}
      </div>

      {/* VWAP */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">VWAP (Volume Weighted Average Price)</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useVWAP === true}
              onChange={(e) => updateConfig('useVWAP', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable VWAP</span>
          </label>
        </div>

        {config.useVWAP === true && (
          <p className="text-sm text-gray-600">
            VWAP is calculated from the start of the trading session. It helps identify the average price
            weighted by volume, useful for institutional trading levels.
          </p>
        )}
      </div>

      {/* ADX */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">ADX (Average Directional Index)</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.useADX === true}
              onChange={(e) => updateConfig('useADX', e.target.checked)}
              disabled={readOnly}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable ADX</span>
          </label>
        </div>

        {config.useADX === true && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ADX Period
            </label>
            <input
              type="number"
              value={config.adxPeriod || 14}
              onChange={(e) => updateConfig('adxPeriod', parseInt(e.target.value))}
              disabled={readOnly}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${readOnly ? 'bg-gray-50' : ''}`}
              min="7"
              max="30"
            />
            <p className="text-xs text-gray-500 mt-1">
              ADX measures trend strength. Values above 25 indicate strong trend.
            </p>
          </div>
        )}
      </div>

      {/* Indicator Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Active Indicators Summary</h3>
        <div className="text-sm text-blue-800 space-y-1">
          {config.useEMA !== false && <div>✓ EMA ({config.emaFast}, {config.emaMiddle}, {config.emaSlow})</div>}
          {config.useRSI !== false && <div>✓ RSI ({config.rsiPeriod})</div>}
          {config.useMACD === true && <div>✓ MACD ({config.macdFast}, {config.macdSlow}, {config.macdSignal})</div>}
          {config.useBB === true && <div>✓ Bollinger Bands ({config.bbPeriod}, {config.bbStdDev}σ)</div>}
          {config.useVolume !== false && <div>✓ Volume Analysis ({config.volumePeriod})</div>}
          {config.useVWAP === true && <div>✓ VWAP</div>}
          {config.useADX === true && <div>✓ ADX ({config.adxPeriod})</div>}
        </div>
      </div>
    </div>
  );
}
