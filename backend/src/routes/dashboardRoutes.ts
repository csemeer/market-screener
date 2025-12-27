/**
 * Dashboard Routes - API endpoints for auto-scan dashboard
 */

import { Router, Request, Response } from 'express';
import { databaseService } from '../services/databaseService';
import { autoScanService, INTRADAY_STRATEGIES, SWING_STRATEGIES } from '../services/autoScanService';
import { loggerService } from '../services/loggerService';

const router = Router();

/**
 * GET /api/dashboard/scan-results
 * Get latest auto-scan results grouped by strategy
 */
router.get('/scan-results', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const strategyType = req.query.type as string; // 'INTRADAY' | 'SWING' | undefined

    const results = databaseService.getLatestScanResults(hours);

    // Filter by strategy type if provided
    const filteredResults: any = {};
    for (const [strategy, stocks] of results.entries()) {
      if (strategyType) {
        // Check if strategy matches the requested type
        const matchesType = stocks.length > 0 && stocks[0].strategyType === strategyType;
        if (matchesType) {
          filteredResults[strategy] = stocks;
        }
      } else {
        filteredResults[strategy] = stocks;
      }
    }

    // Get performance stats for each strategy
    const strategyStats: any = {};
    for (const strategy of Object.keys(filteredResults)) {
      strategyStats[strategy] = databaseService.getStrategyPerformance(strategy, 30);
    }

    res.json({
      success: true,
      timeRange: `Last ${hours} hours`,
      strategyType: strategyType || 'ALL',
      totalStrategies: Object.keys(filteredResults).length,
      totalSignals: Object.values(filteredResults).reduce((sum: number, arr: any) => sum + arr.length, 0),
      results: filteredResults,
      performance: strategyStats,
    });
  } catch (error) {
    loggerService.error('Error fetching dashboard scan results', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan results',
    });
  }
});

/**
 * GET /api/dashboard/scan-results/:strategy
 * Get scan results for a specific strategy
 */
router.get('/scan-results/:strategy', async (req: Request, res: Response) => {
  try {
    const { strategy } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const results = databaseService.getScanResultsByStrategy(strategy, limit);
    const performance = databaseService.getStrategyPerformance(strategy, 30);

    res.json({
      success: true,
      strategy,
      totalResults: results.length,
      results,
      performance,
    });
  } catch (error) {
    loggerService.error('Error fetching strategy scan results', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategy results',
    });
  }
});

/**
 * GET /api/dashboard/active-signals
 * Get all active signals (not expired, not hit targets/stops)
 */
router.get('/active-signals', async (req: Request, res: Response) => {
  try {
    const results = databaseService.getActiveScanResults();

    // Group by strategy type
    const grouped = {
      INTRADAY: results.filter(r => r.strategyType === 'INTRADAY'),
      SWING: results.filter(r => r.strategyType === 'SWING'),
      LONG_TERM: results.filter(r => r.strategyType === 'LONG_TERM'),
    };

    res.json({
      success: true,
      totalActive: results.length,
      byType: {
        intraday: grouped.INTRADAY.length,
        swing: grouped.SWING.length,
        longTerm: grouped.LONG_TERM.length,
      },
      signals: grouped,
    });
  } catch (error) {
    loggerService.error('Error fetching active signals', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active signals',
    });
  }
});

/**
 * GET /api/dashboard/alerts
 * Get recent alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const unreadOnly = req.query.unreadOnly === 'true';

    const alerts = unreadOnly
      ? databaseService.getUnreadAlerts(100)
      : databaseService.getRecentAlerts(hours, 100);

    res.json({
      success: true,
      totalAlerts: alerts.length,
      unreadCount: alerts.filter(a => !a.read).length,
      alerts,
    });
  } catch (error) {
    loggerService.error('Error fetching alerts', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
    });
  }
});

/**
 * POST /api/dashboard/alerts/:id/mark-read
 * Mark an alert as read
 */
router.post('/alerts/:id/mark-read', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    databaseService.markAlertAsRead(id);

    res.json({
      success: true,
      message: 'Alert marked as read',
    });
  } catch (error) {
    loggerService.error('Error marking alert as read', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to mark alert as read',
    });
  }
});

/**
 * GET /api/dashboard/performance
 * Get overall performance statistics
 */
