/**
 * Backtest Routes - API endpoints for backtesting system
 */

import express from 'express';
import { backtestEngine } from '../services/backtestEngine';
import { databaseService } from '../services/databaseService';
import { marketDataService } from '../services/marketDataService';
import { TechnicalAnalysis } from '../utils/technicalIndicators';

const router = express.Router();

/**
 * POST /api/backtest/run
 * Start a new backtest
 *
 * Body:
 * {
 *   scalperId: number,
 *   startDate: string (ISO format),
 *   endDate: string (ISO format),
 *   initialCapital?: number (default: 100000),
 *   backtestType?: 'PERIOD' | 'INTRADAY' | 'CUSTOM'
 * }
 */
router.post('/run', async (req, res) => {
  try {
    const {
      scalperId,
      startDate,
      endDate,
      initialCapital = 100000,
      backtestType = 'PERIOD',
    } = req.body;

    // Validation
    if (!scalperId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'scalperId, startDate, and endDate are required',
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'startDate must be before endDate',
      });
    }

    // Run backtest (async - will take time)
    const backtestRunId = await backtestEngine.runBacktest({
      scalperId,
      startDate: start,
      endDate: end,
      initialCapital,
      backtestType,
    });

    res.json({
      success: true,
      backtestRunId,
      message: 'Backtest completed successfully',
    });
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run backtest',
    });
  }
});

/**
 * GET /api/backtest/runs
 * Get all backtest runs (optionally filtered by scalper)
 *
 * Query params:
 * - scalperId?: number
 * - status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
 * - limit?: number (default: 50)
 */
router.get('/runs', (req, res) => {
  try {
    const scalperId = req.query.scalperId ? parseInt(req.query.scalperId as string) : undefined;
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const db = (databaseService as any).db;

    let query = 'SELECT * FROM backtest_runs WHERE 1=1';
    const params: any[] = [];

    if (scalperId) {
      query += ' AND scalper_id = ?';
      params.push(scalperId);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const runs = db.prepare(query).all(...params);

    res.json({
      success: true,
      runs,
      total: runs.length,
    });
  } catch (error) {
    console.error('Error fetching backtest runs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtest runs',
    });
  }
});

/**
 * GET /api/backtest/runs/:id
 * Get detailed results for a specific backtest run
 */
router.get('/runs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;
    const run = db.prepare('SELECT * FROM backtest_runs WHERE id = ?').get(id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found',
      });
    }

    // Parse JSON fields
    if (run.equity_curve) {
      try {
        run.equity_curve = JSON.parse(run.equity_curve);
        // Ensure it's an array
        if (!Array.isArray(run.equity_curve)) {
          run.equity_curve = [];
        }
      } catch (e) {
        run.equity_curve = [];
      }
    } else {
      run.equity_curve = [];
    }

    if (run.daily_returns) {
      try {
        run.daily_returns = JSON.parse(run.daily_returns);
        if (!Array.isArray(run.daily_returns)) {
          run.daily_returns = [];
        }
      } catch (e) {
        run.daily_returns = [];
      }
    } else {
      run.daily_returns = [];
    }

    res.json({
      success: true,
      run,
    });
  } catch (error) {
    console.error('Error fetching backtest run:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtest run',
    });
  }
});

/**
 * GET /api/backtest/runs/:id/trades
 * Get all trades for a specific backtest run
 *
 * Query params:
 * - status?: 'OPEN' | 'CLOSED'
 * - symbol?: string
 * - limit?: number (default: 100)
 */
