# 📊 Index-Based Stock Screening Guide

## Overview

The Market Screener now supports **Index-Based Stock Screening**, allowing you to filter and analyze stocks from specific market indexes across NSE, NYSE, and NASDAQ exchanges. This feature dramatically increases the stock universe and provides professional-grade index-based analysis capabilities.

---

## 🎯 Key Features

### 1. **Expanded Stock Universe**
- **NSE**: 200+ unique stocks across 10 indexes
- **NYSE**: 600+ stocks across 8 indexes
- **NASDAQ**: 300+ stocks across 4 indexes
- **Total**: 1,100+ stocks available for screening

### 2. **Professional Market Indexes**

#### NSE (India) Indexes:
- **NIFTY 50** - Top 50 companies by market cap
- **NIFTY BANK** - Banking and financial services (12 stocks)
- **NIFTY IT** - Information Technology sector (10 stocks)
- **NIFTY AUTO** - Automobile and components (15 stocks)
- **NIFTY PHARMA** - Pharmaceutical and healthcare (15 stocks)
- **NIFTY FMCG** - Fast-moving consumer goods (15 stocks)
- **NIFTY METAL** - Metals and mining (15 stocks)
- **NIFTY ENERGY** - Oil, gas, and energy (15 stocks)
- **NIFTY MIDCAP 100** - Top 100 mid-cap companies
- **NIFTY SMALLCAP 100** - Top 100 small-cap companies

#### NYSE Indexes:
- **S&P 500** - Top 500 US large-cap companies
- **DOW JONES** - 30 prominent US companies
- **RUSSELL 2000** - Small-cap companies (2,000 stocks)
- **Technology Select Sector** - Tech sector from S&P 500 (65 stocks)
- **Healthcare Select Sector** - Healthcare sector (63 stocks)
- **Financial Select Sector** - Financial sector (68 stocks)
- **Energy Select Sector** - Energy sector (23 stocks)

#### NASDAQ Indexes:
- **NASDAQ 100** - Top 100 non-financial companies
- **NASDAQ Composite** - All NASDAQ-listed stocks (~3,000)
- **Technology Heavy** - Technology-focused stocks
- **Small Cap** - Small-cap NASDAQ companies

---

## 🚀 How to Use Index-Based Screening

### Method 1: Via User Interface

1. **Navigate to Screener Page**
   - Open the application
   - Click on "Screener" in the navigation menu

2. **Select Markets**
   - Check the exchanges you want to screen (NSE, NYSE, NASDAQ)
   - Index list will automatically load for selected markets

3. **Choose Indexes**
   - Expand the "Market Indexes" section
   - Browse available indexes (organized by category)
   - Select one or more indexes by checking the boxes
   - See real-time count of selected indexes

4. **Apply Additional Filters** (Optional)
   - Price Range
   - Technical Indicators (RSI, MACD, ADX)
   - Fundamental Metrics (P/E, ROE, EPS Growth)

5. **Run Screener**
   - Click "Run Screener" button
   - Results will show stocks from selected indexes only
   - Up to 50 stocks per screening session

### Method 2: Via API

#### Get All Indexes
```bash
GET /api/indexes

Response:
{
  "indexes": [
    {
      "id": "nifty50",
      "name": "NIFTY 50",
      "symbol": "^NSEI",
      "exchange": "NSE",
      "description": "Top 50 companies by market capitalization on NSE",
      "category": "Broad Market",
      "constituents": ["RELIANCE", "TCS", ...],
      "totalStocks": 50
    },
    ...
  ],
  "count": 19,
  "timestamp": "2025-12-26T..."
}
```

#### Get Indexes by Exchange
```bash
GET /api/indexes/exchange/NSE

Response:
{
  "exchange": "NSE",
  "indexes": [...],
  "count": 10,
  "timestamp": "2025-12-26T..."
}
```

#### Get Index Constituents
```bash
GET /api/indexes/nifty50/constituents

Response:
{
  "indexId": "nifty50",
  "indexName": "NIFTY 50",
  "exchange": "NSE",
  "constituents": [
    "RELIANCE", "TCS", "HDFCBANK", ...
  ],
  "count": 50,
  "timestamp": "2025-12-26T..."
}
```

