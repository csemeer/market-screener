# Broker Adapters Documentation

This document describes the broker adapter system for Market Screener, enabling integration with multiple brokers for auto-trading and position management.

## Overview

The broker adapter system provides a unified interface for interacting with different broker APIs. It supports:
- **Zerodha (Kite Connect)** - India's leading discount broker
- **Upstox** - Modern trading platform with REST API v2
- **Interactive Brokers (IBKR)** - Global broker (foundation provided)

## Architecture

### 1. Type System (`types.ts`)
Defines common interfaces for all brokers:
- **BrokerCredentials**: Authentication details
- **OrderRequest/OrderResponse**: Order lifecycle
- **Position, Holding, Funds**: Account data
- **Quote**: Market data
- **IBrokerAdapter**: Interface all adapters must implement

### 2. Base Adapter (`BaseBrokerAdapter.ts`)
Abstract class providing:
- Connection management
- Retry logic with exponential backoff
- Order validation
- Position exit functionality
- Logging and error handling
- Token expiry checks

### 3. Broker-Specific Adapters

#### Zerodha Adapter (`ZerodhaAdapter.ts`)
**Features**:
- OAuth2 authentication with request_token
- Daily re-login requirement (no token refresh)
- Complete order management (place, modify, cancel)
- Position and holding retrieval
- Market quotes (single and batch)
- Order book and trade book access

**Authentication Flow**:
1. Generate login URL with API key
2. User logs in via browser
3. Zerodha redirects with request_token
4. Exchange request_token for access_token using checksum
5. Token valid until market close (3:30 PM IST)

**API Endpoints**:
- Base URL: `https://api.kite.trade`
- Version: 3
- Documentation: https://kite.trade/docs/connect/v3/

**Product Types**:
- MIS: Margin Intraday Squareoff (INTRADAY)
- CNC: Cash and Carry (DELIVERY)
- NRML: Normal (MARGIN)

#### Upstox Adapter (`UpstoxAdapter.ts`)
**Features**:
- OAuth2 authentication
- Access token with expiry
- RESTful API v2
- Real-time positions and holdings
- Comprehensive order management
- Market data access

**Authentication Flow**:
1. Redirect to Upstox login URL
2. User authorizes application
3. Receive authorization code
4. Exchange code for access_token
5. Token valid for specified expiry time

**API Endpoints**:
- Base URL: `https://api.upstox.com/v2`
- Documentation: https://upstox.com/developer/api-documentation

**Product Types**:
- I: Intraday (INTRADAY)
- D: Delivery (DELIVERY)
- M: Margin (MARGIN)

#### Interactive Brokers (IBKR)
**Status**: Foundation provided, requires full implementation

**Implementation Notes**:
- Use IB Gateway or TWS
- Connect via IB API (Node.js wrapper)
- Support for global markets
- Complex order types
- Real-time market data subscriptions

**Resources**:
- API Documentation: https://interactivebrokers.github.io/tws-api/
- Node.js Library: `@stoqey/ib` or `node-ib-api`

## Usage

### 1. Initialize Broker Adapter

```typescript
import { ZerodhaAdapter } from './services/brokers/ZerodhaAdapter';
import { BrokerCredentials } from './services/brokers/types';

const credentials: BrokerCredentials = {
  brokerId: 1,
  brokerType: 'ZERODHA',
  apiKey: 'your_api_key',
  apiSecret: 'your_api_secret',
  accessToken: 'existing_token', // Optional
  refreshToken: 'request_token',  // For initial auth
};

const adapter = new ZerodhaAdapter({
  timeout: 30000,
  retryAttempts: 3,
  enableLogging: true,
});

await adapter.initialize(credentials);
```

### 2. Place an Order

```typescript
import { OrderRequest } from './services/brokers/types';

const order: OrderRequest = {
  symbol: 'RELIANCE',
  exchange: 'NSE',
  orderType: 'LIMIT',
  orderSide: 'BUY',
  quantity: 1,
  price: 2500.00,
  productType: 'DELIVERY',
  validity: 'DAY',
  tag: 'MARKET_SCREENER_AUTO',
};

const response = await adapter.placeOrder(order);
console.log(`Order ID: ${response.orderId}, Status: ${response.status}`);
```

