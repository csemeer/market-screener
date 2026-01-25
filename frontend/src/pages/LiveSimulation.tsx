import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, RotateCcw, ArrowLeft, Activity, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import EnhancedLiveChart from '../components/simulation/EnhancedLiveChart';

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
  entryCandelTime?: number; // Original candle Unix timestamp for chart markers
  exitTime?: Date;
  exitPrice?: number;
  exitCandleTime?: number; // Original candle Unix timestamp for chart markers
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
  const [indicators, setIndicators] = useState<any>({}); // Latest indicator values
  const [indicatorHistory, setIndicatorHistory] = useState<any[]>([]); // Indicator values for each candle

  // Simulation parameters
  const [symbol, setSymbol] = useState('RELIANCE');
  const [date, setDate] = useState(() => {
    // Default to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });
  const [timeframe, setTimeframe] = useState('5m');
  const [showSettings, setShowSettings] = useState(false);
  const [tradingStartIndex, setTradingStartIndex] = useState(0); // Index where actual trading begins

  // Data source tracking
  const [dataSource, setDataSource] = useState<'yahoo-finance' | 'upstox' | 'unknown'>('unknown');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Debug panel state
  const [showDebug, setShowDebug] = useState(true); // Show by default to help diagnose
  const [debugInfo, setDebugInfo] = useState<any>({
    status: 'Not started',
    currentIndex: 0,
    totalCandles: 0,
    tradingStartIndex: 0,
    indicators: {},
    lastCheck: null,
    conditions: {},
    reason: 'Simulation not started'
  });

  const intervalRef = useRef<number | null>(null);
  const tradeIdCounter = useRef(0);
  const currentTradeRef = useRef<Trade | null>(null); // Track current trade synchronously

  // Utility functions for timezone conversion
  const detectMarket = (symbol: string): 'INDIAN' | 'US' => {
    // Common Indian stock symbols (NSE/BSE)
    const indianStocks = [
      'RELIANCE', 'TCS', 'INFY', 'HDFC', 'HDFCBANK', 'ICICIBANK', 'SBIN', 'BHARTIARTL',
      'ITC', 'KOTAKBANK', 'LT', 'AXISBANK', 'WIPRO', 'ASIANPAINT', 'MARUTI', 'SUNPHARMA',
      'TITAN', 'BAJFINANCE', 'NESTLEIND', 'ULTRACEMCO', 'POWERGRID', 'NTPC', 'ONGC',
      'TATAMOTORS', 'TATASTEEL', 'TECHM', 'HCLTECH', 'INDUSINDBK', 'ADANIENT', 'ADANIPORTS',
      'JSWSTEEL', 'HINDALCO', 'COALINDIA', 'DRREDDY', 'GRASIM', 'CIPLA', 'EICHERMOT',
      'BAJAJFINSV', 'DIVISLAB', 'SHREECEM', 'BRITANNIA', 'HEROMOTOCO', 'UPL', 'APOLLOHOSP',
      'DABUR', 'PIDILITIND', 'GODREJCP', 'HINDUNILVR', 'BANDHANBNK', 'LICHSGFIN',
      'DLF', 'KITEX', 'DIXON', 'IRCTC', 'ZOMATO', 'NYKAA', 'PAYTM', 'POLICYBZR'
    ];

    // Check if symbol (uppercase) is in Indian stocks list
    const symbolUpper = symbol.toUpperCase().replace(/\.NS$|\.BO$/, ''); // Remove .NS or .BO suffix if present
    if (indianStocks.includes(symbolUpper)) {
      return 'INDIAN';
    }

    // Check for common US stock patterns (usually all caps, 1-5 characters)
    // Examples: AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA, etc.
    if (symbolUpper.match(/^[A-Z]{1,5}$/) && !indianStocks.includes(symbolUpper)) {
      // If it's short and not in Indian list, likely US
      // But be careful - some Indian stocks are also short
      // Default to INDIAN if symbol is all caps and not obviously US
      const commonUSStocks = [
        'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK',
        'V', 'JNJ', 'WMT', 'JPM', 'MA', 'PG', 'XOM', 'HD', 'CVX', 'LLY', 'ABBV',
        'MRK', 'KO', 'PEP', 'COST', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'ABT',
        'DHR', 'NKE', 'VZ', 'ADBE', 'CRM', 'NFLX', 'TXN', 'CMCSA', 'AMD', 'INTC',
        'PM', 'UNP', 'HON', 'NEE', 'RTX', 'QCOM', 'UPS', 'ORCL', 'SBUX', 'INTU'
      ];
      if (commonUSStocks.includes(symbolUpper)) {
        return 'US';
      }
    }

    // Default to INDIAN for this market screener app
    return 'INDIAN';
  };

  const convertToLocalTime = (utcTimestamp: number, market: 'INDIAN' | 'US'): Date => {
    // Create date from UTC timestamp (in seconds)
    const utcDate = new Date(utcTimestamp * 1000);

    if (market === 'INDIAN') {
      // Indian Standard Time: UTC+5:30
      const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
      return new Date(utcDate.getTime() + istOffset);
    } else {
      // US Eastern Time: UTC-5 (EST) or UTC-4 (EDT)
      // For simplicity, we'll use UTC-5 (can be enhanced with DST detection)
      const estOffset = -5 * 60 * 60 * 1000; // -5 hours in milliseconds
      return new Date(utcDate.getTime() + estOffset);
    }
  };

  const formatLocalTime = (utcTimestamp: number, symbol: string): string => {
    const market = detectMarket(symbol);
    const localDate = convertToLocalTime(utcTimestamp, market);
    const timezoneSuffix = market === 'INDIAN' ? ' IST' : ' EST';

    return localDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + timezoneSuffix;
  };

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
      setIsPlaying(false); // Stop any running simulation

      const response = await axios.get(`http://localhost:3001/api/market/historical`, {
        params: {
          symbol,
          date,
          interval: timeframe,
          preCandles: 75 // Request 75 candles before trading period for context
        }
      });

      if (response.data.candles && response.data.candles.length > 0) {
        // CRITICAL: Sort candles by time ascending to prevent chart errors
        const sortedCandles = [...response.data.candles].sort((a, b) => a.time - b.time);

        // Set trading start index (after pre-candles)
        const preCandleCount = response.data.preCandleCount || 0;
        setTradingStartIndex(preCandleCount);

        // Capture data source and timestamp
        setDataSource(response.data.dataSource || 'unknown');
        setLastUpdated(response.data.timestamp || new Date().toISOString());

        setCandles(sortedCandles);
        setCurrentIndex(0);
        setVisibleCandles([]);
        setTrades([]);
        setCurrentTrade(null);
        currentTradeRef.current = null; // Clear ref synchronously
        setBalance(initialBalance);
        setTotalPnL(0);
        setWinningTrades(0);
        setLosingTrades(0);
        setTotalTrades(0);
        setIndicatorHistory([]); // Reset indicator history
        tradeIdCounter.current = 0; // Reset trade ID counter

        const sourceName = response.data.dataSource === 'yahoo-finance' ? 'Yahoo Finance' :
                          response.data.dataSource === 'upstox' ? 'Upstox' : 'Unknown Source';
        toast.success(`Loaded ${sortedCandles.length} real candles from ${sourceName} for ${symbol} on ${date}`);
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
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPlaying || candles.length === 0) {
      return;
    }

    const interval = 1000 / speed; // Speed multiplier

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= candles.length) {
          // Auto-close any open trade at the last candle
          if (currentTradeRef.current) {
            const lastCandle = candles[candles.length - 1];
            console.log('🔚 End of simulation - auto-closing open trade at last candle');
            exitTrade(lastCandle, candles.length - 1);
          }

          setIsPlaying(false);
          toast.success('Simulation completed!');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
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
        const currentIndicators = calculateIndicators(next);

        // Check for entry/exit signals (pass calculated indicators)
        checkTradingSignals(next, currentIndicators);

        return next;
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, speed]); // Only re-run when playing state or speed changes, NOT on currentIndex/candles changes

  const calculateIndicators = (index: number): any => {
    if (!strategy?.indicators_config) return {};

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

    // Store indicator values in history with candle timestamp
    setIndicatorHistory(prev => {
      const newHistory = [...prev];
      newHistory[index] = {
        ...newIndicators,
        time: candles[index].time
      };
      return newHistory;
    });

    // Return the calculated indicators immediately
    return newIndicators;
  };

  const checkTradingSignals = (index: number, currentIndicators: any) => {
    if (!strategy) {
      setDebugInfo({
        status: 'Error',
        reason: 'No strategy loaded',
        currentIndex: index,
        totalCandles: candles.length
      });
      return;
    }

    // Only start trading after pre-candles AND enough data for indicators
    const minIndex = Math.max(tradingStartIndex, 50);
    if (index < minIndex) {
      setDebugInfo({
        status: 'Waiting for data',
        reason: `Need ${minIndex} candles for indicators, currently at ${index}`,
        currentIndex: index,
        totalCandles: candles.length,
        tradingStartIndex: minIndex,
        progress: ((index / minIndex) * 100).toFixed(1) + '%'
      });
      return;
    }

    const currentCandle = candles[index];
    const prevCandle = candles[index - 1];

    if (!currentCandle || !prevCandle) {
      setDebugInfo({
        status: 'Error',
        reason: 'Missing candle data',
        currentIndex: index
      });
      return;
    }

    // Check for entry signal (if no open trade)
    if (!currentTradeRef.current) {
      const conditions = evaluateEntryConditionsWithDetails(currentCandle, prevCandle, index, currentIndicators);

      setDebugInfo({
        status: 'Checking Entry',
        currentIndex: index,
        totalCandles: candles.length,
        tradingStartIndex: minIndex,
        price: currentCandle.close.toFixed(2),
        volume: currentCandle.volume,
        indicators: {
          ema9: currentIndicators.ema9?.toFixed(2) || 'N/A',
          ema20: currentIndicators.ema20?.toFixed(2) || 'N/A',
          ema50: currentIndicators.ema50?.toFixed(2) || 'N/A',
          rsi: currentIndicators.rsi?.toFixed(2) || 'N/A',
          volumeAvg: currentIndicators.volumeAvg?.toFixed(0) || 'N/A',
          macd: currentIndicators.macd?.toFixed(4) || 'N/A',
          macdSignal: currentIndicators.macdSignal?.toFixed(4) || 'N/A'
        },
        strategyType: strategy.entry_conditions?.type,
        conditions: conditions.details,
        shouldEnter: conditions.result,
        reason: conditions.result ? 'All conditions met!' : 'Some conditions not met'
      });

      if (conditions.result) {
        enterTrade(currentCandle, index);
      }
    }
    // Check for exit signal (if open trade exists)
    else {
      const shouldExit = evaluateExitConditions(currentCandle, prevCandle, index, currentIndicators);
      const activeTrade = currentTradeRef.current!;
      const pnlPercent = ((currentCandle.close - activeTrade.entryPrice) / activeTrade.entryPrice * 100);

      setDebugInfo({
        status: 'In Trade - Checking Exit',
        currentIndex: index,
        totalCandles: candles.length,
        price: currentCandle.close.toFixed(2),
        entryPrice: activeTrade.entryPrice.toFixed(2),
        pnl: pnlPercent.toFixed(2) + '%',
        shouldExit,
        reason: shouldExit ? 'Exit signal triggered!' : 'Holding position'
      });

      if (shouldExit) {
        exitTrade(currentCandle, index);
      }
    }
  };

  const evaluateEntryConditionsWithDetails = (candle: Candle, prevCandle: Candle, _index: number, currentIndicators: any): { result: boolean; details: any } => {
    if (!strategy) return { result: false, details: { error: 'No strategy' } };

    const conditions = strategy.entry_conditions;
    const config = strategy.indicators_config;
    const ind = currentIndicators; // Use passed indicators instead of state

    // Volume Breakout Strategy
    if (conditions.type === 'VOLUME_BREAKOUT') {
      const volumeMultiple = conditions.volumeMultiple || 2.0;
      const volumeSpike = candle.volume > (ind.volumeAvg || 0) * volumeMultiple;
      const priceBreakout = candle.close > prevCandle.high;
      const emaAligned = config.useEMA &&
        ind.ema9 > ind.ema20 &&
        ind.ema20 > ind.ema50;

      return {
        result: volumeSpike && priceBreakout && emaAligned,
        details: {
          volumeSpike: { value: volumeSpike, desc: `${candle.volume.toFixed(0)} > ${((ind.volumeAvg || 0) * volumeMultiple).toFixed(0)}` },
          priceBreakout: { value: priceBreakout, desc: `${candle.close.toFixed(2)} > ${prevCandle.high.toFixed(2)}` },
          emaAligned: { value: emaAligned, desc: `${ind.ema9?.toFixed(2)} > ${ind.ema20?.toFixed(2)} > ${ind.ema50?.toFixed(2)}` }
        }
      };
    }

    // Trend Following Strategy
    if (conditions.type === 'TREND_FOLLOWING') {
      const emaAligned = config.useEMA &&
        candle.close > ind.ema9 &&
        ind.ema9 > ind.ema20 &&
        ind.ema20 > ind.ema50;
      const rsiOk = !config.useRSI || (ind.rsi > 50 && ind.rsi < 70);
      const macdPositive = !config.useMACD || ind.macd > ind.macdSignal;

      return {
        result: emaAligned && rsiOk && macdPositive,
        details: {
          emaAligned: { value: emaAligned, desc: 'Price > EMA9 > EMA20 > EMA50' },
          rsiOk: { value: rsiOk, desc: `RSI: ${ind.rsi?.toFixed(2)} (need 50-70)` },
          macdPositive: { value: macdPositive, desc: `MACD > Signal` }
        }
      };
    }

    // Mean Reversion Strategy
    if (conditions.type === 'MEAN_REVERSION') {
      const rsiOversold = config.useRSI && ind.rsi < 30;
      const macdTurning = config.useMACD && ind.macd > ind.macdSignal;

      return {
        result: rsiOversold || macdTurning,
        details: {
          rsiOversold: { value: rsiOversold, desc: `RSI: ${ind.rsi?.toFixed(2)} (need < 30)` },
          macdTurning: { value: macdTurning, desc: 'MACD > Signal' }
        }
      };
    }

    // Momentum Strategy
    if (conditions.type === 'MOMENTUM') {
      const rsiStrong = config.useRSI && ind.rsi > 60;
      const priceAboveEMA = config.useEMA && candle.close > ind.ema20;
      const macdStrong = config.useMACD && ind.macdHistogram > 0;

      return {
        result: rsiStrong && priceAboveEMA && macdStrong,
        details: {
          rsiStrong: { value: rsiStrong, desc: `RSI: ${ind.rsi?.toFixed(2)} (need > 60)` },
          priceAboveEMA: { value: priceAboveEMA, desc: `${candle.close.toFixed(2)} > ${ind.ema20?.toFixed(2)}` },
          macdStrong: { value: macdStrong, desc: `Histogram: ${ind.macdHistogram?.toFixed(2)}` }
        }
      };
    }

    // Simple MACD Test Strategy - EASY TO TRIGGER!
    if (conditions.type === 'MACD_SIMPLE') {
      const macdBullishCrossover = config.useMACD &&
        ind.macd > ind.macdSignal;

      return {
        result: macdBullishCrossover,
        details: {
          macdBullishCrossover: {
            value: macdBullishCrossover,
            desc: `MACD: ${ind.macd?.toFixed(4)} > Signal: ${ind.macdSignal?.toFixed(4)}`
          }
        }
      };
    }

    return { result: false, details: { error: `Unknown strategy type: ${conditions.type}` } };
  };

  const evaluateExitConditions = (candle: Candle, _prevCandle: Candle, index: number, currentIndicators: any): boolean => {
    if (!currentTrade || !strategy) return false;

    const exitConditions = strategy.exit_conditions;
    const ind = currentIndicators; // Use passed indicators
    const entryPrice = currentTrade.entryPrice;
    const currentPrice = candle.close;
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

    console.log('🔍 EXIT conditions check:', {
      pnlPercent: pnlPercent.toFixed(2) + '%',
      targetPercent: exitConditions.targetPercent,
      stopLossPercent: exitConditions.stopLossPercent,
      useTrailingStop: exitConditions.useTrailingStop
    });

    // Profit target hit
    if (exitConditions.targetPercent && pnlPercent >= exitConditions.targetPercent) {
      console.log('✅ Target hit!', pnlPercent, '>=', exitConditions.targetPercent);
      return true;
    }

    // Stop loss hit
    if (exitConditions.stopLossPercent && pnlPercent <= -exitConditions.stopLossPercent) {
      console.log('🛑 Stop loss hit!', pnlPercent, '<=', -exitConditions.stopLossPercent);
      return true;
    }

    // MACD Simple exit: MACD < Signal AND (RSI > 70 OR RSI < 50)
    if (exitConditions.macdCrossover === 'bearish' && exitConditions.rsiExit) {
      const macdBearish = ind.macd < ind.macdSignal;
      const rsiExtreme = ind.rsi > (exitConditions.rsiExitUpper || 70) ||
                        ind.rsi < (exitConditions.rsiExitLower || 50);

      console.log('🔍 MACD_SIMPLE exit check:', {
        macdBearish,
        macdValue: ind.macd?.toFixed(4),
        signalValue: ind.macdSignal?.toFixed(4),
        rsiExtreme,
        rsiValue: ind.rsi?.toFixed(2)
      });

      if (macdBearish && rsiExtreme) {
        console.log('✅ MACD bearish crossover + RSI extreme - EXIT!');
        return true;
      }
    }

    // Trailing stop
    if (exitConditions.useTrailingStop && currentTrade.exitPrice) {
      const trailingActivation = exitConditions.trailingStopActivationPercent || 1.0;
      if (pnlPercent >= trailingActivation) {
        const trailingDistance = exitConditions.trailingStopDistance || 0.5;
        const highestPrice = Math.max(currentPrice, currentTrade.exitPrice);
        const stopPrice = highestPrice * (1 - trailingDistance / 100);

        console.log('🔍 Trailing stop check:', {
          highestPrice,
          stopPrice,
          currentPrice,
          shouldExit: currentPrice <= stopPrice
        });

        if (currentPrice <= stopPrice) {
          console.log('🛑 Trailing stop triggered!');
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

    const market = detectMarket(symbol);
    const entryTime = convertToLocalTime(candle.time, market);

    const trade: Trade = {
      id: tradeIdCounter.current,
      entryTime,
      entryPrice: candle.close,
      entryCandelTime: candle.time, // Store original candle timestamp for chart markers
      quantity,
      status: 'open',
      type: 'long',
      exitPrice: candle.close // Track highest for trailing stop
    };

    (trade as any).entryIndex = index;

    setCurrentTrade(trade);
    currentTradeRef.current = trade; // Set ref synchronously
    console.log('🟢 TRADE ENTERED:', {
      id: trade.id,
      time: entryTime.toLocaleString(),
      price: candle.close,
      candleTime: candle.time
    });
    toast.success(`📈 Entry: ${symbol} @ ₹${candle.close.toFixed(2)}`);
  };

  const exitTrade = (candle: Candle, _index: number) => {
    if (!currentTradeRef.current) return;

    const exitPrice = candle.close;
    const pnl = (exitPrice - currentTradeRef.current.entryPrice) * currentTradeRef.current.quantity;
    const pnlPercent = ((exitPrice - currentTradeRef.current.entryPrice) / currentTradeRef.current.entryPrice) * 100;

    const market = detectMarket(symbol);
    const exitTime = convertToLocalTime(candle.time, market);

    const closedTrade: Trade = {
      ...currentTradeRef.current,
      exitTime,
      exitPrice,
      exitCandleTime: candle.time, // Store original candle timestamp for chart markers
      pnl,
      pnlPercent,
      status: 'closed'
    };

    console.log('🔴 TRADE EXITED:', {
      id: closedTrade.id,
      entryTime: closedTrade.entryTime.toLocaleString(),
      exitTime: exitTime.toLocaleString(),
      entryPrice: closedTrade.entryPrice,
      exitPrice,
      pnl,
      pnlPercent: pnlPercent.toFixed(2) + '%'
    });

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
    currentTradeRef.current = null; // Clear ref synchronously
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
      currentTradeRef.current = null; // Clear ref synchronously
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
    currentTradeRef.current = null; // Clear ref synchronously
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
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {showSettings ? 'Hide' : 'Settings'}
          </button>

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

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., RELIANCE"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isPlaying}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trading Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isPlaying}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isPlaying}
              >
                <option value="1m">1 Minute</option>
                <option value="3m">3 Minutes</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
              </select>
            </div>

            {/* Load Button */}
            <div className="flex items-end">
              <button
                onClick={loadHistoricalData}
                disabled={isPlaying}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                Load Data
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Pre-candles (75 candles before trading period) are loaded for chart context.
              Trading signals will only trigger after the pre-candle period.
            </p>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg shadow-sm border-2 border-purple-300 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trading Debug Monitor
          </h3>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
          >
            {showDebug ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-500">Status</div>
            <div className={`text-sm font-bold ${
              debugInfo.status === 'In Trade - Checking Exit' ? 'text-green-600' :
              debugInfo.status === 'Checking Entry' ? 'text-blue-600' :
              debugInfo.status === 'Waiting for data' ? 'text-yellow-600' :
              debugInfo.status === 'Error' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {debugInfo.status || 'Not Started'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-500">Progress</div>
            <div className="text-sm font-bold text-purple-600">
              {debugInfo.currentIndex || 0} / {debugInfo.totalCandles || 0}
              {debugInfo.progress && ` (${debugInfo.progress})`}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-500">Strategy Type</div>
            <div className="text-sm font-bold text-indigo-600">
              {debugInfo.strategyType || 'N/A'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-gray-500">Current Price</div>
            <div className="text-sm font-bold text-gray-900">
              ₹{debugInfo.price || 'N/A'}
            </div>
          </div>
        </div>

        {/* Reason/Message */}
        <div className="bg-white rounded-lg p-3 border-2 border-purple-200 mb-3">
          <div className="text-xs text-gray-500 mb-1">Current Status</div>
          <div className="text-sm font-medium text-gray-800">
            {debugInfo.reason || 'Waiting to start simulation...'}
          </div>
        </div>

        {/* Detailed Info */}
        {showDebug && (
          <div className="space-y-3">
            {/* Indicators */}
            {debugInfo.indicators && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Indicators</div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">EMA 9:</span>
                    <span className="ml-1 font-mono text-blue-600">{debugInfo.indicators.ema9}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">EMA 20:</span>
                    <span className="ml-1 font-mono text-purple-600">{debugInfo.indicators.ema20}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">EMA 50:</span>
                    <span className="ml-1 font-mono text-orange-600">{debugInfo.indicators.ema50}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">RSI:</span>
                    <span className="ml-1 font-mono text-green-600">{debugInfo.indicators.rsi}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vol Avg:</span>
                    <span className="ml-1 font-mono text-gray-600">{debugInfo.indicators.volumeAvg}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Entry Conditions */}
            {debugInfo.conditions && Object.keys(debugInfo.conditions).length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Entry Conditions Check</div>
                <div className="space-y-2">
                  {Object.entries(debugInfo.conditions).map(([key, condition]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          condition.value ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {condition.value ? '✓' : '✗'}
                        </span>
                        <span className="font-medium text-gray-700">{key}</span>
                      </div>
                      <span className="text-gray-600 font-mono">{condition.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trade Info (when in trade) */}
            {debugInfo.entryPrice && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Active Trade</div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Entry:</span>
                    <span className="ml-1 font-mono text-blue-600">₹{debugInfo.entryPrice}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current:</span>
                    <span className="ml-1 font-mono text-purple-600">₹{debugInfo.price}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">P&L:</span>
                    <span className={`ml-1 font-mono font-bold ${
                      parseFloat(debugInfo.pnl) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {debugInfo.pnl}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
                      <div className="text-gray-600">
                        {trade.exitTime?.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true
                        })} {detectMarket(symbol) === 'INDIAN' ? 'IST' : 'EST'}
                      </div>
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
                <EnhancedLiveChart
                  candles={visibleCandles}
                  indicatorHistory={indicatorHistory}
                  currentTrade={currentTrade}
                  trades={trades}
                  dataSource={dataSource}
                  lastUpdated={lastUpdated}
                  symbol={symbol}
                  interval={timeframe}
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
