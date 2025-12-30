# 📊 Chart Timeframes & Data Periods - Best Practices Guide

## Overview

This guide explains the optimal timeframe intervals and historical data periods for different trading styles to create accurate, readable charts with maximum evidence visibility.

---

## 🎯 **The Golden Rules**

### **1. Context is King**
Show enough historical data to identify:
- Trends and reversals
- Support/resistance levels
- Pattern formations
- Volume characteristics

### **2. Balance Detail vs. Noise**
- Too little data = Missing context
- Too much data = Chart becomes cluttered and hard to read

### **3. Match Timeframe to Trading Style**
Different trading styles need different perspectives.

---

## 📈 **Industry-Standard Recommendations**

### **Scalping (Minutes to 1 Hour)**

**Typical Hold:** 5 minutes to 1 hour

| Chart Interval | Historical Period | # Candles | Display Range |
|---------------|------------------|-----------|---------------|
| **1-minute** | 1-2 days | 390-780 | Last 200-400 candles |
| **5-minute** | 3-5 days | 234-390 | Last 200-300 candles |
| **15-minute** | 5-10 days | 130-260 | Last 150-200 candles |

**Why These Numbers?**
- 1 trading day = ~390 1-minute candles (6.5 hours)
- Need to see previous day's levels
- Identify intraday patterns and volume spikes

**AlphaStream Current:** ❌ Not implemented (uses daily data)

**Recommendation:** For scalping features, add:
```typescript
getHistoricalData(symbol, exchange, '1m', '2d')  // 1-min candles, 2 days
getHistoricalData(symbol, exchange, '5m', '5d')  // 5-min candles, 5 days
```

---

### **Day Trading (Hours to 1 Day)**

**Typical Hold:** 2 hours to end of day

| Chart Interval | Historical Period | # Candles | Display Range | **RECOMMENDED** |
|---------------|------------------|-----------|---------------|-----------------|
| **5-minute** | 5-10 days | 390-780 | Last 300-500 candles | ⭐ Most Popular |
| **15-minute** | 10-20 days | 260-520 | Last 200-400 candles | ⭐ Most Popular |
| **30-minute** | 20-30 days | 260-390 | Last 200-300 candles | Good |
| **1-hour** | 1-2 months | 130-260 | Last 150-200 candles | Good |

**Industry Favorite:** **15-minute charts with 10-20 days** of data.

**Why?**
- Shows 2-3 weeks of intraday patterns
- Clear support/resistance from recent days
- Not too noisy, not too sparse
- Easy to spot gap-ups/downs

**AlphaStream Current:** ❌ Not implemented (uses daily data)

**Recommendation:** Add intraday data fetching:
```typescript
getHistoricalData(symbol, exchange, '15m', '20d')  // 15-min candles, 20 days
```

---

### **Swing Trading (2 Days to 3 Weeks)** ⭐⭐⭐

**Typical Hold:** 3-15 days

| Chart Interval | Historical Period | # Candles | Display Range | **RECOMMENDED** |
|---------------|------------------|-----------|---------------|-----------------|
| **1-hour** | 2-3 months | 260-390 | Last 200-300 candles | Good |
| **4-hour** | 3-6 months | 260-520 | Last 200-400 candles | Great |
| **Daily (1D)** | **6-12 months** | **130-260** | **Last 130-260 candles** | ⭐⭐⭐ **BEST** |

**Industry Standard:** **Daily charts with 6-12 months** is THE gold standard for swing trading.

**Why 6-12 Months is Perfect:**
- 130-260 trading days (excluding weekends/holidays)
- Shows 2-3 complete trend cycles
- Captures seasonal patterns
- Clear major support/resistance zones
- Enough data for EMA 200 calculation (needs 200+ candles)
- Not too zoomed out, not too zoomed in

**AlphaStream Current:** ✅ Partially (uses 3-6 months)
- Current: `'1d', '3mo'` = ~60-90 candles
- **Should be:** `'1d', '1y'` = ~250 candles

**Recommendation:** Update to 1 year:
```typescript
getHistoricalData(symbol, exchange, '1d', '1y')  // Daily candles, 1 year
```

---

### **Position Trading (Weeks to Months)**

**Typical Hold:** 1-6 months

| Chart Interval | Historical Period | # Candles | Display Range | **RECOMMENDED** |
|---------------|------------------|-----------|---------------|-----------------|
| **Daily (1D)** | 1-3 years | 250-750 | Last 250-500 candles | ⭐ Best |
| **Weekly** | 3-5 years | 150-260 | Last 150-200 candles | Great |
| **Monthly** | 5-10 years | 60-120 | Last 60-100 candles | Good for macro |

**Industry Standard:** **Daily charts with 2-3 years** for position trading.

**AlphaStream Current:** ❌ Too short (3-6 months)

