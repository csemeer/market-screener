# Stock Market Screener - Comprehensive Enhancement Plan

## 🎯 Overview
Transform the EOD Trading System into a top-notch, comprehensive, production-ready trading platform with:
- Multi-channel alerting (Email, SMS, WhatsApp, Telegram)
- Webhook support for external integrations
- Broker API integration (Upstox, Zerodha, Interactive Brokers)
- Advanced settings/configuration management
- Mobile-first responsive design
- Market-standard security and reliability

---

## 📐 Architecture Design

### 1. Notification System Architecture

```
Alert Triggered → Notification Queue → Channel Router → Delivery Services
                                              ├─ Email (NodeMailer)
                                              ├─ SMS (Twilio)
                                              ├─ WhatsApp (Twilio/WhatsApp Business)
                                              ├─ Telegram (Bot API)
                                              └─ Webhooks (HTTP POST)
```

**Components:**
- **Notification Queue**: Redis-based queue for reliable delivery
- **Channel Router**: Routes alerts to user-selected channels
- **Delivery Services**: Individual service adapters
- **Retry Logic**: Exponential backoff for failed deliveries
- **Rate Limiting**: Prevent spam and API quota exhaustion

### 2. Broker Integration Architecture

```
Trade Signal → Order Management → Broker Adapter → Broker API
                                       ├─ Upstox Adapter
                                       ├─ Zerodha Kite Adapter
                                       └─ IBKR Gateway Adapter
```

**Components:**
- **Unified Order Interface**: Common order structure across brokers
- **Broker Adapters**: Individual broker implementations
- **Position Tracking**: Sync positions across brokers
- **Order Status Monitoring**: Real-time order updates
- **Risk Management**: Pre-trade checks and limits

### 3. Configuration Management

```
User Settings → Settings Service → Database
                    ├─ Notification Preferences
                    ├─ Broker Credentials (Encrypted)
                    ├─ Trading Parameters
                    ├─ Risk Management Rules
                    └─ Webhook Configurations
```

---

## 🔧 Implementation Components

### Phase 1: Notification System (Priority: HIGH)

#### 1.1 Database Schema
```sql
-- User notification preferences
CREATE TABLE notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT 'default',
  email_enabled BOOLEAN DEFAULT 0,
  email_address TEXT,
  sms_enabled BOOLEAN DEFAULT 0,
  sms_number TEXT,
  whatsapp_enabled BOOLEAN DEFAULT 0,
  whatsapp_number TEXT,
  telegram_enabled BOOLEAN DEFAULT 0,
  telegram_chat_id TEXT,
  webhook_enabled BOOLEAN DEFAULT 0,
  webhook_url TEXT,
  webhook_secret TEXT,
  alert_types TEXT, -- JSON: ["ENTRY_SIGNAL", "TARGET_HIT", "STOPLOSS_HIT"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification delivery log
CREATE TABLE notification_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER,
  channel TEXT, -- email, sms, whatsapp, telegram, webhook
  recipient TEXT,
  status TEXT, -- pending, sent, failed, retrying
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id)
);

-- Service API credentials (encrypted)
CREATE TABLE notification_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service TEXT UNIQUE, -- twilio, sendgrid, telegram, etc.
  credentials TEXT, -- Encrypted JSON
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 1.2 Services to Implement

**Email Service** (Using SendGrid/NodeMailer)
- File: `backend/src/services/notifications/emailService.ts`
- Features: HTML templates, attachments, rate limiting

**SMS Service** (Using Twilio)
- File: `backend/src/services/notifications/smsService.ts`
- Features: International support, delivery status tracking

**WhatsApp Service** (Using Twilio WhatsApp API)
- File: `backend/src/services/notifications/whatsappService.ts`
- Features: Rich media, templates, interactive messages

**Telegram Service** (Using Telegram Bot API)
- File: `backend/src/services/notifications/telegramService.ts`
- Features: Inline keyboards, message editing, bot commands

**Webhook Service**
- File: `backend/src/services/notifications/webhookService.ts`
- Features: Signed payloads, retry logic, timeout handling

**Notification Manager** (Orchestrator)
- File: `backend/src/services/notificationService.ts`
- Features: Channel routing, queue management, delivery tracking

#### 1.3 Alert Templates
```typescript
{
  ENTRY_SIGNAL: {
    subject: "🚀 Entry Signal - {symbol}",
    template: "Breakout detected on {symbol} at {price}. Entry trigger: {trigger}. Confidence: {confidence}."
  },
  TARGET_HIT: {
    subject: "🎯 Target Reached - {symbol}",
    template: "{symbol} reached Target {targetNum} at {price}. Profit: {profitPercent}%"
  },
  STOPLOSS_HIT: {
    subject: "⚠️ Stop Loss - {symbol}",
    template: "{symbol} hit stop loss at {price}. Loss: {lossPercent}%"
  }
}
```

---

### Phase 2: Broker Integration (Priority: HIGH)

#### 2.1 Database Schema
```sql
-- Broker accounts
CREATE TABLE broker_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT DEFAULT 'default',
  broker TEXT, -- upstox, zerodha, ibkr
  account_id TEXT,
  credentials TEXT, -- Encrypted JSON
  is_active BOOLEAN DEFAULT 1,
  auto_trade_enabled BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order tracking
