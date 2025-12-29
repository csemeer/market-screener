/**
 * EOD Routes - API endpoints for EOD analysis and watchlist management
 */

import { Router, Request, Response } from 'express';
import { databaseService } from '../services/databaseService';
import { eodScannerService } from '../services/eodScannerService';
import { liveMonitoringService } from '../services/liveMonitoringService';
import { loggerService } from '../services/loggerService';

const router = Router();

/**
 * POST /api/eod/scan
 * Trigger EOD analysis and generate watchlist for tomorrow
 */
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const config = {
      exchanges: req.body.exchanges,
      minScore: req.body.minScore,
      maxStocks: req.body.maxStocks,
      lookbackDays: req.body.lookbackDays,
      includeIntraday: req.body.includeIntraday,
      includeSwing: req.body.includeSwing,
      includePositional: req.body.includePositional,
    };

    // Run EOD scan in background
    eodScannerService.runEODScan(config).then(result => {
      loggerService.info('EOD scan completed successfully', {
        watchlistId: result.watchlistId,
        stocksAnalyzed: result.stocksAnalyzed,
        stocksSelected: result.stocksSelected,
      });
    }).catch(error => {
      loggerService.error('EOD scan failed', { error });
    });

    res.json({
      success: true,
      message: 'EOD scan initiated. Check status for progress.',
    });
  } catch (error) {
    loggerService.error('Error triggering EOD scan', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger EOD scan',
    });
  }
});

/**
 * GET /api/eod/scan/sync
 * Trigger EOD scan synchronously (wait for completion)
 */
router.get('/scan/sync', async (req: Request, res: Response) => {
  try {
    const config = {
      exchanges: req.query.exchanges ? (req.query.exchanges as string).split(',') : undefined,
      minScore: req.query.minScore ? parseInt(req.query.minScore as string) : undefined,
      maxStocks: req.query.maxStocks ? parseInt(req.query.maxStocks as string) : undefined,
      lookbackDays: req.query.lookbackDays ? parseInt(req.query.lookbackDays as string) : undefined,
    };

    const result = await eodScannerService.runEODScan(config as any);

    res.json({
      success: true,
      watchlistId: result.watchlistId,
      stocksAnalyzed: result.stocksAnalyzed,
      stocksSelected: result.stocksSelected,
      topStocks: result.topStocks.map(stock => ({
        symbol: stock.symbol,
        exchange: stock.exchange,
        setupType: stock.setupType,
        timeframe: stock.timeframe,
        score: stock.score,
        entryPrice: stock.entryPrice,
        stopLoss: stock.stopLoss,
        target1: stock.target1,
        target2: stock.target2,
        target3: stock.target3,
        riskRewardRatio: stock.riskRewardRatio,
      })),
    });
  } catch (error) {
    loggerService.error('Error in synchronous EOD scan', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete EOD scan',
    });
  }
});

/**
 * GET /api/eod/watchlist
 * Get latest watchlist with all stocks
 */
router.get('/watchlist', async (req: Request, res: Response) => {
  try {
    const result = databaseService.getLatestWatchlist();

    if (!result) {
      return res.json({
        success: true,
        message: 'No watchlist found',
        watchlist: null,
        stocks: [],
      });
    }

    res.json({
      success: true,
      watchlist: result.watchlist,
      stocks: result.stocks,
      totalStocks: result.stocks.length,
    });
  } catch (error) {
    loggerService.error('Error fetching latest watchlist', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist',
    });
  }
});

/**
 * GET /api/eod/watchlist/:date
 * Get watchlist for a specific date (format: YYYY-MM-DD)
 */
router.get('/watchlist/:date', async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date);

    if (isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const result = databaseService.getWatchlistByDate(date);

    if (!result) {
      return res.json({
        success: true,
        message: `No watchlist found for ${req.params.date}`,
        watchlist: null,
        stocks: [],
      });
    }

    res.json({
      success: true,
      watchlist: result.watchlist,
      stocks: result.stocks,
      totalStocks: result.stocks.length,
    });
  } catch (error) {
    loggerService.error('Error fetching watchlist by date', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch watchlist',
    });
  }
});

/**
 * GET /api/eod/watchlist/today
 * Get today's watchlist stocks
 */
router.get('/watchlist/today', async (req: Request, res: Response) => {
  try {
    const stocks = databaseService.getTodayWatchlist();

    res.json({
      success: true,
      totalStocks: stocks.length,
      stocks,
    });
  } catch (error) {
    loggerService.error('Error fetching today watchlist', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today watchlist',
    });
  }
});

