/**
 * Backtest Engine - Runs historical simulations of scalper strategies
 *
 * Features:
 * - Historical data fetching and processing
 * - Strategy execution on historical candles
 * - Realistic order fill simulation with slippage
 * - Comprehensive performance metrics calculation
 * - Equity curve tracking
 * - Trade-by-trade analysis
 */

import { databaseService } from './databaseService';
import { marketDataService } from './marketDataService';
import { TechnicalAnalysis } from '../utils/technicalIndicators';
import { loggerService } from './loggerService';
import { OHLCV, TechnicalIndicators } from '../types';

interface BacktestConfig {
  scalperId: number;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  backtestType: 'PERIOD' | 'INTRADAY' | 'CUSTOM';
}

interface BacktestTrade {
  symbol: string;
  exchange: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  exitPrice?: number;
  exitTime?: Date;
  stopLoss: number;
  target: number;
  status: 'OPEN' | 'CLOSED';
  closeReason?: 'TARGET_HIT' | 'STOP_LOSS' | 'TIME_EXIT' | 'END_OF_BACKTEST';
  grossPnL?: number;
  brokerage?: number;
  netPnL?: number;
  pnlPercent?: number;
  entrySignals?: string;
  indicatorsData?: string;
  durationMinutes?: number;
}

interface EquityCurvePoint {
  timestamp: Date;
  equity: number;
  cash: number;
  positions: number;
}

interface BacktestMetrics {
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netProfit: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  avgTradeDurationMinutes: number;
  totalBrokerage: number;
}

class BacktestEngine {
  private slippagePercent: number = 0.05; // 0.05% slippage
  private brokeragePerTrade: number = 20; // ₹20 per trade (flat for demo)

  /**
   * Run a backtest for a scalper configuration
   */
  async runBacktest(config: BacktestConfig): Promise<number> {
    const { scalperId, startDate, endDate, initialCapital, backtestType } = config;

    let backtestRunId: number | null = null;

    try {
      loggerService.info(`Starting backtest for scalper ${scalperId}`, {
        startDate,
        endDate,
        backtestType,
      });

      // Get scalper configuration
      const db = (databaseService as any).db;
      const scalperConfig = db.prepare('SELECT * FROM scalper_configs WHERE id = ?').get(scalperId);
      if (!scalperConfig) {
        throw new Error(`Scalper ${scalperId} not found`);
      }

      // Get stocks for this scalper
      const stocks = this.getScalperStocks(scalperId);
      if (stocks.length === 0) {
        throw new Error(`No stocks found for scalper ${scalperId}`);
      }

      // Create backtest run record
      backtestRunId = this.createBacktestRun(
        scalperId,
        scalperConfig.name,
        backtestType,
        startDate,
        endDate,
        initialCapital
      );

      // Update status to RUNNING
      this.updateBacktestStatus(backtestRunId, 'RUNNING');

      // Run simulation
      const result = await this.simulateStrategy(
        backtestRunId,
        scalperId,
        scalperConfig,
        stocks,
        startDate,
        endDate,
        initialCapital
      );

      // Calculate final metrics
      const metrics = this.calculateMetrics(result.trades, result.equityCurve, initialCapital);

      // Save results to database
      this.saveBacktestResults(backtestRunId, metrics, result.equityCurve, result.dailyReturns);

      // Update status to COMPLETED
      this.updateBacktestStatus(backtestRunId, 'COMPLETED');

      loggerService.success(`Backtest completed for scalper ${scalperId}`, {
        backtestRunId,
        totalTrades: metrics.totalTrades,
        finalCapital: metrics.finalCapital,
        totalReturn: `${metrics.totalReturnPercent.toFixed(2)}%`,
      });

      return backtestRunId;
    } catch (error: any) {
      loggerService.error(`Backtest failed for scalper ${scalperId}`, { error: error.message });

      // Update status to FAILED if backtestRunId exists
      if (backtestRunId) {
        try {
          this.updateBacktestStatus(backtestRunId, 'FAILED');
          const db = (databaseService as any).db;
          db.prepare(`
            UPDATE backtest_runs
            SET error_message = ?
            WHERE id = ?
          `).run(error.message || error.toString(), backtestRunId);
        } catch (updateError) {
          loggerService.error('Failed to update backtest status to FAILED', { updateError });
        }
      }

      throw error;
    }
  }

