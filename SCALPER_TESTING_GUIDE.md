# Auto-Scalper End-to-End Testing Guide

## 🎯 Overview

This guide walks you through testing the complete Auto-Scalper system from backend API to frontend UI.

## ✅ Prerequisites

1. **Backend running**: `cd backend && npm run dev`
2. **Frontend running**: `npm run dev` (from frontend directory)
3. **Demo data seeded**: See "Setup Demo Data" below

---

## 🗄️ Setup Demo Data

### Initialize Database Tables

```bash
cd backend
npx ts-node scripts/init-database.ts
```

**Expected Output:**
```
🗄️  Initializing database...
✅ Database initialized successfully!
```

### Seed Demo Scalper

```bash
npx ts-node scripts/seed-scalper-demo.ts
```

**Expected Output:**
```
🌱 Seeding demo Auto-Scalper configuration...
✓ Created Demo Scalper (id: 1)
📊 Adding stocks to watchlist...
📈 Creating sample trade history...
✅ Demo scalper setup complete!
```

This creates:
- 1 Demo Scalper configuration
- 5 Stocks in watchlist (RELIANCE, TCS, INFY, HDFCBANK, ICICIBANK)
- 3 Sample trades with P&L data

---

## 🔧 API Endpoint Testing

### 1. Get All Scalper Configurations

```bash
curl http://localhost:3001/api/scalper/configs | jq
```

**Expected Response:**
```json
{
  "success": true,
  "configs": [
    {
      "id": 1,
      "name": "Demo Scalper 1",
      "enabled": true,
      "broker": "zerodha",
      "accountId": "DEMO_ACCOUNT_123",
      "autoTrade": true
      // ... more config fields
    }
  ],
  "total": 1
}
```

### 2. Get Specific Scalper

```bash
curl http://localhost:3001/api/scalper/1 | jq
```

**Expected Response:**
```json
{
  "success": true,
  "config": { /* scalper config */ },
  "status": {
    "running": false,
    "startTime": null,
    "stocks": 5,
    "openTrades": 0,
    "dailyStats": { /* stats */ }
  }
}
```

### 3. Get Scalper Stocks

```bash
curl http://localhost:3001/api/scalper/1/stocks | jq
```

**Expected Response:**
```json
{
  "success": true,
  "stocks": [
    {
      "id": 1,
      "symbol": "RELIANCE",
      "exchange": "NSE",
      "active": true,
      "totalTrades": 1,
      "winningTrades": 1,
      "totalPnL": 175.00,
      "winRate": 100.0
    }
    // ... 4 more stocks
  ],
  "total": 5
}
```

### 4. Get Trade History

```bash
# All trades
curl http://localhost:3001/api/scalper/1/trades | jq

# Only open trades
curl http://localhost:3001/api/scalper/1/trades?status=OPEN | jq

# Only closed trades
curl http://localhost:3001/api/scalper/1/trades?status=CLOSED | jq
```

**Expected Response:**
```json
{
  "success": true,
  "trades": [
    {
      "id": 1,
      "symbol": "RELIANCE",
      "exchange": "NSE",
      "side": "BUY",
      "quantity": 10,
      "entryPrice": 2450.50,
      "exitPrice": 2468.25,
      "stopLoss": 2443.15,
      "target": 2467.65,
      "status": "CLOSED",
      "closeReason": "TARGET_HIT",
      "grossPnL": 177.50,
      "netPnL": 175.00,
      "pnlPercent": 0.72
    }
    // ... more trades
  ],
  "total": 3
}
```

### 5. Add Stock to Watchlist

```bash
curl -X POST http://localhost:3001/api/scalper/1/add-stock \
  -H "Content-Type: application/json" \
  -d '{"symbol": "WIPRO", "exchange": "NSE"}' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "stockId": 6,
  "message": "WIPRO added to scalper 1"
}
```

### 6. Start Scalper

```bash
curl -X POST http://localhost:3001/api/scalper/1/start | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Scalper 1 started successfully"
}
```

**What Happens:**
- ✅ Broker connection established (Paper Trading mode)
- ✅ Subscribes to live ticks for all stocks
- ✅ Starts monitoring loop (runs every 1 second)
- ✅ Begins watching for entry/exit signals

### 7. Check Running Status

```bash
curl http://localhost:3001/api/scalper/1/status | jq
```

