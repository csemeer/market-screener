/**
 * Live Monitoring Service - Real-time watchlist monitoring during market hours
 * Monitors watchlist stocks, detects entry signals, and manages position tracking
 */

import { databaseService } from './databaseService';
import { loggerService } from './loggerService';
import { marketDataService } from './marketDataService';
import { isWithinMarketHours, Exchange } from '../utils/marketUtils';
import * as cron from 'node-cron';

interface MonitoringConfig {
  updateInterval: number; // seconds
  alertOnTrigger: boolean;
  autoUpdateStatus: boolean;
  minimumVolume: number; // Minimum volume for trigger confirmation
}

interface EntrySignal {
  stockId: number;
  symbol: string;
  exchange: Exchange;
  currentPrice: number;
  triggerPrice: number;
  volume: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  signals: string[];
}

class LiveMonitoringService {
  private monitoringActive: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: MonitoringConfig = {
    updateInterval: 30, // 30 seconds
    alertOnTrigger: true,
    autoUpdateStatus: true,
    minimumVolume: 100000,
  };

  /**
   * Initialize live monitoring service
   */
  async initialize(): Promise<void> {
    loggerService.info('Initializing Live Monitoring Service');

    // Schedule monitoring to run every minute during market hours
    cron.schedule('* * * * *', async () => {
      await this.checkMarketHoursAndMonitor();
    });

    loggerService.success('Live Monitoring Service initialized');
  }

  /**
   * Check if market is open and start/stop monitoring accordingly
   */
  private async checkMarketHoursAndMonitor(): Promise<void> {
    const exchanges: Exchange[] = ['NSE', 'BSE', 'NYSE', 'NASDAQ'];
    const now = new Date();

    // Check if any market is open
    const anyMarketOpen = exchanges.some(exchange =>
      isWithinMarketHours(exchange, now)
    );

    if (anyMarketOpen && !this.monitoringActive) {
      loggerService.info('Market hours detected - Starting live monitoring');
      await this.startMonitoring();
    } else if (!anyMarketOpen && this.monitoringActive) {
      loggerService.info('Market closed - Stopping live monitoring');
      this.stopMonitoring();
    }
  }

