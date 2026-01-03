import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, Time, LineSeriesPartialOptions } from 'lightweight-charts';
import { TrendingDown } from 'lucide-react';

interface EquityCurvePoint {
  timestamp: string | Date;
  equity: number;
  cash: number;
  positions: number;
}

interface EquityCurveChartProps {
  equityCurve: EquityCurvePoint[];
  initialCapital: number;
  maxDrawdownPercent: number;
}

export default function EquityCurveChart({
  equityCurve,
  initialCapital,
  maxDrawdownPercent,
}: EquityCurveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !Array.isArray(equityCurve) || equityCurve.length === 0) return;

    // Clear previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Prepare data
    const equityData = equityCurve.map((point) => ({
      time: (new Date(point.timestamp).getTime() / 1000) as Time,
      value: point.equity,
    }));

    const cashData = equityCurve.map((point) => ({
      time: (new Date(point.timestamp).getTime() / 1000) as Time,
      value: point.cash,
    }));

    const positionsData = equityCurve.map((point) => ({
      time: (new Date(point.timestamp).getTime() / 1000) as Time,
      value: point.positions,
    }));

    // Calculate drawdown series
    let peak = initialCapital;
    const drawdownData = equityCurve.map((point) => {
      if (point.equity > peak) peak = point.equity;
      const drawdownPercent = ((peak - point.equity) / peak) * 100;
      return {
        time: (new Date(point.timestamp).getTime() / 1000) as Time,
        value: -drawdownPercent, // Negative for visual clarity
      };
    });

    if (showBreakdown) {
      // Show cash and positions breakdown
      const cashSeriesOptions: LineSeriesPartialOptions = {
        color: '#10b981',
        lineWidth: 2,
        title: 'Cash',
      };
      const cashSeries = (chart as any).addLineSeries(cashSeriesOptions);
      cashSeries.setData(cashData);

      const positionsSeriesOptions: LineSeriesPartialOptions = {
        color: '#3b82f6',
        lineWidth: 2,
        title: 'Positions Value',
      };
      const positionsSeries = (chart as any).addLineSeries(positionsSeriesOptions);
      positionsSeries.setData(positionsData);
    } else {
      // Show main equity curve
      const equitySeriesOptions: LineSeriesPartialOptions = {
        color: '#2563eb',
        lineWidth: 3,
        title: 'Total Equity',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      };
      const equitySeries = (chart as any).addLineSeries(equitySeriesOptions);
      equitySeries.setData(equityData);

      // Add initial capital reference line
      const initialCapitalLine = (chart as any).addLineSeries({
        color: '#9ca3af',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: 'Initial Capital',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });
      initialCapitalLine.setData([
        { time: equityData[0].time, value: initialCapital },
        { time: equityData[equityData.length - 1].time, value: initialCapital },
      ]);

      // Add drawdown series on separate pane
      const drawdownSeriesOptions: LineSeriesPartialOptions = {
        color: '#ef4444',
        lineWidth: 2,
        title: 'Drawdown %',
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      };
      const drawdownSeries = (chart as any).addLineSeries(drawdownSeriesOptions);
      drawdownSeries.setData(drawdownData);
      drawdownSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        try {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        } catch (e) {
          // Chart disposed
        }
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
  }, [equityCurve, initialCapital, showBreakdown]);

  const finalEquity = Array.isArray(equityCurve) && equityCurve.length > 0 && equityCurve[equityCurve.length - 1].equity !== undefined
    ? equityCurve[equityCurve.length - 1].equity
    : initialCapital;
  const totalReturn = finalEquity - initialCapital;
  const totalReturnPercent = initialCapital > 0 ? ((totalReturn / initialCapital) * 100) : 0;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '₹0';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Equity Curve</h3>
          <p className="text-sm text-gray-600">
            Capital growth over {Array.isArray(equityCurve) ? equityCurve.length : 0} data points
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Return</p>
            <p className={`text-lg font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(totalReturnPercent)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Max Drawdown</p>
            <p className="text-lg font-bold text-red-600 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {maxDrawdownPercent.toFixed(2)}%
            </p>
          </div>

          {/* Toggle */}
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showBreakdown ? 'Show Equity' : 'Show Breakdown'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="w-full" />

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        {showBreakdown ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-green-500"></div>
              <span className="text-gray-600">Cash Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-500"></div>
              <span className="text-gray-600">Positions Value</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-blue-600" style={{ height: '3px' }}></div>
              <span className="text-gray-600">Total Equity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-gray-400 border-dashed"></div>
              <span className="text-gray-600">Initial Capital</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-red-500"></div>
              <span className="text-gray-600">Drawdown</span>
            </div>
          </>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">Starting Capital</p>
          <p className="text-base font-semibold text-gray-800">
            {formatCurrency(initialCapital)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Final Capital</p>
          <p className={`text-base font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(finalEquity)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">Net Profit/Loss</p>
          <p className={`text-base font-semibold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalReturn >= 0 ? '+' : ''}{formatCurrency(Math.abs(totalReturn))}
          </p>
        </div>
      </div>
    </div>
  );
}
