/**
 * Auto-Scan Service - Automated periodic stock scanning
 * Runs pre-configured strategies and stores results in database
 */

import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { databaseService, ScanResult, Alert } from './databaseService';
import { logger } from './loggerService';
import { runScreener } from './screenerService';
import { getQuote } from './marketDataService';

/**
 * Pre-configured intraday trading strategies
 */
export const INTRADAY_STRATEGIES = {
  MOMENTUM_BREAKOUT: {
    name: 'Intraday Momentum Breakout',
    description: 'High volume breakouts with strong momentum (3-15 minute holds)',
    type: 'INTRADAY' as const,
    scanInterval: 5, // minutes
    markets: ['NSE', 'BSE'],
    criteria: {
      rsiMin: 60,
      rsiMax: 85,
      volumeMultiplier: 2.0, // 2x average volume
      adxMin: 25,
      priceAboveEMA20: true,
      macdBullish: true,
    },
    minConfidenceScore: 70,
    stopLossPercent: 1.5, // 1.5% stop loss
    targetPercent: 3.0, // 3% target
    enabled: true,
  },

  SCALPING_SETUP: {
    name: 'Quick Scalping Setup',
    description: 'Fast 1-5 minute scalps on volatile stocks',
    type: 'INTRADAY' as const,
    scanInterval: 2, // minutes
    markets: ['NSE'],
    criteria: {
      rsiMin: 40,
      rsiMax: 60,
      volumeMultiplier: 3.0, // High volume
      bollingerBandPosition: 'NEAR_LOWER', // Bounces from lower BB
      stochasticOversold: true,
    },
    minConfidenceScore: 65,
    stopLossPercent: 0.8,
    targetPercent: 1.5,
    enabled: true,
  },

  GAP_REVERSAL: {
    name: 'Gap Fill Reversal',
    description: 'Stocks gapping up/down with reversal signals',
    type: 'INTRADAY' as const,
    scanInterval: 15, // minutes
    markets: ['NSE', 'BSE'],
    criteria: {
      gapPercentMin: 2.0, // 2% gap
      rsiExtremes: true, // RSI > 70 or < 30
      volumeMultiplier: 1.5,
      candlestickReversalPattern: true,
    },
    minConfidenceScore: 68,
    stopLossPercent: 2.0,
    targetPercent: 3.5,
    enabled: true,
  },

  VWAP_BOUNCE: {
    name: 'VWAP Bounce Trading',
    description: 'Price bouncing off VWAP with volume confirmation',
    type: 'INTRADAY' as const,
    scanInterval: 5, // minutes
    markets: ['NSE'],
    criteria: {
      priceNearVWAP: true, // Within 0.5% of VWAP
      volumeMultiplier: 1.5,
      rsiMin: 45,
      rsiMax: 65,
      macdBullish: true,
    },
    minConfidenceScore: 67,
    stopLossPercent: 1.2,
    targetPercent: 2.5,
    enabled: true,
  },
};

/**
 * Pre-configured swing trading strategies
 */
