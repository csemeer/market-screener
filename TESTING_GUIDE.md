# 🧪 Comprehensive Testing Guide - Stock Market Screener

## Quick Start Testing

### Prerequisites
```bash
# Ensure all dependencies are installed
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Start the Application

**Option 1: Development Mode (Recommended for Testing)**
```bash
# Terminal 1 - Start Backend
cd backend
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev
```

**Option 2: Production Docker Mode**
```bash
./deploy.sh prod
```

## End-to-End Testing Checklist

### ✅ 1. Backend API Testing

#### Test Stock Detail Endpoint
```bash
# Test with a US stock (should work with real Yahoo Finance data)
curl http://localhost:3001/api/stocks/detail/NYSE/AAPL | jq

# Test with an Indian stock
curl http://localhost:3001/api/stocks/detail/NSE/RELIANCE | jq

# Expected Response Structure:
{
  "symbol": "AAPL",
  "exchange": "NYSE",
  "price": 150.25,
  "changePercent": 1.5,
  "volume": 50000000,
  "marketCap": 2500000000000,
  "indicators": {
    "rsi": 65.5,
    "macd": 2.5,
    "macdSignal": 2.0,
    "adx": 35.2,
    "stochK": 70.5,
    "bbPosition": "Middle",
    "volumeTrend": "Increasing"
  },
  "patterns": ["bullish_engulfing", "golden_cross"],
  "fundamentals": null,  // or fundamental data if available
  "fundamentalScore": null,
  "historicalData": [...],  // Last 90 days
  "combinedScore": 75,
  "confluenceScore": 80,
  "recommendation": "BUY",
  "lastUpdated": "2025-12-25T..."
}
```

#### Test Health Endpoint
```bash
curl http://localhost:3001/api/health
# Expected: {"status":"healthy","timestamp":"..."}
```

#### Test Screener Presets
```bash
curl http://localhost:3001/api/screener/presets | jq
# Should return 7 presets: momentum, value, growth, quality, oversold, breakout, uptrend
```

### ✅ 2. Frontend Component Testing

#### 2.1 Dashboard Page
**URL:** `http://localhost:3000/`

**Test Cases:**
- [ ] Page loads without errors
- [ ] Market statistics display correctly
- [ ] 4 Quick Action cards are visible
- [ ] Clicking "Find Momentum Stocks" navigates to `/screener?preset=momentum`
- [ ] Clicking "Find Value Plays" navigates to `/screener?preset=value`
- [ ] Mobile responsive design works (resize browser)
- [ ] All icons render correctly

#### 2.2 Screener Page
**URL:** `http://localhost:3000/screener`

**Test Cases:**
- [ ] Preset filters load in sidebar
- [ ] Clicking a preset applies the filters
- [ ] Custom filters can be modified
- [ ] "Run Screener" button works
- [ ] Results display in data table
- [ ] "View Analysis" button appears on each row
- [ ] Pagination works correctly
- [ ] Filters (search, min score, recommendation) work
- [ ] Mobile card view displays correctly
- [ ] Export CSV button functions

**URL Parameters Test:**
- [ ] Navigate to `/screener?preset=momentum`
- [ ] Filters should auto-apply
- [ ] Preset should be visually highlighted

#### 2.3 Stock Detail Page (NEW FEATURE)
**URL:** `http://localhost:3000/stock/NYSE/AAPL`

**Test Cases:**

**Page Load:**
- [ ] Loading spinner displays while fetching data
- [ ] Stock header shows: Symbol, Exchange, Price, Change%
- [ ] Quick stats display: Score, Quality, Action (recommendation)
- [ ] Back button works and returns to previous page
- [ ] Error message displays if stock not found

**Tab Navigation:**
- [ ] 5 tabs are visible: Price Chart, Technical, Fundamental, Signal Evidence, AI Insights
- [ ] Clicking each tab switches content
- [ ] Mobile dropdown selector works (resize browser < 640px)
- [ ] Active tab is highlighted

**Tab 1: Price Chart**
- [ ] Candlestick chart renders using Lightweight Charts
- [ ] Chart displays historical price data
- [ ] Toggle buttons work: EMA 20, EMA 50, Volume, RSI, MACD
- [ ] Clicking toggles shows/hides indicators
- [ ] RSI chart displays when RSI button is active
- [ ] MACD chart displays when MACD button is active
- [ ] Current RSI value shown with interpretation
- [ ] Chart legend shows: 24h High, 24h Low, Volume, Market Cap
- [ ] Chart is responsive (resize browser)

