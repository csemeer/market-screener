# 📊 AlphaStream Scanning Process - Complete Guide

## Overview

This document explains how AlphaStream's auto-scanning system works, what data is collected, and how charts are generated.

## 1. Scanning Process Architecture

### A. Auto-Scan Service (`backend/src/services/autoScanService.ts`)

The auto-scan service runs continuously and executes different trading strategies on a scheduled basis.

#### Scan Flow:
```
1. Initialize Auto-Scan Service
2. Load Strategy Configurations
3. Schedule Scans (based on scan intervals)
4. Execute Scans for Each Enabled Strategy
5. Store Results in Database
6. Create High-Confidence Alerts
7. Update Dashboard
```

### B. Strategy Configuration

Each strategy has specific criteria:

```typescript
INTRADAY_MOMENTUM_BREAKOUT: {
  type: 'INTRADAY',
  scanInterval: 5,  // Run every 5 minutes
  criteria: {
    rsiMin: 50,
    rsiMax: 70,
    volumeMultiplier: 1.5,
    adxMin: 25
  }
}
```

## 2. Time Series Data Collection

### Data Sources

**Market Data Service** (`backend/src/services/marketDataService.ts`)

#### A. Historical Data Collection

When a scan runs, it fetches historical price data:

```typescript
const historicalData = await marketDataService.getHistoricalData(
  symbol,      // e.g., 'RELIANCE'
  exchange,    // e.g., 'NSE'
  '1d',        // interval: 1 day candles
  '3mo'        // period: Last 3 months of data
);
```

**Data Retrieved:**
- **Period**: Last 3 months (approximately 60-90 trading days)
- **Interval**: Daily (1d) candles for swing/EOD scans, 5m/15m for intraday
- **Data Points**: Each candle contains:
  - `timestamp`: Date/time
  - `open`: Opening price
  - `high`: Highest price
  - `low`: Lowest price
  - `close`: Closing price
  - `volume`: Trading volume

#### B. Real-Time Quote Data

For current price:

```typescript
const quote = await marketDataService.getQuote(symbol, exchange);
```

Returns:
- Current price
- Volume
- Change percentage
- Market cap

## 3. Technical Analysis Calculation

### Indicator Calculation (`backend/src/utils/technicalAnalysis.ts`)

From the 3-month historical data, AlphaStream calculates:

**Moving Averages:**
- EMA 9, 20, 50, 200 periods
- SMA 20, 50, 200 periods

**Momentum Indicators:**
- RSI (14-period Relative Strength Index)
- MACD (12, 26, 9 configuration)
- ADX (Average Directional Index)
- Stochastic Oscillator

**Volatility:**
- ATR (Average True Range)
- Bollinger Bands (20-period, 2 std dev)

**Volume Analysis:**
- Volume Profile
- Volume Ratio (current vs average)

**Pattern Recognition:**
- Candlestick patterns (Doji, Hammer, Engulfing, etc.)

### Example Calculation Flow:

```typescript
// 1. Fetch 3 months of daily data (60-90 candles)
const historicalData = await getHistoricalData('RELIANCE', 'NSE', '1d', '3mo');

// 2. Calculate all indicators
const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);

// 3. Results:
{
  rsi: 67.5,
  macd: { macd: 12.5, signal: 10.2, histogram: 2.3 },
  ema: { ema9: 2450, ema20: 2430, ema50: 2400, ema200: 2350 },
  bollingerBands: { upper: 2480, middle: 2450, lower: 2420 },
  atr: 45.2,
  adx: 32.5,
  volumeProfile: { volumeRatio: 1.8, avgVolume: 5000000 }
}
```

## 4. Scan Execution Process

### Step-by-Step for Each Stock:

```typescript
// 1. Get current quote
const quote = await marketDataService.getQuote(symbol, exchange);

// 2. Fetch historical data (3 months)
const historicalData = await marketDataService.getHistoricalData(
  symbol, exchange, '1d', '3mo'
);

// 3. Calculate technical indicators
const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);

// 4. Apply strategy filters
if (indicators.rsi > 50 && indicators.rsi < 70 &&
    indicators.adx > 25 &&
    indicators.volumeProfile.volumeRatio > 1.5) {
  // Stock passes filters
}

// 5. Calculate confluence score
const confluenceScore = TechnicalAnalysis.calculateConfluence(
  historicalData,
  indicators
);

// 6. Calculate risk/reward
const riskReward = {
  entryPrice: quote.price,
  stopLoss: quote.price - (indicators.atr * 1.5),
  target: quote.price + (indicators.atr * 3),
  ratio: 2.0
};

// 7. Calculate confidence score (0-100)
const confidenceScore = calculateConfidenceScore(
  indicators,
  confluenceScore,
  patterns
);

// 8. Build evidence chart data (for visualization)
const evidenceChartData = {
  symbol: symbol,
  currentPrice: quote.price,
  historicalPrices: historicalData.slice(-30).map(d => ({
    date: d.timestamp,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: d.volume
  })),
  indicators: {
    ema9: indicators.ema.ema9,
    ema20: indicators.ema.ema20,
    ema50: indicators.ema.ema50,
    rsi: indicators.rsi,
    macd: indicators.macd
  },
  levels: {
    entry: riskReward.entryPrice,
    stopLoss: riskReward.stopLoss,
    target: riskReward.target
  }
};

// 9. Store in database
databaseService.insertScanResult({
  symbol,
  exchange,
  strategy: 'INTRADAY_MOMENTUM_BREAKOUT',
  currentPrice: quote.price,
  entryPrice: riskReward.entryPrice,
  stopLoss: riskReward.stopLoss,
  target: riskReward.target,
  confidenceScore,
  signals: JSON.stringify(signals),
  technicalData: JSON.stringify(indicators),
  evidenceChartData: JSON.stringify(evidenceChartData),
  status: 'ACTIVE'
});
```

