import { OHLCV, TechnicalIndicators } from '../types';

export class TechnicalAnalysis {
  /**
   * Calculate RSI (Relative Strength Index) using Wilder's smoothing method
   * More accurate than simple averaging
   */
  static calculateRSI(data: OHLCV[], period: number = 14): number | null {
    if (data.length < period + 1) return null;

    const prices = data.map(d => d.close);
    const changes: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < period; i++) {
      if (changes[i] >= 0) {
        avgGain += changes[i];
      } else {
        avgLoss += Math.abs(changes[i]);
      }
    }

    avgGain /= period;
    avgLoss /= period;

    // Use Wilder's smoothing for subsequent values
    for (let i = period; i < changes.length; i++) {
      if (changes[i] >= 0) {
        avgGain = (avgGain * (period - 1) + changes[i]) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(changes[i])) / period;
      }
    }

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
   * Calculate ADX (Average Directional Index) - Proper implementation
   * Returns the smoothed ADX value indicating trend strength
   */
  static calculateADX(data: OHLCV[], period: number = 14): number | null {
    if (data.length < period * 2 + 1) return null;

    const tr: number[] = [];
    const dmPlus: number[] = [];
    const dmMinus: number[] = [];

    // Calculate True Range and Directional Movements
    for (let i = 1; i < data.length; i++) {
      const highDiff = data[i].high - data[i - 1].high;
      const lowDiff = data[i - 1].low - data[i].low;

      // True Range
      const trValue = Math.max(
        data[i].high - data[i].low,
        Math.abs(data[i].high - data[i - 1].close),
        Math.abs(data[i].low - data[i - 1].close)
      );
      tr.push(trValue);

      // Directional Movements
      if (highDiff > lowDiff && highDiff > 0) {
        dmPlus.push(highDiff);
        dmMinus.push(0);
      } else if (lowDiff > highDiff && lowDiff > 0) {
        dmPlus.push(0);
        dmMinus.push(lowDiff);
      } else {
        dmPlus.push(0);
        dmMinus.push(0);
      }
    }

    // Smooth the values using Wilder's smoothing
    let smoothedTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothedDMPlus = dmPlus.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothedDMMinus = dmMinus.slice(0, period).reduce((a, b) => a + b, 0);

    const dx: number[] = [];

    for (let i = period; i < tr.length; i++) {
      smoothedTR = smoothedTR - (smoothedTR / period) + tr[i];
      smoothedDMPlus = smoothedDMPlus - (smoothedDMPlus / period) + dmPlus[i];
      smoothedDMMinus = smoothedDMMinus - (smoothedDMMinus / period) + dmMinus[i];

      const diPlus = (smoothedDMPlus / smoothedTR) * 100;
      const diMinus = (smoothedDMMinus / smoothedTR) * 100;

      const diSum = diPlus + diMinus;
      if (diSum > 0) {
        dx.push((Math.abs(diPlus - diMinus) / diSum) * 100);
      }
    }

    if (dx.length < period) return null;

    // Calculate ADX as smoothed average of DX
    let adx = dx.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < dx.length; i++) {
      adx = ((adx * (period - 1)) + dx[i]) / period;
    }

    return Math.round(adx * 100) / 100;
  }

  /**
   * Calculate Stochastic Oscillator - Proper %K and %D calculation
   */
  static calculateStochastic(data: OHLCV[], period: number = 14, kPeriod: number = 3, dPeriod: number = 3) {
    if (data.length < period + kPeriod + dPeriod) return null;

    const kValues: number[] = [];

    // Calculate raw %K values
    for (let i = period - 1; i < data.length; i++) {
      const periodData = data.slice(i - period + 1, i + 1);
      const currentClose = periodData[periodData.length - 1].close;
      const highestHigh = Math.max(...periodData.map(d => d.high));
      const lowestLow = Math.min(...periodData.map(d => d.low));

      if (highestHigh !== lowestLow) {
        const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        kValues.push(k);
      } else {
        kValues.push(50);
      }
    }

    if (kValues.length < kPeriod) return null;

    // Smooth %K
    const smoothK = this.calculateSMA(kValues, kPeriod) || 0;

    // Calculate %D as SMA of smoothed %K
    const kForD = kValues.slice(-dPeriod);
    const d = this.calculateSMA(kForD, Math.min(dPeriod, kForD.length)) || smoothK;

    return {
      k: Math.round(smoothK * 100) / 100,
      d: Math.round(d * 100) / 100
    };
  }

  /**
   * Calculate all indicators for a stock - Enhanced with new indicators
   */
  static calculateAllIndicators(data: OHLCV[]): TechnicalIndicators {
    const prices = data.map(d => d.close);

    return {
      rsi: this.calculateRSI(data, 14) || undefined,
      macd: this.calculateMACD(data) || undefined,
      bollingerBands: this.calculateBollingerBands(data) || undefined,
      ema: {
        ema9: this.calculateEMA(prices, 9) || undefined,
        ema20: this.calculateEMA(prices, 20) || undefined,
        ema50: this.calculateEMA(prices, 50) || undefined,
        ema200: this.calculateEMA(prices, 200) || undefined
      },
      sma: {
        sma20: this.calculateSMA(prices, 20) || undefined,
        sma50: this.calculateSMA(prices, 50) || undefined,
        sma200: this.calculateSMA(prices, 200) || undefined
      },
      atr: this.calculateATR(data) || undefined,
      adx: this.calculateADX(data) || undefined,
      stochastic: this.calculateStochastic(data) || undefined,
      volumeProfile: {
        avgVolume: this.calculateSMA(data.map(d => d.volume), 20) || 0,
        volumeRatio: data[data.length - 1].volume / (this.calculateSMA(data.map(d => d.volume), 20) || 1)
      },
      obv: this.calculateOBV(data) || undefined,
      vwap: this.calculateVWAP(data) || undefined,
      fibonacci: this.calculateFibonacci(data) || undefined,
      pivotPoints: this.calculatePivotPoints(data) || undefined,
      supertrend: this.calculateSupertrend(data) || undefined
    };
  }

  /**
   * Calculate Confluence Score - Advanced multi-indicator confluence analysis
   * Returns a score from 0-100 indicating the strength of signal confluence
   */
  static calculateConfluence(data: OHLCV[], indicators: TechnicalIndicators): number {
    let score = 0;
    let maxScore = 0;
    const currentPrice = data[data.length - 1].close;

    // RSI Confluence (Weight: 10)
    if (indicators.rsi) {
      maxScore += 10;
      if (indicators.rsi < 30) score += 10; // Oversold
      else if (indicators.rsi > 70) score += 10; // Overbought
      else if (indicators.rsi >= 45 && indicators.rsi <= 55) score += 5; // Neutral
    }

    // MACD Confluence (Weight: 15)
    if (indicators.macd) {
      maxScore += 15;
      const { histogram } = indicators.macd;
      if (Math.abs(histogram) > 0.5) score += 15; // Strong signal
      else if (Math.abs(histogram) > 0.2) score += 10; // Moderate signal
      else score += 5; // Weak signal
    }

    // Trend Confluence - EMA alignment (Weight: 20)
    if (indicators.ema?.ema9 && indicators.ema?.ema20 && indicators.ema?.ema50) {
      maxScore += 20;
      const { ema9, ema20, ema50 } = indicators.ema;

      // Bullish alignment: price > ema9 > ema20 > ema50
      if (currentPrice > ema9 && ema9 > ema20 && ema20 > ema50) {
        score += 20;
      }
      // Bearish alignment: price < ema9 < ema20 < ema50
      else if (currentPrice < ema9 && ema9 < ema20 && ema20 < ema50) {
        score += 20;
      }
      // Partial alignment
      else if ((currentPrice > ema9 && ema9 > ema20) || (currentPrice < ema9 && ema9 < ema20)) {
        score += 10;
      }
    }

    // ADX Trend Strength (Weight: 15)
    if (indicators.adx) {
      maxScore += 15;
      if (indicators.adx > 40) score += 15; // Very strong trend
      else if (indicators.adx > 25) score += 12; // Strong trend
      else if (indicators.adx > 20) score += 8; // Moderate trend
      else score += 3; // Weak trend
    }

    // Volume Confirmation (Weight: 15)
    if (indicators.volumeProfile) {
      maxScore += 15;
      const { volumeRatio } = indicators.volumeProfile;
      if (volumeRatio > 2) score += 15; // Very high volume
      else if (volumeRatio > 1.5) score += 12; // High volume
      else if (volumeRatio > 1.2) score += 8; // Above average
      else score += 3; // Normal volume
    }

    // Stochastic Momentum (Weight: 10)
    if (indicators.stochastic) {
      maxScore += 10;
      const { k } = indicators.stochastic;
      if (k < 20 || k > 80) score += 10; // Strong oversold/overbought
      else if (k < 30 || k > 70) score += 7; // Moderate levels
      else score += 3; // Neutral
    }

    // Supertrend Confirmation (Weight: 10)
    if (indicators.supertrend) {
      maxScore += 10;
      const { trend } = indicators.supertrend;
      if (trend === 'BULLISH' && currentPrice > (indicators.supertrend.value || 0)) {
        score += 10;
      } else if (trend === 'BEARISH' && currentPrice < (indicators.supertrend.value || 0)) {
        score += 10;
      } else {
        score += 3;
      }
    }

    // Price vs VWAP (Weight: 5)
    if (indicators.vwap) {
      maxScore += 5;
      const vwapDiff = Math.abs(currentPrice - indicators.vwap) / currentPrice;
      if (vwapDiff < 0.01) score += 5; // Very close to VWAP
      else if (vwapDiff < 0.02) score += 3; // Close to VWAP
    }

    // Normalize to 0-100 scale
    const confluenceScore = maxScore > 0 ? (score / maxScore) * 100 : 50;
    return Math.round(confluenceScore * 100) / 100;
  }

  /**
   * Calculate OBV (On-Balance Volume) - Volume momentum indicator
   */
  static calculateOBV(data: OHLCV[]): number | null {
    if (data.length < 2) return null;

    let obv = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        obv += data[i].volume;
      } else if (data[i].close < data[i - 1].close) {
        obv -= data[i].volume;
      }
    }

    return obv;
  }

  /**
   * Calculate VWAP (Volume Weighted Average Price)
   */
  static calculateVWAP(data: OHLCV[]): number | null {
    if (data.length === 0) return null;

    let cumulativeTPV = 0;
    let cumulativeVolume = 0;

    for (const candle of data) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativeTPV += typicalPrice * candle.volume;
      cumulativeVolume += candle.volume;
    }

    if (cumulativeVolume === 0) return null;

    return Math.round((cumulativeTPV / cumulativeVolume) * 100) / 100;
  }

  /**
   * Calculate Fibonacci Retracement Levels
   */
  static calculateFibonacci(data: OHLCV[], lookback: number = 50) {
    if (data.length < lookback) return null;

    const recentData = data.slice(-lookback);
    const high = Math.max(...recentData.map(d => d.high));
    const low = Math.min(...recentData.map(d => d.low));
    const diff = high - low;

    return {
      level0: high,
      level236: Math.round((high - diff * 0.236) * 100) / 100,
      level382: Math.round((high - diff * 0.382) * 100) / 100,
      level500: Math.round((high - diff * 0.500) * 100) / 100,
      level618: Math.round((high - diff * 0.618) * 100) / 100,
      level786: Math.round((high - diff * 0.786) * 100) / 100,
      level100: low
    };
  }

  /**
   * Calculate Pivot Points (Standard)
   */
  static calculatePivotPoints(data: OHLCV[]) {
    if (data.length < 1) return null;

    const lastCandle = data[data.length - 1];
    const pivot = (lastCandle.high + lastCandle.low + lastCandle.close) / 3;

    return {
      pivot: Math.round(pivot * 100) / 100,
      r1: Math.round((2 * pivot - lastCandle.low) * 100) / 100,
      r2: Math.round((pivot + (lastCandle.high - lastCandle.low)) * 100) / 100,
      r3: Math.round((lastCandle.high + 2 * (pivot - lastCandle.low)) * 100) / 100,
      s1: Math.round((2 * pivot - lastCandle.high) * 100) / 100,
      s2: Math.round((pivot - (lastCandle.high - lastCandle.low)) * 100) / 100,
      s3: Math.round((lastCandle.low - 2 * (lastCandle.high - pivot)) * 100) / 100
    };
  }

  /**
   * Calculate Supertrend Indicator
   */
  static calculateSupertrend(data: OHLCV[], period: number = 10, multiplier: number = 3) {
    if (data.length < period) return null;

    const atr = this.calculateATR(data, period);
    if (!atr) return null;

    const lastCandle = data[data.length - 1];
    const hl2 = (lastCandle.high + lastCandle.low) / 2;

    const upperBand = hl2 + (multiplier * atr);
    const lowerBand = hl2 - (multiplier * atr);

    // Simplified supertrend (full implementation would track trend changes)
    const trend = lastCandle.close > hl2 ? 'BULLISH' : 'BEARISH';
    const supertrendValue = trend === 'BULLISH' ? lowerBand : upperBand;

    return {
      value: Math.round(supertrendValue * 100) / 100,
      trend,
      upperBand: Math.round(upperBand * 100) / 100,
      lowerBand: Math.round(lowerBand * 100) / 100
    };
  }

  /**
   * Detect candlestick patterns - Enhanced with more patterns
   */
  static detectCandlestickPatterns(data: OHLCV[]): string[] {
    if (data.length < 3) return [];

    const patterns: string[] = [];
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const beforePrevious = data.length > 2 ? data[data.length - 3] : null;

    const currentBody = Math.abs(current.close - current.open);
    const currentRange = current.high - current.low;
    const prevBody = Math.abs(previous.close - previous.open);
    const prevRange = previous.high - previous.low;

    const lowerShadow = Math.min(current.open, current.close) - current.low;
    const upperShadow = current.high - Math.max(current.open, current.close);

    const isBullish = current.close > current.open;
    const isBearish = current.close < current.open;
    const prevBullish = previous.close > previous.open;
    const prevBearish = previous.close < previous.open;

    // Doji (indecision)
    if (currentBody / currentRange < 0.1 && currentRange > 0) {
      patterns.push('DOJI');
    }

    // Hammer (bullish reversal)
    if (lowerShadow > 2 * currentBody && upperShadow < currentBody * 0.3 && currentRange > 0) {
      patterns.push('HAMMER');
    }

    // Inverted Hammer (bullish reversal)
    if (upperShadow > 2 * currentBody && lowerShadow < currentBody * 0.3 && isBullish) {
      patterns.push('INVERTED_HAMMER');
    }

    // Shooting Star (bearish reversal)
    if (upperShadow > 2 * currentBody && lowerShadow < currentBody * 0.3 && isBearish) {
      patterns.push('SHOOTING_STAR');
    }

    // Hanging Man (bearish reversal)
    if (lowerShadow > 2 * currentBody && upperShadow < currentBody * 0.3 && isBearish) {
      patterns.push('HANGING_MAN');
    }

    // Bullish Engulfing
    if (isBullish && prevBearish &&
        current.close > previous.open && current.open < previous.close &&
        currentBody > prevBody) {
      patterns.push('BULLISH_ENGULFING');
    }

    // Bearish Engulfing
    if (isBearish && prevBullish &&
        current.close < previous.open && current.open > previous.close &&
        currentBody > prevBody) {
      patterns.push('BEARISH_ENGULFING');
    }

    // Piercing Pattern (bullish)
    if (isBullish && prevBearish &&
        current.open < previous.close &&
        current.close > (previous.open + previous.close) / 2 &&
        current.close < previous.open) {
      patterns.push('PIERCING_PATTERN');
    }

    // Dark Cloud Cover (bearish)
    if (isBearish && prevBullish &&
        current.open > previous.close &&
        current.close < (previous.open + previous.close) / 2 &&
        current.close > previous.open) {
      patterns.push('DARK_CLOUD_COVER');
    }

    // Three-candle patterns
    if (beforePrevious) {
      // Morning Star (bullish reversal)
      const beforePrevBearish = beforePrevious.close < beforePrevious.open;
      if (beforePrevBearish &&
          prevBody < currentBody * 0.3 &&
          isBullish &&
          current.close > (beforePrevious.open + beforePrevious.close) / 2) {
        patterns.push('MORNING_STAR');
      }

      // Evening Star (bearish reversal)
      const beforePrevBullish = beforePrevious.close > beforePrevious.open;
      if (beforePrevBullish &&
          prevBody < currentBody * 0.3 &&
          isBearish &&
          current.close < (beforePrevious.open + beforePrevious.close) / 2) {
        patterns.push('EVENING_STAR');
      }

      // Three White Soldiers (strong bullish)
      const beforePrevBodyBullish = beforePrevious.close > beforePrevious.open;
      if (beforePrevBodyBullish && prevBullish && isBullish &&
          current.close > previous.close &&
          previous.close > beforePrevious.close) {
        patterns.push('THREE_WHITE_SOLDIERS');
      }

      // Three Black Crows (strong bearish)
      const beforePrevBodyBearish = beforePrevious.close < beforePrevious.open;
      if (beforePrevBodyBearish && prevBearish && isBearish &&
          current.close < previous.close &&
          previous.close < beforePrevious.close) {
        patterns.push('THREE_BLACK_CROWS');
      }
    }

    // Marubozu (strong conviction)
    if (currentBody / currentRange > 0.95 && currentRange > 0) {
      if (isBullish) {
        patterns.push('BULLISH_MARUBOZU');
      } else {
        patterns.push('BEARISH_MARUBOZU');
      }
    }

    // Tweezer Top/Bottom
    if (Math.abs(current.high - previous.high) / current.high < 0.001 && isBearish && prevBullish) {
      patterns.push('TWEEZER_TOP');
    }
    if (Math.abs(current.low - previous.low) / current.low < 0.001 && isBullish && prevBearish) {
      patterns.push('TWEEZER_BOTTOM');
    }

    return patterns;
  }
}
