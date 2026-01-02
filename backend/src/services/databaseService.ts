/**
 * Database Service - SQLite database management for auto-scan results
 * Stores scan results, alerts, and performance tracking
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { loggerService } from './loggerService';

export interface ScanResult {
  id?: number;
  scanId: string;
  timestamp: Date;
  strategy: string;
  strategyType: 'INTRADAY' | 'SWING' | 'LONG_TERM';
  symbol: string;
  exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ';
  companyName: string;
  currency: 'USD' | 'INR'; // Currency for price values
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskRewardRatio: number;
  confidenceScore: number;
  signals: string; // JSON string of signals
  technicalData: string; // JSON string of technical indicators
  fundamentalData: string; // JSON string of fundamentals
  evidenceChartData: string; // JSON string for chart plotting
  status: 'ACTIVE' | 'HIT_TARGET' | 'HIT_STOPLOSS' | 'EXPIRED' | 'MANUAL_EXIT';
  outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'PENDING';
  profitLoss?: number;
  exitPrice?: number;
  exitDate?: Date;
  notes?: string;
}

export interface Alert {
  id?: number;
  timestamp: Date;
  symbol: string;
  exchange: string;
  strategy: string;
  alertType: 'NEW_SIGNAL' | 'TARGET_HIT' | 'STOPLOSS_HIT' | 'PRICE_ALERT';
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  read: boolean;
  scanResultId?: number;
}

export interface AutoScanConfig {
  id?: number;
  strategy: string;
  enabled: boolean;
  scanInterval: number; // minutes
  lastScanTime?: Date;
  nextScanTime?: Date;
  markets: string; // JSON array of markets to scan
  minConfidenceScore: number;
  maxResultsPerScan: number;
}

export interface NotificationSettings {
  id?: number;
  userId: string;
  emailEnabled: boolean;
  emailAddress?: string;
  smsEnabled: boolean;
  smsNumber?: string;
  whatsappEnabled: boolean;
  whatsappNumber?: string;
  telegramEnabled: boolean;
  telegramChatId?: string;
  webhookEnabled: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  alertTypes: string; // JSON array
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NotificationLog {
  id?: number;
  alertId: number;
  channel: 'email' | 'sms' | 'whatsapp' | 'telegram' | 'webhook';
  recipient: string;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  errorMessage?: string;
  sentAt?: Date;
  createdAt?: Date;
}

export interface BrokerAccount {
  id?: number;
  userId: string;
  broker: 'upstox' | 'zerodha' | 'ibkr' | 'paper';
  accountId: string;
  name?: string; // Optional friendly name
  status?: 'connected' | 'disconnected' | 'expired'; // Connection status
  credentials: string; // Encrypted JSON
  isActive: boolean;
  autoTradeEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BrokerOrder {
  id?: number;
  watchlistStockId?: number;
  brokerAccountId: number;
  broker: string;
  brokerOrderId?: string;
  symbol: string;
  exchange: string;
  orderType: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  triggerPrice?: number;
  status: 'PENDING' | 'OPEN' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  filledQuantity: number;
  averagePrice?: number;
  orderTimestamp?: Date;
  executionTimestamp?: Date;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BrokerPosition {
  id?: number;
  brokerAccountId: number;
  symbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  lastUpdated?: Date;
}

export interface CustomWatchlist {
  id?: number;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomWatchlistStock {
  id?: number;
  watchlistId: number;
  symbol: string;
  exchange: string;
  companyName?: string;

  // Phase 4A: Source tracking (Unified Watchlist)
  source?: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';
  sourceId?: number;  // Foreign key to scan_results.id if AUTO_SCAN
  sourceMetadata?: string;  // JSON: { confidence: 85, strategy: "Momentum Breakout", riskReward: 2.5 }

  setupType?: 'BREAKOUT' | 'BREAKDOWN' | 'PULLBACK' | 'REVERSAL' | 'CONSOLIDATION' | 'CUSTOM';
  timeframe?: 'INTRADAY' | 'SWING' | 'POSITIONAL';
  entryPrice: number;
  entryTrigger?: number;
  stopLoss: number;
  target1: number;
  target2?: number;
  target3?: number;
  trailingStopPercent?: number;
  positionSizePercent?: number;
  notes?: string;
  status: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED';
  triggerPrice?: number;
  triggerTime?: Date;
  addedAt?: Date;
  updatedAt?: Date;
}

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;
  private initialized: boolean = false;

  constructor() {
    // Store database in backend/data directory
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'autoscan.db');
  }

  /**
   * Initialize database and create tables
   */
  initialize(): void {
    if (this.initialized) {
      loggerService.info('Database already initialized');
      return;
    }

    try {
      loggerService.info(`Initializing database at: ${this.dbPath}`);
      this.db = new Database(this.dbPath);

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      this.createTables();
      this.runMigrations();
      this.initialized = true;
      loggerService.info('Database initialized successfully');
    } catch (error) {
      loggerService.error('Failed to initialize database', { error });
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized');

    // Scan Results Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scan_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_id TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        strategy TEXT NOT NULL,
        strategy_type TEXT NOT NULL CHECK(strategy_type IN ('INTRADAY', 'SWING', 'LONG_TERM')),
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL,
        company_name TEXT,
        currency TEXT NOT NULL DEFAULT 'INR' CHECK(currency IN ('USD', 'INR')),
        current_price REAL NOT NULL,
        entry_price REAL NOT NULL,
        stop_loss REAL NOT NULL,
        target REAL NOT NULL,
        risk_reward_ratio REAL NOT NULL,
        confidence_score REAL NOT NULL,
        signals TEXT NOT NULL,
        technical_data TEXT NOT NULL,
        fundamental_data TEXT,
        evidence_chart_data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'HIT_TARGET', 'HIT_STOPLOSS', 'EXPIRED', 'MANUAL_EXIT')),
        outcome TEXT CHECK(outcome IN ('WIN', 'LOSS', 'BREAKEVEN', 'PENDING')),
        profit_loss REAL,
        exit_price REAL,
        exit_date DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scan_results_symbol ON scan_results(symbol);
      CREATE INDEX IF NOT EXISTS idx_scan_results_strategy ON scan_results(strategy);
      CREATE INDEX IF NOT EXISTS idx_scan_results_timestamp ON scan_results(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_scan_results_status ON scan_results(status);
      CREATE INDEX IF NOT EXISTS idx_scan_results_scan_id ON scan_results(scan_id);
    `);

    // Alerts Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL,
        strategy TEXT NOT NULL,
        alert_type TEXT NOT NULL CHECK(alert_type IN ('NEW_SIGNAL', 'TARGET_HIT', 'STOPLOSS_HIT', 'PRICE_ALERT')),
        message TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')),
        read BOOLEAN NOT NULL DEFAULT 0,
        scan_result_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (scan_result_id) REFERENCES scan_results(id)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
      CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);
    `);

    // Watchlists Table - Daily EOD watchlists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL UNIQUE,
        exchange TEXT NOT NULL,
        scan_timestamp DATETIME NOT NULL,
        total_stocks_analyzed INTEGER NOT NULL DEFAULT 0,
        stocks_selected INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Watchlist Stocks - Individual stocks in watchlist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS watchlist_stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watchlist_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        company_name TEXT,
        exchange TEXT NOT NULL,
        currency TEXT NOT NULL CHECK(currency IN ('USD', 'INR')),

        -- Analysis Data
        setup_type TEXT NOT NULL CHECK(setup_type IN ('BREAKOUT', 'BREAKDOWN', 'PULLBACK', 'REVERSAL', 'CONSOLIDATION')),
        timeframe TEXT NOT NULL CHECK(timeframe IN ('INTRADAY', 'SWING', 'POSITIONAL')),
        score REAL NOT NULL CHECK(score >= 0 AND score <= 100),

        -- Entry Levels
        entry_price REAL NOT NULL,
        entry_trigger REAL,
        entry_condition TEXT CHECK(entry_condition IN ('BREAK_ABOVE', 'BREAK_BELOW', 'PULLBACK_TO', 'HOLD_ABOVE', 'HOLD_BELOW')),

        -- Exit Levels
        stop_loss REAL NOT NULL,
        target_1 REAL NOT NULL,
        target_2 REAL,
        target_3 REAL,
        trailing_stop_percent REAL,

        -- Risk Management
        risk_reward_ratio REAL NOT NULL,
        position_size_percent REAL,
        max_loss_amount REAL,

        -- Technical Data
        technical_data TEXT NOT NULL,
        signals TEXT,
        chart_patterns TEXT,

        -- Status Tracking
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'TRIGGERED', 'ENTERED', 'EXITED', 'CANCELLED', 'EXPIRED')),
        triggered_at DATETIME,
        trigger_price REAL,

        -- Notes
        setup_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_status ON watchlist_stocks(status);
      CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_symbol ON watchlist_stocks(symbol);
      CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_score ON watchlist_stocks(score DESC);
      CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_watchlist ON watchlist_stocks(watchlist_id);
    `);

    // Trades Table - Actual trade executions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watchlist_stock_id INTEGER,
        symbol TEXT NOT NULL,
        company_name TEXT,
        exchange TEXT NOT NULL,
        currency TEXT NOT NULL CHECK(currency IN ('USD', 'INR')),

        -- Trade Type
        trade_type TEXT NOT NULL CHECK(trade_type IN ('LONG', 'SHORT')),
        timeframe TEXT NOT NULL CHECK(timeframe IN ('INTRADAY', 'SWING', 'POSITIONAL')),

        -- Entry
        entry_date DATETIME NOT NULL,
        entry_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        entry_value REAL NOT NULL,
        entry_notes TEXT,

        -- Exit
        exit_date DATETIME,
        exit_price REAL,
        exit_value REAL,
        exit_reason TEXT CHECK(exit_reason IN ('TARGET_1', 'TARGET_2', 'TARGET_3', 'STOP_LOSS', 'TRAILING_STOP', 'TIME_EXIT', 'MANUAL', 'MARKET_CLOSE')),
        exit_notes TEXT,

        -- P&L Calculation
        gross_pnl REAL,
        gross_pnl_percent REAL,
        fees REAL DEFAULT 0,
        taxes REAL DEFAULT 0,
        net_pnl REAL,
        net_pnl_percent REAL,

        -- Performance Metrics
        holding_duration_minutes INTEGER,
        max_favorable_excursion REAL,
        max_favorable_excursion_percent REAL,
        max_adverse_excursion REAL,
        max_adverse_excursion_percent REAL,

        -- Risk Management
        initial_stop_loss REAL,
        final_stop_loss REAL,
        risk_amount REAL,
        reward_amount REAL,
        actual_rr_ratio REAL,

        -- Status
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED', 'CANCELLED')),

        -- Timestamps
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (watchlist_stock_id) REFERENCES watchlist_stocks(id) ON DELETE SET NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
      CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_trades_entry_date ON trades(entry_date DESC);
      CREATE INDEX IF NOT EXISTS idx_trades_watchlist_stock ON trades(watchlist_stock_id);
    `);

    // Positions Table - Real-time open position tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trade_id INTEGER NOT NULL UNIQUE,
        symbol TEXT NOT NULL,
        entry_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        current_price REAL NOT NULL,
        current_value REAL NOT NULL,
        unrealized_pnl REAL NOT NULL,
        unrealized_pnl_percent REAL NOT NULL,

        -- Stop Loss Tracking
        current_stop_loss REAL NOT NULL,
        stop_type TEXT NOT NULL CHECK(stop_type IN ('FIXED', 'TRAILING', 'BREAKEVEN')),
        trailing_stop_price REAL,
        highest_price REAL,
        lowest_price REAL,

        -- Target Tracking
        target_1_hit BOOLEAN DEFAULT 0,
        target_2_hit BOOLEAN DEFAULT 0,
        target_3_hit BOOLEAN DEFAULT 0,

        -- Status
        alert_triggered BOOLEAN DEFAULT 0,
        last_alert_time DATETIME,

        -- Timestamps
        last_updated DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_positions_symbol ON positions(symbol);
      CREATE INDEX IF NOT EXISTS idx_positions_last_updated ON positions(last_updated DESC);
    `);

    // Auto-Scan Configuration Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS autoscan_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        strategy TEXT NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT 1,
        scan_interval INTEGER NOT NULL DEFAULT 5,
        last_scan_time DATETIME,
        next_scan_time DATETIME,
        markets TEXT NOT NULL,
        min_confidence_score REAL NOT NULL DEFAULT 60,
        max_results_per_scan INTEGER NOT NULL DEFAULT 20,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notification Settings Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default',
        email_enabled BOOLEAN NOT NULL DEFAULT 0,
        email_address TEXT,
        sms_enabled BOOLEAN NOT NULL DEFAULT 0,
        sms_number TEXT,
        whatsapp_enabled BOOLEAN NOT NULL DEFAULT 0,
        whatsapp_number TEXT,
        telegram_enabled BOOLEAN NOT NULL DEFAULT 0,
        telegram_chat_id TEXT,
        webhook_enabled BOOLEAN NOT NULL DEFAULT 0,
        webhook_url TEXT,
        webhook_secret TEXT,
        alert_types TEXT NOT NULL DEFAULT '["ENTRY_SIGNAL","TARGET_HIT","STOPLOSS_HIT"]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      )
    `);

    // Notification Log Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id INTEGER NOT NULL,
        channel TEXT NOT NULL CHECK(channel IN ('email', 'sms', 'whatsapp', 'telegram', 'webhook')),
        recipient TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'retrying')),
        attempts INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        sent_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (alert_id) REFERENCES alerts(id)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notification_log_alert_id ON notification_log(alert_id);
      CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
      CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at DESC);
    `);

    // Notification Credentials Table (for service API keys - encrypted)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notification_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service TEXT NOT NULL UNIQUE,
        credentials TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Broker Accounts Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS broker_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default',
        broker TEXT NOT NULL CHECK(broker IN ('upstox', 'zerodha', 'ibkr', 'paper')),
        account_id TEXT NOT NULL,
        name TEXT,
        status TEXT CHECK(status IN ('connected', 'disconnected', 'expired')) DEFAULT 'disconnected',
        credentials TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        auto_trade_enabled BOOLEAN NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, broker, account_id)
      )
    `);

    // Migration: Add name and status columns if they don't exist
    try {
      this.db.exec(`ALTER TABLE broker_accounts ADD COLUMN name TEXT`);
    } catch (e) {
      // Column already exists
    }
    try {
      this.db.exec(`ALTER TABLE broker_accounts ADD COLUMN status TEXT CHECK(status IN ('connected', 'disconnected', 'expired')) DEFAULT 'disconnected'`);
    } catch (e) {
      // Column already exists
    }

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_broker_accounts_user_id ON broker_accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_broker_accounts_broker ON broker_accounts(broker);
    `);

    // Broker Orders Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS broker_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watchlist_stock_id INTEGER,
        broker_account_id INTEGER NOT NULL,
        broker TEXT NOT NULL,
        broker_order_id TEXT,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL,
        order_type TEXT NOT NULL CHECK(order_type IN ('MARKET', 'LIMIT', 'SL', 'SL-M')),
        side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
        quantity INTEGER NOT NULL,
        price REAL,
        trigger_price REAL,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'OPEN', 'EXECUTED', 'CANCELLED', 'REJECTED')),
        filled_quantity INTEGER NOT NULL DEFAULT 0,
        average_price REAL,
        order_timestamp DATETIME,
        execution_timestamp DATETIME,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (watchlist_stock_id) REFERENCES watchlist_stocks(id),
        FOREIGN KEY (broker_account_id) REFERENCES broker_accounts(id)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_broker_orders_watchlist_stock_id ON broker_orders(watchlist_stock_id);
      CREATE INDEX IF NOT EXISTS idx_broker_orders_broker_account_id ON broker_orders(broker_account_id);
      CREATE INDEX IF NOT EXISTS idx_broker_orders_status ON broker_orders(status);
      CREATE INDEX IF NOT EXISTS idx_broker_orders_symbol ON broker_orders(symbol);
    `);

    // Broker Positions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS broker_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        broker_account_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        average_price REAL NOT NULL,
        current_price REAL,
        pnl REAL,
        pnl_percent REAL,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (broker_account_id) REFERENCES broker_accounts(id),
        UNIQUE(broker_account_id, symbol, exchange)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_broker_positions_broker_account_id ON broker_positions(broker_account_id);
      CREATE INDEX IF NOT EXISTS idx_broker_positions_symbol ON broker_positions(symbol);
    `);

    // Custom Watchlists Table - User-defined watchlists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_watchlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL DEFAULT 'default',
        name TEXT NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      )
    `);

    // Custom Watchlist Stocks - Individual stocks in custom watchlists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS custom_watchlist_stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        watchlist_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL,
        company_name TEXT,
        setup_type TEXT CHECK(setup_type IN ('BREAKOUT', 'BREAKDOWN', 'PULLBACK', 'REVERSAL', 'CONSOLIDATION', 'CUSTOM')),
        timeframe TEXT CHECK(timeframe IN ('INTRADAY', 'SWING', 'POSITIONAL')),
        entry_price REAL NOT NULL,
        entry_trigger REAL,
        stop_loss REAL NOT NULL,
        target_1 REAL NOT NULL,
        target_2 REAL,
        target_3 REAL,
        trailing_stop_percent REAL DEFAULT 1.0,
        position_size_percent REAL DEFAULT 1.0,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'TRIGGERED', 'CANCELLED', 'EXPIRED')),
        trigger_price REAL,
        trigger_time DATETIME,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (watchlist_id) REFERENCES custom_watchlists(id) ON DELETE CASCADE,
        UNIQUE(watchlist_id, symbol, exchange)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_custom_watchlist_stocks_watchlist_id ON custom_watchlist_stocks(watchlist_id);
      CREATE INDEX IF NOT EXISTS idx_custom_watchlist_stocks_symbol ON custom_watchlist_stocks(symbol);
      CREATE INDEX IF NOT EXISTS idx_custom_watchlist_stocks_status ON custom_watchlist_stocks(status);
    `);

    // Scalper Configuration Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scalper_configs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        enabled BOOLEAN NOT NULL DEFAULT 0,
        broker TEXT NOT NULL CHECK(broker IN ('zerodha', 'upstox', 'ibkr')),
        account_id TEXT NOT NULL,
        auto_trade BOOLEAN NOT NULL DEFAULT 0,

        stock_selection_method TEXT NOT NULL DEFAULT 'MANUAL' CHECK(stock_selection_method IN ('MANUAL', 'AUTO_SCREENER')),
        stock_symbols TEXT,
        screener_criteria TEXT,
        max_stocks INTEGER NOT NULL DEFAULT 5,

        strategy_name TEXT NOT NULL,
        timeframe TEXT NOT NULL DEFAULT '5m' CHECK(timeframe IN ('1m', '3m', '5m')),
        indicators_config TEXT NOT NULL,
        entry_conditions TEXT NOT NULL,
        exit_conditions TEXT NOT NULL,

        max_position_size REAL NOT NULL DEFAULT 10000,
        max_positions_open INTEGER NOT NULL DEFAULT 3,
        max_daily_loss REAL NOT NULL DEFAULT 5000,
        max_daily_trades INTEGER NOT NULL DEFAULT 20,
        position_sizing_method TEXT NOT NULL DEFAULT 'FIXED' CHECK(position_sizing_method IN ('FIXED', 'RISK_BASED', 'KELLY')),
        risk_per_trade REAL NOT NULL DEFAULT 1.0,

        trading_start_time TEXT NOT NULL DEFAULT '09:30',
        trading_end_time TEXT NOT NULL DEFAULT '15:15',
        avoid_first_minutes INTEGER NOT NULL DEFAULT 15,
        avoid_last_minutes INTEGER NOT NULL DEFAULT 15,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Scalping Stocks Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scalping_stocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scalper_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL CHECK(exchange IN ('NSE', 'BSE', 'NYSE', 'NASDAQ')),
        active BOOLEAN NOT NULL DEFAULT 1,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_trade_at DATETIME,

        total_trades INTEGER NOT NULL DEFAULT 0,
        winning_trades INTEGER NOT NULL DEFAULT 0,
        total_pnl REAL NOT NULL DEFAULT 0,
        win_rate REAL NOT NULL DEFAULT 0,

        FOREIGN KEY (scalper_id) REFERENCES scalper_configs(id) ON DELETE CASCADE,
        UNIQUE(scalper_id, symbol, exchange)
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scalping_stocks_scalper ON scalping_stocks(scalper_id);
      CREATE INDEX IF NOT EXISTS idx_scalping_stocks_active ON scalping_stocks(active);
    `);

    // Scalp Trades Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scalp_trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scalper_id INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        exchange TEXT NOT NULL,

        side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
        quantity INTEGER NOT NULL,
        entry_price REAL NOT NULL,
        entry_time DATETIME NOT NULL,
        entry_order_id TEXT,

        exit_price REAL,
        exit_time DATETIME,
        exit_order_id TEXT,

        stop_loss REAL NOT NULL,
        target REAL NOT NULL,

        status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'OPEN', 'CLOSED', 'CANCELLED', 'FAILED')),
        close_reason TEXT CHECK(close_reason IN ('TARGET_HIT', 'STOP_LOSS', 'TIME_EXIT', 'MANUAL', 'EMERGENCY_EXIT')),

        gross_pnl REAL,
        net_pnl REAL,
        pnl_percent REAL,
        brokerage REAL DEFAULT 0,

        entry_signals TEXT NOT NULL,
        indicators_data TEXT NOT NULL,
        chart_data TEXT,

        execution_mode TEXT NOT NULL DEFAULT 'AUTO' CHECK(execution_mode IN ('AUTO', 'MANUAL', 'PAPER')),
        notes TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (scalper_id) REFERENCES scalper_configs(id) ON DELETE CASCADE
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scalp_trades_scalper ON scalp_trades(scalper_id);
      CREATE INDEX IF NOT EXISTS idx_scalp_trades_status ON scalp_trades(status);
      CREATE INDEX IF NOT EXISTS idx_scalp_trades_symbol ON scalp_trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_scalp_trades_entry_time ON scalp_trades(entry_time DESC);
    `);

    // Broker Connections Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS broker_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        broker TEXT NOT NULL CHECK(broker IN ('zerodha', 'upstox', 'ibkr')),
        account_id TEXT NOT NULL UNIQUE,
        connected BOOLEAN NOT NULL DEFAULT 0,
        last_heartbeat DATETIME,

        api_key TEXT,
        api_secret TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry DATETIME,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    loggerService.info('Database tables created successfully');
  }

  /**
   * Run database migrations to handle schema updates
   */
  private runMigrations(): void {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Migration 1: Check if currency column exists in scan_results table
      const tableInfo = this.db.pragma('table_info(scan_results)') as Array<{ name: string }>;
      const hasCurrencyColumn = tableInfo.some((col) => col.name === 'currency');

      if (!hasCurrencyColumn) {
        loggerService.info('Running migration: Adding currency column to scan_results table');
        this.db.exec(`
          ALTER TABLE scan_results ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR' CHECK(currency IN ('USD', 'INR'))
        `);
        loggerService.info('Migration completed: currency column added');
      }

      // Migration 2: Phase 4A - Add source tracking to custom_watchlist_stocks (Unified Watchlist)
      const watchlistStocksInfo = this.db.pragma('table_info(custom_watchlist_stocks)') as Array<{ name: string }>;
      const hasSourceColumn = watchlistStocksInfo.some((col) => col.name === 'source');
      const hasSourceIdColumn = watchlistStocksInfo.some((col) => col.name === 'source_id');
      const hasSourceMetadataColumn = watchlistStocksInfo.some((col) => col.name === 'source_metadata');

      if (!hasSourceColumn) {
        loggerService.info('Running migration: Phase 4A - Adding source tracking columns to custom_watchlist_stocks');

        // Add source column
        this.db.exec(`
          ALTER TABLE custom_watchlist_stocks ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL'
        `);
        loggerService.info('Migration: Added source column');

        // Add source_id column (foreign key to scan_results)
        this.db.exec(`
          ALTER TABLE custom_watchlist_stocks ADD COLUMN source_id INTEGER
        `);
        loggerService.info('Migration: Added source_id column');

        // Add source_metadata column (JSON metadata)
        this.db.exec(`
          ALTER TABLE custom_watchlist_stocks ADD COLUMN source_metadata TEXT
        `);
        loggerService.info('Migration: Added source_metadata column');

        // Create indexes for performance
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_custom_watchlist_stocks_source ON custom_watchlist_stocks(source)
        `);
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_custom_watchlist_stocks_source_id ON custom_watchlist_stocks(source_id)
        `);
        loggerService.info('Migration: Created indexes for source tracking');

        // Create "Auto-Scan Signals (Legacy)" watchlist for EOD migration
        const legacyWatchlistExists = this.db.prepare(`
          SELECT id FROM custom_watchlists WHERE name = 'Auto-Scan Signals (Legacy)' LIMIT 1
        `).get();

        if (!legacyWatchlistExists) {
          this.db.prepare(`
            INSERT INTO custom_watchlists (user_id, name, description, is_active)
            VALUES (?, ?, ?, ?)
          `).run('default', 'Auto-Scan Signals (Legacy)', 'Automatically generated from EOD scans (migrated)', 1);

          const autoWatchlist = this.db.prepare(`
            SELECT id FROM custom_watchlists WHERE name = 'Auto-Scan Signals (Legacy)' LIMIT 1
          `).get() as { id: number } | undefined;

          if (autoWatchlist) {
            loggerService.info(`Migration: Created Auto-Scan Signals watchlist (ID: ${autoWatchlist.id})`);

            // Migrate existing EOD watchlist stocks to unified system
            const eodStocks = this.db.prepare(`
              SELECT ws.*, w.date as watchlist_date
              FROM watchlist_stocks ws
              JOIN watchlists w ON ws.watchlist_id = w.id
              WHERE ws.status IN ('PENDING', 'TRIGGERED', 'ENTERED')
              ORDER BY ws.created_at DESC
            `).all() as Array<any>;

            let migratedCount = 0;
            for (const stock of eodStocks) {
              try {
                // Check if stock already exists (avoid duplicates)
                const exists = this.db.prepare(`
                  SELECT id FROM custom_watchlist_stocks
                  WHERE watchlist_id = ? AND symbol = ? AND exchange = ?
                `).get(autoWatchlist.id, stock.symbol, stock.exchange);

                if (!exists) {
                  this.db.prepare(`
                    INSERT INTO custom_watchlist_stocks (
                      watchlist_id, symbol, exchange, company_name,
                      source, source_id, source_metadata,
                      setup_type, timeframe,
                      entry_price, entry_trigger, stop_loss,
                      target_1, target_2, target_3,
                      trailing_stop_percent, position_size_percent,
                      notes, status, trigger_price, trigger_time, added_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `).run(
                    autoWatchlist.id,
                    stock.symbol,
                    stock.exchange,
                    stock.company_name,
                    'AUTO_SCAN',  // Source
                    stock.id,     // source_id (link to original watchlist_stocks)
                    JSON.stringify({
                      confidence: stock.score || 0,
                      strategy: stock.setup_type,
                      riskReward: stock.risk_reward_ratio,
                      originalWatchlistDate: stock.watchlist_date
                    }),
                    stock.setup_type,
                    stock.timeframe,
                    stock.entry_price,
                    stock.entry_trigger,
                    stock.stop_loss,
                    stock.target_1,
                    stock.target_2,
                    stock.target_3,
                    stock.trailing_stop_percent,
                    stock.position_size_percent,
                    stock.setup_notes,
                    stock.status,
                    stock.trigger_price,
                    stock.triggered_at,
                    stock.created_at
                  );
                  migratedCount++;
                }
              } catch (err) {
                loggerService.warn(`Migration: Failed to migrate stock ${stock.symbol}`, { error: err });
              }
            }

            loggerService.info(`Migration: Migrated ${migratedCount} EOD stocks to unified watchlist system`);
          }
        } else {
          loggerService.info('Migration: Auto-Scan Signals watchlist already exists, skipping EOD data migration');
        }

        loggerService.info('Migration completed: Phase 4A - Unified Watchlist source tracking added');
      }

      // Migration 3: Fix duplicate scan results (keep only most recent for each symbol+strategy combo)
      const duplicateCountQuery = this.db.prepare(`
        SELECT COUNT(*) as total FROM (
          SELECT symbol, strategy
          FROM scan_results
          WHERE status = 'ACTIVE'
          GROUP BY symbol, strategy
          HAVING COUNT(*) > 1
        )
      `);
      const duplicateCheck = duplicateCountQuery.get() as any;

      if (duplicateCheck && duplicateCheck.total > 0) {
        loggerService.info('Running migration: Removing duplicate scan results');

        // Step 1: Get IDs of duplicates to delete
        const duplicateIdsQuery = this.db.prepare(`
          SELECT id FROM scan_results
          WHERE id NOT IN (
            SELECT MAX(id)
            FROM scan_results
            WHERE status = 'ACTIVE'
            GROUP BY symbol, strategy
          )
          AND status = 'ACTIVE'
        `);

        const duplicateIds = duplicateIdsQuery.all().map((row: any) => row.id);

        if (duplicateIds.length > 0) {
          const placeholders = duplicateIds.map(() => '?').join(',');

          // Step 2a: Clear foreign key references in custom_watchlist_stocks
          const updateWatchlistStmt = this.db.prepare(`
            UPDATE custom_watchlist_stocks
            SET source_id = NULL, source_metadata = NULL
            WHERE source_id IN (${placeholders})
          `);
          updateWatchlistStmt.run(...duplicateIds);

          // Step 2b: Clear foreign key references in alerts table
          const updateAlertsStmt = this.db.prepare(`
            UPDATE alerts
            SET scan_result_id = NULL
            WHERE scan_result_id IN (${placeholders})
          `);
          updateAlertsStmt.run(...duplicateIds);

          // Step 3: Now safe to delete duplicates
          const deleteStmt = this.db.prepare(`
            DELETE FROM scan_results WHERE id IN (${placeholders})
          `);
          const deleteResult = deleteStmt.run(...duplicateIds);

          loggerService.info(`Migration completed: Removed ${deleteResult.changes} duplicate scan results`);
        }
      }

      loggerService.info('Database migrations completed successfully');
    } catch (error) {
      loggerService.error('Failed to run database migrations', { error });
      throw error;
    }
  }

  /**
   * Insert a new scan result
   * Prevents duplicates by checking if the same symbol+strategy was scanned recently (within 1 hour)
   */
  insertScanResult(result: ScanResult): number {
    if (!this.db) throw new Error('Database not initialized');

    // Check for recent duplicates (within 1 hour for same symbol+strategy)
    const existingCheck = this.db.prepare(`
      SELECT id FROM scan_results
      WHERE symbol = ? AND strategy = ? AND status = 'ACTIVE'
      AND timestamp > datetime('now', '-1 hour')
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    const existing = existingCheck.get(result.symbol, result.strategy) as any;

    if (existing) {
      // Update existing result instead of inserting duplicate
      const updateStmt = this.db.prepare(`
        UPDATE scan_results
        SET current_price = ?, confidence_score = ?, signals = ?,
            technical_data = ?, evidence_chart_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(
        result.currentPrice,
        result.confidenceScore,
        result.signals,
        result.technicalData,
        result.evidenceChartData,
        existing.id
      );

      return existing.id;
    }

    const stmt = this.db.prepare(`
      INSERT INTO scan_results (
        scan_id, timestamp, strategy, strategy_type, symbol, exchange, company_name, currency,
        current_price, entry_price, stop_loss, target, risk_reward_ratio, confidence_score,
        signals, technical_data, fundamental_data, evidence_chart_data, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      result.scanId,
      result.timestamp instanceof Date ? result.timestamp.toISOString() : result.timestamp,
      result.strategy,
      result.strategyType,
      result.symbol,
      result.exchange,
      result.companyName,
      result.currency,
      result.currentPrice,
      result.entryPrice,
      result.stopLoss,
      result.target,
      result.riskRewardRatio,
      result.confidenceScore,
      result.signals,
      result.technicalData,
      result.fundamentalData || null,
      result.evidenceChartData,
      result.status
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Get scan results by strategy
   */
  getScanResultsByStrategy(strategy: string, limit: number = 50): ScanResult[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM scan_results
      WHERE strategy = ? AND status = 'ACTIVE'
      ORDER BY timestamp DESC, confidence_score DESC
      LIMIT ?
    `);

    return stmt.all(strategy, limit) as ScanResult[];
  }

  /**
   * Get latest scan results grouped by strategy
   */
  getLatestScanResults(hours: number = 24): Map<string, ScanResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM scan_results
      WHERE timestamp > datetime('now', '-' || ? || ' hours')
      AND status = 'ACTIVE'
      ORDER BY strategy, timestamp DESC, confidence_score DESC
    `);

    const results = stmt.all(hours) as ScanResult[];

    // Group by strategy
    const grouped = new Map<string, ScanResult[]>();
    results.forEach(result => {
      if (!grouped.has(result.strategy)) {
        grouped.set(result.strategy, []);
      }
      grouped.get(result.strategy)!.push(result);
    });

    return grouped;
  }

  /**
   * Get active scan results (not expired, not hit targets/stops)
   */
  getActiveScanResults(): ScanResult[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM scan_results
      WHERE status = 'ACTIVE'
      ORDER BY timestamp DESC, confidence_score DESC
    `);

    return stmt.all() as ScanResult[];
  }

  /**
   * Update scan result status
   */
  updateScanResultStatus(
    id: number,
    status: ScanResult['status'],
    outcome?: ScanResult['outcome'],
    exitPrice?: number,
    profitLoss?: number,
    notes?: string
  ): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE scan_results
      SET status = ?, outcome = ?, exit_price = ?, profit_loss = ?,
          exit_date = CURRENT_TIMESTAMP, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(status, outcome || null, exitPrice || null, profitLoss || null, notes || null, id);
  }

  /**
   * Insert a new alert
   */
  insertAlert(alert: Alert): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO alerts (
        timestamp, symbol, exchange, strategy, alert_type, message, priority, read, scan_result_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      alert.timestamp instanceof Date ? alert.timestamp.toISOString() : alert.timestamp,
      alert.symbol,
      alert.exchange,
      alert.strategy,
      alert.alertType,
      alert.message,
      alert.priority,
      alert.read ? 1 : 0,
      alert.scanResultId || null
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Get unread alerts
   */
  getUnreadAlerts(limit: number = 100): Alert[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM alerts
      WHERE read = 0
      ORDER BY priority DESC, timestamp DESC
      LIMIT ?
    `);

    return stmt.all(limit) as Alert[];
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24, limit: number = 100): Alert[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM alerts
      WHERE timestamp > datetime('now', '-' || ? || ' hours')
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(hours, limit) as Alert[];
  }

  /**
   * Get alert by ID
   */
  getAlertById(id: number): Alert | null {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM alerts WHERE id = ?
    `);

    const result = stmt.get(id) as any;
    if (!result) return null;

    return {
      id: result.id,
      timestamp: new Date(result.timestamp),
      symbol: result.symbol,
      exchange: result.exchange,
      strategy: result.strategy,
      alertType: result.alert_type,
      message: result.message,
      priority: result.priority,
      read: Boolean(result.read),
      scanResultId: result.scan_result_id,
    };
  }

  /**
   * Mark alert as read
   */
  markAlertAsRead(id: number): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('UPDATE alerts SET read = 1 WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Get or create autoscan config for a strategy
   */
  getOrCreateAutoScanConfig(strategy: string, defaultConfig: Partial<AutoScanConfig> = {}): AutoScanConfig {
    if (!this.db) throw new Error('Database not initialized');

    // Try to get existing config
    const existing = this.db.prepare('SELECT * FROM autoscan_config WHERE strategy = ?').get(strategy) as any;

    if (existing) {
      // Convert snake_case to camelCase
      return {
        id: existing.id,
        strategy: existing.strategy,
        enabled: Boolean(existing.enabled),
        scanInterval: existing.scan_interval,
        lastScanTime: existing.last_scan_time ? new Date(existing.last_scan_time) : undefined,
        nextScanTime: existing.next_scan_time ? new Date(existing.next_scan_time) : undefined,
        markets: existing.markets,
        minConfidenceScore: existing.min_confidence_score,
        maxResultsPerScan: existing.max_results_per_scan,
      };
    }

    // Create new config
    const stmt = this.db.prepare(`
      INSERT INTO autoscan_config (strategy, enabled, scan_interval, markets, min_confidence_score, max_results_per_scan)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      strategy,
      defaultConfig.enabled !== undefined ? (defaultConfig.enabled ? 1 : 0) : 1,
      defaultConfig.scanInterval || 5,
      defaultConfig.markets || JSON.stringify(['NSE']),
      defaultConfig.minConfidenceScore || 60,
      defaultConfig.maxResultsPerScan || 20
    );

    const newRow = this.db.prepare('SELECT * FROM autoscan_config WHERE id = ?').get(info.lastInsertRowid) as any;

    // Convert snake_case to camelCase
    return {
      id: newRow.id,
      strategy: newRow.strategy,
      enabled: Boolean(newRow.enabled),
      scanInterval: newRow.scan_interval,
      lastScanTime: newRow.last_scan_time ? new Date(newRow.last_scan_time) : undefined,
      nextScanTime: newRow.next_scan_time ? new Date(newRow.next_scan_time) : undefined,
      markets: newRow.markets,
      minConfidenceScore: newRow.min_confidence_score,
      maxResultsPerScan: newRow.max_results_per_scan,
    };
  }

  /**
   * Update autoscan config
   */
  updateAutoScanConfig(strategy: string, config: Partial<AutoScanConfig>): void {
    if (!this.db) throw new Error('Database not initialized');

    const updates: string[] = [];
    const values: any[] = [];

    if (config.enabled !== undefined) {
      updates.push('enabled = ?');
      values.push(config.enabled ? 1 : 0);
    }
    if (config.scanInterval !== undefined) {
      updates.push('scan_interval = ?');
      values.push(config.scanInterval);
    }
    if (config.lastScanTime !== undefined) {
      updates.push('last_scan_time = ?');
      values.push(config.lastScanTime instanceof Date ? config.lastScanTime.toISOString() : config.lastScanTime);
    }
    if (config.nextScanTime !== undefined) {
      updates.push('next_scan_time = ?');
      values.push(config.nextScanTime instanceof Date ? config.nextScanTime.toISOString() : config.nextScanTime);
    }
    if (config.markets !== undefined) {
      updates.push('markets = ?');
      values.push(config.markets);
    }
    if (config.minConfidenceScore !== undefined) {
      updates.push('min_confidence_score = ?');
      values.push(config.minConfidenceScore);
    }
    if (config.maxResultsPerScan !== undefined) {
      updates.push('max_results_per_scan = ?');
      values.push(config.maxResultsPerScan);
    }

    if (updates.length === 0) return;

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(strategy);

    const sql = `UPDATE autoscan_config SET ${updates.join(', ')} WHERE strategy = ?`;
    this.db.prepare(sql).run(...values);
  }

  /**
   * Get all enabled autoscan configs
   */
  getEnabledAutoScanConfigs(): AutoScanConfig[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM autoscan_config WHERE enabled = 1');
    const rows = stmt.all() as any[];

    // Convert snake_case to camelCase
    return rows.map(row => ({
      id: row.id,
      strategy: row.strategy,
      enabled: Boolean(row.enabled),
      scanInterval: row.scan_interval,
      lastScanTime: row.last_scan_time ? new Date(row.last_scan_time) : undefined,
      nextScanTime: row.next_scan_time ? new Date(row.next_scan_time) : undefined,
      markets: row.markets,
      minConfidenceScore: row.min_confidence_score,
      maxResultsPerScan: row.max_results_per_scan,
    }));
  }

  /**
   * Get performance statistics for a strategy
   */
  getStrategyPerformance(strategy: string, days: number = 30): {
    totalSignals: number;
    activeSignals: number;
    completedSignals: number;
    winRate: number;
    averageReturn: number;
    totalProfit: number;
  } {
    if (!this.db) throw new Error('Database not initialized');

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_signals,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active_signals,
        SUM(CASE WHEN status != 'ACTIVE' THEN 1 ELSE 0 END) as completed_signals,
        SUM(CASE WHEN outcome = 'WIN' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN outcome = 'LOSS' THEN 1 ELSE 0 END) as losses,
        AVG(CASE WHEN profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as avg_return,
        SUM(CASE WHEN profit_loss IS NOT NULL THEN profit_loss ELSE 0 END) as total_profit
      FROM scan_results
      WHERE strategy = ?
      AND timestamp > datetime('now', '-' || ? || ' days')
    `).get(strategy, days) as any;

    const winRate = stats.wins + stats.losses > 0
      ? (stats.wins / (stats.wins + stats.losses)) * 100
      : 0;

    return {
      totalSignals: stats.total_signals || 0,
      activeSignals: stats.active_signals || 0,
      completedSignals: stats.completed_signals || 0,
      winRate: Math.round(winRate * 100) / 100,
      averageReturn: Math.round((stats.avg_return || 0) * 100) / 100,
      totalProfit: Math.round((stats.total_profit || 0) * 100) / 100,
    };
  }

  /**
   * Clean up old expired results
   */
  cleanupOldResults(daysToKeep: number = 90): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      DELETE FROM scan_results
      WHERE timestamp < datetime('now', '-' || ? || ' days')
      AND status != 'ACTIVE'
    `);

    const info = stmt.run(daysToKeep);
    return info.changes;
  }

  // ==================== EOD WATCHLIST METHODS ====================

  /**
   * Create a new daily watchlist
   */
  createWatchlist(
    date: Date,
    exchange: string,
    totalStocksAnalyzed: number,
    stocksSelected: number,
    notes?: string
  ): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO watchlists (date, exchange, scan_timestamp, total_stocks_analyzed, stocks_selected, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      exchange,
      new Date().toISOString(),
      totalStocksAnalyzed,
      stocksSelected,
      notes || null
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Insert a stock into a watchlist
   */
  insertWatchlistStock(watchlistId: number, stock: {
    symbol: string;
    companyName?: string;
    exchange: string;
    currency: 'USD' | 'INR';
    setupType: string;
    timeframe: string;
    score: number;
    entryPrice: number;
    entryTrigger?: number;
    entryCondition?: string;
    stopLoss: number;
    target1: number;
    target2?: number;
    target3?: number;
    trailingStopPercent?: number;
    riskRewardRatio: number;
    positionSizePercent?: number;
    maxLossAmount?: number;
    technicalData: string;
    signals?: string;
    chartPatterns?: string;
    setupNotes?: string;
  }): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO watchlist_stocks (
        watchlist_id, symbol, company_name, exchange, currency,
        setup_type, timeframe, score,
        entry_price, entry_trigger, entry_condition,
        stop_loss, target_1, target_2, target_3, trailing_stop_percent,
        risk_reward_ratio, position_size_percent, max_loss_amount,
        technical_data, signals, chart_patterns, setup_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      watchlistId,
      stock.symbol,
      stock.companyName || null,
      stock.exchange,
      stock.currency,
      stock.setupType,
      stock.timeframe,
      stock.score,
      stock.entryPrice,
      stock.entryTrigger || null,
      stock.entryCondition || null,
      stock.stopLoss,
      stock.target1,
      stock.target2 || null,
      stock.target3 || null,
      stock.trailingStopPercent || null,
      stock.riskRewardRatio,
      stock.positionSizePercent || null,
      stock.maxLossAmount || null,
      stock.technicalData,
      stock.signals || null,
      stock.chartPatterns || null,
      stock.setupNotes || null
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Get watchlist for a specific date
   */
  getWatchlistByDate(date: Date): {
    watchlist: any;
    stocks: any[];
  } | null {
    if (!this.db) throw new Error('Database not initialized');

    const dateStr = date.toISOString().split('T')[0];

    const watchlist = this.db.prepare(`
      SELECT * FROM watchlists WHERE date = ?
    `).get(dateStr);

    if (!watchlist) return null;

    const stocks = this.db.prepare(`
      SELECT * FROM watchlist_stocks
      WHERE watchlist_id = ?
      ORDER BY score DESC
    `).all((watchlist as any).id);

    return {
      watchlist,
      stocks
    };
  }

  /**
   * Get latest watchlist
   */
  getLatestWatchlist(): {
    watchlist: any;
    stocks: any[];
  } | null {
    if (!this.db) throw new Error('Database not initialized');

    const watchlist = this.db.prepare(`
      SELECT * FROM watchlists
      ORDER BY date DESC, created_at DESC
      LIMIT 1
    `).get();

    if (!watchlist) return null;

    const stocks = this.db.prepare(`
      SELECT * FROM watchlist_stocks
      WHERE watchlist_id = ?
      ORDER BY score DESC
    `).all((watchlist as any).id);

    return {
      watchlist,
      stocks
    };
  }

  /**
   * Get today's watchlist stocks
   */
  getTodayWatchlist(): any[] {
    if (!this.db) throw new Error('Database not initialized');

    const today = new Date().toISOString().split('T')[0];

    const stmt = this.db.prepare(`
      SELECT ws.* FROM watchlist_stocks ws
      JOIN watchlists w ON ws.watchlist_id = w.id
      WHERE w.date = ?
      ORDER BY ws.score DESC
    `);

    return stmt.all(today);
  }

  /**
   * Update watchlist stock status
   */
  updateWatchlistStockStatus(
    id: number,
    status: string,
    triggerPrice?: number,
    triggerTime?: Date
  ): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE watchlist_stocks
      SET status = ?,
          trigger_price = ?,
          triggered_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      status,
      triggerPrice || null,
      triggerTime ? triggerTime.toISOString() : null,
      id
    );
  }

  /**
   * Get watchlist stocks by status
   */
  getWatchlistStocksByStatus(status: string): any[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT ws.*, w.date as watchlist_date
      FROM watchlist_stocks ws
      JOIN watchlists w ON ws.watchlist_id = w.id
      WHERE ws.status = ?
      ORDER BY ws.score DESC
    `);

    return stmt.all(status);
  }

  // ==================== TRADE MANAGEMENT METHODS ====================

  /**
   * Create a new trade
   */
  createTrade(trade: {
    watchlistStockId?: number;
    symbol: string;
    companyName?: string;
    exchange: string;
    currency: 'USD' | 'INR';
    tradeType: 'LONG' | 'SHORT';
    timeframe: string;
    entryDate: Date;
    entryPrice: number;
    quantity: number;
    entryNotes?: string;
    initialStopLoss: number;
    riskAmount: number;
    rewardAmount: number;
  }): number {
    if (!this.db) throw new Error('Database not initialized');

    const entryValue = trade.entryPrice * trade.quantity;

    const stmt = this.db.prepare(`
      INSERT INTO trades (
        watchlist_stock_id, symbol, company_name, exchange, currency,
        trade_type, timeframe, entry_date, entry_price, quantity, entry_value,
        entry_notes, initial_stop_loss, risk_amount, reward_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')
    `);

    const info = stmt.run(
      trade.watchlistStockId || null,
      trade.symbol,
      trade.companyName || null,
      trade.exchange,
      trade.currency,
      trade.tradeType,
      trade.timeframe,
      trade.entryDate.toISOString(),
      trade.entryPrice,
      trade.quantity,
      entryValue,
      trade.entryNotes || null,
      trade.initialStopLoss,
      trade.riskAmount,
      trade.rewardAmount
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update trade exit
   */
  updateTradeExit(
    tradeId: number,
    exitDate: Date,
    exitPrice: number,
    exitReason: string,
    fees: number = 0,
    taxes: number = 0,
    exitNotes?: string
  ): void {
    if (!this.db) throw new Error('Database not initialized');

    // Get trade details for P&L calculation
    const trade = this.db.prepare('SELECT * FROM trades WHERE id = ?').get(tradeId) as any;
    if (!trade) throw new Error('Trade not found');

    const exitValue = exitPrice * trade.quantity;
    const grossPnl = trade.trade_type === 'LONG'
      ? exitValue - trade.entry_value
      : trade.entry_value - exitValue;

    const grossPnlPercent = (grossPnl / trade.entry_value) * 100;
    const netPnl = grossPnl - fees - taxes;
    const netPnlPercent = (netPnl / trade.entry_value) * 100;

    const holdingMinutes = Math.floor(
      (exitDate.getTime() - new Date(trade.entry_date).getTime()) / (1000 * 60)
    );

    const actualRR = Math.abs(netPnl / trade.risk_amount);

    const stmt = this.db.prepare(`
      UPDATE trades
      SET exit_date = ?,
          exit_price = ?,
          exit_value = ?,
          exit_reason = ?,
          exit_notes = ?,
          gross_pnl = ?,
          gross_pnl_percent = ?,
          fees = ?,
          taxes = ?,
          net_pnl = ?,
          net_pnl_percent = ?,
          holding_duration_minutes = ?,
          actual_rr_ratio = ?,
          status = 'CLOSED',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      exitDate.toISOString(),
      exitPrice,
      exitValue,
      exitReason,
      exitNotes || null,
      grossPnl,
      grossPnlPercent,
      fees,
      taxes,
      netPnl,
      netPnlPercent,
      holdingMinutes,
      actualRR,
      tradeId
    );
  }

  /**
   * Create a position for real-time tracking
   */
  createPosition(position: {
    tradeId: number;
    symbol: string;
    entryPrice: number;
    quantity: number;
    currentPrice: number;
    currentStopLoss: number;
    stopType: 'FIXED' | 'TRAILING' | 'BREAKEVEN';
  }): number {
    if (!this.db) throw new Error('Database not initialized');

    const currentValue = position.currentPrice * position.quantity;
    const unrealizedPnl = (position.currentPrice - position.entryPrice) * position.quantity;
    const unrealizedPnlPercent = (unrealizedPnl / (position.entryPrice * position.quantity)) * 100;

    const stmt = this.db.prepare(`
      INSERT INTO positions (
        trade_id, symbol, entry_price, quantity,
        current_price, current_value, unrealized_pnl, unrealized_pnl_percent,
        current_stop_loss, stop_type, highest_price, lowest_price, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      position.tradeId,
      position.symbol,
      position.entryPrice,
      position.quantity,
      position.currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      position.currentStopLoss,
      position.stopType,
      position.currentPrice,
      position.currentPrice,
      new Date().toISOString()
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update position with latest price
   */
  updatePosition(
    positionId: number,
    currentPrice: number,
    stopLoss?: number,
    stopType?: string
  ): void {
    if (!this.db) throw new Error('Database not initialized');

    // Get current position
    const position = this.db.prepare('SELECT * FROM positions WHERE id = ?').get(positionId) as any;
    if (!position) throw new Error('Position not found');

    const currentValue = currentPrice * position.quantity;
    const unrealizedPnl = (currentPrice - position.entry_price) * position.quantity;
    const unrealizedPnlPercent = (unrealizedPnl / (position.entry_price * position.quantity)) * 100;

    const highestPrice = Math.max(position.highest_price, currentPrice);
    const lowestPrice = Math.min(position.lowest_price, currentPrice);

    const stmt = this.db.prepare(`
      UPDATE positions
      SET current_price = ?,
          current_value = ?,
          unrealized_pnl = ?,
          unrealized_pnl_percent = ?,
          current_stop_loss = COALESCE(?, current_stop_loss),
          stop_type = COALESCE(?, stop_type),
          highest_price = ?,
          lowest_price = ?,
          last_updated = ?
      WHERE id = ?
    `);

    stmt.run(
      currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent,
      stopLoss || null,
      stopType || null,
      highestPrice,
      lowestPrice,
      new Date().toISOString(),
      positionId
    );
  }

  /**
   * Get all open positions
   */
  getOpenPositions(): any[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT p.*, t.symbol, t.company_name, t.exchange, t.currency,
             t.trade_type, t.timeframe
      FROM positions p
      JOIN trades t ON p.trade_id = t.id
      WHERE t.status = 'OPEN'
      ORDER BY p.unrealized_pnl_percent DESC
    `);

    return stmt.all();
  }

  /**
   * Close a position
   */
  closePosition(positionId: number): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('DELETE FROM positions WHERE id = ?');
    stmt.run(positionId);
  }

  /**
   * Get open trades
   */
  getOpenTrades(): any[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM trades
      WHERE status = 'OPEN'
      ORDER BY entry_date DESC
    `);

    return stmt.all();
  }

  /**
   * Get closed trades with P&L
   */
  getClosedTrades(limit: number = 100): any[] {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM trades
      WHERE status = 'CLOSED'
      ORDER BY exit_date DESC
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  /**
   * Get trade performance statistics
   */
  getTradePerformanceStats(days: number = 30): {
    totalTrades: number;
    openTrades: number;
    closedTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    averagePnl: number;
    averageRR: number;
    profitFactor: number;
  } {
    if (!this.db) throw new Error('Database not initialized');

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_trades,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_trades,
        SUM(CASE WHEN status = 'CLOSED' AND net_pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN status = 'CLOSED' AND net_pnl < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(CASE WHEN status = 'CLOSED' THEN net_pnl ELSE 0 END) as total_pnl,
        AVG(CASE WHEN status = 'CLOSED' THEN net_pnl ELSE NULL END) as avg_pnl,
        AVG(CASE WHEN status = 'CLOSED' THEN actual_rr_ratio ELSE NULL END) as avg_rr,
        SUM(CASE WHEN status = 'CLOSED' AND net_pnl > 0 THEN net_pnl ELSE 0 END) as total_profit,
        ABS(SUM(CASE WHEN status = 'CLOSED' AND net_pnl < 0 THEN net_pnl ELSE 0 END)) as total_loss
      FROM trades
      WHERE entry_date > datetime('now', '-' || ? || ' days')
    `).get(days) as any;

    const winRate = stats.winning_trades + stats.losing_trades > 0
      ? (stats.winning_trades / (stats.winning_trades + stats.losing_trades)) * 100
      : 0;

    const profitFactor = stats.total_loss > 0
      ? stats.total_profit / stats.total_loss
      : stats.total_profit > 0 ? 999 : 0;

    return {
      totalTrades: stats.total_trades || 0,
      openTrades: stats.open_trades || 0,
      closedTrades: stats.closed_trades || 0,
      winningTrades: stats.winning_trades || 0,
      losingTrades: stats.losing_trades || 0,
      winRate: Math.round(winRate * 100) / 100,
      totalPnl: Math.round((stats.total_pnl || 0) * 100) / 100,
      averagePnl: Math.round((stats.avg_pnl || 0) * 100) / 100,
      averageRR: Math.round((stats.avg_rr || 0) * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100
    };
  }

  // ==================== NOTIFICATION SETTINGS METHODS ====================

  /**
   * Get notification settings for a user
   */
  getNotificationSettings(userId: string = 'default'): NotificationSettings | null {
    if (!this.db) throw new Error('Database not initialized');

    const settings = this.db.prepare(`
      SELECT * FROM notification_settings WHERE user_id = ?
    `).get(userId) as any;

    if (!settings) return null;

    return {
      id: settings.id,
      userId: settings.user_id,
      emailEnabled: Boolean(settings.email_enabled),
      emailAddress: settings.email_address,
      smsEnabled: Boolean(settings.sms_enabled),
      smsNumber: settings.sms_number,
      whatsappEnabled: Boolean(settings.whatsapp_enabled),
      whatsappNumber: settings.whatsapp_number,
      telegramEnabled: Boolean(settings.telegram_enabled),
      telegramChatId: settings.telegram_chat_id,
      webhookEnabled: Boolean(settings.webhook_enabled),
      webhookUrl: settings.webhook_url,
      webhookSecret: settings.webhook_secret,
      alertTypes: settings.alert_types,
      createdAt: new Date(settings.created_at),
      updatedAt: new Date(settings.updated_at)
    };
  }

  /**
   * Upsert notification settings
   */
  upsertNotificationSettings(settings: Partial<NotificationSettings> & { userId: string }): number {
    if (!this.db) throw new Error('Database not initialized');

    const existing = this.getNotificationSettings(settings.userId);

    if (existing) {
      // Update
      const updates: string[] = [];
      const values: any[] = [];

      if (settings.emailEnabled !== undefined) {
        updates.push('email_enabled = ?');
        values.push(settings.emailEnabled ? 1 : 0);
      }
      if (settings.emailAddress !== undefined) {
        updates.push('email_address = ?');
        values.push(settings.emailAddress);
      }
      if (settings.smsEnabled !== undefined) {
        updates.push('sms_enabled = ?');
        values.push(settings.smsEnabled ? 1 : 0);
      }
      if (settings.smsNumber !== undefined) {
        updates.push('sms_number = ?');
        values.push(settings.smsNumber);
      }
      if (settings.whatsappEnabled !== undefined) {
        updates.push('whatsapp_enabled = ?');
        values.push(settings.whatsappEnabled ? 1 : 0);
      }
      if (settings.whatsappNumber !== undefined) {
        updates.push('whatsapp_number = ?');
        values.push(settings.whatsappNumber);
      }
      if (settings.telegramEnabled !== undefined) {
        updates.push('telegram_enabled = ?');
        values.push(settings.telegramEnabled ? 1 : 0);
      }
      if (settings.telegramChatId !== undefined) {
        updates.push('telegram_chat_id = ?');
        values.push(settings.telegramChatId);
      }
      if (settings.webhookEnabled !== undefined) {
        updates.push('webhook_enabled = ?');
        values.push(settings.webhookEnabled ? 1 : 0);
      }
      if (settings.webhookUrl !== undefined) {
        updates.push('webhook_url = ?');
        values.push(settings.webhookUrl);
      }
      if (settings.webhookSecret !== undefined) {
        updates.push('webhook_secret = ?');
        values.push(settings.webhookSecret);
      }
      if (settings.alertTypes !== undefined) {
        updates.push('alert_types = ?');
        values.push(settings.alertTypes);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(settings.userId);

      this.db.prepare(`
        UPDATE notification_settings SET ${updates.join(', ')} WHERE user_id = ?
      `).run(...values);

      return existing.id!;
    } else {
      // Insert
      const stmt = this.db.prepare(`
        INSERT INTO notification_settings (
          user_id, email_enabled, email_address, sms_enabled, sms_number,
          whatsapp_enabled, whatsapp_number, telegram_enabled, telegram_chat_id,
          webhook_enabled, webhook_url, webhook_secret, alert_types
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const info = stmt.run(
        settings.userId,
        settings.emailEnabled ? 1 : 0,
        settings.emailAddress || null,
        settings.smsEnabled ? 1 : 0,
        settings.smsNumber || null,
        settings.whatsappEnabled ? 1 : 0,
        settings.whatsappNumber || null,
        settings.telegramEnabled ? 1 : 0,
        settings.telegramChatId || null,
        settings.webhookEnabled ? 1 : 0,
        settings.webhookUrl || null,
        settings.webhookSecret || null,
        settings.alertTypes || '["ENTRY_SIGNAL","TARGET_HIT","STOPLOSS_HIT"]'
      );

      return info.lastInsertRowid as number;
    }
  }

  /**
   * Insert notification log entry
   */
  insertNotificationLog(log: Omit<NotificationLog, 'id' | 'createdAt'>): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO notification_log (
        alert_id, channel, recipient, status, attempts, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      log.alertId,
      log.channel,
      log.recipient,
      log.status,
      log.attempts,
      log.errorMessage || null,
      log.sentAt ? new Date(log.sentAt).toISOString() : null
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update notification log status
   */
  updateNotificationLogStatus(
    id: number,
    status: 'sent' | 'failed' | 'retrying',
    errorMessage?: string
  ): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare(`
      UPDATE notification_log
      SET status = ?, attempts = attempts + 1, error_message = ?, sent_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, errorMessage || null, id);
  }

  // ==================== BROKER ACCOUNT METHODS ====================

  /**
   * Get all broker accounts for a user
   */
  getBrokerAccounts(userId: string = 'default'): BrokerAccount[] {
    if (!this.db) throw new Error('Database not initialized');

    const accounts = this.db.prepare(`
      SELECT * FROM broker_accounts WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    return accounts.map(acc => ({
      id: acc.id,
      userId: acc.user_id,
      broker: acc.broker,
      accountId: acc.account_id,
      name: acc.name,
      status: acc.status || 'disconnected',
      credentials: acc.credentials,
      isActive: Boolean(acc.is_active),
      autoTradeEnabled: Boolean(acc.auto_trade_enabled),
      createdAt: new Date(acc.created_at),
      updatedAt: new Date(acc.updated_at)
    }));
  }

  /**
   * Get a specific broker account
   */
  getBrokerAccountById(id: number): BrokerAccount | null {
    if (!this.db) throw new Error('Database not initialized');

    const acc = this.db.prepare(`
      SELECT * FROM broker_accounts WHERE id = ?
    `).get(id) as any;

    if (!acc) return null;

    return {
      id: acc.id,
      userId: acc.user_id,
      broker: acc.broker,
      accountId: acc.account_id,
      credentials: acc.credentials,
      isActive: Boolean(acc.is_active),
      autoTradeEnabled: Boolean(acc.auto_trade_enabled),
      createdAt: new Date(acc.created_at),
      updatedAt: new Date(acc.updated_at)
    };
  }

  /**
   * Insert a broker account
   */
  insertBrokerAccount(account: Omit<BrokerAccount, 'id' | 'createdAt' | 'updatedAt'>): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO broker_accounts (
        user_id, broker, account_id, name, status, credentials, is_active, auto_trade_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      account.userId,
      account.broker,
      account.accountId,
      account.name || null,
      account.status || 'disconnected',
      account.credentials,
      account.isActive ? 1 : 0,
      account.autoTradeEnabled ? 1 : 0
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update broker account
   */
  updateBrokerAccount(id: number, updates: Partial<BrokerAccount>): void {
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.credentials !== undefined) {
      updateFields.push('credentials = ?');
      values.push(updates.credentials);
    }
    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }
    if (updates.autoTradeEnabled !== undefined) {
      updateFields.push('auto_trade_enabled = ?');
      values.push(updates.autoTradeEnabled ? 1 : 0);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`
      UPDATE broker_accounts SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...values);
  }

  /**
   * Update broker credentials (helper method for OAuth)
   */
  updateBrokerCredentials(id: number, credentials: any): void {
    if (!this.db) throw new Error('Database not initialized');

    const credentialsJson = typeof credentials === 'string' ? credentials : JSON.stringify(credentials);

    this.db.prepare(`
      UPDATE broker_accounts
      SET credentials = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(credentialsJson, id);
  }

  /**
   * Delete broker account
   */
  deleteBrokerAccount(id: number): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.prepare('DELETE FROM broker_accounts WHERE id = ?').run(id);
  }

  // ==================== BROKER ORDER METHODS ====================

  /**
   * Insert a broker order
   */
  insertBrokerOrder(order: Omit<BrokerOrder, 'id' | 'createdAt' | 'updatedAt'>): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO broker_orders (
        watchlist_stock_id, broker_account_id, broker, broker_order_id, symbol, exchange,
        order_type, side, quantity, price, trigger_price, status, filled_quantity,
        average_price, order_timestamp, execution_timestamp, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      order.watchlistStockId || null,
      order.brokerAccountId,
      order.broker,
      order.brokerOrderId || null,
      order.symbol,
      order.exchange,
      order.orderType,
      order.side,
      order.quantity,
      order.price || null,
      order.triggerPrice || null,
      order.status,
      order.filledQuantity,
      order.averagePrice || null,
      order.orderTimestamp ? new Date(order.orderTimestamp).toISOString() : null,
      order.executionTimestamp ? new Date(order.executionTimestamp).toISOString() : null,
      order.errorMessage || null
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update broker order status
   */
  updateBrokerOrder(id: number, updates: Partial<BrokerOrder>): void {
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.brokerOrderId !== undefined) {
      updateFields.push('broker_order_id = ?');
      values.push(updates.brokerOrderId);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.filledQuantity !== undefined) {
      updateFields.push('filled_quantity = ?');
      values.push(updates.filledQuantity);
    }
    if (updates.averagePrice !== undefined) {
      updateFields.push('average_price = ?');
      values.push(updates.averagePrice);
    }
    if (updates.executionTimestamp !== undefined) {
      updateFields.push('execution_timestamp = ?');
      values.push(updates.executionTimestamp ? new Date(updates.executionTimestamp).toISOString() : null);
    }
    if (updates.errorMessage !== undefined) {
      updateFields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`
      UPDATE broker_orders SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...values);
  }

  /**
   * Get orders for a watchlist stock
   */
  getOrdersForWatchlistStock(watchlistStockId: number): BrokerOrder[] {
    if (!this.db) throw new Error('Database not initialized');

    const orders = this.db.prepare(`
      SELECT * FROM broker_orders WHERE watchlist_stock_id = ? ORDER BY created_at DESC
    `).all(watchlistStockId) as any[];

    return orders.map(ord => this.mapBrokerOrder(ord));
  }

  /**
   * Get all active orders
   */
  getActiveBrokerOrders(): BrokerOrder[] {
    if (!this.db) throw new Error('Database not initialized');

    const orders = this.db.prepare(`
      SELECT * FROM broker_orders
      WHERE status IN ('PENDING', 'OPEN')
      ORDER BY created_at DESC
    `).all() as any[];

    return orders.map(ord => this.mapBrokerOrder(ord));
  }

  private mapBrokerOrder(ord: any): BrokerOrder {
    return {
      id: ord.id,
      watchlistStockId: ord.watchlist_stock_id,
      brokerAccountId: ord.broker_account_id,
      broker: ord.broker,
      brokerOrderId: ord.broker_order_id,
      symbol: ord.symbol,
      exchange: ord.exchange,
      orderType: ord.order_type,
      side: ord.side,
      quantity: ord.quantity,
      price: ord.price,
      triggerPrice: ord.trigger_price,
      status: ord.status,
      filledQuantity: ord.filled_quantity,
      averagePrice: ord.average_price,
      orderTimestamp: ord.order_timestamp ? new Date(ord.order_timestamp) : undefined,
      executionTimestamp: ord.execution_timestamp ? new Date(ord.execution_timestamp) : undefined,
      errorMessage: ord.error_message,
      createdAt: new Date(ord.created_at),
      updatedAt: new Date(ord.updated_at)
    };
  }

  // ==================== BROKER POSITION METHODS ====================

  /**
   * Upsert broker position
   */
  upsertBrokerPosition(position: Omit<BrokerPosition, 'id' | 'lastUpdated'>): void {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO broker_positions (
        broker_account_id, symbol, exchange, quantity, average_price, current_price, pnl, pnl_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(broker_account_id, symbol, exchange) DO UPDATE SET
        quantity = excluded.quantity,
        average_price = excluded.average_price,
        current_price = excluded.current_price,
        pnl = excluded.pnl,
        pnl_percent = excluded.pnl_percent,
        last_updated = CURRENT_TIMESTAMP
    `);

    stmt.run(
      position.brokerAccountId,
      position.symbol,
      position.exchange,
      position.quantity,
      position.averagePrice,
      position.currentPrice || null,
      position.pnl || null,
      position.pnlPercent || null
    );
  }

  /**
   * Get positions for a broker account
   */
  getBrokerPositions(brokerAccountId: number): BrokerPosition[] {
    if (!this.db) throw new Error('Database not initialized');

    const positions = this.db.prepare(`
      SELECT * FROM broker_positions WHERE broker_account_id = ? ORDER BY symbol
    `).all(brokerAccountId) as any[];

    return positions.map(pos => ({
      id: pos.id,
      brokerAccountId: pos.broker_account_id,
      symbol: pos.symbol,
      exchange: pos.exchange,
      quantity: pos.quantity,
      averagePrice: pos.average_price,
      currentPrice: pos.current_price,
      pnl: pos.pnl,
      pnlPercent: pos.pnl_percent,
      lastUpdated: new Date(pos.last_updated)
    }));
  }

  // ==================== CUSTOM WATCHLIST METHODS ====================

  /**
   * Get all custom watchlists for a user
   */
  getCustomWatchlists(userId: string = 'default'): CustomWatchlist[] {
    if (!this.db) throw new Error('Database not initialized');

    const watchlists = this.db.prepare(`
      SELECT * FROM custom_watchlists WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as any[];

    return watchlists.map(wl => ({
      id: wl.id,
      userId: wl.user_id,
      name: wl.name,
      description: wl.description,
      isActive: Boolean(wl.is_active),
      createdAt: new Date(wl.created_at),
      updatedAt: new Date(wl.updated_at)
    }));
  }

  /**
   * Get custom watchlist by ID
   */
  getCustomWatchlistById(id: number): CustomWatchlist | null {
    if (!this.db) throw new Error('Database not initialized');

    const wl = this.db.prepare(`
      SELECT * FROM custom_watchlists WHERE id = ?
    `).get(id) as any;

    if (!wl) return null;

    return {
      id: wl.id,
      userId: wl.user_id,
      name: wl.name,
      description: wl.description,
      isActive: Boolean(wl.is_active),
      createdAt: new Date(wl.created_at),
      updatedAt: new Date(wl.updated_at)
    };
  }

  /**
   * Create a new custom watchlist
   */
  createCustomWatchlist(watchlist: Omit<CustomWatchlist, 'id' | 'createdAt' | 'updatedAt'>): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO custom_watchlists (user_id, name, description, is_active)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(
      watchlist.userId,
      watchlist.name,
      watchlist.description || null,
      watchlist.isActive ? 1 : 0
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update a custom watchlist
   */
  updateCustomWatchlist(id: number, updates: Partial<CustomWatchlist>): void {
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.isActive !== undefined) {
      updateFields.push('is_active = ?');
      values.push(updates.isActive ? 1 : 0);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`
      UPDATE custom_watchlists SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...values);
  }

  /**
   * Delete a custom watchlist (cascades to stocks)
   */
  deleteCustomWatchlist(id: number): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.prepare('DELETE FROM custom_watchlists WHERE id = ?').run(id);
  }

  /**
   * Get all stocks in a custom watchlist
   */
  getCustomWatchlistStocks(watchlistId: number): CustomWatchlistStock[] {
    if (!this.db) throw new Error('Database not initialized');

    const stocks = this.db.prepare(`
      SELECT * FROM custom_watchlist_stocks WHERE watchlist_id = ? ORDER BY added_at DESC
    `).all(watchlistId) as any[];

    return stocks.map(stock => this.mapCustomWatchlistStock(stock));
  }

  /**
   * Get all active custom watchlist stocks (for monitoring)
   */
  getAllActiveCustomWatchlistStocks(): CustomWatchlistStock[] {
    if (!this.db) throw new Error('Database not initialized');

    const stocks = this.db.prepare(`
      SELECT cws.* FROM custom_watchlist_stocks cws
      INNER JOIN custom_watchlists cw ON cws.watchlist_id = cw.id
      WHERE cw.is_active = 1 AND cws.status IN ('PENDING', 'TRIGGERED')
      ORDER BY cws.added_at DESC
    `).all() as any[];

    return stocks.map(stock => this.mapCustomWatchlistStock(stock));
  }

  /**
   * Add stock to custom watchlist (Phase 4: with source tracking)
   */
  addStockToCustomWatchlist(stock: Omit<CustomWatchlistStock, 'id' | 'addedAt' | 'updatedAt'>): number {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO custom_watchlist_stocks (
        watchlist_id, symbol, exchange, company_name,
        source, source_id, source_metadata,
        setup_type, timeframe,
        entry_price, entry_trigger, stop_loss, target_1, target_2, target_3,
        trailing_stop_percent, position_size_percent, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      stock.watchlistId,
      stock.symbol,
      stock.exchange,
      stock.companyName || null,
      stock.source || 'MANUAL',  // Default to MANUAL if not specified
      stock.sourceId || null,
      stock.sourceMetadata || null,
      stock.setupType || null,
      stock.timeframe || null,
      stock.entryPrice,
      stock.entryTrigger || null,
      stock.stopLoss,
      stock.target1,
      stock.target2 || null,
      stock.target3 || null,
      stock.trailingStopPercent || 1.0,
      stock.positionSizePercent || 1.0,
      stock.notes || null,
      stock.status
    );

    return info.lastInsertRowid as number;
  }

  /**
   * Update custom watchlist stock
   */
  updateCustomWatchlistStock(id: number, updates: Partial<CustomWatchlistStock>): void {
    if (!this.db) throw new Error('Database not initialized');

    const updateFields: string[] = [];
    const values: any[] = [];

    if (updates.entryPrice !== undefined) {
      updateFields.push('entry_price = ?');
      values.push(updates.entryPrice);
    }
    if (updates.entryTrigger !== undefined) {
      updateFields.push('entry_trigger = ?');
      values.push(updates.entryTrigger);
    }
    if (updates.stopLoss !== undefined) {
      updateFields.push('stop_loss = ?');
      values.push(updates.stopLoss);
    }
    if (updates.target1 !== undefined) {
      updateFields.push('target_1 = ?');
      values.push(updates.target1);
    }
    if (updates.target2 !== undefined) {
      updateFields.push('target_2 = ?');
      values.push(updates.target2);
    }
    if (updates.target3 !== undefined) {
      updateFields.push('target_3 = ?');
      values.push(updates.target3);
    }
    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.triggerPrice !== undefined) {
      updateFields.push('trigger_price = ?');
      values.push(updates.triggerPrice);
    }
    if (updates.triggerTime !== undefined) {
      updateFields.push('trigger_time = ?');
      values.push(updates.triggerTime ? new Date(updates.triggerTime).toISOString() : null);
    }
    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(updates.notes);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    this.db.prepare(`
      UPDATE custom_watchlist_stocks SET ${updateFields.join(', ')} WHERE id = ?
    `).run(...values);
  }

  /**
   * Delete stock from custom watchlist
   */
  deleteCustomWatchlistStock(id: number): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.prepare('DELETE FROM custom_watchlist_stocks WHERE id = ?').run(id);
  }

  /**
   * Update custom watchlist stock status
   */
  updateCustomWatchlistStockStatus(
    id: number,
    status: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED',
    triggerPrice?: number,
    triggerTime?: Date
  ): void {
    if (!this.db) throw new Error('Database not initialized');

    this.db.prepare(`
      UPDATE custom_watchlist_stocks
      SET status = ?, trigger_price = ?, trigger_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status,
      triggerPrice || null,
      triggerTime ? new Date(triggerTime).toISOString() : null,
      id
    );
  }

  /**
   * Map database row to CustomWatchlistStock
   */
  private mapCustomWatchlistStock(stock: any): CustomWatchlistStock {
    return {
      id: stock.id,
      watchlistId: stock.watchlist_id,
      symbol: stock.symbol,
      exchange: stock.exchange,
      companyName: stock.company_name,
      // Phase 4A: Source tracking
      source: stock.source as 'AUTO_SCAN' | 'MANUAL' | 'SCREENER' | undefined,
      sourceId: stock.source_id,
      sourceMetadata: stock.source_metadata,
      setupType: stock.setup_type,
      timeframe: stock.timeframe,
      entryPrice: stock.entry_price,
      entryTrigger: stock.entry_trigger,
      stopLoss: stock.stop_loss,
      target1: stock.target_1,
      target2: stock.target_2,
      target3: stock.target_3,
      trailingStopPercent: stock.trailing_stop_percent,
      positionSizePercent: stock.position_size_percent,
      notes: stock.notes,
      status: stock.status,
      triggerPrice: stock.trigger_price,
      triggerTime: stock.trigger_time ? new Date(stock.trigger_time) : undefined,
      addedAt: new Date(stock.added_at),
      updatedAt: new Date(stock.updated_at)
    };
  }

  // ==================== Phase 4B: Unified Watchlist Methods ====================

  /**
   * Get all watchlists with stock counts (unified system)
   * Returns watchlists with total count and counts by source
   */
  getWatchlistsWithCounts(userId: string = 'default'): Array<CustomWatchlist & {
    stockCount: number;
    autoScanCount: number;
    manualCount: number;
    screenerCount: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const watchlists = this.db.prepare(`
      SELECT
        w.*,
        COUNT(s.id) as stock_count,
        SUM(CASE WHEN s.source = 'AUTO_SCAN' THEN 1 ELSE 0 END) as auto_scan_count,
        SUM(CASE WHEN s.source = 'MANUAL' THEN 1 ELSE 0 END) as manual_count,
        SUM(CASE WHEN s.source = 'SCREENER' THEN 1 ELSE 0 END) as screener_count
      FROM custom_watchlists w
      LEFT JOIN custom_watchlist_stocks s ON w.id = s.watchlist_id
      WHERE w.user_id = ?
      GROUP BY w.id
      ORDER BY w.updated_at DESC
    `).all(userId) as any[];

    return watchlists.map(wl => ({
      id: wl.id,
      userId: wl.user_id,
      name: wl.name,
      description: wl.description,
      isActive: Boolean(wl.is_active),
      createdAt: new Date(wl.created_at),
      updatedAt: new Date(wl.updated_at),
      stockCount: wl.stock_count || 0,
      autoScanCount: wl.auto_scan_count || 0,
      manualCount: wl.manual_count || 0,
      screenerCount: wl.screener_count || 0
    }));
  }

  /**
   * Get custom watchlist stocks with optional source filtering (unified system)
   */
  getCustomWatchlistStocksFiltered(
    watchlistId: number,
    filters?: {
      source?: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';
      status?: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED';
    }
  ): CustomWatchlistStock[] {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT s.*
      FROM custom_watchlist_stocks s
      WHERE s.watchlist_id = ?
    `;

    const params: any[] = [watchlistId];

    if (filters?.source) {
      query += ` AND s.source = ?`;
      params.push(filters.source);
    }

    if (filters?.status) {
      query += ` AND s.status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY s.added_at DESC`;

    const stocks = this.db.prepare(query).all(...params) as any[];
    return stocks.map(stock => this.mapCustomWatchlistStock(stock));
  }

  /**
   * Add stock from auto-scan result to watchlist (unified system with source tracking)
   */
  addStockFromAutoScan(watchlistId: number, scanResultId: number): number {
    if (!this.db) throw new Error('Database not initialized');

    // Get scan result details
    const scan = this.db.prepare(`
      SELECT * FROM scan_results WHERE id = ?
    `).get(scanResultId) as any;

    if (!scan) {
      throw new Error(`Scan result not found: ${scanResultId}`);
    }

    // Check if stock already exists in this watchlist
    const exists = this.db.prepare(`
      SELECT id FROM custom_watchlist_stocks
      WHERE watchlist_id = ? AND symbol = ? AND exchange = ?
    `).get(watchlistId, scan.symbol, scan.exchange);

    if (exists) {
      throw new Error(`Stock ${scan.symbol} already exists in this watchlist`);
    }

    // Add stock with AUTO_SCAN source
    return this.addStockToCustomWatchlist({
      watchlistId,
      symbol: scan.symbol,
      exchange: scan.exchange,
      companyName: scan.company_name,
      source: 'AUTO_SCAN',
      sourceId: scanResultId,
      sourceMetadata: JSON.stringify({
        confidence: scan.confidence_score,
        strategy: scan.strategy,
        riskReward: scan.risk_reward_ratio,
        scanTime: scan.timestamp
      }),
      setupType: scan.strategy_type === 'INTRADAY' ? 'BREAKOUT' : 'PULLBACK', // Map strategy to setup type
      timeframe: scan.strategy_type,
      entryPrice: scan.entry_price,
      stopLoss: scan.stop_loss,
      target1: scan.target,
      trailingStopPercent: 1.0,
      positionSizePercent: 1.0,
      status: 'PENDING'
    });
  }

  /**
   * DEPRECATED: Get legacy EOD watchlist stocks (backward compatibility)
   * Use getCustomWatchlistStocksFiltered() with source='AUTO_SCAN' instead
   */
  getWatchlistStocksLegacy(): any[] {
    if (!this.db) throw new Error('Database not initialized');

    loggerService.warn('Using deprecated getWatchlistStocksLegacy(). Migrate to getCustomWatchlistStocksFiltered()');

    // Return stocks from "Auto-Scan Signals (Legacy)" watchlist
    const autoWatchlist = this.db.prepare(`
      SELECT id FROM custom_watchlists
      WHERE name = 'Auto-Scan Signals (Legacy)'
      LIMIT 1
    `).get() as { id: number } | undefined;

    if (!autoWatchlist) {
      return [];
    }

    return this.getCustomWatchlistStocksFiltered(autoWatchlist.id, { source: 'AUTO_SCAN' });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      loggerService.info('Database connection closed');
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
