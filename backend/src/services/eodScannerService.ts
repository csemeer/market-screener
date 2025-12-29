/**
 * EOD Scanner Service - End-of-Day stock analysis and watchlist generation
 * Analyzes stocks after market close to identify high-probability setups for next-day trading
 */

import { databaseService } from './databaseService';
import { loggerService } from './loggerService';
import { screenerService } from './screenerService';
import { marketDataService } from './marketDataService';
import { getCurrencyForExchange, Exchange } from '../utils/marketUtils';
import { TechnicalAnalysis } from '../utils/technicalIndicators';

export type SetupType = 'BREAKOUT' | 'BREAKDOWN' | 'PULLBACK' | 'REVERSAL' | 'CONSOLIDATION';
export type Timeframe = 'INTRADAY' | 'SWING' | 'POSITIONAL';

export interface EODAnalysisResult {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  currency: 'USD' | 'INR';
  currentPrice: number;

  // Setup Classification
  setupType: SetupType;
  timeframe: Timeframe;
  score: number; // 0-100

  // Entry/Exit Levels
  entryPrice: number;
  entryTrigger?: number;
  entryCondition: string;
  stopLoss: number;
  target1: number;
  target2?: number;
  target3?: number;
  trailingStopPercent: number;

  // Risk Management
  riskRewardRatio: number;
  positionSizePercent: number;
  maxLossAmount: number;

  // Technical Data
  indicators: any;
  signals: string[];
  patterns: string[];

  // Notes
  setupNotes: string;
}

export interface EODScanConfig {
  exchanges: Exchange[];
  minScore: number;
  maxStocks: number;
  lookbackDays: number;
  includeIntraday: boolean;
  includeSwing: boolean;
  includePositional: boolean;
}

class EODScannerService {
  private isScanning: boolean = false;
  private lastScanDate: Date | null = null;

