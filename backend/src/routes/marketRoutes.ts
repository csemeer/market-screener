import { Router } from 'express';
import { marketDataService } from '../services/marketDataService';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();
const router = Router();

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

    // Fetch real historical data from Yahoo Finance
    const result = await fetchYahooFinanceData(
      symbol,
      date as string,
      interval as string,
      preCandleCount
    );

    res.json({
      symbol,
      date,
      interval,
      candles: result.candles,
      count: result.candles.length,
      preCandleCount: result.preCandleCount,
      tradingCandleCount: result.tradingCandleCount
    });
  } catch (error) {
    console.error('Error fetching historical market data:', error);
    res.status(500).json({
      error: 'Failed to fetch historical market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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

/**
 * Realistic stock price ranges for Indian stocks (as of Jan 2026)
 * Format: { symbol: { min, max, typical } }
 */
const STOCK_PRICE_RANGES: Record<string, { min: number; max: number; typical: number }> = {
  // Real estate & Infrastructure
  'DLF': { min: 640, max: 700, typical: 670 },
  'GODREJPROP': { min: 2700, max: 3000, typical: 2850 },
  'PRESTIGE': { min: 1650, max: 1800, typical: 1725 },
  'OBEROIRLTY': { min: 1900, max: 2100, typical: 2000 },

  // IT & Technology
  'TCS': { min: 3800, max: 4200, typical: 4000 },
  'INFY': { min: 1850, max: 2000, typical: 1925 },
  'WIPRO': { min: 550, max: 600, typical: 575 },
  'HCLTECH': { min: 1750, max: 1900, typical: 1825 },
  'TECHM': { min: 1650, max: 1800, typical: 1725 },

  // Banking & Finance
  'HDFCBANK': { min: 1700, max: 1850, typical: 1775 },
  'ICICIBANK': { min: 1250, max: 1350, typical: 1300 },
  'SBIN': { min: 750, max: 850, typical: 800 },
  'AXISBANK': { min: 1100, max: 1200, typical: 1150 },
  'KOTAKBANK': { min: 1750, max: 1900, typical: 1825 },

  // Energy & Oil
  'RELIANCE': { min: 2800, max: 3100, typical: 2950 },
  'ONGC': { min: 240, max: 270, typical: 255 },
  'BPCL': { min: 580, max: 630, typical: 605 },
  'IOC': { min: 130, max: 150, typical: 140 },

  // Automotive
  'MARUTI': { min: 12500, max: 13500, typical: 13000 },
  'TATAMOTORS': { min: 950, max: 1050, typical: 1000 },
  'M&M': { min: 2900, max: 3200, typical: 3050 },
  'BAJAJ-AUTO': { min: 9500, max: 10500, typical: 10000 },

  // Pharmaceuticals
  'SUNPHARMA': { min: 1700, max: 1850, typical: 1775 },
  'DRREDDY': { min: 1200, max: 1350, typical: 1275 },
  'CIPLA': { min: 1450, max: 1600, typical: 1525 },
  'DIVISLAB': { min: 5800, max: 6300, typical: 6050 },

  // FMCG
  'HINDUNILVR': { min: 2400, max: 2650, typical: 2525 },
  'ITC': { min: 450, max: 490, typical: 470 },
  'NESTLEIND': { min: 2400, max: 2650, typical: 2525 },
  'BRITANNIA': { min: 4800, max: 5300, typical: 5050 },

  // Metals & Mining
  'TATASTEEL': { min: 140, max: 160, typical: 150 },
  'HINDALCO': { min: 630, max: 690, typical: 660 },
  'VEDL': { min: 440, max: 490, typical: 465 },
  'JSWSTEEL': { min: 900, max: 1000, typical: 950 },

  // Telecom
  'BHARTIARTL': { min: 1550, max: 1700, typical: 1625 },
  'IDEA': { min: 12, max: 18, typical: 15 },

  // Cement
  'ULTRACEMCO': { min: 10500, max: 11500, typical: 11000 },
  'AMBUJACEM': { min: 550, max: 600, typical: 575 },
  'ACC': { min: 2200, max: 2450, typical: 2325 }
};

/**
 * Generate mock intraday candlestick data for simulation
 * This simulates a realistic trading day with volatility and trends
 *
 * @param symbol - Stock symbol
 * @param date - Trading date (YYYY-MM-DD)
 * @param interval - Candle interval (1m, 3m, 5m, etc.)
 * @param preCandles - Number of candles to generate before trading period for chart context
 */
function generateMockIntradayData(symbol: string, date: string, interval: string, preCandles = 0) {
  // Determine number of candles based on interval (9:15 AM to 3:30 PM IST = 375 minutes)
  const intervalsMap: Record<string, number> = {
    '1m': 375,   // 375 candles
    '3m': 125,   // 125 candles
    '5m': 75,    // 75 candles
    '15m': 25,   // 25 candles
    '30m': 13,   // 13 candles
    '1h': 7      // 7 candles (rounded)
  };

  const intervalMinutes: Record<string, number> = {
    '1m': 1,
    '3m': 3,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60
  };

  const tradingCandleCount = intervalsMap[interval] || 75; // Candles for the trading period
  const totalCandleCount = tradingCandleCount + preCandles; // Total including pre-candles
  const minutesPer = intervalMinutes[interval] || 5;

  // Get realistic starting price based on stock symbol
  let basePrice: number;
  const priceRange = STOCK_PRICE_RANGES[symbol.toUpperCase()];

  if (priceRange) {
    // Use realistic price range for known stocks
    // Start at a random point within 2% of typical price
    const variation = priceRange.typical * 0.02; // ±2% variation
    basePrice = priceRange.typical + (Math.random() - 0.5) * variation;
  } else {
    // Fallback for unknown symbols: use hash-based price
    console.warn(`Unknown symbol ${symbol}, using generic price range`);
    const hashCode = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    basePrice = 100 + (hashCode % 900); // Price between 100-1000 for unknown stocks
  }

  // Calculate start time (include pre-candles before market open)
  const [year, month, day] = date.split('-').map(Number);
  const marketOpen = new Date(year, month - 1, day, 9, 15, 0);
  let currentTime = new Date(marketOpen.getTime() - (preCandles * minutesPer * 60 * 1000));

  const candles = [];
  let lastClose = basePrice;

  // Determine realistic bounds for the day
  const stockRange = STOCK_PRICE_RANGES[symbol.toUpperCase()];
  const minPrice = stockRange ? stockRange.min : basePrice * 0.95;
  const maxPrice = stockRange ? stockRange.max : basePrice * 1.05;

  // Generate trend direction for the day (more conservative for known stocks)
  const dailyTrend = (Math.random() - 0.5) * 0.025; // -1.25% to +1.25% daily trend
  const volatility = 0.0015 + Math.random() * 0.002; // 0.15% to 0.35% volatility per candle

  for (let i = 0; i < totalCandleCount; i++) {
    // Add trend and randomness
    const trendComponent = lastClose * dailyTrend * (i / totalCandleCount);
    const randomComponent = lastClose * (Math.random() - 0.5) * volatility * 2;

    const open = lastClose;
    let targetClose = lastClose + trendComponent + randomComponent;

    // Ensure price stays within realistic bounds
    targetClose = Math.max(minPrice, Math.min(maxPrice, targetClose));

    // Determine if bullish or bearish candle
    const isBullish = targetClose > open;

    // Calculate high and low with realistic wicks
    const wickFactor = 0.0008 + Math.random() * 0.0015; // 0.08% to 0.23% wicks
    let high = Math.max(open, targetClose) + (Math.max(open, targetClose) * wickFactor);
    let low = Math.min(open, targetClose) - (Math.min(open, targetClose) * wickFactor);

    // Ensure high/low stay within bounds
    high = Math.min(maxPrice, high);
    low = Math.max(minPrice, low);

    const close = targetClose;

    // Volume: Higher at market open/close, lower mid-day
    const timeProgress = i / totalCandleCount;
    let volumeMultiplier = 1.0;
    if (timeProgress < 0.1 || timeProgress > 0.9) {
      // Higher volume at start and end of day
      volumeMultiplier = 1.5 + Math.random() * 0.5;
    } else if (timeProgress > 0.4 && timeProgress < 0.6) {
      // Lower volume mid-day
      volumeMultiplier = 0.5 + Math.random() * 0.3;
    }
    const baseVolume = 50000 + Math.random() * 100000;
    const volume = Math.floor(baseVolume * volumeMultiplier * (isBullish ? 1.1 : 0.9));

    candles.push({
      time: Math.floor(currentTime.getTime() / 1000), // Unix timestamp in seconds
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });

    lastClose = close;

    // Increment time by interval
    currentTime = new Date(currentTime.getTime() + minutesPer * 60 * 1000);
  }

  return {
    candles,
    preCandleCount: preCandles,
    tradingCandleCount: tradingCandleCount,
    totalCount: totalCandleCount
  };
}

export { router as marketRoutes };