**Recommendation:** Add longer periods:
```typescript
getHistoricalData(symbol, exchange, '1d', '3y')  // Daily candles, 3 years
```

---

## 🔬 **Technical Indicator Requirements**

### **Minimum Data for Accurate Calculations**

| Indicator | Formula Periods | Minimum Candles | **Recommended** | Why? |
|-----------|----------------|-----------------|-----------------|------|
| **RSI** | 14 | 28 (2x) | **100+** | Needs warmup period |
| **MACD** | 12, 26, 9 | 35 | **100+** | EMA calculations need warmup |
| **EMA 20** | 20 | 20 | **60+** (3x) | Exponential needs historical context |
| **EMA 50** | 50 | 50 | **150+** (3x) | More data = smoother line |
| **EMA 200** | 200 | 200 | **600+** (3x) | Long-term average needs history |
| **SMA 200** | 200 | 200 | **400+** (2x) | Simple average, less warmup |
| **Bollinger Bands** | 20, 2σ | 20 | **60+** | Needs std dev stability |
| **ADX** | 14 | 28 (2x) | **50+** | Complex calculation |
| **ATR** | 14 | 14 | **30+** | Simple average |

### **Universal Rule:**
**Fetch 3x the largest indicator period** for accurate values.

If using EMA 200:
- Minimum: 200 candles
- Recommended: **600 candles** (3x)
- Why? EMAs weight recent data but need historical context

---

## 📊 **Chart Display Optimization**

### **What to Display vs. What to Calculate**

**Best Practice:**
1. **Fetch more data** than you display (for accurate indicators)
2. **Display optimal range** for readability
3. **Allow user zoom** to see full history

#### Example: Swing Trading

```typescript
// FETCH: 1 year of data for accurate indicator calculation
const historicalData = await getHistoricalData(symbol, exchange, '1d', '1y');
// Result: ~250 trading days

// CALCULATE: All indicators using full dataset
const indicators = TechnicalAnalysis.calculateAllIndicators(historicalData);
// EMA 200 now accurate because we have 250 candles

// DISPLAY: Last 6 months (130 candles) by default
const displayData = historicalData.slice(-130);

// STORE: Full data for user to zoom out if needed
const chartData = {
  fullHistoricalPrices: historicalData,  // All 250 days
  displayedPrices: displayData,          // Last 130 days
  indicators: indicators                 // Calculated from full 250 days
};
```

---

## 🎨 **Visual Clarity Guidelines**

### **Number of Candles for Readability**

| Screen Width | Optimal Candles | Max Candles | Why? |
|-------------|-----------------|-------------|------|
| **Mobile (< 600px)** | 50-100 | 150 | Small screen, needs zoom |
| **Tablet (600-1024px)** | 100-200 | 300 | Medium detail |
| **Desktop (> 1024px)** | 150-300 | 500 | Full detail visible |

**Recommendation:** 
- Default display: **200 candles**
- Allow pinch-zoom on mobile
- Allow scroll-wheel zoom on desktop
- Max zoom out: Full historical data
- Max zoom in: 20-30 candles

---

## ⚡ **AlphaStream Current Status**

### **What We're Doing Now:**

```typescript
// Screener Service - General Stocks
getHistoricalData(symbol, exchange, '1d', '3mo')  
// ❌ Only 60-90 days

// Swing Trading Signals
getHistoricalData(symbol, exchange, '1d', '6mo')  
// ⚠️ Better, but still short (130 days)

// Chart Display
historicalData.slice(-30)  
// ❌ Only showing last 30 days (too zoomed in!)
```

### **Problems:**
1. **3 months not enough** for accurate EMA 200 (needs 200+ candles)
2. **30 days display** is too zoomed in for swing trading
3. **No intraday data** for day trading strategies
4. **Missing pattern context** - can't see support/resistance from 6+ months ago

---

## ✅ **Recommended Improvements for AlphaStream**

### **Immediate Changes:**

#### **1. Increase Data Fetch Periods**

```typescript
// For Swing Trading (DEFAULT)
const historicalData = await marketDataService.getHistoricalData(
  symbol, 
  exchange, 
  '1d',   // Daily candles
  '1y'    // 1 year (~250 trading days) ✅
);

// For Position Trading
const historicalData = await marketDataService.getHistoricalData(
  symbol, 
  exchange, 
  '1d',   // Daily candles
  '3y'    // 3 years (~750 trading days) ✅
);

// For Day Trading (NEW)
const historicalData = await marketDataService.getHistoricalData(
  symbol, 
  exchange, 
  '15m',  // 15-minute candles
  '20d'   // 20 days ✅
);

// For Scalping (NEW)
const historicalData = await marketDataService.getHistoricalData(
  symbol, 
  exchange, 
  '5m',   // 5-minute candles
  '5d'    // 5 days ✅
);
```

