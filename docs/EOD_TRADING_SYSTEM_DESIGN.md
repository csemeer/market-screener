# EOD Analysis & Next-Day Trading System - Design Document

## 🎯 System Overview

**Objective**: Professional-grade EOD analysis system that identifies high-probability trading setups for next-day execution with smart entry/exit management.

## 📊 Workflow

### Phase 1: After Market Close (EOD Analysis)
```
Market Close (3:30 PM IST / 4:00 PM EST)
    ↓
Fetch Today's EOD Data + Historical N Days
    ↓
Analyze Technical Patterns & Setups
    ↓
Score & Rank All Stocks (0-100)
    ↓
Generate Top N Watchlist for Tomorrow
    ↓
Save Watchlist with Entry/Exit Levels
    ↓
Send Alerts/Notifications
```

### Phase 2: Next Day Pre-Market
```
Pre-Market Open (8:00 AM)
    ↓
Load Today's Watchlist
    ↓
Update Stock Prices (Pre-market quotes)
    ↓
Recalculate Entry/Exit Levels
    ↓
Display Watchlist Dashboard
```

### Phase 3: Live Market Monitoring
```
Market Open
    ↓
Monitor Watchlist Stocks (Real-time)
    ↓
Detect Entry Signals (Breakout/Breakdown Confirmation)
    ↓
Alert User for Manual Entry OR Auto-Entry
    ↓
Track Position in Real-time
    ↓
Monitor Exit Conditions (Target/Stop Loss/Trailing Stop)
    ↓
Alert User for Exit OR Auto-Exit
    ↓
Record Trade Performance
```

## 🏗️ Architecture Components

### 1. EOD Scanner Service
**Runs**: Daily after market close (4:00 PM IST for NSE, 4:30 PM EST for NYSE)

**Responsibilities**:
- Fetch EOD data for all stocks in universe
- Analyze historical N days (configurable: 20, 50, 100 days)
- Apply technical analysis and pattern recognition
- Calculate setup quality scores
- Generate ranked watchlist

**Analysis Criteria**:
1. **Trend Analysis**
   - EMA alignment (9, 20, 50, 200)
   - ADX strength
   - Trend consistency

2. **Momentum Indicators**
   - RSI levels and divergence
   - MACD crossovers
   - Stochastic positioning

3. **Volume Analysis**
   - Volume trends
   - Accumulation/Distribution
   - Volume breakouts

4. **Chart Patterns**
   - Consolidation breakouts
   - Support/Resistance levels
   - Candlestick patterns

5. **Risk/Reward Setup**
   - Clear entry points
   - Defined stop loss
   - Target zones
   - R:R ratio > 2:1

**Scoring System (0-100)**:
```typescript
Score Breakdown:
- Trend Strength: 25 points
- Momentum: 20 points
- Volume Profile: 15 points
- Pattern Quality: 20 points
- Risk/Reward: 20 points

Top N Selection:
- Score > 70: High-probability setups
- Score 60-70: Good setups
- Score < 60: Excluded
```

### 2. Watchlist Management Service