### 3. Get Positions

```typescript
const positions = await adapter.getPositions();

positions.forEach(pos => {
  console.log(`${pos.symbol}: ${pos.quantity} @ ${pos.averagePrice}`);
  console.log(`P&L: ${pos.pnl} (${pos.pnlPercent.toFixed(2)}%)`);
});
```

### 4. Exit All Positions

```typescript
const results = await adapter.exitAllPositions();

results.forEach((result, idx) => {
  console.log(`Position ${idx + 1}: ${result.status} - ${result.message}`);
});
```

### 5. Get Market Quote

```typescript
const quote = await adapter.getQuote('INFY', 'NSE');

console.log(`${quote.symbol}: ${quote.lastPrice}`);
console.log(`Change: ${quote.change} (${quote.changePercent.toFixed(2)}%)`);
console.log(`Volume: ${quote.volume}`);
```

### 6. Monitor Orders

```typescript
const orderBook = await adapter.getOrderBook();

orderBook.forEach(order => {
  console.log(`${order.orderId}: ${order.symbol} ${order.orderSide} ${order.quantity}`);
  console.log(`Status: ${order.status}, Filled: ${order.filledQuantity}/${order.quantity}`);
});
```

## Auto-Trading Integration

### Trading Signal Processing

```typescript
import { TradingSignal } from './services/brokers/types';

async function processTradingSignal(signal: TradingSignal, adapter: IBrokerAdapter) {
  // Calculate quantity based on risk
  const funds = await adapter.getFunds();
  const riskAmount = funds.availableMargin * 0.02; // 2% risk per trade
  const riskPerShare = Math.abs(signal.entryPrice - signal.stopLoss);
  const quantity = Math.floor(riskAmount / riskPerShare);

  // Place entry order
  const order: OrderRequest = {
    symbol: signal.symbol,
    exchange: signal.exchange,
    orderType: 'LIMIT',
    orderSide: signal.orderSide,
    quantity,
    price: signal.entryPrice,
    productType: 'INTRADAY',
    tag: `AUTO_${signal.setupType}`,
  };

  const response = await adapter.placeOrder(order);

  if (response.status === 'PENDING' || response.status === 'OPEN') {
    // Place stop loss order
    const slOrder: OrderRequest = {
      symbol: signal.symbol,
      exchange: signal.exchange,
      orderType: 'STOP_LOSS_MARKET',
      orderSide: signal.orderSide === 'BUY' ? 'SELL' : 'BUY',
      quantity,
      triggerPrice: signal.stopLoss,
      productType: 'INTRADAY',
      tag: `SL_${response.orderId}`,
    };

    await adapter.placeOrder(slOrder);
  }

  return response;
}
```

### Position Management

```typescript
async function managePositions(adapter: IBrokerAdapter) {
  const positions = await adapter.getPositions();

  for (const position of positions) {
    // Check if stop loss hit
    if (position.pnlPercent <= -2.0) {
      console.log(`Stop loss hit for ${position.symbol}, exiting...`);
      await adapter.exitPosition(position);
      continue;
    }

    // Check if target hit
    if (position.pnlPercent >= 5.0) {
      console.log(`Target hit for ${position.symbol}, exiting...`);
      await adapter.exitPosition(position);
      continue;
    }

    // Trail stop loss
    if (position.pnlPercent >= 3.0) {
      const newStopLoss = position.averagePrice * 1.015; // 1.5% profit lock
      console.log(`Trailing stop loss for ${position.symbol} to ${newStopLoss}`);
      // Implement trailing SL logic
    }
  }
}
```

## Error Handling

All adapters include comprehensive error handling:

```typescript
try {
  const response = await adapter.placeOrder(order);
  if (response.status === 'REJECTED') {
    console.error(`Order rejected: ${response.rejectionReason}`);
  }
} catch (error) {
  console.error('Failed to place order:', error.message);
  // Retry or notify user
}
```

## Security Best Practices

### 1. Credential Storage
- **Never commit credentials** to version control
- Store in environment variables or Secret Manager
- Encrypt credentials in database

