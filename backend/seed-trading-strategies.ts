import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data', 'autoscan.db');
const db = new Database(dbPath);

console.log('Seeding Professional Trading Strategies...\n');

// Check if strategies already exist
const existingCount = db.prepare(`
  SELECT COUNT(*) as count
  FROM trading_strategies
  WHERE is_system = 1
`).get() as { count: number };

if (existingCount.count > 0) {
  console.log(`✓ Found ${existingCount.count} existing system strategies - skipping seeding\n`);
  db.close();
  process.exit(0);
}

// Insert Strategy
const insertStrategy = db.prepare(`
  INSERT INTO trading_strategies (
    name, description, category,
    entry_conditions, exit_conditions, indicators_config,
    is_system, is_active,
    recommended_timeframes, recommended_stop_loss_percent,
    recommended_target_percent, min_capital_required
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

try {
  // ============================================================================
  // MEAN REVERSION STRATEGIES (4)
  // ============================================================================

  // Strategy 1: RSI Bollinger Reversal
  insertStrategy.run(
    'RSI Bollinger Reversal',
    'Classic mean reversion strategy using RSI oversold conditions combined with Bollinger Band lower touch. Enters when price is oversold and near support, exits at mean reversion or resistance.',
    'MEAN_REVERSION',
    JSON.stringify({
      type: 'MEAN_REVERSION',
      rsiOversold: 30,
      rsiOverbought: 70,
      bbPullback: true,
      min_confidence: 60,
      requireBothSignals: true
    }),
    JSON.stringify({
      stopLossPercent: 2.5,
      targetPercent: 7.5,
      trailingStop: { enabled: true, percent: 3 },
      maxHoldHours: 24
    }),
    JSON.stringify({
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      ema: { enabled: true, periods: [20] }
    }),
    1, // is_system
    1, // is_active
    JSON.stringify(['5m', '15m', '30m']),
    2.5,
    7.5,
    25000
  );
  console.log('✓ Created Strategy 1: RSI Bollinger Reversal');

  // Strategy 2: Multi-Timeframe Mean Reversion
  insertStrategy.run(
    'Multi-Timeframe Mean Reversion',
    'Advanced mean reversion using multiple timeframe analysis. Confirms oversold conditions on current timeframe with EMA pullback. Higher win rate but fewer signals.',
    'MEAN_REVERSION',
    JSON.stringify({
      type: 'MEAN_REVERSION',
      rsiOversold: 35,
      bbPullback: true,
      emaPullback: true,
      min_confidence: 65,
      multiTimeframe: true
    }),
    JSON.stringify({
      stopLossPercent: 2.0,
      targetPercent: 6.0,
      trailingStop: { enabled: true, percent: 2.5 },
      maxHoldMinutes: 180
    }),
    JSON.stringify({
      rsi: { enabled: true, period: 14, overbought: 65, oversold: 35 },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      ema: { enabled: true, periods: [9, 21, 50] }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m']),
    2.0,
    6.0,
    30000
  );
  console.log('✓ Created Strategy 2: Multi-Timeframe Mean Reversion');

  // Strategy 3: Statistical Arbitrage
  insertStrategy.run(
    'Statistical Arbitrage',
    'Quantitative mean reversion using statistical z-score analysis. Enters when price deviates significantly from mean, exits at mean reversion. Best for range-bound markets.',
    'MEAN_REVERSION',
    JSON.stringify({
      type: 'MEAN_REVERSION',
      rsiOversold: 25,
      bbPullback: true,
      zScoreThreshold: -2,
      min_confidence: 70,
      requireExtreme: true
    }),
    JSON.stringify({
      stopLossPercent: 3.0,
      targetPercent: 9.0,
      trailingStop: { enabled: true, percent: 4 },
      maxHoldHours: 48
    }),
    JSON.stringify({
      rsi: { enabled: true, period: 14, overbought: 75, oversold: 25 },
      bollinger: { enabled: true, period: 20, stdDev: 2.5 },
      ema: { enabled: true, periods: [50, 200] }
    }),
    1,
    1,
    JSON.stringify(['15m', '30m', '1h']),
    3.0,
    9.0,
    50000
  );
  console.log('✓ Created Strategy 3: Statistical Arbitrage');

  // Strategy 4: Support/Resistance Bounce
  insertStrategy.run(
    'Support/Resistance Bounce',
    'Price action based mean reversion at key support/resistance levels. Uses RSI and volume confirmation for high-probability bounces.',
    'MEAN_REVERSION',
    JSON.stringify({
      type: 'MEAN_REVERSION',
      rsiOversold: 32,
      bbPullback: true,
      volumeConfirmation: true,
      min_confidence: 55,
      keyLevelBounce: true
    }),
    JSON.stringify({
      stopLossPercent: 2.2,
      targetPercent: 6.6,
      trailingStop: { enabled: true, percent: 3 },
      maxHoldMinutes: 240
    }),
    JSON.stringify({
      rsi: { enabled: true, period: 14, overbought: 68, oversold: 32 },
      bollinger: { enabled: true, period: 20, stdDev: 2 },
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 1.5 },
      vwap: { enabled: true }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m', '30m']),
    2.2,
    6.6,
    28000
  );
  console.log('✓ Created Strategy 4: Support/Resistance Bounce');

  // ============================================================================
  // TREND FOLLOWING STRATEGIES (4)
  // ============================================================================

  // Strategy 5: EMA Crossover Trend
  insertStrategy.run(
    'EMA Crossover Trend',
    'Classic trend following using 9/21/50 EMA alignment. Enters on crossover with all EMAs aligned, rides trend with trailing stop. Best for trending markets.',
    'TREND_FOLLOWING',
    JSON.stringify({
      type: 'TREND_FOLLOWING',
      emaCrossover: true,
      emaAlignment: true,
      volumeConfirmation: true,
      min_confidence: 60
    }),
    JSON.stringify({
      stopLossPercent: 3.0,
      targetPercent: 9.0,
      trailingStop: { enabled: true, percent: 4 },
      maxHoldHours: 72
    }),
    JSON.stringify({
      ema: { enabled: true, periods: [9, 21, 50] },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      volume: { enabled: true, ma_period: 20 }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m', '30m', '1h']),
    3.0,
    9.0,
    40000
  );
  console.log('✓ Created Strategy 5: EMA Crossover Trend');

  // Strategy 6: ADX Momentum Trend
  insertStrategy.run(
    'ADX Momentum Trend',
    'Strong trend identification using ADX indicator above 25 combined with MACD bullish crossover. Only enters strong trends, filters out weak moves.',
    'TREND_FOLLOWING',
    JSON.stringify({
      type: 'TREND_FOLLOWING',
      adxThreshold: 25,
      macdBullish: true,
      emaCrossover: true,
      min_confidence: 70
    }),
    JSON.stringify({
      stopLossPercent: 3.5,
      targetPercent: 10.5,
      trailingStop: { enabled: true, percent: 5 },
      maxHoldHours: 96
    }),
    JSON.stringify({
      ema: { enabled: true, periods: [20, 50, 200] },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      adx: { enabled: true, period: 14, threshold: 25 }
    }),
    1,
    1,
    JSON.stringify(['15m', '30m', '1h']),
    3.5,
    10.5,
    60000
  );
  console.log('✓ Created Strategy 6: ADX Momentum Trend');

  // Strategy 7: Moving Average Ribbon
  insertStrategy.run(
    'Moving Average Ribbon',
    'Multiple moving average alignment strategy. Uses 8 EMAs (5,10,15,20,30,40,50,60) to identify strong trends. Enters when all EMAs align bullishly.',
    'TREND_FOLLOWING',
    JSON.stringify({
      type: 'TREND_FOLLOWING',
      emaAlignment: true,
      ribbonWidth: 8,
      macdBullish: true,
      min_confidence: 75
    }),
    JSON.stringify({
      stopLossPercent: 4.0,
      targetPercent: 12.0,
      trailingStop: { enabled: true, percent: 6 },
      maxHoldHours: 120
    }),
    JSON.stringify({
      ema: { enabled: true, periods: [5, 10, 15, 20, 30, 40, 50, 60] },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 }
    }),
    1,
    1,
    JSON.stringify(['30m', '1h', '4h']),
    4.0,
    12.0,
    75000
  );
  console.log('✓ Created Strategy 7: Moving Average Ribbon');

  // Strategy 8: Supertrend Breakout
  insertStrategy.run(
    'Supertrend Breakout',
    'Trend breakout strategy using Supertrend indicator. Enters on Supertrend flip with volume confirmation. Simple and effective for strong trends.',
    'TREND_FOLLOWING',
    JSON.stringify({
      type: 'TREND_FOLLOWING',
      supertrendFlip: true,
      volumeConfirmation: true,
      adxThreshold: 20,
      min_confidence: 65
    }),
    JSON.stringify({
      stopLossPercent: 3.2,
      targetPercent: 9.6,
      trailingStop: { enabled: true, percent: 4.5 },
      maxHoldHours: 60
    }),
    JSON.stringify({
      ema: { enabled: true, periods: [20, 50] },
      adx: { enabled: true, period: 14, threshold: 20 },
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 1.8 }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m', '30m']),
    3.2,
    9.6,
    45000
  );
  console.log('✓ Created Strategy 8: Supertrend Breakout');

  // ============================================================================
  // VOLUME BREAKOUT STRATEGIES (3)
  // ============================================================================

  // Strategy 9: Volume Breakout Scanner
  insertStrategy.run(
    'Volume Breakout Scanner',
    'High-volume breakout strategy. Enters when volume exceeds 2x average with price breaking recent high. Best for intraday momentum plays.',
    'VOLUME_BREAKOUT',
    JSON.stringify({
      type: 'VOLUME_BREAKOUT',
      volumeMultiple: 2.0,
      priceBreakout: true,
      vwapConfirmation: true,
      min_confidence: 65
    }),
    JSON.stringify({
      stopLossPercent: 2.0,
      targetPercent: 6.0,
      trailingStop: { enabled: true, percent: 2.5 },
      maxHoldMinutes: 120
    }),
    JSON.stringify({
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 2 },
      vwap: { enabled: true },
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 }
    }),
    1,
    1,
    JSON.stringify(['3m', '5m', '15m']),
    2.0,
    6.0,
    30000
  );
  console.log('✓ Created Strategy 9: Volume Breakout Scanner');

  // Strategy 10: VWAP Touch Reversal
  insertStrategy.run(
    'VWAP Touch Reversal',
    'Mean reversion at VWAP (Volume Weighted Average Price). Enters when price touches VWAP with volume confirmation. Institutional-grade strategy.',
    'VOLUME_BREAKOUT',
    JSON.stringify({
      type: 'VOLUME_BREAKOUT',
      vwapTouch: true,
      volumeMultiple: 1.5,
      rsiConfirmation: true,
      min_confidence: 60
    }),
    JSON.stringify({
      stopLossPercent: 1.8,
      targetPercent: 5.4,
      trailingStop: { enabled: true, percent: 2 },
      maxHoldMinutes: 90
    }),
    JSON.stringify({
      vwap: { enabled: true },
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 1.5 },
      rsi: { enabled: true, period: 14, overbought: 65, oversold: 35 }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m']),
    1.8,
    5.4,
    25000
  );
  console.log('✓ Created Strategy 10: VWAP Touch Reversal');

  // Strategy 11: Accumulation Distribution
  insertStrategy.run(
    'Accumulation Distribution',
    'Volume-price divergence strategy. Identifies accumulation/distribution phases through volume analysis. Enters on confirmed accumulation with price support.',
    'VOLUME_BREAKOUT',
    JSON.stringify({
      type: 'VOLUME_BREAKOUT',
      volumeMultiple: 2.5,
      priceBreakout: true,
      accumulationPhase: true,
      min_confidence: 70
    }),
    JSON.stringify({
      stopLossPercent: 2.5,
      targetPercent: 7.5,
      trailingStop: { enabled: true, percent: 3.5 },
      maxHoldMinutes: 180
    }),
    JSON.stringify({
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 2.5 },
      vwap: { enabled: true },
      ema: { enabled: true, periods: [20, 50] }
    }),
    1,
    1,
    JSON.stringify(['15m', '30m', '1h']),
    2.5,
    7.5,
    40000
  );
  console.log('✓ Created Strategy 11: Accumulation Distribution');

  // ============================================================================
  // MOMENTUM STRATEGIES (3)
  // ============================================================================

  // Strategy 12: MACD Momentum
  insertStrategy.run(
    'MACD Momentum',
    'Pure momentum strategy using MACD histogram crossover with RSI confirmation. Captures strong directional moves with momentum confirmation.',
    'MOMENTUM',
    JSON.stringify({
      type: 'MOMENTUM',
      macdCrossover: true,
      rsiMomentum: true,
      volumeMultiple: 1.8,
      min_confidence: 68
    }),
    JSON.stringify({
      stopLossPercent: 2.0,
      targetPercent: 6.0,
      trailingStop: { enabled: true, percent: 2.5 },
      maxHoldMinutes: 90
    }),
    JSON.stringify({
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 1.8 }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m', '30m']),
    2.0,
    6.0,
    30000
  );
  console.log('✓ Created Strategy 12: MACD Momentum');

  // Strategy 13: Stochastic Momentum
  insertStrategy.run(
    'Stochastic Momentum',
    'Stochastic oscillator momentum strategy. Enters on stochastic crossover in oversold/overbought zones with trend confirmation.',
    'MOMENTUM',
    JSON.stringify({
      type: 'MOMENTUM',
      stochasticCrossover: true,
      macdCrossover: true,
      volumeMultiple: 2.0,
      min_confidence: 65
    }),
    JSON.stringify({
      stopLossPercent: 2.3,
      targetPercent: 6.9,
      trailingStop: { enabled: true, percent: 3 },
      maxHoldMinutes: 150
    }),
    JSON.stringify({
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 2 }
    }),
    1,
    1,
    JSON.stringify(['5m', '15m', '30m']),
    2.3,
    6.9,
    32000
  );
  console.log('✓ Created Strategy 13: Stochastic Momentum');

  // Strategy 14: Rate of Change Breakout
  insertStrategy.run(
    'Rate of Change Breakout',
    'Price rate of change (ROC) momentum strategy. Identifies rapid price acceleration with volume confirmation. Best for catching explosive moves.',
    'MOMENTUM',
    JSON.stringify({
      type: 'MOMENTUM',
      rocBreakout: true,
      volumeMultiple: 2.5,
      macdCrossover: true,
      min_confidence: 72
    }),
    JSON.stringify({
      stopLossPercent: 2.8,
      targetPercent: 8.4,
      trailingStop: { enabled: true, percent: 4 },
      maxHoldMinutes: 120
    }),
    JSON.stringify({
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      volume: { enabled: true, ma_period: 20, breakout_multiplier: 2.5 },
      ema: { enabled: true, periods: [20] }
    }),
    1,
    1,
    JSON.stringify(['3m', '5m', '15m']),
    2.8,
    8.4,
    35000
  );
  console.log('✓ Created Strategy 14: Rate of Change Breakout');

  // Strategy 15: Swing Trading Momentum (Advanced)
  insertStrategy.run(
    'Swing Trading Momentum',
    'Multi-day momentum strategy for swing traders. Uses daily momentum with weekly trend confirmation. Larger stops and targets for bigger moves.',
    'MOMENTUM',
    JSON.stringify({
      type: 'MOMENTUM',
      macdCrossover: true,
      adxThreshold: 25,
      emaAlignment: true,
      min_confidence: 75
    }),
    JSON.stringify({
      stopLossPercent: 5.0,
      targetPercent: 15.0,
      trailingStop: { enabled: true, percent: 7 },
      maxHoldHours: 240
    }),
    JSON.stringify({
      ema: { enabled: true, periods: [20, 50, 200] },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      adx: { enabled: true, period: 14, threshold: 25 },
      volume: { enabled: true, ma_period: 20 }
    }),
    1,
    1,
    JSON.stringify(['1h', '4h', '1d']),
    5.0,
    15.0,
    100000
  );
  console.log('✓ Created Strategy 15: Swing Trading Momentum');

  console.log('\n✓ Successfully seeded 15 professional trading strategies!\n');
  console.log('Strategy Distribution:');
  console.log('  - Mean Reversion: 4 strategies');
  console.log('  - Trend Following: 4 strategies');
  console.log('  - Volume Breakout: 3 strategies');
  console.log('  - Momentum: 4 strategies');
  console.log('  Total: 15 professional strategies\n');

} catch (error) {
  console.error('Error seeding trading strategies:', error);
  process.exit(1);
} finally {
  db.close();
}
