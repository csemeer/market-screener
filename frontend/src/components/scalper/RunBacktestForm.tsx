import { useState } from 'react';
import { Calendar, Play, X, TrendingUp, DollarSign } from 'lucide-react';
import { backtestAPI } from '../../api/client';

interface RunBacktestFormProps {
  scalperId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RunBacktestForm({ scalperId, onClose, onSuccess }: RunBacktestFormProps) {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    initialCapital: 100000,
    backtestType: 'PERIOD' as 'PERIOD' | 'INTRADAY' | 'CUSTOM',
  });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get date string in YYYY-MM-DD format
  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const handlePreset = (preset: '7d' | '30d' | '90d' | 'ytd' | 'lastday') => {
    const today = new Date();
    let startDate: string;
    let endDate: string = today.toISOString().split('T')[0];
    let backtestType: 'PERIOD' | 'INTRADAY' | 'CUSTOM' = 'PERIOD';

    switch (preset) {
      case '7d':
        startDate = getDateString(7);
        break;
      case '30d':
        startDate = getDateString(30);
        break;
      case '90d':
        startDate = getDateString(90);
        break;
      case 'ytd':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        startDate = yearStart.toISOString().split('T')[0];
        break;
      case 'lastday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(9, 15, 0, 0); // Market open
        startDate = yesterday.toISOString();

        const endOfDay = new Date(yesterday);
        endOfDay.setHours(15, 30, 0, 0); // Market close
        endDate = endOfDay.toISOString();

        backtestType = 'INTRADAY';
        break;
      default:
        startDate = getDateString(30);
    }

    setFormData({
      ...formData,
      startDate: startDate.split('T')[0],
      endDate: endDate.split('T')[0],
      backtestType,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.startDate || !formData.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    if (start >= end) {
      setError('Start date must be before end date');
      return;
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      setError('Date range cannot exceed 365 days');
      return;
    }

    if (formData.initialCapital < 10000) {
      setError('Initial capital must be at least ₹10,000');
      return;
    }

    if (formData.initialCapital > 10000000) {
      setError('Initial capital cannot exceed ₹1,00,00,000');
      return;
    }

    try {
      setRunning(true);
      await backtestAPI.runBacktest({
        scalperId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialCapital: formData.initialCapital,
        backtestType: formData.backtestType,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error running backtest:', error);
      setError(error.response?.data?.error || 'Failed to run backtest');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Run Custom Backtest</h2>
            <p className="text-sm text-gray-600 mt-1">
              Test strategy performance on historical data
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Preset Periods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Presets
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'lastday', label: 'Last Day', icon: Calendar },
                { id: '7d', label: '7 Days', icon: TrendingUp },
                { id: '30d', label: '30 Days', icon: TrendingUp },
                { id: '90d', label: '90 Days', icon: TrendingUp },
                { id: 'ytd', label: 'YTD', icon: Calendar },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePreset(preset.id as any)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center gap-1"
                >
                  <preset.icon className="w-4 h-4 text-gray-600" />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                max={getDateString(0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                max={getDateString(0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Backtest Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Backtest Type
            </label>
            <select
              value={formData.backtestType}
              onChange={(e) => setFormData({ ...formData, backtestType: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PERIOD">Period (Multiple Days)</option>
              <option value="INTRADAY">Intraday (Single Day)</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.backtestType === 'PERIOD' && 'Test strategy over multiple trading days'}
              {formData.backtestType === 'INTRADAY' && 'Test intraday strategy for a single day'}
              {formData.backtestType === 'CUSTOM' && 'Custom backtest configuration'}
            </p>
          </div>

          {/* Initial Capital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Capital *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="number"
                value={formData.initialCapital}
                onChange={(e) => setFormData({ ...formData, initialCapital: parseInt(e.target.value) || 0 })}
                min="10000"
                max="10000000"
                step="10000"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum: ₹10,000 • Maximum: ₹1,00,00,000
            </p>
          </div>

          {/* Date Range Info */}
          {formData.startDate && formData.endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    Backtest Period: {Math.ceil((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {new Date(formData.startDate).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                    {' → '}
                    {new Date(formData.endDate).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={running}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={running}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {running ? 'Running Backtest...' : 'Run Backtest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
