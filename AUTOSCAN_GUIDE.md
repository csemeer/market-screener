# 🤖 Auto-Scan System - Complete Guide

## Overview

The Auto-Scan System is a **professional-grade automated stock scanning engine** that continuously monitors markets and identifies trading opportunities based on pre-configured intraday and swing trading strategies. It eliminates the need for manual scanning and delivers real-time signals directly to your dashboard.

---

## 🎯 Key Features

### 1. **Automated Periodic Scanning**
- Runs 24/7 during configured intervals
- Market hours detection (9:15 AM - 3:30 PM IST for NSE/BSE)
- Configurable scan frequencies (2-120 minutes)
- Background job execution with node-cron

### 2. **9 Pre-Configured Strategies**

#### Intraday Strategies (4)
1. **Momentum Breakout** - High volume breakouts with strong RSI (scans every 5 min)
2. **Quick Scalping Setup** - 1-5 minute scalps on volatile stocks (scans every 2 min)
3. **Gap Reversal** - Gap fill opportunities with reversal signals (scans every 15 min)
4. **VWAP Bounce** - Price bouncing off VWAP with volume (scans every 5 min)

#### Swing Trading Strategies (5)
1. **Trend Following** - Multi-day trend rides with EMA alignment (scans every 60 min)
2. **Support Bounce** - Buying at key support levels (scans every 30 min)
3. **Consolidation Breakout** - Multi-week breakouts (scans every 60 min)
4. **Pullback Entry** - Trend pullback entries (scans every 30 min)
5. **Earnings Momentum** - Post-earnings momentum plays (scans every 120 min)

### 3. **SQLite Database Storage**
- Persistent scan results
- Alert notifications
- Performance tracking
- Historical signal analysis

### 4. **Smart Dashboard UI**
- Real-time results grouped by strategy
- Evidence charts with technical indicators
- Performance metrics (Win rate, P&L, Signal count)
- Alert notifications
- Auto-refresh (2-minute intervals)

### 5. **Intelligent Alert System**
- New high-confidence signals (80+ score)
- Target hit notifications
- Stop loss hit notifications
- Configurable priority levels

---

## 📁 Architecture

```
Backend:
├── services/
│   ├── databaseService.ts      # SQLite database management
│   ├── autoScanService.ts      # Scheduler & strategy execution
│   └── screenerService.ts      # Core screening logic
├── routes/
│   └── dashboardRoutes.ts      # Dashboard API endpoints
└── data/
    └── autoscan.db             # SQLite database file

Frontend:
├── pages/
│   └── AutoScanDashboard.tsx   # Main dashboard UI
├── components/
│   └── StockEvidenceChart.tsx  # Chart visualization
└── api/
    └── client.ts               # Dashboard API client
```

---

## 🚀 Setup & Installation

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install better-sqlite3 uuid node-cron
   ```

2. **Database Initialization**
   The database is automatically created on first startup at:
   ```
   backend/data/autoscan.db
   ```

3. **Start Backend**
   ```bash
   npm run dev
   ```

   You should see:
   ```
   ✅ Auto-Scan Service initialized successfully
   📊 Scheduled INTRADAY_MOMENTUM_BREAKOUT (every 5 minutes)
   📊 Scheduled INTRADAY_SCALPING_SETUP (every 2 minutes)
   ...
   ```

### Frontend Setup

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install lightweight-charts
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

3. **Access Dashboard**
   Navigate to: `http://localhost:3000/autoscan`

---

## 🎛️ Strategy Configuration

Each strategy has fine-tuned parameters:

```typescript
{
  name: 'Intraday Momentum Breakout',
  scanInterval: 5,              // minutes
  markets: ['NSE', 'BSE'],
  criteria: {
    rsiMin: 60,
    rsiMax: 85,
    volumeMultiplier: 2.0,       // 2x average volume
    adxMin: 25,
    priceAboveEMA20: true,
    macdBullish: true,
  },
  minConfidenceScore: 70,
  stopLossPercent: 1.5,
  targetPercent: 3.0,
  enabled: true,
}
```

---

## 📊 Database Schema

