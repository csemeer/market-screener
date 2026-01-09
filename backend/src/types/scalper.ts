/**
 * Types for Auto-Scalping System
 */

export interface ScalperConfig {
  id?: number;
  name: string;
  enabled: boolean;
  broker: 'zerodha' | 'upstox' | 'ibkr';
  accountId: string;
  autoTrade: boolean; // If false, only generates signals

  // Stock Selection
  stockSelection: {
    method: 'MANUAL' | 'AUTO_SCREENER';
    symbols?: string[]; // For manual selection
    screenerCriteria?: {
      minVolume: number;
      minPrice: number;
      maxPrice: number;
      volatilityMin: number; // ATR %
      liquidityMin: number;
    };
    maxStocks: number;
  };

  // Scalping Strategy
  strategy: {
    strategy_id?: number; // Foreign key to trading_strategies table
    name: string;
    timeframe: '1m' | '3m' | '5m';
    indicators: {
      useEMA: boolean;
      emaFast: number;
      emaSlow: number;
      useRSI: boolean;
      rsiPeriod: number;
      rsiOverbought: number;
      rsiOversold: number;
      useMACD: boolean;
      useBollinger: boolean;
      bollingerPeriod: number;
      bollingerStdDev: number;
      useVWAP: boolean;
      useSupRes: boolean;
    };
    entryConditions: {
      type: 'BREAKOUT' | 'REVERSAL' | 'MOMENTUM' | 'MEAN_REVERSION';
      volumeConfirmation: boolean;
      minVolumeMultiplier: number;
      requireMultipleSignals: boolean;
      minSignals: number;
    };
    exitConditions: {
      targetPercent: number;
      stopLossPercent: number;
      useTrailingStop: boolean;
      trailingStopPercent?: number;
      maxHoldTimeMinutes: number;
    };
  };

  // Risk Management
  riskManagement: {
    maxPositionSize: number; // INR/USD amount
    maxPositionsOpen: number;
    maxDailyLoss: number;
    maxDailyTrades: number;
    positionSizingMethod: 'FIXED' | 'RISK_BASED' | 'KELLY';
    riskPerTrade: number; // % of capital
  };

  // Trading Hours
  tradingHours: {
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    avoidFirstMinutes: number; // Avoid first N minutes after market open
    avoidLastMinutes: number; // Avoid last N minutes before market close
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScalpingStock {
  id?: number;
  scalperId: number;
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ';
  active: boolean;
  addedAt: Date;
  lastTradeAt?: Date;

  // Performance
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
  winRate: number;
}

export interface ScalpTrade {
  id?: number;
  scalperId: number;
  symbol: string;
  exchange: string;

  // Trade Details
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  entryOrderId?: string;

  exitPrice?: number;
  exitTime?: Date;
  exitOrderId?: string;

  stopLoss: number;
  target: number;

  // Status
  status: 'PENDING' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'FAILED';
  closeReason?: 'TARGET_HIT' | 'STOP_LOSS' | 'TIME_EXIT' | 'MANUAL' | 'EMERGENCY_EXIT';

  // P&L
  grossPnL?: number;
  netPnL?: number; // After brokerage
  pnLPercent?: number;
  brokerage?: number;

  // Signals & Indicators at entry
  entrySignals: string; // JSON
  indicatorsData: string; // JSON of all indicator values

  // Chart data
  chartData?: string; // OHLCV data at the time of trade

  // Execution
  executionMode: 'AUTO' | 'MANUAL' | 'PAPER';

  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface LivePosition {
  scalperId: number;
  tradeId: number;
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  stopLoss: number;
  target: number;
  entryTime: Date;
  holdTimeMinutes: number;
}

export interface ScalperPerformance {
  scalperId: number;
  date: string;

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;

  grossPnL: number;
  netPnL: number;
  totalBrokerage: number;

  avgWin: number;
  avgLoss: number;
  profitFactor: number;

  maxDrawdown: number;
  sharpeRatio?: number;
}

export interface RealTimeCandle {
  symbol: string;
  exchange: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: string;
}

export interface TradingSignal {
  symbol: string;
  exchange: string;
  timestamp: Date;
  signal: 'BUY' | 'SELL' | 'EXIT';
  strength: number; // 0-100
  price: number;
  indicators: {
    ema9?: number;
    ema21?: number;
    rsi?: number;
    macd?: { value: number; signal: number; histogram: number };
    bollinger?: { upper: number; middle: number; lower: number };
    vwap?: number;
    volume?: number;
    avgVolume?: number;
  };
  reasons: string[];
  suggestedEntry: number;
  suggestedStopLoss: number;
  suggestedTarget: number;
}

export interface BrokerConnection {
  broker: 'zerodha' | 'upstox' | 'ibkr';
  accountId: string;
  connected: boolean;
  lastHeartbeat?: Date;
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

export interface OrderRequest {
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LOSS_MARKET';
  price?: number;
  triggerPrice?: number;
  product: 'MIS' | 'CNC' | 'NRML'; // Intraday, Delivery, Normal
  validity: 'DAY' | 'IOC';
  tag?: string;
}

export interface BrokerOrder {
  orderId: string;
  status: 'PENDING' | 'OPEN' | 'COMPLETE' | 'CANCELLED' | 'REJECTED';
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  filledQuantity: number;
  price: number;
  averagePrice?: number;
  orderTime: Date;
  updateTime?: Date;
  message?: string;
}
