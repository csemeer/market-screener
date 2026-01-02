/**
 * Auto-Scan Configuration Routes
 * Endpoints for managing auto-scan strategies and settings
 */

import express from 'express';
import { autoScanService } from '../services/autoScanService';
import { databaseService } from '../services/databaseService';
import { INTRADAY_STRATEGIES, SWING_STRATEGIES } from '../services/autoScanService';

const router = express.Router();

/**
 * GET /api/auto-scan/strategies
 * Get all available strategies with their current configuration
 */
router.get('/strategies', (req, res) => {
  try {
    const strategies = [];

    // Process intraday strategies
    for (const [key, strategy] of Object.entries(INTRADAY_STRATEGIES)) {
      const strategyKey = `INTRADAY_${key}`;
      const config = databaseService.getOrCreateAutoScanConfig(strategyKey);

      strategies.push({
        key: strategyKey,
        name: strategy.name,
        description: strategy.description,
        type: strategy.type,
        category: 'INTRADAY',
        criteria: strategy.criteria,
        defaultStopLossPercent: strategy.stopLossPercent,
        defaultTargetPercent: strategy.targetPercent,
        config: {
          enabled: config.enabled,
          scanInterval: config.scanInterval,
          markets: JSON.parse(config.markets),
          minConfidenceScore: config.minConfidenceScore,
          maxResultsPerScan: config.maxResultsPerScan,
          lastScanTime: config.lastScanTime,
          nextScanTime: config.nextScanTime,
        }
      });
    }

    // Process swing strategies
    for (const [key, strategy] of Object.entries(SWING_STRATEGIES)) {
      const strategyKey = `SWING_${key}`;
      const config = databaseService.getOrCreateAutoScanConfig(strategyKey);

      strategies.push({
        key: strategyKey,
        name: strategy.name,
        description: strategy.description,
        type: strategy.type,
        category: 'SWING',
        criteria: strategy.criteria,
        defaultStopLossPercent: strategy.stopLossPercent,
        defaultTargetPercent: strategy.targetPercent,
        config: {
          enabled: config.enabled,
          scanInterval: config.scanInterval,
          markets: JSON.parse(config.markets),
          minConfidenceScore: config.minConfidenceScore,
          maxResultsPerScan: config.maxResultsPerScan,
          lastScanTime: config.lastScanTime,
          nextScanTime: config.nextScanTime,
        }
      });
    }

    res.json({
      success: true,
      strategies,
      totalStrategies: strategies.length,
      intradayCount: Object.keys(INTRADAY_STRATEGIES).length,
      swingCount: Object.keys(SWING_STRATEGIES).length,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch strategies'
    });
  }
});

/**
 * PUT /api/auto-scan/strategies/:strategyKey
 * Update a strategy's configuration
 */
router.put('/strategies/:strategyKey', (req, res) => {
  try {
    const { strategyKey } = req.params;
    const { enabled, scanInterval, markets, minConfidenceScore, maxResultsPerScan } = req.body;

    // Validate strategy exists
    const strategyExists = strategyKey.startsWith('INTRADAY_')
      ? INTRADAY_STRATEGIES[strategyKey.replace('INTRADAY_', '') as keyof typeof INTRADAY_STRATEGIES]
      : SWING_STRATEGIES[strategyKey.replace('SWING_', '') as keyof typeof SWING_STRATEGIES];

    if (!strategyExists) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Build update object
    const updates: any = {};
    if (enabled !== undefined) updates.enabled = enabled;
    if (scanInterval !== undefined) {
      if (scanInterval < 1) {
        return res.status(400).json({
          success: false,
          error: 'Scan interval must be at least 1 minute'
        });
      }
      updates.scanInterval = scanInterval;
    }
    if (markets !== undefined) {
      if (!Array.isArray(markets) || markets.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Markets must be a non-empty array'
        });
      }
      updates.markets = JSON.stringify(markets);
    }
    if (minConfidenceScore !== undefined) {
      if (minConfidenceScore < 0 || minConfidenceScore > 100) {
        return res.status(400).json({
          success: false,
          error: 'Confidence score must be between 0 and 100'
        });
      }
      updates.minConfidenceScore = minConfidenceScore;
    }
    if (maxResultsPerScan !== undefined) {
      if (maxResultsPerScan < 1) {
        return res.status(400).json({
          success: false,
          error: 'Max results per scan must be at least 1'
        });
      }
      updates.maxResultsPerScan = maxResultsPerScan;
    }

    // Update config in database
    databaseService.updateAutoScanConfig(strategyKey, updates);

    // Get updated config
    const updatedConfig = databaseService.getOrCreateAutoScanConfig(strategyKey);

    res.json({
      success: true,
      message: 'Strategy configuration updated successfully',
      config: {
        enabled: updatedConfig.enabled,
        scanInterval: updatedConfig.scanInterval,
        markets: JSON.parse(updatedConfig.markets),
        minConfidenceScore: updatedConfig.minConfidenceScore,
        maxResultsPerScan: updatedConfig.maxResultsPerScan,
        lastScanTime: updatedConfig.lastScanTime,
        nextScanTime: updatedConfig.nextScanTime,
      }
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update strategy'
    });
  }
});

/**
 * POST /api/auto-scan/strategies/:strategyKey/run
 * Manually trigger a strategy scan
 */
router.post('/strategies/:strategyKey/run', async (req, res) => {
  try {
    const { strategyKey } = req.params;

    // Validate strategy exists
    const strategy = strategyKey.startsWith('INTRADAY_')
      ? INTRADAY_STRATEGIES[strategyKey.replace('INTRADAY_', '') as keyof typeof INTRADAY_STRATEGIES]
      : SWING_STRATEGIES[strategyKey.replace('SWING_', '') as keyof typeof SWING_STRATEGIES];

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Trigger manual scan
    // Note: This is an async operation, we'll return immediately
    res.json({
      success: true,
      message: `Manual scan triggered for ${strategy.name}`,
      note: 'Scan is running in the background. Check scan results in a few moments.'
    });

    // Run scan asynchronously (don't await)
    autoScanService['runScan'](strategyKey, strategy).catch(error => {
      console.error(`Error in manual scan for ${strategyKey}:`, error);
    });
  } catch (error) {
    console.error('Error triggering manual scan:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger manual scan'
    });
  }
});

/**
 * GET /api/auto-scan/status
 * Get auto-scan service status
 */
router.get('/status', (req, res) => {
  try {
    const status = autoScanService.getStatus();
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error fetching auto-scan status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch status'
    });
  }
});

export default router;
