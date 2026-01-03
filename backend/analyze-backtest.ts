import Database from 'better-sqlite3';

const db = new Database('data/autoscan.db');

console.log('Backtest Analysis\n');
console.log('=================\n');

// Get recent backtest runs
const runs: any[] = db.prepare(`
  SELECT id, name, total_trades, winning_trades, losing_trades,
         total_return_percent, max_drawdown_percent, avg_win, avg_loss,
         total_brokerage
  FROM backtest_runs
  WHERE status = 'COMPLETED'
  ORDER BY id DESC
  LIMIT 3
`).all();

if (runs.length === 0) {
  console.log('No completed backtests found. Run a backtest first.');
  db.close();
  process.exit(0);
}

runs.forEach((run: any, idx: number) => {
  console.log(`\n${idx + 1}. ${run.name}`);
  console.log(`   Run ID: ${run.id}`);
  console.log(`   Total Trades: ${run.total_trades}`);

  if (run.total_trades > 0) {
    const winRate = ((run.winning_trades / run.total_trades) * 100).toFixed(1);
    console.log(`   Winners: ${run.winning_trades}, Losers: ${run.losing_trades}`);
    console.log(`   Win Rate: ${winRate}%`);
    console.log(`   Return: ${run.total_return_percent?.toFixed(2)}%`);
    console.log(`   Avg Win: ₹${run.avg_win?.toFixed(2)}`);
    console.log(`   Avg Loss: ₹${run.avg_loss?.toFixed(2)}`);
    console.log(`   Total Brokerage: ₹${run.total_brokerage?.toFixed(2)}`);

    // Get close reasons
    const closeReasons: any[] = db.prepare(`
      SELECT close_reason, COUNT(*) as count,
             AVG(net_pnl) as avg_pnl
      FROM backtest_trades
      WHERE backtest_run_id = ?
      GROUP BY close_reason
    `).all(run.id);

    console.log(`   Trade Exit Reasons:`);
    closeReasons.forEach((cr: any) => {
      console.log(`     - ${cr.close_reason}: ${cr.count} trades (Avg P/L: ₹${cr.avg_pnl?.toFixed(2)})`);
    });
  } else {
    console.log('   No trades generated!');
  }
});

// Check current scalper configurations
console.log('\n\nCurrent Scalper Parameters (Tunable):');
console.log('=====================================\n');

const scalpers: any[] = db.prepare(`
  SELECT id, name, entry_conditions, exit_conditions,
         max_position_size, max_positions_open, risk_per_trade, position_sizing_method
  FROM scalper_configs
  WHERE name LIKE '%Backtest Demo%'
`).all();

scalpers.forEach((s: any) => {
  const entry = JSON.parse(s.entry_conditions);
  const exit = JSON.parse(s.exit_conditions);

  console.log(`${s.name}:`);
  console.log(`  Strategy Type: ${entry.type}`);
  console.log(`  Stop Loss: ${exit.stopLossPercent}%`);
  console.log(`  Target: ${exit.targetPercent}%`);
  console.log(`  Risk/Reward Ratio: 1:${(exit.targetPercent / exit.stopLossPercent).toFixed(2)}`);
  console.log(`  Max Position Size: ₹${s.max_position_size}`);
  console.log(`  Max Open Positions: ${s.max_positions_open}`);
  console.log(`  Position Sizing: ${s.position_sizing_method}`);
  console.log(`  Risk Per Trade: ${s.risk_per_trade}%`);
  console.log('');
});

db.close();