### Scan Results Table
```sql
CREATE TABLE scan_results (
  id INTEGER PRIMARY KEY,
  scan_id TEXT,
  timestamp DATETIME,
  strategy TEXT,
  strategy_type TEXT,         -- INTRADAY | SWING | LONG_TERM
  symbol TEXT,
  exchange TEXT,
  current_price REAL,
  entry_price REAL,
  stop_loss REAL,
  target REAL,
  risk_reward_ratio REAL,
  confidence_score REAL,
  signals TEXT,               -- JSON
  technical_data TEXT,        -- JSON
  evidence_chart_data TEXT,   -- JSON
  status TEXT,                -- ACTIVE | HIT_TARGET | HIT_STOPLOSS | EXPIRED
  outcome TEXT,               -- WIN | LOSS | BREAKEVEN | PENDING
  profit_loss REAL,
  exit_price REAL,
  exit_date DATETIME
);
```

### Alerts Table
```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  timestamp DATETIME,
  symbol TEXT,
  exchange TEXT,
  strategy TEXT,
  alert_type TEXT,            -- NEW_SIGNAL | TARGET_HIT | STOPLOSS_HIT
  message TEXT,
  priority TEXT,              -- HIGH | MEDIUM | LOW
  read BOOLEAN,
  scan_result_id INTEGER
);
```

---

## 🔌 API Endpoints

### Get Scan Results (Grouped by Strategy)
```
GET /api/dashboard/scan-results?hours=24&type=INTRADAY
```

Response:
```json
{
  "success": true,
  "totalStrategies": 9,
  "totalSignals": 47,
  "results": {
    "Intraday Momentum Breakout": [
      {
        "id": 1,
        "symbol": "RELIANCE",
        "exchange": "NSE",
        "entry_price": 2450.50,
        "target": 2523.50,
        "stop_loss": 2414.00,
        "confidence_score": 85,
        ...
      }
    ]
  },
  "performance": {
    "Intraday Momentum Breakout": {
      "totalSignals": 47,
      "winRate": 68.5,
      "totalProfit": 12.34
    }
  }
}
```

### Get Active Signals
```
GET /api/dashboard/active-signals
```

### Get Alerts
```
GET /api/dashboard/alerts?hours=24&unreadOnly=true
```

### Trigger Manual Scan
```
POST /api/dashboard/scan-now
```

### Get Performance Stats
```
GET /api/dashboard/performance?days=30
```

---

## 🎨 Dashboard Features

### 1. Strategy Cards
Each strategy displays:
- Number of active signals
- Historical win rate
- Total P&L
- Strategy type (INTRADAY/SWING)
- Expandable stock list

### 2. Stock Signal Cards
Each stock shows:
- Symbol & Company Name
- Confidence Score (color-coded)
- Entry, Target, Stop Loss prices
- Profit Potential %
- Risk:Reward Ratio
- Active signals (RSI bullish, MACD cross, etc.)

### 3. Evidence Charts
Click any stock to see:
- Candlestick price chart
- EMA indicators (20, 50, 200)
- Entry/Target/Stop Loss levels
- RSI, MACD, ADX values
- Buy signals with checkmarks
- Timestamp of signal generation

### 4. Alert Notifications
- Real-time alert panel
- Priority-based color coding
- Mark as read functionality
- Filter by time range

### 5. Auto-Refresh
- Toggle auto-refresh ON/OFF
- 2-minute refresh interval
- Manual refresh button
- Last updated timestamp

---

## ⚙️ Configuration Options

### Enable/Disable Strategies

Edit `backend/src/services/autoScanService.ts`:

```typescript
export const INTRADAY_STRATEGIES = {
  MOMENTUM_BREAKOUT: {
    // ... strategy config
    enabled: true,  // ← Set to false to disable
  },
};
```

### Change Scan Intervals

```typescript
scanInterval: 5,  // ← Change to desired minutes
```

### Adjust Confidence Thresholds

```typescript
minConfidenceScore: 70,  // ← Minimum score to save results
```

### Change Markets

```typescript
markets: ['NSE', 'BSE'],  // ← Add/remove markets
```

---

## 📈 Performance Tracking

The system automatically tracks:

1. **Win Rate** - Percentage of signals that hit targets
2. **Average Return** - Mean profit/loss across all signals
3. **Total Profit** - Cumulative P&L
4. **Active vs Completed** - Signal status breakdown

### Auto-Update Mechanism

Every 15 minutes, the system:
1. Checks current prices for all active signals
2. Updates status if target/stop loss hit
3. Calculates profit/loss
4. Creates alert notifications
5. Archives completed signals

---

## 🔔 Alert Types

### 1. New Signal (Priority: MEDIUM/HIGH)
Triggered when:
- New signal with confidence score ≥ 60
- High priority if score ≥ 80

### 2. Target Hit (Priority: HIGH)
Triggered when:
- Current price ≥ target price
- Auto-marks signal as WIN

