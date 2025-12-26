import { Router } from 'express';
import { indexService } from '../services/indexService';

const router = Router();

/**
 * GET /api/indexes
 * Get all market indexes
 */
router.get('/', (req, res) => {
  try {
    const indexes = indexService.getAllIndexes();
    res.json({
      indexes,
      count: indexes.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching indexes:', error);
    res.status(500).json({ error: 'Failed to fetch indexes' });
  }
});

/**
 * GET /api/indexes/exchange/:exchange
 * Get indexes by exchange (NSE, NYSE, NASDAQ)
 */
router.get('/exchange/:exchange', (req, res) => {
  try {
    const { exchange } = req.params;

    if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange. Must be NSE, BSE, NYSE, or NASDAQ' });
    }

    const indexes = indexService.getIndexesByExchange(
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
    );

    res.json({
      exchange,
      indexes,
      count: indexes.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching indexes by exchange:', error);
    res.status(500).json({ error: 'Failed to fetch indexes' });
  }
});

/**
 * GET /api/indexes/category/:category
 * Get indexes by category (Broad Market, Sector, Market Cap, etc.)
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const indexes = indexService.getIndexesByCategory(category);

    res.json({
      category,
      indexes,
      count: indexes.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching indexes by category:', error);
    res.status(500).json({ error: 'Failed to fetch indexes by category' });
  }
});

/**
 * GET /api/indexes/search?q=query
 * Search indexes by name, description, or category
 */
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = indexService.searchIndexes(q);

    res.json({
      query: q,
      results,
      count: results.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error searching indexes:', error);
    res.status(500).json({ error: 'Failed to search indexes' });
  }
});

/**
 * GET /api/indexes/stats
 * Get statistics about indexes and stocks
 */
router.get('/stats', (req, res) => {
  try {
    const stats = indexService.getStatistics();

    res.json({
      stats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching index statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/indexes/:indexId
 * Get details of a specific index
 * IMPORTANT: This route must be defined AFTER all other specific routes
 * to avoid catching routes like /search, /stats, /category/:category
 */
router.get('/:indexId', (req, res) => {
  try {
    const { indexId } = req.params;
    const index = indexService.getIndexById(indexId);

    if (!index) {
      return res.status(404).json({ error: 'Index not found' });
    }

    res.json({
      index,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching index:', error);
    res.status(500).json({ error: 'Failed to fetch index' });
  }
});

/**
 * GET /api/indexes/:indexId/constituents
 * Get constituent stocks of an index
 */
router.get('/:indexId/constituents', (req, res) => {
  try {
    const { indexId } = req.params;
    const index = indexService.getIndexById(indexId);

    if (!index) {
      return res.status(404).json({ error: 'Index not found' });
    }

    const constituents = indexService.getIndexConstituents(indexId);

    res.json({
      indexId,
      indexName: index.name,
      exchange: index.exchange,
      constituents,
      count: constituents.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error fetching index constituents:', error);
    res.status(500).json({ error: 'Failed to fetch index constituents' });
  }
});

export { router as indexRoutes };
