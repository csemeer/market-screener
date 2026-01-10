/**
 * Create Sample Backtest with Full Chart Data
 *
 * Run this script to create a sample backtest with complete indicator data
 * for proper chart visualization.
 *
 * Usage:
 *   cd backend
 *   node create_sample_backtest.js
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
console.log(`\n📊 Creating Sample Backtest Data`);
console.log(`Database: ${dbPath}\n`);

const db = new Database(dbPath);

try {
  // First, create a backtest run
  console.log('Step 1: Creating backtest run...');

  const insertRun = db.prepare(`
    INSERT INTO backtest_runs (
      scalper_id, name, description, backtest_type,
      start_date, end_date, initial_capital, final_capital,
      total_return, total_return_percent,
      total_trades, winning_trades, losing_trades, win_rate,
      gross_profit, gross_loss, net_profit, profit_factor,
      max_drawdown, max_drawdown_percent,
      sharpe_ratio, sortino_ratio,
      avg_win, avg_loss, largest_win, largest_loss,
      avg_trade_duration_minutes, total_brokerage,
      status, equity_curve, daily_returns,
      started_at, completed_at
    ) VALUES (
      3, 'AAPL Chart Demo - Full Indicators', 'Complete sample with all indicator data for chart visualization',
      'PERIOD', '2025-12-01', '2025-12-05',
      100000, 100820, 820, 0.82,
      12, 9, 3, 75.0,
      1080, -260, 820, 4.15,
      105, 0.105,
      1.5, 1.8,
      120, 86.67, 125, 105,
      40, 60,
      'COMPLETED',
      '[{"timestamp":"2025-12-01T09:30:00.000Z","equity":100000,"cash":100000,"positions":0},{"timestamp":"2025-12-01T10:15:00.000Z","equity":100125,"cash":84945,"positions":15180},{"timestamp":"2025-12-01T10:45:00.000Z","equity":100120,"cash":100120,"positions":0},{"timestamp":"2025-12-01T11:30:00.000Z","equity":100045,"cash":84965,"positions":15080},{"timestamp":"2025-12-01T12:15:00.000Z","equity":100040,"cash":100040,"positions":0},{"timestamp":"2025-12-01T14:00:00.000Z","equity":100165,"cash":84915,"positions":15250},{"timestamp":"2025-12-01T14:30:00.000Z","equity":100160,"cash":100160,"positions":0},{"timestamp":"2025-12-02T09:45:00.000Z","equity":100285,"cash":84835,"points":15450},{"timestamp":"2025-12-02T10:30:00.000Z","equity":100280,"cash":100280,"positions":0},{"timestamp":"2025-12-02T13:00:00.000Z","equity":100180,"cash":84780,"positions":15400},{"timestamp":"2025-12-02T13:45:00.000Z","equity":100175,"cash":100175,"positions":0},{"timestamp":"2025-12-03T10:15:00.000Z","equity":100300,"cash":84925,"positions":15375},{"timestamp":"2025-12-03T11:00:00.000Z","equity":100295,"cash":100295,"positions":0},{"timestamp":"2025-12-03T14:30:00.000Z","equity":100420,"cash":84920,"positions":15500},{"timestamp":"2025-12-03T15:15:00.000Z","equity":100415,"cash":100415,"positions":0},{"timestamp":"2025-12-04T09:30:00.000Z","equity":100540,"cash":84915,"positions":15625},{"timestamp":"2025-12-04T10:15:00.000Z","equity":100535,"cash":100535,"positions":0},{"timestamp":"2025-12-04T14:00:00.000Z","equity":100660,"cash":84910,"positions":15750},{"timestamp":"2025-12-04T14:45:00.000Z","equity":100655,"cash":100655,"positions":0},{"timestamp":"2025-12-05T10:30:00.000Z","equity":100575,"cash":84905,"positions":15670},{"timestamp":"2025-12-05T11:15:00.000Z","equity":100575,"cash":100575,"positions":0},{"timestamp":"2025-12-05T13:00:00.000Z","equity":100700,"cash":84855,"positions":15845},{"timestamp":"2025-12-05T13:45:00.000Z","equity":100695,"cash":100695,"positions":0},{"timestamp":"2025-12-05T14:30:00.000Z","equity":100820,"cash":84870,"positions":15950},{"timestamp":"2025-12-05T15:15:00.000Z","equity":100820,"cash":100820,"positions":0}]',
      '[]',
      datetime('now'), datetime('now')
    )
  `);

  const runResult = insertRun.run();
  const runId = runResult.lastInsertRowid;

  console.log(`✓ Created backtest run ID: ${runId}`);
  console.log(`  Name: AAPL Chart Demo - Full Indicators`);
  console.log(`  Period: Dec 1-5, 2025\n`);

  // Create trades with comprehensive indicator data
  console.log('Step 2: Inserting 12 trades with full indicator data...');

  const trades = [
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 150.50, entry_time: '2025-12-01 10:15:00', exit_price: 151.75, exit_time: '2025-12-01 10:45:00',
      stop_loss: 149.00, target: 152.00, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.83,
      entry_signals: '[{"signal":"BUY","reason":"RSI oversold + BB touch","confidence":75}]',
      indicators_data: JSON.stringify({
        close: 150.50, open: 150.20, high: 150.80, low: 150.10, volume: 1500000,
        rsi: 32.5, ema9: 149.80, ema21: 148.50, ema50: 147.00,
        bb_upper: 152.00, bb_middle: 150.00, bb_lower: 148.00,
        macd: -0.5, macd_signal: -0.8, macd_histogram: 0.3,
        vwap: 150.20, adx: 25
      }),
      duration_minutes: 30
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 151.00, entry_time: '2025-12-01 11:30:00', exit_price: 150.25, exit_time: '2025-12-01 12:15:00',
      stop_loss: 149.50, target: 152.50, status: 'CLOSED', close_reason: 'STOP_LOSS',
      gross_pnl: -75.00, brokerage: 5.00, net_pnl: -80.00, pnl_percent: -0.53,
      entry_signals: '[{"signal":"BUY","reason":"EMA crossover","confidence":65}]',
      indicators_data: JSON.stringify({
        close: 151.00, open: 150.80, high: 151.20, low: 150.60, volume: 1200000,
        rsi: 55.0, ema9: 150.50, ema21: 149.80, ema50: 148.50,
        bb_upper: 153.00, bb_middle: 151.00, bb_lower: 149.00,
        macd: 0.2, macd_signal: 0.1, macd_histogram: 0.1,
        vwap: 150.80, adx: 22
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 150.25, entry_time: '2025-12-01 14:00:00', exit_price: 151.50, exit_time: '2025-12-01 14:30:00',
      stop_loss: 148.75, target: 151.75, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.83,
      entry_signals: '[{"signal":"BUY","reason":"MACD bullish crossover","confidence":80}]',
      indicators_data: JSON.stringify({
        close: 150.25, open: 150.00, high: 150.50, low: 149.90, volume: 1800000,
        rsi: 45.0, ema9: 150.00, ema21: 149.50, ema50: 148.80,
        bb_upper: 152.50, bb_middle: 150.50, bb_lower: 148.50,
        macd: 0.3, macd_signal: 0.0, macd_histogram: 0.3,
        vwap: 150.50, adx: 28
      }),
      duration_minutes: 30
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 151.50, entry_time: '2025-12-02 09:45:00', exit_price: 152.75, exit_time: '2025-12-02 10:30:00',
      stop_loss: 150.00, target: 153.00, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.82,
      entry_signals: '[{"signal":"BUY","reason":"Strong momentum + RSI","confidence":70}]',
      indicators_data: JSON.stringify({
        close: 151.50, open: 151.20, high: 151.80, low: 151.00, volume: 1600000,
        rsi: 58.0, ema9: 151.00, ema21: 150.20, ema50: 149.50,
        bb_upper: 153.50, bb_middle: 151.50, bb_lower: 149.50,
        macd: 0.5, macd_signal: 0.3, macd_histogram: 0.2,
        vwap: 151.20, adx: 32
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 152.00, entry_time: '2025-12-02 13:00:00', exit_price: 151.00, exit_time: '2025-12-02 13:45:00',
      stop_loss: 150.50, target: 153.50, status: 'CLOSED', close_reason: 'STOP_LOSS',
      gross_pnl: -100.00, brokerage: 5.00, net_pnl: -105.00, pnl_percent: -0.66,
      entry_signals: '[{"signal":"BUY","reason":"Breakout attempt","confidence":60}]',
      indicators_data: JSON.stringify({
        close: 152.00, open: 151.80, high: 152.30, low: 151.60, volume: 1400000,
        rsi: 62.0, ema9: 151.80, ema21: 151.00, ema50: 150.20,
        bb_upper: 154.00, bb_middle: 152.00, bb_lower: 150.00,
        macd: 0.4, macd_signal: 0.5, macd_histogram: -0.1,
        vwap: 151.80, adx: 30
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 151.25, entry_time: '2025-12-03 10:15:00', exit_price: 152.50, exit_time: '2025-12-03 11:00:00',
      stop_loss: 149.75, target: 152.75, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.83,
      entry_signals: '[{"signal":"BUY","reason":"RSI bounce + VWAP","confidence":85}]',
      indicators_data: JSON.stringify({
        close: 151.25, open: 151.00, high: 151.50, low: 150.90, volume: 1700000,
        rsi: 38.0, ema9: 151.00, ema21: 150.50, ema50: 149.80,
        bb_upper: 153.00, bb_middle: 151.00, bb_lower: 149.00,
        macd: 0.1, macd_signal: -0.1, macd_histogram: 0.2,
        vwap: 151.00, adx: 26
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 152.50, entry_time: '2025-12-03 14:30:00', exit_price: 153.75, exit_time: '2025-12-03 15:15:00',
      stop_loss: 151.00, target: 154.00, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.82,
      entry_signals: '[{"signal":"BUY","reason":"Uptrend continuation","confidence":75}]',
      indicators_data: JSON.stringify({
        close: 152.50, open: 152.20, high: 152.80, low: 152.00, volume: 1550000,
        rsi: 65.0, ema9: 152.20, ema21: 151.50, ema50: 150.80,
        bb_upper: 154.50, bb_middle: 152.50, bb_lower: 150.50,
        macd: 0.7, macd_signal: 0.5, macd_histogram: 0.2,
        vwap: 152.30, adx: 35
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 153.00, entry_time: '2025-12-04 09:30:00', exit_price: 154.25, exit_time: '2025-12-04 10:15:00',
      stop_loss: 151.50, target: 154.50, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.82,
      entry_signals: '[{"signal":"BUY","reason":"Gap up + momentum","confidence":80}]',
      indicators_data: JSON.stringify({
        close: 153.00, open: 152.60, high: 153.30, low: 152.50, volume: 1900000,
        rsi: 68.0, ema9: 152.80, ema21: 152.00, ema50: 151.20,
        bb_upper: 155.00, bb_middle: 153.00, bb_lower: 151.00,
        macd: 0.9, macd_signal: 0.7, macd_histogram: 0.2,
        vwap: 153.10, adx: 38
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 154.00, entry_time: '2025-12-04 14:00:00', exit_price: 155.25, exit_time: '2025-12-04 14:45:00',
      stop_loss: 152.50, target: 155.50, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.81,
      entry_signals: '[{"signal":"BUY","reason":"Volume breakout","confidence":90}]',
      indicators_data: JSON.stringify({
        close: 154.00, open: 153.70, high: 154.30, low: 153.50, volume: 2100000,
        rsi: 72.0, ema9: 153.50, ema21: 152.50, ema50: 151.50,
        bb_upper: 156.00, bb_middle: 154.00, bb_lower: 152.00,
        macd: 1.1, macd_signal: 0.8, macd_histogram: 0.3,
        vwap: 154.20, adx: 40
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 155.00, entry_time: '2025-12-05 10:30:00', exit_price: 154.25, exit_time: '2025-12-05 11:15:00',
      stop_loss: 153.50, target: 156.50, status: 'CLOSED', close_reason: 'STOP_LOSS',
      gross_pnl: -75.00, brokerage: 5.00, net_pnl: -80.00, pnl_percent: -0.52,
      entry_signals: '[{"signal":"BUY","reason":"Continuation play","confidence":70}]',
      indicators_data: JSON.stringify({
        close: 155.00, open: 154.80, high: 155.30, low: 154.50, volume: 1300000,
        rsi: 75.0, ema9: 154.20, ema21: 153.00, ema50: 152.00,
        bb_upper: 156.50, bb_middle: 154.50, bb_lower: 152.50,
        macd: 1.0, macd_signal: 1.1, macd_histogram: -0.1,
        vwap: 154.80, adx: 42
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 154.25, entry_time: '2025-12-05 13:00:00', exit_price: 155.50, exit_time: '2025-12-05 13:45:00',
      stop_loss: 152.75, target: 155.75, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.81,
      entry_signals: '[{"signal":"BUY","reason":"Dip buy + RSI","confidence":80}]',
      indicators_data: JSON.stringify({
        close: 154.25, open: 154.00, high: 154.50, low: 153.80, volume: 1600000,
        rsi: 52.0, ema9: 154.00, ema21: 153.20, ema50: 152.20,
        bb_upper: 156.00, bb_middle: 154.00, bb_lower: 152.00,
        macd: 0.8, macd_signal: 0.9, macd_histogram: -0.1,
        vwap: 154.50, adx: 36
      }),
      duration_minutes: 45
    },
    {
      backtest_run_id: runId, scalper_id: 3, symbol: 'AAPL', exchange: 'NASDAQ', side: 'BUY', quantity: 100,
      entry_price: 155.50, entry_time: '2025-12-05 14:30:00', exit_price: 156.75, exit_time: '2025-12-05 15:15:00',
      stop_loss: 154.00, target: 157.00, status: 'CLOSED', close_reason: 'TARGET_HIT',
      gross_pnl: 125.00, brokerage: 5.00, net_pnl: 120.00, pnl_percent: 0.80,
      entry_signals: '[{"signal":"BUY","reason":"EOD rally + volume","confidence":85}]',
      indicators_data: JSON.stringify({
        close: 155.50, open: 155.20, high: 155.80, low: 155.00, volume: 2000000,
        rsi: 70.0, ema9: 155.00, ema21: 154.00, ema50: 153.00,
        bb_upper: 157.50, bb_middle: 155.50, bb_lower: 153.50,
        macd: 1.2, macd_signal: 1.0, macd_histogram: 0.2,
        vwap: 155.70, adx: 38
      }),
      duration_minutes: 45
    }
  ];

  const insertTrade = db.prepare(`
    INSERT INTO backtest_trades (
      backtest_run_id, scalper_id, symbol, exchange, side, quantity,
      entry_price, entry_time, exit_price, exit_time,
      stop_loss, target, status, close_reason,
      gross_pnl, brokerage, net_pnl, pnl_percent,
      entry_signals, indicators_data, duration_minutes
    ) VALUES (
      @backtest_run_id, @scalper_id, @symbol, @exchange, @side, @quantity,
      @entry_price, @entry_time, @exit_price, @exit_time,
      @stop_loss, @target, @status, @close_reason,
      @gross_pnl, @brokerage, @net_pnl, @pnl_percent,
      @entry_signals, @indicators_data, @duration_minutes
    )
  `);

  const insertMany = db.transaction((trades) => {
    for (const trade of trades) {
      insertTrade.run(trade);
    }
  });

  insertMany(trades);

  console.log(`✓ Inserted ${trades.length} trades\n`);

  console.log('✅ SUCCESS!\n');
  console.log('📈 Backtest Summary:');
  console.log('   Symbol: AAPL (NASDAQ)');
  console.log('   Period: Dec 1-5, 2025');
  console.log('   Total Trades: 12');
  console.log('   Winning Trades: 9 (75%)');
  console.log('   Losing Trades: 3 (25%)');
  console.log('   Initial Capital: ₹1,00,000');
  console.log('   Final Capital: ₹1,00,820');
  console.log('   Net Profit: ₹820 (0.82%)');
  console.log('   Max Drawdown: 0.105%\n');

  console.log('🎯 Next Steps:');
  console.log('   1. Refresh your browser (press F5)');
  console.log('   2. Go to: Auto-Scalper → Backtest Results');
  console.log('   3. Look for: "AAPL Chart Demo - Full Indicators"');
  console.log('   4. Click "Chart Analysis" tab\n');

  console.log('📊 You will see:');
  console.log('   ✓ Equity Curve: Capital growth over 25 data points');
  console.log('   ✓ Price Chart: AAPL price from $150.50 → $156.75');
  console.log('   ✓ EMA Overlays: 9, 21, 50 periods');
  console.log('   ✓ Bollinger Bands: Upper, Middle, Lower');
  console.log('   ✓ VWAP Line: Institutional levels');
  console.log('   ✓ Trade Markers: 12 entry/exit points');
  console.log('   ✓ RSI Panel: Values from 32-75');
  console.log('   ✓ MACD Panel: Histogram with signal crossovers\n');

} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('\nTroubleshooting:');
  console.error('   1. Make sure you are in the backend directory');
  console.error('   2. Verify database exists: data/autoscan.db');
  console.error('   3. Check backend is built: npm run build');
  process.exit(1);
} finally {
  db.close();
}
