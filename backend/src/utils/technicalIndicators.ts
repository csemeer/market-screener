import { OHLCV, TechnicalIndicators } from '../types';

export class TechnicalAnalysis {
  /**
   * Calculate RSI (Relative Strength Index)
   */
  static calculateRSI(data: OHLCV[], period: number = 14): number | null {
    if (data.length < period + 1) return null;

    const prices = data.map(d => d.close);
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      gains.push(difference > 0 ? difference : 0);
      losses.push(difference < 0 ? Math.abs(difference) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(data: OHLCV[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) {
    if (data.length < slowPeriod + signalPeriod) return null;

    const prices = data.map(d => d.close);
    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);

    if (!emaFast || !emaSlow) return null;

    const macdLine = emaFast - emaSlow;
    const macdHistory = [];

    for (let i = 0; i < Math.min(prices.length - slowPeriod + 1, 100); i++) {
      const fast = this.calculateEMA(prices.slice(0, slowPeriod + i), fastPeriod);
      const slow = this.calculateEMA(prices.slice(0, slowPeriod + i), slowPeriod);
      if (fast && slow) macdHistory.push(fast - slow);
    }

    const signalLine = this.calculateEMA(macdHistory, signalPeriod);
    if (!signalLine) return null;

    return {
      macd: Math.round(macdLine * 100) / 100,
      signal: Math.round(signalLine * 100) / 100,
      histogram: Math.round((macdLine - signalLine) * 100) / 100
    };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  static calculateEMA(data: number[], period: number): number | null {
    if (data.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  static calculateSMA(data: number[], period: number): number | null {
    if (data.length < period) return null;

    const sum = data.slice(-period).reduce((a, b) => a + b, 0);
    return Math.round((sum / period) * 100) / 100;
  }

  /**
   * Calculate Bollinger Bands
   */
  static calculateBollingerBands(data: OHLCV[], period: number = 20, stdDev: number = 2) {
    if (data.length < period) return null;

    const prices = data.map(d => d.close);
    const sma = this.calculateSMA(prices, period);

    if (!sma) return null;

    const recentPrices = prices.slice(-period);
    const squaredDiffs = recentPrices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: Math.round((sma + (standardDeviation * stdDev)) * 100) / 100,
      middle: sma,
      lower: Math.round((sma - (standardDeviation * stdDev)) * 100) / 100
    };
  }

  /**
   * Calculate ATR (Average True Range)
   */
  static calculateATR(data: OHLCV[], period: number = 14): number | null {
    if (data.length < period + 1) return null;

    const trueRanges: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
    return Math.round(atr * 100) / 100;
  }

  /**
   * Calculate ADX (Average Directional Index)
   */
  static calculateADX(data: OHLCV[], period: number = 14): number | null {
    if (data.length < period * 2) return null;

    const dmPlus: number[] = [];
    const dmMinus: number[] = [];
    const tr: number[] = [];

    for (let i = 1; i < data.length; i++) {
      const highDiff = data[i].high - data[i - 1].high;
      const lowDiff = data[i - 1].low - data[i].low;

      dmPlus.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
      dmMinus.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

      const trValue = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      tr.push(trValue);
    }

    const smoothDMPlus = dmPlus.slice(-period).reduce((a, b) => a + b, 0);
    const smoothDMMinus = dmMinus.slice(-period).reduce((a, b) => a + b, 0);
    const smoothTR = tr.slice(-period).reduce((a, b) => a + b, 0);

    const diPlus = (smoothDMPlus / smoothTR) * 100;
    const diMinus = (smoothDMMinus / smoothTR) * 100;

    const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;

    return Math.round(dx * 100) / 100;
  }

  /**
   * Calculate Stochastic Oscillator
   */
  static calculateStochastic(data: OHLCV[], period: number = 14, kPeriod: number = 3, dPeriod: number = 3) {
    if (data.length < period) return null;

    const recentData = data.slice(-period);
    const currentClose = recentData[recentData.length - 1].close;
    const highestHigh = Math.max(...recentData.map(d => d.high));
    const lowestLow = Math.min(...recentData.map(d => d.low));

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    // For simplicity, using k as both k and d (in production, you'd calculate d as SMA of k)
    return {
      k: Math.round(k * 100) / 100,
      d: Math.round(k * 100) / 100
    };
  }

  /**
   * Calculate all indicators for a stock
   */
  static calculateAllIndicators(data: OHLCV[]): TechnicalIndicators {
    const prices = data.map(d => d.close);

    return {
      rsi: this.calculateRSI(data, 14),
      macd: this.calculateMACD(data),
      bollingerBands: this.calculateBollingerBands(data),
      ema: {
        ema9: this.calculateEMA(prices, 9),
        ema20: this.calculateEMA(prices, 20),
        ema50: this.calculateEMA(prices, 50),
        ema200: this.calculateEMA(prices, 200)
      },
      sma: {
        sma20: this.calculateSMA(prices, 20),
        sma50: this.calculateSMA(prices, 50),
        sma200: this.calculateSMA(prices, 200)
      },
      atr: this.calculateATR(data),
      adx: this.calculateADX(data),
      stochastic: this.calculateStochastic(data),
      volumeProfile: {
        avgVolume: this.calculateSMA(data.map(d => d.volume), 20) || 0,
        volumeRatio: data[data.length - 1].volume / (this.calculateSMA(data.map(d => d.volume), 20) || 1)
      }
    };
  }

  /**
   * Detect candlestick patterns
   */
  static detectCandlestickPatterns(data: OHLCV[]): string[] {
    if (data.length < 3) return [];

    const patterns: string[] = [];
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const beforePrevious = data[data.length - 3];

    const currentBody = Math.abs(current.close - current.open);
    const currentRange = current.high - current.low;
    const prevBody = Math.abs(previous.close - previous.open);

    // Doji
    if (currentBody / currentRange < 0.1) {
      patterns.push('DOJI');
    }

    // Hammer (bullish)
    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);
    if (lowerShadow > 2 * currentBody && upperShadow < currentBody * 0.3) {
      patterns.push('HAMMER');
    }

    // Shooting Star (bearish)
    if (upperShadow > 2 * currentBody && lowerShadow < currentBody * 0.3) {
      patterns.push('SHOOTING_STAR');
    }

    // Engulfing patterns
    if (current.close > current.open && previous.close < previous.open &&
        current.close > previous.open && current.open < previous.close) {
      patterns.push('BULLISH_ENGULFING');
    }

    if (current.close < current.open && previous.close > previous.open &&
        current.close < previous.open && current.open > previous.close) {
      patterns.push('BEARISH_ENGULFING');
    }

    // Morning Star (bullish reversal)
    if (beforePrevious.close < beforePrevious.open &&
        prevBody < currentBody * 0.3 &&
        current.close > current.open &&
        current.close > (beforePrevious.open + beforePrevious.close) / 2) {
      patterns.push('MORNING_STAR');
    }

    // Evening Star (bearish reversal)
    if (beforePrevious.close > beforePrevious.open &&
        prevBody < currentBody * 0.3 &&
        current.close < current.open &&
        current.close < (beforePrevious.open + beforePrevious.close) / 2) {
      patterns.push('EVENING_STAR');
    }

    return patterns;
  }
}