### 2. API Key Security
```typescript
// Store credentials securely
const credentials = {
  apiKey: process.env.ZERODHA_API_KEY,
  apiSecret: process.env.ZERODHA_API_SECRET,
  // Never log or expose these values
};
```

### 3. Token Rotation
```typescript
// Check token expiry before each request
if (adapter.isTokenExpired()) {
  await adapter.refreshAccessToken();
}
```

### 4. Rate Limiting
```typescript
// Implement rate limiting
const rateLimiter = {
  requestsPerSecond: 10,
  ordersPerMinute: 100,
};

// Use retry with backoff
await adapter.retryOperation(() => adapter.placeOrder(order), 'placeOrder');
```

## Testing

### Mock Adapter for Testing

```typescript
class MockBrokerAdapter extends BaseBrokerAdapter {
  async placeOrder(order: OrderRequest): Promise<OrderResponse> {
    return {
      orderId: 'MOCK_' + Math.random().toString(36).substr(2, 9),
      status: 'COMPLETE',
      message: 'Mock order placed',
      timestamp: new Date(),
    };
  }

  // Implement other methods with mock data
}
```

### Integration Testing

```typescript
describe('ZerodhaAdapter', () => {
  let adapter: ZerodhaAdapter;

  beforeEach(() => {
    adapter = new ZerodhaAdapter({ sandbox: true });
  });

  it('should place a market order', async () => {
    const order: OrderRequest = {
      symbol: 'SBIN',
      exchange: 'NSE',
      orderType: 'MARKET',
      orderSide: 'BUY',
      quantity: 1,
      productType: 'DELIVERY',
    };

    const response = await adapter.placeOrder(order);
    expect(response.orderId).toBeDefined();
    expect(response.status).not.toBe('REJECTED');
  });
});
```

## Broker-Specific Notes

### Zerodha
- **Login**: Daily manual login required
- **Session**: Valid until 3:30 PM IST
- **Instruments**: Download CSV for symbol mapping
- **Websocket**: Use KiteTicker for live data
- **Charges**: ₹20/month for API access

### Upstox
- **Login**: OAuth2 flow with redirect
- **Token**: Expires after specified duration
- **Instruments**: Use API to fetch instrument keys
- **Websocket**: Market data feed available
- **Charges**: Free API access

### IBKR (To Implement)
- **Connection**: IB Gateway or TWS required
- **Markets**: Global coverage (US, EU, Asia)
- **Data**: Subscription required for live data
- **Complexity**: Advanced order types and routing
- **Documentation**: Extensive but complex

## Future Enhancements

1. **WebSocket Support**
   - Real-time order updates
   - Live position tracking
   - Market data streaming

2. **Advanced Order Types**
   - Bracket orders (SL + Target)
   - Cover orders
   - Iceberg orders
   - Algorithmic orders

3. **Portfolio Analytics**
   - P&L tracking
   - Risk metrics
   - Performance analytics
   - Tax reports

4. **Additional Brokers**
   - Angel One
   - 5Paisa
   - Fyers
   - IIFL

5. **Paper Trading**
   - Simulated trading environment
   - Strategy backtesting
   - Risk-free testing

## Resources

### Zerodha
- API Docs: https://kite.trade/docs/connect/v3/
- API Console: https://kite.trade/developer
- Support: https://support.zerodha.com

### Upstox
- API Docs: https://upstox.com/developer/api-documentation
- Developer Console: https://account.upstox.com/developer/apps
- Support: https://support.upstox.com

### Interactive Brokers
- TWS API: https://interactivebrokers.github.io/tws-api/
- Node.js: https://www.npmjs.com/package/@stoqey/ib
- Support: https://www.interactivebrokers.com/en/support/api.php

## Contributing

When adding a new broker adapter:

1. Extend `BaseBrokerAdapter`
2. Implement all `IBrokerAdapter` methods
3. Add broker-specific type mappings
4. Include authentication flow
5. Write unit tests
6. Document broker-specific features
7. Add to broker selection in UI

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Status**: Production Ready (Zerodha, Upstox), Foundation (IBKR)