  /**
   * Simulate strategy execution on historical data
   */
  private async simulateStrategy(
    backtestRunId: number,
    scalperId: number,
    scalperConfig: any,
    stocks: any[],
    startDate: Date,
    endDate: Date,
    initialCapital: number
  ): Promise<{
    trades: BacktestTrade[];
    equityCurve: EquityCurvePoint[];
    dailyReturns: number[];
  }> {
    const trades: BacktestTrade[] = [];
    const equityCurve: EquityCurvePoint[] = [];
    const dailyReturns: number[] = [];

    let currentCapital = initialCapital;
    const openPositions: Map<string, BacktestTrade> = new Map();

    // Resolve strategy configuration (from strategy_id or embedded config)
    let indicators, entryConditions, exitConditions;

    if (scalperConfig.strategy_id) {
      // Load strategy from trading_strategies table
      const db = (databaseService as any).db;
      const strategy: any = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(scalperConfig.strategy_id);

      if (strategy) {
        loggerService.info(`Using strategy: ${strategy.name} (ID: ${strategy.id})`, { scalperId });
        indicators = JSON.parse(strategy.indicators_config || '{}');
        entryConditions = JSON.parse(strategy.entry_conditions || '{}');
        exitConditions = JSON.parse(strategy.exit_conditions || '{}');
      } else {
        loggerService.warn(`Strategy ${scalperConfig.strategy_id} not found, falling back to embedded config`, { scalperId });
        // Fall back to embedded configuration
        indicators = JSON.parse(scalperConfig.indicators_config || '{}');
        entryConditions = JSON.parse(scalperConfig.entry_conditions || '{}');
        exitConditions = JSON.parse(scalperConfig.exit_conditions || '{}');
      }
    } else {
      // Use embedded configuration (legacy scalpers)
      indicators = JSON.parse(scalperConfig.indicators_config || '{}');
      entryConditions = JSON.parse(scalperConfig.entry_conditions || '{}');
      exitConditions = JSON.parse(scalperConfig.exit_conditions || '{}');
    }

    // Parse strategy configuration
    const strategyConfig = {
      timeframe: scalperConfig.timeframe || '5m',
      indicators,
      entryConditions,
      exitConditions,
      maxPositionSize: scalperConfig.max_position_size || 50000,
      maxPositionsOpen: scalperConfig.max_positions_open || 3,
      positionSizingMethod: scalperConfig.position_sizing_method || 'FIXED',
      riskPerTrade: scalperConfig.risk_per_trade || 1.0,
    };

    // Fetch historical data for all stocks
    const stockDataMap = new Map<string, OHLCV[]>();

    for (const stock of stocks) {
      try {
        const interval = this.convertTimeframeToInterval(strategyConfig.timeframe);
        const range = this.calculateDateRange(startDate, endDate);

        const historicalData = await marketDataService.getHistoricalData(
          stock.symbol,
          stock.exchange,
          interval,
          range
        );

        // Filter data by date range
        const filteredData = historicalData.filter(
          (candle) =>
            candle.timestamp >= startDate && candle.timestamp <= endDate
        );

        stockDataMap.set(`${stock.symbol}_${stock.exchange}`, filteredData);

        loggerService.info(`Fetched ${filteredData.length} candles for ${stock.symbol}`, {
          interval,
          range,
        });
      } catch (error) {
        loggerService.error(`Failed to fetch data for ${stock.symbol}`, { error });
      }
    }

    // Get all unique timestamps across all stocks (for synchronized iteration)
    const allTimestamps = new Set<number>();
    stockDataMap.forEach((data) => {
      data.forEach((candle) => allTimestamps.add(candle.timestamp.getTime()));
    });

    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    let previousDayEquity = initialCapital;

    // Iterate through each timestamp (candle-by-candle simulation)
    for (let i = 0; i < sortedTimestamps.length; i++) {
      const timestamp = new Date(sortedTimestamps[i]);

      // Check and update open positions
      for (const [key, trade] of openPositions.entries()) {
        const stockData = stockDataMap.get(key);
        if (!stockData) continue;

        const currentCandle = stockData.find(
          (c) => c.timestamp.getTime() === timestamp.getTime()
        );
        if (!currentCandle) continue;

        // Check stop loss
        if (currentCandle.low <= trade.stopLoss) {
          this.closeTrade(trade, trade.stopLoss, timestamp, 'STOP_LOSS');
          // Return sale proceeds to capital (quantity * exitPrice - exit brokerage)
          currentCapital += (trade.quantity * (trade.exitPrice || 0) - this.brokeragePerTrade);
          trades.push(trade);
          this.saveBacktestTrade(backtestRunId, scalperId, trade);
          openPositions.delete(key);
          continue;
        }

        // Check target
        if (currentCandle.high >= trade.target) {
          this.closeTrade(trade, trade.target, timestamp, 'TARGET_HIT');
          // Return sale proceeds to capital (quantity * exitPrice - exit brokerage)
          currentCapital += (trade.quantity * (trade.exitPrice || 0) - this.brokeragePerTrade);
          trades.push(trade);
          this.saveBacktestTrade(backtestRunId, scalperId, trade);
          openPositions.delete(key);
          continue;
        }

        // Check time-based exit (max hold time)
        const maxHoldMinutes = strategyConfig.exitConditions.maxHoldTimeMinutes || 60;
        const holdMinutes = (timestamp.getTime() - trade.entryTime.getTime()) / (1000 * 60);

        if (holdMinutes >= maxHoldMinutes) {
          this.closeTrade(trade, currentCandle.close, timestamp, 'TIME_EXIT');
          // Return sale proceeds to capital (quantity * exitPrice - exit brokerage)
          currentCapital += (trade.quantity * (trade.exitPrice || 0) - this.brokeragePerTrade);
          trades.push(trade);
          this.saveBacktestTrade(backtestRunId, scalperId, trade);
          openPositions.delete(key);
        }
      }

      // Check for new entry signals (only if we have room for more positions)
      if (openPositions.size < strategyConfig.maxPositionsOpen) {
        for (const stock of stocks) {
          const key = `${stock.symbol}_${stock.exchange}`;

          // Skip if already in position
          if (openPositions.has(key)) continue;

          const stockData = stockDataMap.get(key);
          if (!stockData) continue;

          // Get data up to current timestamp
          const dataUpToNow = stockData.filter(
            (c) => c.timestamp.getTime() <= timestamp.getTime()
          );

          if (dataUpToNow.length < 50) continue; // Need enough data for indicators

          // Calculate indicators
          const indicators = TechnicalAnalysis.calculateAllIndicators(dataUpToNow);

          // Check entry conditions
          const signal = this.evaluateEntrySignal(
            dataUpToNow,
            indicators,
            strategyConfig
          );

          if (signal.shouldEnter) {
            const currentCandle = dataUpToNow[dataUpToNow.length - 1];

            // Calculate position size
            const positionSize = this.calculatePositionSize(
              currentCapital,
              currentCandle.close,
              strategyConfig
            );

            if (positionSize === 0) continue;

            // Create trade with entry slippage
            const entryPrice = this.applySlippage(currentCandle.close, 'BUY');
            const quantity = Math.floor(positionSize / entryPrice);

            if (quantity === 0) continue;

            const stopLoss = this.calculateStopLoss(
              entryPrice,
              strategyConfig.exitConditions.stopLossPercent || 0.5
            );
            const target = this.calculateTarget(
              entryPrice,
              strategyConfig.exitConditions.targetPercent || 1.0
            );

            const trade: BacktestTrade = {
              symbol: stock.symbol,
              exchange: stock.exchange,
              side: 'BUY',
              quantity,
              entryPrice,
              entryTime: timestamp,
              stopLoss,
              target,
              status: 'OPEN',
              entrySignals: JSON.stringify(signal.signals),
              indicatorsData: JSON.stringify({
                close: currentCandle.close,
                open: currentCandle.open,
                high: currentCandle.high,
                low: currentCandle.low,
                volume: currentCandle.volume,
                rsi: indicators.rsi,
                macd: indicators.macd?.macd,
                macd_signal: indicators.macd?.signal,
                macd_histogram: indicators.macd?.histogram,
                ema9: indicators.ema?.ema9,
                ema21: indicators.ema?.ema20, // Using ema20 as ema21
                ema50: indicators.ema?.ema50,
                bb_upper: indicators.bollingerBands?.upper,
                bb_middle: indicators.bollingerBands?.middle,
                bb_lower: indicators.bollingerBands?.lower,
                vwap: indicators.vwap,
                adx: indicators.adx,
              }),
            };

            openPositions.set(key, trade);
            currentCapital -= (quantity * entryPrice + this.brokeragePerTrade);
          }
        }
      }

      // Track equity curve
      const positionsValue = Array.from(openPositions.values()).reduce((sum, trade) => {
        const stockData = stockDataMap.get(`${trade.symbol}_${trade.exchange}`);
        if (!stockData) return sum;

        const currentCandle = stockData.find(
          (c) => c.timestamp.getTime() === timestamp.getTime()
        );

        return sum + (currentCandle ? currentCandle.close * trade.quantity : 0);
      }, 0);

      const totalEquity = currentCapital + positionsValue;

      equityCurve.push({
        timestamp,
        equity: totalEquity,
        cash: currentCapital,
        positions: positionsValue,
      });

      // Calculate daily returns
      if (timestamp.getHours() === 15 && timestamp.getMinutes() === 30) {
        // Market close time (Indian market)
        const dailyReturn = ((totalEquity - previousDayEquity) / previousDayEquity) * 100;
        dailyReturns.push(dailyReturn);
        previousDayEquity = totalEquity;
      }
    }

    // Close all remaining open positions at end of backtest
    for (const [key, trade] of openPositions.entries()) {
      const stockData = stockDataMap.get(key);
      if (!stockData || stockData.length === 0) continue;

      const lastCandle = stockData[stockData.length - 1];
      this.closeTrade(trade, lastCandle.close, lastCandle.timestamp, 'END_OF_BACKTEST');
      // Return sale proceeds to capital (quantity * exitPrice - exit brokerage)
      currentCapital += (trade.quantity * (trade.exitPrice || 0) - this.brokeragePerTrade);
      trades.push(trade);
      this.saveBacktestTrade(backtestRunId, scalperId, trade);
    }

    return { trades, equityCurve, dailyReturns };
  }

