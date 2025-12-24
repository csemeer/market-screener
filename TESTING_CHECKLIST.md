# Testing Checklist - Market Screener Pro
## Post-Deployment Verification

**Status:** Ready for Testing
**Frontend:** http://localhost:3000
**Backend:** http://localhost:3001
**Date:** December 24, 2025

---

## ✅ CRITICAL FIXES TO VERIFY

### 1. Quick Action Buttons (Dashboard → Screener)
- [ ] Open http://localhost:3000
- [ ] Click **"Momentum Stocks"** card
- [ ] Should navigate to Screener with:
  - ✓ RSI Range: 50-70
  - ✓ Volume Breakout: Checked
  - ✓ ADX Min: 25
  - ✓ "Momentum Stocks" preset highlighted
- [ ] Go back to Dashboard
- [ ] Click **"Value Opportunities"** card
- [ ] Should apply: P/E Max: 20, P/B Max: 3, ROE Min: 12, D/E Max: 1.0
- [ ] Go back to Dashboard
- [ ] Click **"Quality Growth"** card
- [ ] Should apply: ROE Min: 15, Revenue Growth Min: 15, EPS Growth Min: 15
- [ ] Go back to Dashboard
- [ ] Click **"Low Risk"** card
- [ ] Should apply: ROE Min: 15, D/E Max: 0.5, Profit Margin Min: 12

**Expected Result:** All 4 Quick Action buttons should navigate to Screener with filters pre-applied and preset highlighted.

---

## 📱 NAVIGATION TESTING

### Desktop Navigation
- [ ] Click **Dashboard** link → Should go to `/`
- [ ] Click **Screener** link → Should go to `/screener`
- [ ] Click **Intraday** link → Should go to `/intraday`
- [ ] Click **Swing** link → Should go to `/swing`
- [ ] Click **Risk Calc** link → Should go to `/risk-calculator`
- [ ] Click logo → Should return to Dashboard

### Mobile Navigation (Resize browser to <768px)
- [ ] Hamburger menu appears
- [ ] Click hamburger → Menu slides out
- [ ] Click Dashboard → Navigates and menu closes
- [ ] Click Screener → Navigates and menu closes
- [ ] Click X icon → Menu closes

---

## 🎯 SCREENER FUNCTIONALITY

### Preset Selection
- [ ] Open Screener page
- [ ] See all 7 presets:
  - Momentum Stocks
  - Value Opportunities
  - Quality Growth
  - Low Risk Quality
  - Oversold Bounce
  - Breakout Candidates
  - Strong Uptrend
- [ ] Click each preset → Filters should update
- [ ] Selected preset should have blue background/border

### Manual Filtering
- [ ] Uncheck all markets → Should see validation
- [ ] Select NSE only
- [ ] Set Price Range: Min 100, Max 500
- [ ] Set RSI Range: Min 40, Max 60
- [ ] Set Min ADX: 20
- [ ] Check Volume Breakout
- [ ] Click **"Run Screener"** → Should show results

### View Modes
- [ ] Click **Table** icon → Should show desktop table view
- [ ] Click **Cards** icon → Should show card view
- [ ] Verify both views show same data

---

## 📊 DATA TABLE TESTING

### Sorting
- [ ] Click **Symbol** header → Sort A-Z
- [ ] Click again → Sort Z-A
- [ ] Click again → No sort
- [ ] Test sorting on:
  - [ ] Price
  - [ ] Change %
  - [ ] Score
  - [ ] Confluence

### Filtering
- [ ] Type "REL" in Symbol search → Should filter symbols
- [ ] Set Min Score to 70 → Should filter low scores
- [ ] Select "Strong Buy" in Recommendation → Should filter
- [ ] Clear filters → Should show all results

### Pagination
- [ ] Set items per page to 5
- [ ] Click page 2 → Should show next 5 items
- [ ] Click page 3 → Should show next 5 items
- [ ] Set items per page to 20 → Should update

---

## 📈 DASHBOARD TESTING

### Stats Cards
- [ ] Verify 4 stat cards display:
  - Markets: 4 (NSE, BSE, NYSE, NASDAQ)
  - Live Signals: (number)
  - Strong Buys: (number)
  - Avg Confluence: (percentage)