## 5. Chart Generation

### A. Data for Chart Display

The chart uses the last **30 days** of historical data from the evidence_chart_data:

```typescript
// From evidenceChartData stored in database
{
  historicalPrices: [
    { date: '2024-12-01', open: 2400, high: 2420, low: 2390, close: 2415, volume: 5000000 },
    { date: '2024-12-02', open: 2415, high: 2435, low: 2410, close: 2430, volume: 6000000 },
    // ... 28 more days
  ]
}
```

### B. Chart Rendering (`frontend/src/components/StockEvidenceChart.tsx`)

The chart component displays:

1. **Candlestick Series**: 30 days of OHLC data
2. **EMA Lines**: 
   - EMA 20 (blue line)
   - EMA 50 (orange line)
3. **Entry/Target/Stop Levels**:
   - Entry Price (blue dashed line)
   - Target Price (green dashed line)
   - Stop Loss (red dashed line)
4. **Indicators Below**:
   - RSI value
   - MACD signal

### C. Chart Library

Using **lightweight-charts** library:
- High-performance canvas-based charts
- Real-time updates
- Mobile-responsive
- Professional trading chart appearance

## 6. Scan Frequency & Timing

### Strategy-Based Intervals:

| Strategy Type | Scan Interval | Data Period | Candle Interval |
|--------------|---------------|-------------|-----------------|
| Intraday Momentum | Every 5 min | 3 months | 5m candles |
| Intraday Scalping | Every 2 min | 3 months | 1m candles |
| Swing Trend Following | Every 30 min | 3 months | 1d candles |
| EOD Breakout | Once at market close | 3 months | 1d candles |

### Market Hours:

- **Indian Markets (NSE/BSE)**: 9:15 AM - 3:30 PM IST
- **US Markets (NYSE/NASDAQ)**: 9:30 AM - 4:00 PM EST

Scans only run during market hours (or after close for EOD scans).

## 7. Performance Optimization

### Data Efficiency:

1. **Caching**: Recent data cached for 5 minutes
2. **Batch Processing**: Multiple stocks scanned in parallel
3. **Selective Fetching**: Only fetch full data for stocks passing initial filters
4. **Chart Data Limit**: Store only last 30 days for charts (not full 3 months)

### Database Storage:

```sql
scan_results table stores:
- Full technical indicators (JSON)
- Chart data (last 30 days only)
- Signals and patterns
- Current status
```

## 8. Example Complete Scan

### Stock: RELIANCE (NSE)
### Strategy: INTRADAY_MOMENTUM_BREAKOUT

```
Step 1: Fetch Quote
  - Current Price: ₹2,450
  - Volume: 7,500,000
  - Time: 2:30 PM IST

Step 2: Fetch Historical Data
  - Period: Last 3 months (90 days)
  - Data Points: 60 trading days (excluding holidays)
  - Size: 60 candles × 6 fields = 360 data points

Step 3: Calculate Indicators (using all 60 days)
  - RSI(14): 65.3
  - MACD: Bullish (histogram positive)
  - EMA20: ₹2,430
  - EMA50: ₹2,400
  - ADX: 28.5
  - ATR: ₹42
  - Volume Ratio: 1.8x (volume surge)

Step 4: Apply Strategy Filters
  ✓ RSI between 50-70
  ✓ ADX > 25 (strong trend)
  ✓ Volume > 1.5x average
  ✓ Price > EMA20
  = PASS

Step 5: Calculate Levels
  - Entry: ₹2,450 (current price)
  - Stop Loss: ₹2,387 (entry - 1.5×ATR)
  - Target: ₹2,576 (entry + 3×ATR)
  - R:R Ratio: 2.0

Step 6: Confidence Score
  - Base Score: 70
  - RSI bonus: +5
  - ADX bonus: +8
  - Volume bonus: +7
  - Pattern bonus: +5
  = 95/100 (High Confidence)

Step 7: Store Result
  - Chart Data: Last 30 days (30 candles)
  - Status: ACTIVE
  - Alert: Created (high confidence)

Step 8: Display on Dashboard
  - Shows in "INTRADAY_MOMENTUM_BREAKOUT" section
  - Click to view detailed chart with levels
```

## 9. Data Flow Diagram

```
Market APIs (Yahoo Finance)
          ↓
    [Market Data Service]
    - getQuote()
    - getHistoricalData(3mo)
          ↓
    [Technical Analysis]
    - Calculate indicators from 60 days
    - Detect patterns
          ↓
    [Strategy Filter]
    - Apply criteria
    - Calculate confidence
          ↓
    [Build Evidence Chart Data]
    - Last 30 days for chart
    - Entry/Target/Stop levels
          ↓
    [Database Storage]
    - scan_results table
    - evidence_chart_data (JSON)
          ↓
    [Frontend Display]
    - Auto-Scan Dashboard
    - Stock Evidence Chart
    - Technical Indicators
```

## 10. Troubleshooting Chart Display

If charts show "No chart data available":

1. **Check evidence_chart_data in database**:
   ```sql
   SELECT evidence_chart_data FROM scan_results WHERE id = 1;
   ```

2. **Verify historicalPrices array exists**:
   ```json
   {
     "historicalPrices": [...],  // Must have data
     "levels": {...},
     "indicators": {...}
   }
   ```

3. **Check browser console** for errors

4. **Verify data fetching** in backend logs

---

**AlphaStream v1.0.0** - Understanding the scanning engine that powers your trading decisions.