  /**
   * Evaluate entry signal based on strategy conditions
   */
  private evaluateEntrySignal(
    data: OHLCV[],
    indicators: TechnicalIndicators,
    strategyConfig: any
  ): { shouldEnter: boolean; signals: string[] } {
    const signals: string[] = [];
    const entryConditions = strategyConfig.entryConditions;
    const currentPrice = data[data.length - 1].close;

    // Type-based entry logic
    if (entryConditions.type === 'MEAN_REVERSION') {
      // RSI oversold
      if (indicators.rsi && indicators.rsi < (entryConditions.rsiOversold || 30)) {
        signals.push(`RSI oversold: ${indicators.rsi.toFixed(1)}`);
      }

      // Bollinger Band pullback
      if (entryConditions.bbPullback && indicators.bollingerBands) {
        if (currentPrice <= indicators.bollingerBands.lower * 1.01) {
          signals.push('Price near lower Bollinger Band');
        }
      }
    } else if (entryConditions.type === 'TREND_FOLLOWING') {
      // EMA crossover
      if (indicators.ema?.ema9 && indicators.ema?.ema20) {
        if (indicators.ema.ema9 > indicators.ema.ema20) {
          signals.push('EMA bullish crossover');
        }
      }

      // ADX strength
      if (indicators.adx && indicators.adx > (entryConditions.adxThreshold || 25)) {
        signals.push(`Strong trend: ADX ${indicators.adx.toFixed(1)}`);
      }

      // Volume confirmation
      if (indicators.volumeProfile && indicators.volumeProfile.volumeRatio > 1.5) {
        signals.push(`High volume: ${indicators.volumeProfile.volumeRatio.toFixed(2)}x`);
      }
    } else if (entryConditions.type === 'VOLUME_BREAKOUT') {
      // Volume spike
      if (indicators.volumeProfile &&
          indicators.volumeProfile.volumeRatio > (entryConditions.volumeMultiple || 2)) {
        signals.push(`Volume breakout: ${indicators.volumeProfile.volumeRatio.toFixed(2)}x`);
      }

      // Price breakout (simplified - checking if above recent high)
      const recent20High = Math.max(...data.slice(-20).map((d) => d.high));
      if (currentPrice > recent20High * 0.99) {
        signals.push('Price breakout');
      }
    } else if (entryConditions.type === 'MOMENTUM') {
      // MACD crossover
      if (indicators.macd && indicators.macd.histogram > 0) {
        signals.push('MACD bullish');
      }

      // High volume
      if (indicators.volumeProfile &&
          indicators.volumeProfile.volumeRatio > (entryConditions.volumeMultiple || 2.5)) {
        signals.push(`Volume spike: ${indicators.volumeProfile.volumeRatio.toFixed(2)}x`);
      }

      // Momentum (price above EMA20)
      if (indicators.ema?.ema20 && currentPrice > indicators.ema.ema20) {
        signals.push('Price above EMA20');
      }
    }

    // Entry requires at least 2 signals for confirmation
    const shouldEnter = signals.length >= 2;

    return { shouldEnter, signals };
  }

