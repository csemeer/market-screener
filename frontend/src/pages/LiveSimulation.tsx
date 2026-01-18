import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, RotateCcw, ArrowLeft, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import LiveChart from '../components/simulation/LiveChart';

interface Strategy {
  id: number;
  name: string;
  category: string;
  entry_conditions: any;
  exit_conditions: any;
  indicators_config: any;
  recommended_stop_loss_percent?: number;
  recommended_target_percent?: number;
}

interface Trade {
  id: number;
  entryTime: Date;
  entryPrice: number;
  exitTime?: Date;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  pnlPercent?: number;
  status: 'open' | 'closed';
  type: 'long' | 'short';
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function LiveSimulation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [strategy, setStrategy] = useState<Strategy | null>(null);

  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x, 10x
  const [currentIndex, setCurrentIndex] = useState(0);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [visibleCandles, setVisibleCandles] = useState<Candle[]>([]);

  // Trading state
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentTrade, setCurrentTrade] = useState<Trade | null>(null);
  const [balance, setBalance] = useState(100000); // Starting balance
  const [initialBalance] = useState(100000);

  // Metrics
  const [totalTrades, setTotalTrades] = useState(0);
  const [winningTrades, setWinningTrades] = useState(0);
  const [losingTrades, setLosingTrades] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  // Indicator values
  const [indicators, setIndicators] = useState<any>({});

  // Simulation parameters
  const [symbol] = useState('RELIANCE');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [timeframe] = useState('5m');

  const intervalRef = useRef<number | null>(null);
  const tradeIdCounter = useRef(0);

  // Load strategy from session storage or location state
  useEffect(() => {
    const strategyData = location.state?.strategy ||
                        JSON.parse(sessionStorage.getItem('live_simulation_strategy') || 'null');

    if (strategyData) {
      setStrategy(strategyData.strategy || strategyData);
    } else {
      toast.error('No strategy selected for simulation');
      navigate('/strategies');
    }
  }, [location, navigate]);

  const loadHistoricalData = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/market/historical`, {
        params: {
          symbol,
          date,
          interval: timeframe
        }
      });

      if (response.data.candles && response.data.candles.length > 0) {
        setCandles(response.data.candles);
        setCurrentIndex(0);
        setVisibleCandles([]);
        setTrades([]);
        setCurrentTrade(null);
        setBalance(initialBalance);
        setTotalPnL(0);
        setWinningTrades(0);
        setLosingTrades(0);
        setTotalTrades(0);
        tradeIdCounter.current = 0; // Reset trade ID counter
        toast.success(`Loaded ${response.data.candles.length} candles for ${symbol}`);
      } else {
        toast.error('No data available for selected date');
      }
    } catch (error: any) {
      console.error('Error loading historical data:', error);
      toast.error(error.response?.data?.error || 'Failed to load historical data');
    }
  }, [symbol, date, timeframe, initialBalance]);

  // Load historical data when strategy is ready
  useEffect(() => {
    if (strategy && symbol && date) {
      loadHistoricalData();
    }
  }, [strategy, symbol, date, loadHistoricalData]);

  // Simulation loop
  useEffect(() => {
    if (isPlaying && currentIndex < candles.length) {
      const interval = 1000 / speed; // Speed multiplier

      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= candles.length) {
            setIsPlaying(false);
            toast.success('Simulation completed!');
            return prev;
          }

          // Add new candle to visible candles (check for duplicates)
          setVisibleCandles(prevVisible => {
            const newCandle = candles[next];
            // Only add if this timestamp doesn't already exist
            if (prevVisible.find(c => c.time === newCandle.time)) {
              return prevVisible;
            }
            return [...prevVisible, newCandle];
          });

          // Calculate indicators for current candle
          calculateIndicators(next);

          // Check for entry/exit signals
          checkTradingSignals(next);

          return next;
        });
      }, interval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPlaying, speed, currentIndex, candles]);

  const calculateIndicators = (index: number) => {
    if (!strategy?.indicators_config) return;

    const config = strategy.indicators_config;
    const currentCandles = candles.slice(0, index + 1);

    const newIndicators: any = {};

    // Calculate EMA
    if (config.useEMA) {
      newIndicators.ema9 = calculateEMA(currentCandles, config.emaFast || 9);
      newIndicators.ema20 = calculateEMA(currentCandles, config.emaMiddle || 20);
      newIndicators.ema50 = calculateEMA(currentCandles, config.emaSlow || 50);
    }

    // Calculate RSI
    if (config.useRSI) {
      newIndicators.rsi = calculateRSI(currentCandles, config.rsiPeriod || 14);
    }

    // Calculate MACD
    if (config.useMACD) {
      const macd = calculateMACD(currentCandles, config.macdFast || 12, config.macdSlow || 26, config.macdSignal || 9);
      newIndicators.macd = macd.macd;
      newIndicators.macdSignal = macd.signal;
      newIndicators.macdHistogram = macd.histogram;
    }

    // Calculate volume average
    if (config.useVolume) {
      newIndicators.volumeAvg = calculateVolumeAverage(currentCandles, config.volumePeriod || 20);
    }

    setIndicators(newIndicators);
  };

  const checkTradingSignals = (index: number) => {
    if (!strategy || index < 50) return; // Need enough data for indicators

    const currentCandle = candles[index];
    const prevCandle = candles[index - 1];

    // Check for entry signal (if no open trade)
    if (!currentTrade) {
      const shouldEnter = evaluateEntryConditions(currentCandle, prevCandle, index);

      if (shouldEnter) {
        enterTrade(currentCandle, index);
      }
    }
    // Check for exit signal (if open trade exists)
    else {
      const shouldExit = evaluateExitConditions(currentCandle, prevCandle, index);

      if (shouldExit) {
        exitTrade(currentCandle, index);
      }
    }
  };

  const evaluateEntryConditions = (candle: Candle, prevCandle: Candle, index: number): boolean => {
    if (!strategy) return false;

    const conditions = strategy.entry_conditions;
    const config = strategy.indicators_config;

    // Volume Breakout Strategy
    if (conditions.type === 'VOLUME_BREAKOUT') {
      const volumeMultiple = conditions.volumeMultiple || 2.0;
      const volumeSpike = candle.volume > (indicators.volumeAvg || 0) * volumeMultiple;

      const priceBreakout = candle.close > prevCandle.high;

      const emaAligned = config.useEMA &&
        indicators.ema9 > indicators.ema20 &&
        indicators.ema20 > indicators.ema50;

      return volumeSpike && priceBreakout && emaAligned;
    }

    // Trend Following Strategy
    if (conditions.type === 'TREND_FOLLOWING') {
      const emaAligned = config.useEMA &&
        candle.close > indicators.ema9 &&
        indicators.ema9 > indicators.ema20 &&
        indicators.ema20 > indicators.ema50;

      const rsiOk = !config.useRSI || (indicators.rsi > 50 && indicators.rsi < 70);
      const macdPositive = !config.useMACD || indicators.macd > indicators.macdSignal;

      return emaAligned && rsiOk && macdPositive;
    }

    // Mean Reversion Strategy
    if (conditions.type === 'MEAN_REVERSION') {
      const rsiOversold = config.useRSI && indicators.rsi < 30;
      const macdTurning = config.useMACD &&
        indicators.macd > indicators.macdSignal &&
        prevCandle && candles[index - 1];

      return rsiOversold || macdTurning;
    }

    // Momentum Strategy
    if (conditions.type === 'MOMENTUM') {
      const rsiStrong = config.useRSI && indicators.rsi > 60;
      const priceAboveEMA = config.useEMA && candle.close > indicators.ema20;
      const macdStrong = config.useMACD && indicators.macdHistogram > 0;

      return rsiStrong && priceAboveEMA && macdStrong;
    }

    return false;
  };

  const evaluateExitConditions = (candle: Candle, _prevCandle: Candle, index: number): boolean => {
    if (!currentTrade || !strategy) return false;

    const exitConditions = strategy.exit_conditions;
    const entryPrice = currentTrade.entryPrice;
    const currentPrice = candle.close;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    // Profit target hit
    if (exitConditions.targetPercent && pnlPercent >= exitConditions.targetPercent) {
      return true;
    }

    // Stop loss hit
    if (exitConditions.stopLossPercent && pnlPercent <= -exitConditions.stopLossPercent) {
      return true;
    }

    // Trailing stop
    if (exitConditions.useTrailingStop && currentTrade.exitPrice) {
      const trailingActivation = exitConditions.trailingStopActivationPercent || 1.0;
      if (pnlPercent >= trailingActivation) {
        const trailingDistance = exitConditions.trailingStopDistance || 0.5;
        const highestPrice = Math.max(currentPrice, currentTrade.exitPrice);
        const stopPrice = highestPrice * (1 - trailingDistance / 100);

        if (currentPrice <= stopPrice) {
          return true;
        }
      }
    }

    // Time-based exit
    if (exitConditions.maxHoldTimeMinutes) {
      const timeframe_minutes = timeframe === '1m' ? 1 : timeframe === '3m' ? 3 : timeframe === '5m' ? 5 : 15;
      const candlesSinceEntry = index - (currentTrade as any).entryIndex;
      const minutesHeld = candlesSinceEntry * timeframe_minutes;

      if (minutesHeld >= exitConditions.maxHoldTimeMinutes) {
        return true;
      }
    }

    return false;
  };

  const enterTrade = (candle: Candle, index: number) => {
    const positionSize = balance * 0.1; // 10% of balance per trade
    const quantity = Math.floor(positionSize / candle.close);

    tradeIdCounter.current += 1; // Increment unique ID counter

    const trade: Trade = {
      id: tradeIdCounter.current,
      entryTime: new Date(candle.time * 1000),
      entryPrice: candle.close,
      quantity,
      status: 'open',
      type: 'long',
      exitPrice: candle.close // Track highest for trailing stop
    };

    (trade as any).entryIndex = index;

    setCurrentTrade(trade);
    toast.success(`📈 Entry: ${symbol} @ ₹${candle.close.toFixed(2)}`);
  };

  const exitTrade = (candle: Candle, _index: number) => {
    if (!currentTrade) return;

    const exitPrice = candle.close;
    const pnl = (exitPrice - currentTrade.entryPrice) * currentTrade.quantity;
    const pnlPercent = ((exitPrice - currentTrade.entryPrice) / currentTrade.entryPrice) * 100;

    const closedTrade: Trade = {
      ...currentTrade,
      exitTime: new Date(candle.time * 1000),
      exitPrice,
      pnl,
      pnlPercent,
      status: 'closed'
    };

    setTrades(prev => [...prev, closedTrade]);
    setBalance(prev => prev + pnl);
    setTotalPnL(prev => prev + pnl);
    setTotalTrades(prev => prev + 1);

    if (pnl > 0) {
      setWinningTrades(prev => prev + 1);
      toast.success(`✅ Exit: ${symbol} @ ₹${exitPrice.toFixed(2)} | P&L: +₹${pnl.toFixed(2)} (+${pnlPercent.toFixed(2)}%)`);
    } else {
      setLosingTrades(prev => prev + 1);
      toast.error(`❌ Exit: ${symbol} @ ₹${exitPrice.toFixed(2)} | P&L: ₹${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
    }

    setCurrentTrade(null);
  };

  // Helper functions for indicators
  const calculateEMA = (data: Candle[], period: number): number => {
    if (data.length < period) return data[data.length - 1]?.close || 0;

    const k = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;

    for (let i = period; i < data.length; i++) {
      ema = data[i].close * k + ema * (1 - k);
    }

    return ema;
  };

  const calculateRSI = (data: Candle[], period: number): number => {
    if (data.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };

  const calculateMACD = (data: Candle[], fastPeriod: number, slowPeriod: number, _signalPeriod: number) => {
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);
    const macd = fastEMA - slowEMA;

    // Simplified signal calculation
    const signal = macd * 0.9; // Approximation
    const histogram = macd - signal;

    return { macd, signal, histogram };
  };

  const calculateVolumeAverage = (data: Candle[], period: number): number => {
    if (data.length < period) return data[data.length - 1]?.volume || 0;

    const recentVolumes = data.slice(-period);
    return recentVolumes.reduce((sum, c) => sum + c.volume, 0) / period;
  };

  const handlePlayPause = () => {
    if (currentIndex >= candles.length - 1) {
      // Restart simulation
      setCurrentIndex(0);
      setVisibleCandles([]);
      setTrades([]);
      setCurrentTrade(null);
      setBalance(initialBalance);
      setTotalPnL(0);
      setWinningTrades(0);
      setLosingTrades(0);
      setTotalTrades(0);
      tradeIdCounter.current = 0; // Reset trade ID counter
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setVisibleCandles([]);
    setTrades([]);
    setCurrentTrade(null);
    setBalance(initialBalance);
    setTotalPnL(0);
    setWinningTrades(0);
    setLosingTrades(0);
    setTotalTrades(0);
    tradeIdCounter.current = 0; // Reset trade ID counter
  };

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/strategies')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Simulation Trading</h1>
            <p className="text-sm text-gray-600">
              {strategy?.name || 'No Strategy'} • {symbol} • {date} • {timeframe}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value={1}>1x Speed</option>
            <option value={2}>2x Speed</option>
            <option value={5}>5x Speed</option>
            <option value={10}>10x Speed</option>
          </select>

          <button
            onClick={handlePlayPause}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 ${
              isPlaying
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {currentIndex >= candles.length - 1 ? 'Restart' : 'Play'}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Live Metrics */}
        <div className="lg:col-span-1 space-y-4">
          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Account Balance</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Initial:</span>
                <span className="text-sm font-medium">₹{initialBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Current:</span>
                <span className={`text-lg font-bold ${balance >= initialBalance ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{balance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-xs text-gray-500">Total P&L:</span>
                <span className={`text-sm font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)} ({((totalPnL / initialBalance) * 100).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Performance</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded p-2">
                <div className="text-xs text-gray-600">Total Trades</div>
                <div className="text-xl font-bold text-gray-900">{totalTrades}</div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <div className="text-xs text-green-600">Win Rate</div>
                <div className="text-xl font-bold text-green-600">{winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-blue-50 rounded p-2">
                <div className="text-xs text-blue-600">Winners</div>
                <div className="text-xl font-bold text-blue-600">{winningTrades}</div>
              </div>
              <div className="bg-red-50 rounded p-2">
                <div className="text-xs text-red-600">Losers</div>
                <div className="text-xl font-bold text-red-600">{losingTrades}</div>
              </div>
            </div>
          </div>

          {/* Current Trade */}
          {currentTrade && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Open Position
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Entry:</span>
                  <span className="font-medium">₹{currentTrade.entryPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Current:</span>
                  <span className="font-medium">₹{(visibleCandles[visibleCandles.length - 1]?.close || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-blue-700">Unrealized P&L:</span>
                  <span className={`font-bold ${
                    ((visibleCandles[visibleCandles.length - 1]?.close || 0) - currentTrade.entryPrice) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {((visibleCandles[visibleCandles.length - 1]?.close || 0) - currentTrade.entryPrice) >= 0 ? '+' : ''}
                    ₹{(((visibleCandles[visibleCandles.length - 1]?.close || 0) - currentTrade.entryPrice) * currentTrade.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Trades */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3">Recent Trades</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {trades.slice().reverse().slice(0, 10).map((trade) => (
                <div key={trade.id} className={`p-2 rounded border ${
                  (trade.pnl || 0) > 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <div className="text-xs">
                      <div className="font-medium">₹{trade.entryPrice.toFixed(2)} → ₹{trade.exitPrice?.toFixed(2)}</div>
                      <div className="text-gray-600">{trade.exitTime?.toLocaleTimeString()}</div>
                    </div>
                    <div className={`text-right text-xs font-bold ${
                      (trade.pnl || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(trade.pnl || 0) > 0 ? '+' : ''}₹{(trade.pnl || 0).toFixed(2)}
                      <div className="text-xs">{(trade.pnlPercent || 0).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              ))}
              {trades.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No trades yet. Start simulation to see trades.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Chart (placeholder - will be enhanced with actual chart library) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Live Chart</h3>
              <div className="text-sm text-gray-600">
                {visibleCandles.length} / {candles.length} candles
              </div>
            </div>

            {/* Live Chart */}
            {visibleCandles.length > 0 ? (
              <>
                <LiveChart
                  candles={visibleCandles}
                  indicators={indicators}
                  currentTrade={currentTrade}
                  trades={trades}
                />

                {/* Indicators Display below chart */}
                {indicators.ema9 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">Live Indicators</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {indicators.ema9 && (
                        <div className="bg-white rounded p-2">
                          <span className="text-gray-600">EMA 9:</span>
                          <span className="ml-2 font-medium text-blue-600">₹{indicators.ema9.toFixed(2)}</span>
                        </div>
                      )}
                      {indicators.ema20 && (
                        <div className="bg-white rounded p-2">
                          <span className="text-gray-600">EMA 20:</span>
                          <span className="ml-2 font-medium text-purple-600">₹{indicators.ema20.toFixed(2)}</span>
                        </div>
                      )}
                      {indicators.ema50 && (
                        <div className="bg-white rounded p-2">
                          <span className="text-gray-600">EMA 50:</span>
                          <span className="ml-2 font-medium text-orange-600">₹{indicators.ema50.toFixed(2)}</span>
                        </div>
                      )}
                      {indicators.rsi && (
                        <div className="bg-white rounded p-2">
                          <span className="text-gray-600">RSI:</span>
                          <span className={`ml-2 font-medium ${
                            indicators.rsi > 70 ? 'text-red-600' : indicators.rsi < 30 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {indicators.rsi.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {indicators.macd && (
                        <div className="bg-white rounded p-2">
                          <span className="text-gray-600">MACD:</span>
                          <span className={`ml-2 font-medium ${
                            indicators.macd > indicators.macdSignal ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {indicators.macd.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {indicators.volumeAvg && (
                        <div className="bg-white rounded p-2">
                          <span className="text-gray-600">Vol Avg:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {(indicators.volumeAvg / 1000).toFixed(0)}K
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[500px] flex items-center justify-center">
                <div className="text-gray-500">
                  <p className="text-lg font-medium">Ready to Start Simulation</p>
                  <p className="text-sm mt-2">Click Play to begin live trading simulation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