#### **2. Optimize Chart Display**

```typescript
private buildEvidenceChartData(result: any, strategyType: string): any {
  const displayCandles = this.getDisplayCandleCount(strategyType);
  
  return {
    symbol: result.symbol,
    currentPrice: result.price,
    // Store ALL historical data for zooming
    fullHistoricalPrices: result.historicalData,
    // Display optimal range by default
    historicalPrices: result.historicalData?.slice(-displayCandles) || [],
    // ... rest of the data
  };
}

private getDisplayCandleCount(strategyType: string): number {
  switch(strategyType) {
    case 'INTRADAY': return 200;      // 200 15-min candles ~= 2.5 days
    case 'SWING': return 180;          // 180 daily candles ~= 6 months
    case 'LONG_TERM': return 250;      // 250 daily candles ~= 1 year
    default: return 180;
  }
}
```

#### **3. Add Strategy-Specific Intervals**

Update `autoScanService.ts` strategies:

```typescript
const STRATEGIES = {
  // Intraday strategies - use 15-minute data
  INTRADAY_MOMENTUM_BREAKOUT: {
    interval: '15m',
    period: '20d',
    displayCandles: 200
  },
  
  // Swing strategies - use daily data
  SWING_TREND_FOLLOWING: {
    interval: '1d',
    period: '1y',
    displayCandles: 180
  },
  
  // EOD strategies - use daily data
  EOD_BREAKOUT_SETUP: {
    interval: '1d',
    period: '1y',
    displayCandles: 180
  }
};
```

---

## 📏 **Complete Comparison Table**

| Trading Style | Interval | Data Period | # Candles | Display | Indicators Accurate? |
|--------------|----------|-------------|-----------|---------|---------------------|
| **Scalping** | 5m | 5 days | 390 | 200 | ✅ RSI, MACD, EMA 20 |
| **Day Trading** | 15m | 20 days | 520 | 200 | ✅ RSI, MACD, EMA 50 |
| **Swing Trading** | 1d | **1 year** | **250** | **180** | ✅ **All including EMA 200** |
| **Position** | 1d | 3 years | 750 | 250 | ✅ All + seasonal patterns |

---

## 🎯 **Specific Recommendations for AlphaStream**

### **Priority 1: Fix Swing Trading (Most Users)**

**Change this:**
```typescript
// Current - NOT ENOUGH DATA
getHistoricalData(symbol, exchange, '1d', '3mo')  // Only ~60 days
historicalData.slice(-30)  // Only showing 30 days
```

**To this:**
```typescript
// Recommended - INDUSTRY STANDARD
getHistoricalData(symbol, exchange, '1d', '1y')   // 250 days ✅
historicalData.slice(-180)  // Display 6 months ✅
```

**Impact:**
- ✅ EMA 200 now accurate (has 250 candles)
- ✅ Can see major support/resistance from 6-12 months ago
- ✅ Better trend identification
- ✅ Matches what professional traders use

### **Priority 2: Add Intraday Support**

For day trading strategies, add 15-minute data:
```typescript
getHistoricalData(symbol, exchange, '15m', '20d')  // 520 candles
historicalData.slice(-200)  // Display 200 candles
```

### **Priority 3: Make it Configurable**

Allow users to choose their preferred view:
```typescript
interface ChartPreferences {
  interval: '5m' | '15m' | '1h' | '1d' | '1w';
  displayPeriod: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '3y';
}
```

---

## 📝 **Implementation Checklist**

- [ ] Update data fetch periods to 1 year for swing/EOD strategies
- [ ] Increase chart display from 30 to 180 candles
- [ ] Add 15-minute interval support for intraday strategies  
- [ ] Store full historical data, display optimal range
- [ ] Add user zoom controls (zoom in/out)
- [ ] Add interval selector (5m, 15m, 1h, 1d)
- [ ] Add period selector (1mo, 3mo, 6mo, 1y)
- [ ] Test EMA 200 accuracy with new data range
- [ ] Update documentation with new timeframes

---

## 🏆 **Summary: The Perfect Setup**

### **For 90% of Traders (Swing Trading):**

```typescript
// Fetch
interval: '1d'           // Daily candles
period: '1y'             // 1 year of data
totalCandles: ~250       // Enough for EMA 200

// Calculate
indicators: All          // Using full 250 candles

// Display  
defaultView: 180         // Last 6 months visible
allowZoom: true          // Can zoom to full 1 year
```

**This gives:**
- ✅ Accurate all indicators (even EMA 200)
- ✅ Clear 6-month trend visibility
- ✅ Major support/resistance visible
- ✅ Not too cluttered
- ✅ Industry-standard professional look

---

**AlphaStream v1.0.0** - Optimizing charts for maximum evidence visibility and accuracy.