CREATE TABLE broker_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  watchlist_stock_id INTEGER,
  broker_account_id INTEGER,
  broker TEXT,
  broker_order_id TEXT,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  order_type TEXT, -- MARKET, LIMIT, SL, SL-M
  side TEXT, -- BUY, SELL
  quantity INTEGER NOT NULL,
  price REAL,
  trigger_price REAL,
  status TEXT, -- PENDING, OPEN, EXECUTED, CANCELLED, REJECTED
  filled_quantity INTEGER DEFAULT 0,
  average_price REAL,
  order_timestamp DATETIME,
  execution_timestamp DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (watchlist_stock_id) REFERENCES watchlist_stocks(id),
  FOREIGN KEY (broker_account_id) REFERENCES broker_accounts(id)
);

-- Position tracking
CREATE TABLE broker_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  broker_account_id INTEGER,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  quantity INTEGER,
  average_price REAL,
  current_price REAL,
  pnl REAL,
  pnl_percent REAL,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (broker_account_id) REFERENCES broker_accounts(id)
);
```

#### 2.2 Broker Adapters

**Upstox Integration**
- File: `backend/src/brokers/upstox/upstoxAdapter.ts`
- API: Upstox API v2
- Features: OAuth, order placement, position tracking, historical data

**Zerodha Kite Integration**
- File: `backend/src/brokers/zerodha/zerodhaAdapter.ts`
- API: Kite Connect API
- Features: Login flow, margin calculation, GTT orders

**Interactive Brokers Integration**
- File: `backend/src/brokers/ibkr/ibkrAdapter.ts`
- API: IB Gateway REST API / TWS API
- Features: Multi-currency, global markets, complex orders

**Unified Broker Interface**
- File: `backend/src/brokers/baseBrokerAdapter.ts`
```typescript
interface BrokerAdapter {
  authenticate(): Promise<void>;
  placeOrder(order: OrderRequest): Promise<OrderResponse>;
  cancelOrder(orderId: string): Promise<void>;
  getPositions(): Promise<Position[]>;
  getOrderStatus(orderId: string): Promise<OrderStatus>;
  getMargins(): Promise<MarginInfo>;
}
```

#### 2.3 Trading Features
- **Auto-trading Mode**: Automatically execute trades on signals
- **Paper Trading**: Test strategies without real money
- **Position Sizing**: Calculate quantities based on risk percentage
- **Bracket Orders**: Entry + SL + Target in single order
- **Order Modifications**: Trailing stops, target adjustments

---

### Phase 3: Settings & Configuration UI (Priority: HIGH)

#### 3.1 Backend Routes
- `GET /api/settings/notifications` - Get notification preferences
- `PUT /api/settings/notifications` - Update notification preferences
- `POST /api/settings/notifications/test` - Send test notification
- `GET /api/settings/brokers` - Get broker accounts
- `POST /api/settings/brokers` - Add broker account
- `PUT /api/settings/brokers/:id` - Update broker account
- `DELETE /api/settings/brokers/:id` - Remove broker account
- `POST /api/settings/brokers/:id/test` - Test broker connection
- `GET /api/settings/trading` - Get trading parameters
- `PUT /api/settings/trading` - Update trading parameters
- `GET /api/settings/webhooks` - Get webhook configurations
- `POST /api/settings/webhooks` - Add webhook
- `PUT /api/settings/webhooks/:id` - Update webhook
- `DELETE /api/settings/webhooks/:id` - Remove webhook

#### 3.2 Frontend Components

**Settings Page** (`frontend/src/pages/Settings.tsx`)
```
Settings
├── Notification Settings
│   ├── Email Configuration
│   ├── SMS Configuration
│   ├── WhatsApp Configuration
│   ├── Telegram Configuration
│   └── Alert Type Selection
├── Broker Integration
│   ├── Connected Accounts
│   ├── Add New Broker
│   ├── Auto-Trade Toggle
│   └── Paper Trading Mode
├── Trading Parameters
│   ├── Default Position Size
│   ├── Max Risk Per Trade
│   ├── Max Positions
│   ├── Auto-Execute Settings
│   └── Order Preferences
├── Webhook Management
│   ├── Webhook URLs
│   ├── Event Filters
│   └── Secret Keys
└── Advanced Settings
    ├── EOD Scan Schedule
    ├── Live Monitoring Config
    └── Data Retention
