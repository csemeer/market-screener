import { useState, useEffect } from 'react';
import { AlertCircle, Download } from 'lucide-react';
import { scalperAPI } from '../../api/client';

interface Trade {
  id: number;
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  status: string;
  closeReason?: string;
  grossPnL?: number;
  netPnL?: number;
  pnlPercent?: number;
  entryTime: string;
  exitTime?: string;
  executionMode: string;
}

interface ScalperTradesProps {
  scalperId: number;
}

export default function ScalperTrades({ scalperId }: ScalperTradesProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  useEffect(() => {
    loadTrades();
  }, [scalperId, filter]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const status = filter === 'ALL' ? undefined : filter;
      const response = await scalperAPI.getTrades(scalperId, status as any);
      setTrades(response.data.trades || []);
    } catch (error) {
      console.error('Error loading trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCloseReasonBadge = (reason?: string) => {
    if (!reason) return null;

    const badges: Record<string, { bg: string; text: string; label: string }> = {
      TARGET_HIT: { bg: 'bg-green-100', text: 'text-green-700', label: 'Target Hit' },
      STOP_LOSS: { bg: 'bg-red-100', text: 'text-red-700', label: 'Stop Loss' },
      TIME_EXIT: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Time Exit' },
      MANUAL: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manual Exit' },
      EMERGENCY_EXIT: { bg: 'bg-red-100', text: 'text-red-700', label: 'Emergency' },
    };

    const badge = badges[reason] || { bg: 'bg-gray-100', text: 'text-gray-700', label: reason };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      OPEN: { bg: 'bg-blue-100', text: 'text-blue-700' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-700' },
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
      FAILED: { bg: 'bg-red-100', text: 'text-red-700' },
    };

    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>
        {status}
      </span>
    );
  };

  const stats = {
    total: trades.length,
    wins: trades.filter(t => (t.grossPnL || 0) > 0).length,
    losses: trades.filter(t => (t.grossPnL || 0) < 0).length,
    totalPnL: trades.reduce((sum, t) => sum + (t.netPnL || 0), 0),
    winRate: trades.length > 0
      ? ((trades.filter(t => (t.grossPnL || 0) > 0).length / trades.length) * 100)
      : 0,
  };

  if (loading) {
    return <div className="text-center py-8">Loading trades...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Trades</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Wins</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.wins}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Losses</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.losses}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Win Rate</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total P&L</div>
          <div className={`text-2xl font-bold mt-1 ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₹{stats.totalPnL.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['ALL', 'OPEN', 'CLOSED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Trades Table */}
      {trades.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No Trades Found</p>
          <p className="text-gray-500 text-sm mt-2">
            {filter === 'OPEN' ? 'No open trades at the moment' : 'Trade history will appear here'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Side</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entry</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Exit</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SL</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P&L %</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Exit Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-900">{trade.symbol}</div>
                      <div className="text-xs text-gray-500">{trade.exchange}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-medium">{trade.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">₹{trade.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {trade.exitPrice ? `₹${trade.exitPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-red-600">
                      ₹{trade.stopLoss.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-green-600">
                      ₹{trade.target.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {trade.netPnL !== undefined ? (
                        <span className={`font-bold ${trade.netPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.netPnL >= 0 ? '+' : ''}₹{trade.netPnL.toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {trade.pnlPercent !== undefined ? (
                        <span className={`font-bold ${trade.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {getStatusBadge(trade.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {getCloseReasonBadge(trade.closeReason)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {new Date(trade.entryTime).toLocaleString()}
                      </div>
                      {trade.exitTime && (
                        <div className="text-xs text-gray-500">
                          {new Date(trade.exitTime).toLocaleString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
