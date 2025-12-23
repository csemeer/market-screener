# 📊 Stock Market Screener Pro

A comprehensive, full-stack stock market screening and analysis platform for **Indian (NSE/BSE)** and **US (NYSE/NASDAQ)** markets. Built with advanced technical analysis, intraday and swing trade scanners, and professional risk management tools.

![Markets](https://img.shields.io/badge/Markets-NSE%20%7C%20BSE%20%7C%20NYSE%20%7C%20NASDAQ-blue)
![Tech](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Node.js-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

### 📈 Multi-Market Coverage
- **Indian Markets**: NSE (National Stock Exchange), BSE (Bombay Stock Exchange)
- **US Markets**: NYSE (New York Stock Exchange), NASDAQ
- Real-time and historical data integration
- Support for 50+ popular stocks across all markets

### 🔬 Advanced Technical Analysis
- **15+ Technical Indicators**:
  - RSI (Relative Strength Index)
  - MACD (Moving Average Convergence Divergence)
  - Bollinger Bands
  - EMA/SMA (9, 20, 50, 200 periods)
  - ADX (Average Directional Index)
  - ATR (Average True Range)
  - Stochastic Oscillator
  - Volume Profile Analysis

### 🎯 Smart Screening Strategies

#### Intraday Scanner
- **Momentum Detection**: Identifies strong price movements with volume confirmation
- **Breakout Scanner**: Detects price breakouts above/below key levels
- **Gap Analysis**: Finds significant gaps with follow-through potential
- Real-time signal strength scoring
- Entry, stop-loss, and target recommendations

#### Swing Trade Scanner
- **Trend Following**: Multi-EMA alignment with ADX confirmation
- **Support/Resistance**: Price bounces from key levels with RSI
- **Pattern Breakout**: Candlestick pattern recognition
- Multi-day trend analysis
- Risk/Reward ratio calculation

### 📊 Candlestick Pattern Recognition
- Doji
- Hammer / Shooting Star
- Bullish / Bearish Engulfing
- Morning Star / Evening Star
- And more...

### 💰 Risk Management Tools
- **Position Size Calculator**: Calculate exact share quantity based on risk tolerance
- **Stop Loss Optimizer**: ATR-based stop loss recommendations
- **Risk/Reward Analysis**: Automatic R:R ratio calculation
- **Portfolio Heat Tracker**: Monitor total portfolio risk
- Kelly Criterion position sizing
- Volatility-based adjustments

### 🎨 Modern User Interface
- Clean, responsive design with TailwindCSS
- Real-time updates and live data
- Interactive dashboards
- Mobile-friendly layout
- Dark theme support (coming soon)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/market-screener.git
cd market-screener
```

2. **Install all dependencies**
```bash
npm run install:all
```

3. **Set up environment variables**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env and add your API keys (optional for demo mode)
```

4. **Run the application**
```bash
# From root directory
npm run dev
```

This will start:
- Backend API server on `http://localhost:3001`
- Frontend development server on `http://localhost:3000`

### 🔑 API Keys (Optional)

For production use with real-time data, you'll need:

- **Alpha Vantage**: Get free API key at [alphavantage.co](https://www.alphavantage.co/support/#api-key)
- **Finnhub**: Get free API key at [finnhub.io](https://finnhub.io/)

Add these to `backend/.env`:
```env
ALPHA_VANTAGE_API_KEY=your_key_here
FINNHUB_API_KEY=your_key_here
```

**Note**: The application works in demo mode with mock data if API keys are not provided.

## 📱 Usage Guide

### Dashboard
- Overview of top intraday and swing signals
- Market statistics and platform features
- Quick access to all tools

### Custom Screener
1. Select markets (NSE, BSE, NYSE, NASDAQ)
2. Set price range filters
3. Configure technical filters:
   - RSI range
   - Volume breakout
   - ADX minimum
   - EMA/SMA criteria
4. Use quick presets for common strategies
5. Run screener to get ranked results

### Intraday Scanner
1. Select markets to scan
2. Filter by signal type (Momentum, Breakout, Gap)
3. View detailed signals with:
   - Entry price
   - Stop loss level
   - Target price
   - Risk/Reward ratio
   - Signal strength score

### Swing Trade Scanner
1. Choose markets
2. Filter by strategy:
   - Trend Following
   - Support/Resistance
   - Pattern Breakout
3. Analyze multi-day opportunities
4. Review trend direction and strength

### Risk Calculator
1. Enter account size
2. Set risk percentage (recommended: 1-2%)
3. Input entry price and stop loss
4. Get optimal position size
5. View potential profit/loss scenarios

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **TailwindCSS**: Utility-first CSS
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **React Router**: Navigation

#### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **TypeScript**: Type-safe server code
- **Axios**: External API calls
- **CORS**: Cross-origin support

### Project Structure
```
market-screener/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── pages/           # Page components
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   └── package.json
├── backend/                  # Express backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   ├── types/           # TypeScript types
│   │   └── index.ts         # Server entry
│   └── package.json
└── package.json              # Root package
```

## 🔌 API Endpoints

### Stock Data
- `GET /api/stocks/quote/:exchange/:symbol` - Get real-time quote
- `GET /api/stocks/historical/:exchange/:symbol` - Get historical data
- `GET /api/stocks/analysis/:exchange/:symbol` - Get technical analysis
- `GET /api/stocks/list/:exchange` - List stocks by exchange

### Screener
- `POST /api/screener/run` - Run custom screener
- `POST /api/screener/intraday` - Scan intraday opportunities
- `POST /api/screener/swing` - Scan swing opportunities
- `POST /api/screener/risk-calculator` - Calculate position size
- `GET /api/screener/presets` - Get preset configurations

## 🎓 Trading Strategies Explained

### Momentum Strategy
Identifies stocks with strong directional movement confirmed by high volume. Best for quick intraday moves.

**Entry Criteria**:
- Price above/below EMA9
- RSI between 50-70 (bullish) or 30-50 (bearish)
- Volume > 1.5x average
- Clear trend direction

### Breakout Strategy
Detects price breaking through resistance/support levels with volume confirmation.

**Entry Criteria**:
- Price breaks 20-period high/low
- Volume confirmation (>1.3x average)
- Strong momentum continuation
- Clear risk/reward setup

### Trend Following
Captures established trends using multi-timeframe EMA alignment.

**Entry Criteria**:
- EMA alignment (20 > 50 > 200 for uptrend)
- ADX > 25 (strong trend)
- Price above all key EMAs
- Pullback to support levels

### Support/Resistance
Trades bounces from key price levels with technical confirmation.

**Entry Criteria**:
- Price at support (RSI < 35) or resistance (RSI > 65)
- Bollinger Band extremes
- Volume divergence
- Clear reversal signs

## 📊 Risk Management Best Practices

1. **Never risk more than 2% per trade**
2. **Always use stop losses**
3. **Maintain 2:1 minimum Risk/Reward ratio**
4. **Keep portfolio heat under 6%**
5. **Position size based on volatility**
6. **Diversify across markets and strategies**

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Run Backend Only
```bash
npm run dev:backend
```

### Run Frontend Only
```bash
npm run dev:frontend
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This tool is for **educational and informational purposes only**. It is not financial advice. Always:
- Do your own research (DYOR)
- Consult with a qualified financial advisor
- Understand the risks involved in trading
- Never invest more than you can afford to lose

The developers are not responsible for any trading losses incurred using this tool.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Yahoo Finance API for market data
- Technical analysis community for indicator formulas
- Open source community for amazing tools and libraries

## 📧 Contact

For questions, suggestions, or issues:
- Create an issue on GitHub
- Email: support@marketscreener.pro (placeholder)

---

**Built with ❤️ for traders, by traders**

Happy Trading! 📈🚀
