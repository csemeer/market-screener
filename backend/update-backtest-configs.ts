import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
const db = new Database(dbPath);

console.log('Updating Backtest Demo Scalper Configurations...\n');

// Update Demo 1: 30-Day NSE Mean Reversion
const updateStmt = db.prepare(`
  UPDATE scalper_configs
  SET entry_conditions = ?,
      exit_conditions = ?
  WHERE name = ?
`);

try {
  // Demo 1: Mean Reversion
  updateStmt.run(
    JSON.stringify({
      type: 'MEAN_REVERSION',
      rsiOversold: 30,
      bbPullback: true,
      min_confidence: 60
    }),
    JSON.stringify({
      stopLossPercent: 0.5,
      targetPercent: 1.5,
      trailingStop: { enabled: true, percent: 2 }
    }),
    'Backtest Demo 1: 30-Day Period NSE'
  );
  console.log('✓ Updated Demo 1: Mean Reversion');

  // Demo 2: Trend Following
  updateStmt.run(
    JSON.stringify({
      type: 'TREND_FOLLOWING',
      emaCrossover: true,
      adxThreshold: 25,
      macdBullish: true,
      min_confidence: 70
    }),
    JSON.stringify({
      stopLossPercent: 1.0,
      targetPercent: 2.5,
      trailingStop: { enabled: true, percent: 3 },
      maxHoldHours: 48
    }),
    'Backtest Demo 2: 90-Day Period NASDAQ'
  );
  console.log('✓ Updated Demo 2: Trend Following');

  // Demo 3: Volume Breakout
  updateStmt.run(
    JSON.stringify({
      type: 'VOLUME_BREAKOUT',
      volumeMultiple: 2.0,
      priceBreakout: true,
      vwapConfirmation: true,
      min_confidence: 65
    }),
    JSON.stringify({
      stopLossPercent: 0.8,
      targetPercent: 3.0,
      trailingStop: { enabled: true, percent: 1.5 },
      maxHoldMinutes: 120
    }),
    'Backtest Demo 3: Last Market Day Intraday NSE'
  );
  console.log('✓ Updated Demo 3: Volume Breakout');

  // Demo 4: Momentum
  updateStmt.run(
    JSON.stringify({
      type: 'MOMENTUM',
      macdCrossover: true,
      volumeMultiple: 2.5,
      rsiMomentum: true,
      min_confidence: 68
    }),
    JSON.stringify({
      stopLossPercent: 0.7,
      targetPercent: 2.0,
      trailingStop: { enabled: true, percent: 2 },
      maxHoldMinutes: 90
    }),
    'Backtest Demo 4: Last Market Day Intraday NASDAQ'
  );
  console.log('✓ Updated Demo 4: Momentum');

  console.log('\n✓ Successfully updated all 4 demo backtest scalper configurations!\n');
  console.log('Note: Entry conditions now use uppercase strategy types (MEAN_REVERSION, TREND_FOLLOWING, etc.)');
  console.log('Note: Exit conditions now use stopLossPercent and targetPercent fields\n');
} catch (error) {
  console.error('Error updating configurations:', error);
  process.exit(1);
} finally {
  db.close();
}
