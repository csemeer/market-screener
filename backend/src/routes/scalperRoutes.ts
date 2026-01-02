/**
 * Scalper Routes - API endpoints for auto-scalping system
 */

import express from 'express';
import { scalperService } from '../services/scalperService';

const router = express.Router();

/**
 * GET /api/scalper/configs
 * Get all scalper configurations
 */
router.get('/configs', (req, res) => {
  try {
    const configs = scalperService.getAllScalperConfigs();
    res.json({
      success: true,
      configs,
      total: configs.length,
    });
  } catch (error) {
    console.error('Error fetching scalper configs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scalper configs',
    });
  }
});

/**
 * GET /api/scalper/:id
 * Get a specific scalper configuration
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const config = scalperService.getScalperConfig(id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Scalper not found',
      });
    }

    const status = scalperService.getScalperStatus(id);

    res.json({
      success: true,
      config,
      status,
    });
  } catch (error) {
    console.error('Error fetching scalper:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scalper',
    });
  }
});

/**
 * POST /api/scalper/create
 * Create a new scalper configuration
 */
router.post('/create', (req, res) => {
  try {
    const config = req.body;
    const id = scalperService.createScalperConfig(config);

    res.json({
      success: true,
      id,
      message: 'Scalper configuration created successfully',
    });
  } catch (error) {
    console.error('Error creating scalper:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scalper',
    });
  }
});

/**
 * POST /api/scalper/:id/start
 * Start a scalper instance
 */
router.post('/:id/start', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await scalperService.startScalper(id);

    res.json({
      success: true,
      message: `Scalper ${id} started successfully`,
    });
  } catch (error) {
    console.error('Error starting scalper:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start scalper',
    });
  }
});

/**
 * POST /api/scalper/:id/stop
 * Stop a scalper instance
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await scalperService.stopScalper(id);

    res.json({
      success: true,
      message: `Scalper ${id} stopped successfully`,
    });
  } catch (error) {
    console.error('Error stopping scalper:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop scalper',
    });
  }
});

/**
 * POST /api/scalper/emergency-stop
 * Emergency stop all scalpers and close all positions
 */
router.post('/emergency-stop', async (req, res) => {
  try {
    await scalperService.emergencyStopAll();

    res.json({
      success: true,
      message: 'All scalpers stopped and positions closed',
    });
  } catch (error) {
    console.error('Error in emergency stop:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute emergency stop',
    });
  }
});

/**
 * GET /api/scalper/:id/positions
 * Get open positions for a scalper
 */
router.get('/:id/positions', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const positions = await scalperService.getOpenPositions(id);

    res.json({
      success: true,
      positions,
      total: positions.length,
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch positions',
    });
  }
});

/**
 * POST /api/scalper/:id/add-stock
 * Add a stock to scalper watchlist
 */
router.post('/:id/add-stock', (req, res) => {
  try {
    const scalperId = parseInt(req.params.id);
    const { symbol, exchange } = req.body;

    if (!symbol || !exchange) {
      return res.status(400).json({
        success: false,
        error: 'Symbol and exchange are required',
      });
    }

    const stockId = scalperService.addStockToScalper(scalperId, symbol, exchange);

    res.json({
      success: true,
      stockId,
      message: `${symbol} added to scalper ${scalperId}`,
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add stock',
    });
  }
});

/**
 * GET /api/scalper/:id/status
 * Get detailed status of a running scalper
 */
router.get('/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const status = scalperService.getScalperStatus(id);

    res.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch status',
    });
  }
});

/**
 * GET /api/scalper/:id/trades
 * Get trade history for a scalper
 */
router.get('/:id/trades', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const status = req.query.status as 'OPEN' | 'CLOSED' | undefined;
    const trades = scalperService.getScalperTrades(id, status);

    res.json({
      success: true,
      trades,
      total: trades.length,
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trades',
    });
  }
});

/**
 * GET /api/scalper/:id/stocks
 * Get stocks for a scalper
 */
router.get('/:id/stocks', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const stocks = scalperService.getScalperStocks(id);

    res.json({
      success: true,
      stocks,
      total: stocks.length,
    });
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch stocks',
    });
  }
});

/**
 * DELETE /api/scalper/:id/stocks/:stockId
 * Remove a stock from scalper watchlist
 */
router.delete('/:id/stocks/:stockId', (req, res) => {
  try {
    const scalperId = parseInt(req.params.id);
    const stockId = parseInt(req.params.stockId);

    scalperService.removeStockFromScalper(scalperId, stockId);

    res.json({
      success: true,
      message: `Stock removed from scalper ${scalperId}`,
    });
  } catch (error) {
    console.error('Error removing stock:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove stock',
    });
  }
});

export default router;