**Expected Response (when running):**
```json
{
  "success": true,
  "status": {
    "running": true,
    "startTime": "2026-01-02T13:30:00.000Z",
    "stocks": 6,
    "openTrades": 0,
    "dailyStats": {
      "trades": 0,
      "pnl": 0,
      "wins": 0,
      "losses": 0
    }
  }
}
```

### 8. Get Open Positions

```bash
curl http://localhost:3001/api/scalper/1/positions | jq
```

**Expected Response:**
```json
{
  "success": true,
  "positions": [
    // Array of open positions (empty initially in paper mode)
  ],
  "total": 0
}
```

### 9. Stop Scalper

```bash
curl -X POST http://localhost:3001/api/scalper/1/stop | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Scalper 1 stopped successfully"
}
```

### 10. Emergency Stop All

```bash
curl -X POST http://localhost:3001/api/scalper/emergency-stop | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All scalpers stopped and positions closed"
}
```

### 11. Remove Stock from Watchlist

```bash
curl -X DELETE http://localhost:3001/api/scalper/1/stocks/6 | jq
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Stock removed from scalper 1"
}
```

---

## 🖥️ Frontend UI Testing

### 1. Access Dashboard

```
URL: http://localhost:5173/scalper
```

**Expected:**
- Navigation menu shows "Auto-Scalper" link
- Dashboard loads with scalper selector
- Stats cards show: Status, Daily P&L, Open Positions

### 2. Scalper Selector

**Test:**
1. Click on "Demo Scalper 1" in the left panel
2. Verify scalper details load

**Expected:**
- Scalper name and broker displayed
- Status card shows "STOPPED" initially
- Daily P&L shows ₹0.00
- Open Positions shows 0

### 3. Configuration Tab

**Test:**
1. Click "Configuration" tab
2. Review settings
3. Add new stock (e.g., "WIPRO", "NSE")
4. Click "Add Stock" button

**Expected:**
- All configuration fields displayed (read-only)
- Stock watchlist shows 5 stocks
- Each stock shows trades, win rate, P&L
- New stock appears in list after adding
- Success alert: "✅ WIPRO added successfully"

### 4. Start/Stop Controls

**Test:**
1. Click "Start Scalper" button
2. Wait 2 seconds (auto-refresh)
3. Click "Stop Scalper" button

**Expected:**
- Start button becomes disabled, Stop button enabled
- Status card changes to "RUNNING" (green)
- Start time displayed
- Console logs show monitoring activity
- After stop: Status back to "STOPPED"

### 5. Trade History Tab

**Test:**
1. Click "Trade History" tab
2. Toggle filter buttons (All / Open / Closed)

**Expected:**
- Statistics cards show: 3 Total Trades, 2 Wins, 1 Loss, 66.7% Win Rate
- Total P&L: ₹290.00 (green)
- Table shows 3 trades:
  - RELIANCE: +₹175.00 (TARGET_HIT) - Green
  - TCS: -₹39.00 (STOP_LOSS) - Red
  - INFY: +₹154.00 (TARGET_HIT) - Green
- Filter "CLOSED" shows all 3 trades
- Filter "OPEN" shows 0 trades

### 6. Positions Tab

**Test:**
1. Click "Positions" tab
2. Observe empty state

**Expected:**
- Shows "No Open Positions" message
- "Positions will appear here when the scalper enters trades"
- Live update indicator: "🟢 Live updates • Refreshing every 2 seconds"

### 7. Live Charts Tab

**Test:**
1. Click "Live Charts" tab
2. Select different stocks from the button group

**Expected:**
- Stock selector shows all 5 stocks
- Clicking stock loads candlestick chart
- Chart shows 5-minute intervals
- Trade markers visible on chart:
  - **Entry arrows** (up) for buy points
  - **Stop-loss circles** (red)
  - **Target circles** (green)
  - **Exit arrows** (down) for sell points
- Trade list below chart shows trades for selected stock
- Chart legend shows color coding

### 8. Emergency Stop

**Test:**
1. Start a scalper
2. Click "EMERGENCY STOP ALL" button
3. Confirm the alert

**Expected:**
- Confirmation dialog: "⚠️ Are you sure..."
- All scalpers stop immediately
- Alert: "✅ All scalpers stopped and positions closed"
- All status cards update to "STOPPED"