/**
 * GET /api/eod/stocks/:status
 * Get watchlist stocks by status (PENDING, TRIGGERED, ENTERED, EXITED, etc.)
 */
router.get('/stocks/:status', async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const stocks = databaseService.getWatchlistStocksByStatus(status);

    res.json({
      success: true,
      status,
      totalStocks: stocks.length,
      stocks,
    });
  } catch (error) {
    loggerService.error('Error fetching stocks by status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stocks',
    });
  }
});

/**
 * PUT /api/eod/stocks/:id/status
 * Update watchlist stock status
 */
router.put('/stocks/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, triggerPrice, triggerTime } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    databaseService.updateWatchlistStockStatus(
      id,
      status,
      triggerPrice,
      triggerTime ? new Date(triggerTime) : undefined
    );

    res.json({
      success: true,
      message: 'Stock status updated successfully',
    });
  } catch (error) {
    loggerService.error('Error updating stock status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update stock status',
    });
  }
});

/**
 * GET /api/eod/status
 * Get EOD scanner status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = eodScannerService.getStatus();

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    loggerService.error('Error fetching EOD scanner status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
    });
  }
});

/**
 * GET /api/eod/trades
 * Get trade history
 */
router.get('/trades', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 100;

    let trades;
    if (status === 'OPEN') {
      trades = databaseService.getOpenTrades();
    } else if (status === 'CLOSED') {
      trades = databaseService.getClosedTrades(limit);
    } else {
      // Get both
      const openTrades = databaseService.getOpenTrades();
      const closedTrades = databaseService.getClosedTrades(limit);
      trades = [...openTrades, ...closedTrades];
    }

    res.json({
      success: true,
      totalTrades: trades.length,
      trades,
    });
  } catch (error) {
    loggerService.error('Error fetching trades', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trades',
    });
  }
});

/**
 * GET /api/eod/positions
 * Get open positions
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    const positions = databaseService.getOpenPositions();

    res.json({
      success: true,
      totalPositions: positions.length,
      positions,
    });
  } catch (error) {
    loggerService.error('Error fetching positions', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch positions',
    });
  }
});

/**
 * GET /api/eod/performance
 * Get trade performance statistics
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const stats = databaseService.getTradePerformanceStats(days);

    res.json({
      success: true,
      period: `Last ${days} days`,
      stats,
    });
  } catch (error) {
    loggerService.error('Error fetching performance stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance statistics',
    });
  }
});

/**
 * GET /api/eod/monitoring/status
 * Get live monitoring status
 */
router.get('/monitoring/status', async (req: Request, res: Response) => {
  try {
    const status = liveMonitoringService.getStatus();

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    loggerService.error('Error fetching monitoring status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring status',
    });
  }
});

/**
 * POST /api/eod/monitoring/start
 * Manually start live monitoring
 */
router.post('/monitoring/start', async (req: Request, res: Response) => {
  try {
    await liveMonitoringService.startMonitoring();

    res.json({
      success: true,
      message: 'Live monitoring started',
    });
  } catch (error) {
    loggerService.error('Error starting monitoring', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start monitoring',
    });
  }
});

/**
 * POST /api/eod/monitoring/stop
 * Manually stop live monitoring
 */
router.post('/monitoring/stop', async (req: Request, res: Response) => {
  try {
    liveMonitoringService.stopMonitoring();

    res.json({
      success: true,
      message: 'Live monitoring stopped',
    });
  } catch (error) {
    loggerService.error('Error stopping monitoring', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring',
    });
  }
});

/**
 * PUT /api/eod/monitoring/config
 * Update monitoring configuration
 */
router.put('/monitoring/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    liveMonitoringService.updateConfig(config);

    res.json({
      success: true,
      message: 'Monitoring config updated',
      config,
    });
  } catch (error) {
    loggerService.error('Error updating monitoring config', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update config',
    });
  }
});

/**
 * POST /api/eod/monitoring/test/:symbol
 * Manually monitor a specific stock (for testing)
 */
router.post('/monitoring/test/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { exchange } = req.body;

    if (!exchange) {
      return res.status(400).json({
        success: false,
        error: 'Exchange is required',
      });
    }

    const result = await liveMonitoringService.monitorStockManually(symbol, exchange);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    loggerService.error('Error in manual stock monitoring', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to monitor stock',
    });
  }
});

export default router;
