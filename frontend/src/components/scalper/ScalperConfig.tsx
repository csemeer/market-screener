import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { scalperAPI } from '../../api/client';

interface ScalperConfigProps {
  scalperId: number;
  onUpdate?: () => void;
}

export default function ScalperConfig({ scalperId }: ScalperConfigProps) {
  const [config, setConfig] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStock, setNewStock] = useState({ symbol: '', exchange: 'NSE' });

  useEffect(() => {
    loadConfig();
    loadStocks();
  }, [scalperId]);

  const loadConfig = async () => {
    try {
      const response = await scalperAPI.getConfig(scalperId);
      setConfig(response.data.config);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStocks = async () => {
    try {
      const response = await scalperAPI.getStocks(scalperId);
      setStocks(response.data.stocks || []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const handleAddStock = async () => {
    if (!newStock.symbol) {
      alert('Please enter a stock symbol');
      return;
    }

    try {
      await scalperAPI.addStock(scalperId, {
        symbol: newStock.symbol.toUpperCase(),
        exchange: newStock.exchange,
      });
      setNewStock({ symbol: '', exchange: 'NSE' });
      loadStocks();
      alert(`✅ ${newStock.symbol} added successfully`);
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock');
    }
  };

  const handleRemoveStock = async (stockId: number, symbol: string) => {
    if (!confirm(`Remove ${symbol} from watchlist?`)) return;

    try {
      await scalperAPI.removeStock(scalperId, stockId);
      loadStocks();
    } catch (error) {
      console.error('Error removing stock:', error);
      alert('Failed to remove stock');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading configuration...</div>;
  }

  if (!config) {
    return <div className="text-center py-8 text-red-600">Configuration not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scalper Name</label>
            <input
              type="text"
              value={config.name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Broker</label>
            <input
              type="text"
              value={config.broker?.toUpperCase()}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account ID</label>
            <input
              type="text"
              value={config.accountId}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auto-Trade</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.autoTrade}
                disabled
                className="w-5 h-5"
              />
              <span className={`font-semibold ${config.autoTrade ? 'text-green-600' : 'text-gray-600'}`}>
                {config.autoTrade ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Configuration */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Strategy</label>
            <input
              type="text"
              value={config.strategy?.name || 'Breakout Scalper'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
            <input
              type="text"
              value={config.strategy?.timeframe || '5m'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exit Target</label>
            <input
              type="text"
              value={`${config.strategy?.exitConditions?.targetPercent || 0.7}%`}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Position Size</label>
            <input
              type="text"
              value={`₹${(config.riskManagement?.maxPositionSize || 10000).toLocaleString()}`}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Open Positions</label>
            <input
              type="text"
              value={config.riskManagement?.maxPositionsOpen || 3}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Daily Loss</label>
            <input
              type="text"
              value={`₹${(config.riskManagement?.maxDailyLoss || 5000).toLocaleString()}`}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Daily Trades</label>
            <input
              type="text"
              value={config.riskManagement?.maxDailyTrades || 20}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Trading Hours */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              type="text"
              value={config.tradingHours?.startTime || '09:30'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
            <input
              type="text"
              value={config.tradingHours?.endTime || '15:15'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avoid First (min)</label>
            <input
              type="text"
              value={config.tradingHours?.avoidFirstMinutes || 15}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avoid Last (min)</label>
            <input
              type="text"
              value={config.tradingHours?.avoidLastMinutes || 15}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Stock Watchlist */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Watchlist</h3>

        {/* Add Stock Form */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Stock Symbol (e.g., RELIANCE)"
                value={newStock.symbol}
                onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <select
                value={newStock.exchange}
                onChange={(e) => setNewStock({ ...newStock, exchange: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="NYSE">NYSE</option>
                <option value="NASDAQ">NASDAQ</option>
              </select>
            </div>
            <button
              onClick={handleAddStock}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Stock
            </button>
          </div>
        </div>

        {/* Stock List */}
        {stocks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500">No stocks added yet. Add stocks above to start tracking.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-lg">{stock.symbol}</div>
                    <div className="text-sm text-gray-600">{stock.exchange}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Trades: </span>
                        <span className="font-semibold">{stock.totalTrades || 0}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Win Rate: </span>
                        <span className="font-semibold">{stock.winRate?.toFixed(1) || 0}%</span>
                      </div>
                    </div>
                    <div className="mt-1 text-sm">
                      <span className="text-gray-600">P&L: </span>
                      <span className={`font-semibold ${(stock.totalPnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(stock.totalPnl || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStock(stock.id, stock.symbol)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paper Trading Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-yellow-600 font-semibold">⚠️ Paper Trading Mode</div>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          All trades are currently simulated. No real broker connection is active. This is perfect for testing your strategy without risk.
        </p>
      </div>
    </div>
  );
}
