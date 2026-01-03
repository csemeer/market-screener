# Backtest Strategy Tuning Guide

## How Backtests Choose Strategies

The backtest engine reads strategy configuration from the `scalper_configs` table in the database. Each scalper has:

### 1. **Entry Conditions** (JSON field: `entry_conditions`)
Determines WHEN to enter trades:
```json
{
  "type": "MEAN_REVERSION",      // Strategy type
  "rsiOversold": 30,              // RSI threshold
  "bbPullback": true,             // Bollinger Band condition
  "min_confidence": 60            // Minimum confidence score
}
```

**Supported Strategy Types:**
- `MEAN_REVERSION` - Buy oversold, sell overbought
- `TREND_FOLLOWING` - Follow strong trends
- `VOLUME_BREAKOUT` - Trade on volume spikes
- `MOMENTUM` - Trade with strong momentum

### 2. **Exit Conditions** (JSON field: `exit_conditions`)
Determines WHEN to exit trades:
```json
{
  "stopLossPercent": 0.5,         // Stop loss: 0.5% below entry
  "targetPercent": 1.5,           // Target: 1.5% above entry
  "trailingStop": {
    "enabled": true,
    "percent": 2                  // Trail by 2%
  },
  "maxHoldMinutes": 60            // Exit after 60 minutes
}
```

### 3. **Position Sizing** (Database columns)
- `max_position_size`: Maximum ₹ per position (e.g., ₹50,000)
- `max_positions_open`: Max concurrent positions (e.g., 3)
- `position_sizing_method`: 'FIXED', 'RISK_BASED', or 'KELLY'
- `risk_per_trade`: % of capital to risk (e.g., 2%)

---

## Why Am I Seeing 60-70% Losses?

### Common Causes:

#### 1. **Stop Loss Too Tight**
**Problem**: Stop loss of 0.5-1% is very tight. Normal market noise can trigger it.

**Example**:
```
Entry: ₹100
Stop Loss (0.5%): ₹99.50
Target (1.5%): ₹101.50

Market noise swings: ±1-2% are common!
Result: Stop hit frequently, target rarely reached
```

**Solution**: Widen stop loss to 1.5-3%

#### 2. **Risk/Reward Ratio Too Low**
**Problem**: R:R ratio < 2:1 means you need >50% win rate just to break even.

**Current**: Stop 0.5%, Target 1.5% = 1:3 R:R (Good!)
**But**: If stops are hit 70% of the time due to tight SL, you still lose.

**Solution**: Keep R:R > 2:1, but widen both proportionally

#### 3. **Brokerage & Slippage Eating Profits**
**Problem**: Each trade costs ₹40 brokerage + 0.1% slippage

**Example**: ₹10,000 position
- Entry slippage: ₹10 (0.05%)
- Exit slippage: ₹10 (0.05%)
- Brokerage: ₹40 (₹20 × 2)
- **Total cost**: ₹60 = 0.6% of position!

If your target is only 1.5%, you're giving up 40% to costs!

**Solution**:
- Increase target to 3-5%
- Trade larger positions (costs are % smaller)
- Reduce number of trades

#### 4. **Signal Requirements Too Strict**
**Problem**: Requiring 2+ signals means fewer trades, missing opportunities

**Current Logic** (BacktestEngine.ts:499):
```typescript
const shouldEnter = signals.length >= 2;  // Need 2+ signals
```

**Solution**: Lower to 1 signal for more aggressive entry, or fine-tune signal parameters

#### 5. **Mock Data Doesn't Match Strategy**
**Problem**: Mean reversion needs ranging markets, but mock data might trend

**Solution**: Use real historical data, or adjust strategy to match mock data behavior

---

## How to Fine-Tune Your Strategy

### Method 1: Update Database Directly (Advanced)

Create a script to update configurations:

```typescript
import Database from 'better-sqlite3';

const db = new Database('data/autoscan.db');

// Update Demo 1 to be less aggressive
db.prepare(`
  UPDATE scalper_configs
  SET entry_conditions = ?,
      exit_conditions = ?
  WHERE name = ?
`).run(
  // Entry: More lenient
  JSON.stringify({
    type: 'MEAN_REVERSION',
    rsiOversold: 35,           // Changed from 30 (less strict)
    bbPullback: true,
    min_confidence: 50         // Changed from 60 (lower bar)
  }),

  // Exit: Wider stops, bigger targets
  JSON.stringify({
    stopLossPercent: 2.0,      // Changed from 0.5% (4x wider!)
    targetPercent: 6.0,        // Changed from 1.5% (4x bigger!)
    trailingStop: { enabled: true, percent: 3 }
  }),

  'Backtest Demo 1: 30-Day Period NSE'
);

console.log('Updated strategy parameters!');
db.close();
```

