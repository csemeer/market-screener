import { Router } from 'express';
import YahooFinance from 'yahoo-finance2';
import { UpstoxAdapter } from '../services/brokers/UpstoxAdapter';
import * as dotenv from 'dotenv';

dotenv.config();

const yahooFinance = new YahooFinance();
const router = Router();

// Initialize Upstox adapter if credentials are available
let upstoxAdapter: UpstoxAdapter | null = null;
let upstoxInitPromise: Promise<void> | null = null;

if (process.env.UPSTOX_API_KEY && process.env.UPSTOX_API_SECRET) {
  upstoxAdapter = new UpstoxAdapter();

  // Initialize with credentials - store promise for later
  upstoxInitPromise = upstoxAdapter.initialize({
    brokerId: 1, // Placeholder - not used for historical data
    brokerType: 'UPSTOX',
    apiKey: process.env.UPSTOX_API_KEY,
    apiSecret: process.env.UPSTOX_API_SECRET,
    accessToken: process.env.UPSTOX_ACCESS_TOKEN,
  }).then(() => {
    console.log('[INFO] Upstox adapter initialized successfully');
  }).catch((error) => {
    console.error('[ERROR] Failed to initialize Upstox adapter:', error.message);
    console.error('[ERROR] Full error:', error);
    upstoxAdapter = null;
    throw error;
  });
} else {
  console.warn('[WARNING] Upstox credentials not found in environment variables');
  console.warn('[INFO] To use Upstox for historical data, set UPSTOX_API_KEY, UPSTOX_API_SECRET, and UPSTOX_ACCESS_TOKEN in .env');
}

/**
 * GET /api/market/historical
 * Get historical intraday data for live simulation
 * Query params:
 *   - symbol: Stock symbol (e.g., RELIANCE)
 *   - date: Date in YYYY-MM-DD format
 *   - interval: Candle interval (1m, 3m, 5m, 15m, 30m, 1h)
 */
