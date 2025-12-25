import { Router } from 'express';
import { marketDataService } from '../services/marketDataService';
import { TechnicalAnalysis } from '../utils/technicalIndicators';
import { FundamentalAnalysis } from '../utils/fundamentalAnalysis';

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

/**
 * GET /api/stocks/detail/:exchange/:symbol
 * Get comprehensive stock detail with technical and fundamental analysis
 */
router.get('/detail/:exchange/:symbol', async (req, res) => {
  try {
    const { symbol, exchange } = req.params;

    if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange' });
    }

    // Fetch current quote
    const quote = await marketDataService.getQuote(
      symbol,
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
    );

    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Fetch historical data for analysis
    const historicalData = await marketDataService.getHistoricalData(
      symbol,
      exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ',
      '1d',
      '1y'
    );

    // Calculate technical indicators
    const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);
    const patterns = TechnicalAnalysis.detectCandlestickPatterns(historicalData);

    // Get fundamental data (if available via marketDataService)
    let fundamentals = null;
    let fundamentalScore = null;

    // Try to get fundamentals if the method exists
    if (typeof (marketDataService as any).getFundamentals === 'function') {
      try {
        fundamentals = await (marketDataService as any).getFundamentals(
          symbol,
          exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
        );

        // Calculate fundamental score if fundamentals are available
        if (fundamentals) {
          fundamentalScore = FundamentalAnalysis.calculateFundamentalScore(fundamentals);
        }
      } catch (error) {
        // Fundamentals not available, continue without them
        console.log(`Fundamentals not available for ${symbol}`);
      }
    }

    // Calculate combined score
    const technicalScore = calculateTechnicalScore(indicators);
    const combinedScore = fundamentals && fundamentalScore
      ? Math.round((technicalScore * 0.6) + (fundamentalScore.overall * 0.4))
      : technicalScore;

    // Generate recommendation
    const recommendation = generateRecommendation(
      technicalScore,
      fundamentalScore ? fundamentalScore.overall : 0,
      indicators
    );

    // Calculate confluence score
    const confluenceScore = calculateConfluenceScore(indicators);

    // Prepare response
    res.json({
      symbol,
      exchange,
      price: quote.price,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: quote.marketCap || fundamentals?.marketCap || 0,
      indicators,
      patterns,
      fundamentals,
      fundamentalScore,
      historicalData: historicalData.slice(-90), // Last 90 days for charting
      combinedScore,
      confluenceScore,
      recommendation,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching stock detail:', error);
    res.status(500).json({ error: 'Failed to fetch stock detail' });
  }
});

// Helper functions
function calculateTechnicalScore(indicators: any): number {
  let score = 50; // Start with neutral score

  // RSI scoring
  if (indicators.rsi) {
    if (indicators.rsi < 30) score += 15; // Oversold - bullish
    else if (indicators.rsi < 40) score += 10;
    else if (indicators.rsi > 70) score -= 15; // Overbought - bearish
    else if (indicators.rsi > 60) score -= 10;
  }

  // MACD scoring
  if (indicators.macd && indicators.macdSignal) {
    if (indicators.macd > indicators.macdSignal) score += 10;
    else score -= 10;
  }

  // ADX scoring (trend strength)
  if (indicators.adx) {
    if (indicators.adx > 25) score += 10;
    if (indicators.adx > 40) score += 5;
  }

  // Stochastic scoring
  if (indicators.stochK) {
    if (indicators.stochK < 20) score += 10;
    else if (indicators.stochK > 80) score -= 10;
  }

  // Ensure score is within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateConfluenceScore(indicators: any): number {
  const signals = [];

  // Check RSI
  if (indicators.rsi) {
    if (indicators.rsi < 40 || indicators.rsi > 60) {
      signals.push(indicators.rsi < 40 ? 'bullish' : 'bearish');
    }
  }

  // Check MACD
  if (indicators.macd && indicators.macdSignal) {
    signals.push(indicators.macd > indicators.macdSignal ? 'bullish' : 'bearish');
  }

  // Check ADX
  if (indicators.adx > 25) {
    signals.push('trending');
  }

  // Check Stochastic
  if (indicators.stochK) {
    if (indicators.stochK < 30 || indicators.stochK > 70) {
      signals.push(indicators.stochK < 30 ? 'bullish' : 'bearish');
    }
  }

  // Calculate confluence (how many signals agree)
  const bullishCount = signals.filter(s => s === 'bullish').length;
  const bearishCount = signals.filter(s => s === 'bearish').length;
  const total = signals.length;

  if (total === 0) return 50;

  const dominantCount = Math.max(bullishCount, bearishCount);
  return Math.round((dominantCount / total) * 100);
}

function generateRecommendation(
  technicalScore: number,
  fundamentalScore: number,
  indicators: any
): string {
  const combinedScore = fundamentalScore > 0
    ? (technicalScore * 0.6) + (fundamentalScore * 0.4)
    : technicalScore;

  // Strong buy conditions
  if (combinedScore >= 80 && indicators.rsi < 70) {
    return 'STRONG_BUY';
  }
  // Buy conditions
  if (combinedScore >= 65 && indicators.rsi < 75) {
    return 'BUY';
  }
  // Strong sell conditions
  if (combinedScore <= 30) {
    return 'STRONG_SELL';
  }
  // Sell conditions
  if (combinedScore <= 45) {
    return 'SELL';
  }
  // Default to hold
  return 'HOLD';
}

export { router as stockRoutes };
