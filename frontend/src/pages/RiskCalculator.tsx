import { useState } from 'react';
import { Calculator, DollarSign, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { screenerAPI } from '../api/client';

export default function RiskCalculator() {
  const [accountSize, setAccountSize] = useState<number>(10000);
  const [riskPercentage, setRiskPercentage] = useState<number>(2);
  const [entryPrice, setEntryPrice] = useState<number>(100);
  const [stopLoss, setStopLoss] = useState<number>(95);
  const [result, setResult] = useState<any>(null);

  const calculateRisk = async () => {
    try {
      const res = await screenerAPI.calculateRisk({
        accountSize,
        riskPercentage,
        entryPrice,
        stopLoss,
      });
      setResult(res.data);
    } catch (error) {
      console.error('Error calculating risk:', error);
    }
  };

  const riskAmount = accountSize * (riskPercentage / 100);
  const riskPerShare = Math.abs(entryPrice - stopLoss);
  const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;
  const potentialLoss = positionSize * riskPerShare;
  const target = entryPrice + (riskPerShare * 2); // 2:1 R:R
  const potentialProfit = positionSize * (target - entryPrice);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Calculator className="w-8 h-8 mr-3 text-purple-600" />
          Risk Management Calculator
        </h1>
        <p className="text-gray-600">
          Calculate optimal position sizing and manage your trading risk effectively
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trade Parameters</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Size ($)
              </label>
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(Number(e.target.value))}
                className="input-field"
                placeholder="10000"
              />
              <p className="text-xs text-gray-500 mt-1">Total trading capital available</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Percentage (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(Number(e.target.value))}
                className="input-field"
                placeholder="2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 1-2% per trade. Maximum risk per trade.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entry Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="input-field"
                placeholder="100.00"
              />
              <p className="text-xs text-gray-500 mt-1">Price at which you plan to enter</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stop Loss ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={stopLoss}
                onChange={(e) => setStopLoss(Number(e.target.value))}
                className="input-field"
                placeholder="95.00"
              />
              <p className="text-xs text-gray-500 mt-1">Price at which you'll exit if wrong</p>
            </div>

            <button
              onClick={calculateRisk}
              className="btn-primary w-full"
            >
              Calculate Position Size
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {/* Position Size */}
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Recommended Position Size</h3>
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold mb-1">{positionSize} shares</div>
            <div className="text-sm opacity-90">
              Investment: ${(positionSize * entryPrice).toFixed(2)}
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-red-50 border border-red-200">
              <div className="flex items-center mb-2">
                <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                <h3 className="text-sm font-semibold text-red-900">Max Risk</h3>
              </div>
              <div className="text-2xl font-bold text-red-900">
                ${potentialLoss.toFixed(2)}
              </div>
              <div className="text-xs text-red-700 mt-1">
                {riskPercentage}% of account
              </div>
            </div>

            <div className="card bg-green-50 border border-green-200">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                <h3 className="text-sm font-semibold text-green-900">Potential Profit</h3>
              </div>
              <div className="text-2xl font-bold text-green-900">
                ${potentialProfit.toFixed(2)}
              </div>
              <div className="text-xs text-green-700 mt-1">
                At 2:1 R:R ratio
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Trade Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Risk per share:</span>
                <span className="font-medium text-gray-900">${riskPerShare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Risk amount (max loss):</span>
                <span className="font-medium text-red-600">${riskAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entry price:</span>
                <span className="font-medium text-gray-900">${entryPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stop loss:</span>
                <span className="font-medium text-red-600">${stopLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Target (2:1 R:R):</span>
                <span className="font-medium text-green-600">${target.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Total investment:</span>
                <span className="font-bold text-gray-900">${(positionSize * entryPrice).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          {riskPercentage > 3 && (
            <div className="card bg-yellow-50 border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">High Risk Warning</h3>
                  <p className="text-sm text-yellow-800">
                    You're risking more than 3% per trade. Consider reducing your risk percentage to preserve capital.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Education Section */}
      <div className="mt-8 card bg-blue-50 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Risk Management Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong className="block mb-1">1-2% Rule</strong>
            Risk only 1-2% of your total account on any single trade to protect your capital from significant drawdowns.
          </div>
          <div>
            <strong className="block mb-1">Position Sizing</strong>
            Calculate the exact number of shares based on your risk tolerance and stop loss distance.
          </div>
          <div>
            <strong className="block mb-1">R:R Ratio</strong>
            Aim for at least 2:1 reward-to-risk ratio. This means you can be right only 40% of the time and still profit.
          </div>
        </div>
      </div>

      {/* Advanced Tools */}
      <div className="mt-6 card">
        <h3 className="font-semibold text-gray-900 mb-3">Quick Reference Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Account Size</th>
                <th className="px-4 py-2 text-left">1% Risk</th>
                <th className="px-4 py-2 text-left">2% Risk</th>
                <th className="px-4 py-2 text-left">3% Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[5000, 10000, 25000, 50000, 100000].map((size) => (
                <tr key={size}>
                  <td className="px-4 py-2 font-medium">${size.toLocaleString()}</td>
                  <td className="px-4 py-2 text-green-600">${(size * 0.01).toFixed(2)}</td>
                  <td className="px-4 py-2 text-blue-600">${(size * 0.02).toFixed(2)}</td>
                  <td className="px-4 py-2 text-yellow-600">${(size * 0.03).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