### 3. Stop Loss Hit (Priority: HIGH)
Triggered when:
- Current price ≤ stop loss price
- Auto-marks signal as LOSS

---

## 🧪 Testing

### Manual Test Scan
```bash
curl -X POST http://localhost:3001/api/dashboard/scan-now
```

### Check Database
```bash
sqlite3 backend/data/autoscan.db
.tables
SELECT * FROM scan_results LIMIT 5;
SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 5;
```

### View Logs
Backend logs show each scan execution:
```
INFO: Starting auto-scan for INTRADAY_MOMENTUM_BREAKOUT
INFO: Scan completed - 12 results found
INFO: Stored 5 high-confidence signals
```

---

## 🚨 Troubleshooting

### Issue: No signals appearing

**Check:**
1. Backend server running?
2. Auto-scan initialized? (check logs)
3. Market hours? (intraday strategies only run 9:15-3:30 IST)
4. Database created? (`backend/data/autoscan.db`)

**Solution:**
```bash
# Trigger manual scan
curl -X POST http://localhost:3001/api/dashboard/scan-now

# Check database
sqlite3 backend/data/autoscan.db "SELECT COUNT(*) FROM scan_results;"
```

### Issue: Charts not displaying

**Check:**
1. `lightweight-charts` installed?
2. Historical price data available?
3. Browser console for errors?

**Solution:**
```bash
cd frontend
npm install lightweight-charts
```

### Issue: Database locked error

**Solution:**
SQLite has WAL mode enabled. If locked:
```bash
cd backend/data
sqlite3 autoscan.db "PRAGMA wal_checkpoint(FULL);"
```

---

## 🎯 Best Practices

### 1. **Monitor Performance**
- Review win rates weekly
- Disable underperforming strategies
- Adjust confidence thresholds based on results

### 2. **Manage Database Size**
- Run cleanup monthly:
  ```bash
  curl -X DELETE "http://localhost:3001/api/dashboard/cleanup?days=90"
  ```

### 3. **Alert Management**
- Mark alerts as read regularly
- Focus on HIGH priority alerts
- Review signal evidence before trading

### 4. **Strategy Optimization**
- Track which strategies perform best
- Adjust scan intervals based on signal quality
- Fine-tune technical criteria (RSI, MACD, etc.)

---

## 📝 Customization Guide

### Add Custom Strategy

1. **Define Strategy** in `autoScanService.ts`:

```typescript
export const SWING_STRATEGIES = {
  MY_CUSTOM_STRATEGY: {
    name: 'My Custom Strategy',
    description: 'Description here',
    type: 'SWING' as const,
    scanInterval: 30,
    markets: ['NSE'],
    criteria: {
      rsiMin: 40,
      rsiMax: 60,
      volumeMultiplier: 1.5,
      // ... your custom criteria
    },
    minConfidenceScore: 65,
    stopLossPercent: 3.0,
    targetPercent: 8.0,
    enabled: true,
  },
};
```

2. **Restart Backend**

The strategy will automatically:
- Be scheduled based on scanInterval
- Store results in database
- Appear on dashboard

### Customize Alert Conditions

Edit `autoScanService.ts`:

```typescript
// Change high-confidence threshold
if (scanResult.confidenceScore >= 85) {  // ← Adjust threshold
  const alert: Alert = {
    // ...
    priority: 'HIGH',
  };
}
```

---

## 🔮 Future Enhancements

Potential additions:
- WebSocket real-time updates
- Telegram/Email notifications
- Backtesting engine
- Strategy performance comparison charts
- Machine learning signal filtering
- Multi-timeframe analysis
- Custom strategy builder UI

---

## 📞 Support

For issues or questions:
1. Check backend logs
2. Inspect database with SQLite
3. Review browser console
4. Check network requests

---

## ⚠️ Disclaimer

This auto-scan system is for **educational and research purposes only**. Always:
- Do your own research
- Verify signals before trading
- Use proper risk management
- Never risk more than you can afford to lose
- Consider transaction costs and slippage

**Past performance does not guarantee future results.**

---

## 🎉 Summary

You now have a **professional automated stock scanning system** that:

✅ Runs 9 sophisticated strategies 24/7
✅ Stores all signals in a persistent database
✅ Tracks performance automatically
✅ Alerts you to high-confidence opportunities
✅ Provides visual evidence for each signal
✅ Updates in real-time with auto-refresh
✅ Monitors active positions for target/stop hits

**Start trading smarter, not harder!** 🚀
