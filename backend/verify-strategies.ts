import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
const db = new Database(dbPath);

console.log('Trading Strategies in Database:\n');

const strategies = db.prepare(`
  SELECT id, name, category,
         recommended_stop_loss_percent as sl,
         recommended_target_percent as target,
         min_capital_required as capital,
         is_system
  FROM trading_strategies
  ORDER BY category, id
`).all() as any[];

let currentCategory = '';
strategies.forEach((s) => {
  if (s.category !== currentCategory) {
    currentCategory = s.category;
    console.log(`\n${currentCategory}`);
    console.log('='.repeat(80));
  }
  const rr = (s.target / s.sl).toFixed(1);
  console.log(`  ${s.id.toString().padEnd(2)} | ${s.name.padEnd(35)} | SL: ${s.sl}% | Target: ${s.target}% | R:R 1:${rr}`);
});

console.log(`\n\nTotal Strategies: ${strategies.length}`);
console.log(`System Strategies: ${strategies.filter((s) => s.is_system).length}\n`);

db.close();