  /**
   * Calculate position size based on risk management rules
   */
  private calculatePositionSize(
    capital: number,
    price: number,
    strategyConfig: any
  ): number {
    const maxPositionSize = strategyConfig.maxPositionSize || 50000;
    const method = strategyConfig.positionSizingMethod || 'FIXED';

    if (method === 'FIXED') {
      return Math.min(maxPositionSize, capital * 0.3); // Max 30% per position
    } else if (method === 'RISK_BASED') {
      const riskPercent = strategyConfig.riskPerTrade || 1.0;
      const riskAmount = capital * (riskPercent / 100);
      const stopLossPercent = strategyConfig.exitConditions?.stopLossPercent || 0.5;

      // Position size = Risk Amount / Stop Loss Distance
      return (riskAmount / (stopLossPercent / 100));
    }

    return maxPositionSize;
  }

  /**
   * Apply slippage to price
   */
  private applySlippage(price: number, side: 'BUY' | 'SELL'): number {
    const slippage = price * (this.slippagePercent / 100);
    return side === 'BUY' ? price + slippage : price - slippage;
  }

  /**
   * Calculate stop loss price
   */
  private calculateStopLoss(entryPrice: number, stopLossPercent: number): number {
    return entryPrice * (1 - stopLossPercent / 100);
  }