export const SWING_STRATEGIES = {
  TREND_FOLLOWING: {
    name: 'Swing Trend Following',
    description: 'Multi-day trend rides with EMA alignment (3-10 day holds)',
    type: 'SWING' as const,
    scanInterval: 60, // minutes (scan once per hour)
    markets: ['NSE', 'BSE'],
    criteria: {
      emaAlignment: true, // 9 > 20 > 50 > 200
      adxMin: 25,
      rsiMin: 50,
      rsiMax: 70,
      volumeMultiplier: 1.3,
      priceAboveEMA50: true,
    },
    minConfidenceScore: 72,
    stopLossPercent: 4.0,
    targetPercent: 10.0,
    enabled: true,
  },

  SUPPORT_BOUNCE: {
    name: 'Support Zone Bounce',
    description: 'Buying at key support levels with reversal confirmation',
    type: 'SWING' as const,
    scanInterval: 30, // minutes
    markets: ['NSE', 'BSE'],
    criteria: {
      nearSupport: true,
      rsiMin: 30,
      rsiMax: 45,
      macdBullish: true,
      volumeIncreasing: true,
      bullishCandlestickPattern: true,
    },
    minConfidenceScore: 70,
    stopLossPercent: 5.0,
    targetPercent: 12.0,
    enabled: true,
  },

  BREAKOUT_CONSOLIDATION: {
    name: 'Consolidation Breakout',
    description: 'Stocks breaking out of multi-week consolidation',
    type: 'SWING' as const,
    scanInterval: 60, // minutes
    markets: ['NSE', 'BSE'],
    criteria: {
      consolidationBreakout: true,
      volumeMultiplier: 2.0, // Strong breakout volume
      rsiMin: 55,
      rsiMax: 75,
      adxMin: 20,
      priceAbove52WeekMA: true,
    },
    minConfidenceScore: 75,
    stopLossPercent: 6.0,
    targetPercent: 15.0,
    enabled: true,
  },

  PULLBACK_ENTRY: {
    name: 'Trend Pullback Entry',
    description: 'Buying pullbacks in established uptrends',
    type: 'SWING' as const,
    scanInterval: 30, // minutes
    markets: ['NSE', 'BSE'],
    criteria: {
      longTermTrendUp: true, // Above 200 EMA
      shortTermPullback: true, // Below 20 EMA
      rsiMin: 35,
      rsiMax: 50,
      volumeDrying: true, // Volume decreasing on pullback
      macdBullishCrossover: true,
    },
    minConfidenceScore: 73,
    stopLossPercent: 4.5,
    targetPercent: 11.0,
    enabled: true,
  },

  EARNING_MOMENTUM: {
    name: 'Post-Earnings Momentum',
    description: 'Stocks with strong earnings showing continued momentum',
    type: 'SWING' as const,
    scanInterval: 120, // minutes
    markets: ['NSE', 'BSE'],
    criteria: {
      recentEarningsBeat: true,
      volumeMultiplier: 1.5,
      rsiMin: 60,
      rsiMax: 80,
      priceAboveAllEMAs: true,
      fundamentalsGood: true, // PE < 30, good margins
    },
    minConfidenceScore: 76,
    stopLossPercent: 5.5,
    targetPercent: 14.0,
    enabled: true,
  },
};

class AutoScanService {
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();
  private isMarketHours: boolean = false;
  private initialized: boolean = false;

  constructor() {}

