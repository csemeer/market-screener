# AlphaStream v1.1 User Guide
## Stream Alpha. Trade Smarter.

Welcome to **AlphaStream v1.1** - Your comprehensive stock market analysis and trading signal platform. This guide will help you master all the features and get the most out of the platform.

---

## 📋 Table of Contents

1. [What's New in v1.1](#whats-new-in-v11)
2. [Getting Started](#getting-started)
3. [Dashboard Overview](#dashboard-overview)
4. [Signals Hub - NEW! ⚡](#signals-hub---new-)
5. [Custom Watchlist](#custom-watchlist)
6. [Stock Screener](#stock-screener)
7. [Risk Calculator](#risk-calculator)
8. [Settings & Configuration](#settings--configuration)
9. [Tips & Best Practices](#tips--best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🎉 What's New in v1.1

### Major Improvements:
- **✅ Unified Signals Hub** - All scanning features now in one place (Live Scan, Auto Scan, EOD Scan)
- **✅ Unified Watchlist System (Phase 4)** - Single watchlist with source tracking (🤖 Auto-Scan, ✋ Manual, 🔍 Screener)
- **✅ Source Badges** - Know where each stock came from with visual indicators and metadata tooltips
- **✅ Smart Filtering** - Filter watchlist stocks by source type with real-time counts
- **✅ Toast Notifications** - Real-time feedback for all actions (no more silent errors!)
- **✅ Simplified Navigation** - Reduced from 9 to 6 main menu items for better UX
- **✅ Backward Compatibility** - Old URLs still work and redirect to new pages
- **✅ Enhanced Error Handling** - Clear error messages and recovery options
- **✅ Professional UI/UX** - Market-standard interface design

### Technical Enhancements:
- Unified watchlist architecture eliminates dual-system confusion
- Consolidated 1,500+ lines of duplicate code
- Improved performance and reliability
- Better mobile responsiveness
- Comprehensive testing and deployment guides

---

## 🚀 Getting Started

### First Time Setup

1. **Navigate to Settings** (⚙️ icon in top navigation)
2. **Configure Market Data Sources**:
   - Choose your preferred provider (Yahoo Finance, Alpha Vantage, etc.)
   - Enter API keys if required
3. **Set Trading Preferences**:
   - Default risk percentage (1-5% recommended)
   - Preferred timeframes (Intraday, Swing, EOD)
4. **Optional: Enable Notifications**:
   - Telegram bot integration
   - Email alerts
   - SMS notifications

### Navigation Quick Reference

```
📊 Dashboard   → Market overview and watchlist summary
⚡ Signals     → Live/Auto/EOD scanning for trade signals
📋 Watchlist   → Custom stock tracking with price alerts
🔍 Screener    → Filter stocks by technical/fundamental criteria
🧮 Risk Calc   → Position sizing calculator
⚙️ Settings    → Configure data sources, notifications, brokers
```

---

## 📊 Dashboard Overview

The **Dashboard** is your command center showing:

### Market Indices (Top Cards)
- **NIFTY 50**: Indian stock market benchmark
- **SENSEX**: Bombay Stock Exchange index
- **BANK NIFTY**: Banking sector performance

Each card displays:
- Current price
- Daily change (₹ and %)
- Color-coded trend (🟢 Green = Up, 🔴 Red = Down)

### Your Watchlist Summary
- Top 5 stocks from your custom watchlist
- Entry price, current price, target, stop loss
- Risk-reward ratio (RRR)
- Status indicators (Near Target, Stop Hit, etc.)

### Quick Actions
- 🔄 **Refresh Data** - Update all prices
- ➕ **Add to Watchlist** - Quick add stocks
- 📈 **View All** - Navigate to full watchlist

---

## ⚡ Signals Hub - NEW!

The **Signals Hub** is the heart of AlphaStream v1.1, consolidating all scanning features into one unified interface.

### Three Powerful Tabs:

#### 1️⃣ Live Scan (Intraday & Swing)
**Purpose**: Real-time scanning for immediate trading opportunities

**How to Use**:
1. Click **Signals** in top navigation
2. Select **Live Scan** tab
3. Choose scan type:
   - **Intraday**: 5-15 minute timeframes (day trading)
   - **Swing**: Daily timeframes (multi-day positions)
4. Click **▶️ Start Scan** button
5. Review results in real-time

**What You Get**:
- Live stock signals with confidence scores
- Entry price, target, stop loss levels
- Technical indicators (RSI, MACD, Moving Averages)
- Risk-reward ratios
- Visual chart analysis

**Actions**:
- **👁️ View Details** - See full stock analysis
- **➕ Add to Watchlist** - Save for tracking
- **🔄 Refresh** - Update scan results

**Best For**: Active traders monitoring intraday movements

---

#### 2️⃣ Auto Scan (Scheduled Scanning)
**Purpose**: Automated scanning at pre-configured times

**How to Use**:
1. Go to **Settings → Auto Scan** tab
2. Configure schedule:
   - **Time Slots**: Add multiple scan times (e.g., 9:30 AM, 3:00 PM)
   - **Strategies**: Choose scanning strategies (Momentum, Breakout, Mean Reversion)
   - **Filters**: Set minimum volume, price range, sector preferences
3. Enable **Auto Scan** toggle
4. Return to **Signals → Auto Scan** tab to view results

**What You Get**:
- Scheduled scan results from all configured time slots
- Historical scan archive (last 30 days)
- Notification delivery (if enabled)
- Confidence-sorted results

**Actions**:
- **📋 View History** - See past scan results
- **⚙️ Configure** - Jump to settings
- **🔔 Manage Alerts** - Set notification preferences

**Best For**: Busy traders who want automated signal delivery

---

#### 3️⃣ EOD Scan (End-of-Day Analysis)
**Purpose**: Deep analysis after market close for next-day planning

**How to Use**:
1. Select **EOD Scan** tab in Signals Hub
2. View today's scan results (auto-runs after market close)
3. Filter by:
   - Confidence level (High/Medium/Low)
   - Strategy type
   - Sector
4. Click **▶️ Run EOD Scan Now** to manually trigger

**What You Get**:
- Comprehensive daily analysis of 200+ stocks
- Multi-timeframe confluence signals
- Fundamental + technical screening
- Next-day trade plans
- Swing trading opportunities

**Actions**:
- **📊 Detailed Analysis** - Full report with charts
- **📥 Export CSV** - Download results for analysis
- **➕ Bulk Add to Watchlist** - Add multiple stocks

**Best For**: Position traders and swing traders planning next-day entries

---

### 🔔 Toast Notifications in Signals Hub

You'll see helpful notifications for:
- ✅ **"Live scan started successfully"** (green)
- ⚠️ **"No signals found. Try adjusting filters."** (yellow)
- ❌ **"Failed to start scan. Check your internet connection."** (red)
- ✅ **"RELIANCE added to watchlist!"** (green)

---

## 📋 Custom Watchlist

Track your favorite stocks with detailed monitoring, price alerts, and **source tracking** to know where each stock came from.

### 🆕 Unified Watchlist System (Phase 4)

**What's New**: AlphaStream now uses a **unified watchlist system** that combines auto-generated signals and manually added stocks in one place. Each stock is tagged with its source:

- 🤖 **Auto-Scan**: Automatically added from EOD/Live scans
- ✋ **Manual**: Manually added by you
- 🔍 **Screener**: Added from custom screener results

**Why It Matters**: No more confusion between "EOD Watchlist" and "Custom Watchlist". Everything is unified with clear origin tracking!

### Creating a Watchlist

1. Navigate to **Watchlist** in top menu
2. Click **➕ Create Watchlist**
3. Enter:
   - **Name**: e.g., "Tech Momentum"
   - **Description**: Optional notes
4. Click **Create** → ✅ "Watchlist created successfully!"

### Adding Stocks

**Method 1: Manual Entry**
1. Select watchlist from sidebar
2. Click **➕ Add Stock**
3. Enter details:
   - **Symbol**: Stock ticker (e.g., RELIANCE, TCS)
   - **Exchange**: NSE or BSE
   - **Entry Price**: Your planned entry
   - **Target**: Profit target price
   - **Stop Loss**: Risk management level
   - **Quantity**: Number of shares
4. Click **Add Stock** → ✅ "RELIANCE added to watchlist!"
   - ✋ **Source**: Automatically marked as "Manual"

**Method 2: From Signals Hub (Auto-Scan Source)**
1. Find a signal in Live/Auto/EOD scan
2. Click **➕ Add to Watchlist**
3. Select target watchlist
4. Prices auto-filled from signal
5. Click **Add** → ✅ Toast confirmation
   - 🤖 **Source**: Automatically marked as "Auto-Scan" with metadata (confidence, strategy, R:R)

**Method 3: From Screener (Screener Source)**
1. Run custom screener
2. Select stocks from results
3. Click **Add to Watchlist**
4. Choose target watchlist
5. → ✅ "Stocks added successfully!"
   - 🔍 **Source**: Automatically marked as "Screener" with criteria metadata

### 🎯 Filtering by Source

**New Feature**: Filter stocks by their source type!

1. Select a watchlist with multiple sources
2. Look for the **Filter by source** dropdown
3. Choose:
   - **All Sources** (default)
   - **🤖 Auto-Scan** - Only auto-generated signals
   - **✋ Manual** - Only manually added stocks
   - **🔍 Screener** - Only screener results
4. Count badges show: "Auto-Scan (15) | Manual (8) | Screener (3)"
5. Click **Clear filter** to reset

**Use Case**:
- View only auto-scan signals to focus on algorithmic setups
- View only manual entries to review your personal picks
- Mix and match sources in one unified list!

### 🏷️ Source Badges & Metadata

**Visual Indicators**: Each stock shows a colored badge indicating its source:

- 🤖 **Auto-Scan Badge** (Blue)
  - **Hover to see**: Strategy name, confidence %, risk:reward ratio, scan time
  - **Example**: "Auto-Scan: Momentum Breakout (85% confidence), R:R 2.5:1"

- ✋ **Manual Badge** (Green)
  - **Hover to see**: "Manually added by user"
  - Simple indicator for your personal picks

- 🔍 **Screener Badge** (Purple)
  - **Hover to see**: Screener criteria, RSI, volume, market cap
  - **Example**: "Screener: Breakout + High Volume, RSI 68"

**Rich Tooltips**: Hover over any source badge to see detailed metadata in a popup:
- Color-coded confidence scores (green = high, yellow = medium, red = low)
- Strategy details and technical parameters
- Scan timestamp for auto-scan sources

### Managing Stocks

**Edit Stock**:
- Click **✏️ Edit** icon on stock row
- Update prices, quantity, notes
- Source remains unchanged (preserves origin)
- Click **Save** → ✅ "Stock updated successfully!"

**Delete Stock**:
- Click **🗑️ Delete** icon
- Confirm deletion
- → ✅ "Stock removed from watchlist"

**Price Alerts**:
- Auto-configured for auto-scan stocks
- Manually set for your entries
- Multi-channel notifications (Telegram, Email, SMS)

### Watchlist Metrics

Each stock shows:
- **Source Badge**: 🤖/✋/🔍 with metadata tooltip
- **Current Price**: Live market price (color-coded)
- **P&L**: Profit/Loss from entry (₹ and %)
- **RRR**: Risk-Reward Ratio (Target-Entry / Entry-Stop)
- **Status**: Near Target, Stop Hit, In Range

### Bulk Operations

- **📥 Import CSV**: Upload stocks from spreadsheet
- **📤 Export CSV**: Download watchlist for backup
- **🗑️ Clear All**: Remove all stocks (with confirmation)

---

## 🔍 Stock Screener

Filter 5,000+ stocks by technical and fundamental criteria.

### How to Use the Screener

1. Click **Screener** in top navigation
2. Set your criteria:

   **Price Filters**:
   - Minimum Price: ₹50 (avoid penny stocks)
   - Maximum Price: ₹5,000 (exclude extreme outliers)

   **Technical Filters**:
   - RSI: 30-70 (avoid overbought/oversold)
   - Volume: > 100,000 shares
   - 52-Week High/Low: % from high/low

   **Fundamental Filters**:
   - Market Cap: Small/Mid/Large cap
   - P/E Ratio: Valuation metric
   - Debt-to-Equity: Financial health

   **Index Selection**:
   - NIFTY 50, NIFTY 500, NIFTY BANK
   - Sector indices (IT, Pharma, Auto, etc.)

3. Click **🔍 Run Screener**

### Using Presets

**Quick Start with Presets**:
1. Click **Presets** dropdown
2. Select:
   - **Momentum Breakout**: High momentum stocks
   - **Value Investing**: Undervalued fundamentals
   - **High Volume**: Liquidity focus
   - **Low Volatility**: Stable stocks
3. Click preset → ✅ "Applied 'Momentum Breakout' preset"
4. Adjust criteria if needed
5. Run screener

**Saving Custom Presets**:
1. Configure your ideal criteria
2. Click **💾 Save as Preset**
3. Name it (e.g., "My Tech Stocks")
4. → ✅ "Preset saved successfully!"

### Interpreting Results

Results table shows:
- **Symbol & Exchange**: Stock identifier
- **Company Name**: Full name
- **Price**: Current market price
- **Change %**: Daily movement
- **Volume**: Trading activity
- **RSI**: Momentum indicator (14-period)
- **Market Cap**: Company size

**Color Coding**:
- 🟢 Green: Positive change
- 🔴 Red: Negative change

### Exporting Results

1. After running screener
2. Click **📤 Export CSV**
3. → ✅ "Screener results exported!"
4. Find file in Downloads folder

---

## 🧮 Risk Calculator

Calculate optimal position sizing to manage risk.

### How to Use

1. Navigate to **Risk Calculator**
2. Enter your parameters:

   **Account Details**:
   - **Capital**: Total trading capital (₹100,000)
   - **Risk %**: Risk per trade (1-2% recommended)

   **Trade Setup**:
   - **Entry Price**: Planned buy price (₹500)
   - **Stop Loss**: Risk management level (₹480)

3. Click **Calculate**

### Understanding Results

**Position Size**: Number of shares to buy
```
Formula: (Capital × Risk%) / (Entry - Stop Loss)
Example: (₹100,000 × 2%) / (₹500 - ₹480) = 100 shares
```

**Total Investment**: Entry Price × Position Size
```
Example: ₹500 × 100 = ₹50,000
```

**Risk Amount**: Maximum loss if stop hit
```
Example: (₹500 - ₹480) × 100 = ₹2,000 (2% of capital)
```

**Reward at Target**: Profit if target reached
```
Example: (₹550 - ₹500) × 100 = ₹5,000
```

**Risk-Reward Ratio (RRR)**:
```
Example: ₹5,000 / ₹2,000 = 2.5:1 (Excellent!)
```

### Risk Management Tips

✅ **Good Practices**:
- Risk 1-2% per trade (beginners: 0.5-1%)
- Minimum RRR of 2:1 (reward ≥ 2× risk)
- Never risk more than 5% on single trade
- Account for brokerage (0.1-0.3%)

❌ **Avoid**:
- Risking >5% per trade (gambling)
- Trades with RRR < 1:1 (negative expectancy)
- Ignoring stop losses (hope trading)

---

## ⚙️ Settings & Configuration

Customize AlphaStream to your trading style.

### 1️⃣ Market Data Tab

**Data Source Configuration**:
- **Provider**: Yahoo Finance (free), Alpha Vantage, EOD Historical Data
- **API Key**: Enter if required by provider
- **Update Frequency**: Real-time, 1-min, 5-min, 15-min
- **Data Quality**: Premium vs Free tier differences

**Test Connection**: Click to verify API working
- ✅ "Market data connection successful!"
- ❌ "Failed to connect. Check API key."

---

### 2️⃣ Notifications Tab

**Channel Setup**:

**Telegram**:
1. Create bot via @BotFather
2. Get bot token and chat ID
3. Enter credentials
4. Click **Test** → ✅ "Test message sent to Telegram!"
5. Enable toggle

**Email**:
1. Enter SMTP server details (Gmail, Outlook, etc.)
2. Sender email and password
3. Recipient email list
4. Click **Test** → ✅ "Test email sent successfully!"

**SMS** (Twilio):
1. Enter Twilio Account SID
2. Auth Token and Phone Number
3. Recipient phone numbers
4. Test → ✅ "Test SMS sent!"

**WhatsApp** (Twilio):
1. Similar to SMS setup
2. Use WhatsApp-enabled Twilio number
3. Test connection

**Webhook**:
- Custom URL for system integrations
- JSON payload format
- Useful for Discord, Slack, custom apps

**Notification Preferences**:
- ✅ High confidence signals only
- ✅ Price alerts (target/stop hit)
- ✅ Daily EOD scan summary
- ❌ Every intraday signal (can be noisy)

---

### 3️⃣ Auto Scan Tab

**Schedule Configuration**:

**Add Time Slot**:
1. Click **➕ Add Time Slot**
2. Select time (e.g., 09:30 AM)
3. Choose strategy:
   - Momentum Breakout
   - Mean Reversion
   - Trend Following
4. Click **Add** → ✅ "Scan time added!"

**Strategies Explained**:
- **Momentum Breakout**: Stocks breaking resistance with volume
- **Mean Reversion**: Oversold/overbought reversals
- **Trend Following**: Riding established trends

**Filters**:
- Minimum Volume: 100,000 shares (liquidity)
- Price Range: ₹50-₹5,000 (avoid penny stocks)
- Sectors: IT, Banking, Pharma, etc. (or All)
- Minimum Confidence: 70% (quality over quantity)

**Enable Auto Scan**: Toggle to activate
- ✅ "Auto scan enabled! Next scan at 09:30 AM"

**Manual Trigger**: Click **▶️ Run Now** to test
- ✅ "Auto scan completed! Found 12 signals."

---

### 4️⃣ Broker Integration Tab

**Supported Brokers**:
- Zerodha (India)
- Upstox (India)
- AngelOne (India)
- Interactive Brokers (Global)
- Alpaca (US)

**Setup Process**:
1. Select broker from dropdown
2. Enter API credentials:
   - API Key
   - Secret Key
   - Access Token (if required)
3. Click **Test Connection**
   - ✅ "Connected to Zerodha successfully!"
4. Enable **Auto-Trade** (optional, use with caution)

**Trading Parameters** (Phase 4):
- Maximum position size per trade
- Maximum concurrent positions
- Trading hours (9:15 AM - 3:30 PM IST)
- Slippage tolerance (0.1-0.5%)

⚠️ **Important**: Auto-trading executes real orders. Start with paper trading to test strategies.

---

## 💡 Tips & Best Practices

### For Beginners

1. **Start with Dashboard**:
   - Familiarize yourself with market indices
   - Watch how prices move throughout the day

2. **Use Presets in Screener**:
   - Don't overwhelm yourself with custom criteria
   - Start with "Momentum Breakout" or "Value Investing"

3. **Risk Only 1% Per Trade**:
   - Use Risk Calculator religiously
   - Never skip stop losses

4. **Enable Notifications Wisely**:
   - Start with high confidence signals only
   - Avoid notification fatigue

5. **Paper Trade First**:
   - Track signals in watchlist without real money
   - Build confidence before live trading

---

### For Experienced Traders

1. **Leverage Auto Scan**:
   - Set up 3-4 scan times throughout trading day
   - Different strategies for different market conditions

2. **Multi-Timeframe Analysis**:
   - Use Live Scan (intraday) + EOD Scan (swing)
   - Confirm signals across timeframes

3. **Custom Screener Presets**:
   - Build strategy-specific screening criteria
   - Save as presets for quick execution

4. **Watchlist Organization**:
   - Create multiple watchlists by strategy:
     - "Intraday Momentum"
     - "Swing Breakouts"
     - "Long-term Holdings"

5. **Backtesting**:
   - Review historical EOD scan results
   - Calculate win rate and expectancy

---

### Professional Workflow Example

**Morning Routine (9:00 AM)**:
1. Check Dashboard → Market gap up/down?
2. Review Auto Scan results from 9:15 AM slot
3. Add high confidence signals to "Today's Trades" watchlist
4. Set price alerts for entry levels

**Intraday Monitoring (10:00 AM - 3:00 PM)**:
1. Watch Live Scan for new signals
2. Monitor watchlist for price alerts
3. Use Risk Calculator before each entry
4. Update stop losses as trade progresses

**Evening Review (6:00 PM)**:
1. Check EOD Scan results
2. Plan tomorrow's trades
3. Update swing trading watchlist
4. Review P&L and journal trades

---

## 🛠️ Troubleshooting

### Common Issues

#### ❌ "Failed to load market data"
**Solutions**:
1. Check internet connection
2. Go to Settings → Market Data → Test Connection
3. Verify API key is correct
4. Check if you exceeded API rate limits (wait 1 minute)
5. Try switching to different data provider

---

#### ❌ "No signals found" after scan
**Reasons**:
1. Filters too strict (e.g., RSI 45-55 is narrow)
2. Low market volatility day
3. Wrong time (scan outside market hours)

**Solutions**:
1. Relax criteria (widen RSI range to 30-70)
2. Try different strategy (Momentum → Mean Reversion)
3. Check if market is open (9:15 AM - 3:30 PM IST)

---

#### ❌ "Add to Watchlist failed"
**Solutions**:
1. Check if watchlist exists
2. Verify stock symbol and exchange
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check browser console for errors (F12)
5. Restart backend server if self-hosted

---

#### ⚠️ Chart not displaying
**Solutions**:
1. Refresh page (Ctrl+R)
2. Check if historical data available for symbol
3. Verify date range (not too old, e.g., > 1 year)
4. Try different exchange (NSE ↔ BSE)
5. Check browser console for TradingView Lightweight Charts errors

---

#### ⚠️ Notifications not working
**Solutions**:
1. Go to Settings → Notifications
2. Click **Test** button for each channel
3. Check credentials (bot token, API keys)
4. For Telegram: Verify chat ID (use @userinfobot)
5. For Email: Check spam folder
6. Enable notifications in Settings → Auto Scan

---

#### ❌ "API rate limit exceeded"
**Solutions**:
1. Wait 1-5 minutes before retrying
2. Reduce scan frequency in Settings
3. Upgrade to premium data provider
4. Use caching (enable in Settings → Market Data)

---

### Getting Help

**Documentation**:
- `docs/TESTING_AND_DEPLOYMENT_GUIDE.md` - Technical setup
- `docs/UNIFIED_WATCHLIST_ARCHITECTURE.md` - Future features roadmap
- `docs/REFACTORING_PLAN.md` - Version history

**GitHub Issues**:
- Report bugs: [Your GitHub Repo URL]/issues
- Feature requests welcome!

**Community**:
- Discord server: [Link if available]
- Telegram group: [Link if available]

---

## 🎯 Next Steps

Now that you're familiar with AlphaStream v1.1, here's how to level up:

1. **Week 1: Learn the Interface**
   - Explore each page
   - Try all features with demo data
   - Set up notifications

2. **Week 2: Build Your Strategy**
   - Create custom screener presets
   - Configure auto scan schedules
   - Backtest signals from EOD scan history

3. **Week 3: Paper Trading**
   - Track signals in watchlist
   - Use Risk Calculator for every trade
   - Journal results (win rate, RRR, expectancy)

4. **Week 4: Go Live (Optional)**
   - Start with small position sizes
   - Risk only 0.5-1% per trade
   - Review and adjust weekly

---

## 📈 Coming Soon (Phase 4-5)

- **Unified Watchlist System**: Source tracking (Manual vs Auto Scan vs Screener)
- **Advanced Price Alerts**: Multi-condition alerts with smart notifications
- **Broker Auto-Execution**: One-click trade execution
- **Backtesting Engine**: Test strategies on historical data
- **Portfolio Analytics**: P&L tracking, win rate, expectancy analysis
- **Mobile App**: iOS and Android support

---

## 📄 Disclaimer

**AlphaStream is for educational purposes only.**

- Not financial advice
- Past performance ≠ future results
- Trading involves risk of loss
- Do your own research (DYOR)
- Consult a financial advisor before trading
- Use stop losses and risk management

---

## 🙏 Thank You

Thank you for using **AlphaStream v1.1**! We hope this guide helps you make smarter trading decisions.

**Happy Trading! 📊✨**

---

**AlphaStream v1.1** - Stream Alpha. Trade Smarter.
*Last Updated: December 2024*