### Signal Display
- [ ] **Top Intraday Signals** section shows:
  - [ ] Signal cards with BUY/SELL badges
  - [ ] Signal type (MOMENTUM, BREAKOUT, GAP)
  - [ ] Entry, SL, Target prices
  - [ ] Strength percentage
- [ ] **Top Swing Signals** section shows:
  - [ ] Signal cards with BUY/SELL badges
  - [ ] Trend indicator
  - [ ] Entry, SL, Target prices
  - [ ] Strength percentage

### CTA Section
- [ ] Click **"Launch Screener"** → Navigate to /screener
- [ ] Click **"View Intraday Signals"** → Navigate to /intraday

---

## 📉 INTRADAY SCANNER TESTING

### Market Selection
- [ ] Select NSE only → Should filter signals
- [ ] Select NYSE only → Should filter signals
- [ ] Select all markets → Should show all signals

### Filters
- [ ] Select "Buy Only" → Should show only BUY signals
- [ ] Select "Sell Only" → Should show only SELL signals
- [ ] Select "Momentum" → Should show only MOMENTUM type
- [ ] Select "Breakout" → Should show only BREAKOUT type
- [ ] Select "Gap" → Should show only GAP type

### Stats Display
- [ ] Total Signals count updates
- [ ] Buy Signals count (green)
- [ ] Sell Signals count (red)
- [ ] Avg Strength percentage

### Refresh
- [ ] Click **"Refresh Scan"** button
- [ ] Should show loading spinner
- [ ] Should update signals

---

## 📊 SWING SCANNER TESTING

### Market Selection
- [ ] Select different markets → Signals update
- [ ] Select all markets → Show all signals

### Strategy Filters
- [ ] Select "Trend Following" → Filter to trend signals
- [ ] Select "Support/Resistance" → Filter to S/R signals
- [ ] Select "Pattern Breakout" → Filter to pattern signals

### Stats Display
- [ ] Uptrends count (green)
- [ ] Downtrends count (red)
- [ ] Sideways count (yellow)

### Signal Cards
- [ ] Verify each signal shows:
  - [ ] Symbol, badge, type
  - [ ] Trend indicator
  - [ ] Entry, SL, Target
  - [ ] Risk:Reward ratio
  - [ ] Strength percentage

---

## 🧮 RISK CALCULATOR TESTING

### Input Fields
- [ ] Enter Account Size: 10000
- [ ] Enter Risk %: 2
- [ ] Enter Entry Price: 100
- [ ] Enter Stop Loss: 95
- [ ] Click **"Calculate Position Size"**

### Results Display
- [ ] Recommended Position Size: 40 shares
- [ ] Investment amount: $4,000
- [ ] Max Risk: $200
- [ ] Potential Profit: $400 (at 2:1 R:R)
- [ ] Trade breakdown shows all values

### Risk Warning
- [ ] Change Risk % to 4
- [ ] Should show yellow warning box
- [ ] Warning text about >3% risk

### Quick Reference Table
- [ ] Verify table shows risk amounts for:
  - $5,000 account
  - $10,000 account
  - $25,000 account
  - $50,000 account
  - $100,000 account

---

## 📂 CSV IMPORT/EXPORT TESTING

### Template Download
- [ ] Open Screener page
- [ ] Click **"Download CSV Template"**
- [ ] File downloads: `stock-upload-template.csv`
- [ ] Open file → Verify columns: symbol, exchange
- [ ] Verify sample data (RELIANCE, TCS, AAPL, MSFT)

### CSV Upload
- [ ] Create test CSV with 3-5 stocks
- [ ] Click **"Upload Stock List (CSV)"**
- [ ] Select your CSV file
- [ ] Should show "Successfully analyzed X stocks" alert
- [ ] Results should populate in table

### CSV Export
- [ ] Run a screener query with results
- [ ] Scroll to CSV section
- [ ] Click **"Export Results (X stocks)"** button
- [ ] File downloads: `screening-results-[timestamp].csv`
- [ ] Open file → Verify all columns present:
  - Symbol, Name, Exchange, Price, Change %
  - Technical Score, Confluence, Fundamental Score
  - RSI, MACD, ADX, Volume Ratio
  - P/E, P/B, ROE, D/E, Growth metrics

---

