import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { scalperAPI } from '../../api/client';

interface ScalperCreateFormProps {
  onSuccess: (scalperId: number) => void;
  onCancel: () => void;
}

export default function ScalperCreateForm({ onSuccess, onCancel }: ScalperCreateFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    broker: 'zerodha' as 'zerodha' | 'upstox' | 'ibkr',
    accountId: '',
    autoTrade: true,

    // Stock Selection
    stockSelectionMethod: 'MANUAL' as 'MANUAL' | 'AUTO_SCREENER',
    maxStocks: 5,

    // Strategy
    strategyName: 'Breakout Scalper',
    timeframe: '5m' as '1m' | '3m' | '5m',
    targetPercent: 0.7,
    stopLossPercent: 0.3,

    // Risk Management
    maxPositionSize: 50000,
    maxPositionsOpen: 3,
    maxDailyLoss: 5000,
    maxDailyTrades: 20,

    // Trading Hours
    tradingStartTime: '09:30',
    tradingEndTime: '15:15',
    avoidFirstMinutes: 15,
    avoidLastMinutes: 15,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.accountId) {
      alert('Please fill in required fields: Name and Account ID');
      return;
    }

    try {
      setLoading(true);

      const config = {
        name: formData.name,
        broker: formData.broker,
        accountId: formData.accountId,
        autoTrade: formData.autoTrade,
        stockSelection: {
          method: formData.stockSelectionMethod,
          maxStocks: formData.maxStocks,
        },
        strategy: {
          name: formData.strategyName,
          timeframe: formData.timeframe,
          indicators: {
            useEMA: true,
            emaFast: 9,
            emaSlow: 21,
            useRSI: true,
            rsiPeriod: 14,
            useVWAP: true,
          },
          entryConditions: {
            type: 'BREAKOUT',
            volumeConfirmation: true,
            minVolumeMultiplier: 1.5,
          },
          exitConditions: {
            targetPercent: formData.targetPercent,
            stopLossPercent: formData.stopLossPercent,
            useTrailingStop: false,
            maxHoldTimeMinutes: 30,
          },
        },
        riskManagement: {
          maxPositionSize: formData.maxPositionSize,
          maxPositionsOpen: formData.maxPositionsOpen,
          maxDailyLoss: formData.maxDailyLoss,
          maxDailyTrades: formData.maxDailyTrades,
          positionSizingMethod: 'FIXED',
          riskPerTrade: 1.0,
        },
        tradingHours: {
          startTime: formData.tradingStartTime,
          endTime: formData.tradingEndTime,
          avoidFirstMinutes: formData.avoidFirstMinutes,
          avoidLastMinutes: formData.avoidLastMinutes,
        },
      };

      const response = await scalperAPI.createConfig(config);
      alert(`✅ Scalper "${formData.name}" created successfully!`);
      onSuccess(response.data.id);
    } catch (error) {
      console.error('Error creating scalper:', error);
      alert('Failed to create scalper. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Scalper</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scalper Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Scalper 1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Broker <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.broker}
                onChange={(e) => setFormData({ ...formData, broker: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="zerodha">Zerodha</option>
                <option value="upstox">Upstox</option>
                <option value="ibkr">Interactive Brokers</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                placeholder="Your broker account ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Trade</label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.autoTrade}
                  onChange={(e) => setFormData({ ...formData, autoTrade: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable automatic trading</span>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Settings */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
              <input
                type="text"
                value={formData.strategyName}
                onChange={(e) => setFormData({ ...formData, strategyName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="1m">1 Minute</option>
                <option value="3m">3 Minutes</option>
                <option value="5m">5 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Stocks</label>
              <input
                type="number"
                value={formData.maxStocks}
                onChange={(e) => setFormData({ ...formData, maxStocks: parseInt(e.target.value) })}
                min="1"
                max="20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target % (per trade)
              </label>
              <input
                type="number"
                value={formData.targetPercent}
                onChange={(e) => setFormData({ ...formData, targetPercent: parseFloat(e.target.value) })}
                step="0.1"
                min="0.1"
                max="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Loss % (per trade)
              </label>
              <input
                type="number"
                value={formData.stopLossPercent}
                onChange={(e) => setFormData({ ...formData, stopLossPercent: parseFloat(e.target.value) })}
                step="0.1"
                min="0.1"
                max="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Risk Management */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Position Size (₹)
              </label>
              <input
                type="number"
                value={formData.maxPositionSize}
                onChange={(e) => setFormData({ ...formData, maxPositionSize: parseInt(e.target.value) })}
                step="1000"
                min="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Open Positions
              </label>
              <input
                type="number"
                value={formData.maxPositionsOpen}
                onChange={(e) => setFormData({ ...formData, maxPositionsOpen: parseInt(e.target.value) })}
                min="1"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Loss (₹)
              </label>
              <input
                type="number"
                value={formData.maxDailyLoss}
                onChange={(e) => setFormData({ ...formData, maxDailyLoss: parseInt(e.target.value) })}
                step="500"
                min="500"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Trades
              </label>
              <input
                type="number"
                value={formData.maxDailyTrades}
                onChange={(e) => setFormData({ ...formData, maxDailyTrades: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Trading Hours */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
              <input
                type="time"
                value={formData.tradingStartTime}
                onChange={(e) => setFormData({ ...formData, tradingStartTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
              <input
                type="time"
                value={formData.tradingEndTime}
                onChange={(e) => setFormData({ ...formData, tradingEndTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avoid First (min)
              </label>
              <input
                type="number"
                value={formData.avoidFirstMinutes}
                onChange={(e) => setFormData({ ...formData, avoidFirstMinutes: parseInt(e.target.value) })}
                min="0"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avoid Last (min)
              </label>
              <input
                type="number"
                value={formData.avoidLastMinutes}
                onChange={(e) => setFormData({ ...formData, avoidLastMinutes: parseInt(e.target.value) })}
                min="0"
                max="60"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Paper Trading Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 font-semibold">ℹ️ Paper Trading Mode</div>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            This scalper will run in paper trading mode (simulated trading with no real money).
            Perfect for testing strategies risk-free!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-4 border-t pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Scalper'}
          </button>
        </div>
      </form>
    </div>
  );
}
