import { marketDataService } from './marketDataService';
import { fundamentalDataService } from './fundamentalDataService';
import { TechnicalAnalysis } from '../utils/technicalIndicators';
import { FundamentalAnalysis } from '../utils/fundamentalAnalysis';
import {
  ScreenerCriteria,
  ScreenerResult,
  IntradaySignal,
  SwingTradeSignal,
  StockData,
  OHLCV,
  EnhancedScreenerResult,
  ScreenerCriteriaWithFundamentals
} from '../types';

class ScreenerService {
  /**
   * Run custom screener with specified criteria (Enhanced with Fundamentals)
   */
  async runScreener(criteria: ScreenerCriteriaWithFundamentals): Promise<EnhancedScreenerResult[]> {
    const results: EnhancedScreenerResult[] = [];

    for (const exchange of criteria.markets) {
      const symbols = marketDataService.getStocksByExchange(exchange);
      const limitedSymbols = symbols.slice(0, 20); // Limit for demo

      for (const symbol of limitedSymbols) {
        try {
          const quote = await marketDataService.getQuote(symbol, exchange);
          if (!quote) continue;

          // Apply basic filters
          if (criteria.priceRange) {
            if (criteria.priceRange.min && quote.price < criteria.priceRange.min) continue;
            if (criteria.priceRange.max && quote.price > criteria.priceRange.max) continue;
          }

          if (criteria.volumeMin && quote.volume < criteria.volumeMin) continue;

          // Get historical data and calculate technical indicators
          const historicalData = await marketDataService.getHistoricalData(symbol, exchange, '1d', '3mo');
          const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);

          // Apply technical filters
          if (criteria.technicalFilters) {
            if (!this.passesTechnicalFilters(quote, indicators, historicalData, criteria.technicalFilters)) {
              continue;
            }
          }

          // Fetch fundamental data
          const fundamentals = await fundamentalDataService.getFundamentals(symbol, exchange);

          // Apply fundamental filters if specified
          if (criteria.fundamentalFilters && fundamentals) {
            if (!this.passesFundamentalFilters(fundamentals, criteria.fundamentalFilters)) {
              continue;
            }
          }

          // Calculate technical score and signals
          const { score: technicalScore, signals } = this.calculateScoreAndSignals(quote, indicators, historicalData);
          const confluenceScore = TechnicalAnalysis.calculateConfluence(historicalData, indicators);
          const patterns = TechnicalAnalysis.detectCandlestickPatterns(historicalData);

          // Calculate fundamental score if data available
          let fundamentalScore;
          let combinedScore = technicalScore;
          let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';

          if (fundamentals) {
            fundamentalScore = FundamentalAnalysis.calculateFundamentalScore(fundamentals);
            combinedScore = FundamentalAnalysis.calculateCombinedScore(technicalScore, fundamentalScore.overall);
            recommendation = FundamentalAnalysis.getRecommendation(combinedScore, confluenceScore, fundamentalScore.quality);
          }

          results.push({
            ...quote,
            indicators,
            score: technicalScore,
            signals,
            confluenceScore,
            patterns,
            fundamentals: fundamentals || undefined,
            fundamentalScore,
            combinedScore,
            recommendation,
            riskReward: this.calculateRiskReward(quote.price, indicators)
          });
        } catch (error) {
          console.error(`Error screening ${symbol}:`, error);
        }
      }
    }

