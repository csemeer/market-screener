import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
const db = new Database(dbPath);

console.log('Running Strategy Management Migration...\n');

try {
  // Create trading_strategies table
  console.log('Creating trading_strategies table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS trading_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('MEAN_REVERSION', 'TREND_FOLLOWING', 'VOLUME_BREAKOUT', 'MOMENTUM', 'CUSTOM')),

      entry_conditions TEXT NOT NULL,
      exit_conditions TEXT NOT NULL,
      indicators_config TEXT NOT NULL,

      is_system BOOLEAN NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT 1,
      created_by TEXT,
      version INTEGER NOT NULL DEFAULT 1,

      total_uses INTEGER NOT NULL DEFAULT 0,
      avg_win_rate REAL,
      avg_return_percent REAL,

      recommended_timeframes TEXT,
      recommended_stop_loss_percent REAL,
      recommended_target_percent REAL,
      min_capital_required REAL,

      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ trading_strategies table created');

  // Create indexes
  console.log('Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_trading_strategies_category ON trading_strategies(category);
    CREATE INDEX IF NOT EXISTS idx_trading_strategies_active ON trading_strategies(is_active);
    CREATE INDEX IF NOT EXISTS idx_trading_strategies_system ON trading_strategies(is_system);
  `);
  console.log('✓ Indexes created');

  // Add strategy_id column to scalper_configs
  console.log('Adding strategy_id column to scalper_configs...');
  try {
    db.exec(`
      ALTER TABLE scalper_configs ADD COLUMN strategy_id INTEGER REFERENCES trading_strategies(id);
    `);
    console.log('✓ strategy_id column added');
  } catch (e: any) {
    if (e.message.includes('duplicate column name')) {
      console.log('✓ strategy_id column already exists');
    } else {
      throw e;
    }
  }

  console.log('\n✓ Migration completed successfully!\n');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
