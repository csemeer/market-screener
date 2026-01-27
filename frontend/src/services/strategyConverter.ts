/**
 * Legacy Strategy Converter
 * Converts old hardcoded strategy types to new expression-based format
 */

export interface LegacyEntryConditions {
  type: string;
  [key: string]: any;
}

export interface LegacyExitConditions {
  targetPercent?: number;
  stopLossPercent?: number;
  useTrailingStop?: boolean;
  trailingStopActivationPercent?: number;
  trailingStopDistance?: number;
  maxHoldTimeMinutes?: number;
  [key: string]: any;
}

export interface ExpressionConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Array<{
    id: string;
    type: 'expression';
    expression: string;
    description: string;
  }>;
}

export class StrategyConverter {
  /**
   * Convert legacy entry conditions to expression-based format
   */
  static convertEntryConditions(legacy: LegacyEntryConditions): ExpressionConditionGroup {
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
            expression: 'MACD > MACD_SIGNAL OR MACD_HISTOGRAM > MACD_HISTOGRAM',
            description: 'MACD Turning: Showing signs of reversal'
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
        // Generic conversion
        conditions.conditions.push({
          id: `entry_${conditionId++}`,
          type: 'expression',
          expression: 'CLOSE > EMA20 AND RSI > 50',
          description: 'Basic Bullish: Price > EMA20 and RSI > 50'
        });
    }

    return conditions;
  }

  /**
   * Convert legacy exit conditions to expression-based format
   */
  static convertExitConditions(legacy: LegacyExitConditions): ExpressionConditionGroup {
    const conditions: ExpressionConditionGroup = {
      operator: 'OR',
      conditions: []
    };

    let conditionId = 1;

    // Profit target
    if (legacy.targetPercent) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `PROFIT >= ${legacy.targetPercent}`,
        description: `Profit Target: ${legacy.targetPercent}% gain`
      });
    }

    // Stop loss
    if (legacy.stopLossPercent) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `LOSS >= ${legacy.stopLossPercent}`,
        description: `Stop Loss: ${legacy.stopLossPercent}% loss`
      });
    }

    // Trailing stop (approximation)
    if (legacy.useTrailingStop && legacy.trailingStopActivationPercent) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `PROFIT >= ${legacy.trailingStopActivationPercent} AND (CLOSE - PREV_CLOSE) / PREV_CLOSE * 100 < -${legacy.trailingStopDistance || 0.5}`,
        description: `Trailing Stop: Active at ${legacy.trailingStopActivationPercent}%, trail ${legacy.trailingStopDistance || 0.5}%`
      });
    }

    // RSI exit
    if (legacy.exitOnRSI && legacy.rsiExitLevel) {
      conditions.conditions.push({
        id: `exit_${conditionId++}`,
        type: 'expression',
        expression: `RSI > ${legacy.rsiExitLevel}`,
        description: `RSI Exit: RSI > ${legacy.rsiExitLevel}`
      });
    }

    // MACD exit (for MACD_SIMPLE)
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
        expression: `(RSI > ${legacy.rsiExitUpper} OR RSI < ${legacy.rsiExitLower})`,
        description: `RSI Extreme: RSI > ${legacy.rsiExitUpper} or < ${legacy.rsiExitLower}`
      });
    }

    // Generic reversal signals
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

  /**
   * Convert full legacy strategy to expression-based format
   */
  static convertStrategy(legacyStrategy: any): any {
    // If already expression-based, return as-is
    if (legacyStrategy.entry_conditions?.conditions && Array.isArray(legacyStrategy.entry_conditions.conditions)) {
      return legacyStrategy;
    }

    // Parse JSON strings if needed
    const entryConditions = typeof legacyStrategy.entry_conditions === 'string'
      ? JSON.parse(legacyStrategy.entry_conditions)
      : legacyStrategy.entry_conditions;

    const exitConditions = typeof legacyStrategy.exit_conditions === 'string'
      ? JSON.parse(legacyStrategy.exit_conditions)
      : legacyStrategy.exit_conditions;

    return {
      ...legacyStrategy,
      entry_conditions: this.convertEntryConditions(entryConditions),
      exit_conditions: this.convertExitConditions(exitConditions)
    };
  }

  /**
   * Check if a strategy is already in expression-based format
   */
  static isExpressionBased(strategy: any): boolean {
    const entry = typeof strategy.entry_conditions === 'string'
      ? JSON.parse(strategy.entry_conditions)
      : strategy.entry_conditions;

    return entry?.conditions && Array.isArray(entry.conditions);
  }
}
