# Auto-Scalper System - Implementation Plan

## Overview
This document outlines the comprehensive implementation of the Auto-Scalping system for AlphaStream.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Dashboard                       │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Config Panel │ │  Live Charts │ │  Trade Monitor     │  │
│  │ - Stocks     │ │  - Candles   │ │  - Open Positions  │  │
│  │ - Strategy   │ │  - Indicators│ │  - P&L Tracker     │  │
│  │ - Risk Mgmt  │ │  - Signals   │ │  - Trade History   │  │
│  └──────────────┘ └──────────────┘ └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Services                        │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │ Broker API   │ │  Real-Time   │ │  Scalping Engine   │  │
│  │  Service     │ │  Data Stream │ │  - Signal Gen      │  │
│  │ - Zerodha    │ │  - WebSocket │ │  - Entry/Exit      │  │
│  │ - Upstox     │ │  - Candles   │ │  - Risk Checks     │  │
│  │ - IBKR       │ │  - Indicators│ │  - Auto Execute    │  │
│  └──────────────┘ └──────────────┘ └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Schema ✅ COMPLETED
- `scalper_configs` - Scalper configurations
- `scalping_stocks` - Stocks being tracked
- `scalp_trades` - Trade history
- `broker_connections` - Broker API credentials

### 2. Broker Integration Service 🔄 IN PROGRESS

**Purpose**: Connect to broker APIs for order execution and live data

**Brokers Supported**:
- Zerodha Kite Connect
- Upstox API
- Interactive Brokers (IBKR)

**Key Functions**:
```typescript
- connectBroker(config) - Establish connection
- placeMark

etOrder(order) - Execute buy/sell
- placeStopLossOrder(order) - SL order
- getPositions() - Current positions
- getOrders() - Order status
- getLTP(symbol) - Live price
- subscribeToTicks(symbols) - WebSocket
```

### 3. Real-Time Data Processor 📊

**Purpose**: Process live market data and generate trading signals

**Features**:
- WebSocket connection to broker
- 1-min, 3-min, 5-min candle formation
- Real-time indicator calculation:
  * EMA (9, 21, 50)
  * RSI
  * MACD
  * Bollinger Bands
  * VWAP
  * Volume Profile

### 4. Scalping Strategy Engine 🎯

**Built-in Strategies**:

1. **Breakout Scalper**
   - Entry: Price breaks resistance with volume
   - Exit: 0.5-1% target or 0.3% stop loss

2. **Reversal Scalper**
   - Entry: RSI oversold + bullish candle
   - Exit: Quick 0.3-0.7% profit

3. **Momentum Scalper**
   - Entry: Strong momentum + EMA crossover
   - Exit: Trailing stop or fixed target

4. **Mean Reversion Scalper**
   - Entry: Price touches lower Bollinger Band
   - Exit: Return to middle band

### 5. Order Execution & Position Management 💼

**Features**:
- Automatic order placement
- Position size calculation
- Stop-loss automation
- Take-profit execution
- Trailing stop management
- Emergency exit all positions

**Risk Management**:
- Max position size limit
- Max open positions limit
- Daily loss limit
- Max trades per day
- Position sizing (fixed, risk-based, Kelly criterion)

### 6. Visualization Dashboard 📈

**Live Charting**:
- Real-time candlestick charts
- Indicator overlays
- Entry/exit markers
- Volume bars

**Trade Monitoring**:
- Open positions table
- Real-time P&L
- Win rate statistics
- Daily performance summary

### 7. Safety Controls 🛡️

**Emergency Controls**:
- STOP ALL button - Immediately exit all positions
- Pause trading
- Emergency stop loss trigger

**Risk Limits**:
- Maximum daily loss
- Maximum drawdown
- Circuit breaker on consecutive losses
- Time-based restrictions (avoid first/last minutes)

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [x] Database schema
- [ ] Broker service base class
- [ ] Zerodha integration (primary)
- [ ] WebSocket data handler
- [ ] Basic candle formation

### Phase 2: Strategy Engine (Week 2)
- [ ] Indicator calculations
- [ ] Signal generation logic
- [ ] Entry condition evaluation
- [ ] Exit condition monitoring
- [ ] Risk management rules

### Phase 3: Order Execution (Week 3)
- [ ] Order placement
- [ ] Position tracking
- [ ] Stop-loss automation
- [ ] Take-profit automation
- [ ] Emergency controls