#### Run Screener with Index Filter
```bash
POST /api/screener/run
Content-Type: application/json

{
  "markets": ["NSE"],
  "indexes": ["nifty50", "niftybank"],
  "technicalFilters": {
    "rsiRange": { "min": 40, "max": 70 },
    "adxMin": 25
  },
  "fundamentalFilters": {
    "peRatioMax": 30,
    "roeMin": 15
  }
}

Response:
{
  "results": [
    {
      "symbol": "RELIANCE",
      "exchange": "NSE",
      "price": 2456.30,
      "changePercent": 1.25,
      "indicators": { ... },
      "score": 75,
      "fundamentalScore": { ... },
      "recommendation": "BUY"
    },
    ...
  ],
  "count": 12,
  "timestamp": "2025-12-26T..."
}
```

---

## 📚 Index Categories

### Broad Market
Large, diversified indexes covering the entire market:
- NIFTY 50 (NSE)
- S&P 500 (NYSE)
- DOW JONES (NYSE)
- NASDAQ 100 (NASDAQ)
- NASDAQ Composite (NASDAQ)

**Best For:**
- Diversified screening
- Market-wide scans
- Balanced portfolios

### Sector-Specific
Focused on specific industry sectors:
- Banking (NIFTY BANK)
- Technology (NIFTY IT, Tech Sector)
- Healthcare (Healthcare Sector)
- Energy (NIFTY ENERGY, Energy Sector)
- Metals (NIFTY METAL)
- Auto (NIFTY AUTO)
- FMCG (NIFTY FMCG)
- Pharma (NIFTY PHARMA)
- Financials (Financial Sector)

**Best For:**
- Sector rotation strategies
- Industry-specific analysis
- Thematic investing

### Market Cap
Organized by company size:
- Large Cap: NIFTY 50, S&P 500, DOW JONES
- Mid Cap: NIFTY MIDCAP 100
- Small Cap: NIFTY SMALLCAP 100, RUSSELL 2000

**Best For:**
- Growth vs. stability trade-off
- Risk-adjusted returns
- Market cap-based strategies

---

## 💡 Usage Examples

### Example 1: Banking Sector Momentum Play
**Goal**: Find high-momentum banking stocks

```javascript
{
  "markets": ["NSE"],
  "indexes": ["niftybank"],
  "technicalFilters": {
    "rsiRange": { "min": 55, "max": 75 },
    "adxMin": 30,
    "volumeBreakout": true
  },
  "fundamentalFilters": {
    "roeMin": 12,
    "debtToEquityMax": 10
  }
}
```

**Expected Results**: 3-5 banking stocks with strong momentum and solid fundamentals

---

### Example 2: S&P 500 Value Stocks
**Goal**: Find undervalued large-cap US stocks

```javascript
{
  "markets": ["NYSE"],
  "indexes": ["sp500"],
  "fundamentalFilters": {
    "peRatioMax": 20,
    "pbRatioMax": 3,
    "roeMin": 15,
    "dividendYieldMin": 2
  }
}
```

**Expected Results**: 10-15 value stocks from S&P 500

---

### Example 3: Tech Sector Growth
**Goal**: Find high-growth technology stocks

```javascript
{
  "markets": ["NYSE", "NASDAQ"],
  "indexes": ["techsector", "nasdaq100"],
  "fundamentalFilters": {
    "epsGrowthMin": 20,
    "revenueGrowthMin": 15,
    "roeMin": 18
  },
  "technicalFilters": {
    "rsiRange": { "min": 50, "max": 70 }
  }
}
```

**Expected Results**: 20-30 high-growth tech stocks

---

### Example 4: Small Cap Discovery
**Goal**: Find emerging small-cap opportunities

```javascript
{
  "markets": ["NSE", "NYSE"],
  "indexes": ["niftysmallcap100", "russell2000"],
  "fundamentalFilters": {
    "epsGrowthMin": 30,
    "revenueGrowthMin": 25
  },
  "priceRange": { "min": 10, "max": 100 }
}
```