router.get('/runs/:id/trades', (req, res) => {
  try {
    const backtestRunId = parseInt(req.params.id);
    const status = req.query.status as string | undefined;
    const symbol = req.query.symbol as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    if (isNaN(backtestRunId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;

    let query = 'SELECT * FROM backtest_trades WHERE backtest_run_id = ?';
    const params: any[] = [backtestRunId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (symbol) {
      query += ' AND symbol = ?';
      params.push(symbol);
    }

    query += ' ORDER BY entry_time DESC LIMIT ?';
    params.push(limit);

    const trades = db.prepare(query).all(...params);

    // Parse JSON fields
    trades.forEach((trade: any) => {
      if (trade.entry_signals) {
        trade.entry_signals = JSON.parse(trade.entry_signals);
      }
      if (trade.indicators_data) {
        trade.indicators_data = JSON.parse(trade.indicators_data);
      }
    });

    res.json({
      success: true,
      trades,
      total: trades.length,
    });
  } catch (error) {
    console.error('Error fetching backtest trades:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtest trades',
    });
  }
});

/**
 * GET /api/backtest/runs/:id/equity-curve
 * Get equity curve data for visualization
 */
router.get('/runs/:id/equity-curve', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;
    const run = db.prepare('SELECT equity_curve FROM backtest_runs WHERE id = ?').get(id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found',
      });
    }

    const equityCurve = run.equity_curve ? JSON.parse(run.equity_curve) : [];

    res.json({
      success: true,
      equityCurve,
      dataPoints: equityCurve.length,
    });
  } catch (error) {
    console.error('Error fetching equity curve:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch equity curve',
    });
  }
});

/**
 * GET /api/backtest/runs/:id/metrics
 * Get performance metrics summary
 */
router.get('/runs/:id/metrics', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;
    const run = db.prepare(`
      SELECT
        initial_capital,
        final_capital,
        total_return,
        total_return_percent,
        total_trades,
        winning_trades,
        losing_trades,
        win_rate,
        gross_profit,
        gross_loss,
        net_profit,
        profit_factor,
        max_drawdown,
        max_drawdown_percent,
        sharpe_ratio,
        sortino_ratio,
        avg_win,
        avg_loss,
        largest_win,
        largest_loss,
        avg_trade_duration_minutes,
        total_brokerage
      FROM backtest_runs
      WHERE id = ?
    `).get(id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found',
      });
    }

    res.json({
      success: true,
      metrics: run,
    });
  } catch (error) {
    console.error('Error fetching backtest metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtest metrics',
    });
  }
});

/**
 * GET /api/backtest/runs/:id/daily-returns
 * Get daily returns data
 */
router.get('/runs/:id/daily-returns', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;
    const run = db.prepare('SELECT daily_returns FROM backtest_runs WHERE id = ?').get(id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found',
      });
    }

    const dailyReturns = run.daily_returns ? JSON.parse(run.daily_returns) : [];

    res.json({
      success: true,
      dailyReturns,
      dataPoints: dailyReturns.length,
    });
  } catch (error) {
    console.error('Error fetching daily returns:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily returns',
    });
  }
});

/**
 * DELETE /api/backtest/runs/:id
 * Delete a backtest run (and all its trades via CASCADE)
 */
router.delete('/runs/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;
    const result = db.prepare('DELETE FROM backtest_runs WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found',
      });
    }

    res.json({
      success: true,
      message: 'Backtest run deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting backtest run:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete backtest run',
    });
  }
});

/**
 * GET /api/backtest/scalpers/:scalperId/summary
 * Get summary of all backtests for a scalper
 */