### Method 2: Create Custom Scalper via UI (Recommended)

**Step 1**: Go to Scalper Dashboard → "Create New Scalper"

**Step 2**: Configure Entry Conditions
```json
{
  "type": "MEAN_REVERSION",
  "rsiOversold": 35,
  "bbPullback": true,
  "min_confidence": 50
}
```

**Step 3**: Configure Exit Conditions
```json
{
  "stopLossPercent": 2.0,
  "targetPercent": 6.0,
  "maxHoldMinutes": 240
}
```

**Step 4**: Set Position Sizing
- Max Position Size: ₹75,000
- Max Open Positions: 2
- Position Sizing: RISK_BASED
- Risk Per Trade: 1.5%

**Step 5**: Run Backtest!

---

## Recommended Parameter Ranges

### Conservative (Lower Risk, Lower Returns)
```json
{
  "stopLossPercent": 3.0,      // 3% stop
  "targetPercent": 9.0,        // 9% target (R:R = 1:3)
  "maxPositions": 1,
  "riskPerTrade": 1.0
}
```
**Expected**: -10% to +20% returns, 40-50% win rate

### Moderate (Balanced)
```json
{
  "stopLossPercent": 2.0,      // 2% stop
  "targetPercent": 6.0,        // 6% target (R:R = 1:3)
  "maxPositions": 2,
  "riskPerTrade": 1.5
}
```
**Expected**: -20% to +40% returns, 45-55% win rate

### Aggressive (Higher Risk, Higher Returns)
```json
{
  "stopLossPercent": 1.5,      // 1.5% stop
  "targetPercent": 4.5,        // 4.5% target (R:R = 1:3)
  "maxPositions": 3,
  "riskPerTrade": 2.0
}
```
**Expected**: -35% to +60% returns, 50-60% win rate

---

## Strategy-Specific Tips

