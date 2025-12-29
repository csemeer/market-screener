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

    loggerService.info('Database tables created successfully');
  }

  /**
   * Insert a new scan result
   */
  insertScanResult(result: ScanResult): number {
    if (!this.db) throw new Error('Database not initialized');

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