### 9. Real-Time Updates

**Test:**
1. Start scalper
2. Leave dashboard open for 30 seconds
3. Observe auto-refresh

**Expected:**
- Position monitor refreshes every 2 seconds
- Status updates automatically
- No page reload required
- Smooth data updates

### 10. Multiple Scalpers

**Test (via API):**
1. Create second scalper:
```bash
curl -X POST http://localhost:3001/api/scalper/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Scalper 2",
    "broker": "upstox",
    "accountId": "TEST_002"
  }' | jq
```
2. Refresh dashboard
3. Switch between scalpers

**Expected:**
- Both scalpers appear in left panel
- Clicking switches active scalper
- Each scalper has independent status/data
- All tabs update with selected scalper's data

---

## ✅ Validation Checklist

### Backend API
- [ ] All 11 endpoints respond correctly
- [ ] Error handling works (try invalid IDs)
- [ ] Database queries execute successfully
- [ ] Paper trading mode active
- [ ] Broker service initialized

### Frontend UI
- [ ] All 5 tabs render without errors
- [ ] Navigation between tabs smooth
- [ ] Real-time updates working
- [ ] Add/remove stocks functional
- [ ] Start/stop controls working
- [ ] Trade history displays correctly
- [ ] Charts render with markers
- [ ] Emergency stop executes
- [ ] No console errors
- [ ] Responsive on mobile

### Data Flow
- [ ] Frontend fetches data from API
- [ ] API queries database correctly
- [ ] Service methods return expected data
- [ ] Real-time polling updates UI
- [ ] State management working

### Error Handling
- [ ] Invalid scalper ID returns 404
- [ ] Missing required fields return 400
- [ ] Database errors return 500
- [ ] Frontend shows error alerts
- [ ] Empty states display properly

---

## 🐛 Common Issues & Solutions

### Issue: "No scalpers configured"
**Solution:** Run seed script: `npx ts-node scripts/seed-scalper-demo.ts`

### Issue: "Scalper not found"
**Solution:** Check database has data, restart backend

### Issue: Charts not rendering
**Solution:**
1. Check browser console for errors
2. Verify lightweight-charts installed
3. Check historical data API returns data

### Issue: Real-time updates not working
**Solution:**
1. Verify scalper is started
2. Check API polling interval (2 seconds)
3. Look for errors in browser console

### Issue: "Table doesn't exist" error
**Solution:** Run: `npx ts-node scripts/init-database.ts`

---

## 📊 Expected Results Summary

After completing all tests, you should see:

**Backend:**
- ✅ 11/11 API endpoints working
- ✅ Demo scalper created (ID: 1)
- ✅ 5 stocks in watchlist
- ✅ 3 historical trades
- ✅ Paper trading mode active

**Frontend:**
- ✅ Dashboard accessible at /scalper
- ✅ All 5 tabs functional
- ✅ Real-time updates every 2 seconds
- ✅ Charts render with trade markers
- ✅ Start/stop controls work
- ✅ Trade history displays correctly
- ✅ No TypeScript/runtime errors

**Performance:**
- ✅ API response time < 100ms
- ✅ Charts render in < 1 second
- ✅ No memory leaks
- ✅ Smooth UI interactions

---

## 🚀 Next Steps

Once testing is complete:

1. **Test with real data** - Run longer, generate more trades
2. **Stress test** - Multiple scalpers, many stocks
3. **Real broker integration** - Connect Zerodha/Upstox API
4. **Live data streams** - Replace mock data with WebSocket
5. **Strategy implementation** - Add real signal generation
6. **Performance optimization** - Tune polling intervals
7. **User authentication** - Add user management
8. **Production deployment** - Deploy to server

---

## 📝 Test Report Template

```
Date: ___________
Tester: ___________

Backend API Tests: ___/11 passed
Frontend UI Tests: ___/10 passed
Data Flow Tests: ___/5 passed
Error Handling: ___/5 passed

Issues Found:
1.
2.
3.

Notes:


Status: ☐ All Tests Passed  ☐ Issues Found  ☐ Blocked
```

---

**Happy Testing! 🎉**

For issues or questions, check:
- `SCALPER_USER_GUIDE.md` - User documentation
- `SCALPER_IMPLEMENTATION_PLAN.md` - Technical architecture
- Backend logs in console
- Frontend console for errors