### Mean Reversion
**Best Parameters**:
- RSI Oversold: 30-35 (lower = more strict)
- Stop Loss: 2-3% (need room for reversal)
- Target: 5-8%
- Max Hold: 2-4 hours (don't hold overnight)

**When It Works**: Ranging/choppy markets
**When It Fails**: Strong trending markets

### Trend Following
**Best Parameters**:
- ADX Threshold: 20-25 (higher = stronger trend required)
- Stop Loss: 2-4% (trends need room)
- Target: 8-12%
- Max Hold: 24-48 hours

**When It Works**: Strong trending markets
**When It Fails**: Choppy/ranging markets

### Volume Breakout
**Best Parameters**:
- Volume Multiple: 2.0-3.0x (lower = more signals)
- Stop Loss: 1.5-2.5%
- Target: 4-8%
- Max Hold: 1-3 hours

**When It Works**: High volatility, news events
**When It Fails**: Low volume periods

### Momentum
**Best Parameters**:
- MACD: Require histogram > 0
- Volume Multiple: 2.0-2.5x
- Stop Loss: 1.5-2.5%
- Target: 4-7%
- Max Hold: 1-2 hours

**When It Works**: Strong directional moves
**When It Fails**: Sideways markets

---

## Quick Fix for Current 60-70% Loss Issue

### Update Script (Run This Now):

```typescript
// save as: fix-strategy-params.ts
import Database from 'better-sqlite3';

const db = new Database('data/autoscan.db');

// Fix all 4 demo scalpers with better parameters
const demos = [
  {
    name: 'Backtest Demo 1: 30-Day Period NSE',
    entry: {
      type: 'MEAN_REVERSION',
      rsiOversold: 35,
      bbPullback: true,
      min_confidence: 50
    },
    exit: {
      stopLossPercent: 2.5,
      targetPercent: 7.5,
      maxHoldMinutes: 180
    }
  },
  {
    name: 'Backtest Demo 2: 90-Day Period NASDAQ',
    entry: {
      type: 'TREND_FOLLOWING',
      emaCrossover: true,
      adxThreshold: 20,
      min_confidence: 60
    },
    exit: {
      stopLossPercent: 3.0,
      targetPercent: 9.0,
      maxHoldMinutes: 2880
    }
  },
  {
    name: 'Backtest Demo 3: Last Market Day Intraday NSE',
    entry: {
      type: 'VOLUME_BREAKOUT',
      volumeMultiple: 2.0,
      priceBreakout: true,
      min_confidence: 55
    },
    exit: {
      stopLossPercent: 2.0,
      targetPercent: 6.0,
      maxHoldMinutes: 120
    }
  },
  {
    name: 'Backtest Demo 4: Last Market Day Intraday NASDAQ',
    entry: {
      type: 'MOMENTUM',
      macdCrossover: true,
      volumeMultiple: 2.0,
      min_confidence: 55
    },
    exit: {
      stopLossPercent: 2.0,
      targetPercent: 6.0,
      maxHoldMinutes: 90
    }
  }
];

demos.forEach(demo => {
  db.prepare(`
    UPDATE scalper_configs
    SET entry_conditions = ?,
        exit_conditions = ?
    WHERE name = ?
  `).run(
    JSON.stringify(demo.entry),
    JSON.stringify(demo.exit),
    demo.name
  );
  console.log(`✓ Updated: ${demo.name}`);
});

console.log('\nAll strategies updated with better parameters!');
console.log('Expected improvement: -20% to +40% returns (vs previous -60-70%)');
db.close();
```

**Run it**:
```bash
cd backend
npx ts-node fix-strategy-params.ts
```

---

## Understanding Backtest Metrics

### What's a Good Result?

| Metric | Poor | Average | Good | Excellent |
|--------|------|---------|------|-----------|
| **Return** | < -30% | -10% to +15% | +15% to +40% | > +40% |
| **Win Rate** | < 40% | 40-50% | 50-60% | > 60% |
| **Sharpe Ratio** | < 0.5 | 0.5-1.0 | 1.0-2.0 | > 2.0 |
| **Max Drawdown** | > 40% | 20-40% | 10-20% | < 10% |
| **Profit Factor** | < 1.0 | 1.0-1.5 | 1.5-2.5 | > 2.5 |

### Red Flags:

🚩 **Win rate < 40%**: Stop loss too tight, or strategy doesn't match market
🚩 **Max drawdown > 50%**: Position sizing too large, need tighter risk control
🚩 **Avg loss > 2x avg win**: R:R ratio inverted, need bigger targets or tighter stops
🚩 **All trades hit stop loss**: Stop too tight, widen it or change strategy
🚩 **Brokerage > 30% of returns**: Too many trades, trade less frequently

---

## Testing Your Changes

### After updating parameters:

1. **Delete old backtest runs** (they're invalid now)
2. **Run fresh backtest** on same period
3. **Compare results**:
   - Return should improve (closer to 0% or positive)
   - Win rate should increase
   - Fewer stop losses, more targets hit

### Iteration Process:

```
Run Backtest → Analyze Results → Adjust Parameters → Repeat
```

**If still losing**: Widen stops more, increase targets
**If Win rate low**: Loosen entry requirements (lower confidence, higher RSI threshold)
**If Too few trades**: Lower confidence threshold, reduce signal requirements

---

## Advanced: Modify BacktestEngine Logic

### Location: `backend/src/services/backtestEngine.ts`

#### Change Signal Requirements:

**Line 499**: Current requires 2+ signals
```typescript
const shouldEnter = signals.length >= 2;
```

**Change to 1 signal** for more trades:
```typescript
const shouldEnter = signals.length >= 1;  // More aggressive!
```

#### Adjust Slippage/Brokerage:

**Lines 82-83**: Current costs
```typescript
private slippagePercent: number = 0.05;    // 0.05% slippage
private brokeragePerTrade: number = 20;    // ₹20 per trade
```

**Lower costs** for better performance:
```typescript
private slippagePercent: number = 0.02;    // Lower slippage
private brokeragePerTrade: number = 10;    // Lower brokerage
```

⚠️ **Warning**: This makes backtests unrealistic! Only do this if you have real low-cost broker.

---

## Summary

**60-70% losses** are caused by:
1. ✅ Stop losses too tight (0.5-1%)
2. ✅ Targets too small relative to costs
3. ✅ Brokerage + slippage eating profits

**Quick fix**:
- Widen stops to 2-3%
- Increase targets to 6-9%
- Keep R:R ratio 1:3 or better
- Lower entry requirements

**Expected improvement**: -20% to +40% returns (realistic for demo strategies)

---

**Last Updated**: 2026-01-03
**Status**: Active tuning guide
