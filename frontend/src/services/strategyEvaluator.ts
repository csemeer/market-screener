/**
 * Strategy Evaluator - Evaluates custom expression-based trading strategies
 */

import { ExpressionParser, ExpressionContext } from './expressionParser';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Condition {
  id: string;
  type: 'expression';
  expression: string;
  description: string;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

export interface CustomStrategy {
  entry_conditions: ConditionGroup | { type: string; [key: string]: any }; // Support both new and old formats
  exit_conditions: ConditionGroup | { type: string; [key: string]: any };
  indicators_config: any;
}

export interface Indicators {
  ema9?: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  sma9?: number;
  sma20?: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHistogram?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
  adx?: number;
  atr?: number;
  stochK?: number;
  stochD?: number;
  volumeAvg?: number;
  vwap?: number;
}

export interface Trade {
  entryPrice: number;
  entryTime: Date;
}

export class StrategyEvaluator {
  /**
   * Check if strategy is using new expression-based format
   */
  static isExpressionBasedStrategy(strategy: CustomStrategy): boolean {
    return (
      typeof strategy.entry_conditions === 'object' &&
      'conditions' in strategy.entry_conditions &&
      Array.isArray(strategy.entry_conditions.conditions)
    );
  }

  /**
   * Evaluate entry conditions
   */
  static evaluateEntry(
    strategy: CustomStrategy,
    currentCandle: Candle,
    prevCandle: Candle,
    indicators: Indicators,
    prevIndicators: Indicators
  ): { result: boolean; details: any } {
    // Check if this is a new expression-based strategy
    if (this.isExpressionBasedStrategy(strategy)) {
      return this.evaluateConditionGroup(
        strategy.entry_conditions as ConditionGroup,
        currentCandle,
        prevCandle,
        indicators,
        prevIndicators,
        null // No trade for entry evaluation
      );
    }

    // Otherwise, return false - old strategies should be handled by existing logic
    return { result: false, details: { error: 'Legacy strategy format' } };
  }

  /**
   * Evaluate exit conditions
   */
  static evaluateExit(
    strategy: CustomStrategy,
    currentCandle: Candle,
    prevCandle: Candle,
    indicators: Indicators,
    prevIndicators: Indicators,
    currentTrade: Trade | null
  ): { result: boolean; details: any } {
    // Check if this is a new expression-based strategy
    if (this.isExpressionBasedStrategy(strategy)) {
      return this.evaluateConditionGroup(
        strategy.exit_conditions as ConditionGroup,
        currentCandle,
        prevCandle,
        indicators,
        prevIndicators,
        currentTrade
      );
    }

    // Otherwise, return false - old strategies should be handled by existing logic
    return { result: false, details: { error: 'Legacy strategy format' } };
  }

  /**
   * Evaluate a condition group (multiple conditions with AND/OR operator)
   */
  private static evaluateConditionGroup(
    group: ConditionGroup,
    currentCandle: Candle,
    prevCandle: Candle,
    indicators: Indicators,
    prevIndicators: Indicators,
    currentTrade: Trade | null
  ): { result: boolean; details: any } {
    if (!group.conditions || group.conditions.length === 0) {
      return { result: false, details: { error: 'No conditions defined' } };
    }

    // Build expression context
    const context = this.buildExpressionContext(
      currentCandle,
      prevCandle,
      indicators,
      prevIndicators,
      currentTrade
    );

    // Evaluate each condition
    const results = group.conditions.map(condition => {
      try {
        const result = ExpressionParser.evaluate(condition.expression, context);
        return {
          id: condition.id,
          description: condition.description,
          expression: condition.expression,
          result: Boolean(result),
          success: true
        };
      } catch (error: any) {
        return {
          id: condition.id,
          description: condition.description,
          expression: condition.expression,
          result: false,
          success: false,
          error: error.message
        };
      }
    });

    // Combine results based on operator
    let finalResult: boolean;
    if (group.operator === 'AND') {
      finalResult = results.every(r => r.success && r.result);
    } else {
      // OR
      finalResult = results.some(r => r.success && r.result);
    }

    return {
      result: finalResult,
      details: {
        operator: group.operator,
        conditions: results,
        passedCount: results.filter(r => r.success && r.result).length,
        totalCount: results.length
      }
    };
  }

  /**
   * Build expression context from current market data
   */
  private static buildExpressionContext(
    currentCandle: Candle,
    prevCandle: Candle,
    indicators: Indicators,
    prevIndicators: Indicators,
    currentTrade: Trade | null
  ): ExpressionContext {
    // Calculate profit/loss if in trade
    let profit = 0;
    let loss = 0;

    if (currentTrade) {
      const priceChange = currentCandle.close - currentTrade.entryPrice;
      const priceChangePercent = (priceChange / currentTrade.entryPrice) * 100;

      if (priceChangePercent > 0) {
        profit = priceChangePercent;
      } else {
        loss = Math.abs(priceChangePercent);
      }
    }

    return {
      // Price data
      OPEN: currentCandle.open,
      HIGH: currentCandle.high,
      LOW: currentCandle.low,
      CLOSE: currentCandle.close,
      VOLUME: currentCandle.volume,

      // Current indicators
      EMA9: indicators.ema9,
      EMA20: indicators.ema20,
      EMA50: indicators.ema50,
      EMA200: indicators.ema200,
      SMA9: indicators.sma9,
      SMA20: indicators.sma20,
      SMA50: indicators.sma50,
      SMA200: indicators.sma200,
      RSI: indicators.rsi,
      MACD: indicators.macd,
      MACD_SIGNAL: indicators.macdSignal,
      MACD_HISTOGRAM: indicators.macdHistogram,
      BB_UPPER: indicators.bbUpper,
      BB_MIDDLE: indicators.bbMiddle,
      BB_LOWER: indicators.bbLower,
      ADX: indicators.adx,
      ATR: indicators.atr,
      STOCH_K: indicators.stochK,
      STOCH_D: indicators.stochD,
      VOLUME_AVG: indicators.volumeAvg,
      VWAP: indicators.vwap,

      // Previous indicators (for crossover detection)
      PREV_EMA9: prevIndicators.ema9,
      PREV_EMA20: prevIndicators.ema20,
      PREV_EMA50: prevIndicators.ema50,
      PREV_MACD: prevIndicators.macd,
      PREV_MACD_SIGNAL: prevIndicators.macdSignal,
      PREV_RSI: prevIndicators.rsi,
      PREV_CLOSE: prevCandle.close,
      PREV_VOLUME: prevCandle.volume,

      // Trade metrics
      PROFIT: profit,
      LOSS: loss
    };
  }

  /**
   * Get all indicators required by a strategy
   */
  static getRequiredIndicators(strategy: CustomStrategy): string[] {
    if (!this.isExpressionBasedStrategy(strategy)) {
      return [];
    }

    const indicators = new Set<string>();

    const entryGroup = strategy.entry_conditions as ConditionGroup;
    const exitGroup = strategy.exit_conditions as ConditionGroup;

    // Get indicators from entry conditions
    entryGroup.conditions.forEach(condition => {
      const used = ExpressionParser.getUsedIndicators(condition.expression);
      used.forEach(ind => indicators.add(ind));
    });

    // Get indicators from exit conditions
    exitGroup.conditions.forEach(condition => {
      const used = ExpressionParser.getUsedIndicators(condition.expression);
      used.forEach(ind => indicators.add(ind));
    });

    return Array.from(indicators);
  }

  /**
   * Validate a strategy's conditions
   */
  static validateStrategy(strategy: CustomStrategy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isExpressionBasedStrategy(strategy)) {
      return { valid: true, errors: [] }; // Legacy format, assume valid
    }

    const entryGroup = strategy.entry_conditions as ConditionGroup;
    const exitGroup = strategy.exit_conditions as ConditionGroup;

    // Validate entry conditions
    entryGroup.conditions.forEach((condition, idx) => {
      const validation = ExpressionParser.validate(condition.expression);
      if (!validation.valid) {
        errors.push(`Entry condition ${idx + 1} (${condition.description}): ${validation.error}`);
      }
    });

    // Validate exit conditions
    exitGroup.conditions.forEach((condition, idx) => {
      const validation = ExpressionParser.validate(condition.expression);
      if (!validation.valid) {
        errors.push(`Exit condition ${idx + 1} (${condition.description}): ${validation.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
