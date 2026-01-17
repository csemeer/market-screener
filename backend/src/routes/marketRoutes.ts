import { Router } from 'express';
import { marketDataService } from '../services/marketDataService';

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
    const { symbol, date, interval = '5m' } = req.query;

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

    // Generate mock intraday data for the simulation
    // In a production system, this would fetch actual historical intraday data
    const candles = generateMockIntradayData(
      symbol,
      date as string,
      interval as string
    );

    res.json({
      symbol,
      date,
      interval,
      candles,
      count: candles.length
    });
  } catch (error) {
    console.error('Error fetching historical market data:', error);
    res.status(500).json({ error: 'Failed to fetch historical market data' });
  }
});

/**
 * Generate mock intraday candlestick data for simulation
 * This simulates a realistic trading day with volatility and trends
 */
function generateMockIntradayData(symbol: string, date: string, interval: string) {
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

  const candleCount = intervalsMap[interval] || 75;
  const minutesPer = intervalMinutes[interval] || 5;

  // Starting price (randomized based on symbol for variety)
  const hashCode = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 1000 + (hashCode % 2000); // Price between 1000-3000

  // Market session start: 9:15 AM
  const [year, month, day] = date.split('-').map(Number);
  let currentTime = new Date(year, month - 1, day, 9, 15, 0);

  const candles = [];
  let lastClose = basePrice;

  // Generate trend direction for the day
  const dailyTrend = (Math.random() - 0.5) * 0.03; // -1.5% to +1.5% daily trend
  const volatility = 0.002 + Math.random() * 0.003; // 0.2% to 0.5% volatility per candle

  for (let i = 0; i < candleCount; i++) {
    // Add trend and randomness
    const trendComponent = lastClose * dailyTrend * (i / candleCount);
    const randomComponent = lastClose * (Math.random() - 0.5) * volatility * 2;

    const open = lastClose;
    const targetClose = lastClose + trendComponent + randomComponent;

    // Determine if bullish or bearish candle
    const isBullish = targetClose > open;

    // Calculate high and low with realistic wicks
    const wickFactor = 0.001 + Math.random() * 0.002; // 0.1% to 0.3% wicks
    const high = Math.max(open, targetClose) + (Math.max(open, targetClose) * wickFactor);
    const low = Math.min(open, targetClose) - (Math.min(open, targetClose) * wickFactor);
    const close = targetClose;

    // Volume: Higher at market open/close, lower mid-day
    const timeProgress = i / candleCount;
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

  return candles;
}

export { router as marketRoutes };