  /**
   * Start monitoring watchlist stocks
   */
  async startMonitoring(): Promise<void> {
    if (this.monitoringActive) {
      loggerService.warn('Monitoring already active');
      return;
    }

    this.monitoringActive = true;
    loggerService.success('Live monitoring started');

    // Start monitoring loop
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.monitorWatchlist();
      } catch (error) {
        loggerService.error('Error in monitoring loop', { error });
      }
    }, this.config.updateInterval * 1000);

    // Run immediately
    await this.monitorWatchlist();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.monitoringActive = false;
    loggerService.info('Live monitoring stopped');
  }

  /**
   * Monitor today's watchlist stocks
   */
  private async monitorWatchlist(): Promise<void> {
    try {
      // Get all PENDING and TRIGGERED stocks from today's watchlist
      const pendingStocks = databaseService.getWatchlistStocksByStatus('PENDING');
      const triggeredStocks = databaseService.getWatchlistStocksByStatus('TRIGGERED');

      const stocksToMonitor = [...pendingStocks, ...triggeredStocks];

      if (stocksToMonitor.length === 0) {
        loggerService.debug('No stocks to monitor');
        return;
      }

      loggerService.info(`Monitoring ${stocksToMonitor.length} stocks`);

      // Monitor each stock
      for (const stock of stocksToMonitor) {
        await this.monitorStock(stock);
      }
    } catch (error) {
      loggerService.error('Error monitoring watchlist', { error });
    }
  }

  /**
   * Monitor individual stock for entry signals
   */
  private async monitorStock(stock: any): Promise<void> {
    try {
      // Fetch current price
      const quote = await marketDataService.getQuote(stock.symbol, stock.exchange);

      if (!quote || !quote.price) {
        return;
      }

      const currentPrice = quote.price;
      const volume = quote.volume || 0;

      // Check for entry trigger
      if (stock.status === 'PENDING' && stock.entry_trigger) {
        const signal = this.detectEntrySignal(stock, currentPrice, volume);

        if (signal) {
          await this.handleEntrySignal(signal);
        }
      }

      // Update triggered stocks
      if (stock.status === 'TRIGGERED') {
        await this.updateTriggeredStock(stock, currentPrice, volume);
      }
    } catch (error) {
      loggerService.debug(`Error monitoring ${stock.symbol}`, { error });
    }
  }

  /**
   * Detect entry signal based on setup type
   */
  private detectEntrySignal(
    stock: any,
    currentPrice: number,
    volume: number
  ): EntrySignal | null {
    const setupType = stock.setup_type;
    const entryTrigger = stock.entry_trigger;
    const signals: string[] = [];
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    // BREAKOUT: Price breaks above trigger
    if (setupType === 'BREAKOUT') {
      if (currentPrice >= entryTrigger) {
        signals.push('Price above trigger');

        // Check volume confirmation
        if (volume >= this.config.minimumVolume) {
          signals.push('High volume confirmation');
          confidence = 'HIGH';
        } else if (volume >= this.config.minimumVolume * 0.7) {
          signals.push('Moderate volume');
          confidence = 'MEDIUM';
        } else {
          signals.push('Low volume - weak signal');
        }

        // Check if price is within reasonable range (not a gap up beyond target)
        if (currentPrice <= stock.target_1 * 1.02) {
          signals.push('Price within reasonable range');
        } else {
          signals.push('WARNING: Price gapped up significantly');
          confidence = 'LOW';
        }

        return {
          stockId: stock.id,
          symbol: stock.symbol,
          exchange: stock.exchange,
          currentPrice,
          triggerPrice: entryTrigger,
          volume,
          confidence,
          signals,
        };
      }
    }

    // BREAKDOWN: Price breaks below trigger
    if (setupType === 'BREAKDOWN') {
      if (currentPrice <= entryTrigger) {
        signals.push('Price below trigger');

        if (volume >= this.config.minimumVolume) {
          signals.push('High volume confirmation');
          confidence = 'HIGH';
        } else if (volume >= this.config.minimumVolume * 0.7) {
          signals.push('Moderate volume');
          confidence = 'MEDIUM';
        }

        if (currentPrice >= stock.target_1 * 0.98) {
          signals.push('Price within reasonable range');
        } else {
          signals.push('WARNING: Price gapped down significantly');
          confidence = 'LOW';
        }

        return {
          stockId: stock.id,
          symbol: stock.symbol,
          exchange: stock.exchange,
          currentPrice,
          triggerPrice: entryTrigger,
          volume,
          confidence,
          signals,
        };
      }
    }

    // PULLBACK: Price reaches pullback zone
    if (setupType === 'PULLBACK') {
      const pullbackZoneLow = stock.entry_price * 0.98;
      const pullbackZoneHigh = stock.entry_price * 1.02;

      if (currentPrice >= pullbackZoneLow && currentPrice <= pullbackZoneHigh) {
        signals.push('Price in pullback zone');

        // For pullbacks, we want decreasing volume during pullback, then increasing on reversal
        if (volume < this.config.minimumVolume * 0.5) {
          signals.push('Volume decreased on pullback - good');
          confidence = 'MEDIUM';
        }

        // Check if price is holding above support (stop loss)
        if (currentPrice > stock.stop_loss * 1.005) {
          signals.push('Price holding above support');
          confidence = 'HIGH';
        }

        return {
          stockId: stock.id,
          symbol: stock.symbol,
          exchange: stock.exchange,
          currentPrice,
          triggerPrice: entryTrigger || stock.entry_price,
          volume,
          confidence,
          signals,
        };
      }
    }

    // REVERSAL: Check for reversal confirmation
    if (setupType === 'REVERSAL') {
      // For reversal, look for price moving away from extreme
      const reversalConfirmed = stock.entry_condition === 'BREAK_ABOVE'
        ? currentPrice >= entryTrigger
        : currentPrice <= entryTrigger;

      if (reversalConfirmed) {
        signals.push('Reversal confirmation detected');

        if (volume >= this.config.minimumVolume * 0.8) {
          signals.push('Volume supports reversal');
          confidence = 'HIGH';
        } else {
          confidence = 'MEDIUM';
        }

        return {
          stockId: stock.id,
          symbol: stock.symbol,
          exchange: stock.exchange,
          currentPrice,
          triggerPrice: entryTrigger,
          volume,
          confidence,
          signals,
        };
      }
    }

    // CONSOLIDATION: Breakout from consolidation
    if (setupType === 'CONSOLIDATION') {
      const breakoutConfirmed = stock.entry_condition === 'BREAK_ABOVE'
        ? currentPrice >= entryTrigger
        : currentPrice <= entryTrigger;

      if (breakoutConfirmed) {
        signals.push('Consolidation breakout');

        if (volume >= this.config.minimumVolume * 1.5) {
          signals.push('High volume breakout - strong signal');
          confidence = 'HIGH';
        } else if (volume >= this.config.minimumVolume) {
          signals.push('Good volume on breakout');
          confidence = 'MEDIUM';
        } else {
          signals.push('Low volume - wait for confirmation');
        }

        return {
          stockId: stock.id,
          symbol: stock.symbol,
          exchange: stock.exchange,
          currentPrice,
          triggerPrice: entryTrigger,
          volume,
          confidence,
          signals,
        };
      }
    }

    return null;
  }

  /**
   * Handle entry signal detection
   */
  private async handleEntrySignal(signal: EntrySignal): Promise<void> {
    loggerService.success(`Entry signal detected for ${signal.symbol}`, {
      confidence: signal.confidence,
      price: signal.currentPrice,
      signals: signal.signals,
    });

    // Update stock status to TRIGGERED
    if (this.config.autoUpdateStatus) {
      databaseService.updateWatchlistStockStatus(
        signal.stockId,
        'TRIGGERED',
        signal.currentPrice,
        new Date()
      );
    }

    // Create alert
    if (this.config.alertOnTrigger) {
      databaseService.insertAlert({
        timestamp: new Date(),
        symbol: signal.symbol,
        exchange: signal.exchange,
        strategy: 'EOD_WATCHLIST',
        alertType: 'NEW_SIGNAL',
        message: `${signal.symbol} entry triggered at ${signal.currentPrice.toFixed(2)} - Confidence: ${signal.confidence}. ${signal.signals.join(', ')}`,
        priority: signal.confidence === 'HIGH' ? 'HIGH' : 'MEDIUM',
        read: false,
      });
    }
  }

  /**
   * Update triggered stocks with current prices
   */
  private async updateTriggeredStock(
    stock: any,
    currentPrice: number,
    volume: number
  ): Promise<void> {
    // Check if price moved significantly away from trigger (invalidating the setup)
    const triggerPrice = stock.trigger_price || stock.entry_trigger;

    if (stock.setup_type === 'BREAKOUT' || stock.setup_type === 'CONSOLIDATION') {
      // If price fell back below trigger significantly, might want to cancel
      if (currentPrice < triggerPrice * 0.98) {
        loggerService.warn(`${stock.symbol} fell back below trigger - setup may be invalid`);

        databaseService.insertAlert({
          timestamp: new Date(),
          symbol: stock.symbol,
          exchange: stock.exchange,
          strategy: 'EOD_WATCHLIST',
          alertType: 'PRICE_ALERT',
          message: `${stock.symbol} fell back below trigger price. Setup may be invalid.`,
          priority: 'MEDIUM',
          read: false,
        });
      }
    }

    // Check if price hit target without being entered
    if (currentPrice >= stock.target_1) {
      loggerService.info(`${stock.symbol} hit target without entry - missed opportunity`);

      databaseService.insertAlert({
        timestamp: new Date(),
        symbol: stock.symbol,
        exchange: stock.exchange,
        strategy: 'EOD_WATCHLIST',
        alertType: 'TARGET_HIT',
        message: `${stock.symbol} hit target ${stock.target_1.toFixed(2)} without entry. Missed opportunity.`,
        priority: 'LOW',
        read: false,
      });

      // Expire the stock
      databaseService.updateWatchlistStockStatus(stock.id, 'EXPIRED');
    }

    // Check if price hit stop loss (invalidating setup)
    if (currentPrice <= stock.stop_loss) {
      loggerService.warn(`${stock.symbol} hit stop loss - setup invalid`);

      databaseService.insertAlert({
        timestamp: new Date(),
        symbol: stock.symbol,
        exchange: stock.exchange,
        strategy: 'EOD_WATCHLIST',
        alertType: 'STOPLOSS_HIT',
        message: `${stock.symbol} hit stop loss ${stock.stop_loss.toFixed(2)} before entry. Setup invalid.`,
        priority: 'MEDIUM',
        read: false,
      });

      // Cancel the stock
      databaseService.updateWatchlistStockStatus(stock.id, 'CANCELLED');
    }
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    active: boolean;
    updateInterval: number;
    config: MonitoringConfig;
  } {
    return {
      active: this.monitoringActive,
      updateInterval: this.config.updateInterval,
      config: this.config,
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    loggerService.info('Monitoring config updated', { config: this.config });

    // Restart monitoring if active to apply new interval
    if (this.monitoringActive && config.updateInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Manually monitor a specific stock (for testing)
   */
  async monitorStockManually(symbol: string, exchange: Exchange): Promise<any> {
    const stocks = databaseService.getWatchlistStocksByStatus('PENDING');
    const stock = stocks.find(s => s.symbol === symbol && s.exchange === exchange);

    if (!stock) {
      throw new Error(`Stock ${symbol} not found in PENDING status`);
    }

    await this.monitorStock(stock);

    return {
      symbol,
      exchange,
      status: 'Monitored',
    };
  }
}

export const liveMonitoringService = new LiveMonitoringService();
