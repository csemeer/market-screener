import { useState } from 'react';
import {
  Line,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Scatter,
  ComposedChart,
} from 'recharts';

interface TradeMarker {
  id: number;
  type: 'entry' | 'exit';
  time: string;
  price: number;
  exitTime?: string;
  exitPrice?: number;
  stopLoss: number;
  target: number;
  result?: string;
  pnl?: number;
  pnlPercent?: number;
  signals?: any[];
  indicators?: any;
}

interface ChartDataPoint {
  time: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  vwap?: number;
}

interface TradingChartProps {
  runId: number;
  tradeMarkers: TradeMarker[];
  priceData: ChartDataPoint[];
  indicatorData: ChartDataPoint[];
  symbol: string;
  exchange: string;
}

export default function TradingChart({
  runId: _runId,
  tradeMarkers,
  priceData,
  indicatorData: _indicatorData,
  symbol,
  exchange,
}: TradingChartProps) {
  const [activeIndicators, setActiveIndicators] = useState({
    ema: true,
    bollinger: true,
    rsi: true,
    macd: true,
    vwap: true,
  });

  const [selectedTrade, setSelectedTrade] = useState<TradeMarker | null>(null);

  // priceData now contains all indicators from backend
  // Just add index for positioning on chart
  const combinedData = priceData.map((point, index) => ({
    ...point,
    index,
  }));

  // Debug: Log first data point to verify structure
  if (combinedData.length > 0) {
    console.log('=== CHART DEBUG ===');
    console.log('First chart data point:', combinedData[0]);
    console.log('Last chart data point:', combinedData[combinedData.length - 1]);
    console.log('Total data points:', combinedData.length);
    console.log('Sample data keys:', Object.keys(combinedData[0]));
    console.log('Has close?', combinedData[0].close);
    console.log('Has ema9?', combinedData[0].ema9);
    console.log('Has rsi?', combinedData[0].rsi);

    // Check data ranges for Y-axis
    const closes = combinedData.map(d => d.close).filter(Boolean) as number[];
    console.log('Close price range:', Math.min(...closes), 'to', Math.max(...closes));
    console.log('===================');
  }

  // Prepare trade markers for scatter plot
  const entryMarkers = tradeMarkers
    .filter((t) => t.type === 'entry')
    .map((t) => {
      const dataPoint = combinedData.find((d) => d.time === t.time);
      return {
        ...t,
        index: dataPoint?.index || 0,
        y: t.price,
        color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444',
      };
    });

  const exitMarkers = tradeMarkers
    .filter((t) => t.exitTime && t.exitPrice)
    .map((t) => {
      const dataPoint = combinedData.find((d) => d.time === t.exitTime);
      return {
        ...t,
        index: dataPoint?.index || 0,
        y: t.exitPrice,
        color: (t.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444',
      };
    });

  // Custom tooltip for price chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-gray-900 mb-2">
          {new Date(data.time).toLocaleString('en-IN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <div className="space-y-1">
          {data.close && (
            <p className="text-gray-700">
              <span className="font-medium">Price:</span> ₹{data.close.toFixed(2)}
            </p>
          )}
          {data.ema9 && activeIndicators.ema && (
            <p className="text-blue-600">
              <span className="font-medium">EMA(9):</span> ₹{data.ema9.toFixed(2)}
            </p>
          )}
          {data.ema21 && activeIndicators.ema && (
            <p className="text-purple-600">
              <span className="font-medium">EMA(21):</span> ₹{data.ema21.toFixed(2)}
            </p>
          )}
          {data.bb_middle && activeIndicators.bollinger && (
            <p className="text-orange-600">
              <span className="font-medium">BB Mid:</span> ₹{data.bb_middle.toFixed(2)}
            </p>
          )}
          {data.vwap && activeIndicators.vwap && (
            <p className="text-cyan-600">
              <span className="font-medium">VWAP:</span> ₹{data.vwap.toFixed(2)}
            </p>
          )}
          {data.rsi !== undefined && activeIndicators.rsi && (
            <p className="text-yellow-600">
              <span className="font-medium">RSI:</span> {data.rsi.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    );
  };

  const toggleIndicator = (indicator: keyof typeof activeIndicators) => {
    setActiveIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {symbol} <span className="text-gray-500 text-lg">({exchange})</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {tradeMarkers.length} trades • {entryMarkers.length} entries •{' '}
            {exitMarkers.length} exits
          </p>
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Indicators:</span>
          {Object.entries(activeIndicators).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleIndicator(key as keyof typeof activeIndicators)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Price Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          Price Chart with Indicators & Trade Markers
        </h4>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={combinedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `₹${Math.round(value)}`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Bollinger Bands */}
            {activeIndicators.bollinger && (
              <>
                <Area
                  type="monotone"
                  dataKey="bb_upper"
                  stroke="#fb923c"
                  fill="#fed7aa"
                  fillOpacity={0.1}
                  name="BB Upper"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="bb_lower"
                  stroke="#fb923c"
                  fill="#fed7aa"
                  fillOpacity={0.1}
                  name="BB Lower"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bb_middle"
                  stroke="#FFA500"
                  strokeWidth={3}
                  name="BB Middle"
                  dot={{ fill: '#FFA500', r: 5 }}
                  connectNulls={true}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* EMA Lines */}
            {activeIndicators.ema && (
              <>
                <Line
                  type="monotone"
                  dataKey="ema9"
                  stroke="#0000FF"
                  strokeWidth={3}
                  name="EMA(9)"
                  dot={{ fill: '#0000FF', r: 5 }}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema21"
                  stroke="#FF00FF"
                  strokeWidth={3}
                  name="EMA(21)"
                  dot={{ fill: '#FF00FF', r: 5 }}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema50"
                  stroke="#00FFFF"
                  strokeWidth={3}
                  name="EMA(50)"
                  dot={{ fill: '#00FFFF', r: 5 }}
                  strokeDasharray="3 3"
                  connectNulls={true}
                  isAnimationActive={false}
                />
              </>
            )}

            {/* VWAP */}
            {activeIndicators.vwap && (
              <Line
                type="monotone"
                dataKey="vwap"
                stroke="#FF0000"
                strokeWidth={3}
                name="VWAP"
                dot={{ fill: '#FF0000', r: 5 }}
                strokeDasharray="5 5"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}

            {/* Price Line - Make it VERY visible */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#000000"
              strokeWidth={4}
              name="Price"
              dot={{ fill: '#000000', r: 6 }}
              connectNulls={true}
              isAnimationActive={false}
            />

            {/* TEMPORARILY DISABLED - Trade Markers causing rendering issues */}
            {/* Will re-add with proper implementation */}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* RSI Chart */}
      {activeIndicators.rsi && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">RSI (Relative Strength Index)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label="Overbought" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label="Oversold" />
              <Area
                type="monotone"
                dataKey="rsi"
                stroke="#eab308"
                fill="#fef08a"
                fillOpacity={0.6}
                name="RSI"
                connectNulls={true}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Chart */}
      {activeIndicators.macd && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">MACD (Moving Average Convergence Divergence)</h4>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="time"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine y={0} stroke="#6b7280" />
              <Bar
                dataKey="histogram"
                fill="#93c5fd"
                name="Histogram"
                barSize={20}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="macd"
                stroke="#3b82f6"
                strokeWidth={2}
                name="MACD"
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke="#ef4444"
                strokeWidth={2}
                name="Signal"
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Selected Trade Details */}
      {selectedTrade && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-500 rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">Trade Details #{selectedTrade.id}</h4>
            <button
              onClick={() => setSelectedTrade(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Entry Price</p>
              <p className="text-lg font-bold text-gray-900">₹{selectedTrade.price.toFixed(2)}</p>
              <p className="text-xs text-gray-500">
                {new Date(selectedTrade.time).toLocaleString('en-IN')}
              </p>
            </div>

            {selectedTrade.exitPrice && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Exit Price</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{selectedTrade.exitPrice.toFixed(2)}
                </p>
                {selectedTrade.exitTime && (
                  <p className="text-xs text-gray-500">
                    {new Date(selectedTrade.exitTime).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Stop Loss</p>
              <p className="text-lg font-bold text-red-600">₹{selectedTrade.stopLoss.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Target</p>
              <p className="text-lg font-bold text-green-600">₹{selectedTrade.target.toFixed(2)}</p>
            </div>

            {selectedTrade.pnl !== undefined && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">P&L</p>
                <p
                  className={`text-lg font-bold ${
                    (selectedTrade.pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ₹{selectedTrade.pnl.toFixed(2)}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    (selectedTrade.pnlPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(selectedTrade.pnlPercent ?? 0) >= 0 ? '+' : ''}
                  {selectedTrade.pnlPercent?.toFixed(2)}%
                </p>
              </div>
            )}

            <div className="bg-white rounded-lg p-3">
              <p className="text-sm text-gray-600">Result</p>
              <p
                className={`text-sm font-semibold ${
                  selectedTrade.result === 'TARGET_HIT'
                    ? 'text-green-600'
                    : selectedTrade.result === 'STOP_LOSS'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {selectedTrade.result?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Indicators at Entry */}
          {selectedTrade.indicators && Object.keys(selectedTrade.indicators).length > 0 && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Indicators at Entry</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries(selectedTrade.indicators).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium text-gray-900">
                      {typeof value === 'number'
                        ? value.toFixed(2)
                        : typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entry Signals */}
          {selectedTrade.signals && selectedTrade.signals.length > 0 && (
            <div className="mt-4 bg-white rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 mb-3">Entry Signals</h5>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedTrade.signals.map((signal: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    {signal}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Chart Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
            <span>Winning Trade Entry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <span>Losing Trade Entry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-green-500"></div>
            <span>Winning Trade Exit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-red-500"></div>
            <span>Losing Trade Exit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500"></div>
            <span>EMA(9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-purple-500"></div>
            <span>EMA(21)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-orange-500"></div>
            <span>Bollinger Bands</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-teal-500 border-dashed"></div>
            <span>VWAP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
