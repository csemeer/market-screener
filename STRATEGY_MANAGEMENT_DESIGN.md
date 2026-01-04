# Trading Strategy Management System - Design Document

## Overview
This document outlines the design for a comprehensive trading strategy management system that allows users to:
- Select from a library of professional pre-built strategies
- Create and customize their own strategies
- Reuse strategies across multiple scalpers
- Maintain and version strategies independently

## Architecture

### 1. Database Schema

#### New Table: `trading_strategies`
```sql
CREATE TABLE IF NOT EXISTS trading_strategies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('MEAN_REVERSION', 'TREND_FOLLOWING', 'VOLUME_BREAKOUT', 'MOMENTUM', 'CUSTOM')),

  -- Strategy Configuration
  entry_conditions TEXT NOT NULL,  -- JSON
  exit_conditions TEXT NOT NULL,   -- JSON
  indicators_config TEXT NOT NULL, -- JSON

  -- Metadata
  is_system BOOLEAN NOT NULL DEFAULT 0,  -- System strategies can't be deleted
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,

  -- Performance tracking (optional)
  total_uses INTEGER NOT NULL DEFAULT 0,
  avg_win_rate REAL,
  avg_return_percent REAL,

  -- Risk parameters (default suggestions)
  recommended_timeframes TEXT,  -- JSON array: ['5m', '15m']
  recommended_stop_loss_percent REAL,
  recommended_target_percent REAL,
  min_capital_required REAL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Updated Table: `scalper_configs`
```sql
-- Add new optional foreign key to trading_strategies
ALTER TABLE scalper_configs ADD COLUMN strategy_id INTEGER REFERENCES trading_strategies(id);

-- Keep existing fields for backward compatibility:
-- strategy_name, entry_conditions, exit_conditions, indicators_config
-- If strategy_id is set, these fields can be populated from the strategy
-- If strategy_id is NULL, use legacy embedded configuration
```

### 2. Default Strategy Library (15 Professional Strategies)

#### Mean Reversion Strategies (4)
1. **RSI Bollinger Reversal** - Classic oversold + BB lower band
2. **Multi-Timeframe Mean Reversion** - RSI + EMA pullback confirmation
3. **Statistical Arbitrage** - Z-score based mean reversion
4. **Support/Resistance Bounce** - Price action at key levels

#### Trend Following Strategies (4)
5. **EMA Crossover Trend** - 9/21/50 EMA alignment
6. **ADX Momentum Trend** - Strong ADX + MACD confirmation
7. **Moving Average Ribbon** - Multiple MA alignment
8. **Supertrend Breakout** - Supertrend indicator based

#### Volume-Based Strategies (3)
9. **Volume Breakout Scanner** - 2x+ volume spike + price breakout
10. **VWAP Touch Reversal** - Price bounce off VWAP
11. **Accumulation Distribution** - Volume-price divergence

#### Momentum Strategies (3)
12. **MACD Momentum** - MACD histogram + RSI confirmation
13. **Stochastic Momentum** - Stochastic crossover in oversold/overbought
14. **Rate of Change Breakout** - ROC + volume confirmation

#### Custom/Advanced (1)
15. **Options Flow Scalper** - Volume + OI analysis (future enhancement)

### 3. Strategy Configuration Structure

Each strategy contains:

```typescript
interface TradingStrategy {
  id: number;
  name: string;
  description: string;
  category: 'MEAN_REVERSION' | 'TREND_FOLLOWING' | 'VOLUME_BREAKOUT' | 'MOMENTUM' | 'CUSTOM';

  // Core configuration
  entry_conditions: {
    type: string;  // Strategy type for BacktestEngine
    // Type-specific parameters (customizable by user)
    [key: string]: any;
  };

  exit_conditions: {
    stopLossPercent: number;
    targetPercent: number;
    trailingStop?: {
      enabled: boolean;
      percent: number;
    };
    maxHoldMinutes?: number;
    maxHoldHours?: number;
  };

  indicators_config: {
    rsi?: { enabled: boolean; period: number; overbought: number; oversold: number };
    bollinger?: { enabled: boolean; period: number; stdDev: number };
    ema?: { enabled: boolean; periods: number[] };
    macd?: { enabled: boolean; fast: number; slow: number; signal: number };
    adx?: { enabled: boolean; period: number; threshold: number };
    volume?: { enabled: boolean; ma_period: number; breakout_multiplier?: number };
    vwap?: { enabled: boolean };
    // ... other indicators
  };

  // Metadata
  is_system: boolean;
  is_active: boolean;

  // Recommendations
  recommended_timeframes: string[];  // ['5m', '15m']
  recommended_stop_loss_percent: number;
  recommended_target_percent: number;
  min_capital_required: number;