**Database Schema**:
```sql
-- Daily Watchlists
CREATE TABLE watchlists (
  id INTEGER PRIMARY KEY,
  date DATE NOT NULL,
  exchange TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist Items (Stocks)
CREATE TABLE watchlist_stocks (
  id INTEGER PRIMARY KEY,
  watchlist_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  company_name TEXT,
  exchange TEXT NOT NULL,
  currency TEXT NOT NULL,

  -- Analysis Data
  setup_type TEXT NOT NULL, -- 'BREAKOUT', 'BREAKDOWN', 'PULLBACK', 'REVERSAL'
  timeframe TEXT NOT NULL, -- 'INTRADAY', 'SWING'
  score REAL NOT NULL, -- 0-100

  -- Entry Levels
  entry_price REAL NOT NULL,
  entry_trigger REAL, -- Price that confirms entry
  entry_condition TEXT, -- 'BREAK_ABOVE', 'BREAK_BELOW', 'PULLBACK_TO'

  -- Exit Levels
  stop_loss REAL NOT NULL,
  target_1 REAL NOT NULL,
  target_2 REAL,
  target_3 REAL,
  trailing_stop_percent REAL, -- e.g., 2.0 for 2%

  -- Risk Management
  risk_reward_ratio REAL NOT NULL,
  position_size_percent REAL, -- % of capital to allocate
  max_loss_amount REAL,

  -- Technical Data
  technical_data TEXT, -- JSON: indicators, patterns, etc.
  chart_image_url TEXT,

  -- Status
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'TRIGGERED', 'ENTERED', 'EXITED', 'CANCELLED'
  triggered_at TIMESTAMP,

  -- Notes
  setup_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (watchlist_id) REFERENCES watchlists(id)
);

-- Trade Executions (When watchlist stocks are traded)
CREATE TABLE trades (
  id INTEGER PRIMARY KEY,
  watchlist_stock_id INTEGER NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  currency TEXT NOT NULL,

  -- Entry
  entry_date TIMESTAMP NOT NULL,
  entry_price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  entry_notes TEXT,

  -- Exit
  exit_date TIMESTAMP,
  exit_price REAL,
  exit_reason TEXT, -- 'TARGET_1', 'TARGET_2', 'STOP_LOSS', 'TRAILING_STOP', 'MANUAL'
  exit_notes TEXT,

  -- P&L
  gross_pnl REAL,
  net_pnl REAL, -- After fees/taxes
  pnl_percent REAL,
  fees REAL,

  -- Performance
  holding_duration_minutes INTEGER,
  max_favorable_excursion REAL, -- MFE
  max_adverse_excursion REAL, -- MAE

  -- Status
  status TEXT NOT NULL, -- 'OPEN', 'CLOSED'

  FOREIGN KEY (watchlist_stock_id) REFERENCES watchlist_stocks(id)
);

-- Position Tracking (Real-time open positions)
CREATE TABLE positions (
  id INTEGER PRIMARY KEY,
  trade_id INTEGER NOT NULL UNIQUE,
  symbol TEXT NOT NULL,
  current_price REAL NOT NULL,
  unrealized_pnl REAL NOT NULL,
  trailing_stop_price REAL,
  last_updated TIMESTAMP NOT NULL,

  FOREIGN KEY (trade_id) REFERENCES trades(id)
);
```

### 3. Live Monitoring Service

**Runs**: During market hours, monitors watchlist stocks

**Features**:
1. **Real-time Price Updates** (every 5-30 seconds)
2. **Entry Signal Detection**
   - Breakout confirmation (volume + price)
   - Pullback completion
   - Reversal confirmation
3. **Position Monitoring** (for entered trades)
   - Current P&L
   - Distance to targets/stop
   - Trailing stop adjustment
4. **Alert Generation**
   - Entry triggers
   - Target hits
   - Stop loss alerts
   - Trailing stop updates

### 4. Entry Signal Detection

**Confirmation Criteria**:

**Breakout Entry**:
```typescript
Conditions:
1. Price closes above entry_trigger
2. Volume > 1.5x average volume
3. Candle body > 50% of range (not a wick)
4. RSI not overbought (< 80)
5. MACD confirms momentum
6. Time: First 2 hours OR last hour of trading

Confirmation Score:
- All 6 conditions: HIGH confidence → Enter full position
- 4-5 conditions: MEDIUM confidence → Enter 50% position
- < 4 conditions: LOW confidence → Skip or wait
```

**Breakdown Entry** (Short/Put):
```typescript
Same as breakout but inverted
- Price closes below entry_trigger
- Volume confirmation
- RSI not oversold (> 20)
- Bearish momentum
```

**Pullback Entry**:
```typescript
Conditions:
1. Price pulls back to support/EMA
2. RSI bounces from oversold (< 40)
3. MACD shows divergence
4. Volume decreases on pullback
5. Price holds above stop loss
6. Reversal candle forms (hammer, engulfing)
```

### 5. Intelligent Exit Strategy

**Multi-Tier Exit System**:

**Target-Based Exits**:
```typescript
Target 1 (30-40% of position):
- Conservative target (1-2% gain)
- Lock in quick profits
- Reduce risk to zero (move SL to entry)

Target 2 (30-40% of position):
- Medium target (2-4% gain)
- Secure majority of profit

Target 3 (20-30% of position):
- Extended target (5-10% gain)
- Let winners run
- Use trailing stop
```

**Trailing Stop Logic**:
```typescript
Activation:
- When price reaches Target 1
- Or profit > 1.5%

Trailing Distance:
- Intraday: 0.8-1.5% from peak
- Swing: 2-4% from peak

Adjustment:
- Update every price update
- Only move upward (never down)
- Lock in profits progressively

Example:
Entry: $100
Current: $103 (3% profit)
Trailing Stop: $101.50 (1.5% below peak)
If price drops to $101.50 → EXIT
```