### Phase 4: Dashboard UI (Week 4)
- [ ] Configuration page
- [ ] Live chart component
- [ ] Position monitor
- [ ] Trade history
- [ ] P&L dashboard

### Phase 5: Testing & Optimization (Week 5)
- [ ] Paper trading mode
- [ ] Backtesting engine
- [ ] Performance optimization
- [ ] Error handling
- [ ] Logging & monitoring

## Technical Stack

**Backend**:
- Node.js + TypeScript
- WebSocket for real-time data
- SQLite for storage
- Broker SDKs (kiteconnect, upstox-js-sdk)

**Frontend**:
- React + TypeScript
- TradingView Lightweight Charts
- Real-time updates via Socket.io
- Responsive design

## API Endpoints

```
POST   /api/scalper/config          - Create/update scalper config
GET    /api/scalper/configs         - List all configs
GET    /api/scalper/:id             - Get specific config
DELETE /api/scalper/:id             - Delete config

POST   /api/scalper/:id/start       - Start scalper
POST   /api/scalper/:id/stop        - Stop scalper
POST   /api/scalper/:id/emergency   - Emergency stop all

GET    /api/scalper/:id/positions   - Get open positions
GET    /api/scalper/:id/trades      - Get trade history
GET    /api/scalper/:id/performance - Get performance metrics

POST   /api/broker/connect          - Connect broker
POST   /api/broker/disconnect       - Disconnect broker
GET    /api/broker/status           - Get connection status

GET    /api/realtime/candles/:symbol - Get live candles
GET    /api/realtime/ticks/:symbol   - Get live ticks
```

## WebSocket Events

```
// Client -> Server
'subscribe:ticks'    - Subscribe to ticker
'unsubscribe:ticks'  - Unsubscribe from ticker
'subscribe:candles'  - Subscribe to candles

// Server -> Client
'tick'               - Live price update
'candle'             - New candle formed
'signal'             - Trading signal generated
'trade:entry'        - Trade entered
'trade:exit'         - Trade exited
'position:update'    - Position updated
```

## Configuration Example

```typescript
{
  name: "NSE Scalper 1",
  enabled: true,
  broker: "zerodha",
  accountId: "ABC123",
  autoTrade: true,

  stockSelection: {
    method: "MANUAL",
    symbols: ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK"],
    maxStocks: 5
  },

  strategy: {
    name: "Breakout Scalper",
    timeframe: "5m",
    indicators: {
      useEMA: true,
      emaFast: 9,
      emaSlow: 21,
      useRSI: true,
      rsiPeriod: 14,
      useVWAP: true
    },
    entryConditions: {
      type: "BREAKOUT",
      volumeConfirmation: true,
      minVolumeMultiplier: 1.5
    },
    exitConditions: {
      targetPercent: 0.7,
      stopLossPercent: 0.3,
      useTrailingStop: true,
      trailingStopPercent: 0.2,
      maxHoldTimeMinutes: 30
    }
  },

  riskManagement: {
    maxPositionSize: 50000,
    maxPositionsOpen: 3,
    maxDailyLoss: 5000,
    maxDailyTrades: 20,
    positionSizingMethod: "RISK_BASED",
    riskPerTrade: 1.0
  },

  tradingHours: {
    startTime: "09:30",
    endTime: "15:15",
    avoidFirstMinutes: 15,
    avoidLastMinutes: 15
  }
}
```

## Security Considerations

1. **API Keys**: Encrypted storage
2. **Access Control**: User authentication
3. **Rate Limiting**: Prevent API abuse
4. **Audit Trail**: Log all trades
5. **Emergency Shutdown**: Quick kill switch

## Performance Metrics

**Track**:
- Total trades
- Win rate
- Average win/loss
- Profit factor
- Max drawdown
- Sharpe ratio
- Average hold time
- Daily P&L

## Next Steps

1. Review and approve this implementation plan
2. Set up broker accounts for testing
3. Implement Zerodha integration first (most popular in India)
4. Build paper trading mode for testing
5. Create comprehensive dashboard UI
6. Test with small position sizes
7. Gradually scale up

## Notes

- **IMPORTANT**: Always test in paper trading mode first
- Start with small position sizes
- Monitor closely during initial runs
- Keep emergency stop button accessible
- Review trades daily
- Adjust strategy based on performance

---

**Status**: 🚧 Phase 1 in progress - Database schema completed
**Next**: Broker integration service implementation
