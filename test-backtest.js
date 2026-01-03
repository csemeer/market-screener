const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
const db = new Database(dbPath);

console.log('Testing Backtest Functionality\n');
console.log('================================\n');

// Check for demo backtest scalpers
console.log('1. Checking for demo backtest scalpers:');
const scalpers = db.prepare(`
  SELECT id, name, strategy_type
  FROM scalper_configs
  WHERE name LIKE '%Backtest%'
`).all();

if (scalpers.length > 0) {
  console.log(`   ✓ Found ${scalpers.length} demo backtest scalpers:`);
  scalpers.forEach(s => console.log(`     - [${s.id}] ${s.name} (${s.strategy_type})`));
} else {
  console.log('   ✗ No demo backtest scalpers found');
}

console.log('\n2. Checking backtest_runs table structure:');
const tableInfo = db.prepare("PRAGMA table_info(backtest_runs)").all();
if (tableInfo.length > 0) {
  console.log(`   ✓ backtest_runs table exists with ${tableInfo.length} columns`);
  console.log('   Key columns:', tableInfo.filter(c =>
    ['id', 'scalper_id', 'status', 'total_return_percent', 'win_rate'].includes(c.name)
  ).map(c => c.name).join(', '));
} else {
  console.log('   ✗ backtest_runs table not found');
}

console.log('\n3. Checking existing backtest runs:');
const runs = db.prepare(`
  SELECT id, name, status, total_return_percent, win_rate, created_at
  FROM backtest_runs
  ORDER BY created_at DESC
  LIMIT 5
`).all();

if (runs.length > 0) {
  console.log(`   ✓ Found ${runs.length} backtest runs:`);
  runs.forEach(r => {
    console.log(`     - [${r.id}] ${r.name} - Status: ${r.status}`);
    console.log(`       Return: ${r.total_return_percent !== null ? r.total_return_percent.toFixed(2) + '%' : 'N/A'}, Win Rate: ${r.win_rate !== null ? r.win_rate.toFixed(1) + '%' : 'N/A'}`);
  });
} else {
  console.log('   ℹ No backtest runs found yet');
}

console.log('\n4. Checking backtest_trades table:');
const tradesTableInfo = db.prepare("PRAGMA table_info(backtest_trades)").all();
if (tradesTableInfo.length > 0) {
  console.log(`   ✓ backtest_trades table exists with ${tradesTableInfo.length} columns`);
  const tradesCount = db.prepare('SELECT COUNT(*) as count FROM backtest_trades').get();
  console.log(`   Total trades: ${tradesCount.count}`);
} else {
  console.log('   ✗ backtest_trades table not found');
}

console.log('\n================================');
console.log('Testing complete!\n');

db.close();
