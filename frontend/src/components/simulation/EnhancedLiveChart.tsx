import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  Time,
  CandlestickData,
  LineData,
  HistogramData,
  ISeriesApi,
  IChartApi,
  CrosshairMode,
} from 'lightweight-charts';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Maximize2,
  Activity,
  Clock,
} from 'lucide-react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorValue {
  time: number;
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

interface EnhancedLiveChartProps {
  candles: Candle[];
  indicatorHistory: IndicatorValue[];
  currentTrade?: Trade | null;
  trades: Trade[];
  dataSource?: 'yahoo-finance' | 'upstox' | 'unknown';
  lastUpdated?: string;
  symbol?: string;
  interval?: string;
}

export default function EnhancedLiveChart({
  candles,
  indicatorHistory,
  trades,
  dataSource = 'unknown',
  lastUpdated,
  symbol,
  interval,
}: EnhancedLiveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartHeight, setChartHeight] = useState(600);
  const [isResizing, setIsResizing] = useState(false);

  // Data quality score (0-100)
  const dataQuality = dataSource === 'yahoo-finance' || dataSource === 'upstox' ? 100 : 0;

  // Get data source display name and color
  const getDataSourceInfo = () => {
    switch (dataSource) {
      case 'yahoo-finance':
        return { name: 'Yahoo Finance', color: 'bg-purple-500', textColor: 'text-purple-700' };
      case 'upstox':
        return { name: 'Upstox API', color: 'bg-blue-500', textColor: 'text-blue-700' };
      default:
        return { name: 'Unknown Source', color: 'bg-gray-500', textColor: 'text-gray-700' };
    }
  };

  const dataSourceInfo = getDataSourceInfo();

  // Initialize chart with professional settings
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
        fontSize: 12,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      grid: {
        vertLines: {
          color: '#f0f0f0',
          style: 1,
        },
        horzLines: {
          color: '#f0f0f0',
          style: 1,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#4682B4',
        },
        horzLine: {
          width: 1,
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#4682B4',
        },
      },
      rightPriceScale: {
        borderColor: '#e0e0e0',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: '#e0e0e0',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 4,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Create volume series (at the bottom)
    const volumeSeries = (chart as any).addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;

    // Create candlestick series
    const candleSeries = (chart as any).addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceScaleId: 'right',
    });

    candleSeriesRef.current = candleSeries;

    // Create EMA series with professional styling
    ema9SeriesRef.current = (chart as any).addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      title: 'EMA 9',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ema20SeriesRef.current = (chart as any).addLineSeries({
      color: '#9C27B0',
      lineWidth: 2,
      title: 'EMA 20',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    ema50SeriesRef.current = (chart as any).addLineSeries({
      color: '#FF6D00',
      lineWidth: 2,
      title: 'EMA 50',
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Handle window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [chartHeight]);

  // Update candles and volume
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles || candles.length === 0) return;

    // Remove duplicates and sort
    const uniqueCandles = candles.reduce((acc: Candle[], candle) => {
      if (!acc.find(c => c.time === candle.time)) {
        acc.push(candle);
      }
      return acc;
    }, []);

    uniqueCandles.sort((a, b) => a.time - b.time);

    // Prepare candle data
    const candleData: CandlestickData[] = uniqueCandles.map((candle) => ({
      time: candle.time as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    // Prepare volume data with color based on candle direction
    const volumeData: HistogramData[] = uniqueCandles.map((candle) => ({
      time: candle.time as Time,
      value: candle.volume,
      color: candle.close >= candle.open ? '#26a69a' : '#ef5350',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Fit content initially
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [candles]);

  // Update indicators
  useEffect(() => {
    if (
      !ema9SeriesRef.current ||
      !ema20SeriesRef.current ||
      !ema50SeriesRef.current ||
      !indicatorHistory ||
      indicatorHistory.length === 0
    ) return;

    const ema9Data: LineData[] = indicatorHistory
      .filter((h) => h && h.ema9 !== undefined)
      .map((h) => ({
        time: h.time as Time,
        value: h.ema9!,
      }));

    const ema20Data: LineData[] = indicatorHistory
      .filter((h) => h && h.ema20 !== undefined)
      .map((h) => ({
        time: h.time as Time,
        value: h.ema20!,
      }));

    const ema50Data: LineData[] = indicatorHistory
      .filter((h) => h && h.ema50 !== undefined)
      .map((h) => ({
        time: h.time as Time,
        value: h.ema50!,
      }));

    ema9SeriesRef.current.setData(ema9Data);
    ema20SeriesRef.current.setData(ema20Data);
    ema50SeriesRef.current.setData(ema50Data);
  }, [indicatorHistory]);

  // Mark trades on chart
  useEffect(() => {
    if (!candleSeriesRef.current || !trades || trades.length === 0) return;

    const markers = trades.flatMap((trade) => {
      const entryMarker = {
        time: Math.floor(trade.entryTime.getTime() / 1000) as Time,
        position: 'belowBar' as const,
        color: '#2196F3',
        shape: 'arrowUp' as const,
        text: `Entry: ₹${trade.entryPrice.toFixed(2)}`,
      };

      const exitMarker = trade.exitTime && trade.exitPrice
        ? {
            time: Math.floor(trade.exitTime.getTime() / 1000) as Time,
            position: 'aboveBar' as const,
            color: (trade.exitPrice >= trade.entryPrice) ? '#4CAF50' : '#F44336',
            shape: 'arrowDown' as const,
            text: `Exit: ₹${trade.exitPrice.toFixed(2)}`,
          }
        : null;

      return exitMarker ? [entryMarker, exitMarker] : [entryMarker];
    });

    (candleSeriesRef.current as any).setMarkers(markers);
  }, [trades]);

  // Chart control functions
  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const scrollPosition = timeScale.scrollPosition();
      timeScale.scrollToPosition(scrollPosition + 5, false);
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const scrollPosition = timeScale.scrollPosition();
      timeScale.scrollToPosition(scrollPosition - 5, false);
    }
  };

  const handleFitContent = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle chart resize (drag to resize)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = chartHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(400, Math.min(1000, startHeight + deltaY));
      setChartHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative">
      {/* Data Quality Indicators Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          {/* Data Source Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${dataSourceInfo.color} text-white`}>
              <Activity className="w-3 h-3 mr-1" />
              {dataSourceInfo.name}
            </span>

            {/* Data Quality Score */}
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              dataQuality === 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {dataQuality === 100 ? '✓ Real Data' : '✗ No Data'}
            </span>
          </div>

          {/* Symbol and Interval */}
          {symbol && interval && (
            <span className="text-gray-600 font-medium">
              {symbol} · {interval}
            </span>
          )}
        </div>

        {/* Last Updated Timestamp */}
        {lastUpdated && (
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Chart Controls - TradingView Style */}
      <div className="absolute top-12 right-2 z-10 flex flex-col gap-1">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={handleFitContent}
          className="p-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title="Fit Data"
        >
          <Maximize2 className="w-4 h-4 text-gray-700" />
        </button>
        <button
          onClick={handleToggleFullscreen}
          className="p-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4 text-gray-700" />
          ) : (
            <Maximize className="w-4 h-4 text-gray-700" />
          )}
        </button>
      </div>

      {/* Chart Container */}
      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div ref={chartContainerRef} className="w-full" />

        {/* Resize Handle */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-blue-400 transition-colors ${
            isResizing ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          onMouseDown={handleMouseDown}
          title="Drag to resize chart"
        />
      </div>

      {/* Chart Info Footer */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <div>
          <span className="font-medium">{candles.length}</span> candles loaded
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">EMA 9</span>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">EMA 20</span>
          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded">EMA 50</span>
        </div>
      </div>
    </div>
  );
}