## 📱 MOBILE RESPONSIVENESS

### Resize Browser to Mobile (< 768px)
- [ ] **Dashboard**
  - [ ] Stats cards in 2 columns
  - [ ] Quick Action cards stack
  - [ ] CTA buttons stack vertically
  - [ ] Hamburger menu appears

- [ ] **Screener**
  - [ ] Filter panel full-width (not sticky)
  - [ ] View toggle shows icons only
  - [ ] Data shows as cards (not table)
  - [ ] Mobile pagination (prev/next only)

- [ ] **Data Table (Card View)**
  - [ ] Each stock in card format
  - [ ] Price and change % visible
  - [ ] Score, quality, recommendation badges
  - [ ] Key metrics grid (2 columns)

- [ ] **Intraday/Swing Scanners**
  - [ ] Signal cards full-width
  - [ ] Filters stack vertically
  - [ ] Stats cards in responsive grid

### Touch Targets
- [ ] All buttons easily tappable (44px min)
- [ ] No accidental clicks
- [ ] Mobile menu items well-spaced

---

## 🔍 ERROR HANDLING

### Empty States
- [ ] Screener with no results → "No results yet" message
- [ ] Filter that returns 0 stocks → "No stocks match your filters"
- [ ] Scanner with no signals → "No signals found"

### Loading States
- [ ] Screener "Run Screener" → Shows "Scanning..." button
- [ ] Intraday "Refresh Scan" → Shows spinner
- [ ] CSV upload → Shows "Uploading..." text

### Error States
- [ ] Upload non-CSV file → Should show error
- [ ] Upload empty CSV → Should show error
- [ ] Upload CSV with >100 stocks → Should show error

---

## 🎨 UI/UX VERIFICATION

### Visual Polish
- [ ] All gradients render smoothly
- [ ] Hover states on buttons work
- [ ] Active states show correct colors
- [ ] Badges have proper colors:
  - Strong Buy: Green
  - Buy: Light Green
  - Hold: Yellow
  - Sell: Red
  - Strong Sell: Dark Red

### Typography
- [ ] Headings clear and readable
- [ ] Body text not too small
- [ ] No text overflow/truncation issues

### Spacing
- [ ] Cards have consistent padding
- [ ] Sections well-separated
- [ ] No elements touching edges

---

## ⚡ PERFORMANCE

### Load Times
- [ ] Dashboard loads < 2 seconds
- [ ] Screener loads < 2 seconds
- [ ] Table sorting instant
- [ ] Filtering instant
- [ ] Pagination instant

### API Calls
- [ ] Dashboard makes 2 calls (intraday + swing)
- [ ] Screener makes 1 call (presets)
- [ ] Run Screener makes 1 call
- [ ] No unnecessary duplicate calls

---

## 🐛 KNOWN ISSUES TO CHECK

- [ ] URL parameters work correctly (Quick Actions)
- [ ] Preset selection highlights correctly
- [ ] No console errors in browser
- [ ] No React warnings in console
- [ ] Backend shows no errors
- [ ] All API endpoints respond

---

## ✅ FINAL VERIFICATION

### Critical Path Test (5 minutes)
1. [ ] Open app → Dashboard loads with stats
2. [ ] Click "Momentum Stocks" → Screener opens with filters
3. [ ] Click "Run Screener" → Results display in table
4. [ ] Click "Cards" view → Results show as cards
5. [ ] Search for "AAPL" → Filters to Apple
6. [ ] Click "Intraday" nav → Scanner shows signals
7. [ ] Click "Risk Calculator" → Calculator ready
8. [ ] Enter trade details → Position size calculates
9. [ ] Resize to mobile → Hamburger menu appears
10. [ ] Click menu → Navigation works

**If all above pass:** ✅ Application is production-ready!

---

## 📝 TESTING NOTES

**Tester:**
**Date:**
**Browser:** Chrome / Firefox / Safari / Edge
**Resolution:** Desktop / Tablet / Mobile

**Issues Found:**

1.

2.

3.

**Additional Comments:**



---

## 🚀 NEXT STEPS AFTER TESTING

If all tests pass:
- [ ] Create production build
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

If issues found:
- [ ] Document issues
- [ ] Prioritize by severity
- [ ] Fix critical issues
- [ ] Re-test
