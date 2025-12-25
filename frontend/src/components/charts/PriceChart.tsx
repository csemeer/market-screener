import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface PriceChartProps {
  stockData: any;
}

export default function PriceChart({ stockData }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [showIndicators, setShowIndicators] = useState({
    ema20: true,
    ema50: true,
    volume: true,
    rsi: false,
    macd: false,
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: ColorType.Solid, color: 'white' },
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
      },
    });

    chartRef.current = chart;

    // Generate historical data for demo (replace with actual API data)
    const historicalData = generateHistoricalData(stockData);

    // Add candlestick series
    try {
      const candlestickSeries = (chart as any).addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });
      candlestickSeries.setData(historicalData.candles);

      // Add EMA 20
      if (showIndicators.ema20) {
        const ema20Series = (chart as any).addLineSeries({
          color: '#2196F3',
          lineWidth: 2,
          title: 'EMA 20',
        });
        ema20Series.setData(historicalData.ema20);
      }

      // Add EMA 50
      if (showIndicators.ema50) {
        const ema50Series = (chart as any).addLineSeries({
          color: '#FF9800',
          lineWidth: 2,
          title: 'EMA 50',
        });
        ema50Series.setData(historicalData.ema50);
      }

      // Add volume chart
      if (showIndicators.volume) {
        const volumeSeries = (chart as any).addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        });
        volumeSeries.setData(historicalData.volume);

        (chart as any).priceScale('volume')?.applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      }
    } catch (error) {
      console.error('Error creating chart series:', error);
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [stockData, showIndicators]);

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowIndicators(prev => ({ ...prev, ema20: !prev.ema20 }))}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showIndicators.ema20
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          EMA 20
        </button>
        <button
          onClick={() => setShowIndicators(prev => ({ ...prev, ema50: !prev.ema50 }))}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showIndicators.ema50
              ? 'bg-orange-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          EMA 50
        </button>
        <button
          onClick={() => setShowIndicators(prev => ({ ...prev, volume: !prev.volume }))}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showIndicators.volume
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Volume
        </button>
        <button
          onClick={() => setShowIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showIndicators.rsi
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          RSI
        </button>
        <button
          onClick={() => setShowIndicators(prev => ({ ...prev, macd: !prev.macd }))}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            showIndicators.macd
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          MACD
        </button>
      </div>

      {/* Main Chart */}
      <div ref={chartContainerRef} className="w-full border border-gray-200 rounded-lg" />

      {/* RSI Chart */}
      {showIndicators.rsi && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">RSI (14)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={generateRSIData(stockData)}>
              <defs>
                <linearGradient id="colorRSI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="rsi" stroke="#8884d8" fillOpacity={1} fill="url(#colorRSI)" />
              <Line y={70} stroke="#ef5350" strokeDasharray="5 5" />
              <Line y={30} stroke="#26a69a" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
            <span>Current RSI: <strong className={`${
              stockData.indicators.rsi > 70 ? 'text-red-600' :
              stockData.indicators.rsi < 30 ? 'text-green-600' :
              'text-gray-900'
            }`}>{stockData.indicators.rsi?.toFixed(2)}</strong></span>
            <span className="text-gray-500">Overbought &gt; 70 | Oversold &lt; 30</span>
          </div>
        </div>
      )}

      {/* MACD Chart */}
      {showIndicators.macd && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">MACD (12, 26, 9)</h3>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={generateMACDData(stockData)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="macd" stroke="#2196F3" strokeWidth={2} name="MACD" />
              <Line type="monotone" dataKey="signal" stroke="#FF9800" strokeWidth={2} name="Signal" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-gray-600">
            <span>MACD: <strong>{stockData.indicators.macd?.toFixed(2) || 'N/A'}</strong></span>
            <span className="ml-4">Signal: <strong>{stockData.indicators.macdSignal?.toFixed(2) || 'N/A'}</strong></span>
          </div>
        </div>
      )}

      {/* Chart Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 mb-1">24h High</div>
          <div className="font-semibold text-gray-900">${(stockData.price * 1.02).toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 mb-1">24h Low</div>
          <div className="font-semibold text-gray-900">${(stockData.price * 0.98).toFixed(2)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 mb-1">Volume</div>
          <div className="font-semibold text-gray-900">{formatVolume(stockData.volume)}</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 mb-1">Market Cap</div>
          <div className="font-semibold text-gray-900">{formatMarketCap(stockData.marketCap)}</div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to generate demo data (replace with actual API data)
function generateHistoricalData(stockData: any) {
  const data = [];
  const ema20Data = [];
  const ema50Data = [];
  const volumeData = [];
  const basePrice = stockData.price;

  for (let i = 60; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const time = Math.floor(date.getTime() / 1000);

    const randomChange = (Math.random() - 0.5) * basePrice * 0.02;
    const open = basePrice + randomChange;
    const close = open + (Math.random() - 0.5) * basePrice * 0.015;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.01;

    data.push({
      time,
      open,
      high,
      low,
      close,
    });

    // EMA calculations (simplified)
    const ema20 = close * 0.95;
    const ema50 = close * 0.92;

    ema20Data.push({ time, value: ema20 });
    ema50Data.push({ time, value: ema50 });

    volumeData.push({
      time,
      value: stockData.volume * (0.8 + Math.random() * 0.4),
      color: close >= open ? '#26a69a40' : '#ef535040',
    });
  }

  return {
    candles: data,
    ema20: ema20Data,
    ema50: ema50Data,
    volume: volumeData,
  };
}

function generateRSIData(stockData: any) {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const rsi = stockData.indicators.rsi + (Math.random() - 0.5) * 10;
    data.push({
      time: date.toLocaleDateString(),
      rsi: Math.max(0, Math.min(100, rsi)),
    });
  }
  return data;
}

function generateMACDData(stockData: any) {
  const data = [];
  const baseMacd = stockData.indicators.macd || 0;
  const baseSignal = stockData.indicators.macdSignal || 0;

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      time: date.toLocaleDateString(),
      macd: baseMacd + (Math.random() - 0.5) * 2,
      signal: baseSignal + (Math.random() - 0.5) * 2,
    });
  }
  return data;
}

function formatVolume(volume: number): string {
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toString();
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toLocaleString()}`;
}
