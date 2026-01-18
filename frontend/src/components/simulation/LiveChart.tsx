import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  Time,
  CandlestickData,
  LineData,
  ISeriesApi,
} from 'lightweight-charts';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Indicators {
  ema9?: number;
  ema20?: number;
  ema50?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
}

interface Trade {
  id: number;
  entryTime: Date;
  entryPrice: number;
  exitTime?: Date;
  exitPrice?: number;
  status: 'open' | 'closed';
}

interface LiveChartProps {
  candles: Candle[];
  indicators: Indicators;
  currentTrade?: Trade | null;
  trades: Trade[];
}

export default function LiveChart({ candles, indicators, currentTrade, trades }: LiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    candleSeriesRef.current = candleSeries;

    // Create EMA series
    ema9SeriesRef.current = (chart as any).addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      title: 'EMA 9',
    });

    ema20SeriesRef.current = (chart as any).addLineSeries({
      color: '#9C27B0',
      lineWidth: 2,
      title: 'EMA 20',
    });

    ema50SeriesRef.current = (chart as any).addLineSeries({
      color: '#FF6D00',
      lineWidth: 2,
      title: 'EMA 50',
    });

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
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  // Update candles
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    // Remove duplicates and sort by time
    const uniqueCandles = candles.reduce((acc: Candle[], candle) => {
      // Only add if timestamp doesn't already exist
      if (!acc.find(c => c.time === candle.time)) {
        acc.push(candle);
      }
      return acc;
    }, []);

    // Sort by time ascending
    uniqueCandles.sort((a, b) => a.time - b.time);

    const candleData: CandlestickData[] = uniqueCandles.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    candleSeriesRef.current.setData(candleData);

    // Fit content to show all candles
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Update EMAs
  useEffect(() => {
    if (candles.length === 0) return;

    // Remove duplicates and sort by time
    const uniqueCandles = candles.reduce((acc: Candle[], candle) => {
      if (!acc.find(c => c.time === candle.time)) {
        acc.push(candle);
      }
      return acc;
    }, []);
    uniqueCandles.sort((a, b) => a.time - b.time);

    // EMA 9
    if (ema9SeriesRef.current && indicators.ema9 !== undefined) {
      const ema9Data: LineData[] = uniqueCandles.map((candle, index) => ({
        time: candle.time as Time,
        value: index === uniqueCandles.length - 1 ? indicators.ema9! : candle.close, // Show indicator on last candle
      }));
      ema9SeriesRef.current.setData(ema9Data);
    }

    // EMA 20
    if (ema20SeriesRef.current && indicators.ema20 !== undefined) {
      const ema20Data: LineData[] = uniqueCandles.map((candle, index) => ({
        time: candle.time as Time,
        value: index === uniqueCandles.length - 1 ? indicators.ema20! : candle.close,
      }));
      ema20SeriesRef.current.setData(ema20Data);
    }

    // EMA 50
    if (ema50SeriesRef.current && indicators.ema50 !== undefined) {
      const ema50Data: LineData[] = uniqueCandles.map((candle, index) => ({
        time: candle.time as Time,
        value: index === uniqueCandles.length - 1 ? indicators.ema50! : candle.close,
      }));
      ema50SeriesRef.current.setData(ema50Data);
    }
  }, [candles, indicators]);

  // Add trade markers
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    const markers: any[] = [];

    // Add closed trades
    trades.forEach((trade) => {
      // Entry marker
      markers.push({
        time: Math.floor(trade.entryTime.getTime() / 1000) as Time,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'arrowUp',
        text: `Entry: ₹${trade.entryPrice.toFixed(2)}`,
      });

      // Exit marker
      if (trade.exitTime && trade.exitPrice) {
        const isProfit = trade.exitPrice > trade.entryPrice;
        markers.push({
          time: Math.floor(trade.exitTime.getTime() / 1000) as Time,
          position: 'aboveBar',
          color: isProfit ? '#26a69a' : '#ef5350',
          shape: 'arrowDown',
          text: `Exit: ₹${trade.exitPrice.toFixed(2)}`,
        });
      }
    });

    // Add current open trade marker
    if (currentTrade) {
      markers.push({
        time: Math.floor(currentTrade.entryTime.getTime() / 1000) as Time,
        position: 'belowBar',
        color: '#FFA726',
        shape: 'arrowUp',
        text: `Open: ₹${currentTrade.entryPrice.toFixed(2)}`,
      });
    }

    (candleSeriesRef.current as any).setMarkers(markers);
  }, [trades, currentTrade]);

  return (
    <div className="w-full">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