  /**
   * Calculate target price
   */
  private calculateTarget(entryPrice: number, targetPercent: number): number {
    return entryPrice * (1 + targetPercent / 100);
  }

  /**
   * Close a trade and calculate PnL
   */
  private closeTrade(
    trade: BacktestTrade,
    exitPrice: number,
    exitTime: Date,
    reason: 'TARGET_HIT' | 'STOP_LOSS' | 'TIME_EXIT' | 'END_OF_BACKTEST'
  ): void {
    const exitWithSlippage = this.applySlippage(exitPrice, 'SELL');

    trade.exitPrice = exitWithSlippage;
    trade.exitTime = exitTime;
    trade.status = 'CLOSED';
    trade.closeReason = reason;

    const grossPnL = (exitWithSlippage - trade.entryPrice) * trade.quantity;
    const brokerage = this.brokeragePerTrade * 2; // Entry + Exit

    trade.grossPnL = grossPnL;
    trade.brokerage = brokerage;
    trade.netPnL = grossPnL - brokerage;
    trade.pnlPercent = ((exitWithSlippage - trade.entryPrice) / trade.entryPrice) * 100;
    trade.durationMinutes = Math.round(
      (exitTime.getTime() - trade.entryTime.getTime()) / (1000 * 60)
    );
  }