**Expected Results**: 15-25 small-cap growth stocks

---

### Example 5: Multi-Sector Diversification
**Goal**: Build a diversified portfolio across sectors

```javascript
{
  "markets": ["NSE"],
  "indexes": [
    "niftybank",      // Banking
    "niftyit",        // Technology
    "niftypharma",    // Healthcare
    "niftyauto",      // Automobile
    "niftyfmcg"       // Consumer Goods
  ],
  "fundamentalFilters": {
    "roeMin": 15,
    "peRatioMax": 30
  }
}
```

**Expected Results**: 25-40 stocks across 5 different sectors

---

## 🎓 Best Practices

### 1. **Start Broad, Then Narrow**
- Begin with a broad index (NIFTY 50, S&P 500)
- Apply basic filters
- Gradually add more specific criteria

### 2. **Use Sector Indexes for Thematic Plays**
- Identify trending sectors
- Use sector-specific indexes
- Apply momentum filters

### 3. **Combine Multiple Indexes**
- Mix large-cap and mid-cap indexes
- Diversify across sectors
- Balance growth and value

### 4. **Leverage Categories**
- **Broad Market**: For market-wide scans
- **Sector**: For focused plays
- **Market Cap**: For risk-adjusted selection

### 5. **Apply Appropriate Filters**
- **Growth Indexes**: EPS growth, revenue growth filters
- **Value Indexes**: P/E, P/B, dividend yield filters
- **Momentum Indexes**: RSI, ADX, volume filters

---

## 📊 Index Statistics

### By Exchange
```
NSE:     10 indexes, 200+ unique stocks
NYSE:     8 indexes, 600+ stocks
NASDAQ:   4 indexes, 300+ stocks
```

### By Category
```
Broad Market:  5 indexes
Sector:       11 indexes
Market Cap:    3 indexes
```

### Top 5 Largest Indexes (by constituents)
1. **NASDAQ Composite**: ~3,000 stocks
2. **RUSSELL 2000**: 2,000 stocks
3. **S&P 500**: 500 stocks
4. **NIFTY MIDCAP 100**: 100 stocks
5. **NIFTY SMALLCAP 100**: 100 stocks

---

## 🔧 Technical Implementation

### Backend Architecture

1. **Index Service** (`backend/src/services/indexService.ts`)
   - Manages all market indexes
   - Provides index lookup and filtering
   - Returns constituent stocks

2. **Market Data Service** (Enhanced)
   - Integrated with Index Service
   - Supports index-based stock retrieval
   - Expanded stock universe

3. **Screener Service** (Enhanced)
   - Index filtering logic
   - Combines stocks from multiple indexes
   - Deduplicates symbols

4. **API Routes** (`backend/src/routes/indexRoutes.ts`)
   - GET `/api/indexes` - All indexes
   - GET `/api/indexes/exchange/:exchange` - By exchange
   - GET `/api/indexes/:id` - Specific index
   - GET `/api/indexes/:id/constituents` - Index stocks
   - GET `/api/indexes/category/:category` - By category

### Frontend Integration

1. **Index API Client** (`frontend/src/api/client.ts`)
   - `indexAPI.getAllIndexes()`
   - `indexAPI.getIndexesByExchange(exchange)`
   - `indexAPI.getIndexConstituents(indexId)`

2. **Screener Component** (Enhanced)
   - Index selection UI
   - Real-time index loading
   - Multi-select checkboxes
   - Category badges
   - Stock count display

3. **Criteria Interface** (Updated)
   - Added `indexes?: string[]` field
   - Backwards compatible
   - Optional parameter

---

## ⚡ Performance Considerations

### Screening Limits
- **Max stocks per session**: 50 (configurable)
- **Recommended indexes**: 1-5 per screening
- **API response time**: <2 seconds for 50 stocks

### Optimization Tips
1. **Select specific indexes** rather than all available
2. **Use price filters** to reduce dataset
3. **Combine indexes from same exchange** for better performance
4. **Apply technical filters first** (faster than fundamental)

---

