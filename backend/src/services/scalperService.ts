/**
 * Scalper Service - Manages auto-scalping instances
 * Handles real-time data, signal generation, and trade execution
 */

import { EventEmitter } from 'events';
import { databaseService } from './databaseService';
import { BrokerService, Position } from './brokerService';
import { createBroker, getBrokerConfigFromDatabase } from './brokerFactory';
import { loggerService } from './loggerService';
import {
  ScalperConfig,
  ScalpingStock,
  ScalpTrade,
  TradingSignal,
  RealTimeCandle,
} from '../types/scalper';

interface ActiveScalper {
  id: number;
  config: ScalperConfig;
  broker: BrokerService;
  stocks: ScalpingStock[];
  openTrades: Map<string, ScalpTrade>;
  lastCandles: Map<string, RealTimeCandle[]>; // symbol -> candles
  dailyStats: {
    trades: number;
    pnl: number;
    wins: number;
    losses: number;
  };
  running: boolean;
  startTime?: Date;
}

class ScalperManagementService extends EventEmitter {
  private scalpers: Map<number, ActiveScalper> = new Map();
  private initialized: boolean = false;

  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      loggerService.info('ScalperService already initialized');
      return;
    }

    try {
      loggerService.info('Initializing Scalper Service...');

      // Load all enabled scalpers from database
      // For now, we'll start them manually via API

      this.initialized = true;
      loggerService.success('Scalper Service initialized successfully');
    } catch (error) {
      loggerService.error('Failed to initialize Scalper Service', { error });
      throw error;
    }
  }

  /**
   * Create a new scalper configuration
   */
  createScalperConfig(config: Partial<ScalperConfig>): number {
    if (!this.initialized) throw new Error('Scalper service not initialized');

    // Prepare config with defaults
    const scalperConfig: any = {
      name: config.name || 'New Scalper',
      enabled: config.enabled !== undefined ? config.enabled : false,
      broker: config.broker || 'zerodha',
      accountId: config.accountId || 'default',
      autoTrade: config.autoTrade !== undefined ? config.autoTrade : false,

      stockSelectionMethod: config.stockSelection?.method || 'MANUAL',
      stockSymbols: config.stockSelection?.symbols
        ? JSON.stringify(config.stockSelection.symbols)
        : null,
      screenerCriteria: config.stockSelection?.screenerCriteria
        ? JSON.stringify(config.stockSelection.screenerCriteria)
        : null,
      maxStocks: config.stockSelection?.maxStocks || 5,

      strategyId: config.strategy?.strategy_id || null,
      strategyName: config.strategy?.name || 'Breakout Scalper',
      timeframe: config.strategy?.timeframe || '5m',
      indicatorsConfig: JSON.stringify(config.strategy?.indicators || this.getDefaultIndicators()),
      entryConditions: JSON.stringify(config.strategy?.entryConditions || this.getDefaultEntryConditions()),
      exitConditions: JSON.stringify(config.strategy?.exitConditions || this.getDefaultExitConditions()),

      maxPositionSize: config.riskManagement?.maxPositionSize || 50000,
      maxPositionsOpen: config.riskManagement?.maxPositionsOpen || 3,
      maxDailyLoss: config.riskManagement?.maxDailyLoss || 5000,
      maxDailyTrades: config.riskManagement?.maxDailyTrades || 20,
      positionSizingMethod: config.riskManagement?.positionSizingMethod || 'FIXED',
      riskPerTrade: config.riskManagement?.riskPerTrade || 1.0,

      tradingStartTime: config.tradingHours?.startTime || '09:30',
      tradingEndTime: config.tradingHours?.endTime || '15:15',
      avoidFirstMinutes: config.tradingHours?.avoidFirstMinutes || 15,
      avoidLastMinutes: config.tradingHours?.avoidLastMinutes || 15,
    };

    // Insert into database
    const db = (databaseService as any).db;
    const stmt = db.prepare(`
      INSERT INTO scalper_configs (
        name, enabled, broker, account_id, auto_trade,
        stock_selection_method, stock_symbols, screener_criteria, max_stocks,
        strategy_id, strategy_name, timeframe, indicators_config, entry_conditions, exit_conditions,
        max_position_size, max_positions_open, max_daily_loss, max_daily_trades,
        position_sizing_method, risk_per_trade,
        trading_start_time, trading_end_time, avoid_first_minutes, avoid_last_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      scalperConfig.name,
      scalperConfig.enabled ? 1 : 0,
      scalperConfig.broker,
      scalperConfig.accountId,
      scalperConfig.autoTrade ? 1 : 0,
      scalperConfig.stockSelectionMethod,
      scalperConfig.stockSymbols,
      scalperConfig.screenerCriteria,
      scalperConfig.maxStocks,
      scalperConfig.strategyId,
      scalperConfig.strategyName,
      scalperConfig.timeframe,
      scalperConfig.indicatorsConfig,
      scalperConfig.entryConditions,
      scalperConfig.exitConditions,
      scalperConfig.maxPositionSize,
      scalperConfig.maxPositionsOpen,
      scalperConfig.maxDailyLoss,
      scalperConfig.maxDailyTrades,
      scalperConfig.positionSizingMethod,
      scalperConfig.riskPerTrade,
      scalperConfig.tradingStartTime,
      scalperConfig.tradingEndTime,
      scalperConfig.avoidFirstMinutes,
      scalperConfig.avoidLastMinutes
    );

    loggerService.info(`Scalper config created: ${scalperConfig.name}`, { id: result.lastInsertRowid });
    return result.lastInsertRowid as number;
  }

  /**
   * Get all scalper configurations
   */
  getAllScalperConfigs(): ScalperConfig[] {
    if (!this.initialized) throw new Error('Scalper service not initialized');

    const db = (databaseService as any).db;
    const rows = db.prepare('SELECT * FROM scalper_configs ORDER BY created_at DESC').all();

    return rows.map((row: any) => this.mapRowToConfig(row));
  }

  /**
   * Get a specific scalper configuration
   */
  getScalperConfig(id: number): ScalperConfig | null {
    if (!this.initialized) throw new Error('Scalper service not initialized');

    const db = (databaseService as any).db;
    const row = db.prepare('SELECT * FROM scalper_configs WHERE id = ?').get(id);

    return row ? this.mapRowToConfig(row) : null;
  }

  /**
   * Start a scalper instance
   */
  async startScalper(id: number): Promise<boolean> {
    if (!this.initialized) throw new Error('Scalper service not initialized');

    const config = this.getScalperConfig(id);
    if (!config) {
      throw new Error(`Scalper config not found: ${id}`);
    }

    if (this.scalpers.has(id)) {
      throw new Error(`Scalper already running: ${id}`);
    }

    try {
      // Create broker connection from database or paper trading
      let broker: BrokerService;
      let brokerConfig: any;

      if (config.accountId && config.accountId !== '' && config.broker !== 'zerodha' && config.broker !== 'upstox' && config.broker !== 'ibkr') {
        // This should not happen, but fall back to paper trading
        loggerService.warn(`Invalid broker configuration, using paper trading`, { scalperId: id, broker: config.broker });
        broker = createBroker({ broker: 'paper' });
        await broker.connect({
          broker: config.broker,
          apiKey: '',
          apiSecret: '',
        });
      } else if (config.accountId && config.accountId !== '') {
        // Load real broker from database (Zerodha/Upstox/IBKR)
        loggerService.info(`Loading broker account from database`, {
          scalperId: id,
          broker: config.broker,
          accountId: config.accountId,
        });

        broker = createBroker({
          broker: config.broker as 'zerodha' | 'upstox' | 'ibkr',
          accountId: config.accountId,
        });

        brokerConfig = getBrokerConfigFromDatabase(
          config.broker as 'zerodha' | 'upstox' | 'ibkr',
          parseInt(config.accountId)
        );

        await broker.connect(brokerConfig);
        loggerService.success(`Connected to ${config.broker} broker`, { scalperId: id });
      } else {
        // Paper trading mode
        loggerService.info(`Starting in paper trading mode`, { scalperId: id });
        broker = createBroker({ broker: 'paper' });
        await broker.connect({
          broker: config.broker,
          apiKey: '',
          apiSecret: '',
        });
      }

      // Load stocks for this scalper
      const stocks = this.getScalpingStocks(id);

      // Create active scalper instance
      const activeScalper: ActiveScalper = {
        id,
        config,
        broker,
        stocks,
        openTrades: new Map(),
        lastCandles: new Map(),
        dailyStats: {
          trades: 0,
          pnl: 0,
          wins: 0,
          losses: 0,
        },
        running: true,
        startTime: new Date(),
      };

      this.scalpers.set(id, activeScalper);

      // Subscribe to real-time data for all stocks
      if (stocks.length > 0) {
        await broker.subscribeToTicks(
          stocks.map(s => ({ symbol: s.symbol, exchange: s.exchange }))
        );
      }

      // Start monitoring loop
      this.startMonitoringLoop(id);

      loggerService.success(`Scalper started: ${config.name}`, { id, stocks: stocks.length });
      this.emit('scalper:started', { id, config });

      return true;
    } catch (error) {
      loggerService.error(`Failed to start scalper ${id}`, { error });
      this.scalpers.delete(id);
      throw error;
    }
  }

  /**
   * Stop a scalper instance
   */
  async stopScalper(id: number): Promise<boolean> {
    const scalper = this.scalpers.get(id);
    if (!scalper) {
      throw new Error(`Scalper not running: ${id}`);
    }

    try {
      scalper.running = false;

      // Unsubscribe from ticks
      if (scalper.stocks.length > 0) {
        await scalper.broker.unsubscribeFromTicks(
          scalper.stocks.map(s => ({ symbol: s.symbol, exchange: s.exchange }))
        );
      }

      // Disconnect broker
      await scalper.broker.disconnect();

      this.scalpers.delete(id);

      loggerService.success(`Scalper stopped: ${scalper.config.name}`, { id });
      this.emit('scalper:stopped', { id });

      return true;
    } catch (error) {
      loggerService.error(`Failed to stop scalper ${id}`, { error });
      throw error;
    }
  }

  /**
   * Emergency stop all scalpers and close all positions
   */
  async emergencyStopAll(): Promise<void> {
    loggerService.warn('🚨 EMERGENCY STOP TRIGGERED - Closing all positions');

    const promises = Array.from(this.scalpers.keys()).map(async id => {
      try {
        const scalper = this.scalpers.get(id);
        if (scalper) {
          // Close all open positions
          const positions = await scalper.broker.getPositions();
          for (const pos of positions) {
            await this.closePosition(id, pos);
          }
        }
        await this.stopScalper(id);
      } catch (error) {
        loggerService.error(`Failed to emergency stop scalper ${id}`, { error });
      }
    });

    await Promise.all(promises);
    loggerService.success('All scalpers stopped and positions closed');
  }

  /**
   * Get running scalper status
   */
  getScalperStatus(id: number): any {
    const scalper = this.scalpers.get(id);
    if (!scalper) {
      return {
        running: false,
        startTime: null,
        stocks: 0,
        openTrades: 0,
        dailyStats: {
          trades: 0,
          pnl: 0,
          wins: 0,
          losses: 0,
        },
      };
    }

    return {
      running: true,
      startTime: scalper.startTime,
      stocks: scalper.stocks.length,
      openTrades: scalper.openTrades.size,
      dailyStats: scalper.dailyStats,
    };
  }

  /**
   * Get open positions for a scalper
   */
  async getOpenPositions(id: number): Promise<Position[]> {
    const scalper = this.scalpers.get(id);
    if (!scalper) {
      return [];
    }

    return await scalper.broker.getPositions();
  }

  /**
   * Add stock to scalper
   */
  addStockToScalper(scalperId: number, symbol: string, exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): number {
    const db = (databaseService as any).db;
    const stmt = db.prepare(`
      INSERT INTO scalping_stocks (scalper_id, symbol, exchange, active)
      VALUES (?, ?, ?, 1)
    `);

    const result = stmt.run(scalperId, symbol, exchange);
    loggerService.info(`Stock added to scalper ${scalperId}: ${symbol}`, { id: result.lastInsertRowid });

    // If scalper is running, subscribe to ticks
    const scalper = this.scalpers.get(scalperId);
    if (scalper && scalper.running) {
      scalper.broker.subscribeToTicks([{ symbol, exchange }]);
      scalper.stocks.push({
        id: result.lastInsertRowid as number,
        scalperId,
        symbol,
        exchange,
        active: true,
        addedAt: new Date(),
        totalTrades: 0,
        winningTrades: 0,
        totalPnL: 0,
        winRate: 0,
      });
    }

    return result.lastInsertRowid as number;
  }

  /**
   * Get all stocks for a scalper (public method)
   */
  getScalperStocks(scalperId: number): ScalpingStock[] {
    return this.getScalpingStocks(scalperId);
  }

  /**
   * Remove a stock from scalper watchlist
   */
  removeStockFromScalper(scalperId: number, stockId: number): boolean {
    const db = (databaseService as any).db;

    const result = db
      .prepare('UPDATE scalping_stocks SET active = 0 WHERE id = ? AND scalper_id = ?')
      .run(stockId, scalperId);

    if (result.changes === 0) {
      throw new Error('Stock not found or already removed');
    }

    // If scalper is running, unsubscribe from ticks
    const scalper = this.scalpers.get(scalperId);
    if (scalper) {
      const stock = db.prepare('SELECT * FROM scalping_stocks WHERE id = ?').get(stockId) as any;
      if (stock) {
        scalper.broker.unsubscribeFromTicks([{ symbol: stock.symbol, exchange: stock.exchange }]);
        // Remove from stocks array
        scalper.stocks = scalper.stocks.filter(s => s.id !== stockId);
      }
    }

    return true;
  }

  /**
   * Get trade history for a scalper
   */
  getScalperTrades(scalperId: number, status?: 'OPEN' | 'CLOSED'): ScalpTrade[] {
    const db = (databaseService as any).db;

    let query = 'SELECT * FROM scalp_trades WHERE scalper_id = ?';
    const params: any[] = [scalperId];

    if (status) {
      if (status === 'OPEN') {
        query += ' AND status = ?';
        params.push('OPEN');
      } else if (status === 'CLOSED') {
        query += ' AND status = ?';
        params.push('CLOSED');
      }
    }

    query += ' ORDER BY entry_time DESC LIMIT 100';

    const rows = db.prepare(query).all(...params);

    return rows.map((row: any) => ({
      id: row.id,
      scalperId: row.scalper_id,
      symbol: row.symbol,
      exchange: row.exchange,
      side: row.side,
      quantity: row.quantity,
      entryPrice: row.entry_price,
      entryTime: new Date(row.entry_time),
      entryOrderId: row.entry_order_id,
      exitPrice: row.exit_price,
      exitTime: row.exit_time ? new Date(row.exit_time) : undefined,
      exitOrderId: row.exit_order_id,
      stopLoss: row.stop_loss,
      target: row.target,
      status: row.status,
      closeReason: row.close_reason,
      grossPnL: row.gross_pnl,
      netPnL: row.net_pnl,
      pnlPercent: row.pnl_percent,
      brokerage: row.brokerage,
      entrySignals: row.entry_signals,
      indicatorsData: row.indicators_data,
      chartData: row.chart_data,
      executionMode: row.execution_mode,
    }));
  }

  /**
   * Get stocks for a scalper
   */
  private getScalpingStocks(scalperId: number): ScalpingStock[] {
    const db = (databaseService as any).db;
    const rows = db
      .prepare('SELECT * FROM scalping_stocks WHERE scalper_id = ? AND active = 1')
      .all(scalperId);

    return rows.map((row: any) => ({
      id: row.id,
      scalperId: row.scalper_id,
      symbol: row.symbol,
      exchange: row.exchange,
      active: Boolean(row.active),
      addedAt: new Date(row.added_at),
      lastTradeAt: row.last_trade_at ? new Date(row.last_trade_at) : undefined,
      totalTrades: row.total_trades,
      winningTrades: row.winning_trades,
      totalPnL: row.total_pnl,
      winRate: row.win_rate,
    }));
  }

  /**
   * Start monitoring loop for a scalper
   */
  private startMonitoringLoop(id: number): void {
    const scalper = this.scalpers.get(id);
    if (!scalper) return;

    // Monitor every second (in production, sync with broker ticks)
    const monitorInterval = setInterval(async () => {
      if (!scalper.running) {
        clearInterval(monitorInterval);
        return;
      }

      try {
        await this.checkOpenPositions(id);
        // In production: process new candles, generate signals, check entries
      } catch (error) {
        loggerService.error(`Error in monitoring loop for scalper ${id}`, { error });
      }
    }, 1000);
  }

  /**
   * Check open positions for stop-loss or target hits
   */
  private async checkOpenPositions(id: number): Promise<void> {
    const scalper = this.scalpers.get(id);
    if (!scalper) return;

    const positions = await scalper.broker.getPositions();

    for (const pos of positions) {
      const tradeKey = `${pos.symbol}_${pos.exchange}`;
      const trade = scalper.openTrades.get(tradeKey);

      if (trade && trade.status === 'OPEN') {
        // Check stop-loss
        if (pos.lastPrice <= trade.stopLoss) {
          await this.exitTrade(id, trade, 'STOP_LOSS', pos.lastPrice);
        }
        // Check target
        else if (pos.lastPrice >= trade.target) {
          await this.exitTrade(id, trade, 'TARGET_HIT', pos.lastPrice);
        }
      }
    }
  }

  /**
   * Close a position manually
   */
  private async closePosition(id: number, position: Position): Promise<void> {
    const scalper = this.scalpers.get(id);
    if (!scalper) return;

    await scalper.broker.placeOrder({
      symbol: position.symbol,
      exchange: position.exchange,
      side: position.quantity > 0 ? 'SELL' : 'BUY',
      quantity: Math.abs(position.quantity),
      orderType: 'MARKET',
      product: 'MIS',
      validity: 'DAY',
    });

    loggerService.info(`Position closed manually: ${position.symbol}`, { id });
  }

  /**
   * Exit a trade
   */
  private async exitTrade(
    scalperId: number,
    trade: ScalpTrade,
    reason: 'TARGET_HIT' | 'STOP_LOSS' | 'TIME_EXIT' | 'MANUAL',
    exitPrice: number
  ): Promise<void> {
    const scalper = this.scalpers.get(scalperId);
    if (!scalper) return;

    try {
      // Place exit order
      const order = await scalper.broker.placeOrder({
        symbol: trade.symbol,
        exchange: trade.exchange,
        side: trade.side === 'BUY' ? 'SELL' : 'BUY',
        quantity: trade.quantity,
        orderType: 'MARKET',
        product: 'MIS',
        validity: 'DAY',
      });

      // Calculate P&L
      const grossPnL =
        trade.side === 'BUY'
          ? (exitPrice - trade.entryPrice) * trade.quantity
          : (trade.entryPrice - exitPrice) * trade.quantity;
      const brokerage = 20; // Simplified - calculate actual brokerage
      const netPnL = grossPnL - brokerage;
      const pnLPercent = (grossPnL / (trade.entryPrice * trade.quantity)) * 100;

      // Update trade in database
      const db = (databaseService as any).db;
      db.prepare(`
        UPDATE scalp_trades
        SET status = 'CLOSED', close_reason = ?, exit_price = ?, exit_time = ?, exit_order_id = ?,
            gross_pnl = ?, net_pnl = ?, pnl_percent = ?, brokerage = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason, exitPrice, new Date().toISOString(), order.orderId, grossPnL, netPnL, pnLPercent, brokerage, trade.id);

      // Update daily stats
      scalper.dailyStats.pnl += netPnL;
      if (netPnL > 0) {
        scalper.dailyStats.wins++;
      } else {
        scalper.dailyStats.losses++;
      }

      // Remove from open trades
      const tradeKey = `${trade.symbol}_${trade.exchange}`;
      scalper.openTrades.delete(tradeKey);

      loggerService.success(`Trade closed: ${trade.symbol} - ${reason}`, {
        pnl: netPnL.toFixed(2),
        pnlPercent: pnLPercent.toFixed(2),
      });

      this.emit('trade:closed', { scalperId, trade, reason, pnl: netPnL });
    } catch (error) {
      loggerService.error(`Failed to exit trade for ${trade.symbol}`, { error });
    }
  }

  /**
   * Map database row to ScalperConfig
   */
  private mapRowToConfig(row: any): ScalperConfig {
    return {
      id: row.id,
      name: row.name,
      enabled: Boolean(row.enabled),
      broker: row.broker,
      accountId: row.account_id,
      autoTrade: Boolean(row.auto_trade),
      stockSelection: {
        method: row.stock_selection_method,
        symbols: row.stock_symbols ? JSON.parse(row.stock_symbols) : undefined,
        screenerCriteria: row.screener_criteria ? JSON.parse(row.screener_criteria) : undefined,
        maxStocks: row.max_stocks,
      },
      strategy: {
        name: row.strategy_name,
        timeframe: row.timeframe,
        indicators: JSON.parse(row.indicators_config),
        entryConditions: JSON.parse(row.entry_conditions),
        exitConditions: JSON.parse(row.exit_conditions),
      },
      riskManagement: {
        maxPositionSize: row.max_position_size,
        maxPositionsOpen: row.max_positions_open,
        maxDailyLoss: row.max_daily_loss,
        maxDailyTrades: row.max_daily_trades,
        positionSizingMethod: row.position_sizing_method,
        riskPerTrade: row.risk_per_trade,
      },
      tradingHours: {
        startTime: row.trading_start_time,
        endTime: row.trading_end_time,
        avoidFirstMinutes: row.avoid_first_minutes,
        avoidLastMinutes: row.avoid_last_minutes,
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private getDefaultIndicators() {
    return {
      useEMA: true,
      emaFast: 9,
      emaSlow: 21,
      useRSI: true,
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      useMACD: false,
      useBollinger: false,
      bollingerPeriod: 20,
      bollingerStdDev: 2,
      useVWAP: true,
      useSupRes: false,
    };
  }

  private getDefaultEntryConditions() {
    return {
      type: 'BREAKOUT',
      volumeConfirmation: true,
      minVolumeMultiplier: 1.5,
      requireMultipleSignals: false,
      minSignals: 2,
    };
  }

  private getDefaultExitConditions() {
    return {
      targetPercent: 0.7,
      stopLossPercent: 0.3,
      useTrailingStop: false,
      trailingStopPercent: 0.2,
      maxHoldTimeMinutes: 30,
    };
  }
}

export const scalperService = new ScalperManagementService();
