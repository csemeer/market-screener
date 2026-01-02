/**
 * Seed Script - Create Demo Auto-Scalper Configuration
 *
 * This script creates a demo scalper with sample stocks for testing the UI
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../data/autoscan.db');

async function seedDemoScalper() {
  const db = new Database(DB_PATH);

  console.log('🌱 Seeding demo Auto-Scalper configuration...\n');

  try {
    // Check if demo scalper already exists
    const existing = db.prepare('SELECT * FROM scalper_configs WHERE name = ?').get('Demo Scalper 1');

    if (existing) {
      console.log('✓ Demo Scalper already exists (id: ' + (existing as any).id + ')');
      console.log('  Skipping creation...\n');
      db.close();
      return;
    }

    // Create demo scalper configuration
    const config = {
      name: 'Demo Scalper 1',
      enabled: true,
      broker: 'zerodha',
      accountId: 'DEMO_ACCOUNT_123',
      autoTrade: true,
      stockSelectionMethod: 'MANUAL',
      stockSymbols: JSON.stringify(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']),
      maxStocks: 5,
      strategyName: 'Breakout Scalper',
      timeframe: '5m',
      indicatorsConfig: JSON.stringify({
        useEMA: true,
        emaFast: 9,
        emaSlow: 21,
        useRSI: true,
        rsiPeriod: 14,
        useVWAP: true,
      }),
      entryConditions: JSON.stringify({
        type: 'BREAKOUT',
        volumeConfirmation: true,
        minVolumeMultiplier: 1.5,
      }),
      exitConditions: JSON.stringify({
        targetPercent: 0.7,
        stopLossPercent: 0.3,
        useTrailingStop: false,
        maxHoldTimeMinutes: 30,
      }),
      maxPositionSize: 50000,
      maxPositionsOpen: 3,
      maxDailyLoss: 5000,
      maxDailyTrades: 20,
      positionSizingMethod: 'FIXED',
      riskPerTrade: 1.0,
      tradingStartTime: '09:30',
      tradingEndTime: '15:15',
      avoidFirstMinutes: 15,
      avoidLastMinutes: 15,
    };

    const result = db.prepare(`
      INSERT INTO scalper_configs (
        name, enabled, broker, account_id, auto_trade,
        stock_selection_method, stock_symbols, max_stocks,
        strategy_name, timeframe, indicators_config, entry_conditions, exit_conditions,
        max_position_size, max_positions_open, max_daily_loss, max_daily_trades,
        position_sizing_method, risk_per_trade,
        trading_start_time, trading_end_time, avoid_first_minutes, avoid_last_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      config.name,
      config.enabled ? 1 : 0,
      config.broker,
      config.accountId,
      config.autoTrade ? 1 : 0,
      config.stockSelectionMethod,
      config.stockSymbols,
      config.maxStocks,
      config.strategyName,
      config.timeframe,
      config.indicatorsConfig,
      config.entryConditions,
      config.exitConditions,
      config.maxPositionSize,
      config.maxPositionsOpen,
      config.maxDailyLoss,
      config.maxDailyTrades,
      config.positionSizingMethod,
      config.riskPerTrade,
      config.tradingStartTime,
      config.tradingEndTime,
      config.avoidFirstMinutes,
      config.avoidLastMinutes
    );

    const scalperId = result.lastInsertRowid as number;
    console.log(`✓ Created Demo Scalper (id: ${scalperId})`);

    // Add sample stocks to watchlist
    const stocks = [
      { symbol: 'RELIANCE', exchange: 'NSE' },
      { symbol: 'TCS', exchange: 'NSE' },
      { symbol: 'INFY', exchange: 'NSE' },
      { symbol: 'HDFCBANK', exchange: 'NSE' },
      { symbol: 'ICICIBANK', exchange: 'NSE' },
    ];

    console.log('\n📊 Adding stocks to watchlist:');
    stocks.forEach((stock) => {
      db.prepare(`
        INSERT INTO scalping_stocks (scalper_id, symbol, exchange, active, total_trades, winning_trades, total_pnl, win_rate)
        VALUES (?, ?, ?, 1, 0, 0, 0, 0)
      `).run(scalperId, stock.symbol, stock.exchange);

      console.log(`  ✓ ${stock.symbol} (${stock.exchange})`);
    });

    // Add some sample trade history for demonstration
    console.log('\n📈 Creating sample trade history:');

    const sampleTrades = [
      {
        symbol: 'RELIANCE',
        exchange: 'NSE',
        side: 'BUY',
        quantity: 10,
        entryPrice: 2450.50,
        exitPrice: 2468.25,
        stopLoss: 2443.15,
        target: 2467.65,
        status: 'CLOSED',
        closeReason: 'TARGET_HIT',
        grossPnL: 177.50,
        netPnL: 175.00,
        pnlPercent: 0.72,
      },
      {
        symbol: 'TCS',
        exchange: 'NSE',
        side: 'BUY',
        quantity: 5,
        entryPrice: 3580.00,
        exitPrice: 3572.50,
        stopLoss: 3569.26,
        target: 3605.06,
        status: 'CLOSED',
        closeReason: 'STOP_LOSS',
        grossPnL: -37.50,
        netPnL: -39.00,
        pnlPercent: -0.21,
      },
      {
        symbol: 'INFY',
        exchange: 'NSE',
        side: 'BUY',
        quantity: 15,
        entryPrice: 1485.20,
        exitPrice: 1495.60,
        stopLoss: 1480.74,
        target: 1495.60,
        status: 'CLOSED',
        closeReason: 'TARGET_HIT',
        grossPnL: 156.00,
        netPnL: 154.00,
        pnlPercent: 0.70,
      },
    ];

    sampleTrades.forEach((trade, index) => {
      const entryTime = new Date(Date.now() - (3 - index) * 3600000); // Staggered by hours
      const exitTime = new Date(entryTime.getTime() + 1800000); // 30 min later

      db.prepare(`
        INSERT INTO scalp_trades (
          scalper_id, symbol, exchange, side, quantity,
          entry_price, entry_time, exit_price, exit_time,
          stop_loss, target, status, close_reason,
          gross_pnl, net_pnl, pnl_percent, brokerage,
          entry_signals, indicators_data, execution_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        scalperId,
        trade.symbol,
        trade.exchange,
        trade.side,
        trade.quantity,
        trade.entryPrice,
        entryTime.toISOString(),
        trade.exitPrice,
        exitTime.toISOString(),
        trade.stopLoss,
        trade.target,
        trade.status,
        trade.closeReason,
        trade.grossPnL,
        trade.netPnL,
        trade.pnlPercent,
        2.50,
        JSON.stringify({ type: 'BREAKOUT', volume: 'HIGH', rsi: 65 }),
        JSON.stringify({ ema9: 2445, ema21: 2440, rsi: 65, volume: 150000 }),
        'PAPER'
      );

      const pnlColor = trade.grossPnL >= 0 ? '✓' : '✗';
      const pnlSign = trade.grossPnL >= 0 ? '+' : '';
      console.log(`  ${pnlColor} ${trade.symbol}: ${pnlSign}₹${trade.grossPnL.toFixed(2)} (${trade.closeReason})`);
    });

    // Update stock statistics based on trades
    db.prepare(`
      UPDATE scalping_stocks SET
        total_trades = 1,
        winning_trades = 1,
        total_pnl = 175.00,
        win_rate = 100.0,
        last_trade_at = datetime('now')
      WHERE scalper_id = ? AND symbol = 'RELIANCE'
    `).run(scalperId);

    db.prepare(`
      UPDATE scalping_stocks SET
        total_trades = 1,
        winning_trades = 0,
        total_pnl = -39.00,
        win_rate = 0.0,
        last_trade_at = datetime('now')
      WHERE scalper_id = ? AND symbol = 'TCS'
    `).run(scalperId);

    db.prepare(`
      UPDATE scalping_stocks SET
        total_trades = 1,
        winning_trades = 1,
        total_pnl = 154.00,
        win_rate = 100.0,
        last_trade_at = datetime('now')
      WHERE scalper_id = ? AND symbol = 'INFY'
    `).run(scalperId);

    console.log('\n✅ Demo scalper setup complete!\n');
    console.log('📝 Summary:');
    console.log(`   Scalper ID: ${scalperId}`);
    console.log(`   Name: ${config.name}`);
    console.log(`   Broker: ${config.broker.toUpperCase()}`);
    console.log(`   Mode: Paper Trading (No real money)`);
    console.log(`   Stocks: ${stocks.length}`);
    console.log(`   Sample Trades: ${sampleTrades.length}`);
    console.log(`   Total P&L: ₹${(175.00 - 39.00 + 154.00).toFixed(2)}\n`);
    console.log('🚀 You can now test the Auto-Scalper Dashboard!');
    console.log('   Navigate to: http://localhost:5173/scalper\n');

  } catch (error) {
    console.error('❌ Error seeding demo scalper:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run the seed script
seedDemoScalper()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