  /**
   * Run EOD analysis and generate watchlist for tomorrow
   */
  async runEODScan(config: Partial<EODScanConfig> = {}): Promise<{
    watchlistId: number;
    stocksAnalyzed: number;
    stocksSelected: number;
    topStocks: EODAnalysisResult[];
  }> {
    if (this.isScanning) {
      throw new Error('EOD scan already in progress');
    }

    this.isScanning = true;
    loggerService.info('Starting EOD scan', { config });

    try {
      // Default configuration
      const scanConfig: EODScanConfig = {
        exchanges: config.exchanges || ['NSE', 'BSE', 'NYSE', 'NASDAQ'],
        minScore: config.minScore || 70,
        maxStocks: config.maxStocks || 20,
        lookbackDays: config.lookbackDays || 50,
        includeIntraday: config.includeIntraday !== false,
        includeSwing: config.includeSwing !== false,
        includePositional: config.includePositional !== false,
      };

      // Step 1: Get stock universe for analysis
      const stocksToAnalyze = await this.getStockUniverse(scanConfig.exchanges);
      loggerService.info(`Analyzing ${stocksToAnalyze.length} stocks`);

      // Step 2: Analyze each stock
      const analysisResults: EODAnalysisResult[] = [];

      for (const stock of stocksToAnalyze) {
        try {
          const analysis = await this.analyzeStock(stock, scanConfig);
          if (analysis && analysis.score >= scanConfig.minScore) {
            analysisResults.push(analysis);
          }
        } catch (error) {
          loggerService.debug(`Error analyzing ${stock.symbol}`, { error });
        }
      }

      // Step 3: Sort by score and select top N
      const topStocks = analysisResults
        .sort((a, b) => b.score - a.score)
        .slice(0, scanConfig.maxStocks);

      loggerService.info(`Found ${topStocks.length} high-quality setups out of ${stocksToAnalyze.length} stocks`);

      // Step 4: Create watchlist in database
      const watchlistId = this.createWatchlist(topStocks, scanConfig);

      this.lastScanDate = new Date();

      return {
        watchlistId,
        stocksAnalyzed: stocksToAnalyze.length,
        stocksSelected: topStocks.length,
        topStocks,
      };
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Get stock universe to analyze
   */
  private async getStockUniverse(exchanges: Exchange[]): Promise<Array<{ symbol: string; exchange: Exchange }>> {
    // TODO: Replace with actual stock list from database or API
    // For now, return a curated list of popular stocks
    const stockLists = {
      NSE: [
        'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
        'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
        'BAJFINANCE', 'WIPRO', 'HCLTECH', 'ULTRACEMCO', 'NESTLEIND', 'SUNPHARMA', 'TATAMOTORS',
        'BAJAJFINSV', 'ONGC', 'NTPC', 'POWERGRID', 'TECHM', 'M&M', 'ADANIPORTS', 'JSWSTEEL'
      ],
      BSE: [], // Same as NSE for now
      NYSE: [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'JPM',
        'JNJ', 'WMT', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'KO', 'PEP',
        'COST', 'AVGO', 'TMO', 'MCD', 'ACN', 'CSCO', 'LIN', 'ABT', 'NKE', 'DHR'
      ],
      NASDAQ: [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'COST', 'NFLX',
        'AMD', 'QCOM', 'INTC', 'CMCSA', 'TXN', 'AMGN', 'HON', 'INTU', 'SBUX', 'AMAT',
        'GILD', 'ADI', 'BKNG', 'VRTX', 'ADP', 'REGN', 'MDLZ', 'ISRG', 'LRCX', 'PANW'
      ],
    };

    const stocks: Array<{ symbol: string; exchange: Exchange }> = [];

    for (const exchange of exchanges) {
      const symbolList = stockLists[exchange] || [];
      for (const symbol of symbolList) {
        stocks.push({ symbol, exchange });
      }
    }

    return stocks;
  }

  /**
   * Analyze a single stock and generate setup if quality meets criteria
   */
  private async analyzeStock(
    stock: { symbol: string; exchange: Exchange },
    config: EODScanConfig
  ): Promise<EODAnalysisResult | null> {
    // Fetch historical data
    const historicalData = await marketDataService.getHistoricalData(
      stock.symbol,
      stock.exchange,
      '1d',
      `${config.lookbackDays}d`
    );

    if (!historicalData || historicalData.length < 20) {
      return null; // Insufficient data
    }

    // Calculate technical indicators
    const closes = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);

    const currentRSI = TechnicalAnalysis.calculateRSI(historicalData, 14);
    const currentMACD = TechnicalAnalysis.calculateMACD(historicalData, 12, 26, 9);
    const currentEMA9 = TechnicalAnalysis.calculateEMA(closes, 9);
    const currentEMA20 = TechnicalAnalysis.calculateEMA(closes, 20);
    const currentEMA50 = TechnicalAnalysis.calculateEMA(closes, 50);
    const currentEMA200 = TechnicalAnalysis.calculateEMA(closes, 200);
    const currentADX = TechnicalAnalysis.calculateADX(historicalData, 14);
    const currentATR = TechnicalAnalysis.calculateATR(historicalData, 14);
    const currentBB = TechnicalAnalysis.calculateBollingerBands(historicalData, 20, 2);

    const currentPrice = closes[closes.length - 1];

    // Skip if critical indicators are null
    if (!currentRSI || !currentMACD || !currentEMA20 || !currentADX || !currentATR || !currentBB) {
      return null;
    }

    // Detect setup type and calculate score
    const setupDetection = this.detectSetup({
      currentPrice,
      historicalData,
      indicators: {
        rsi: currentRSI,
        macd: currentMACD,
        ema9: currentEMA9,
        ema20: currentEMA20,
        ema50: currentEMA50,
        ema200: currentEMA200,
        adx: currentADX,
        atr: currentATR,
        bb: currentBB,
      },
      volumes,
    });

    if (!setupDetection || setupDetection.score < config.minScore) {
      return null;
    }

    // Calculate entry/exit levels
    const levels = this.calculateEntryExitLevels({
      setupType: setupDetection.setupType,
      currentPrice,
      atr: currentATR,
      support: setupDetection.supportLevel,
      resistance: setupDetection.resistanceLevel,
      ema20: currentEMA20,
      bb: currentBB,
    });

    // Determine timeframe
    const timeframe = this.determineTimeframe(setupDetection.setupType, currentADX, currentATR, currentPrice);

    return {
      symbol: stock.symbol,
      companyName: stock.symbol, // TODO: Fetch actual company name
      exchange: stock.exchange,
      currency: getCurrencyForExchange(stock.exchange),
      currentPrice,

      setupType: setupDetection.setupType,
      timeframe,
      score: setupDetection.score,

      entryPrice: levels.entryPrice,
      entryTrigger: levels.entryTrigger,
      entryCondition: levels.entryCondition,
      stopLoss: levels.stopLoss,
      target1: levels.target1,
      target2: levels.target2,
      target3: levels.target3,
      trailingStopPercent: timeframe === 'INTRADAY' ? 1.5 : timeframe === 'SWING' ? 3.0 : 5.0,

      riskRewardRatio: levels.riskRewardRatio,
      positionSizePercent: this.calculatePositionSize(levels.riskRewardRatio, setupDetection.score),
      maxLossAmount: (currentPrice - levels.stopLoss) * 100, // Assuming 100 shares

      indicators: {
        rsi: currentRSI,
        macd: currentMACD,
        ema9: currentEMA9,
        ema20: currentEMA20,
        ema50: currentEMA50,
        ema200: currentEMA200,
        adx: currentADX,
        atr: currentATR,
        bb: currentBB,
      },
      signals: setupDetection.signals,
      patterns: setupDetection.patterns,

      setupNotes: setupDetection.notes,
    };
  }

  /**
   * Detect setup type and calculate quality score
   */
  private detectSetup(data: {
    currentPrice: number;
    historicalData: any[];
    indicators: any;
    volumes: number[];
  }): {
    setupType: SetupType;
    score: number;
    signals: string[];
    patterns: string[];
    notes: string;
    supportLevel?: number;
    resistanceLevel?: number;
  } | null {
    const { currentPrice, historicalData, indicators, volumes } = data;
    const { rsi, macd, ema9, ema20, ema50, ema200, adx, atr, bb } = indicators;

    let score = 50; // Base score
    const signals: string[] = [];
    const patterns: string[] = [];
    let setupType: SetupType | null = null;
    let notes = '';

    // Calculate average volume
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;

    // Find support and resistance levels
    const recentHighs = historicalData.slice(-20).map(d => d.high);
    const recentLows = historicalData.slice(-20).map(d => d.low);
    const resistance = Math.max(...recentHighs);
    const support = Math.min(...recentLows);

    // 1. BREAKOUT Detection
    if (
      currentPrice >= ema20 &&
      currentPrice >= ema50 &&
      ema9 > ema20 &&
      ema20 > ema50 &&
      rsi > 55 && rsi < 80 &&
      adx > 20 &&
      macd.histogram > 0
    ) {
      setupType = 'BREAKOUT';
      score += 25;
      signals.push('EMA alignment bullish');
      signals.push('RSI in strength zone');
      signals.push('ADX showing trend strength');
      notes = 'Strong uptrend with momentum confirmation';

      if (currentPrice > resistance * 0.98) {
        score += 10;
        signals.push('Near resistance breakout');
      }

      if (volumeRatio > 1.5) {
        score += 10;
        signals.push('Above average volume');
      }
    }

    // 2. BREAKDOWN Detection (for shorting or puts)
    else if (
      currentPrice <= ema20 &&
      currentPrice <= ema50 &&
      ema9 < ema20 &&
      ema20 < ema50 &&
      rsi < 45 && rsi > 20 &&
      adx > 20 &&
      macd.histogram < 0
    ) {
      setupType = 'BREAKDOWN';
      score += 25;
      signals.push('EMA alignment bearish');
      signals.push('RSI in weakness zone');
      signals.push('ADX showing trend strength');
      notes = 'Strong downtrend with momentum confirmation';

      if (currentPrice < support * 1.02) {
        score += 10;
        signals.push('Near support breakdown');
      }

      if (volumeRatio > 1.5) {
        score += 10;
        signals.push('Above average volume');
      }
    }

    // 3. PULLBACK Detection (buy the dip in uptrend)
    else if (
      ema50 > ema200 && // Long-term uptrend
      currentPrice > ema200 && // Above long-term trend
      currentPrice < ema20 && // Pulled back below short-term
      rsi < 45 && rsi > 30 && // Oversold but not extreme
      macd.histogram > macd.histogram[macd.histogram.length - 2] // MACD turning up
    ) {
      setupType = 'PULLBACK';
      score += 20;
      signals.push('Pullback in uptrend');
      signals.push('RSI oversold');
      signals.push('MACD divergence');
      notes = 'Healthy pullback in strong uptrend';

      if (currentPrice > ema50) {
        score += 10;
        signals.push('Holding above 50 EMA');
      }

      if (volumeRatio < 0.7) {
        score += 10;
        signals.push('Low volume on pullback (bullish)');
      }
    }

    // 4. REVERSAL Detection
    else if (
      ((rsi < 30 && rsi > rsi - 5) || (rsi > 70 && rsi < rsi + 5)) && // RSI at extremes and turning
      Math.abs(macd.histogram) < Math.abs(macd.histogram[macd.histogram.length - 2]) // MACD divergence
    ) {
      setupType = 'REVERSAL';
      score += 15;
      signals.push('RSI at extremes');
      signals.push('Potential divergence');
      notes = 'Possible trend reversal setup';

      if (currentPrice < bb.lower || currentPrice > bb.upper) {
        score += 10;
        signals.push('Price at Bollinger Band extreme');
      }
    }

    // 5. CONSOLIDATION Breakout
    else if (
      adx < 25 && // Weak trend (consolidation)
      bb.upper - bb.lower < (currentPrice * 0.05) // Tight Bollinger Bands
    ) {
      setupType = 'CONSOLIDATION';
      score += 15;
      signals.push('Tight consolidation');
      signals.push('Low ADX');
      notes = 'Consolidation - await breakout';

      if (volumeRatio < 0.8) {
        score += 10;
        signals.push('Volume drying up');
      }
    }

    // Additional scoring adjustments
    if (setupType) {
      // Volume confirmation
      if (volumeRatio > 1.3 && (setupType === 'BREAKOUT' || setupType === 'BREAKDOWN')) {
        score += 5;
      }

      // Trend strength
      if (adx > 30) {
        score += 5;
        signals.push('Strong trend (ADX > 30)');
      }

      // Multi-timeframe confirmation
      if (ema9 > ema20 && ema20 > ema50 && ema50 > ema200) {
        score += 10;
        patterns.push('All EMAs aligned');
      }

      // Cap score at 100
      score = Math.min(100, score);
    }

    if (!setupType || score < 60) {
      return null;
    }

    return {
      setupType,
      score,
      signals,
      patterns,
      notes,
      supportLevel: support,
      resistanceLevel: resistance,
    };
  }

  /**
   * Calculate entry/exit levels based on setup type
   */
  private calculateEntryExitLevels(params: {
    setupType: SetupType;
    currentPrice: number;
    atr: number;
    support?: number;
    resistance?: number;
    ema20: number;
    bb: any;
  }): {
    entryPrice: number;
    entryTrigger?: number;
    entryCondition: string;
    stopLoss: number;
    target1: number;
    target2: number;
    target3: number;
    riskRewardRatio: number;
  } {
    const { setupType, currentPrice, atr, support, resistance, ema20, bb } = params;

    let entryPrice: number;
    let entryTrigger: number | undefined;
    let entryCondition: string;
    let stopLoss: number;
    let target1: number;
    let target2: number;
    let target3: number;

    switch (setupType) {
      case 'BREAKOUT':
        entryPrice = currentPrice;
        entryTrigger = resistance || currentPrice * 1.01;
        entryCondition = 'BREAK_ABOVE';
        stopLoss = Math.max(support || currentPrice * 0.97, ema20, currentPrice - (2 * atr));
        target1 = currentPrice + (1.5 * atr);
        target2 = currentPrice + (3 * atr);
        target3 = currentPrice + (5 * atr);
        break;

      case 'BREAKDOWN':
        entryPrice = currentPrice;
        entryTrigger = support || currentPrice * 0.99;
        entryCondition = 'BREAK_BELOW';
        stopLoss = Math.min(resistance || currentPrice * 1.03, ema20, currentPrice + (2 * atr));
        target1 = currentPrice - (1.5 * atr);
        target2 = currentPrice - (3 * atr);
        target3 = currentPrice - (5 * atr);
        break;

      case 'PULLBACK':
        entryPrice = ema20;
        entryTrigger = ema20;
        entryCondition = 'PULLBACK_TO';
        stopLoss = currentPrice - (2 * atr);
        target1 = currentPrice + (2 * atr);
        target2 = currentPrice + (4 * atr);
        target3 = currentPrice + (6 * atr);
        break;

      case 'REVERSAL':
        entryPrice = currentPrice;
        entryTrigger = currentPrice > bb.middle ? bb.middle : bb.middle;
        entryCondition = currentPrice > bb.middle ? 'BREAK_BELOW' : 'BREAK_ABOVE';
        stopLoss = currentPrice > bb.middle
          ? currentPrice + (1.5 * atr)
          : currentPrice - (1.5 * atr);
        target1 = currentPrice > bb.middle
          ? currentPrice - (2 * atr)
          : currentPrice + (2 * atr);
        target2 = currentPrice > bb.middle
          ? currentPrice - (4 * atr)
          : currentPrice + (4 * atr);
        target3 = currentPrice > bb.middle
          ? currentPrice - (6 * atr)
          : currentPrice + (6 * atr);
        break;

      case 'CONSOLIDATION':
        entryPrice = currentPrice;
        entryTrigger = bb.upper;
        entryCondition = 'BREAK_ABOVE';
        stopLoss = bb.lower;
        target1 = currentPrice + (bb.upper - bb.lower);
        target2 = currentPrice + (2 * (bb.upper - bb.lower));
        target3 = currentPrice + (3 * (bb.upper - bb.lower));
        break;

      default:
        entryPrice = currentPrice;
        stopLoss = currentPrice * 0.97;
        target1 = currentPrice * 1.03;
        target2 = currentPrice * 1.06;
        target3 = currentPrice * 1.10;
        entryCondition = 'BREAK_ABOVE';
    }

    const risk = Math.abs(entryPrice - stopLoss);
    const reward = target1 - entryPrice;
    const riskRewardRatio = reward / risk;

    return {
      entryPrice,
      entryTrigger,
      entryCondition,
      stopLoss,
      target1,
      target2,
      target3,
      riskRewardRatio,
    };
  }

  /**
   * Determine appropriate timeframe for the setup
   */
  private determineTimeframe(setupType: SetupType, adx: number, atr: number, currentPrice: number): Timeframe {
    const volatilityPercent = (atr / currentPrice) * 100;

    // High volatility + strong trend = Intraday
    if (volatilityPercent > 2 && adx > 30) {
      return 'INTRADAY';
    }

    // Moderate volatility = Swing
    if (volatilityPercent > 1 && volatilityPercent <= 3) {
      return 'SWING';
    }

    // Low volatility or weak trend = Positional
    return 'POSITIONAL';
  }

  /**
   * Calculate position size based on R:R and score
   */
  private calculatePositionSize(rr: number, score: number): number {
    // Base position size on score and R:R
    let baseSize = 2.0; // 2% of capital

    // Increase size for high-quality setups
    if (score >= 90) baseSize = 3.0;
    else if (score >= 80) baseSize = 2.5;

    // Increase size for good R:R
    if (rr >= 3.0) baseSize += 0.5;
    else if (rr >= 2.5) baseSize += 0.25;

    // Cap at 5% max position size
    return Math.min(baseSize, 5.0);
  }

  /**
   * Create watchlist in database
   */
  private createWatchlist(stocks: EODAnalysisResult[], config: EODScanConfig): number {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use primary exchange from config (or the exchange of most stocks)
      const exchangeCounts = stocks.reduce((acc, stock) => {
        acc[stock.exchange] = (acc[stock.exchange] || 0) + 1;
        return acc;
      }, {} as Record<Exchange, number>);

      const primaryExchange = Object.entries(exchangeCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || config.exchanges[0];

      // Create watchlist entry
      const watchlistId = databaseService.createWatchlist(
        tomorrow,
        primaryExchange,
        0, // Will be updated by caller with total analyzed
        stocks.length,
        `EOD analysis - Top ${stocks.length} setups with score > ${config.minScore}`
      );

      loggerService.info(`Created watchlist #${watchlistId} for tomorrow`, {
        date: tomorrow.toISOString().split('T')[0],
        stocksSelected: stocks.length,
        primaryExchange
      });

      // Insert all stocks into watchlist
      for (const stock of stocks) {
        const stockId = databaseService.insertWatchlistStock(watchlistId, {
          symbol: stock.symbol,
          companyName: stock.companyName,
          exchange: stock.exchange,
          currency: stock.currency,
          setupType: stock.setupType,
          timeframe: stock.timeframe,
          score: stock.score,
          entryPrice: stock.entryPrice,
          entryTrigger: stock.entryTrigger,
          entryCondition: stock.entryCondition,
          stopLoss: stock.stopLoss,
          target1: stock.target1,
          target2: stock.target2,
          target3: stock.target3,
          trailingStopPercent: stock.trailingStopPercent,
          riskRewardRatio: stock.riskRewardRatio,
          positionSizePercent: stock.positionSizePercent,
          maxLossAmount: stock.maxLossAmount,
          technicalData: JSON.stringify(stock.indicators),
          signals: JSON.stringify(stock.signals),
          chartPatterns: JSON.stringify(stock.patterns),
          setupNotes: stock.setupNotes
        });

        loggerService.debug(`Added ${stock.symbol} to watchlist`, {
          stockId,
          score: stock.score,
          setupType: stock.setupType
        });
      }

      return watchlistId;
    } catch (error) {
      loggerService.error('Failed to create watchlist in database', { error });
      throw error;
    }
  }

  /**
   * Get scanning status
   */
  getStatus(): { isScanning: boolean; lastScanDate: Date | null } {
    return {
      isScanning: this.isScanning,
      lastScanDate: this.lastScanDate,
    };
  }
}

export const eodScannerService = new EODScannerService();