  /**
   * Calculate comprehensive backtest metrics
   */
  private calculateMetrics(
    trades: BacktestTrade[],
    equityCurve: EquityCurvePoint[],
    initialCapital: number
  ): BacktestMetrics {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const finalCapital = equityCurve.length > 0
      ? equityCurve[equityCurve.length - 1].equity
      : initialCapital;

    const winningTrades = closedTrades.filter((t) => (t.netPnL || 0) > 0);
    const losingTrades = closedTrades.filter((t) => (t.netPnL || 0) < 0);

    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0));
    const netProfit = finalCapital - initialCapital;

    const totalBrokerage = closedTrades.reduce((sum, t) => sum + (t.brokerage || 0), 0);

    // Max drawdown calculation
    let peak = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const point of equityCurve) {
      if (point.equity > peak) {
        peak = point.equity;
      }
      const drawdown = peak - point.equity;
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    // Sharpe Ratio (simplified using equity curve daily changes)
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn =
        (equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Sortino Ratio (only downside deviation)
    const downsideReturns = returns.filter((r) => r < 0);
    const downsideStdDev = Math.sqrt(
      downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length
    );
    const sortinoRatio = downsideStdDev > 0 ? (avgReturn / downsideStdDev) * Math.sqrt(252) : 0;

    return {
      initialCapital,
      finalCapital: Math.round(finalCapital * 100) / 100,
      totalReturn: Math.round(netProfit * 100) / 100,
      totalReturnPercent: Math.round(((finalCapital - initialCapital) / initialCapital) * 10000) / 100,
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: closedTrades.length > 0
        ? Math.round((winningTrades.length / closedTrades.length) * 10000) / 100
        : 0,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossLoss: Math.round(grossLoss * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitFactor: grossLoss > 0 ? Math.round((grossProfit / grossLoss) * 100) / 100 : 0,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      avgWin: winningTrades.length > 0
        ? Math.round((grossProfit / winningTrades.length) * 100) / 100
        : 0,
      avgLoss: losingTrades.length > 0
        ? Math.round((grossLoss / losingTrades.length) * 100) / 100
        : 0,
      largestWin: winningTrades.length > 0
        ? Math.max(...winningTrades.map((t) => t.netPnL || 0))
        : 0,
      largestLoss: losingTrades.length > 0
        ? Math.min(...losingTrades.map((t) => t.netPnL || 0))
        : 0,
      avgTradeDurationMinutes: closedTrades.length > 0
        ? Math.round(closedTrades.reduce((sum, t) => sum + (t.durationMinutes || 0), 0) / closedTrades.length)
        : 0,
      totalBrokerage: Math.round(totalBrokerage * 100) / 100,
    };
  }

  /**
   * Helper methods
   */
  private convertTimeframeToInterval(timeframe: string): '1d' | '1h' | '15m' | '5m' {
    const map: Record<string, '1d' | '1h' | '15m' | '5m'> = {
      '1d': '1d',
      '1h': '1h',
      '15m': '15m',
      '5m': '5m',
      '3m': '5m', // Fallback to 5m
    };
    return map[timeframe] || '5m';
  }

  private calculateDateRange(startDate: Date, endDate: Date): string {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 5) return '5d';
    if (daysDiff <= 30) return '1mo';
    if (daysDiff <= 90) return '3mo';
    if (daysDiff <= 180) return '6mo';
    if (daysDiff <= 365) return '1y';
    return '5y';
  }

  private getScalperStocks(scalperId: number): any[] {
    const db = (databaseService as any).db;
    return db
      .prepare('SELECT * FROM scalping_stocks WHERE scalper_id = ? AND active = 1')
      .all(scalperId);
  }

  /**
   * Database operations
   */
  private createBacktestRun(
    scalperId: number,
    name: string,
    backtestType: 'PERIOD' | 'INTRADAY' | 'CUSTOM',
    startDate: Date,
    endDate: Date,
    initialCapital: number
  ): number {
    const db = (databaseService as any).db;

    const result = db.prepare(`
      INSERT INTO backtest_runs (
        scalper_id, name, backtest_type, start_date, end_date,
        initial_capital, status, started_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'))
    `).run(
      scalperId,
      `${name} - Backtest`,
      backtestType,
      startDate.toISOString(),
      endDate.toISOString(),
      initialCapital
    );

    return result.lastInsertRowid as number;
  }

  private updateBacktestStatus(
    backtestRunId: number,
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  ): void {
    const db = (databaseService as any).db;

    if (status === 'COMPLETED') {
      db.prepare(`
        UPDATE backtest_runs
        SET status = ?, completed_at = datetime('now')
        WHERE id = ?
      `).run(status, backtestRunId);
    } else {
      db.prepare(`
        UPDATE backtest_runs
        SET status = ?
        WHERE id = ?
      `).run(status, backtestRunId);
    }
  }

  private saveBacktestResults(
    backtestRunId: number,
    metrics: BacktestMetrics,
    equityCurve: EquityCurvePoint[],
    dailyReturns: number[]
  ): void {
    const db = (databaseService as any).db;

    db.prepare(`
      UPDATE backtest_runs SET
        final_capital = ?,
        total_return = ?,
        total_return_percent = ?,
        total_trades = ?,
        winning_trades = ?,
        losing_trades = ?,
        win_rate = ?,
        gross_profit = ?,
        gross_loss = ?,
        net_profit = ?,
        profit_factor = ?,
        max_drawdown = ?,
        max_drawdown_percent = ?,
        sharpe_ratio = ?,
        sortino_ratio = ?,
        avg_win = ?,
        avg_loss = ?,
        largest_win = ?,
        largest_loss = ?,
        avg_trade_duration_minutes = ?,
        total_brokerage = ?,
        equity_curve = ?,
        daily_returns = ?
      WHERE id = ?
    `).run(
      metrics.finalCapital,
      metrics.totalReturn,
      metrics.totalReturnPercent,
      metrics.totalTrades,
      metrics.winningTrades,
      metrics.losingTrades,
      metrics.winRate,
      metrics.grossProfit,
      metrics.grossLoss,
      metrics.netProfit,
      metrics.profitFactor,
      metrics.maxDrawdown,
      metrics.maxDrawdownPercent,
      metrics.sharpeRatio,
      metrics.sortinoRatio,
      metrics.avgWin,
      metrics.avgLoss,
      metrics.largestWin,
      metrics.largestLoss,
      metrics.avgTradeDurationMinutes,
      metrics.totalBrokerage,
      JSON.stringify(equityCurve),
      JSON.stringify(dailyReturns),
      backtestRunId
    );
  }

  private saveBacktestTrade(
    backtestRunId: number,
    scalperId: number,
    trade: BacktestTrade
  ): void {
    const db = (databaseService as any).db;

    db.prepare(`
      INSERT INTO backtest_trades (
        backtest_run_id, scalper_id, symbol, exchange, side,
        quantity, entry_price, entry_time, exit_price, exit_time,
        stop_loss, target, status, close_reason,
        gross_pnl, brokerage, net_pnl, pnl_percent,
        entry_signals, indicators_data, duration_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      backtestRunId,
      scalperId,
      trade.symbol,
      trade.exchange,
      trade.side,
      trade.quantity,
      trade.entryPrice,
      trade.entryTime.toISOString(),
      trade.exitPrice || null,
      trade.exitTime ? trade.exitTime.toISOString() : null,
      trade.stopLoss,
      trade.target,
      trade.status,
      trade.closeReason || null,
      trade.grossPnL || null,
      trade.brokerage || null,
      trade.netPnL || null,
      trade.pnlPercent || null,
      trade.entrySignals || null,
      trade.indicatorsData || null,
      trade.durationMinutes || null
    );
  }
}

export const backtestEngine = new BacktestEngine();
