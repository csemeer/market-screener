# End-to-End Testing & Verification Guide

This guide provides comprehensive testing procedures for all Market Screener functionalities.

## Quick Start Testing

### 1. Start the Application

```bash
# Terminal 1: Start Backend
cd backend
npm install
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev
```

Backend runs on: http://localhost:3001
Frontend runs on: http://localhost:5173

### 2. Run Automated Tests

```bash
# Run E2E test suite
cd backend
npx ts-node src/tests/e2e.test.ts
```

## Manual Testing Checklist

### ✅ **1. API Health Check**

**Test**: Verify backend is running
```bash
curl http://localhost:3001/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### ✅ **2. Custom Watchlist System**

#### Create a Watchlist

**Test**: POST `/api/watchlist`
```bash
curl -X POST http://localhost:3001/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Watchlist",
    "description": "My first watchlist",
    "isActive": true
  }'
```

**Expected**: 201 status with watchlist object containing `id`

#### Get All Watchlists

**Test**: GET `/api/watchlist`
```bash
curl http://localhost:3001/api/watchlist
```

**Expected**: Array of watchlists with `stockCount` and `activeStockCount`

#### Add Stock to Watchlist

**Test**: POST `/api/watchlist/{id}/stocks`
```bash
curl -X POST http://localhost:3001/api/watchlist/1/stocks \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE",
    "exchange": "NSE",
    "companyName": "Reliance Industries",
    "setupType": "BREAKOUT",
    "timeframe": "INTRADAY",
    "entryPrice": 2500,
    "entryTrigger": 2510,
    "stopLoss": 2450,
    "target1": 2600,
    "target2": 2700,
    "target3": 2800
  }'
```

**Expected**: 201 status with stock object

#### Get Watchlist Stocks

**Test**: GET `/api/watchlist/{id}/stocks`
```bash
curl http://localhost:3001/api/watchlist/1/stocks
```

**Expected**: Array of stocks with all trading parameters

#### Update Stock Status

**Test**: PATCH `/api/watchlist/{id}/stocks/{stockId}/status`
```bash
curl -X PATCH http://localhost:3001/api/watchlist/1/stocks/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "TRIGGERED",
    "triggerPrice": 2510,
    "triggerTime": "2024-01-15T10:30:00.000Z"
  }'
```

**Expected**: Updated stock with new status

---

### ✅ **3. Notification System**

#### Get Notification Settings

**Test**: GET `/api/settings/notifications`
```bash
curl http://localhost:3001/api/settings/notifications
```

**Expected**: Notification settings object with enabled flags

#### Update Notification Settings

**Test**: PUT `/api/settings/notifications`
```bash
curl -X PUT http://localhost:3001/api/settings/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": true,
    "emailAddress": "test@example.com",
    "smsEnabled": false,
    "telegramEnabled": true,
    "telegramChatId": "123456789",
    "alertTypes": ["ENTRY_SIGNAL", "TARGET_HIT", "STOPLOSS_HIT"]
  }'
```

**Expected**: Updated settings

#### Test Email Notification

**Test**: POST `/api/settings/notifications/test`
```bash
curl -X POST http://localhost:3001/api/settings/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "email",
    "recipient": "test@example.com"
  }'
```

**Expected**: Success message, email received in inbox

#### Test SMS Notification

```bash
curl -X POST http://localhost:3001/api/settings/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "sms",
    "recipient": "+1234567890"
  }'
```

**Expected**: Success message, SMS received on phone

#### Test Telegram Notification

```bash
curl -X POST http://localhost:3001/api/settings/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "telegram",
    "recipient": "123456789"
  }'
```

**Expected**: Success message, Telegram message received

#### Check Notification Status

**Test**: GET `/api/settings/notifications/status`
```bash
curl http://localhost:3001/api/settings/notifications/status
```

**Expected**: Status object with available channels array

---

### ✅ **4. Broker Integration**

#### Add Broker Account

**Test**: POST `/api/settings/brokers`
```bash
curl -X POST http://localhost:3001/api/settings/brokers \
  -H "Content-Type: application/json" \
  -d '{
    "brokerType": "ZERODHA",
    "name": "My Zerodha Account",
    "apiKey": "your_api_key",
    "apiSecret": "your_api_secret",
    "isActive": true
  }'
```

**Expected**: 201 status with broker object (credentials encrypted)

#### Get Broker Accounts

**Test**: GET `/api/settings/brokers`
```bash
curl http://localhost:3001/api/settings/brokers
```

**Expected**: Array of broker accounts (credentials masked)

#### Update Broker Account

**Test**: PUT `/api/settings/brokers/{id}`
```bash
curl -X PUT http://localhost:3001/api/settings/brokers/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Account Name",
    "isActive": false
  }'
