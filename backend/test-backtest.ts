import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
console.log('Database path:', dbPath);
const db = new Database(dbPath);

console.log('Testing Backtest Functionality\n');
console.log('================================\n');

// First, check the scalper_configs table schema
console.log('0. Checking scalper_configs table schema:');
const scalpersSchema = db.prepare("PRAGMA table_info(scalper_configs)").all();
console.log('   Columns:', (scalpersSchema as any[]).map((c: any) => c.name).join(', '));

// Check for demo backtest scalpers
console.log('\n1. Checking for demo backtest scalpers:');
const scalpers = db.prepare(`
  SELECT id, name
  FROM scalper_configs
  WHERE name LIKE '%Backtest%'
`).all();

if (scalpers.length > 0) {
  console.log(`   ✓ Found ${scalpers.length} demo backtest scalpers:`);
  scalpers.forEach((s: any) => console.log(`     - [${s.id}] ${s.name}`));
} else {
  console.log('   ✗ No demo backtest scalpers found');
}

console.log('\n2. Checking backtest_runs table structure:');
const tableInfo = db.prepare("PRAGMA table_info(backtest_runs)").all();
if (tableInfo.length > 0) {
  console.log(`   ✓ backtest_runs table exists with ${tableInfo.length} columns`);
  const keyColumns = (tableInfo as any[]).filter((c: any) =>
    ['id', 'scalper_id', 'status', 'total_return_percent', 'win_rate'].includes(c.name)
  ).map((c: any) => c.name);
  console.log('   Key columns:', keyColumns.join(', '));
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
  (runs as any[]).forEach((r: any) => {
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
  const tradesCount = db.prepare('SELECT COUNT(*) as count FROM backtest_trades').get() as any;
  console.log(`   Total trades: ${tradesCount.count}`);
} else {
  console.log('   ✗ backtest_trades table not found');
}

console.log('\n================================');
console.log('Testing complete!\n');

db.close();