## 🛠️ API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/indexes` | GET | Get all indexes |
| `/api/indexes/exchange/:exchange` | GET | Get indexes by exchange |
| `/api/indexes/:id` | GET | Get specific index details |
| `/api/indexes/:id/constituents` | GET | Get index constituents |
| `/api/indexes/category/:category` | GET | Get indexes by category |
| `/api/indexes/search?q=query` | GET | Search indexes |
| `/api/indexes/stats` | GET | Get index statistics |
| `/api/screener/run` | POST | Run screener with index filter |

---

## 🎯 Common Use Cases

### 1. **Sector Rotation Strategy**
Monitor multiple sector indexes and switch based on momentum:
```javascript
// Screen all sectors monthly
["niftybank", "niftyit", "niftypharma", "niftyauto", "niftymetal"]
```

### 2. **Index Arbitrage**
Find opportunities across similar indexes:
```javascript
// Compare NIFTY 50 vs NIFTY MIDCAP 100
["nifty50", "niftymidcap100"]
```

### 3. **Global Diversification**
Screen across multiple markets:
```javascript
// Mix Indian and US markets
markets: ["NSE", "NYSE"],
indexes: ["nifty50", "sp500"]
```

### 4. **Small Cap Discovery**
Focus on emerging companies:
```javascript
indexes: ["niftysmallcap100", "russell2000"]
```

### 5. **Blue Chip Screening**
Find established, reliable stocks:
```javascript
indexes: ["nifty50", "sp500", "dowjones"]
```

---

## 📝 Changelog

### Version 2.0 - Index-Based Screening
**Released**: 2025-12-26

**New Features:**
- ✅ 19 professional market indexes added
- ✅ 1,100+ stock universe across NSE, NYSE, NASDAQ
- ✅ Index selection UI in screener
- ✅ Multi-index filtering support
- ✅ Category-based organization
- ✅ Real-time index loading
- ✅ Stock count display
- ✅ Complete API integration

**Enhancements:**
- Increased screening limit from 20 to 50 stocks
- Added index categorization (Broad Market, Sector, Market Cap)
- Expanded NSE coverage from 24 to 200+ stocks
- Expanded US markets from 27 to 900+ stocks
- Added index-based stock retrieval

**API Changes:**
- Added `indexes` parameter to ScreenerCriteria
- New `/api/indexes/*` endpoints
- Enhanced `/api/screener/run` with index filtering

---

## 🚨 Important Notes

### Limitations
- Index data is semi-static (updated periodically)
- Some indexes may have incomplete constituent lists
- Real-time index membership changes not reflected immediately

### Data Sources
- NSE indexes: Based on official NIFTY index compositions
- US indexes: Based on publicly available constituent lists
- Index symbols use Yahoo Finance notation (e.g., ^NSEI for NIFTY 50)

### Future Enhancements
- [ ] Real-time index constituent updates
- [ ] Index performance tracking
- [ ] Custom index creation
- [ ] Index comparison tools
- [ ] Historical index composition
- [ ] Index rebalancing alerts

---

## 📚 Additional Resources

### Related Documentation
- **SCREENING_STRATEGIES_GUIDE.md** - Professional screening strategies
- **STRATEGIES_QUICK_REFERENCE.md** - Quick strategy lookup
- **TESTING_GUIDE.md** - Testing procedures
- **SCREENING_ENHANCEMENTS_SUMMARY.md** - Recent enhancements

### External References
- [NSE India Indexes](https://www.nse india.com/products-services/indices)
- [S&P 500 Constituents](https://www.spglobal.com/spdji/en/indices/equity/sp-500/)
- [NASDAQ 100 Components](https://www.nasdaq.com/market-activity/quotes/nasdaq-ndx-index)
- [Russell Indexes](https://www.ftserussell.com/products/indices/russell-us)

---

## 💬 Support

For issues, questions, or feature requests related to index-based screening:

1. Check this documentation first
2. Review the API endpoints
3. Test with small index sets
4. Verify exchange compatibility
5. Check network connectivity

---

**Last Updated**: 2025-12-26
**Version**: 2.0
**Feature Status**: ✅ Production Ready