```

**Expected**: Updated broker account

#### Delete Broker Account

**Test**: DELETE `/api/settings/brokers/{id}`
```bash
curl -X DELETE http://localhost:3001/api/settings/brokers/1
```

**Expected**: Success message

---

### ✅ **5. EOD Trading System**

#### Get EOD Dashboard

**Test**: GET `/api/eod/dashboard`
```bash
curl http://localhost:3001/api/eod/dashboard
```

**Expected**: Dashboard data with recent scans and watchlist stats

#### Run EOD Scan

**Test**: POST `/api/eod/scan`
```bash
curl -X POST http://localhost:3001/api/eod/scan \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": ["RELIANCE", "INFY", "TCS"],
    "setupTypes": ["BREAKOUT", "PULLBACK"],
    "timeframe": "SWING"
  }'
```

**Expected**: Scan results with setups found

---

### ✅ **6. Live Monitoring**

**Note**: Live monitoring runs automatically during market hours.

#### Check Monitoring Status

Live monitoring service initializes on backend startup. Check logs:

```bash
# In backend logs, you should see:
✓ Live Monitoring Service initialized successfully
```

#### Monitor Custom Watchlist Stocks

Live monitoring automatically:
- Checks prices every 30 seconds during market hours
- Detects entry triggers
- Sends multi-channel notifications
- Updates stock status (PENDING → TRIGGERED)

**Verify**: Add a stock to custom watchlist and monitor backend logs during market hours

---

### ✅ **7. Frontend Testing**

#### Dashboard Page

1. Navigate to http://localhost:5173/
2. Verify dashboard loads without errors
3. Check recent alerts section
4. Verify watchlist summary

#### Custom Watchlist Page

1. Navigate to http://localhost:5173/watchlist
2. Click "Create Watchlist"
3. Fill in name and description
4. Click "Create"
5. Select the watchlist
6. Click "Add Stock"
7. Fill in all stock details
8. Click "Add Stock"
9. Verify stock appears in list
10. Click "Edit" on stock
11. Modify entry price
12. Click "Update"
13. Verify changes saved
14. Click "Delete" on stock
15. Confirm deletion

#### Settings Page

1. Navigate to http://localhost:5173/settings
2. Go to "Notifications" tab
3. Toggle email alerts ON
4. Enter email address
5. Click "Test" button
6. Verify test email received
7. Go to "Brokers" tab
8. Click "Add Broker"
9. Fill in broker details
10. Click "Add"
11. Verify broker appears in list

#### EOD Dashboard

1. Navigate to http://localhost:5173/eod
2. Click "Run Scan"
3. Configure scan parameters
4. Click "Start Scan"
5. Wait for results
6. Verify results displayed
7. Click "Add to Watchlist"
8. Verify stock added

---

## Integration Testing

### Test Notification Flow

1. **Create Custom Watchlist Stock**:
   - Add RELIANCE with entry trigger 2510
   - Set stop loss 2450, target 2600

2. **During Market Hours**:
   - Live monitoring checks price every 30s
   - When price >= 2510, triggers entry signal
   - Sends notifications to all enabled channels
   - Updates stock status to TRIGGERED

3. **Verify**:
   - Check email inbox for alert
   - Check phone for SMS (if enabled)
   - Check Telegram for message (if enabled)
   - Check backend logs for notification delivery
   - Check database for status update

### Test Broker Integration

1. **Add Broker Account**:
   - Add Zerodha or Upstox account
   - Verify credentials saved (encrypted)

2. **Place Test Order** (programmatically):
```typescript
import { ZerodhaAdapter } from './services/brokers/ZerodhaAdapter';

const adapter = new ZerodhaAdapter();
await adapter.initialize({
  brokerId: 1,
  brokerType: 'ZERODHA',
  apiKey: 'your_key',
  apiSecret: 'your_secret',
  accessToken: 'your_token',
});

const order = await adapter.placeOrder({
  symbol: 'SBIN',
  exchange: 'NSE',
  orderType: 'LIMIT',
  orderSide: 'BUY',
  quantity: 1,
  price: 500,
  productType: 'DELIVERY',
});

console.log('Order ID:', order.orderId);
```

3. **Verify**:
   - Check order in broker platform
   - Verify order status updates

---

## Performance Testing

### Load Test Custom Watchlist

```bash
# Create 100 watchlists with 10 stocks each
for i in {1..100}; do
  curl -X POST http://localhost:3001/api/watchlist \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Watchlist $i\", \"isActive\": true}"