  /**
   * Initialize auto-scan service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('AutoScanService already initialized');
      return;
    }

    try {
      logger.info('Initializing AutoScanService...');

      // Initialize database
      databaseService.initialize();

      // Setup intraday strategies
      for (const [key, strategy] of Object.entries(INTRADAY_STRATEGIES)) {
        if (strategy.enabled) {
          const config = databaseService.getOrCreateAutoScanConfig(`INTRADAY_${key}`, {
            enabled: strategy.enabled,
            scanInterval: strategy.scanInterval,
            markets: JSON.stringify(strategy.markets),
            minConfidenceScore: strategy.minConfidenceScore,
            maxResultsPerScan: 20,
          });

          // Schedule the scan
          this.scheduleStrategy(`INTRADAY_${key}`, strategy, config.scanInterval);
        }
      }

      // Setup swing strategies
      for (const [key, strategy] of Object.entries(SWING_STRATEGIES)) {
        if (strategy.enabled) {
          const config = databaseService.getOrCreateAutoScanConfig(`SWING_${key}`, {
            enabled: strategy.enabled,
            scanInterval: strategy.scanInterval,
            markets: JSON.stringify(strategy.markets),
            minConfidenceScore: strategy.minConfidenceScore,
            maxResultsPerScan: 15,
          });

          // Schedule the scan
          this.scheduleStrategy(`SWING_${key}`, strategy, config.scanInterval);
        }
      }

      // Setup market hours checker (runs every minute)
      this.setupMarketHoursChecker();

      // Setup result status updater (runs every 15 minutes)
      this.setupResultStatusUpdater();

      // Run initial scan for all strategies
      await this.runAllEnabledScans();

      this.initialized = true;
      logger.info('AutoScanService initialized successfully', {
        intradayStrategies: Object.keys(INTRADAY_STRATEGIES).filter(k => INTRADAY_STRATEGIES[k as keyof typeof INTRADAY_STRATEGIES].enabled).length,
        swingStrategies: Object.keys(SWING_STRATEGIES).filter(k => SWING_STRATEGIES[k as keyof typeof SWING_STRATEGIES].enabled).length,
      });
    } catch (error) {
      logger.error('Failed to initialize AutoScanService', { error });
      throw error;
    }
  }

  /**
   * Schedule a strategy scan
   */
  private scheduleStrategy(strategyKey: string, strategy: any, intervalMinutes: number): void {
    const cronExpression = `*/${intervalMinutes} * * * *`; // Every N minutes

    const job = cron.schedule(cronExpression, async () => {
      // Only run during market hours for intraday strategies
      if (strategy.type === 'INTRADAY' && !this.isMarketHours) {
        logger.debug(`Skipping ${strategyKey} scan - market closed`);
        return;
      }

      try {
        await this.runScan(strategyKey, strategy);
      } catch (error) {
        logger.error(`Error running ${strategyKey} scan`, { error });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata', // IST timezone
    });

    this.scheduledJobs.set(strategyKey, job);
    logger.info(`Scheduled ${strategyKey}`, { interval: `${intervalMinutes} minutes` });
  }

  /**
   * Setup market hours checker
   */
  private setupMarketHoursChecker(): void {
    // NSE/BSE trading hours: 9:15 AM - 3:30 PM IST (Monday-Friday)
    cron.schedule('* * * * *', () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Check if it's a weekday (Monday-Friday)
      const isWeekday = day >= 1 && day <= 5;

      // Market hours: 9:15 AM to 3:30 PM
      const isWithinHours = (hour === 9 && minute >= 15) ||
                           (hour >= 10 && hour < 15) ||
                           (hour === 15 && minute <= 30);

      this.isMarketHours = isWeekday && isWithinHours;
    }, {
      timezone: 'Asia/Kolkata',
    });

    logger.info('Market hours checker setup complete');
  }