    // Sort by combined score (or technical score if no fundamentals)
    return results.sort((a, b) => (b.combinedScore || b.score) - (a.combinedScore || a.score));
  }

  /**
   * Run screener on custom stock list (CSV upload feature)
   */
  async runCustomStockList(
    symbols: Array<{symbol: string; exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'}>,
    criteria?: ScreenerCriteriaWithFundamentals
  ): Promise<EnhancedScreenerResult[]> {
    const results: EnhancedScreenerResult[] = [];

    for (const {symbol, exchange} of symbols) {
      try {
        const quote = await marketDataService.getQuote(symbol, exchange);
        if (!quote) continue;

        // Apply filters if provided
        if (criteria) {
          if (criteria.priceRange) {
            if (criteria.priceRange.min && quote.price < criteria.priceRange.min) continue;
            if (criteria.priceRange.max && quote.price > criteria.priceRange.max) continue;
          }
          if (criteria.volumeMin && quote.volume < criteria.volumeMin) continue;
        }

        // Get historical data and calculate technical indicators
        const historicalData = await marketDataService.getHistoricalData(symbol, exchange, '1d', '3mo');
        const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);

        // Fetch fundamental data
        const fundamentals = await fundamentalDataService.getFundamentals(symbol, exchange);

        // Calculate scores
        const { score: technicalScore, signals } = this.calculateScoreAndSignals(quote, indicators, historicalData);
        const confluenceScore = TechnicalAnalysis.calculateConfluence(historicalData, indicators);
        const patterns = TechnicalAnalysis.detectCandlestickPatterns(historicalData);

        let fundamentalScore;
        let combinedScore = technicalScore;
        let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';

        if (fundamentals) {
          fundamentalScore = FundamentalAnalysis.calculateFundamentalScore(fundamentals);
          combinedScore = FundamentalAnalysis.calculateCombinedScore(technicalScore, fundamentalScore.overall);
          recommendation = FundamentalAnalysis.getRecommendation(combinedScore, confluenceScore, fundamentalScore.quality);
        }

        results.push({
          ...quote,
          indicators,
          score: technicalScore,
          signals,
          confluenceScore,
          patterns,
          fundamentals: fundamentals || undefined,
          fundamentalScore,
          combinedScore,
          recommendation,
          riskReward: this.calculateRiskReward(quote.price, indicators)
        });
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
      }
    }

    return results.sort((a, b) => (b.combinedScore || b.score) - (a.combinedScore || a.score));
  }

  /**
   * Check if stock passes fundamental filters
   */
  private passesFundamentalFilters(fundamentals: any, filters: any): boolean {
    if (filters.peRatioMax && fundamentals.peRatio && fundamentals.peRatio > filters.peRatioMax) return false;
    if (filters.pbRatioMax && fundamentals.pbRatio && fundamentals.pbRatio > filters.pbRatioMax) return false;
    if (filters.roeMin && fundamentals.roe && fundamentals.roe < filters.roeMin) return false;
    if (filters.debtToEquityMax && fundamentals.debtToEquity && fundamentals.debtToEquity > filters.debtToEquityMax) return false;
    if (filters.revenueGrowthMin && fundamentals.revenueGrowth && fundamentals.revenueGrowth < filters.revenueGrowthMin) return false;
    if (filters.epsGrowthMin && fundamentals.epsGrowth && fundamentals.epsGrowth < filters.epsGrowthMin) return false;
    if (filters.dividendYieldMin && fundamentals.dividendYield && fundamentals.dividendYield < filters.dividendYieldMin) return false;
    if (filters.profitMarginMin && fundamentals.netMargin && fundamentals.netMargin < filters.profitMarginMin) return false;

    return true;
  }

  /**
   * Scan for intraday trading opportunities
   */
  async scanIntraday(markets: ('NSE' | 'BSE' | 'NYSE' | 'NASDAQ')[]): Promise<IntradaySignal[]> {
    const signals: IntradaySignal[] = [];

    for (const exchange of markets) {
      const symbols = marketDataService.getStocksByExchange(exchange);
      const limitedSymbols = symbols.slice(0, 15); // Limit for demo

      for (const symbol of limitedSymbols) {
        try {
          // Get 5-minute data for intraday analysis
          const data5m = await marketDataService.getHistoricalData(symbol, exchange, '5m', '1d');
          const data15m = await marketDataService.getHistoricalData(symbol, exchange, '15m', '5d');

          // Momentum scanner
          const momentumSignal = this.detectMomentum(symbol, data5m);
          if (momentumSignal) signals.push(momentumSignal);

          // Breakout scanner
          const breakoutSignal = this.detectBreakout(symbol, data15m);
          if (breakoutSignal) signals.push(breakoutSignal);

          // Gap scanner
          const gapSignal = this.detectGap(symbol, data5m);
          if (gapSignal) signals.push(gapSignal);

        } catch (error) {
          console.error(`Error scanning intraday for ${symbol}:`, error);
        }
      }
    }

    return signals.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Scan for swing trading opportunities
   */
  async scanSwingTrade(markets: ('NSE' | 'BSE' | 'NYSE' | 'NASDAQ')[]): Promise<SwingTradeSignal[]> {
    const signals: SwingTradeSignal[] = [];

    for (const exchange of markets) {
      const symbols = marketDataService.getStocksByExchange(exchange);
      const limitedSymbols = symbols.slice(0, 15);

      for (const symbol of limitedSymbols) {
        try {
          const dailyData = await marketDataService.getHistoricalData(symbol, exchange, '1d', '6mo');
          const indicators = TechnicalAnalysis.calculateAllIndicators(dailyData);

          // Trend following signals
          const trendSignal = this.detectTrend(symbol, dailyData, indicators);
          if (trendSignal) signals.push(trendSignal);

          // Support/Resistance signals
          const srSignal = this.detectSupportResistance(symbol, dailyData, indicators);
          if (srSignal) signals.push(srSignal);

          // Pattern breakout signals
          const patternSignal = this.detectPatternBreakout(symbol, dailyData, indicators);
          if (patternSignal) signals.push(patternSignal);

        } catch (error) {
          console.error(`Error scanning swing for ${symbol}:`, error);
        }
      }
    }

    return signals.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Detect momentum for intraday trading - Enhanced with confluence
   */
  private detectMomentum(symbol: string, data: OHLCV[]): IntradaySignal | null {
    if (data.length < 20) return null;

    const indicators = TechnicalAnalysis.calculateAllIndicators(data);
    const confluenceScore = TechnicalAnalysis.calculateConfluence(data, indicators);
    const current = data[data.length - 1];
    const prices = data.map(d => d.close);
    const ema9 = TechnicalAnalysis.calculateEMA(prices, 9);

    if (!indicators.rsi || !ema9 || !indicators.volumeProfile) return null;

    // Enhanced momentum conditions with multiple confirmations
    const volumeBreakout = indicators.volumeProfile.volumeRatio > 1.5;
    const strongVolume = indicators.volumeProfile.volumeRatio > 2.0;
    const adxConfirm = indicators.adx && indicators.adx > 20;
    const macdConfirm = indicators.macd && Math.abs(indicators.macd.histogram) > 0.2;

    const bullishMomentum = current.close > ema9 && indicators.rsi > 50 && indicators.rsi < 75;
    const bearishMomentum = current.close < ema9 && indicators.rsi < 50 && indicators.rsi > 25;

    // Calculate strength based on multiple factors
    let strength = 50;
    if (volumeBreakout) strength += 15;
    if (strongVolume) strength += 10;
    if (adxConfirm) strength += 10;
    if (macdConfirm) strength += 10;
    if (confluenceScore > 70) strength += 5;

    if (volumeBreakout && bullishMomentum && confluenceScore > 60) {
      const atr = indicators.atr || (current.high - current.low);
      const patterns = TechnicalAnalysis.detectCandlestickPatterns(data);
      const patternConfirm = patterns.some(p => p.includes('BULLISH') || p.includes('HAMMER'));

      if (patternConfirm) strength += 5;

      return {
        type: 'MOMENTUM',
        symbol,
        signal: 'BUY',
        strength: Math.min(99, strength),
        entry: current.close,
        stopLoss: current.close - (atr * 1.5),
        target: current.close + (atr * 3),
        timeframe: '5m',
        description: `Strong bullish momentum (Confluence: ${confluenceScore.toFixed(0)}%). RSI: ${indicators.rsi.toFixed(1)}, ADX: ${indicators.adx?.toFixed(1) || 'N/A'}, Vol: ${indicators.volumeProfile.volumeRatio.toFixed(2)}x${patternConfirm ? ', Pattern confirmed' : ''}`
      };
    }

    if (volumeBreakout && bearishMomentum && confluenceScore > 60) {
      const atr = indicators.atr || (current.high - current.low);
      const patterns = TechnicalAnalysis.detectCandlestickPatterns(data);
      const patternConfirm = patterns.some(p => p.includes('BEARISH') || p.includes('SHOOTING'));

      if (patternConfirm) strength += 5;

      return {
        type: 'MOMENTUM',
        symbol,
        signal: 'SELL',
        strength: Math.min(99, strength),
        entry: current.close,
        stopLoss: current.close + (atr * 1.5),
        target: current.close - (atr * 3),
        timeframe: '5m',
        description: `Strong bearish momentum (Confluence: ${confluenceScore.toFixed(0)}%). RSI: ${indicators.rsi.toFixed(1)}, ADX: ${indicators.adx?.toFixed(1) || 'N/A'}, Vol: ${indicators.volumeProfile.volumeRatio.toFixed(2)}x${patternConfirm ? ', Pattern confirmed' : ''}`
      };
    }

    return null;
  }

  /**
   * Detect breakout for intraday trading
   */
  private detectBreakout(symbol: string, data: OHLCV[]): IntradaySignal | null {
    if (data.length < 20) return null;

    const current = data[data.length - 1];
    const recent = data.slice(-20, -1);
    const high20 = Math.max(...recent.map(d => d.high));
    const low20 = Math.min(...recent.map(d => d.low));

    const indicators = TechnicalAnalysis.calculateAllIndicators(data);
    if (!indicators.volumeProfile) return null;

    const volumeConfirmation = indicators.volumeProfile.volumeRatio > 1.3;

    // Bullish breakout
    if (current.close > high20 && volumeConfirmation) {
      const range = high20 - low20;
      return {
        type: 'BREAKOUT',
        symbol,
        signal: 'BUY',
        strength: Math.min(90, 65 + (indicators.volumeProfile.volumeRatio * 10)),
        entry: current.close,
        stopLoss: high20 - (range * 0.2),
        target: current.close + (range * 0.8),
        timeframe: '15m',
        description: `Bullish breakout above 20-period high with volume confirmation`
      };
    }

    // Bearish breakdown
    if (current.close < low20 && volumeConfirmation) {
      const range = high20 - low20;
      return {
        type: 'BREAKOUT',
        symbol,
        signal: 'SELL',
        strength: Math.min(90, 65 + (indicators.volumeProfile.volumeRatio * 10)),
        entry: current.close,
        stopLoss: low20 + (range * 0.2),
        target: current.close - (range * 0.8),
        timeframe: '15m',
        description: `Bearish breakdown below 20-period low with volume confirmation`
      };
    }

    return null;
  }

  /**
   * Detect gap opportunities
   */
  private detectGap(symbol: string, data: OHLCV[]): IntradaySignal | null {
    if (data.length < 2) return null;

    const current = data[data.length - 1];
    const previous = data[data.length - 2];

    const gapUp = current.open > previous.close * 1.02;
    const gapDown = current.open < previous.close * 0.98;

    if (gapUp && current.close > current.open) {
      return {
        type: 'GAP',
        symbol,
        signal: 'BUY',
        strength: 75,
        entry: current.close,
        stopLoss: current.open,
        target: current.close + (current.close - current.open) * 2,
        timeframe: '5m',
        description: `Gap up with bullish follow-through`
      };
    }

    if (gapDown && current.close < current.open) {
      return {
        type: 'GAP',
        symbol,
        signal: 'SELL',
        strength: 75,
        entry: current.close,
        stopLoss: current.open,
        target: current.close - (current.open - current.close) * 2,
        timeframe: '5m',
        description: `Gap down with bearish follow-through`
      };
    }

    return null;
  }

  /**
   * Detect trend for swing trading
   */
  private detectTrend(symbol: string, data: OHLCV[], indicators: any): SwingTradeSignal | null {
    if (!indicators.ema || !indicators.sma || !indicators.adx) return null;

    const current = data[data.length - 1];
    const { ema20, ema50, ema200 } = indicators.ema;
    const { sma50, sma200 } = indicators.sma;

    // Strong uptrend
    if (ema20 && ema50 && ema200 && indicators.adx > 25 &&
        current.close > ema20 && ema20 > ema50 && ema50 > ema200) {
      return {
        type: 'TREND_FOLLOWING',
        symbol,
        signal: 'BUY',
        strength: Math.min(95, 70 + indicators.adx),
        entry: current.close,
        stopLoss: ema50 || current.close * 0.95,
        target: current.close * 1.15,
        timeframe: '1D',
        trend: 'UPTREND',
        description: `Strong uptrend: Price > EMA20 > EMA50 > EMA200, ADX: ${indicators.adx.toFixed(1)}`
      };
    }

    // Strong downtrend
    if (ema20 && ema50 && ema200 && indicators.adx > 25 &&
        current.close < ema20 && ema20 < ema50 && ema50 < ema200) {
      return {
        type: 'TREND_FOLLOWING',
        symbol,
        signal: 'SELL',
        strength: Math.min(95, 70 + indicators.adx),
        entry: current.close,
        stopLoss: ema50 || current.close * 1.05,
        target: current.close * 0.85,
        timeframe: '1D',
        trend: 'DOWNTREND',
        description: `Strong downtrend: Price < EMA20 < EMA50 < EMA200, ADX: ${indicators.adx.toFixed(1)}`
      };
    }

    return null;
  }

  /**
   * Detect support/resistance levels
   */
  private detectSupportResistance(symbol: string, data: OHLCV[], indicators: any): SwingTradeSignal | null {
    if (!indicators.rsi || !indicators.bollingerBands) return null;

    const current = data[data.length - 1];
    const { upper, lower, middle } = indicators.bollingerBands;

    // Oversold at support
    if (indicators.rsi < 35 && current.close < lower) {
      return {
        type: 'SUPPORT_RESISTANCE',
        symbol,
        signal: 'BUY',
        strength: 80,
        entry: current.close,
        stopLoss: lower * 0.97,
        target: middle,
        timeframe: '1D',
        trend: 'SIDEWAYS',
        description: `Oversold at lower Bollinger Band. RSI: ${indicators.rsi.toFixed(1)}`
      };
    }

    // Overbought at resistance
    if (indicators.rsi > 65 && current.close > upper) {
      return {
        type: 'SUPPORT_RESISTANCE',
        symbol,
        signal: 'SELL',
        strength: 80,
        entry: current.close,
        stopLoss: upper * 1.03,
        target: middle,
        timeframe: '1D',
        trend: 'SIDEWAYS',
        description: `Overbought at upper Bollinger Band. RSI: ${indicators.rsi.toFixed(1)}`
      };
    }

    return null;
  }

  /**
   * Detect pattern breakouts
   */
  private detectPatternBreakout(symbol: string, data: OHLCV[], indicators: any): SwingTradeSignal | null {
    const patterns = TechnicalAnalysis.detectCandlestickPatterns(data);

    if (patterns.includes('BULLISH_ENGULFING') || patterns.includes('MORNING_STAR') || patterns.includes('HAMMER')) {
      const current = data[data.length - 1];
      const atr = indicators.atr || (current.high - current.low);

      return {
        type: 'PATTERN_BREAKOUT',
        symbol,
        signal: 'BUY',
        strength: 75,
        entry: current.close,
        stopLoss: current.close - (atr * 2),
        target: current.close + (atr * 3),
        timeframe: '1D',
        trend: 'UPTREND',
        description: `Bullish pattern detected: ${patterns.join(', ')}`
      };
    }

    if (patterns.includes('BEARISH_ENGULFING') || patterns.includes('EVENING_STAR') || patterns.includes('SHOOTING_STAR')) {
      const current = data[data.length - 1];
      const atr = indicators.atr || (current.high - current.low);

      return {
        type: 'PATTERN_BREAKOUT',
        symbol,
        signal: 'SELL',
        strength: 75,
        entry: current.close,
        stopLoss: current.close + (atr * 2),
        target: current.close - (atr * 3),
        timeframe: '1D',
        trend: 'DOWNTREND',
        description: `Bearish pattern detected: ${patterns.join(', ')}`
      };
    }

    return null;
  }

  /**
   * Check if stock passes technical filters
   */
  private passesTechnicalFilters(stock: StockData, indicators: any, data: OHLCV[], filters: any): boolean {
    // RSI filter
    if (filters.rsiRange) {
      if (!indicators.rsi) return false;
      if (filters.rsiRange.min && indicators.rsi < filters.rsiRange.min) return false;
      if (filters.rsiRange.max && indicators.rsi > filters.rsiRange.max) return false;
    }

    // MACD crossover
    if (filters.macdCrossover && indicators.macd) {
      const isBullish = indicators.macd.histogram > 0;
      const isBearish = indicators.macd.histogram < 0;

      if (filters.macdCrossover === 'bullish' && !isBullish) return false;
      if (filters.macdCrossover === 'bearish' && !isBearish) return false;
    }

    // Price above EMA
    if (filters.priceAboveEMA && indicators.ema) {
      for (const period of filters.priceAboveEMA) {
        const emaKey = `ema${period}` as keyof typeof indicators.ema;
        const emaValue = indicators.ema[emaKey];
        if (!emaValue || stock.price <= emaValue) return false;
      }
    }

    // Price below EMA
    if (filters.priceBelowEMA && indicators.ema) {
      for (const period of filters.priceBelowEMA) {
        const emaKey = `ema${period}` as keyof typeof indicators.ema;
        const emaValue = indicators.ema[emaKey];
        if (!emaValue || stock.price >= emaValue) return false;
      }
    }

    // ADX filter
    if (filters.adxMin && indicators.adx) {
      if (indicators.adx < filters.adxMin) return false;
    }

    // Volume breakout
    if (filters.volumeBreakout && indicators.volumeProfile) {
      if (indicators.volumeProfile.volumeRatio < 1.5) return false;
    }

    return true;
  }

  /**
   * Calculate score and generate signals
   */
  private calculateScoreAndSignals(stock: StockData, indicators: any, data: OHLCV[]): { score: number; signals: string[] } {
    let score = 50; // Base score
    const signals: string[] = [];

    // RSI scoring
    if (indicators.rsi) {
      if (indicators.rsi < 30) {
        score += 15;
        signals.push('Oversold (RSI < 30)');
      } else if (indicators.rsi > 70) {
        score -= 10;
        signals.push('Overbought (RSI > 70)');
      } else if (indicators.rsi >= 40 && indicators.rsi <= 60) {
        score += 5;
      }
    }

    // MACD scoring
    if (indicators.macd) {
      if (indicators.macd.histogram > 0) {
        score += 10;
        signals.push('MACD Bullish');
      } else {
        score -= 5;
      }
    }

    // Trend scoring
    if (indicators.ema?.ema20 && indicators.ema?.ema50) {
      if (stock.price > indicators.ema.ema20 && indicators.ema.ema20 > indicators.ema.ema50) {
        score += 15;
        signals.push('Strong Uptrend');
      } else if (stock.price < indicators.ema.ema20 && indicators.ema.ema20 < indicators.ema.ema50) {
        score -= 10;
        signals.push('Downtrend');
      }
    }

    // Volume scoring
    if (indicators.volumeProfile && indicators.volumeProfile.volumeRatio > 1.5) {
      score += 10;
      signals.push('High Volume');
    }

    // ADX scoring
    if (indicators.adx && indicators.adx > 25) {
      score += 10;
      signals.push('Strong Trend (ADX > 25)');
    }

    // Pattern detection
    const patterns = TechnicalAnalysis.detectCandlestickPatterns(data);
    if (patterns.length > 0) {
      score += 5 * patterns.length;
      signals.push(...patterns.map(p => `Pattern: ${p}`));
    }

    return { score: Math.max(0, Math.min(100, score)), signals };
  }

  /**
   * Calculate risk/reward ratio
   */
  private calculateRiskReward(currentPrice: number, indicators: any) {
    if (!indicators.atr || !indicators.sma?.sma20) return undefined;

    const stopLoss = currentPrice - (indicators.atr * 2);
    const target = currentPrice + (indicators.atr * 3);

    return {
      entryPrice: currentPrice,
      stopLoss,
      target,
      ratio: Math.abs((target - currentPrice) / (currentPrice - stopLoss))
    };
  }
}

export const screenerService = new ScreenerService();
