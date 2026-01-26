/**
 * Professional Expression Parser for Trading Strategies
 * Supports arithmetic operations, relational operators, and indicator references
 */

export interface ExpressionContext {
  // Price data
  OPEN: number;
  HIGH: number;
  LOW: number;
  CLOSE: number;
  VOLUME: number;

  // Indicators
  EMA9?: number;
  EMA20?: number;
  EMA50?: number;
  EMA200?: number;
  SMA9?: number;
  SMA20?: number;
  SMA50?: number;
  SMA200?: number;
  RSI?: number;
  MACD?: number;
  MACD_SIGNAL?: number;
  MACD_HISTOGRAM?: number;
  BB_UPPER?: number;
  BB_MIDDLE?: number;
  BB_LOWER?: number;
  ADX?: number;
  ATR?: number;
  STOCH_K?: number;
  STOCH_D?: number;
  VOLUME_AVG?: number;
  VWAP?: number;

  // Trade metrics
  PROFIT?: number;  // Profit percentage
  LOSS?: number;    // Loss percentage

  // Previous candle indicators (for crossovers)
  PREV_EMA9?: number;
  PREV_EMA20?: number;
  PREV_EMA50?: number;
  PREV_MACD?: number;
  PREV_MACD_SIGNAL?: number;
  PREV_RSI?: number;
  PREV_CLOSE?: number;
  PREV_VOLUME?: number;
}

export class ExpressionParser {
  /**
   * Evaluate a mathematical/logical expression with context
   * Supports: +, -, *, /, %, (, ), >, <, >=, <=, ==, !=, AND, OR, NOT
   */
  static evaluate(expression: string, context: ExpressionContext): boolean | number {
    try {
      // Replace indicator names with values from context
      let processedExpression = expression.toUpperCase();

      // Replace all context variables with their values
      Object.entries(context).forEach(([key, value]) => {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processedExpression = processedExpression.replace(regex, String(value ?? 0));
      });

      // Replace logical operators
      processedExpression = processedExpression
        .replace(/\bAND\b/g, '&&')
        .replace(/\bOR\b/g, '||')
        .replace(/\bNOT\b/g, '!');

      // Evaluate the expression safely
      const result = this.safeEval(processedExpression);

      return result;
    } catch (error) {
      console.error('Expression evaluation error:', error, 'Expression:', expression);
      return false;
    }
  }

  /**
   * Safe evaluation of mathematical expressions
   * Uses Function constructor to avoid eval() security issues
   */
  private static safeEval(expression: string): boolean | number {
    // Validate expression - only allow numbers, operators, and parentheses
    const validPattern = /^[\d\s+\-*/%().<>=!&|]+$/;
    if (!validPattern.test(expression)) {
      throw new Error(`Invalid expression: ${expression}`);
    }

    // Create a safe function that returns the result
    const func = new Function(`return ${expression}`);
    return func();
  }

