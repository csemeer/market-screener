import { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, Time } from 'lightweight-charts';
import { Activity, AlertCircle } from 'lucide-react';
import { scalperAPI, stockAPI } from '../../api/client';

interface ScalperChartProps {
  scalperId: number;
}

interface Trade {
  id: number;
  symbol: string;
  exchange: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  entryTime: string;
  exitTime?: string;
  status: string;
  side: 'BUY' | 'SELL';
}

export default function ScalperChart({ scalperId }: ScalperChartProps) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    loadStocks();
  }, [scalperId]);

  useEffect(() => {
    if (selectedStock) {
      loadTrades();
      loadChartData();
    }
  }, [selectedStock]);

  const loadStocks = async () => {
    try {
      const response = await scalperAPI.getStocks(scalperId);
      const stockList = response.data.stocks || [];
      setStocks(stockList);
      if (stockList.length > 0 && !selectedStock) {
        setSelectedStock(stockList[0].symbol);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading stocks:', error);
      setLoading(false);
    }
  };

  const loadTrades = async () => {
    try {
      const response = await scalperAPI.getTrades(scalperId);
      const allTrades = response.data.trades || [];
      const stockTrades = allTrades.filter((t: Trade) => t.symbol === selectedStock);
      setTrades(stockTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  };

  const loadChartData = async () => {
    if (!chartContainerRef.current || !selectedStock) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Find the stock details
    const stock = stocks.find(s => s.symbol === selectedStock);
    if (!stock) return;

    try {
      // Fetch historical data
      const response = await stockAPI.getHistorical(stock.exchange, selectedStock, '5m', '1d');
      const historicalData = response.data.prices || [];

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 600,
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        rightPriceScale: {
          borderColor: '#d1d4dc',
        },
        timeScale: {
          borderColor: '#d1d4dc',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // Add candlestick series
      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Format data for lightweight-charts
      const candleData = historicalData.map((item: any) => ({
        time: (new Date(item.date || item.time).getTime() / 1000) as Time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      candlestickSeries.setData(candleData);

      // Add markers for entry/exit/stop-loss
      const markers: any[] = [];

      trades.forEach((trade) => {
        const entryTime = (new Date(trade.entryTime).getTime() / 1000) as Time;

        // Entry marker
        markers.push({
          time: entryTime,
          position: trade.side === 'BUY' ? 'belowBar' : 'aboveBar',
          color: trade.side === 'BUY' ? '#26a69a' : '#ef5350',
          shape: 'arrowUp',
          text: `${trade.side} @ ₹${trade.entryPrice.toFixed(2)}`,
        });

        // Stop-loss line marker
        markers.push({
          time: entryTime,
          position: 'belowBar',
          color: '#ff5252',
          shape: 'circle',
          text: `SL: ₹${trade.stopLoss.toFixed(2)}`,
        });

        // Target line marker
        markers.push({
          time: entryTime,
          position: 'aboveBar',
          color: '#4caf50',
          shape: 'circle',
          text: `TGT: ₹${trade.target.toFixed(2)}`,
        });

        // Exit marker (if trade is closed)
        if (trade.exitPrice && trade.exitTime) {
          const exitTime = (new Date(trade.exitTime).getTime() / 1000) as Time;
          const isProfitable = trade.exitPrice > trade.entryPrice;

          markers.push({
            time: exitTime,
            position: isProfitable ? 'aboveBar' : 'belowBar',
            color: isProfitable ? '#4caf50' : '#ff5252',
            shape: 'arrowDown',
            text: `EXIT @ ₹${trade.exitPrice.toFixed(2)}`,
          });
        }
      });

      candlestickSeries.setMarkers(markers);

      // Add horizontal lines for current open positions
      trades
        .filter(t => t.status === 'OPEN')
        .forEach((trade) => {
          // Entry price line
          const entryLine = {
            price: trade.entryPrice,
            color: '#2196F3',
            lineWidth: 2,
            lineStyle: 2, // Dashed
            axisLabelVisible: true,
            title: `Entry: ₹${trade.entryPrice.toFixed(2)}`,
          };

          // Stop-loss line
          const slLine = {
            price: trade.stopLoss,
            color: '#ff5252',
            lineWidth: 2,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: `Stop Loss: ₹${trade.stopLoss.toFixed(2)}`,
          };

          // Target line
          const targetLine = {
            price: trade.target,
            color: '#4caf50',
            lineWidth: 2,
            lineStyle: 0, // Solid
            axisLabelVisible: true,
            title: `Target: ₹${trade.target.toFixed(2)}`,
          };

          candlestickSeries.createPriceLine(entryLine as any);
          candlestickSeries.createPriceLine(slLine as any);
          candlestickSeries.createPriceLine(targetLine as any);
        });

      // Fit content
      chart.timeScale().fitContent();

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading charts...</div>;
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium">No Stocks Added</p>
        <p className="text-gray-500 text-sm mt-2">Add stocks in the Configuration tab to see live charts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stock Selector */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Select Stock:</span>
          <div className="flex gap-2">
            {stocks.map((stock) => (
              <button
                key={stock.id}
                onClick={() => setSelectedStock(stock.symbol)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStock === stock.symbol
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {stock.symbol}
                <span className="text-xs ml-2 opacity-75">({stock.exchange})</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Chart</span>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900">Chart Legend</div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Entry (Buy)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Stop Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-gray-700">Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">Exit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedStock}</h3>
              <p className="text-sm text-gray-600">5-minute interval • Last 24 hours</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Active Trades</div>
                <div className="text-xl font-bold text-blue-600">
                  {trades.filter(t => t.status === 'OPEN').length}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Trades</div>
                <div className="text-xl font-bold text-gray-900">{trades.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* Trade List for Selected Stock */}
      {trades.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h4 className="font-semibold text-gray-900 mb-3">
            Trades for {selectedStock} ({trades.length})
          </h4>
          <div className="space-y-2">
            {trades.slice(0, 5).map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    trade.side === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {trade.side}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Entry: ₹{trade.entryPrice.toFixed(2)}
                      {trade.exitPrice && ` → Exit: ₹${trade.exitPrice.toFixed(2)}`}
                    </div>
                    <div className="text-xs text-gray-600">
                      SL: ₹{trade.stopLoss.toFixed(2)} • Target: ₹{trade.target.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    trade.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {trade.status}
                  </span>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(trade.entryTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