**Tab 2: Technical Analysis**
- [ ] Overall summary box displays (BULLISH/BEARISH/NEUTRAL)
- [ ] Signal distribution bar chart renders
- [ ] Technical strength radar chart displays
- [ ] 6 detailed indicators show with evidence:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - ADX (Average Directional Index)
  - Stochastic %K
  - Bollinger Bands Position
  - Volume Trend
- [ ] Each indicator shows: Value, Signal (Bullish/Bearish/Neutral), Evidence
- [ ] Evidence boxes explain why each signal triggered
- [ ] Key Levels section shows: Resistance 1, Current Price, Support 1
- [ ] All percentages and values display correctly

**Tab 3: Fundamental Analysis**
- [ ] Quality score displays (A+ to D rating)
- [ ] Key metrics grid shows: Market Cap, P/E, ROE, Revenue Growth
- [ ] Valuation metrics bar chart renders with benchmarks
- [ ] Profitability metrics horizontal bar chart displays
- [ ] Revenue & Earnings growth trend line chart renders
- [ ] Financial health cards show 4 metrics with color coding:
  - Debt/Equity (Green=Good, Yellow=Moderate, Red=Poor)
  - Current Ratio
  - Quick Ratio
  - Interest Coverage
- [ ] Key fundamental metrics table displays with ratings
- [ ] "N/A" displays for unavailable metrics
- [ ] All charts use consistent color scheme

**Tab 4: Signal Evidence**
- [ ] Trading recommendation prominently displayed (STRONG_BUY/BUY/HOLD/SELL/STRONG_SELL)
- [ ] Confidence score percentage shown
- [ ] Signal count displays: X Bullish, Y Bearish, Z Neutral
- [ ] Complete trading plan section shows:
  - Entry Price (current price)
  - Target Price (+X% gain)
  - Stop Loss (-Y% risk)
  - Risk:Reward ratio (1:Z)
- [ ] Risk:Reward ratio color coded (Green ≥3, Yellow ≥2, Red <2)
- [ ] Price level visualization chart renders
- [ ] Reference lines show on chart (Target, Entry, Stop Loss)
- [ ] Bullish signals section lists all bullish indicators with:
  - Signal name, strength rating
  - Description and evidence explanation
  - Mini charts for some signals
- [ ] Bearish signals section lists (if any)
- [ ] Neutral signals section lists (if any)
- [ ] Historical pattern analysis box shows:
  - Pattern detected count
  - Success rate percentage
  - Average move and timeframe

**Tab 5: AI Insights**
- [ ] AI summary box with purple gradient background
- [ ] Comprehensive summary paragraph explains analysis
- [ ] Three confidence score cards display:
  - Trend Probability (with progress bar)
  - Sentiment Score (with color-coded bar)
  - Risk Level (Low/Medium/High)
- [ ] Pattern recognition section lists 2-3 patterns:
  - Pattern name (e.g., "Bullish Engulfing Pattern")
  - Description
  - Success rate and average move
  - Bullish/Bearish tag
- [ ] Multi-factor strength radar chart displays
- [ ] AI price prediction section shows 3 scenarios:
  - Bullish Case (target price, change%, probability%)
  - Base Case
  - Bearish Case
- [ ] Model accuracy percentage shown
- [ ] Key insights section with 4 cards:
  - Opportunities (green border)
  - Risks (red border)
  - General insights (blue border)
- [ ] AI-recommended actions section with 4 prioritized items:
  - Priority badges (High/Medium/Low)
  - Action, reason, timeframe
- [ ] Disclaimer box displays at bottom

### ✅ 3. Navigation & Integration Testing

**Test Flow:**
1. Start at Dashboard (`/`)
2. Click "Find Momentum Stocks"
3. Should navigate to `/screener?preset=momentum`
4. Screener should auto-apply momentum preset
5. Click "Run Screener" button
6. Results should load in table
7. Click "View Analysis" on first stock
8. Should navigate to `/stock/NYSE/[SYMBOL]`
9. Stock detail page should load with all tabs
10. Click through all 5 tabs
11. Click "Back to Results"
12. Should return to screener page with results intact
13. Navigate to different stock
14. Repeat

### ✅ 4. Error Handling Testing

