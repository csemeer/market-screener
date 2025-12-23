import { Router } from 'express';
import { marketDataService } from '../services/marketDataService';
import { TechnicalAnalysis } from '../utils/technicalIndicators';

const router = Router();

/**
 * GET /api/stocks/quote/:symbol
 * Get real-time quote for a stock
 */
router.get('/quote/:exchange/:symbol', async (req, res) => {
  try {
    const { symbol, exchange } = req.params;

    if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }

    const quote = await marketDataService.getQuote(
      symbol,
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
    );

    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

/**
 * GET /api/stocks/historical/:symbol
 * Get historical data for a stock
 */
router.get('/historical/:exchange/:symbol', async (req, res) => {
  try {
    const { symbol, exchange } = req.params;
    const { interval = '1d', range = '3mo' } = req.query;

    if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }

    const data = await marketDataService.getHistoricalData(
      symbol,
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ',
      interval as any,
      range as string
    );

    res.json(data);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

/**
 * GET /api/stocks/analysis/:symbol
 * Get technical analysis for a stock
 */
router.get('/analysis/:exchange/:symbol', async (req, res) => {
  try {
    const { symbol, exchange } = req.params;

    if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }

    const historicalData = await marketDataService.getHistoricalData(
      symbol,
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ',
      '1d',
      '6mo'
    );

    const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);
    const patterns = TechnicalAnalysis.detectCandlestickPatterns(historicalData);

    res.json({
      symbol,
      exchange,
      indicators,
      patterns,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

/**
 * GET /api/stocks/list/:exchange
 * Get list of stocks for an exchange
 */
router.get('/list/:exchange', (req, res) => {
  try {
    const { exchange } = req.params;

    if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }

    const stocks = marketDataService.getStocksByExchange(
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
    );

    res.json({ exchange, stocks, count: stocks.length });
  } catch (error) {
    console.error('Error fetching stock list:', error);
    res.status(500).json({ error: 'Failed to fetch stock list' });
  }
});

export { router as stockRoutes };