router.get('/scalpers/:scalperId/summary', (req, res) => {
  try {
    const scalperId = parseInt(req.params.scalperId);

    if (isNaN(scalperId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scalper ID',
      });
    }

    const db = (databaseService as any).db;
    const runs = db.prepare(`
      SELECT
        id,
        name,
        backtest_type,
        start_date,
        end_date,
        initial_capital,
        final_capital,
        total_return_percent,
        total_trades,
        win_rate,
        sharpe_ratio,
        max_drawdown_percent,
        status,
        created_at,
        completed_at
      FROM backtest_runs
      WHERE scalper_id = ?
      ORDER BY created_at DESC
    `).all(scalperId);

    // Calculate aggregate statistics
    const completedRuns = runs.filter((r: any) => r.status === 'COMPLETED');
    const summary = {
      totalRuns: runs.length,
      completedRuns: completedRuns.length,
      avgReturn: completedRuns.length > 0
        ? completedRuns.reduce((sum: number, r: any) => sum + (r.total_return_percent || 0), 0) / completedRuns.length
        : 0,
      avgWinRate: completedRuns.length > 0
        ? completedRuns.reduce((sum: number, r: any) => sum + (r.win_rate || 0), 0) / completedRuns.length
        : 0,
      avgSharpe: completedRuns.length > 0
        ? completedRuns.reduce((sum: number, r: any) => sum + (r.sharpe_ratio || 0), 0) / completedRuns.length
        : 0,
      bestRun: completedRuns.length > 0
        ? completedRuns.reduce((best: any, r: any) =>
            (r.total_return_percent || 0) > (best.total_return_percent || 0) ? r : best
          )
        : null,
      worstRun: completedRuns.length > 0
        ? completedRuns.reduce((worst: any, r: any) =>
            (r.total_return_percent || 0) < (worst.total_return_percent || 0) ? r : worst
          )
        : null,
    };

    res.json({
      success: true,
      summary,
      runs,
    });
  } catch (error) {
    console.error('Error fetching scalper backtest summary:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backtest summary',
    });
  }
});

/**
 * POST /api/backtest/quick-test
 * Quick test for last market day (convenience endpoint)
 *
 * Body:
 * {
 *   scalperId: number
 * }
 */
router.post('/quick-test', async (req, res) => {
  try {
    const { scalperId } = req.body;

    if (!scalperId) {
      return res.status(400).json({
        success: false,
        error: 'scalperId is required',
      });
    }

    // Set dates to yesterday (last market day simulation)
    const endDate = new Date();
    endDate.setHours(15, 30, 0, 0); // Market close

    const startDate = new Date(endDate);
    startDate.setHours(9, 15, 0, 0); // Market open

    const backtestRunId = await backtestEngine.runBacktest({
      scalperId,
      startDate,
      endDate,
      initialCapital: 100000,
      backtestType: 'INTRADAY',
    });

    res.json({
      success: true,
      backtestRunId,
      message: 'Quick backtest completed successfully',
    });
  } catch (error) {
    console.error('Error running quick test:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to run quick test',
    });
  }
});

/**
 * GET /api/backtest/runs/:id/chart-data
 * Get COMPLETE candlestick chart data for the entire backtest period
 *
 * Returns:
 * - Full OHLCV candlestick data for the backtest period
 * - Technical indicators calculated for ALL candles
 * - Trade markers to overlay on the candlestick chart
 * - Complete visualization for strategy fine-tuning
 */
