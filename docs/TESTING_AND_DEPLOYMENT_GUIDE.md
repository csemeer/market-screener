# AlphaStream v1.1 - Testing & Deployment Guide

**Version**: 1.1
**Created**: 2025-12-31
**Status**: Production Ready
**Related Docs**: `REFACTORING_PLAN.md`, `UNIFIED_WATCHLIST_ARCHITECTURE.md`

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [End-to-End Testing Procedures](#end-to-end-testing-procedures)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Performance Testing](#performance-testing)
6. [Production Deployment](#production-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality ✅

- [x] Frontend TypeScript compilation clean (`npm run build`)
- [x] Backend TypeScript compilation clean (`npx tsc --noEmit`)
- [x] No unused imports or variables
- [x] All deprecated files removed
- [x] Toast notifications implemented across all pages
- [x] Backward-compatible routes configured

### Documentation ✅

- [x] Refactoring plan documented
- [x] Architecture diagrams created
- [x] API endpoints documented
- [x] Environment variables documented
- [x] User guides created

### Dependencies ✅

```bash
# Frontend
cd frontend && npm install
# Check for vulnerabilities
npm audit

# Backend
cd backend && npm install
# Check for vulnerabilities
npm audit
```

---

## Environment Setup

### 1. Backend Configuration

**Create `.env` file** in `backend/` directory:

```bash
cd backend
cp .env.example .env
```

**Minimal Configuration** (for local testing):

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./data/market-screener.db

# Telegram (easiest free notification option)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_DEFAULT_CHAT_ID=your_chat_id_here

# Feature Flags
ENABLE_NOTIFICATIONS=true
ENABLE_LIVE_MONITORING=true
ENABLE_AUTO_SCAN=true

# Logging
LOG_LEVEL=info
```

**Full Production Configuration**: See `.env.example` for all available options

### 2. Frontend Configuration

**Create `.env` file** in `frontend/` directory:

```bash
cd frontend
# Create .env file
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

### 3. Database Initialization

```bash
# Backend will auto-create database on first run
cd backend
npm run dev

# Check database file created
ls -lh data/market-screener.db
```

---

## End-to-End Testing Procedures

### Test Suite 1: Navigation & Routing ✅

**Objective**: Verify all routes work and redirect properly

```
Test 1.1: Main Navigation
□ Visit http://localhost:5173
□ Click "Dashboard" → Should load /dashboard
□ Click "Signals" → Should load /signals
□ Click "Watchlist" → Should load /watchlist
□ Click "Screener" → Should load /screener
□ Click "Risk Calc" → Should load /risk-calculator
□ Click "Settings" → Should load /settings

Test 1.2: Backward-Compatible Routes
□ Visit http://localhost:5173/autoscan → Should redirect to /signals (Auto Scan tab)
□ Visit http://localhost:5173/intraday → Should redirect to /signals (Live Scan tab)
□ Visit http://localhost:5173/swing → Should redirect to /signals (Live Scan tab)
□ Visit http://localhost:5173/eod → Should load EOD Dashboard

Test 1.3: Mobile Navigation
□ Resize browser to mobile width (375px)
□ Click hamburger menu → Should expand menu
□ Click menu item → Should navigate and close menu
□ Verify all 6 menu items visible
```

**Expected Results:**
- All routes load without errors
- No 404 pages
- Old scanner URLs redirect to SignalsHub
- Mobile menu works smoothly

---

### Test Suite 2: Signals Hub Functionality ⚡

**Objective**: Verify unified signals page works correctly

```
Test 2.1: Auto Scan Tab
□ Navigate to /signals
□ Default tab should be "Auto Scan"
□ Verify scan results display (if available)
□ Click "All" / "Intraday" / "Swing" filters
□ Toggle "Auto-Refresh" → Should show ON/OFF
□ Click "Refresh Now" → Should reload data
□ Click strategy card → Should expand/collapse
□ Click stock card → Should open evidence modal
□ In modal, click "Add to Watchlist" → Should show toast notification ✅

Test 2.2: Live Scan Tab
□ Click "Live Scan" tab
□ Toggle Intraday/Swing → UI should update
□ Select markets (NSE, NYSE, etc.) → Checkboxes work
□ Select filter (All, Buy, Sell, etc.) → Dropdown works
□ Click "Scan Now" → Should trigger scan and show toast ✅
□ Verify signal cards display with all data
□ Check risk:reward ratios are calculated correctly

Test 2.3: Custom Screener Tab
□ Click "Custom Screener" tab
□ Should redirect to /screener page
□ Verify screener page loads properly
```

**Expected Results:**
- All 3 tabs functional
- Data loads without errors
- Filters work correctly
- Toast notifications appear on success/error
- No console errors

---

### Test Suite 3: Custom Watchlist 📋

**Objective**: Verify watchlist management with toast notifications

```
Test 3.1: Create Watchlist
□ Navigate to /watchlist
□ Click "+ Create Watchlist" button
□ Enter name and description
□ Click "Create" → Should show toast: "✅ Watchlist created successfully!" ✅
□ New watchlist appears in sidebar

Test 3.2: Add Stock to Watchlist
□ Select a watchlist from sidebar
□ Click "+ Add Stock" button
□ Enter symbol (e.g., AAPL), select exchange (NYSE)
□ Click "Analyze Stock" (if implemented) → Should show toast ✅
□ Fill entry/target/stop prices
□ Click "Add Stock" → Should show toast: "✅ AAPL added to watchlist!" ✅
□ Stock appears in table

Test 3.3: Edit Stock
□ Click "Edit" on a stock row
□ Modify entry price
□ Click "Save" → Should show toast: "✅ AAPL updated successfully!" ✅
□ Verify changes persist

Test 3.4: Delete Stock
□ Click "Remove" on a stock row
□ Confirm deletion
□ Should show toast: "✅ Stock removed from watchlist" ✅
□ Stock removed from table

Test 3.5: Delete Watchlist
□ Click "Delete" on watchlist
□ Confirm deletion
□ Should show toast: "✅ Watchlist deleted successfully" ✅
□ Watchlist removed from sidebar
```

**Expected Results:**
- All CRUD operations work
- Toast notifications appear for every action
- No alert() popups
- Data persists in database

---

### Test Suite 4: Settings Page 🔧

**Objective**: Verify settings persistence and notifications

```
Test 4.1: Notification Settings
□ Navigate to /settings
□ Click "Notifications" tab
□ Enable Telegram notifications
□ Enter bot token and chat ID
□ Click "Send Test Message" → Should show toast ✅
□ Check Telegram for test message
□ Click "Save Settings" → Should show toast: "✅ Notification settings saved successfully!" ✅
□ Refresh page → Settings should persist

Test 4.2: Broker Settings
□ Click "Brokers" tab
□ Click "+ Add Broker"
□ Select broker (Upstox)
□ Enter account ID and API key
□ Click "Add Account" → Should show toast: "✅ Broker account added successfully!" ✅
□ Account appears in list
□ Toggle "Auto-trade" → Should show toast ✅
□ Click "Delete" → Should show toast ✅

Test 4.3: Trading Parameters
□ Click "Trading" tab
□ Modify position size percentage
□ Change max open positions
□ Click "Save Parameters" → Should show toast: "✅ Trading parameters saved successfully!" ✅
□ Refresh page → Parameters should persist
```

**Expected Results:**
- All settings save properly
- Test buttons work
- Toast notifications for all actions
- No hidden success messages

---

### Test Suite 5: Screener Functionality 🔍

**Objective**: Verify screener with toast notifications

```
Test 5.1: Run Basic Screener
□ Navigate to /screener
□ Select markets (NSE, NYSE)
□ Click "Run Screener" → Should show toast: "✅ Found X stocks matching your criteria" ✅
□ Results display in table/cards
□ If no results → Should show toast: "🔍 No stocks match your criteria" ⚠️

Test 5.2: Apply Preset
□ Select a preset (e.g., Momentum)
□ Should show toast: "✅ Applied 'Momentum' preset" ✅
□ Criteria should populate
□ Run screener → Should return results

Test 5.3: Custom Filters
□ Set price range (min: 100, max: 500)
□ Set RSI range (min: 30, max: 70)
□ Enable volume breakout
□ Run screener → Should show results or toast

Test 5.4: Error Handling
□ Select no markets
□ Run screener → Should show toast: "❌ Failed to run screener" ✅
□ Check console for details
```

**Expected Results:**
- Screener returns results
- Toast notifications for success/error/warning
- Filters work correctly
- CSV export functional (if implemented)

---

### Test Suite 6: Dashboard Overview 📊

**Objective**: Verify dashboard loads and displays data

```
Test 6.1: Dashboard Cards
□ Navigate to /dashboard
□ Verify 4 stat cards display:
  - Markets: 4 (NSE, BSE, NYSE, NASDAQ)
  - Live Signals: X (dynamic)
  - Strong Buys: X (80%+ confidence)
  - Avg Confluence: X%
□ Data should be real or placeholder

Test 6.2: Quick Actions
□ Verify 4 quick action cards display
□ Click "Momentum Stocks" → Should link to /screener?preset=momentum
□ Click "Value Opportunities" → Should link to screener
□ All links functional

Test 6.3: Signal Lists
□ Scroll down to "Latest Intraday Signals"
□ Verify signals display (if available)
□ Scroll to "Top Swing Opportunities"
□ Verify signals display
□ Links should go to stock detail or signals hub
```

**Expected Results:**
- Dashboard loads quickly (<2s)
- All stat cards display
- Links work correctly
- No console errors

---

### Test Suite 7: Backend Integration 🔗

**Objective**: Verify backend API endpoints

```
Test 7.1: Health Check
□ Visit http://localhost:3001/api/health
□ Should return: {"status": "healthy", "timestamp": "..."}

Test 7.2: Dashboard API
□ Test GET /api/dashboard/scan-results?hours=24
□ Should return grouped scan results
□ Test GET /api/dashboard/active-signals
□ Should return active signals

Test 7.3: Screener API
□ Test POST /api/screener/intraday {"markets": ["NSE"]}
□ Should return signals array
□ Test POST /api/screener/swing {"markets": ["NYSE"]}
□ Should return signals array

Test 7.4: Watchlist API
□ Test GET /api/watchlist
□ Should return user watchlists
□ Test POST /api/watchlist {"name": "Test", "description": "Test"}
□ Should create watchlist

Test 7.5: Settings API
□ Test GET /api/settings/notifications
□ Should return notification settings
□ Test PUT /api/settings/notifications {data}
□ Should update settings
```

**Tools**: Use Postman, curl, or browser DevTools

**Expected Results:**
- All endpoints respond with 200 OK
- Data structures match API spec
- Error handling returns proper status codes

---

## Common Issues & Solutions

### Issue 1: "Failed to load scan results"

**Symptoms**: Auto Scan tab shows no data, error toast appears

**Solutions**:
```bash
# 1. Check backend is running
cd backend && npm run dev

# 2. Verify database exists
ls data/market-screener.db

# 3. Check backend logs
# Look for "Auto-Scan Service initialized successfully"

# 4. Trigger manual scan
curl -X POST http://localhost:3001/api/dashboard/scan-now
```

---

### Issue 2: "Telegram service not configured"

**Symptoms**: Test notification button shows error

**Solutions**:
```bash
# 1. Check .env file has Telegram credentials
cd backend
cat .env | grep TELEGRAM

# 2. Verify bot token format
# Should be: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# 3. Verify chat ID is numeric
# Should be: 123456789 (not username)

# 4. Restart backend
npm run dev
```

---

### Issue 3: Toast notifications not appearing

**Symptoms**: Actions complete but no toast shows

**Solutions**:
```bash
# 1. Check react-hot-toast is installed
cd frontend
npm list react-hot-toast

# 2. Verify Toaster component in App.tsx
grep -n "Toaster" src/App.tsx

# 3. Check browser console for errors
# Open DevTools → Console

# 4. Clear cache and reload
# Ctrl+Shift+R (hard reload)
```

---

### Issue 4: Build errors

**Symptoms**: `npm run build` fails

**Solutions**:
```bash
# 1. Clean install dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# 2. Check TypeScript errors
npm run build 2>&1 | grep "error TS"

# 3. Verify all imports exist
# Check for deleted files still being imported

# 4. Update TypeScript if needed
npm install -D typescript@latest
```

---

### Issue 5: Routes showing 404

**Symptoms**: Clicking navigation shows blank page

**Solutions**:
```bash
# 1. Check React Router configuration
grep -A 5 "Routes" frontend/src/App.tsx

# 2. Verify route paths match exactly
# /signals not /Signals (case sensitive)

# 3. Check for BrowserRouter vs HashRouter
# Should use BrowserRouter for clean URLs

# 4. Restart dev server
cd frontend && npm run dev
```

---

## Performance Testing

### Load Time Benchmarks

| Page | Target | Actual | Status |
|------|--------|--------|--------|
| Landing Page | <1s | TBD | ⏱️ |
| Dashboard | <2s | TBD | ⏱️ |
| Signals Hub | <2s | TBD | ⏱️ |
| Watchlist | <1.5s | TBD | ⏱️ |
| Screener | <2s | TBD | ⏱️ |
| Settings | <1s | TBD | ⏱️ |

**How to Test:**
1. Open Chrome DevTools
2. Go to Network tab
3. Enable "Disable cache"
4. Reload page
5. Check "DOMContentLoaded" time

---

### Bundle Size Analysis

```bash
cd frontend
npm run build

# Check dist/ folder size
du -sh dist/

# Analyze bundle composition
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts and rebuild
```

**Targets:**
- Total bundle: <1.5MB gzipped
- Largest chunk: <500KB
- Code splitting: Implemented

---

## Production Deployment

### Step 1: Build Frontend

```bash
cd frontend

# Production build
npm run build

# Output location: dist/
ls -lh dist/
```

### Step 2: Prepare Backend

```bash
cd backend

# Install production dependencies only
npm ci --production

# Create production .env
cp .env.example .env.production
# Edit .env.production with production credentials
```

### Step 3: Database Setup

```bash
# Create database directory
mkdir -p data

# Set permissions (Linux/Mac)
chmod 755 data/

# Database will be auto-created on first run
```

### Step 4: Deploy to Server

**Option A: Traditional Server (VPS)**

```bash
# 1. Upload files via SCP/SFTP
scp -r frontend/dist/ user@server:/var/www/alphastream/
scp -r backend/ user@server:/opt/alphastream-api/

# 2. Install Node.js on server (v18+)
# 3. Install PM2 for process management
npm install -g pm2

# 4. Start backend with PM2
cd /opt/alphastream-api
pm2 start src/index.ts --name alphastream-api --interpreter ts-node
pm2 save
pm2 startup

# 5. Serve frontend with Nginx
# See nginx.conf.example
```

**Option B: Docker Deployment**

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

**Option C: Cloud Platform (Heroku/Railway/Render)**

```bash
# Example: Heroku deployment
heroku create alphastream-api
heroku addons:create heroku-postgresql
git push heroku main
heroku ps:scale web=1
```

---

## Post-Deployment Verification

### Checklist

```
□ Frontend accessible at production URL
□ Backend API responding (/api/health)
□ Database initialized and accessible
□ Notification service functional
□ Auto-scan service running
□ Live monitoring service active
□ SSL certificate installed (HTTPS)
□ CORS configured properly
□ Environment variables set
□ Logs being captured
□ Monitoring alerts configured
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

API_URL="https://api.alphastream.example.com"

echo "Checking API health..."
curl -f $API_URL/api/health || exit 1

echo "Checking dashboard endpoint..."
curl -f $API_URL/api/dashboard/scan-results?hours=24 || exit 1

echo "All checks passed!"
```

---

## Rollback Procedures

### If Deployment Fails

**Frontend Rollback:**
```bash
# 1. Keep previous dist/ folder as backup
mv dist/ dist-backup/
mv dist-old/ dist/

# 2. Or use git to revert
git checkout v1.0.0 -- frontend/dist/
```

**Backend Rollback:**
```bash
# 1. Stop current version
pm2 stop alphastream-api

# 2. Restore previous version
git checkout v1.0.0
npm ci
pm2 restart alphastream-api

# 3. Verify rollback
curl http://localhost:3001/api/health
```

**Database Rollback:**
```bash
# 1. Restore from backup
cp data/market-screener.db.backup data/market-screener.db

# 2. Or use SQLite backup
sqlite3 data/market-screener.db ".backup data/market-screener-restored.db"
```

---

## Monitoring & Maintenance

### Log Monitoring

```bash
# View backend logs
pm2 logs alphastream-api

# Follow logs
tail -f logs/alphastream.log

# Search for errors
grep -i "error" logs/alphastream.log
```

### Database Maintenance

```bash
# Backup database weekly
sqlite3 data/market-screener.db ".backup data/backup-$(date +%Y%m%d).db"

# Cleanup old scan results (90 days)
curl -X DELETE http://localhost:3001/api/dashboard/cleanup?days=90

# Optimize database
sqlite3 data/market-screener.db "VACUUM;"
```

### Performance Monitoring

- Monitor API response times
- Track database query performance
- Check memory usage
- Monitor disk space
- Set up uptime monitoring (UptimeRobot, Pingdom)

---

## Support & Troubleshooting

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# Check detailed logs
tail -f logs/*.log
```

### Common Diagnostics

```bash
# Check Node version
node --version  # Should be v18+

# Check npm version
npm --version

# Check dependencies
npm list

# Check for port conflicts
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
```

### Getting Help

1. Check logs: `backend/logs/` and browser console
2. Review error messages carefully
3. Search issues: GitHub repository issues
4. Check documentation: `docs/` folder
5. Create issue with logs and steps to reproduce

---

## Success Criteria ✅

**Deployment is successful when:**

- [x] All navigation links work
- [x] All API endpoints respond correctly
- [x] Toast notifications appear for all user actions
- [x] Data persists across page refreshes
- [x] No console errors in browser
- [x] No error logs in backend
- [x] Services start automatically on server reboot
- [x] SSL/HTTPS configured (production)
- [x] Monitoring alerts functional
- [x] Backup strategy implemented

---

**Document Version**: 1.0
**Last Updated**: 2025-12-31
**Maintained By**: AlphaStream Development Team
**Feedback**: Create issue in project repository
