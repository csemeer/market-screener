import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
const db = new Database(dbPath);

console.log('Seeding Demo Backtest Scalpers...\n');

// Check if backtest scalpers already exist
const existingCount = db.prepare(`
  SELECT COUNT(*) as count
  FROM scalper_configs
  WHERE name LIKE '%Backtest Demo%'
`).get() as { count: number };

if (existingCount.count > 0) {
  console.log(`✓ Found ${existingCount.count} existing backtest demo scalpers - skipping seeding\n`);
  db.close();
  process.exit(0);
}

// Insert Demo Backtest Scalpers
const insertScalper = db.prepare(`
  INSERT INTO scalper_configs (
    name, enabled, broker, account_id, auto_trade,
    stock_selection_method, stock_symbols, max_stocks,
    strategy_name, timeframe, indicators_config, entry_conditions, exit_conditions,
    max_position_size, max_positions_open, max_daily_loss, max_daily_trades,
    position_sizing_method, risk_per_trade,
    trading_start_time, trading_end_time,
    avoid_first_minutes, avoid_last_minutes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  // Demo 1: 30-Day Period NSE Mean Reversion
  insertScalper.run(
    'Backtest Demo 1: 30-Day Period NSE',
    0, // disabled
    'zerodha',
    'backtest_demo',
    0,
    'MANUAL',
    JSON.stringify(['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS']),
    5,
    'mean_reversion',
    '5m',
    JSON.stringify({
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      ema: { enabled: true, periods: [9, 21] }
    }),
    JSON.stringify({
      type: 'mean_reversion',
      rsi_oversold: true,
      bollinger_lower_touch: true,
      min_confidence: 60
    }),
    JSON.stringify({
      rsi_overbought: true,
      bollinger_upper_touch: true,
      trailing_stop: { enabled: true, percent: 2 }
    }),
    50000,
    3,
    5000,
    10,
    'RISK_BASED',
    2,
    '09:15',
    '15:30',
    15,
    15
  );
  console.log('✓ Created Backtest Demo 1: 30-Day Period NSE');

  // Demo 2: 90-Day Period NASDAQ Trend Following
  insertScalper.run(
    'Backtest Demo 2: 90-Day Period NASDAQ',
    0,
    'zerodha',
    'backtest_demo',
    0,
    'MANUAL',
    JSON.stringify(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']),
    5,
    'trend_following',
    '5m',
    JSON.stringify({
      ema: { enabled: true, periods: [20, 50, 200] },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      adx: { enabled: true, period: 14, threshold: 25 }
    }),
    JSON.stringify({
      type: 'trend_following',
      ema_bullish_cross: true,
      macd_bullish: true,
      adx_strong_trend: true,
      min_confidence: 70
    }),
    JSON.stringify({
      ema_bearish_cross: true,
      trailing_stop: { enabled: true, percent: 3 },
      time_based: { max_hold_hours: 48 }
    }),
    75000,
    2,
    7500,
    8,
    'RISK_BASED',
    2.5,
    '09:30',
    '16:00',
    30,
    30
  );
  console.log('✓ Created Backtest Demo 2: 90-Day Period NASDAQ');

  // Demo 3: Last Market Day Intraday NSE Volume Breakout
  insertScalper.run(
    'Backtest Demo 3: Last Market Day Intraday NSE',
    0,
    'zerodha',
    'backtest_demo',
    0,
    'MANUAL',
    JSON.stringify(['NIFTY50_TOP10']),
    10,
    'volume_breakout',
    '5m',
    JSON.stringify({
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 2 },
      vwap: { enabled: true },
      rsi: { enabled: true, period: 14 }
    }),
    JSON.stringify({
      type: 'volume_breakout',
      volume_surge: true,
      price_above_vwap: true,
      rsi_bullish: true,
      min_confidence: 65
    }),
    JSON.stringify({
      time_based: { max_hold_minutes: 120 },
      trailing_stop: { enabled: true, percent: 1.5 },
      target_percent: 3
    }),
    30000,
    5,
    3000,
    15,
    'FIXED',
    1.5,
    '09:15',
    '15:30',
    15,
    15
  );
  console.log('✓ Created Backtest Demo 3: Last Market Day Intraday NSE');

  // Demo 4: Last Market Day Intraday NASDAQ Momentum
  insertScalper.run(
    'Backtest Demo 4: Last Market Day Intraday NASDAQ',
    0,
    'zerodha',
    'backtest_demo',
    0,
    'MANUAL',
    JSON.stringify(['QQQ_TOP10']),
    10,
    'momentum',
    '5m',
    JSON.stringify({
      rsi: { enabled: true, period: 14 },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      volume: { enabled: true, ma_period: 20 }
    }),
    JSON.stringify({
      type: 'momentum',
      rsi_momentum: true,
      macd_bullish_cross: true,
      volume_confirmation: true,
      min_confidence: 68
    }),
    JSON.stringify({
      rsi_overbought: true,
      macd_bearish_cross: true,
      time_based: { max_hold_minutes: 90 },
      trailing_stop: { enabled: true, percent: 2 }
    }),
    40000,
    4,
    4000,
    12,
    'RISK_BASED',
    2,
    '09:30',
    '16:00',
    30,
    30
  );
  console.log('✓ Created Backtest Demo 4: Last Market Day Intraday NASDAQ');

  console.log('\n✓ Successfully seeded 4 demo backtest scalpers!\n');
} catch (error) {
  console.error('Error seeding backtest demos:', error);
  process.exit(1);
} finally {
  db.close();
}
