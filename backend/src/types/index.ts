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
  indexes?: string[]; // Optional: filter by specific market index IDs
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

// ============= FUNDAMENTAL ANALYSIS TYPES =============

export interface FundamentalData {
  // Valuation Metrics
  peRatio?: number;              // Price-to-Earnings
  pbRatio?: number;              // Price-to-Book
  psRatio?: number;              // Price-to-Sales
  pegRatio?: number;             // PEG Ratio (P/E to Growth)
  evToEbitda?: number;           // Enterprise Value to EBITDA
  priceToFreeCashFlow?: number;  // Price to Free Cash Flow

  // Profitability Metrics
  grossMargin?: number;          // Gross Profit Margin %
  operatingMargin?: number;      // Operating Profit Margin %
  netMargin?: number;            // Net Profit Margin %
  roe?: number;                  // Return on Equity %
  roa?: number;                  // Return on Assets %
  roic?: number;                 // Return on Invested Capital %

  // Growth Metrics
  revenueGrowth?: number;        // Revenue Growth % YoY
  epsGrowth?: number;            // EPS Growth % YoY
  revenueGrowthQuarterly?: number; // Quarterly Revenue Growth %
  earningsGrowth?: number;       // Earnings Growth %

  // Financial Health
  debtToEquity?: number;         // Debt-to-Equity Ratio
  currentRatio?: number;         // Current Assets / Current Liabilities
  quickRatio?: number;           // Quick Assets / Current Liabilities
  interestCoverage?: number;     // EBIT / Interest Expense

  // Per Share Metrics
  eps?: number;                  // Earnings Per Share
  bookValuePerShare?: number;    // Book Value Per Share
  freeCashFlowPerShare?: number; // Free Cash Flow Per Share

  // Dividend Metrics
  dividendYield?: number;        // Annual Dividend / Price %
  payoutRatio?: number;          // Dividends / Earnings %
  dividendGrowth?: number;       // Dividend Growth Rate %

  // Other
  beta?: number;                 // Stock volatility vs market
  sharesOutstanding?: number;    // Total shares outstanding
  floatShares?: number;          // Publicly traded shares
  institutionalOwnership?: number; // % held by institutions
}

export interface FundamentalScore {
  overall: number;               // 0-100 overall fundamental score
  valuation: number;             // 0-100 valuation score
  profitability: number;         // 0-100 profitability score
  growth: number;                // 0-100 growth score
  financialHealth: number;       // 0-100 financial health score
  quality: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'; // Letter grade
  category: 'VALUE' | 'GROWTH' | 'QUALITY' | 'DIVIDEND' | 'SPECULATIVE'; // Stock category
}

export interface ScreenerCriteriaWithFundamentals extends ScreenerCriteria {
  fundamentalFilters?: {
    peRatioMax?: number;
    pbRatioMax?: number;
    roeMin?: number;
    debtToEquityMax?: number;
    revenueGrowthMin?: number;
    epsGrowthMin?: number;
    dividendYieldMin?: number;
    profitMarginMin?: number;
    category?: ('VALUE' | 'GROWTH' | 'QUALITY' | 'DIVIDEND')[];
  };
}

export interface EnhancedScreenerResult extends ScreenerResult {
  fundamentals?: FundamentalData;
  fundamentalScore?: FundamentalScore;
  combinedScore?: number;        // Technical (60%) + Fundamental (40%)
  recommendation?: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
}
