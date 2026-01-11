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
  ComposedChart,
  ReferenceDot,
} from 'recharts';

// TradingView-style Volume Bar with color based on price direction
const VolumeBar = (props: any) => {
  const { x, y, width, height, payload } = props;

  if (!payload || payload.volume === undefined) return null;

  const isBullish = payload.isBullish;
  const color = isBullish ? '#26a69a' : '#ef5350';

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      fillOpacity={0.7}
    />
  );
};

// TradingView-style Candlestick Shape Component
const CandlestickShape = (props: any) => {
  const { x, y, width, height, payload } = props;

  // Get OHLC data from payload
  const { open, close, high, low } = payload;

  // Skip if missing required data
  if (open === undefined || close === undefined || high === undefined || low === undefined) {
    return null;
  }

  const isBullish = close >= open;

  // TradingView colors: Bullish (teal green), Bearish (red)
  const bullColor = '#26a69a';
  const bearColor = '#ef5350';
  const color = isBullish ? bullColor : bearColor;

  // Calculate candlestick dimensions
  const candleWidth = Math.max(width * 0.65, 2);
  const centerX = x + width / 2;

  // Handle doji/flat candles
  const priceRange = high - low;
  if (priceRange === 0) {
    return (
      <line
        x1={centerX - candleWidth / 2}
        y1={y}
        x2={centerX + candleWidth / 2}
        y2={y}
        stroke={color}
        strokeWidth={1.5}
      />
    );
  }

  // Calculate pixel positions
  const bodyTop = Math.min(open, close);
  const bodyHeight = Math.abs(close - open);

  // Y positions
  const bodyTopY = y + (height * (high - bodyTop) / priceRange);
  const bodyHeightPx = Math.max((height * bodyHeight / priceRange), 1.5);

  // Minimum body height for visibility
  const displayBodyHeight = Math.max(bodyHeightPx, 1.5);

  return (
    <g>
      {/* High-Low Wick */}
      <line
        x1={centerX}
        y1={y}
        x2={centerX}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.8}
      />

      {/* Candle Body: Hollow for bullish, Filled for bearish */}
      <rect
        x={centerX - candleWidth / 2}
        y={bodyTopY}
        width={candleWidth}
        height={displayBodyHeight}
        fill={isBullish ? 'transparent' : color}
        stroke={color}
        strokeWidth={isBullish ? 1.5 : 1}
      />
    </g>
  );
};

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
  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);

  // Add volume coloring based on price direction (TradingView style)
  const combinedData = priceData.map((point, index) => {
    const isBullish = (point.close ?? 0) >= (point.open ?? 0);
    return {
      ...point,
      index,
      volumeColor: isBullish ? '#26a69a' : '#ef5350', // Green for up, Red for down
      isBullish,
    };
  });

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

  // TradingView-style OHLC Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const isBullish = data.close >= data.open;
    const change = data.close - data.open;
    const changePercent = ((change / data.open) * 100);

    return (
      <div className="bg-gray-900/95 border border-gray-700 rounded-md shadow-2xl p-3 text-xs font-mono">
        {/* Timestamp */}
        <p className="font-semibold text-gray-200 mb-2 text-sm">
          {new Date(data.time).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        {/* OHLC Data */}
        <div className="space-y-1 mb-2 border-b border-gray-700 pb-2">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">O</span>
            <span className="text-white">₹{data.open?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">H</span>
            <span className="text-green-400">₹{data.high?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">L</span>
            <span className="text-red-400">₹{data.low?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">C</span>
            <span className={isBullish ? 'text-emerald-400' : 'text-rose-400'}>
              ₹{data.close?.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Change</span>
            <span className={isBullish ? 'text-emerald-400' : 'text-rose-400'}>
              {change >= 0 ? '+' : ''}₹{change.toFixed(2)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          </div>
          {data.volume && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Vol</span>
              <span className="text-purple-400">
                {data.volume >= 1000000 ? `${(data.volume / 1000000).toFixed(2)}M` :
                 data.volume >= 1000 ? `${(data.volume / 1000).toFixed(2)}K` :
                 data.volume}
              </span>
            </div>
          )}
        </div>

        {/* Indicators */}
        <div className="space-y-1 text-xs">
          {data.rsi !== undefined && activeIndicators.rsi && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">RSI(14)</span>
              <span className="text-yellow-400">{data.rsi.toFixed(1)}</span>
            </div>
          )}
          {data.ema9 && activeIndicators.ema && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">EMA(9)</span>
              <span className="text-blue-400">₹{data.ema9.toFixed(2)}</span>
            </div>
          )}
          {data.ema21 && activeIndicators.ema && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">EMA(21)</span>
              <span className="text-indigo-400">₹{data.ema21.toFixed(2)}</span>
            </div>
          )}
          {data.vwap && activeIndicators.vwap && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">VWAP</span>
              <span className="text-cyan-400">₹{data.vwap.toFixed(2)}</span>
            </div>
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

        {/* Chart Type & Display Toggles */}
        <div className="flex items-center gap-4">
          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-1">Chart:</span>
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              CANDLESTICK
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                chartType === 'line'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              LINE
            </button>
          </div>

          {/* Volume Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                showVolume
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              VOLUME
            </button>
          </div>

          {/* Indicator Toggles */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 mr-1">Indicators:</span>
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
      </div>

      {/* Main Price Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-900">
            {symbol} / {exchange} - {chartType === 'candlestick' ? 'Candlestick' : 'Line'} Chart
          </h4>
          <div className="text-sm text-gray-600">
            {combinedData.length} candles
          </div>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="1 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="time"
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              }
              tick={{ fontSize: 11 }}
              stroke="#9e9e9e"
            />
            <YAxis
              domain={['auto', 'auto']}
              tickFormatter={(value) => `₹${Math.round(value)}`}
              tick={{ fontSize: 11 }}
              stroke="#9e9e9e"
              width={60}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Bollinger Bands */}
            {activeIndicators.bollinger && (
              <>
                <Line
                  type="monotone"
                  dataKey="bb_upper"
                  stroke="#9E9E9E"
                  strokeWidth={1}
                  name="BB Upper"
                  dot={false}
                  strokeDasharray="2 2"
                  connectNulls={true}
                  isAnimationActive={false}
                  opacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="bb_middle"
                  stroke="#757575"
                  strokeWidth={1}
                  name="BB Middle"
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                  opacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="bb_lower"
                  stroke="#9E9E9E"
                  strokeWidth={1}
                  name="BB Lower"
                  dot={false}
                  strokeDasharray="2 2"
                  connectNulls={true}
                  isAnimationActive={false}
                  opacity={0.5}
                />
              </>
            )}

            {/* EMA Lines - TradingView style */}
            {activeIndicators.ema && (
              <>
                <Line
                  type="monotone"
                  dataKey="ema9"
                  stroke="#2962FF"
                  strokeWidth={1.5}
                  name="EMA(9)"
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema21"
                  stroke="#9C27B0"
                  strokeWidth={1.5}
                  name="EMA(21)"
                  dot={false}
                  connectNulls={true}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema50"
                  stroke="#FF6D00"
                  strokeWidth={1.5}
                  name="EMA(50)"
                  dot={false}
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
                stroke="#00BCD4"
                strokeWidth={1.5}
                name="VWAP"
                dot={false}
                strokeDasharray="3 3"
                connectNulls={true}
                isAnimationActive={false}
              />
            )}

            {/* Price Visualization - Candlestick or Line */}
            {chartType === 'candlestick' ? (
              <Bar
                dataKey="high"
                shape={<CandlestickShape open={0} close={0} high={0} low={0} />}
                isAnimationActive={false}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="close"
                stroke="#2962FF"
                strokeWidth={2}
                name="Price"
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />
            )}

            {/* Trade Entry Markers - Using ReferenceDot (Recharts-compatible) */}
            {tradeMarkers
              .filter((t) => t.type === 'entry')
              .map((trade, idx) => (
                <ReferenceDot
                  key={`entry-${trade.id}-${idx}`}
                  x={trade.time}
                  y={trade.price}
                  r={8}
                  fill={(trade.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444'}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isFront={true}
                />
              ))}

            {/* Trade Exit Markers - Using ReferenceDot (larger stroke for distinction) */}
            {tradeMarkers
              .filter((t) => t.exitTime && t.exitPrice)
              .map((trade, idx) => (
                <ReferenceDot
                  key={`exit-${trade.id}-${idx}`}
                  x={trade.exitTime!}
                  y={trade.exitPrice!}
                  r={10}
                  fill={(trade.pnl ?? 0) >= 0 ? '#10b981' : '#ef4444'}
                  stroke="#FFA500"
                  strokeWidth={4}
                  isFront={true}
                />
              ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      {showVolume && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Volume</h4>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="time"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                tick={{ fontSize: 11 }}
                stroke="#9e9e9e"
              />
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
                tick={{ fontSize: 11 }}
                stroke="#9e9e9e"
                width={60}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #555', borderRadius: '4px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: number) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
                  return value.toFixed(0);
                }}
              />
              <Bar
                dataKey="volume"
                shape={<VolumeBar />}
                name="Volume"
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* RSI Chart */}
      {activeIndicators.rsi && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">RSI (14)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={combinedData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="time"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                tick={{ fontSize: 11 }}
                stroke="#9e9e9e"
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#9e9e9e" width={40} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #555', borderRadius: '4px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <ReferenceLine y={70} stroke="#ef5350" strokeDasharray="2 2" strokeOpacity={0.5} />
              <ReferenceLine y={50} stroke="#9e9e9e" strokeDasharray="1 1" strokeOpacity={0.3} />
              <ReferenceLine y={30} stroke="#26a69a" strokeDasharray="2 2" strokeOpacity={0.5} />
              <Area
                type="monotone"
                dataKey="rsi"
                stroke="#7B68EE"
                fill="#7B68EE"
                fillOpacity={0.2}
                strokeWidth={2}
                name="RSI(14)"
                connectNulls={true}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* MACD Chart */}
      {activeIndicators.macd && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">MACD (12, 26, 9)</h4>
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="1 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis
                dataKey="time"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                tick={{ fontSize: 11 }}
                stroke="#9e9e9e"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#9e9e9e" width={50} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #555', borderRadius: '4px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend iconSize={12} wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={0} stroke="#616161" strokeWidth={1} />
              <Bar
                dataKey="macd_histogram"
                fill="#546E7A"
                name="Histogram"
                isAnimationActive={false}
                opacity={0.6}
              />
              <Line
                type="monotone"
                dataKey="macd"
                stroke="#2196F3"
                strokeWidth={2}
                name="MACD"
                dot={false}
                connectNulls={true}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="macd_signal"
                stroke="#FF6B6B"
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