router.get('/performance', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    // Get performance for all strategies
    const allStrategies = [
      ...Object.keys(INTRADAY_STRATEGIES).map(k => `INTRADAY_${k}`),
      ...Object.keys(SWING_STRATEGIES).map(k => `SWING_${k}`),
    ];

    const performanceByStrategy: any = {};
    let totalSignals = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let totalProfit = 0;

    for (const strategy of allStrategies) {
      const perf = databaseService.getStrategyPerformance(strategy, days);
      performanceByStrategy[strategy] = perf;

      totalSignals += perf.totalSignals;
      const wins = Math.round((perf.completedSignals * perf.winRate) / 100);
      const losses = perf.completedSignals - wins;
      totalWins += wins;
      totalLosses += losses;
      totalProfit += perf.totalProfit;
    }

    const overallWinRate = totalWins + totalLosses > 0
      ? (totalWins / (totalWins + totalLosses)) * 100
      : 0;

    res.json({
      success: true,
      period: `Last ${days} days`,
      overall: {
        totalSignals,
        totalWins,
        totalLosses,
        winRate: Math.round(overallWinRate * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
      },
      byStrategy: performanceByStrategy,
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
 * GET /api/dashboard/strategies
 * Get all available strategies with their configurations
 */
router.get('/strategies', async (req: Request, res: Response) => {
  try {
    const intradayStrategies = Object.entries(INTRADAY_STRATEGIES).map(([key, strategy]) => ({
      key: `INTRADAY_${key}`,
      name: strategy.name,
      description: strategy.description,
      type: strategy.type,
      scanInterval: strategy.scanInterval,
      enabled: strategy.enabled,
      criteria: strategy.criteria,
      minConfidenceScore: strategy.minConfidenceScore,
      stopLossPercent: strategy.stopLossPercent,
      targetPercent: strategy.targetPercent,
    }));

    const swingStrategies = Object.entries(SWING_STRATEGIES).map(([key, strategy]) => ({
      key: `SWING_${key}`,
      name: strategy.name,
      description: strategy.description,
      type: strategy.type,
      scanInterval: strategy.scanInterval,
      enabled: strategy.enabled,
      criteria: strategy.criteria,
      minConfidenceScore: strategy.minConfidenceScore,
      stopLossPercent: strategy.stopLossPercent,
      targetPercent: strategy.targetPercent,
    }));

    res.json({
      success: true,
      strategies: {
        intraday: intradayStrategies,
        swing: swingStrategies,
      },
      totals: {
        intraday: intradayStrategies.length,
        swing: swingStrategies.length,
        total: intradayStrategies.length + swingStrategies.length,
      },
    });
  } catch (error) {
    loggerService.error('Error fetching strategies', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch strategies',
    });
  }
});

/**
 * GET /api/dashboard/status
 * Get auto-scan service status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = autoScanService.getStatus();

    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    loggerService.error('Error fetching auto-scan status', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
    });
  }
});

/**
 * POST /api/dashboard/scan-now
 * Trigger an immediate scan for all enabled strategies
 */
router.post('/scan-now', async (req: Request, res: Response) => {
  try {
    // Run all enabled scans in the background
    autoScanService.runAllEnabledScans().catch(error => {
      loggerService.error('Error in manual scan trigger', { error });
    });

    res.json({
      success: true,
      message: 'Scan initiated for all enabled strategies',
    });
  } catch (error) {
    loggerService.error('Error triggering manual scan', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to trigger scan',
    });
  }
});

/**
 * PUT /api/dashboard/scan-results/:id
 * Update a scan result (e.g., manual exit)
 */
router.put('/scan-results/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status, outcome, exitPrice, profitLoss, notes } = req.body;

    databaseService.updateScanResultStatus(id, status, outcome, exitPrice, profitLoss, notes);

    res.json({
      success: true,
      message: 'Scan result updated successfully',
    });
  } catch (error) {
    loggerService.error('Error updating scan result', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update scan result',
    });
  }
});

/**
 * DELETE /api/dashboard/cleanup
 * Clean up old scan results
 */
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const deletedCount = databaseService.cleanupOldResults(days);

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old scan results`,
      deletedCount,
    });
  } catch (error) {
    loggerService.error('Error cleaning up old results', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to clean up old results',
    });
  }
});

export default router;