**Stop Loss Management**:
```typescript
Initial Stop:
- Based on support/resistance
- Or fixed % (1-2% intraday, 3-5% swing)

Dynamic Stops:
- Time-based: Tighten stop after 2 hours (intraday)
- Breakeven stop: Move to entry after Target 1 hit
- Trailing stop: Activate after profit threshold
```

### 6. Performance Analytics

**Track Metrics**:
1. **Watchlist Accuracy**
   - % of watchlist stocks triggered
   - % of triggered stocks profitable
   - Average score vs profit correlation

2. **Trade Performance**
   - Win rate
   - Profit factor
   - Average R:R achieved
   - Expectancy

3. **Setup Analysis**
   - Best performing setup types
   - Best timeframes
   - Best exchanges/sectors

## 🎨 Frontend - EOD Dashboard

### Daily Workflow UI

**1. EOD Analysis View** (After market close)
```
┌─────────────────────────────────────────────┐
│ EOD Scanner - Market Closed                │
├─────────────────────────────────────────────┤
│ [Run EOD Analysis] [View Previous Results] │
│                                             │
│ Status: ✓ Analyzed 500 stocks              │
│ Top Setups Found: 23 stocks                │
│                                             │
│ ┌─ Top Setups (Score > 70) ─────────────┐ │
│ │ 1. AAPL - $182.50 - Score: 87          │ │
│ │    Breakout Setup - R:R 3.2:1          │ │
│ │    Entry: $183.00 | SL: $181.00        │ │
│ │    Target: $189.00                      │ │
│ │    [Add to Watchlist] [View Chart]     │ │
│ │                                         │ │
│ │ 2. TSLA - $245.30 - Score: 82          │ │
│ │    ...                                  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**2. Tomorrow's Watchlist View** (Pre-market / Market hours)
```
┌─────────────────────────────────────────────┐
│ Today's Watchlist - 15 Stocks               │
├─────────────────────────────────────────────┤
│ [Refresh Prices] [Edit Watchlist]          │
│                                             │
│ ┌─ Active Setups ────────────────────────┐ │
│ │ AAPL - $183.20 ↑ +0.38%                │ │
│ │ Entry: $183.00 ✓ TRIGGERED!            │ │
│ │ Current: $183.20 | SL: $181.00         │ │
│ │ Target: $189.00 (3.2% away)            │ │
│ │ [Enter Trade] [Skip]                   │ │
│ │                                         │ │
│ │ TSLA - $244.80 ↓ -0.20%                │ │
│ │ Entry: $246.00 (waiting...)            │ │
│ │ [View Details] [Remove]                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─ Open Positions (2) ───────────────────┐ │
│ │ NVDA - Entry: $500 | Now: $508 (+1.6%) │ │
│ │ Trailing Stop: $505.50                 │ │
│ │ [Exit Now] [Adjust Stop]               │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## 🚀 Implementation Priority

### Phase 1: Core Infrastructure (Week 1)
- [ ] Database schema creation
- [ ] EOD Scanner Service
- [ ] Watchlist Management Service
- [ ] Basic frontend dashboard

### Phase 2: Live Monitoring (Week 2)
- [ ] Real-time monitoring service
- [ ] Entry signal detection
- [ ] Alert system
- [ ] Position tracking

### Phase 3: Exit Strategy (Week 3)
- [ ] Trailing stop logic
- [ ] Target management
- [ ] Trade execution tracking
- [ ] P&L calculation

### Phase 4: Analytics (Week 4)
- [ ] Performance metrics
- [ ] Setup analysis
- [ ] Reporting dashboard
- [ ] Optimization based on results

## 💡 Key Advantages

1. **Professional-Grade**: Institutional-quality analysis
2. **Data-Driven**: Scores based on proven technical criteria
3. **Risk-Managed**: Clear stops, targets, position sizing
4. **Automated**: Reduces emotional decision-making
5. **Scalable**: Can analyze thousands of stocks daily
6. **Mobile-Friendly**: Monitor and trade from anywhere
7. **Free Data**: Uses Yahoo Finance (no API costs)
8. **Multi-Market**: Supports US and Indian markets

## 📈 Expected Outcomes

**Trading Efficiency**:
- Save 2-3 hours daily on stock research
- Focus only on highest-probability setups
- Clear entry/exit rules eliminate guesswork

**Performance**:
- Higher win rate (target 65-70%)
- Better R:R ratios (target 2.5:1)
- Consistent profitability through process

**Learning**:
- Track what works and what doesn't
- Refine criteria based on results
- Continuous improvement through data

---

**Next Steps**: Review and approve this design, then proceed with implementation.