  /**
   * Setup result status updater to check for target/stoploss hits
   */
  private setupResultStatusUpdater(): void {
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.updateActiveResults();
      } catch (error) {
        logger.error('Error updating active results', { error });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata',
    });

    logger.info('Result status updater setup complete');
  }

  /**
   * Run scan for a specific strategy
   */
  private async runScan(strategyKey: string, strategy: any): Promise<void> {
    const scanId = uuidv4();
    const startTime = Date.now();

    logger.info(`Starting auto-scan for ${strategyKey}`, { scanId });

    try {
      const config = databaseService.getOrCreateAutoScanConfig(strategyKey);

      // Update last scan time
      databaseService.updateAutoScanConfig(strategyKey, {
        lastScanTime: new Date(),
        nextScanTime: new Date(Date.now() + config.scanInterval * 60 * 1000),
      });

      // Build screener criteria from strategy
      const screenerCriteria = this.buildScreenerCriteria(strategy);

      // Run the screener
      const markets = JSON.parse(config.markets);
      const results = await runScreener({
        markets,
        ...screenerCriteria,
        limit: config.maxResultsPerScan,
      });

      // Filter by confidence score
      const filteredResults = results.filter(r => r.overallScore >= config.minConfidenceScore);

      logger.info(`${strategyKey} scan completed`, {
        scanId,
        totalResults: results.length,
        filteredResults: filteredResults.length,
        duration: Date.now() - startTime,
      });

      // Store results in database
      for (const result of filteredResults) {
        const scanResult: ScanResult = {
          scanId,
          timestamp: new Date(),
          strategy: strategy.name,
          strategyType: strategy.type,
          symbol: result.symbol,
          exchange: result.exchange,
          companyName: result.companyName || result.symbol,
          currentPrice: result.currentPrice,
          entryPrice: result.recommendation.entry,
          stopLoss: result.recommendation.stopLoss,
          target: result.recommendation.target,
          riskRewardRatio: result.recommendation.riskReward,
          confidenceScore: result.overallScore,
          signals: JSON.stringify(result.signals),
          technicalData: JSON.stringify({
            rsi: result.technicalAnalysis.rsi,
            macd: result.technicalAnalysis.macd,
            adx: result.technicalAnalysis.adx,
            ema: result.technicalAnalysis.ema,
            volume: result.technicalAnalysis.volume,
          }),
          fundamentalData: result.fundamentalAnalysis ? JSON.stringify(result.fundamentalAnalysis) : '{}',
          evidenceChartData: JSON.stringify(this.buildEvidenceChartData(result)),
          status: 'ACTIVE',
        };

        const resultId = databaseService.insertScanResult(scanResult);

        // Create alert for high-confidence signals
        if (scanResult.confidenceScore >= 80) {
          const alert: Alert = {
            timestamp: new Date(),
            symbol: scanResult.symbol,
            exchange: scanResult.exchange,
            strategy: scanResult.strategy,
            alertType: 'NEW_SIGNAL',
            message: `🔥 High-confidence ${strategy.type} signal for ${scanResult.symbol} (Score: ${scanResult.confidenceScore})`,
            priority: 'HIGH',
            read: false,
            scanResultId: resultId,
          };

          databaseService.insertAlert(alert);
        }
      }

    } catch (error) {
      logger.error(`Failed to run ${strategyKey} scan`, { error, scanId });
    }
  }

  /**
   * Build screener criteria from strategy config
   */
  private buildScreenerCriteria(strategy: any): any {
    const criteria: any = {};

    if (strategy.criteria.rsiMin !== undefined) criteria.rsiMin = strategy.criteria.rsiMin;
    if (strategy.criteria.rsiMax !== undefined) criteria.rsiMax = strategy.criteria.rsiMax;
    if (strategy.criteria.volumeMultiplier !== undefined) criteria.volumeMultiplier = strategy.criteria.volumeMultiplier;
    if (strategy.criteria.adxMin !== undefined) criteria.adxMin = strategy.criteria.adxMin;
    if (strategy.criteria.priceAboveEMA20 !== undefined) criteria.priceAboveEMA20 = strategy.criteria.priceAboveEMA20;
    if (strategy.criteria.priceAboveEMA50 !== undefined) criteria.priceAboveEMA50 = strategy.criteria.priceAboveEMA50;
    if (strategy.criteria.macdBullish !== undefined) criteria.macdBullish = strategy.criteria.macdBullish;
    if (strategy.criteria.emaAlignment !== undefined) criteria.emaAlignment = strategy.criteria.emaAlignment;

    return criteria;
  }

  /**
   * Build evidence chart data for visualization
   */
  private buildEvidenceChartData(result: any): any {
    return {
      symbol: result.symbol,
      currentPrice: result.currentPrice,
      historicalPrices: result.historicalData?.map((d: any) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      })) || [],
      indicators: {
        ema9: result.technicalAnalysis.ema?.ema9,
        ema20: result.technicalAnalysis.ema?.ema20,
        ema50: result.technicalAnalysis.ema?.ema50,
        ema200: result.technicalAnalysis.ema?.ema200,
        rsi: result.technicalAnalysis.rsi?.value,
        macd: result.technicalAnalysis.macd,
        bollingerBands: result.technicalAnalysis.bollingerBands,
      },
      levels: {
        entry: result.recommendation.entry,
        stopLoss: result.recommendation.stopLoss,
        target: result.recommendation.target,
      },
    };
  }

  /**
   * Update active results to check for target/stoploss hits
   */
  private async updateActiveResults(): Promise<void> {
    const activeResults = databaseService.getActiveScanResults();

    for (const result of activeResults) {
      try {
        // Get current price
        const quote = await getQuote(result.symbol, result.exchange);
        if (!quote) continue;

        const currentPrice = quote.currentPrice;

        // Check if target hit
        if (currentPrice >= result.target) {
          const profitLoss = ((currentPrice - result.entryPrice) / result.entryPrice) * 100;

          databaseService.updateScanResultStatus(
            result.id!,
            'HIT_TARGET',
            'WIN',
            currentPrice,
            profitLoss,
            'Target hit automatically'
          );

          // Create alert
          databaseService.insertAlert({
            timestamp: new Date(),
            symbol: result.symbol,
            exchange: result.exchange,
            strategy: result.strategy,
            alertType: 'TARGET_HIT',
            message: `✅ Target HIT for ${result.symbol}! Entry: ${result.entryPrice}, Exit: ${currentPrice}, Profit: +${profitLoss.toFixed(2)}%`,
            priority: 'HIGH',
            read: false,
            scanResultId: result.id,
          });

          logger.info(`Target hit for ${result.symbol}`, { profitLoss });
        }
        // Check if stoploss hit
        else if (currentPrice <= result.stopLoss) {
          const profitLoss = ((currentPrice - result.entryPrice) / result.entryPrice) * 100;

          databaseService.updateScanResultStatus(
            result.id!,
            'HIT_STOPLOSS',
            'LOSS',
            currentPrice,
            profitLoss,
            'Stop loss hit automatically'
          );

          // Create alert
          databaseService.insertAlert({
            timestamp: new Date(),
            symbol: result.symbol,
            exchange: result.exchange,
            strategy: result.strategy,
            alertType: 'STOPLOSS_HIT',
            message: `⛔ STOP LOSS hit for ${result.symbol}! Entry: ${result.entryPrice}, Exit: ${currentPrice}, Loss: ${profitLoss.toFixed(2)}%`,
            priority: 'HIGH',
            read: false,
            scanResultId: result.id,
          });

          logger.info(`Stop loss hit for ${result.symbol}`, { profitLoss });
        }
      } catch (error) {
        logger.error(`Error updating status for ${result.symbol}`, { error });
      }
    }
  }

  /**
   * Run all enabled scans immediately
   */
  async runAllEnabledScans(): Promise<void> {
    logger.info('Running initial scan for all enabled strategies...');

    const promises: Promise<void>[] = [];

    // Run intraday strategies
    for (const [key, strategy] of Object.entries(INTRADAY_STRATEGIES)) {
      if (strategy.enabled) {
        promises.push(this.runScan(`INTRADAY_${key}`, strategy));
      }
    }

    // Run swing strategies
    for (const [key, strategy] of Object.entries(SWING_STRATEGIES)) {
      if (strategy.enabled) {
        promises.push(this.runScan(`SWING_${key}`, strategy));
      }
    }

    await Promise.allSettled(promises);
    logger.info('Initial scan completed for all strategies');
  }

  /**
   * Get current auto-scan status
   */
  getStatus(): any {
    return {
      initialized: this.initialized,
      isMarketHours: this.isMarketHours,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      intradayStrategies: Object.entries(INTRADAY_STRATEGIES).map(([key, strategy]) => ({
        key: `INTRADAY_${key}`,
        name: strategy.name,
        enabled: strategy.enabled,
        scanInterval: strategy.scanInterval,
      })),
      swingStrategies: Object.entries(SWING_STRATEGIES).map(([key, strategy]) => ({
        key: `SWING_${key}`,
        name: strategy.name,
        enabled: strategy.enabled,
        scanInterval: strategy.scanInterval,
      })),
    };
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    for (const [key, job] of this.scheduledJobs) {
      job.stop();
      logger.info(`Stopped scheduled job: ${key}`);
    }
    this.scheduledJobs.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const autoScanService = new AutoScanService();
