# 📊 Stock Market Screener Pro - Enhanced Edition

A **top-notch, highly accurate** stock market screening and analysis platform for **Indian (NSE/BSE)** and **US (NYSE/NASDAQ)** markets. Built with professional-grade technical analysis, advanced pattern recognition, and multi-indicator confluence scoring for maximum accuracy.

![Markets](https://img.shields.io/badge/Markets-NSE%20%7C%20BSE%20%7C%20NYSE%20%7C%20NASDAQ-blue)
![Tech](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js-green)
![Indicators](https://img.shields.io/badge/Indicators-20%2B-orange)
![Patterns](https://img.shields.io/badge/Patterns-15%2B-purple)

## 🎯 What Makes This Brilliant & Top-Notch

### 🔬 Professional-Grade Technical Analysis
- **20+ Technical Indicators** with industry-standard calculations
- **Wilder's Smoothing for RSI** - More accurate than simple averaging
- **Proper ADX calculation** - Smoothed directional index, not just DX
- **Enhanced Stochastic** - Proper %K and %D calculation with smoothing
- **Advanced Indicators**: OBV, VWAP, Fibonacci, Pivot Points, Supertrend
- **Multi-Indicator Confluence Scoring** - Weighted analysis across all indicators

### 🎯 Accuracy-First Signal Generation
- **Confluence Scoring System**: Each signal rated 0-100% based on:
  - RSI levels (Weight: 10%)
  - MACD histogram strength (Weight: 15%)
  - EMA alignment and trend (Weight: 20%)
  - ADX trend strength (Weight: 15%)
  - Volume confirmation (Weight: 15%)
  - Stochastic momentum (Weight: 10%)
  - Supertrend confirmation (Weight: 10%)
  - VWAP proximity (Weight: 5%)

- **Multiple Confirmations Required**:
  - Volume breakout + Trend confirmation
  - Pattern recognition + Indicator alignment
  - Support/Resistance + Momentum confirmation
  - Multi-timeframe validation

- **Enhanced Signal Strength Calculation**:
  - Base strength adjusted by volume (15-25 points)
  - ADX confirmation adds 10 points
  - MACD confirmation adds 10 points
  - Pattern confirmation adds 5 points
  - High confluence (>70%) adds 5 points
  - **Maximum signal strength capped at 99% for realism**

### 📊 Comprehensive Pattern Recognition (15+ Patterns)

#### Single Candlestick Patterns
- **Doji** - Market indecision
- **Hammer** - Bullish reversal
- **Inverted Hammer** - Bullish reversal
- **Shooting Star** - Bearish reversal
- **Hanging Man** - Bearish reversal
- **Bullish/Bearish Marubozu** - Strong conviction

#### Two-Candlestick Patterns
- **Bullish Engulfing** - Strong bullish reversal
- **Bearish Engulfing** - Strong bearish reversal
- **Piercing Pattern** - Bullish reversal
- **Dark Cloud Cover** - Bearish reversal
- **Tweezer Top/Bottom** - Reversal signals

#### Three-Candlestick Patterns
- **Morning Star** - Strong bullish reversal
- **Evening Star** - Strong bearish reversal
- **Three White Soldiers** - Very strong bullish
- **Three Black Crows** - Very strong bearish

### 🎓 Advanced Technical Indicators

#### Trend Indicators
- **EMA** (9, 20, 50, 200) - Exponential Moving Averages
- **SMA** (20, 50, 200) - Simple Moving Averages
- **ADX** (14) - Trend Strength with proper smoothing
- **Supertrend** - Dynamic trend following

#### Momentum Indicators
- **RSI** (14) - Wilder's smoothing method
- **MACD** (12, 26, 9) - Trend momentum
- **Stochastic** (14, 3, 3) - Properly calculated %K and %D

#### Volatility Indicators
- **Bollinger Bands** (20, 2) - Volatility and extremes
- **ATR** (14) - Average True Range for stop loss

#### Volume Indicators
- **OBV** - On-Balance Volume momentum
- **VWAP** - Volume Weighted Average Price
- **Volume Profile** - Volume ratio analysis

#### Support/Resistance
- **Fibonacci Retracement** - 7 levels (0, 23.6, 38.2, 50, 61.8, 78.6, 100)
- **Pivot Points** - Standard (P, R1-R3, S1-S3)

## 🚀 Key Features

### 📈 Multi-Market Coverage
- **Indian Markets**: NSE, BSE with 24 major stocks
- **US Markets**: NYSE, NASDAQ with 27 major stocks
- Real-time and historical data integration
- Support for multiple timeframes (5m, 15m, 1h, 1d)

### 🎯 Smart Screening Strategies

#### Intraday Scanner (5m/15m)
- **Momentum Detection**: High-probability setups with:
  - Volume > 1.5x average (2.0x for extra strength)
  - RSI in optimal zones (25-75)
  - EMA9 alignment
  - ADX > 20 confirmation
  - Pattern confirmation bonus
  - Confluence score > 60%

- **Breakout Scanner**: Identifies:
  - 20-period high/low breakouts
  - Volume confirmation (>1.3x)
  - Pattern validation
  - Clear risk/reward levels

- **Gap Analysis**: Detects:
  - Significant opening gaps (>2%)
  - Follow-through confirmation
  - Volume validation

#### Swing Trade Scanner (Daily)
- **Trend Following**:
  - Multi-EMA alignment (20 > 50 > 200)
  - ADX > 25 for strong trends
  - Price above all key EMAs
  - Fibonacci level proximity

- **Support/Resistance**:
  - Bollinger Band extremes
  - Pivot point levels
  - RSI confirmation (<35 or >65)
  - Volume divergence

- **Pattern Breakout**:
  - 15+ candlestick patterns
  - Confluence with indicators
  - ATR-based targets

### 💰 Professional Risk Management
- **Position Size Calculator**:
  - Account size based calculation
  - Risk percentage (1-2% recommended)
  - Exact share quantity
  - Total investment amount

- **Stop Loss Optimization**:
  - ATR-based stop loss (1.5-2x ATR)
  - Support/Resistance levels
  - Volatility adjustment

- **Risk/Reward Analysis**:
  - Automatic R:R calculation
  - Minimum 2:1 recommendation
  - ATR-based targets (2.5-3x ATR)
  - Position heat tracking

- **Advanced Tools**:
  - Kelly Criterion sizing
  - Volatility-based adjustment
  - Portfolio heat calculator
  - Quick reference tables

## 📊 Accuracy & Quality Metrics

### Signal Quality Assurance
1. **Minimum Confluence**: 60% required for signal generation
2. **Volume Confirmation**: Required for all breakouts and momentum plays
3. **Pattern Validation**: Candlestick patterns must align with indicators
4. **Trend Confirmation**: Multi-timeframe alignment checked
5. **Risk/Reward**: Minimum 1.5:1, typically 2-3:1

### Indicator Accuracy
- **RSI**: Wilder's smoothing (industry standard)
- **ADX**: Properly smoothed (not just DX)
- **Stochastic**: Full %K and %D calculation
- **MACD**: Standard 12/26/9 with signal line
- **Bollinger Bands**: 2 standard deviations

## 🏗️ Technical Architecture

### Backend Excellence
```
✅ Accurate indicator calculations (verified against TradingView)
✅ Wilder's smoothing for RSI and ADX
✅ Multi-indicator confluence scoring
✅ 15+ candlestick patterns
✅ Advanced indicators (OBV, VWAP, Fibonacci, Pivots)
✅ Weighted scoring system
✅ Pattern + Indicator confirmation
```

### Frontend Features
```
✅ Real-time signal updates
✅ Interactive dashboards
✅ Custom screener builder
✅ Risk calculator
✅ Mobile responsive design
✅ Confluence score display
✅ Pattern detection results
```

## 📖 Installation & Setup

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url>
cd market-screener

# 2. Install all dependencies
npm run install:all

# 3. Configure environment (optional)
cd backend
cp .env.example .env
# Edit .env if you have API keys

# 4. Run the application
cd ..
npm run dev
```

**Access:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

## 🎓 Using the Platform

### Custom Screener
1. Select markets (NSE, BSE, NYSE, NASDAQ)
2. Apply filters:
   - Price range
   - RSI levels (e.g., 30-70 for neutral momentum)
   - Volume breakout (>1.5x average)
   - ADX minimum (25 for strong trends)
3. Use presets:
   - **Momentum Stocks**: RSI 50-70, Volume >1.5x, ADX >25
   - **Oversold Bounce**: RSI 20-35, Price > EMA200
   - **Breakout Candidates**: Volume spike, ADX >20, MACD bullish
   - **Strong Uptrend**: Price > EMA20 > EMA50 > EMA200

### Reading Results
- **Score**: 0-100 (higher = better setup)
- **Confluence**: 0-100% (indicator agreement)
- **Patterns**: Detected candlestick formations
- **Signals**: Key technical observations
- **R:R Ratio**: Risk/Reward (minimum 2:1 recommended)

### Intraday Trading
**Best Time**: Market open + high volume periods

**Strategy**:
1. Scan for signals (strength >75%)
2. Check confluence score (>70%)
3. Verify volume (>2x average ideal)
4. Look for pattern confirmation
5. Enter at signal price
6. Set stop loss (ATR-based)
7. Target 2-3:1 R:R

### Swing Trading
**Best Time**: Daily chart analysis, weekly review

**Strategy**:
1. Identify trend (ADX >25)
2. Wait for pullback to support
3. Check RSI (<40 for long, >60 for short)
4. Verify pattern formation
5. Enter on confirmation candle
6. Set stop below support/above resistance
7. Target Fibonacci or pivot levels

## 📊 Indicator Reference

### RSI Interpretation
- **< 30**: Oversold (potential long)
- **30-45**: Bearish zone
- **45-55**: Neutral
- **55-70**: Bullish zone
- **> 70**: Overbought (potential short)

### ADX Interpretation
- **< 20**: Weak trend, range-bound
- **20-25**: Emerging trend
- **25-40**: Strong trend
- **> 40**: Very strong trend
- **> 50**: Extremely strong trend

### Volume Ratio
- **< 1.0**: Below average (weak)
- **1.0-1.2**: Average
- **1.2-1.5**: Above average
- **1.5-2.0**: High (confirmation)
- **> 2.0**: Very high (strong confirmation)

### Confluence Score
- **< 50%**: Weak setup, avoid
- **50-60%**: Moderate setup, caution
- **60-70%**: Good setup, trade with care
- **70-80%**: Strong setup, high probability
- **> 80%**: Excellent setup, best trades

## ⚠️ Risk Management Rules

### The Golden Rules
1. **Never risk more than 2% per trade**
2. **Always use stop losses (no exceptions)**
3. **Minimum 2:1 Risk/Reward ratio**
4. **Don't trade without volume confirmation**
5. **Respect the confluence score (>60% minimum)**
6. **Maximum 3-5 positions simultaneously**
7. **Keep portfolio heat under 6%**

### Position Sizing Formula
```
Position Size = (Account Size × Risk %) / (Entry Price - Stop Loss)

Example:
Account: $10,000
Risk: 2% ($200)
Entry: $100
Stop: $95
Position = $200 / $5 = 40 shares
```

## 🎯 What's New in Enhanced Edition

### ✨ Technical Improvements
- ✅ Fixed RSI calculation (Wilder's smoothing)
- ✅ Fixed ADX calculation (proper smoothing, not just DX)
- ✅ Enhanced Stochastic (%K and %D properly calculated)
- ✅ Added OBV (On-Balance Volume)
- ✅ Added VWAP (Volume Weighted Average Price)
- ✅ Added Fibonacci retracement levels (7 levels)
- ✅ Added Pivot Points (Standard with R1-R3, S1-S3)
- ✅ Added Supertrend indicator
- ✅ Expanded to 15+ candlestick patterns

### ✨ Algorithm Enhancements
- ✅ Multi-indicator confluence scoring (weighted 0-100%)
- ✅ Enhanced signal strength calculation
- ✅ Pattern + Indicator confirmation requirements
- ✅ Volume + Trend confirmation for all signals
- ✅ ADX + MACD cross-validation
- ✅ Minimum confluence threshold (60%)
- ✅ Better risk/reward optimization (3:1 targets)

### ✨ User Experience
- ✅ Confluence score displayed for each result
- ✅ Pattern detection results shown
- ✅ Enhanced signal descriptions
- ✅ Better filtering options
- ✅ Improved accuracy metrics

## 🔬 Testing & Validation

The platform has been enhanced with:
- Industry-standard indicator formulas
- Cross-referenced with TradingView calculations
- Verified pattern recognition logic
- Tested confluence scoring across multiple scenarios
- Risk management formulas validated

## 📚 Learning Resources

### Recommended Reading
- "Technical Analysis of Financial Markets" - John Murphy
- "Encyclopedia of Chart Patterns" - Thomas Bulkowski
- "Trading in the Zone" - Mark Douglas

### Key Concepts to Master
1. Trend identification (EMAs, ADX)
2. Momentum analysis (RSI, Stochastic)
3. Volume confirmation (OBV, Volume Profile)
4. Pattern recognition (Candlesticks)
5. Risk management (Position sizing, R:R)

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- Additional technical indicators
- More chart patterns
- Backtesting engine
- Real-time WebSocket data
- Machine learning price prediction
- Portfolio tracking
- Alert notifications

## ⚠️ Disclaimer

**IMPORTANT**: This tool is for **educational and informational purposes only**.

- ❌ NOT financial advice
- ❌ NOT a guarantee of profits
- ❌ Past performance ≠ future results

**Always**:
- ✅ Do your own research (DYOR)
- ✅ Consult a qualified financial advisor
- ✅ Understand the risks of trading
- ✅ Never invest more than you can afford to lose
- ✅ Practice with paper trading first
- ✅ Start with small position sizes

## 📧 Support

For questions or issues:
- GitHub Issues: [Create an issue]
- Documentation: See this README
- Email: support@marketscreener.pro (placeholder)

## 📄 License

MIT License - See LICENSE file

---

## 🎖️ Quality Badges

- ✅ **Indicator Accuracy**: Industry Standard
- ✅ **Pattern Recognition**: 15+ Patterns
- ✅ **Confluence Scoring**: Multi-Indicator
- ✅ **Risk Management**: Professional Grade
- ✅ **Code Quality**: TypeScript Strict Mode
- ✅ **Testing**: Algorithm Verified

**Built with precision for traders, by traders** 📈

*Version 2.0 - Enhanced Edition*

Happy Trading! May your signals be accurate and your stops never hit! 🎯🚀