  // Performance (updated after backtests)
  total_uses: number;
  avg_win_rate?: number;
  avg_return_percent?: number;
}
```

### 4. User Workflows

#### A. Creating a Scalper with Pre-built Strategy
1. User navigates to "Create Scalper"
2. In strategy section, sees dropdown: "Select Strategy"
3. Dropdown shows categories with strategies grouped:
   - Mean Reversion (4 strategies)
   - Trend Following (4 strategies)
   - Volume Breakout (3 strategies)
   - Momentum (3 strategies)
   - Custom (user-created)
4. User selects strategy (e.g., "RSI Bollinger Reversal")
5. UI shows strategy description and recommended parameters
6. User can customize parameters or use defaults
7. User completes other scalper settings (stocks, timing, risk)
8. Save creates scalper with `strategy_id` reference

#### B. Creating a Custom Strategy
1. User navigates to "Strategy Library"
2. Clicks "Create New Strategy"
3. UI shows strategy builder form:
   - Name & Description
   - Category selection
   - Entry Conditions Builder (visual/JSON)
   - Exit Conditions Builder (SL, Target, Trailing)
   - Indicator Configuration
   - Risk Parameters
4. User can test strategy with backtest before saving
5. Save creates new strategy in `trading_strategies` table
6. Strategy appears in "Custom" category for all scalpers

#### C. Managing Strategies
1. User navigates to "Strategy Library"
2. Views list of all strategies (system + custom)
3. For each strategy:
   - View: See full configuration and performance stats
   - Edit: Modify custom strategies (creates new version)
   - Clone: Copy system strategy to create custom variant
   - Delete: Remove custom strategies (only if not in use)
   - Backtest: Run backtest to evaluate performance
4. Filter/search by category, performance, name

### 5. API Endpoints

#### Strategy Management
```
GET    /api/strategies              - List all strategies (with filters)
GET    /api/strategies/:id          - Get strategy details
POST   /api/strategies              - Create new strategy
PUT    /api/strategies/:id          - Update strategy (version++)
DELETE /api/strategies/:id          - Delete strategy (if not in use)
POST   /api/strategies/:id/clone    - Clone strategy to create variant
GET    /api/strategies/categories   - Get strategy categories
```

#### Scalper Integration
```
GET    /api/scalpers/:id/strategy   - Get resolved strategy for scalper
PUT    /api/scalpers/:id/strategy   - Update scalper's strategy reference
```

### 6. Migration Strategy

#### Phase 1: Add New Tables & APIs
- Create `trading_strategies` table
- Add `strategy_id` column to `scalper_configs`
- Build backend APIs
- Seed default strategies

#### Phase 2: Update Frontend
- Build Strategy Library UI
- Update scalper creation flow
- Add strategy selector component

#### Phase 3: Migrate Existing Data (Optional)
- Script to convert existing scalper configs to strategies
- Deduplicate similar configurations
- Link scalpers to matched strategies

### 7. Benefits

✅ **Reusability**: Create once, use in multiple scalpers
✅ **Consistency**: Same strategy = same results across scalpers
✅ **Maintainability**: Update strategy → affects all using scalpers
✅ **Discovery**: Users can browse and learn from proven strategies
✅ **Performance Tracking**: See which strategies work best
✅ **Version Control**: Track strategy changes over time
✅ **Collaboration**: Share strategies across team (future)
✅ **Marketplace**: Community strategy sharing (future)

### 8. Technical Considerations

#### Backward Compatibility
- Existing scalpers without `strategy_id` continue to work
- BacktestEngine checks `strategy_id` first, falls back to embedded config
- Migration is optional, not required

#### Strategy Resolution Logic
```typescript
function resolveStrategy(scalper: ScalperConfig): ResolvedStrategy {
  if (scalper.strategy_id) {
    // Load from trading_strategies table
    const strategy = db.getStrategy(scalper.strategy_id);
    // Allow scalper to override specific parameters
    return mergeWithOverrides(strategy, scalper);
  } else {
    // Use legacy embedded configuration
    return {
      entry_conditions: JSON.parse(scalper.entry_conditions),
      exit_conditions: JSON.parse(scalper.exit_conditions),
      indicators_config: JSON.parse(scalper.indicators_config)
    };
  }
}
```

#### Validation
- Validate entry_conditions match category type
- Ensure required indicators are configured
- Check stop loss < target (risk/reward ratio)
- Validate timeframe compatibility
- Capital requirements met

### 9. UI/UX Design Principles

1. **Progressive Disclosure**: Show simple options first, advanced in expandable sections
2. **Visual Strategy Builder**: Drag-drop interface for entry/exit conditions
3. **Live Preview**: Show example signals on chart while building strategy
4. **Performance Metrics**: Display win rate, avg return, risk/reward for each strategy
5. **Search & Filter**: Filter by category, performance, risk level
6. **Strategy Cards**: Visual cards with icon, name, description, key metrics
7. **Comparison View**: Compare 2-3 strategies side by side
8. **Backtesting Integration**: One-click backtest from strategy view

### 10. Future Enhancements

- **Strategy Marketplace**: Share/sell strategies with community
- **AI Strategy Optimizer**: Genetic algorithms to optimize parameters
- **Strategy Combos**: Combine multiple strategies with allocation
- **Paper Trading**: Test strategies in real-time without risk
- **Strategy Signals**: Subscribe to signals from specific strategies
- **Performance Analytics**: Detailed breakdown of strategy performance
- **Strategy Versioning**: Full git-like version control
- **Strategy Templates**: Quick-start templates for common patterns

## Implementation Priority

### Phase 1 (MVP) - Core Infrastructure
1. ✅ Database schema
2. ✅ Seed default strategies
3. ✅ Backend CRUD APIs
4. ✅ Strategy resolution logic

### Phase 2 - Basic UI
5. ✅ Strategy list view
6. ✅ Strategy details view
7. ✅ Strategy selector in scalper creation
8. ✅ Basic create/edit forms

### Phase 3 - Advanced Features
9. ⏳ Visual strategy builder
10. ⏳ Performance tracking
11. ⏳ Backtest integration
12. ⏳ Strategy comparison

### Phase 4 - Polish
13. ⏳ Strategy marketplace
14. ⏳ AI optimizer
15. ⏳ Advanced analytics
