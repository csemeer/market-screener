/**
 * Migration Script: Convert ALL strategies to expression-based format
 * This script converts legacy strategies to the new expression-based format
 */

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, 'data/autoscan.db');

interface LegacyEntryConditions {
  type: string;
  [key: string]: any;
}

interface LegacyExitConditions {
  targetPercent?: number;
  stopLossPercent?: number;
  useTrailingStop?: boolean;
  trailingStopActivationPercent?: number;
  trailingStopDistance?: number;
  maxHoldTimeMinutes?: number;
  [key: string]: any;
}

interface ExpressionConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Array<{
    id: string;
    type: 'expression';
    expression: string;
    description: string;
  }>;
}

class StrategyMigrator {
  private db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  convertEntryConditions(legacy: LegacyEntryConditions): ExpressionConditionGroup {
    const conditions: ExpressionConditionGroup = {
      operator: 'AND',
      conditions: []
    };

    let conditionId = 1;

    switch (legacy.type) {
      case 'VOLUME_BREAKOUT':
        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: `VOLUME > VOLUME_AVG * ${legacy.volumeMultiple || 2.0}`,
          description: `Volume Spike: ${legacy.volumeMultiple || 2.0}x average`
        });

        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'CLOSE > PREV_CLOSE * 1.01',
          description: 'Price Breakout: Close > Previous high (+1%)'
        });

        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'EMA9 > EMA20 AND EMA20 > EMA50',
          description: 'EMA Alignment: Bullish trend (9 > 20 > 50)'
        });
        break;

      case 'TREND_FOLLOWING':
        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'CLOSE > EMA9 AND EMA9 > EMA20 AND EMA20 > EMA50',
          description: 'Trend Alignment: Price and EMAs stacked bullishly'
        });

        if (legacy.rsiRange) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: `RSI > ${legacy.rsiRange[0]} AND RSI < ${legacy.rsiRange[1]}`,
            description: `RSI in Range: ${legacy.rsiRange[0]}-${legacy.rsiRange[1]}`
          });
        }

        if (legacy.volumeMultiple) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: `VOLUME > VOLUME_AVG * ${legacy.volumeMultiple}`,
            description: `Volume Confirmation: ${legacy.volumeMultiple}x average`
          });
        }

        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'MACD > MACD_SIGNAL',
          description: 'MACD Bullish: MACD above signal line'
        });
        break;

      case 'MEAN_REVERSION':
        if (legacy.rsiOversold) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: `RSI < ${legacy.rsiOversold}`,
            description: `RSI Oversold: RSI < ${legacy.rsiOversold}`
          });
        }

        if (legacy.bollingerBandTouch === 'lower') {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: 'CLOSE <= BB_LOWER * 1.01',
            description: 'Bollinger Band Touch: Price at/below lower band'
          });
        }

        if (legacy.volumeMultiple) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: `VOLUME > VOLUME_AVG * ${legacy.volumeMultiple}`,
            description: `Volume Spike: ${legacy.volumeMultiple}x average`
          });
        }

        if (legacy.macdTurning) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: 'MACD > MACD_SIGNAL',
            description: 'MACD Turning: MACD above signal'
          });
        }
        break;

      case 'MOMENTUM':
        if (legacy.rsiThreshold) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: `RSI > ${legacy.rsiThreshold}`,
            description: `RSI Strong: RSI > ${legacy.rsiThreshold}`
          });
        }

        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'CLOSE > EMA20',
          description: 'Price Above EMA: Close > 20-period EMA'
        });

        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'MACD_HISTOGRAM > 0',
          description: 'MACD Momentum: Positive histogram'
        });

        if (legacy.volumeMultiple) {
          conditions.conditions.push({
            id: `entry_${conditionId++}`,
            type: 'expression',
            expression: `VOLUME > VOLUME_AVG * ${legacy.volumeMultiple}`,
            description: `Volume Surge: ${legacy.volumeMultiple}x average`
          });
        }
        break;

      case 'MACD_SIMPLE':
        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'MACD > MACD_SIGNAL',
          description: 'MACD Bullish: MACD above signal line'
        });
        break;

      default:
        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'CLOSE > EMA20 AND RSI > 50',
          description: 'Basic Bullish: Price > EMA20 and RSI > 50'
        });
    }

    return conditions;
  }

  convertExitConditions(legacy: LegacyExitConditions): ExpressionConditionGroup {
    const conditions: ExpressionConditionGroup = {
      operator: 'OR',
      conditions: []
    };

    let conditionId = 1;

    if (legacy.targetPercent) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `PROFIT >= ${legacy.targetPercent}`,
        description: `Profit Target: ${legacy.targetPercent}% gain`
      });
    }

    if (legacy.stopLossPercent) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `LOSS >= ${legacy.stopLossPercent}`,
        description: `Stop Loss: ${legacy.stopLossPercent}% loss`
      });
    }

    if (legacy.useTrailingStop && legacy.trailingStopActivationPercent) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `PROFIT >= ${legacy.trailingStopActivationPercent} AND (CLOSE - PREV_CLOSE) / PREV_CLOSE * 100 < -${legacy.trailingStopDistance || 0.5}`,
        description: `Trailing Stop: Active at ${legacy.trailingStopActivationPercent}%, trail ${legacy.trailingStopDistance || 0.5}%`
      });
    }

    if (legacy.exitOnRSI && legacy.rsiExitLevel) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `RSI > ${legacy.rsiExitLevel}`,
        description: `RSI Exit: RSI > ${legacy.rsiExitLevel}`
      });
    }

    if (legacy.macdCrossover === 'bearish') {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: 'MACD < MACD_SIGNAL AND PREV_MACD >= PREV_MACD_SIGNAL',
        description: 'MACD Bearish Cross: MACD crossed below signal'
      });
    }

    if (legacy.rsiExit && legacy.rsiExitUpper && legacy.rsiExitLower) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `RSI > ${legacy.rsiExitUpper} OR RSI < ${legacy.rsiExitLower}`,
        description: `RSI Extreme: RSI > ${legacy.rsiExitUpper} or < ${legacy.rsiExitLower}`
      });
    }

    conditions.conditions.push({
      id: `exit_${conditionId++}`,
      type: 'expression',
      expression: 'EMA9 < EMA20 AND PREV_EMA9 >= PREV_EMA20',
      description: 'Trend Reversal: Fast EMA crossed below slow'
    });

    conditions.conditions.push({
      id: `exit_${conditionId++}`,
      type: 'expression',
      expression: 'VOLUME > VOLUME_AVG * 3 AND (CLOSE - OPEN) / OPEN * 100 < -1',
      description: 'High Volume Reversal: Big volume bearish candle'
    });

    return conditions;
  }

  isExpressionBased(entryConditions: any): boolean {
    return entryConditions?.conditions && Array.isArray(entryConditions.conditions);
  }

  migrate() {
    console.log('🚀 Starting strategy migration to expression-based format...\n');

    // Get all strategies
    const strategies = this.db.prepare('SELECT * FROM trading_strategies').all() as any[];

    console.log(`📊 Found ${strategies.length} strategies\n`);

    let migratedCount = 0;
    let alreadyModernCount = 0;
    let errorCount = 0;

    strategies.forEach((strategy) => {
      try {
        const entryConditions = JSON.parse(strategy.entry_conditions);
        const exitConditions = JSON.parse(strategy.exit_conditions);

        // Check if already expression-based
        if (this.isExpressionBased(entryConditions)) {
          console.log(`⏭️  ${strategy.name}: Already in modern format, skipping`);
          alreadyModernCount++;
          return;
        }

        console.log(`🔄 Converting: ${strategy.name}`);
        console.log(`   Old format: ${entryConditions.type}`);

        // Convert to expression-based format
        const newEntryConditions = this.convertEntryConditions(entryConditions);
        const newExitConditions = this.convertExitConditions(exitConditions);

        console.log(`   ✓ Entry: ${newEntryConditions.conditions.length} conditions (${newEntryConditions.operator})`);
        console.log(`   ✓ Exit: ${newExitConditions.conditions.length} conditions (${newExitConditions.operator})`);

        // Update database
        this.db.prepare(`
          UPDATE trading_strategies
          SET
            entry_conditions = ?,
            exit_conditions = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          JSON.stringify(newEntryConditions),
          JSON.stringify(newExitConditions),
          strategy.id
        );

        migratedCount++;
        console.log(`   ✅ Migration complete\n`);

      } catch (error: any) {
        console.error(`   ❌ Error converting ${strategy.name}:`, error.message);
        errorCount++;
      }
    });

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount}`);
    console.log(`   ⏭️  Already modern: ${alreadyModernCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${strategies.length}`);

    this.db.close();

    console.log('\n🎉 Migration complete! All strategies are now using expression-based format.');
  }
}

// Run migration
try {
  const migrator = new StrategyMigrator(dbPath);
  migrator.migrate();
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
