/**
 * Auto-Scan Service - Automated periodic stock scanning
 * Runs pre-configured strategies and stores results in database
 */

import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { databaseService, ScanResult, Alert } from './databaseService';
import { loggerService } from './loggerService';
import { screenerService } from './screenerService';
import { marketDataService } from './marketDataService';

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
      loggerService.info('AutoScanService already initialized');
      return;
    }

    try {
      loggerService.info('Initializing AutoScanService...');

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
      loggerService.info('AutoScanService initialized successfully', {
        intradayStrategies: Object.keys(INTRADAY_STRATEGIES).filter(k => INTRADAY_STRATEGIES[k as keyof typeof INTRADAY_STRATEGIES].enabled).length,
        swingStrategies: Object.keys(SWING_STRATEGIES).filter(k => SWING_STRATEGIES[k as keyof typeof SWING_STRATEGIES].enabled).length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      loggerService.error('Failed to initialize AutoScanService', {
        error: errorMessage,
        stack: errorStack
      });
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
        loggerService.debug(`Skipping ${strategyKey} scan - market closed`);
        return;
      }

      try {
        await this.runScan(strategyKey, strategy);
      } catch (error) {
        loggerService.error(`Error running ${strategyKey} scan`, { error });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata', // IST timezone
    });

    this.scheduledJobs.set(strategyKey, job);
    loggerService.info(`Scheduled ${strategyKey}`, { interval: `${intervalMinutes} minutes` });
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

    loggerService.info('Market hours checker setup complete');
  }

  /**
   * Setup result status updater to check for target/stoploss hits
   */
  private setupResultStatusUpdater(): void {
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.updateActiveResults();
      } catch (error) {
        loggerService.error('Error updating active results', { error });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata',
    });

    loggerService.info('Result status updater setup complete');
  }

  /**
   * Run scan for a specific strategy
   */
  private async runScan(strategyKey: string, strategy: any): Promise<void> {
    const scanId = uuidv4();
    const startTime = Date.now();

    loggerService.info(`Starting auto-scan for ${strategyKey}`, { scanId });

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
      const results = await screenerService.runScreener({
        markets,
        ...screenerCriteria,
        limit: config.maxResultsPerScan,
      });

      // Filter by confidence score (use combinedScore or score)
      const filteredResults = results.filter(r => {
        const score = r.combinedScore || r.score || 0;
        return score >= config.minConfidenceScore;
      });

      loggerService.info(`${strategyKey} scan completed`, {
        scanId,
        totalResults: results.length,
        filteredResults: filteredResults.length,
        duration: Date.now() - startTime,
      });

      // Store results in database
      for (const result of filteredResults) {
        const confidenceScore = result.combinedScore || result.score || 0;

        const scanResult: ScanResult = {
          scanId,
          timestamp: new Date(),
          strategy: strategy.name,
          strategyType: strategy.type,
          symbol: result.symbol,
          exchange: result.exchange,
          companyName: result.name || result.symbol,
          currentPrice: result.price,
          entryPrice: result.riskReward?.entryPrice || result.price,
          stopLoss: result.riskReward?.stopLoss || result.price * 0.98,
          target: result.riskReward?.target || result.price * 1.02,
          riskRewardRatio: result.riskReward?.ratio || 1,
          confidenceScore,
          signals: JSON.stringify(result.signals || []),
          technicalData: JSON.stringify({
            rsi: result.indicators?.rsi,
            macd: result.indicators?.macd,
            adx: result.indicators?.adx,
            ema: result.indicators?.ema,
            volume: result.volume,
          }),
          fundamentalData: result.fundamentals ? JSON.stringify(result.fundamentals) : '{}',
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      loggerService.error(`Failed to run ${strategyKey} scan`, {
        error: errorMessage,
        stack: errorStack,
        scanId
      });
      console.error(`❌ ${strategyKey} scan error:`, error);
    }
  }

  /**
   * Build screener criteria from strategy config
   */
  private buildScreenerCriteria(strategy: any): any {
    const criteria: any = {
      technicalFilters: {},
      fundamentalFilters: {},
    };

    // Build technical filters with proper nesting
    if (strategy.criteria.rsiMin !== undefined || strategy.criteria.rsiMax !== undefined) {
      criteria.technicalFilters.rsiRange = {
        min: strategy.criteria.rsiMin,
        max: strategy.criteria.rsiMax,
      };
    }

    if (strategy.criteria.volumeMultiplier !== undefined) {
      criteria.technicalFilters.volumeBreakout = true;
    }

    if (strategy.criteria.adxMin !== undefined) {
      criteria.technicalFilters.adxMin = strategy.criteria.adxMin;
    }

    if (strategy.criteria.priceAboveEMA20 === true) {
      criteria.technicalFilters.priceAboveEMA = criteria.technicalFilters.priceAboveEMA || [];
      criteria.technicalFilters.priceAboveEMA.push(20);
    }

    if (strategy.criteria.priceAboveEMA50 === true) {
      criteria.technicalFilters.priceAboveEMA = criteria.technicalFilters.priceAboveEMA || [];
      criteria.technicalFilters.priceAboveEMA.push(50);
    }

    if (strategy.criteria.priceAboveAllEMAs === true) {
      criteria.technicalFilters.priceAboveEMA = [9, 20, 50, 200];
    }

    if (strategy.criteria.macdBullish === true || strategy.criteria.macdBullishCrossover === true) {
      criteria.technicalFilters.macdCrossover = 'bullish';
    }

    if (strategy.criteria.emaAlignment === true) {
      criteria.technicalFilters.priceAboveEMA = [9, 20, 50];
    }

    // Add fundamental filters if specified
    if (strategy.criteria.fundamentalsGood === true) {
      criteria.fundamentalFilters.peRatioMax = 30;
      criteria.fundamentalFilters.profitMarginMin = 10;
    }

    return criteria;
  }

  /**
   * Build evidence chart data for visualization
   */
  private buildEvidenceChartData(result: any): any {
    return {
      symbol: result.symbol,
      currentPrice: result.price,
      historicalPrices: result.historicalData?.map((d: any) => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      })) || [],
      indicators: {
        ema9: result.indicators?.ema?.ema9,
        ema20: result.indicators?.ema?.ema20,
        ema50: result.indicators?.ema?.ema50,
        ema200: result.indicators?.ema?.ema200,
        rsi: result.indicators?.rsi,
        macd: result.indicators?.macd,
        bollingerBands: result.indicators?.bollingerBands,
      },
      levels: {
        entry: result.riskReward?.entryPrice || result.price,
        stopLoss: result.riskReward?.stopLoss || result.price * 0.98,
        target: result.riskReward?.target || result.price * 1.02,
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
        const quote = await marketDataService.getQuote(result.symbol, result.exchange);
        if (!quote) continue;

        const currentPrice = quote.price;

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

          loggerService.info(`Target hit for ${result.symbol}`, { profitLoss });
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

          loggerService.info(`Stop loss hit for ${result.symbol}`, { profitLoss });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        loggerService.error(`Error updating status for ${result.symbol}`, {
          error: errorMessage,
          symbol: result.symbol,
          exchange: result.exchange
        });
      }
    }
  }

  /**
   * Run all enabled scans immediately
   */
  async runAllEnabledScans(): Promise<void> {
    loggerService.info('Running initial scan for all enabled strategies...');

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
    loggerService.info('Initial scan completed for all strategies');
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
      loggerService.info(`Stopped scheduled job: ${key}`);
    }
    this.scheduledJobs.clear();
    this.initialized = false;
  }
}

// Export singleton instance
export const autoScanService = new AutoScanService();
