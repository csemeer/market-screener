import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  IChartApi,
  Time,
  CandlestickData,
  LineData,
  HistogramData,
  LineStyle,
} from 'lightweight-charts';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
  macd_histogram?: number;
  ema9?: number;
  ema21?: number;
  ema50?: number;
  bb_upper?: number;
  bb_middle?: number;
  bb_lower?: number;
  vwap?: number;
}

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
}

interface BacktestLightweightChartProps {
  symbol: string;
  exchange: string;
  chartData: ChartDataPoint[];
  tradeMarkers: TradeMarker[];
}

export default function BacktestLightweightChart({
  symbol,
  exchange,
  chartData,
  tradeMarkers,
}: BacktestLightweightChartProps) {
  const mainChartRef = useRef<HTMLDivElement>(null);
  const volumeChartRef = useRef<HTMLDivElement>(null);
  const rsiChartRef = useRef<HTMLDivElement>(null);
  const macdChartRef = useRef<HTMLDivElement>(null);

  const mainChart = useRef<IChartApi | null>(null);
  const volumeChart = useRef<IChartApi | null>(null);
  const rsiChart = useRef<IChartApi | null>(null);
  const macdChart = useRef<IChartApi | null>(null);

  const [activeIndicators, setActiveIndicators] = useState({
    ema: true,
    bollinger: true,
    vwap: true,
    volume: true,
    rsi: true,
    macd: true,
  });

  useEffect(() => {
    if (!mainChartRef.current || chartData.length === 0) return;

    // Clear existing charts
    if (mainChart.current) mainChart.current.remove();
    if (volumeChart.current) volumeChart.current.remove();
    if (rsiChart.current) rsiChart.current.remove();
    if (macdChart.current) macdChart.current.remove();

    initializeCharts();

    return () => {
      if (mainChart.current) mainChart.current.remove();
      if (volumeChart.current) volumeChart.current.remove();
      if (rsiChart.current) rsiChart.current.remove();
      if (macdChart.current) macdChart.current.remove();
    };
  }, [chartData, activeIndicators]);

  const initializeCharts = () => {
    if (!mainChartRef.current) return;

    const chartOptions = {
      layout: {
        background: { type: ColorType.Solid as const, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0', style: 1 },
        horzLines: { color: '#f0f0f0', style: 1 },
      },
      rightPriceScale: {
        borderColor: '#d1d4dc',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#d1d4dc',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#2962FF',
        },
        horzLine: {
          color: '#758696',
          style: 3,
          labelBackgroundColor: '#2962FF',
        },
      },
    };

    // Main price chart
    mainChart.current = createChart(mainChartRef.current, {
      ...chartOptions,
      width: mainChartRef.current.clientWidth,
      height: 500,
    });

    createMainChart();

    // Volume chart
    if (activeIndicators.volume && volumeChartRef.current) {
      volumeChart.current = createChart(volumeChartRef.current, {
        ...chartOptions,
        width: volumeChartRef.current.clientWidth,
        height: 150,
      });
      createVolumeChart();
    }

    // RSI chart
    if (activeIndicators.rsi && rsiChartRef.current) {
      rsiChart.current = createChart(rsiChartRef.current, {
        ...chartOptions,
        width: rsiChartRef.current.clientWidth,
        height: 140,
      });
      createRSIChart();
    }

    // MACD chart
    if (activeIndicators.macd && macdChartRef.current) {
      macdChart.current = createChart(macdChartRef.current, {
        ...chartOptions,
        width: macdChartRef.current.clientWidth,
        height: 140,
      });
      createMACDChart();
    }

    // Synchronize crosshairs
    synchronizeCharts();
  };

  const createMainChart = () => {
    if (!mainChart.current) return;

    // Candlestick series
    const candlestickSeries = mainChart.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // Format candlestick data
    const candleData: CandlestickData[] = chartData.map((item) => ({
      time: (new Date(item.time).getTime() / 1000) as Time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    candlestickSeries.setData(candleData);

    // Add EMAs
    if (activeIndicators.ema) {
      if (chartData.some((d) => d.ema9)) {
        const ema9Series = mainChart.current.addLineSeries({
          color: '#2962FF',
          lineWidth: 2,
          title: 'EMA 9',
        });
        const ema9Data: LineData[] = chartData
          .filter((d) => d.ema9)
          .map((d) => ({
            time: (new Date(d.time).getTime() / 1000) as Time,
            value: d.ema9!,
          }));
        ema9Series.setData(ema9Data);
      }

      if (chartData.some((d) => d.ema21)) {
        const ema21Series = mainChart.current.addLineSeries({
          color: '#9C27B0',
          lineWidth: 2,
          title: 'EMA 21',
        });
        const ema21Data: LineData[] = chartData
          .filter((d) => d.ema21)
          .map((d) => ({
            time: (new Date(d.time).getTime() / 1000) as Time,
            value: d.ema21!,
          }));
        ema21Series.setData(ema21Data);
      }

      if (chartData.some((d) => d.ema50)) {
        const ema50Series = mainChart.current.addLineSeries({
          color: '#FF6D00',
          lineWidth: 2,
          title: 'EMA 50',
        });
        const ema50Data: LineData[] = chartData
          .filter((d) => d.ema50)
          .map((d) => ({
            time: (new Date(d.time).getTime() / 1000) as Time,
            value: d.ema50!,
          }));
        ema50Series.setData(ema50Data);
      }
    }

    // Add Bollinger Bands
    if (activeIndicators.bollinger) {
      if (chartData.some((d) => d.bb_upper && d.bb_lower)) {
        const bbUpperSeries = mainChart.current.addLineSeries({
          color: '#9E9E9E',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Upper',
        });
        const bbUpperData: LineData[] = chartData
          .filter((d) => d.bb_upper)
          .map((d) => ({
            time: (new Date(d.time).getTime() / 1000) as Time,
            value: d.bb_upper!,
          }));
        bbUpperSeries.setData(bbUpperData);

        const bbMiddleSeries = mainChart.current.addLineSeries({
          color: '#757575',
          lineWidth: 1,
          title: 'BB Middle',
        });
        const bbMiddleData: LineData[] = chartData
          .filter((d) => d.bb_middle)
          .map((d) => ({
            time: (new Date(d.time).getTime() / 1000) as Time,
            value: d.bb_middle!,
          }));
        bbMiddleSeries.setData(bbMiddleData);

        const bbLowerSeries = mainChart.current.addLineSeries({
          color: '#9E9E9E',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: 'BB Lower',
        });
        const bbLowerData: LineData[] = chartData
          .filter((d) => d.bb_lower)
          .map((d) => ({
            time: (new Date(d.time).getTime() / 1000) as Time,
            value: d.bb_lower!,
          }));
        bbLowerSeries.setData(bbLowerData);
      }
    }

    // Add VWAP
    if (activeIndicators.vwap && chartData.some((d) => d.vwap)) {
      const vwapSeries = mainChart.current.addLineSeries({
        color: '#00BCD4',
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: 'VWAP',
      });
      const vwapData: LineData[] = chartData
        .filter((d) => d.vwap)
        .map((d) => ({
          time: (new Date(d.time).getTime() / 1000) as Time,
          value: d.vwap!,
        }));
      vwapSeries.setData(vwapData);
    }

    // Add trade markers
    const markers: any[] = [];

    tradeMarkers.forEach((trade) => {
      const entryTime = (new Date(trade.time).getTime() / 1000) as Time;

      // Entry marker
      markers.push({
        time: entryTime,
        position: 'belowBar',
        color: '#2196F3',
        shape: 'arrowUp',
        text: `Entry ₹${trade.price.toFixed(2)}`,
      });

      // Exit marker
      if (trade.exitTime && trade.exitPrice) {
        const exitTime = (new Date(trade.exitTime).getTime() / 1000) as Time;
        const isProfitable = (trade.pnl ?? 0) >= 0;

        markers.push({
          time: exitTime,
          position: isProfitable ? 'aboveBar' : 'belowBar',
          color: isProfitable ? '#4caf50' : '#ff5252',
          shape: 'arrowDown',
          text: `Exit ₹${trade.exitPrice.toFixed(2)} (${isProfitable ? '+' : ''}${trade.pnlPercent?.toFixed(2)}%)`,
        });
      }
    });

    candlestickSeries.setMarkers(markers);

    // Add price lines for open trades
    tradeMarkers
      .filter((t) => !t.exitTime)
      .forEach((trade) => {
        // Entry line
        candlestickSeries.createPriceLine({
          price: trade.price,
          color: '#2196F3',
          lineWidth: 2,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `Entry: ₹${trade.price.toFixed(2)}`,
        });

        // Stop Loss line
        candlestickSeries.createPriceLine({
          price: trade.stopLoss,
          color: '#ef5350',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Stop Loss: ₹${trade.stopLoss.toFixed(2)}`,
        });

        // Target line
        candlestickSeries.createPriceLine({
          price: trade.target,
          color: '#26a69a',
          lineWidth: 2,
          lineStyle: LineStyle.Solid,
          axisLabelVisible: true,
          title: `Target: ₹${trade.target.toFixed(2)}`,
        });
      });

    mainChart.current.timeScale().fitContent();
  };

  const createVolumeChart = () => {
    if (!volumeChart.current) return;

    const volumeSeries = volumeChart.current.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    const volumeData: HistogramData[] = chartData.map((item) => {
      const isBullish = item.close >= item.open;
      return {
        time: (new Date(item.time).getTime() / 1000) as Time,
        value: item.volume,
        color: isBullish ? '#26a69a80' : '#ef535080',
      };
    });

    volumeSeries.setData(volumeData);
    volumeChart.current.timeScale().fitContent();
  };

  const createRSIChart = () => {
    if (!rsiChart.current) return;

    const rsiSeries = rsiChart.current.addLineSeries({
      color: '#7B68EE',
      lineWidth: 2,
      title: 'RSI(14)',
    });

    const rsiData: LineData[] = chartData
      .filter((d) => d.rsi !== undefined)
      .map((d) => ({
        time: (new Date(d.time).getTime() / 1000) as Time,
        value: d.rsi!,
      }));

    rsiSeries.setData(rsiData);

    // Add reference lines
    rsiSeries.createPriceLine({
      price: 70,
      color: '#ef5350',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Overbought',
    });

    rsiSeries.createPriceLine({
      price: 50,
      color: '#9e9e9e',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: false,
      title: '',
    });

    rsiSeries.createPriceLine({
      price: 30,
      color: '#26a69a',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Oversold',
    });

    rsiChart.current.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    });

    rsiChart.current.timeScale().fitContent();
  };

  const createMACDChart = () => {
    if (!macdChart.current) return;

    // MACD Histogram
    const histogramSeries = macdChart.current.addHistogramSeries({
      color: '#546E7A',
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    const histogramData: HistogramData[] = chartData
      .filter((d) => d.macd_histogram !== undefined)
      .map((d) => ({
        time: (new Date(d.time).getTime() / 1000) as Time,
        value: d.macd_histogram!,
        color: d.macd_histogram! >= 0 ? '#26a69a80' : '#ef535080',
      }));

    histogramSeries.setData(histogramData);

    // MACD Line
    const macdSeries = macdChart.current.addLineSeries({
      color: '#2196F3',
      lineWidth: 2,
      title: 'MACD',
    });

    const macdData: LineData[] = chartData
      .filter((d) => d.macd !== undefined)
      .map((d) => ({
        time: (new Date(d.time).getTime() / 1000) as Time,
        value: d.macd!,
      }));

    macdSeries.setData(macdData);

    // Signal Line
    const signalSeries = macdChart.current.addLineSeries({
      color: '#FF6B6B',
      lineWidth: 2,
      title: 'Signal',
    });

    const signalData: LineData[] = chartData
      .filter((d) => d.macd_signal !== undefined)
      .map((d) => ({
        time: (new Date(d.time).getTime() / 1000) as Time,
        value: d.macd_signal!,
      }));

    signalSeries.setData(signalData);

    // Zero line
    macdSeries.createPriceLine({
      price: 0,
      color: '#616161',
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: false,
      title: '',
    });

    macdChart.current.timeScale().fitContent();
  };

  const synchronizeCharts = () => {
    const charts = [
      mainChart.current,
      volumeChart.current,
      rsiChart.current,
      macdChart.current,
    ].filter(Boolean);

    charts.forEach((chart, index) => {
      chart?.timeScale().subscribeVisibleLogicalRangeChange((timeRange) => {
        charts.forEach((c, i) => {
          if (i !== index && c) {
            c.timeScale().setVisibleLogicalRange(timeRange as any);
          }
        });
      });
    });
  };

  const toggleIndicator = (indicator: keyof typeof activeIndicators) => {
    setActiveIndicators((prev) => ({
      ...prev,
      [indicator]: !prev[indicator],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              {symbol} / {exchange}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {chartData.length} candles • TradingView Lightweight Charts
            </p>
          </div>
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Indicators:</span>
          {Object.entries(activeIndicators).map(([key, value]) => (
            <button
              key={key}
              onClick={() => toggleIndicator(key as keyof typeof activeIndicators)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Price Chart */}
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Price Chart
        </h4>
        <div ref={mainChartRef} />
      </div>

      {/* Volume Chart */}
      {activeIndicators.volume && (
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Volume
          </h4>
          <div ref={volumeChartRef} />
        </div>
      )}

      {/* RSI Chart */}
      {activeIndicators.rsi && (
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            RSI (14)
          </h4>
          <div ref={rsiChartRef} />
        </div>
      )}

      {/* MACD Chart */}
      {activeIndicators.macd && (
        <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            MACD (12, 26, 9)
          </h4>
          <div ref={macdChartRef} />
        </div>
      )}
    </div>
  );
}