  /**
   * Validate an expression syntax
   */
  static validate(expression: string): { valid: boolean; error?: string } {
    try {
      // Check for balanced parentheses
      let parenthesesCount = 0;
      for (const char of expression) {
        if (char === '(') parenthesesCount++;
        if (char === ')') parenthesesCount--;
        if (parenthesesCount < 0) {
          return { valid: false, error: 'Unbalanced parentheses' };
        }
      }
      if (parenthesesCount !== 0) {
        return { valid: false, error: 'Unbalanced parentheses' };
      }

      // Check for valid operators
      const validOperators = ['+', '-', '*', '/', '%', '(', ')', '>', '<', '=', '!', '&', '|'];
      const validKeywords = ['AND', 'OR', 'NOT', 'EMA', 'SMA', 'RSI', 'MACD', 'BB', 'ADX', 'ATR', 'STOCH', 'VOLUME', 'VWAP', 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'PROFIT', 'LOSS', 'PREV'];

      // Basic validation
      const tokens = expression.toUpperCase().match(/[A-Z_]+|[\d.]+|[+\-*/%()<>=!&|]/g) || [];

      for (const token of tokens) {
        if (token.match(/^[\d.]+$/)) continue; // Number
        if (validOperators.includes(token)) continue; // Operator
        if (validKeywords.some(kw => token.includes(kw))) continue; // Keyword

        return { valid: false, error: `Unknown token: ${token}` };
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get all indicators used in an expression
   */
  static getUsedIndicators(expression: string): string[] {
    const indicators: Set<string> = new Set();
    const upperExpression = expression.toUpperCase();

    const indicatorPatterns = [
      'EMA9', 'EMA20', 'EMA50', 'EMA200',
      'SMA9', 'SMA20', 'SMA50', 'SMA200',
      'RSI', 'MACD', 'MACD_SIGNAL', 'MACD_HISTOGRAM',
      'BB_UPPER', 'BB_MIDDLE', 'BB_LOWER',
      'ADX', 'ATR', 'STOCH_K', 'STOCH_D',
      'VOLUME_AVG', 'VWAP',
      'PREV_EMA9', 'PREV_EMA20', 'PREV_EMA50',
      'PREV_MACD', 'PREV_MACD_SIGNAL', 'PREV_RSI',
      'PREV_CLOSE', 'PREV_VOLUME'
    ];

    indicatorPatterns.forEach(indicator => {
      if (upperExpression.includes(indicator)) {
        indicators.add(indicator);
      }
    });

    return Array.from(indicators);
  }

  /**
   * Format an expression with proper spacing
   */
  static formatExpression(expression: string): string {
    return expression
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\(\s+/g, '(') // Remove space after (
      .replace(/\s+\)/g, ')') // Remove space before )
      .replace(/([+\-*/%><!=])/g, ' $1 ') // Add space around operators
      .replace(/\s+/g, ' ')  // Normalize again
      .trim();
  }
}

/**
 * Pre-defined expression templates for common conditions
 */
export const EXPRESSION_TEMPLATES = {
  // RSI Conditions
  RSI_OVERSOLD: { expression: 'RSI < 30', description: 'RSI Oversold (< 30)' },
  RSI_OVERBOUGHT: { expression: 'RSI > 70', description: 'RSI Overbought (> 70)' },
  RSI_BULLISH: { expression: 'RSI > 50 AND RSI < 70', description: 'RSI Bullish Zone (50-70)' },
  RSI_BEARISH: { expression: 'RSI < 50 AND RSI > 30', description: 'RSI Bearish Zone (30-50)' },

  // EMA Crossovers
  EMA_GOLDEN_CROSS: { expression: 'EMA9 > EMA20 AND PREV_EMA9 <= PREV_EMA20', description: 'Golden Cross (EMA9 crosses above EMA20)' },
  EMA_DEATH_CROSS: { expression: 'EMA9 < EMA20 AND PREV_EMA9 >= PREV_EMA20', description: 'Death Cross (EMA9 crosses below EMA20)' },
  EMA_ALIGNED_BULL: { expression: 'EMA9 > EMA20 AND EMA20 > EMA50', description: 'EMAs Aligned Bullish' },
  EMA_ALIGNED_BEAR: { expression: 'EMA9 < EMA20 AND EMA20 < EMA50', description: 'EMAs Aligned Bearish' },
  PRICE_ABOVE_EMA20: { expression: 'CLOSE > EMA20', description: 'Price Above EMA20' },
  PRICE_BELOW_EMA20: { expression: 'CLOSE < EMA20', description: 'Price Below EMA20' },

  // MACD Conditions
  MACD_BULLISH_CROSS: { expression: 'MACD > MACD_SIGNAL AND PREV_MACD <= PREV_MACD_SIGNAL', description: 'MACD Bullish Crossover' },
  MACD_BEARISH_CROSS: { expression: 'MACD < MACD_SIGNAL AND PREV_MACD >= PREV_MACD_SIGNAL', description: 'MACD Bearish Crossover' },
  MACD_POSITIVE: { expression: 'MACD > 0', description: 'MACD Positive' },
  MACD_NEGATIVE: { expression: 'MACD < 0', description: 'MACD Negative' },
  MACD_HISTOGRAM_GROWING: { expression: 'MACD_HISTOGRAM > 0', description: 'MACD Histogram Growing' },

  // Bollinger Bands
  BB_TOUCH_LOWER: { expression: 'CLOSE <= BB_LOWER', description: 'Price Touches Lower BB' },
  BB_TOUCH_UPPER: { expression: 'CLOSE >= BB_UPPER', description: 'Price Touches Upper BB' },
  BB_SQUEEZE: { expression: '(BB_UPPER - BB_LOWER) / BB_MIDDLE < 0.04', description: 'Bollinger Band Squeeze (< 4%)' },

  // Volume Conditions
  VOLUME_SPIKE_2X: { expression: 'VOLUME > VOLUME_AVG * 2', description: 'Volume Spike (2x average)' },
  VOLUME_SPIKE_3X: { expression: 'VOLUME > VOLUME_AVG * 3', description: 'Volume Spike (3x average)' },
  ABOVE_AVERAGE_VOLUME: { expression: 'VOLUME > VOLUME_AVG * 1.5', description: 'Above Average Volume (1.5x)' },

  // Price Action
  BULLISH_CANDLE: { expression: 'CLOSE > OPEN', description: 'Bullish Candle (Close > Open)' },
  BEARISH_CANDLE: { expression: 'CLOSE < OPEN', description: 'Bearish Candle (Close < Open)' },
  HIGHER_HIGH: { expression: 'HIGH > PREV_CLOSE', description: 'Making Higher High' },
  LOWER_LOW: { expression: 'LOW < PREV_CLOSE', description: 'Making Lower Low' },

  // Profit/Loss
  PROFIT_TARGET_3: { expression: 'PROFIT >= 3', description: '3% Profit Target' },
  PROFIT_TARGET_5: { expression: 'PROFIT >= 5', description: '5% Profit Target' },
  STOP_LOSS_2: { expression: 'LOSS >= 2', description: '2% Stop Loss' },
  STOP_LOSS_3: { expression: 'LOSS >= 3', description: '3% Stop Loss' },
};
