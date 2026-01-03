/**
 * Stock Evidence Chart - Visual evidence for trading signals
 * Shows price action, indicators, and entry/target/stop levels
 */

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeriesPartialOptions, LineSeriesPartialOptions, LineStyle, Time } from 'lightweight-charts';

interface ChartData {
  symbol: string;
  currentPrice: number;
  currency?: 'USD' | 'INR';
  historicalPrices: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  indicators: {
    ema9?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
    rsi?: number;
    macd?: any;
    bollingerBands?: any;
  };
  levels?: {
    entry: number;
    stopLoss: number;
    target: number;
  };
}

interface Props {
  data: ChartData;
}

// Helper function to get currency symbol
const getCurrencySymbol = (currency?: 'USD' | 'INR'): string => {
  return currency === 'USD' ? '$' : '₹';
};

export default function StockEvidenceChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data.historicalPrices || data.historicalPrices.length === 0) {
      console.log('⚠️ Chart not rendering: missing container or data');
      return;
    }

    console.log('📊 Creating chart with', data.historicalPrices.length, 'candles');

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Prepare candlestick data first
    console.log('🔍 Sample raw date:', data.historicalPrices[0]?.date);

    const candleData = data.historicalPrices
      .map(d => {
        const timestamp = new Date(d.date).getTime() / 1000;

        // Validate timestamp
        if (isNaN(timestamp)) {
          console.error('❌ Invalid date:', d.date);
          return null;
        }

        return {
          time: timestamp as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null) // Remove invalid entries
      .sort((a, b) => (a.time as number) - (b.time as number)); // Ensure chronological order

    console.log('📈 Prepared candlestick data:', candleData.length, 'candles');

    if (candleData.length === 0) {
      console.error('❌ No valid candle data after parsing');
      return;
    }

    // Add candlestick series using correct v5 API
    const candlestickSeriesOptions: CandlestickSeriesPartialOptions = {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    };
    const candlestickSeries = chart.addCandlestickSeries(candlestickSeriesOptions);

    candlestickSeries.setData(candleData);

    // Add EMA lines
    if (data.indicators.ema20) {
      const ema20SeriesOptions: LineSeriesPartialOptions = {
        color: '#2962FF',
        lineWidth: 2,
        title: 'EMA 20',
      };
      const ema20Series = chart.addLineSeries(ema20SeriesOptions);
      ema20Series.setData(candleData.map(d => ({ time: d.time as Time, value: data.indicators.ema20! })));
    }

    if (data.indicators.ema50) {
      const ema50SeriesOptions: LineSeriesPartialOptions = {
        color: '#FF6D00',
        lineWidth: 2,
        title: 'EMA 50',
      };
      const ema50Series = chart.addLineSeries(ema50SeriesOptions);
      ema50Series.setData(candleData.map(d => ({ time: d.time as Time, value: data.indicators.ema50! })));
    }

    // Add entry/target/stop lines
    const lastTime = candleData[candleData.length - 1].time;

    // Add price levels if available
    if (data.levels) {
      // Entry level
      const entryLineOptions: LineSeriesPartialOptions = {
        color: '#2196F3',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: 'Entry',
        priceLineVisible: true,
        lastValueVisible: true,
      };
      const entryLine = chart.addLineSeries(entryLineOptions);
      entryLine.setData([
        { time: candleData[0].time as Time, value: data.levels.entry },
        { time: lastTime as Time, value: data.levels.entry },
      ]);

      // Target level
      const targetLineOptions: LineSeriesPartialOptions = {
        color: '#4CAF50',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: 'Target',
        priceLineVisible: true,
        lastValueVisible: true,
      };
      const targetLine = chart.addLineSeries(targetLineOptions);
      targetLine.setData([
        { time: candleData[0].time as Time, value: data.levels.target },
        { time: lastTime as Time, value: data.levels.target },
      ]);

      // Stop Loss level
      const stopLineOptions: LineSeriesPartialOptions = {
        color: '#F44336',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: 'Stop Loss',
        priceLineVisible: true,
        lastValueVisible: true,
      };
      const stopLine = chart.addLineSeries(stopLineOptions);
      stopLine.setData([
        { time: candleData[0].time as Time, value: data.levels.stopLoss },
        { time: lastTime as Time, value: data.levels.stopLoss },
      ]);
    }

    // Fit content
    chart.timeScale().fitContent();

    console.log('✅ Chart created successfully');

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data]);

  if (!data.historicalPrices || data.historicalPrices.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-600">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div ref={chartContainerRef} className="w-full" />

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        {data.levels && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600"></div>
              <span className="text-gray-700">Entry: {getCurrencySymbol(data.currency)}{data.levels.entry.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-600"></div>
              <span className="text-gray-700">Target: {getCurrencySymbol(data.currency)}{data.levels.target.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-600"></div>
              <span className="text-gray-700">Stop Loss: {getCurrencySymbol(data.currency)}{data.levels.stopLoss.toFixed(2)}</span>
            </div>
          </>
        )}
        {data.indicators.ema20 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span className="text-gray-700">EMA 20</span>
          </div>
        )}
        {data.indicators.ema50 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500"></div>
            <span className="text-gray-700">EMA 50</span>
          </div>
        )}
      </div>

      {/* Additional Indicators */}
      {(data.indicators.rsi || data.indicators.macd) && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.indicators.rsi && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">RSI</p>
              <p className={`text-lg font-bold ${
                data.indicators.rsi > 70 ? 'text-red-600' :
                data.indicators.rsi < 30 ? 'text-green-600' :
                'text-gray-900'
              }`}>
                {data.indicators.rsi.toFixed(2)}
              </p>
            </div>
          )}
          {data.indicators.macd && (
            <div className="bg-gray-50 rounded p-2">
              <p className="text-xs text-gray-600">MACD</p>
              <p className="text-sm font-semibold text-gray-900">
                {data.indicators.macd.signal || 'Neutral'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