**Test Cases:**
- [ ] Navigate to `/stock/NYSE/INVALID_SYMBOL`
- [ ] Should show error message: "Stock not found"
- [ ] "Go Back" button should work
- [ ] Backend offline: Should show "Failed to load stock data"
- [ ] Network timeout: Should show error message
- [ ] Invalid exchange: `/stock/INVALID/AAPL` → Should show error

### ✅ 5. Mobile Responsiveness Testing

**Breakpoints to Test:**
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667

**Test Cases:**
- [ ] Dashboard cards stack vertically on mobile
- [ ] Screener sidebar becomes full-width on mobile
- [ ] Data table switches to card view on mobile
- [ ] Stock detail tabs become dropdown on mobile
- [ ] Charts are responsive and readable
- [ ] All buttons are touch-friendly (min 44x44px)
- [ ] Text is readable without zooming
- [ ] No horizontal scrolling

### ✅ 6. Performance Testing

**Metrics to Check:**
- [ ] Initial page load < 3 seconds
- [ ] Stock detail page loads < 2 seconds
- [ ] Charts render smoothly without lag
- [ ] Tab switching is instant
- [ ] Screener results load < 2 seconds
- [ ] No console errors in browser DevTools
- [ ] No memory leaks (check Memory tab in DevTools)
- [ ] Bundle size is acceptable (<1MB)

### ✅ 7. Data Accuracy Testing

**Verify:**
- [ ] Stock prices match real data (compare with Yahoo Finance)
- [ ] Technical indicators are calculated correctly:
  - RSI range: 0-100
  - MACD and Signal values are reasonable
  - ADX range: 0-100
  - Stochastic range: 0-100
- [ ] Recommendation logic makes sense:
  - High score → BUY/STRONG_BUY
  - Low score → SELL/STRONG_SELL
  - Mid score → HOLD
- [ ] Confluence score represents signal agreement
- [ ] Risk:Reward ratios are calculated correctly

## Common Issues & Solutions

### Issue 1: "Failed to load stock data"
**Solution:** Check if backend is running on port 3001
```bash
curl http://localhost:3001/api/health
```

### Issue 2: Charts not rendering
**Solution:** Clear browser cache and reload
```bash
# Chrome: Ctrl+Shift+Delete → Clear cache
# Or hard refresh: Ctrl+Shift+R
```

### Issue 3: "Stock not found"
**Solution:** Ensure stock symbol is valid and exchange is correct
- US stocks: NYSE, NASDAQ (e.g., AAPL, MSFT, GOOGL)
- Indian stocks: NSE, BSE (e.g., RELIANCE, TCS, INFY)

### Issue 4: TypeScript errors during build
**Solution:**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### Issue 5: Port already in use
**Solution:**
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## Testing Checklist Summary

### Critical Path (Must Test)
- [x] Dashboard loads
- [ ] Screener works with presets
- [ ] Stock detail page loads from screener results
- [ ] All 5 analysis tabs display data correctly
- [ ] Charts render properly
- [ ] Navigation works (back/forward buttons)
- [ ] Mobile view is functional

### Secondary Features
- [ ] URL parameters work
- [ ] Export CSV functions
- [ ] Filters and pagination work
- [ ] Error messages display correctly
- [ ] Loading states show properly

### Nice to Have
- [ ] Performance is smooth
- [ ] No console warnings
- [ ] All edge cases handled
- [ ] Documentation is clear

## Reporting Issues

If you find any bugs, please note:
1. **What you were trying to do**
2. **What happened instead**
3. **Error messages (from browser console)**
4. **Steps to reproduce**
5. **Browser and version**
6. **Screenshot if applicable**

## Success Criteria

✅ **The system is working correctly if:**
1. All 5 tabs load without errors
2. Charts display with real or mock data
3. All indicators show values (or "N/A")
4. Recommendations are logical based on scores
5. Navigation flows smoothly
6. Mobile view is usable
7. No console errors appear
8. Build succeeds without warnings

## Next Steps After Testing

1. Review any failures from checklist
2. Fix critical bugs first
3. Enhance with additional features:
   - Watchlist functionality
   - Price alerts
   - PDF report export
   - Historical comparisons
   - More technical indicators
4. Deploy to production environment
5. Monitor real-world usage

---

**Happy Testing! 🚀**

For questions or issues, refer to:
- `IMPLEMENTATION_ROADMAP.md` - Feature implementation details
- `STOCK_REPORT_ENHANCEMENT.md` - Architecture documentation
- `DOCKER_DEPLOYMENT.md` - Deployment instructions