router.get('/historical', async (req, res) => {
  try {
    const { symbol, date, interval = '5m', preCandles = '0' } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD format)' });
    }

    // Validate interval
    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h'];
    if (!validIntervals.includes(interval as string)) {
      return res.status(400).json({
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}`
      });
    }

    const preCandleCount = parseInt(preCandles as string, 10) || 0;

    // Try multiple real data sources (NO MOCK DATA)
    // Priority: 1. Yahoo Finance, 2. Upstox API
    let result;
    let dataSource = 'unknown';
    const errors: string[] = [];

    // Attempt 1: Yahoo Finance
    try {
      console.log(`[INFO] Attempting to fetch real data from Yahoo Finance for ${symbol}...`);
      result = await fetchYahooFinanceData(
        symbol,
        date as string,
        interval as string,
        preCandleCount
      );
      dataSource = 'yahoo-finance';
      console.log(`[SUCCESS] Using real Yahoo Finance data for ${symbol}`);
    } catch (yahooError) {
      const errorMsg = yahooError instanceof Error ? yahooError.message : 'Unknown error';
      errors.push(`Yahoo Finance: ${errorMsg}`);
      console.warn(`[WARNING] Yahoo Finance unavailable: ${errorMsg}`);

      // Attempt 2: Upstox API
      if (upstoxAdapter) {
        try {
          console.log(`[INFO] Attempting to fetch real data from Upstox for ${symbol}...`);
          result = await fetchUpstoxData(
            symbol,
            date as string,
            interval as string,
            preCandleCount
          );
          dataSource = 'upstox';
          console.log(`[SUCCESS] Using real Upstox data for ${symbol}`);
        } catch (upstoxError) {
          const upstoxErrorMsg = upstoxError instanceof Error ? upstoxError.message : 'Unknown error';
          errors.push(`Upstox: ${upstoxErrorMsg}`);
          console.error(`[ERROR] Upstox unavailable: ${upstoxErrorMsg}`);
        }
      } else {
        errors.push('Upstox: Not configured (missing API credentials)');
        console.warn('[WARNING] Upstox adapter not available - configure UPSTOX_API_KEY and UPSTOX_API_SECRET');
      }
    }

    // If no real data source succeeded, return error
    if (!result) {
      throw new Error(
        `Failed to fetch real historical data from all sources. Errors:\n${errors.join('\n')}\n\n` +
        `To fix this:\n` +
        `1. For Yahoo Finance: Whitelist query1.finance.yahoo.com in your network\n` +
        `2. For Upstox: Configure UPSTOX_API_KEY, UPSTOX_API_SECRET, and UPSTOX_ACCESS_TOKEN in .env file`
      );
    }

    res.json({
      symbol,
      date,
      interval,
      candles: result.candles,
      count: result.candles.length,
      preCandleCount: result.preCandleCount,
      tradingCandleCount: result.tradingCandleCount,
      dataSource, // Indicate where the data came from: 'yahoo-finance' or 'upstox'
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch historical market data:', error);
    res.status(500).json({
      error: 'Failed to fetch historical market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Fetch real historical data from Upstox
 * @param symbol - Stock symbol (e.g., RELIANCE)
 * @param date - Trading date (YYYY-MM-DD)
 * @param interval - Candle interval
 * @param preCandles - Number of pre-candles for chart context
 */
async function fetchUpstoxData(
  symbol: string,
  date: string,
  interval: string,
  preCandles: number
) {
  if (!upstoxAdapter) {
    throw new Error('Upstox adapter not initialized - check your UPSTOX_API_KEY and UPSTOX_API_SECRET in .env');
  }

  // Wait for initialization to complete
  if (upstoxInitPromise) {
    try {
      await upstoxInitPromise;
    } catch (error) {
      throw new Error(`Upstox adapter initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Parse the target date
  const [year, month, day] = date.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  // Calculate date range needed for pre-candles
  const daysToFetch = Math.ceil(preCandles / 75) + 5;
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - daysToFetch);

  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);

  console.log(`Fetching Upstox data for ${symbol}:`);
  console.log(`  Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log(`  Interval: ${interval}`);
  console.log(`  Pre-candles requested: ${preCandles}`);

  try {
    // Fetch from Upstox (NSE exchange by default)
    const allCandles = await upstoxAdapter.getHistoricalData(
      symbol,
      'NSE_EQ', // NSE Equity
      interval,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (!allCandles || allCandles.length === 0) {
      throw new Error(`No data returned from Upstox for ${symbol}`);
    }

    console.log(`  Received ${allCandles.length} candles from Upstox`);

    // Sort candles ascending by time
    allCandles.sort((a: any, b: any) => a.time - b.time);

    // Find candles for the target date
    const tradingDayCandles = allCandles.filter((candle: any) => {
      const candleDate = new Date(candle.time * 1000);
      return candleDate.getFullYear() === year &&
             candleDate.getMonth() === month - 1 &&
             candleDate.getDate() === day;
    });

    if (tradingDayCandles.length === 0) {
      throw new Error(`No trading data found for ${symbol} on ${date}. Market may have been closed.`);
    }

    // Get the pre-candles (candles before the trading day)
    const preCandlesList = allCandles.filter((candle: any) => {
      return candle.time < tradingDayCandles[0].time;
    });

    // Take the last N pre-candles requested
    const selectedPreCandles = preCandlesList.slice(-preCandles);

    // Combine pre-candles + trading day candles
    const finalCandles = [...selectedPreCandles, ...tradingDayCandles];

    console.log(`  Pre-candles: ${selectedPreCandles.length}`);
    console.log(`  Trading day candles: ${tradingDayCandles.length}`);
    console.log(`  Total candles: ${finalCandles.length}`);

    return {
      candles: finalCandles,
      preCandleCount: selectedPreCandles.length,
      tradingCandleCount: tradingDayCandles.length,
      totalCount: finalCandles.length
    };

  } catch (error) {
    console.error(`Error fetching data from Upstox:`, error);
    throw new Error(
      `Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert Indian stock symbol to Yahoo Finance format
 * Indian stocks trade on NSE (National Stock Exchange) with .NS suffix
 * or BSE (Bombay Stock Exchange) with .BO suffix
 */
function getYahooSymbol(symbol: string): string {
  const upper = symbol.toUpperCase();
  // If already has suffix, return as-is
  if (upper.endsWith('.NS') || upper.endsWith('.BO')) {
    return upper;
  }
  // Default to NSE (.NS) as it's more liquid
  return `${upper}.NS`;
}

/**
 * Map our interval format to Yahoo Finance interval format
 */
function mapIntervalToYahoo(interval: string): '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '1h' {
  const mapping: Record<string, '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '1h'> = {
    '1m': '1m',
    '3m': '5m',  // Yahoo doesn't support 3m, use 5m
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h'
  };
  return mapping[interval] || '5m';
}