router.get('/runs/:id/chart-data', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backtest run ID',
      });
    }

    const db = (databaseService as any).db;

    // Get backtest run details with scalper config
    const run: any = db.prepare(`
      SELECT br.*, sc.timeframe, sc.symbol, sc.exchange
      FROM backtest_runs br
      JOIN scalper_configs sc ON br.scalper_id = sc.id
      WHERE br.id = ?
    `).get(id);

    if (!run) {
      return res.status(404).json({
        success: false,
        error: 'Backtest run not found',
      });
    }

    // Get all trades for markers
    const trades: any[] = db.prepare(`
      SELECT
        id, symbol, exchange, side, quantity,
        entry_price, entry_time, exit_price, exit_time,
        stop_loss, target, status, close_reason,
        net_pnl, pnl_percent, duration_minutes,
        entry_signals, indicators_data
      FROM backtest_trades
      WHERE backtest_run_id = ?
      ORDER BY entry_time ASC
    `).all(id);

    // Parse trade JSON fields
    const parsedTrades = trades.map((trade: any) => ({
      ...trade,
      entry_signals: trade.entry_signals ? JSON.parse(trade.entry_signals) : [],
      indicators_data: trade.indicators_data ? JSON.parse(trade.indicators_data) : {},
    }));

    // Fetch COMPLETE historical data for the backtest period
    const interval = convertTimeframeToInterval(run.timeframe);
    const range = calculateDateRange(new Date(run.start_date), new Date(run.end_date));

    const historicalData = await marketDataService.getHistoricalData(
      run.symbol,
      run.exchange,
      interval,
      range
    );

    if (!historicalData || historicalData.length === 0) {
      return res.json({
        success: true,
        chartData: {
          runId: id,
          symbol: run.symbol,
          exchange: run.exchange,
          timeframe: run.timeframe,
          startDate: run.start_date,
          endDate: run.end_date,
          candles: [],
          tradeMarkers: [],
          message: 'No historical data available for this period',
        },
      });
    }

    // Calculate indicators for ALL candles
    const ta = new (TechnicalAnalysis as any)(historicalData);
    const ema = ta.calculateEMA([9, 21, 50]);
    const rsi = ta.calculateRSI(14);
    const macd = ta.calculateMACD();
    const bollingerBands = ta.calculateBollingerBands(20, 2);
    const vwap = ta.calculateVWAP();
    const adx = ta.calculateADX(14);

    // Combine all data into candlestick format
    const candles = historicalData.map((candle: any, index: number) => ({
      time: candle.timestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
      // Technical indicators
      rsi: rsi[index],
      macd: macd[index]?.macd,
      macd_signal: macd[index]?.signal,
      macd_histogram: macd[index]?.histogram,
      ema9: ema.ema9[index],
      ema21: ema.ema20?.[index] || ema.ema21?.[index], // Handle both naming conventions
      ema50: ema.ema50[index],
      bb_upper: bollingerBands[index]?.upper,
      bb_middle: bollingerBands[index]?.middle,
      bb_lower: bollingerBands[index]?.lower,
      vwap: vwap[index],
      adx: adx[index],
    }));

    // Build trade markers for overlay
    const tradeMarkers = parsedTrades.map((trade: any) => ({
      id: trade.id,
      type: trade.side === 'BUY' ? 'entry' : 'exit',
      time: trade.entry_time,
      price: trade.entry_price,
      exitTime: trade.exit_time,
      exitPrice: trade.exit_price,
      stopLoss: trade.stop_loss,
      target: trade.target,
      result: trade.close_reason,
      pnl: trade.net_pnl,
      pnlPercent: trade.pnl_percent,
      signals: trade.entry_signals,
      indicators: trade.indicators_data,
    }));

    // Build response with complete chart data
    const chartData = {
      runId: id,
      symbol: run.symbol,
      exchange: run.exchange,
      timeframe: run.timeframe,
      startDate: run.start_date,
      endDate: run.end_date,

      // COMPLETE candlestick data for entire period
      candles,

      // Trade markers to overlay
      tradeMarkers,

      // Backwards compatibility
      priceData: candles, // Alias for existing code
      indicatorData: candles, // Alias for existing code

      // Summary stats
      stats: {
        totalCandles: candles.length,
        totalTrades: parsedTrades.length,
        winningTrades: parsedTrades.filter((t: any) => (t.net_pnl || 0) > 0).length,
        losingTrades: parsedTrades.filter((t: any) => (t.net_pnl || 0) < 0).length,
        priceRange: {
          low: Math.min(...candles.map((c: any) => c.low).filter(Boolean)),
          high: Math.max(...candles.map((c: any) => c.high).filter(Boolean)),
        },
      },
    };

    res.json({
      success: true,
      chartData,
      totalCandles: candles.length,
      totalMarkers: tradeMarkers.length,
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chart data',
    });
  }
});

// Helper functions
function convertTimeframeToInterval(timeframe: string): string {
  const map: { [key: string]: string } = {
    '1m': '1min',
    '3m': '3min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1hour',
    '2h': '2hour',
    '4h': '4hour',
    '1d': '1day',
  };
  return map[timeframe] || '5min';
}

function calculateDateRange(startDate: Date, endDate: Date): string {
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 1) return '1d';
  if (diffDays <= 7) return '7d';
  if (diffDays <= 30) return '1mo';
  if (diffDays <= 90) return '3mo';
  if (diffDays <= 180) return '6mo';
  if (diffDays <= 365) return '1y';
  return '2y';
}

export default router;
