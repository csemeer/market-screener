/**
 * Seed Complex Example Strategy - "Momentum Breakout Master"
 * Demonstrates the full power of the expression-based strategy builder
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data/autoscan.db');
const db = new Database(dbPath);

// Complex Strategy: Momentum Breakout Master
const strategy = {
  name: 'Momentum Breakout Master',
  description: 'Advanced multi-indicator strategy combining momentum, volume, and price action. Uses complex arithmetic expressions to identify high-probability breakout setups. Enters when price breaks consolidation with strong momentum, volume surge, and bullish indicators alignment. Exits using dynamic profit targets, adaptive stops, or reversal signals.',
  category: 'CUSTOM',

  // COMPLEX ENTRY CONDITIONS (using AND operator)
  entry_conditions: {
    operator: 'AND',
    conditions: [
      {
        id: 'entry_1',
        type: 'expression',
        expression: '(CLOSE - PREV_CLOSE) / PREV_CLOSE * 100 > 1.5',
        description: 'Strong Price Surge: Price up more than 1.5% from previous candle'
      },
      {
        id: 'entry_2',
        type: 'expression',
        expression: 'VOLUME > VOLUME_AVG * 2.5 AND (VOLUME - PREV_VOLUME) / PREV_VOLUME * 100 > 50',
        description: 'Volume Explosion: Volume 2.5x average AND up 50% from previous candle'
      },
      {
        id: 'entry_3',
        type: 'expression',
        expression: 'EMA9 > EMA20 AND EMA20 > EMA50 AND (EMA9 - EMA50) / EMA50 * 100 > 3',
        description: 'Bullish EMA Alignment: EMAs stacked AND 9-50 spread greater than 3%'
      },
      {
        id: 'entry_4',
        type: 'expression',
        expression: 'MACD > MACD_SIGNAL AND PREV_MACD <= PREV_MACD_SIGNAL AND MACD_HISTOGRAM > 0',
        description: 'MACD Golden Cross: MACD just crossed above signal with positive histogram'
      },
      {
        id: 'entry_5',
        type: 'expression',
        expression: 'RSI > 55 AND RSI < 75 AND (RSI - PREV_RSI) > 5',
        description: 'RSI Momentum Zone: RSI in 55-75 range AND gaining strength (up 5+ points)'
      },
      {
        id: 'entry_6',
        type: 'expression',
        expression: 'CLOSE > BB_MIDDLE AND (CLOSE - BB_LOWER) / (BB_UPPER - BB_LOWER) * 100 > 60',
        description: 'Bollinger Band Position: Price above middle band AND in upper 40% of band'
      },
      {
        id: 'entry_7',
        type: 'expression',
        expression: '(HIGH - LOW) / LOW * 100 > 1 AND (CLOSE - OPEN) / OPEN * 100 > 0.5',
        description: 'Strong Bullish Candle: Range > 1% AND closed in upper 50% (bullish body)'
      }
    ]
  },

  // COMPLEX EXIT CONDITIONS (using OR operator)
  exit_conditions: {
    operator: 'OR',
    conditions: [
      {
        id: 'exit_1',
        type: 'expression',
        expression: 'PROFIT >= 5',
        description: 'Primary Profit Target: Lock in 5% gain'
      },
      {
        id: 'exit_2',
        type: 'expression',
        expression: 'LOSS >= 2.5',
        description: 'Stop Loss: Cut losses at 2.5%'
      },
      {
        id: 'exit_3',
        type: 'expression',
        expression: 'PROFIT >= 3 AND (CLOSE - PREV_CLOSE) / PREV_CLOSE * 100 < -0.8',
        description: 'Trailing Exit: If up 3%+ and price drops 0.8%, take profit'
      },
      {
        id: 'exit_4',
        type: 'expression',
        expression: 'RSI > 75 AND PREV_RSI <= 75',
        description: 'Overbought Exit: RSI just entered overbought territory (>75)'
      },
      {
        id: 'exit_5',
        type: 'expression',
        expression: 'MACD < MACD_SIGNAL AND PREV_MACD >= PREV_MACD_SIGNAL AND MACD_HISTOGRAM < 0',
        description: 'MACD Death Cross: MACD crossed below signal with negative histogram'
      },
      {
        id: 'exit_6',
        type: 'expression',
        expression: 'EMA9 < EMA20 AND PREV_EMA9 >= PREV_EMA20',
        description: 'Trend Reversal: Fast EMA crossed below slow EMA'
      },
      {
        id: 'exit_7',
        type: 'expression',
        expression: 'VOLUME > VOLUME_AVG * 3 AND (CLOSE - OPEN) / OPEN * 100 < -1',
        description: 'High Volume Reversal: Huge volume with bearish candle (>1% down)'
      },
      {
        id: 'exit_8',
        type: 'expression',
        expression: 'CLOSE < BB_LOWER AND PROFIT > 0',
        description: 'Band Breakdown: Price fell below lower Bollinger Band (if profitable)'
      }
    ]
  },

  // INDICATOR CONFIGURATION
  indicators_config: {
    useEMA: true,
    emaFast: 9,
    emaMiddle: 20,
    emaSlow: 50,
    ema200: false,

    useSMA: false,
    smaFast: 9,
    smaMiddle: 20,
    smaSlow: 50,
    sma200: false,

    useRSI: true,
    rsiPeriod: 14,

    useMACD: true,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,

    useBB: true,
    bbPeriod: 20,
    bbStdDev: 2,

    useADX: false,
    adxPeriod: 14,

    useATR: false,
    atrPeriod: 14,

    useStochastic: false,
    stochKPeriod: 14,
    stochDPeriod: 3,

    useVolume: true,
    volumePeriod: 20,

    useVWAP: false
  },

  recommended_timeframes: ['3m', '5m', '15m'],
  recommended_stop_loss_percent: 2.5,
  recommended_target_percent: 5.0,
  min_capital_required: 75000,
  is_system: false,
  is_active: true,
  created_by: 'system_demo',
  version: 1
};

try {
  // Check if strategy already exists
  const existing = db.prepare('SELECT id FROM trading_strategies WHERE name = ?').get(strategy.name);

  if (existing) {
    console.log('⚠️  Strategy already exists, updating...');

    db.prepare(`
      UPDATE trading_strategies
      SET
        description = ?,
        category = ?,
        entry_conditions = ?,
        exit_conditions = ?,
        indicators_config = ?,
        recommended_timeframes = ?,
        recommended_stop_loss_percent = ?,
        recommended_target_percent = ?,
        min_capital_required = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE name = ?
    `).run(
      strategy.description,
      strategy.category,
      JSON.stringify(strategy.entry_conditions),
      JSON.stringify(strategy.exit_conditions),
      JSON.stringify(strategy.indicators_config),
      JSON.stringify(strategy.recommended_timeframes),
      strategy.recommended_stop_loss_percent,
      strategy.recommended_target_percent,
      strategy.min_capital_required,
      strategy.name
    );

    console.log('✅ Strategy updated successfully!');
  } else {
    console.log('📝 Creating new strategy...');

    db.prepare(`
      INSERT INTO trading_strategies (
        name, description, category,
        entry_conditions, exit_conditions, indicators_config,
        is_system, is_active, created_by, version,
        recommended_timeframes, recommended_stop_loss_percent, recommended_target_percent,
        min_capital_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      strategy.name,
      strategy.description,
      strategy.category,
      JSON.stringify(strategy.entry_conditions),
      JSON.stringify(strategy.exit_conditions),
      JSON.stringify(strategy.indicators_config),
      strategy.is_system ? 1 : 0,
      strategy.is_active ? 1 : 0,
      strategy.created_by,
      strategy.version,
      JSON.stringify(strategy.recommended_timeframes),
      strategy.recommended_stop_loss_percent,
      strategy.recommended_target_percent,
      strategy.min_capital_required
    );

    console.log('✅ Strategy created successfully!');
  }

  db.close();

  console.log('\n🎉 Momentum Breakout Master Strategy Ready!\n');
  console.log('📊 Strategy Details:');
  console.log(`   Name: ${strategy.name}`);
  console.log(`   Category: ${strategy.category}`);
  console.log(`   Entry Conditions: ${strategy.entry_conditions.conditions.length} (${strategy.entry_conditions.operator})`);
  console.log(`   Exit Conditions: ${strategy.exit_conditions.conditions.length} (${strategy.exit_conditions.operator})`);
  console.log(`   Risk-Reward: 1:${(strategy.recommended_target_percent / strategy.recommended_stop_loss_percent).toFixed(2)}`);
  console.log(`   Recommended Timeframes: ${strategy.recommended_timeframes.join(', ')}`);
  console.log(`   Min Capital: ₹${strategy.min_capital_required.toLocaleString()}`);
  console.log('\n📍 Entry Logic (ALL must be true - AND):');
  strategy.entry_conditions.conditions.forEach((cond, idx) => {
    console.log(`   ${idx + 1}. ${cond.description}`);
    console.log(`      Expression: ${cond.expression}`);
  });
  console.log('\n📍 Exit Logic (ANY can trigger - OR):');
  strategy.exit_conditions.conditions.forEach((cond, idx) => {
    console.log(`   ${idx + 1}. ${cond.description}`);
    console.log(`      Expression: ${cond.expression}`);
  });

  console.log('\n✨ You can now test this strategy in Live Simulation!');

} catch (error) {
  console.error('❌ Error seeding strategy:', error);
  db.close();
  process.exit(1);
}
