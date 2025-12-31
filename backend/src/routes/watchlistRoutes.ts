/**
 * Custom Watchlist Routes - API endpoints for user-defined watchlists
 */

import express from 'express';
import { databaseService } from '../services/databaseService';
import { loggerService } from '../services/loggerService';
import { screenerService } from '../services/screenerService';

const router = express.Router();

// ==================== STOCK ANALYSIS FOR WATCHLIST ====================

/**
 * GET /api/watchlist/analyze/:symbol/:exchange
 * Analyze a single stock and get intelligent entry/stop/target recommendations
 * This endpoint is used by the watchlist to auto-populate trading parameters
 */
router.get('/analyze/:symbol/:exchange', async (req, res) => {
  try {
    const { symbol, exchange } = req.params;

    // Validate exchange
    const validExchanges = ['NSE', 'BSE', 'NYSE', 'NASDAQ'];
    if (!validExchanges.includes(exchange.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid exchange. Must be one of: ${validExchanges.join(', ')}`,
      });
    }

    loggerService.info('Analyzing stock for watchlist', { symbol, exchange });

    // Analyze the stock using screenerService
    const result = await screenerService.analyzeSingleStock(
      symbol.toUpperCase(),
      exchange.toUpperCase() as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    loggerService.success('Stock analysis completed', { symbol, exchange });
    res.json(result);
  } catch (error) {
    loggerService.error('Error analyzing stock', { error, symbol: req.params.symbol });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze stock',
    });
  }
});

// ==================== WATCHLIST MANAGEMENT ====================

/**
 * GET /api/watchlist
 * Get all custom watchlists for a user (Phase 4: Unified with source counts)
 */
router.get('/', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';

    // Phase 4: Use unified method with source counts
    const watchlistsWithCounts = databaseService.getWatchlistsWithCounts(userId);

    res.json(watchlistsWithCounts);
  } catch (error) {
    loggerService.error('Error fetching custom watchlists', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch custom watchlists',
    });
  }
});

/**
 * GET /api/watchlist/:id
 * Get a specific custom watchlist with its stocks
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const watchlist = databaseService.getCustomWatchlistById(id);

    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    const stocks = databaseService.getCustomWatchlistStocks(id);

    res.json({
      ...watchlist,
      stocks,
      stockCount: stocks.length,
      activeStockCount: stocks.filter(s => s.status === 'PENDING').length,
    });
  } catch (error) {
    loggerService.error('Error fetching custom watchlist', { error, id: req.params.id });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch custom watchlist',
    });
  }
});

/**
 * POST /api/watchlist
 * Create a new custom watchlist
 */
router.post('/', (req, res) => {
  try {
    const { userId = 'default', name, description, isActive = true } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Watchlist name is required',
      });
    }

    const id = databaseService.createCustomWatchlist({
      userId,
      name: name.trim(),
      description: description?.trim(),
      isActive,
    });

    loggerService.success('Custom watchlist created', { userId, name, id });

    const watchlist = databaseService.getCustomWatchlistById(id);

    res.status(201).json({
      success: true,
      message: 'Custom watchlist created successfully',
      watchlist,
    });
  } catch (error) {
    loggerService.error('Error creating custom watchlist', { error });

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        error: 'A watchlist with this name already exists',
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create custom watchlist',
    });
  }
});

/**
 * PUT /api/watchlist/:id
 * Update a custom watchlist
 */
router.put('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, isActive } = req.body;

    const watchlist = databaseService.getCustomWatchlistById(id);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (isActive !== undefined) updates.isActive = isActive;

    databaseService.updateCustomWatchlist(id, updates);

    loggerService.info('Custom watchlist updated', { id, updates });

    const updated = databaseService.getCustomWatchlistById(id);

    res.json({
      success: true,
      message: 'Custom watchlist updated successfully',
      watchlist: updated,
    });
  } catch (error) {
    loggerService.error('Error updating custom watchlist', { error, id: req.params.id });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update custom watchlist',
    });
  }
});

/**
 * DELETE /api/watchlist/:id
 * Delete a custom watchlist (cascades to stocks)
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const watchlist = databaseService.getCustomWatchlistById(id);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    databaseService.deleteCustomWatchlist(id);

    loggerService.info('Custom watchlist deleted', { id, name: watchlist.name });

    res.json({
      success: true,
      message: 'Custom watchlist deleted successfully',
    });
  } catch (error) {
    loggerService.error('Error deleting custom watchlist', { error, id: req.params.id });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete custom watchlist',
    });
  }
});

// ==================== WATCHLIST STOCKS MANAGEMENT ====================

/**
 * GET /api/watchlist/:id/stocks
 * Get all stocks in a custom watchlist (Phase 4: with optional source filtering)
 * Query params: ?source=AUTO_SCAN|MANUAL|SCREENER, ?status=PENDING|TRIGGERED|CANCELLED|EXPIRED
 */
router.get('/:id/stocks', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const source = req.query.source as 'AUTO_SCAN' | 'MANUAL' | 'SCREENER' | undefined;
    const status = req.query.status as 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED' | undefined;

    const watchlist = databaseService.getCustomWatchlistById(id);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    // Phase 4: Use filtered method with source support
    const filters: any = {};
    if (source) filters.source = source;
    if (status) filters.status = status;

    const stocks = databaseService.getCustomWatchlistStocksFiltered(id, filters);

    res.json(stocks);
  } catch (error) {
    loggerService.error('Error fetching watchlist stocks', { error, watchlistId: req.params.id });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch watchlist stocks',
    });
  }
});

/**
 * POST /api/watchlist/:id/stocks
 * Add a stock to a custom watchlist (manual entry with optional source tracking)
 */
router.post('/:id/stocks', (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);

    const watchlist = databaseService.getCustomWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    const {
      symbol,
      exchange,
      companyName,
      // Phase 4: Source tracking fields
      source = 'MANUAL',
      sourceId,
      sourceMetadata,
      setupType,
      timeframe,
      entryPrice,
      entryTrigger,
      stopLoss,
      target1,
      target2,
      target3,
      trailingStopPercent = 1.0,
      positionSizePercent = 1.0,
      notes,
      status = 'PENDING'
    } = req.body;

    // Validate required fields
    if (!symbol || !exchange || !entryPrice || !stopLoss || !target1) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, exchange, entryPrice, stopLoss, target1',
      });
    }

    // Validate numeric fields
    if (entryPrice <= 0 || stopLoss <= 0 || target1 <= 0) {
      return res.status(400).json({
        error: 'Price values must be greater than 0',
      });
    }

    // Validate targets are in order
    if (target1 <= entryPrice) {
      return res.status(400).json({
        error: 'Target 1 must be greater than entry price',
      });
    }

    if (target2 && target2 <= target1) {
      return res.status(400).json({
        error: 'Target 2 must be greater than Target 1',
      });
    }

    if (target3 && target2 && target3 <= target2) {
      return res.status(400).json({
        error: 'Target 3 must be greater than Target 2',
      });
    }

    const stockId = databaseService.addStockToCustomWatchlist({
      watchlistId,
      symbol: symbol.toUpperCase().trim(),
      exchange: exchange.toUpperCase().trim(),
      companyName,
      // Phase 4: Source tracking
      source,
      sourceId,
      sourceMetadata,
      setupType,
      timeframe,
      entryPrice,
      entryTrigger,
      stopLoss,
      target1,
      target2,
      target3,
      trailingStopPercent,
      positionSizePercent,
      notes,
      status,
    });

    loggerService.success('Stock added to custom watchlist', {
      watchlistId,
      symbol,
      exchange,
      stockId,
    });

    // Get the newly added stock
    const stocks = databaseService.getCustomWatchlistStocks(watchlistId);
    const newStock = stocks.find(s => s.id === stockId);

    res.status(201).json({
      success: true,
      message: 'Stock added to watchlist successfully',
      stock: newStock,
    });
  } catch (error) {
    loggerService.error('Error adding stock to watchlist', { error, watchlistId: req.params.id });

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return res.status(409).json({
        error: 'This stock is already in the watchlist',
      });
    }

    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add stock to watchlist',
    });
  }
});

// ==================== PHASE 4C: SOURCE-SPECIFIC ENDPOINTS ====================

/**
 * POST /api/watchlist/:id/stocks/from-scan/:scanId
 * Add a stock from auto-scan result to watchlist (Phase 4: Unified Watchlist)
 * This endpoint automatically populates stock details from scan_results table
 * with source='AUTO_SCAN' and appropriate metadata
 */
router.post('/:id/stocks/from-scan/:scanId', (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const scanResultId = parseInt(req.params.scanId);

    // Validate watchlist exists
    const watchlist = databaseService.getCustomWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        error: 'Watchlist not found',
      });
    }

    // Add stock from auto-scan using unified method
    const stockId = databaseService.addStockFromAutoScan(watchlistId, scanResultId);

    loggerService.success('Stock added from auto-scan to watchlist', {
      watchlistId,
      scanResultId,
      stockId,
    });

    // Get the newly added stock
    const stocks = databaseService.getCustomWatchlistStocksFiltered(watchlistId, {});
    const newStock = stocks.find(s => s.id === stockId);

    res.status(201).json({
      success: true,
      message: 'Stock added from auto-scan successfully',
      stock: newStock,
    });
  } catch (error) {
    loggerService.error('Error adding stock from auto-scan', {
      error,
      watchlistId: req.params.id,
      scanResultId: req.params.scanId,
    });

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Scan result not found')) {
        return res.status(404).json({
          success: false,
          error: 'Scan result not found',
        });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
    }

    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add stock from auto-scan',
    });
  }
});

/**
 * POST /api/watchlist/:id/stocks/from-screener
 * Add stocks from screener results to watchlist (Phase 4: Future enhancement)
 * Body: { stocks: [{ symbol, exchange, ...screenerData }] }
 */
router.post('/:id/stocks/from-screener', (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const { stocks } = req.body;

    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'stocks array is required and must not be empty',
      });
    }

    const watchlist = databaseService.getCustomWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({
        success: false,
        error: 'Watchlist not found',
      });
    }

    const addedStocks: any[] = [];
    const errors: any[] = [];

    // Add each stock with source='SCREENER'
    for (const stock of stocks) {
      try {
        const stockId = databaseService.addStockToCustomWatchlist({
          watchlistId,
          symbol: stock.symbol.toUpperCase().trim(),
          exchange: stock.exchange.toUpperCase().trim(),
          companyName: stock.companyName,
          source: 'SCREENER',
          sourceMetadata: JSON.stringify({
            rsi: stock.rsi,
            volume: stock.volume,
            marketCap: stock.marketCap,
            screenerCriteria: stock.criteria,
          }),
          setupType: stock.setupType || 'CUSTOM',
          timeframe: stock.timeframe || 'SWING',
          entryPrice: stock.currentPrice || stock.entryPrice,
          stopLoss: stock.stopLoss || stock.currentPrice * 0.95, // 5% default
          target1: stock.target1 || stock.currentPrice * 1.10, // 10% default
          target2: stock.target2,
          target3: stock.target3,
          notes: stock.notes || `Added from screener: ${stock.criteria || 'custom criteria'}`,
          status: 'PENDING',
        });

        addedStocks.push({ symbol: stock.symbol, stockId });
      } catch (error) {
        errors.push({
          symbol: stock.symbol,
          error: error instanceof Error ? error.message : 'Failed to add stock',
        });
      }
    }

    loggerService.success('Stocks added from screener to watchlist', {
      watchlistId,
      successCount: addedStocks.length,
      errorCount: errors.length,
    });

    res.status(201).json({
      success: true,
      message: `Added ${addedStocks.length} stocks from screener`,
      addedStocks,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    loggerService.error('Error adding stocks from screener', {
      error,
      watchlistId: req.params.id,
    });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add stocks from screener',
    });
  }
});

/**
 * PUT /api/watchlist/:id/stocks/:stockId
 * Update a stock in a custom watchlist
 */
router.put('/:id/stocks/:stockId', (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const stockId = parseInt(req.params.stockId);

    const watchlist = databaseService.getCustomWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    const stocks = databaseService.getCustomWatchlistStocks(watchlistId);
    const stock = stocks.find(s => s.id === stockId);

    if (!stock) {
      return res.status(404).json({
        error: 'Stock not found in this watchlist',
      });
    }

    const {
      companyName,
      setupType,
      timeframe,
      entryPrice,
      entryTrigger,
      stopLoss,
      target1,
      target2,
      target3,
      trailingStopPercent,
      positionSizePercent,
      notes,
      status
    } = req.body;

    const updates: any = {};

    if (companyName !== undefined) updates.companyName = companyName;
    if (setupType !== undefined) updates.setupType = setupType;
    if (timeframe !== undefined) updates.timeframe = timeframe;
    if (entryPrice !== undefined) updates.entryPrice = entryPrice;
    if (entryTrigger !== undefined) updates.entryTrigger = entryTrigger;
    if (stopLoss !== undefined) updates.stopLoss = stopLoss;
    if (target1 !== undefined) updates.target1 = target1;
    if (target2 !== undefined) updates.target2 = target2;
    if (target3 !== undefined) updates.target3 = target3;
    if (trailingStopPercent !== undefined) updates.trailingStopPercent = trailingStopPercent;
    if (positionSizePercent !== undefined) updates.positionSizePercent = positionSizePercent;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;

    databaseService.updateCustomWatchlistStock(stockId, updates);

    loggerService.info('Watchlist stock updated', { watchlistId, stockId, updates });

    // Get updated stock
    const updatedStocks = databaseService.getCustomWatchlistStocks(watchlistId);
    const updatedStock = updatedStocks.find(s => s.id === stockId);

    res.json({
      success: true,
      message: 'Stock updated successfully',
      stock: updatedStock,
    });
  } catch (error) {
    loggerService.error('Error updating watchlist stock', {
      error,
      watchlistId: req.params.id,
      stockId: req.params.stockId,
    });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update stock',
    });
  }
});

/**
 * DELETE /api/watchlist/:id/stocks/:stockId
 * Remove a stock from a custom watchlist
 */
router.delete('/:id/stocks/:stockId', (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const stockId = parseInt(req.params.stockId);

    const watchlist = databaseService.getCustomWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    const stocks = databaseService.getCustomWatchlistStocks(watchlistId);
    const stock = stocks.find(s => s.id === stockId);

    if (!stock) {
      return res.status(404).json({
        error: 'Stock not found in this watchlist',
      });
    }

    databaseService.deleteCustomWatchlistStock(stockId);

    loggerService.info('Stock removed from watchlist', {
      watchlistId,
      stockId,
      symbol: stock.symbol,
    });

    res.json({
      success: true,
      message: 'Stock removed from watchlist successfully',
    });
  } catch (error) {
    loggerService.error('Error removing stock from watchlist', {
      error,
      watchlistId: req.params.id,
      stockId: req.params.stockId,
    });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to remove stock from watchlist',
    });
  }
});

/**
 * PATCH /api/watchlist/:id/stocks/:stockId/status
 * Update stock status (e.g., mark as triggered, cancelled)
 */
router.patch('/:id/stocks/:stockId/status', (req, res) => {
  try {
    const watchlistId = parseInt(req.params.id);
    const stockId = parseInt(req.params.stockId);
    const { status, triggerPrice, triggerTime } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required',
      });
    }

    const validStatuses = ['PENDING', 'TRIGGERED', 'CANCELLED', 'EXPIRED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const watchlist = databaseService.getCustomWatchlistById(watchlistId);
    if (!watchlist) {
      return res.status(404).json({
        error: 'Watchlist not found',
      });
    }

    const stocks = databaseService.getCustomWatchlistStocks(watchlistId);
    const stock = stocks.find(s => s.id === stockId);

    if (!stock) {
      return res.status(404).json({
        error: 'Stock not found in this watchlist',
      });
    }

    const parsedTriggerTime = triggerTime ? new Date(triggerTime) : undefined;

    databaseService.updateCustomWatchlistStockStatus(
      stockId,
      status,
      triggerPrice,
      parsedTriggerTime
    );

    loggerService.info('Watchlist stock status updated', {
      watchlistId,
      stockId,
      symbol: stock.symbol,
      status,
      triggerPrice,
    });

    // Get updated stock
    const updatedStocks = databaseService.getCustomWatchlistStocks(watchlistId);
    const updatedStock = updatedStocks.find(s => s.id === stockId);

    res.json({
      success: true,
      message: 'Stock status updated successfully',
      stock: updatedStock,
    });
  } catch (error) {
    loggerService.error('Error updating stock status', {
      error,
      watchlistId: req.params.id,
      stockId: req.params.stockId,
    });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update stock status',
    });
  }
});

// ==================== BULK OPERATIONS ====================

/**
 * GET /api/watchlist/active/stocks
 * Get all active stocks across all watchlists (for monitoring)
 */
router.get('/active/stocks', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';

    // Get all active watchlists
    const watchlists = databaseService.getCustomWatchlists(userId).filter(w => w.isActive);

    // Get all active stocks from all watchlists
    const allStocks = databaseService.getAllActiveCustomWatchlistStocks();

    // Filter by user's watchlists
    const userWatchlistIds = new Set(watchlists.map(w => w.id!));
    const userStocks = allStocks.filter(s => userWatchlistIds.has(s.watchlistId));

    res.json({
      watchlistCount: watchlists.length,
      stockCount: userStocks.length,
      stocks: userStocks,
    });
  } catch (error) {
    loggerService.error('Error fetching active watchlist stocks', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch active stocks',
    });
  }
});

export default router;