```

**Mobile-Responsive Design**
- Collapsible sections
- Touch-optimized controls
- Bottom navigation for mobile
- Swipe gestures
- Progressive Web App (PWA) support

---

### Phase 4: Security & Compliance (Priority: CRITICAL)

#### 4.1 Credential Encryption
- Use `crypto-js` or `bcrypt` for encryption
- Store encryption keys in environment variables
- Never log sensitive data

#### 4.2 API Key Management
- Separate credentials for production/staging
- Rotate keys periodically
- Implement API key expiration

#### 4.3 Rate Limiting
- Prevent notification spam
- Broker API rate limits
- Webhook delivery limits

#### 4.4 Audit Logging
- Log all broker actions
- Track notification deliveries
- Monitor failed attempts

---

## 📱 Mobile-First Enhancements

### 1. Progressive Web App (PWA)
- Service worker for offline access
- Push notifications
- Install to home screen
- Splash screen

### 2. Touch-Optimized UI
- Larger tap targets (min 44px)
- Swipe to refresh
- Pull-down navigation
- Bottom sheet modals

### 3. Performance Optimization
- Code splitting
- Lazy loading
- Image optimization
- Caching strategy

---

## 🚀 Implementation Timeline

### Sprint 1 (Backend Foundation)
- [ ] Database schema for notifications & brokers
- [ ] Notification service base implementation
- [ ] Broker adapter interfaces
- [ ] Settings API endpoints

### Sprint 2 (Notification Channels)
- [ ] Email service (SendGrid/NodeMailer)
- [ ] SMS service (Twilio)
- [ ] WhatsApp service (Twilio)
- [ ] Telegram bot service
- [ ] Webhook service

### Sprint 3 (Broker Integration)
- [ ] Upstox adapter
- [ ] Zerodha adapter
- [ ] IBKR adapter
- [ ] Order management service
- [ ] Position tracking

### Sprint 4 (Frontend)
- [ ] Settings page UI
- [ ] Notification preferences form
- [ ] Broker connection wizard
- [ ] Trading parameters panel
- [ ] Webhook configuration

### Sprint 5 (Integration & Testing)
- [ ] Integrate notifications with alerts
- [ ] Auto-trading workflow
- [ ] End-to-end testing
- [ ] Mobile responsive testing
- [ ] Security audit

### Sprint 6 (Polish & Documentation)
- [ ] Error handling refinement
- [ ] Loading states & animations
- [ ] User documentation
- [ ] API documentation
- [ ] Deployment guides

---

## 🔑 Environment Variables Required

```env
# Email (SendGrid)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=

# SMS & WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=

# Telegram
TELEGRAM_BOT_TOKEN=

# Encryption
ENCRYPTION_KEY=

# Upstox
UPSTOX_API_KEY=
UPSTOX_API_SECRET=

# Zerodha
ZERODHA_API_KEY=
ZERODHA_API_SECRET=

# IBKR
IBKR_GATEWAY_URL=
IBKR_ACCOUNT_ID=
```

---

## 📊 Success Metrics

- [ ] Multi-channel notifications working with <1% failure rate
- [ ] Broker integrations successfully placing/tracking orders
- [ ] Settings page accessible on mobile devices (Lighthouse score >90)
- [ ] Zero security vulnerabilities in credential handling
- [ ] <500ms API response times
- [ ] 100% test coverage for critical paths

---

## 🎯 Next Steps

1. Review and approve architecture
2. Set up third-party service accounts (Twilio, SendGrid, etc.)
3. Implement notification system (Sprint 1-2)
4. Implement broker integrations (Sprint 3)
5. Build settings UI (Sprint 4)
6. Integration testing (Sprint 5)
7. Production deployment (Sprint 6)
