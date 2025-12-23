export interface StockData {
  symbol: string;
  name: string;
  exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ';
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  timestamp: Date;
}

export interface OHLCV {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
  };
  ema?: {
    ema9?: number;
    ema20?: number;
    ema50?: number;
    ema200?: number;
  };
  sma?: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
  };
  atr?: number;
  adx?: number;
  stochastic?: {
    k: number;
    d: number;
  };
  volumeProfile?: {
    avgVolume: number;
    volumeRatio: number;
  };
  obv?: number;
  vwap?: number;
  fibonacci?: {
    level0: number;
    level236: number;
    level382: number;
    level500: number;
    level618: number;
    level786: number;
    level100: number;
  };
  pivotPoints?: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
  supertrend?: {
    value: number;
    trend: string;
    upperBand: number;
    lowerBand: number;
  };
}

export interface ScreenerCriteria {
  markets: ('NSE' | 'BSE' | 'NYSE' | 'NASDAQ')[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  volumeMin?: number;
  marketCapRange?: {
    min?: number;
    max?: number;
  };
  technicalFilters?: {
    rsiRange?: { min?: number; max?: number };
    macdCrossover?: 'bullish' | 'bearish' | 'any';
    priceAboveEMA?: number[];
    priceBelowEMA?: number[];
    adxMin?: number;
    volumeBreakout?: boolean;
  };
  patterns?: string[];
}

export interface ScreenerResult extends StockData {
  indicators: TechnicalIndicators;
  score: number;
  signals: string[];
  confluenceScore?: number;
  patterns?: string[];
  riskReward?: {
    entryPrice: number;
    stopLoss: number;
    target: number;
    ratio: number;
  };
}

export interface IntradaySignal {
  type: 'MOMENTUM' | 'BREAKOUT' | 'GAP' | 'REVERSAL';
  symbol: string;
  signal: 'BUY' | 'SELL';
  strength: number;
  entry: number;
  stopLoss: number;
  target: number;
  timeframe: string;
  description: string;
}

export interface SwingTradeSignal {
  type: 'TREND_FOLLOWING' | 'SUPPORT_RESISTANCE' | 'PATTERN_BREAKOUT';
  symbol: string;
  signal: 'BUY' | 'SELL';
  strength: number;
  entry: number;
  stopLoss: number;
  target: number;
  timeframe: string;
  trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
  description: string;
}

export interface RiskManagement {
  accountSize: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  positionSize: number;
  riskAmount: number;
  potentialLoss: number;
}