/**
 * Fetch real historical data from Yahoo Finance
 * @param symbol - Stock symbol (e.g., RELIANCE)
 * @param date - Trading date (YYYY-MM-DD)
 * @param interval - Candle interval
 * @param preCandles - Number of pre-candles for chart context
 */
async function fetchYahooFinanceData(
  symbol: string,
  date: string,
  interval: string,
  preCandles: number
) {
  const yahooSymbol = getYahooSymbol(symbol);
  const yahooInterval = mapIntervalToYahoo(interval);

  // Parse the target date
  const [year, month, day] = date.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);

  // Calculate how many calendar days we need to go back for pre-candles
  // Assuming ~75 candles per day for 5m interval, we need roughly 1 trading day per 75 pre-candles
  const daysToFetch = Math.ceil(preCandles / 75) + 5; // Add extra days for weekends/holidays

  // Start date: Go back daysToFetch days from target date
  const startDate = new Date(targetDate);
  startDate.setDate(startDate.getDate() - daysToFetch);

  // End date: Day after target date to ensure we get the full trading day
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);

  console.log(`Fetching Yahoo Finance data for ${yahooSymbol}:`);
  console.log(`  Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log(`  Interval: ${yahooInterval}`);
  console.log(`  Pre-candles requested: ${preCandles}`);

  try {
    // Fetch historical data from Yahoo Finance
    const queryOptions = {
      period1: startDate,
      period2: endDate,
      interval: yahooInterval
    };

    const result: any = await yahooFinance.chart(yahooSymbol, queryOptions);

    if (!result || !result.quotes || result.quotes.length === 0) {
      throw new Error(`No data returned from Yahoo Finance for ${yahooSymbol}`);
    }

    console.log(`  Received ${result.quotes.length} candles from Yahoo Finance`);

    // Convert Yahoo Finance quotes to our candle format
    const allCandles = result.quotes
      .filter((quote: any) => {
        // Filter out invalid candles
        return quote.open && quote.high && quote.low && quote.close && quote.date;
      })
      .map((quote: any) => ({
        time: Math.floor(new Date(quote.date).getTime() / 1000), // Unix timestamp in seconds
        open: parseFloat(quote.open.toFixed(2)),
        high: parseFloat(quote.high.toFixed(2)),
        low: parseFloat(quote.low.toFixed(2)),
        close: parseFloat(quote.close.toFixed(2)),
        volume: quote.volume || 0
      }))
      .sort((a: any, b: any) => a.time - b.time); // Ensure ascending order

    // Find the index where the target trading day starts (9:15 AM IST)
    const marketOpenTime = new Date(year, month - 1, day, 9, 15, 0);
    const marketOpenTimestamp = Math.floor(marketOpenTime.getTime() / 1000);

    // Find candles for the target date
    const tradingDayCandles = allCandles.filter((candle: any) => {
      const candleDate = new Date(candle.time * 1000);
      return candleDate.getFullYear() === year &&
             candleDate.getMonth() === month - 1 &&
             candleDate.getDate() === day;
    });

    if (tradingDayCandles.length === 0) {
      throw new Error(`No trading data found for ${symbol} on ${date}. Market may have been closed.`);
    }

    // Get the pre-candles (candles before the trading day)
    const preCandlesList = allCandles.filter((candle: any) => {
      return candle.time < tradingDayCandles[0].time;
    });

    // Take the last N pre-candles requested
    const selectedPreCandles = preCandlesList.slice(-preCandles);

    // Combine pre-candles + trading day candles
    const finalCandles = [...selectedPreCandles, ...tradingDayCandles];

    console.log(`  Pre-candles: ${selectedPreCandles.length}`);
    console.log(`  Trading day candles: ${tradingDayCandles.length}`);
    console.log(`  Total candles: ${finalCandles.length}`);

    return {
      candles: finalCandles,
      preCandleCount: selectedPreCandles.length,
      tradingCandleCount: tradingDayCandles.length,
      totalCount: finalCandles.length
    };

  } catch (error) {
    console.error(`Error fetching data from Yahoo Finance:`, error);
    throw new Error(
      `Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export { router as marketRoutes };