done
```

**Expected**: All requests complete successfully

### Concurrent Notification Test

Test sending 50 concurrent notifications:

```bash
# Use Apache Bench or similar tool
ab -n 50 -c 10 http://localhost:3001/api/settings/notifications/test
```

**Expected**: All notifications delivered successfully

---

## Database Integrity Testing

### Verify Database Schema

```bash
cd backend
sqlite3 data/market-screener.db ".schema"
```

**Expected**: All tables exist:
- custom_watchlists
- custom_watchlist_stocks
- notification_settings
- notification_log
- broker_accounts
- broker_orders
- broker_positions
- alerts
- watchlist
- watchlist_stocks

### Check Data Consistency

```sql
-- Count active watchlist stocks
SELECT COUNT(*) FROM custom_watchlist_stocks
WHERE status = 'PENDING';

-- Check for orphaned stocks (should be 0)
SELECT COUNT(*) FROM custom_watchlist_stocks cs
LEFT JOIN custom_watchlists cw ON cs.watchlist_id = cw.id
WHERE cw.id IS NULL;

-- Verify notification logs
SELECT channel, status, COUNT(*)
FROM notification_log
GROUP BY channel, status;
```

---

## Security Testing

### Test API Authentication (if implemented)

```bash
# Try accessing protected endpoint without auth
curl http://localhost:3001/api/settings/brokers

# Should return 401 Unauthorized
```

### Test Input Validation

```bash
# Try creating watchlist with invalid data
curl -X POST http://localhost:3001/api/watchlist \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "description": "Test"
  }'

# Expected: 400 Bad Request with validation error
```

### Test SQL Injection Prevention

```bash
# Try SQL injection in stock symbol
curl -X POST http://localhost:3001/api/watchlist/1/stocks \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "RELIANCE'; DROP TABLE custom_watchlists; --",
    "exchange": "NSE",
    "entryPrice": 2500,
    "stopLoss": 2400,
    "target1": 2600
  }'

# Expected: Properly escaped, no SQL execution
```

---

## Environment Variable Testing

### Required Variables

Create `.env` file in backend directory:

```env
# Database
DATABASE_PATH=./data/market-screener.db

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=alerts@yourdomain.com

# OR Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS & WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Server
PORT=3001
NODE_ENV=development
```

### Test Missing Variables

1. Remove `SENDGRID_API_KEY`
2. Restart backend
3. Verify: Email service disabled, but app still runs
4. Check logs: Warning about missing email config

---

## Troubleshooting Common Issues

### Issue: Custom watchlist stocks not monitored

**Solution**:
1. Check watchlist is active: `isActive = true`
2. Check stock status is `PENDING`
3. Verify Live Monitoring Service initialized
4. Check market hours (monitoring only during market hours)
5. Review backend logs for errors

### Issue: Notifications not received

**Solution**:
1. Check notification settings in Settings page
2. Verify channel is enabled and configured
3. Test individual channel using Test button
4. Check notification logs in database
5. Verify environment variables are set
6. Check third-party service status (SendGrid, Twilio, Telegram)

### Issue: Broker adapter errors

**Solution**:
1. Verify broker credentials are correct
2. Check API key permissions
3. Ensure access token is not expired
4. Review broker adapter logs
5. Test authentication separately
6. Check broker API status

### Issue: Frontend not connecting to backend

**Solution**:
1. Verify backend is running on port 3001
2. Check CORS configuration
3. Verify API_BASE_URL in frontend
4. Check browser console for errors
5. Verify network requests in DevTools

---

## Continuous Integration Testing

### GitHub Actions Workflow

Create `.github/workflows/test.yml`:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Build
        run: |
          cd backend && npm run build
          cd ../frontend && npm run build

      - name: Run E2E tests
        run: |
          cd backend && npx ts-node src/tests/e2e.test.ts
```

---

## Production Deployment Verification

Before deploying to production:

- [ ] All E2E tests pass
- [ ] All notification channels tested
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Broker credentials encrypted
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit passed

---

## Next Steps

After successful testing:

1. **Deploy to Cloud Run** (see `CLOUD_RUN_DEPLOYMENT.md`)
2. **Set up monitoring** (Cloud Monitoring, error tracking)
3. **Configure alerts** (uptime, error rate, performance)
4. **Enable auto-scaling** based on traffic
5. **Set up CI/CD** for automated deployments
6. **Implement logging aggregation**
7. **Configure backup automation**

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
