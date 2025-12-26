# 🎯 Screening Strategies - Quick Reference

## Available Strategies (17 Total)

### 📈 GROWTH (4 Strategies)
| ID | Name | Risk | Time | Best Returns |
|----|------|------|------|--------------|
| `canslim` | CANSLIM® Growth | High | 3-12M | 50-200%+ |
| `garp` | GARP (Growth at Reasonable Price) | Medium | 6-24M | 20-40% |
| `super_growth` | Super Growth Stocks | Very High | 3-18M | 100-500%+ |
| `small_cap_growth` | Small Cap Momentum | Very High | 3-12M | 50-300%+ |

### 💎 VALUE (3 Strategies)
| ID | Name | Risk | Time | Best Returns |
|----|------|------|------|--------------|
| `deep_value` | Deep Value Investing | Low-Med | 1-3Y | 15-30% |
| `contrarian_value` | Contrarian Turnaround | Med-High | 6-18M | 30-80% |
| `buffett_value` | Buffett-Style Value | Low | 3-10Y | 12-20% |

### 📊 MOMENTUM (3 Strategies)
| ID | Name | Risk | Time | Best Returns |
|----|------|------|------|--------------|
| `breakout_momentum` | Breakout with Volume | High | 2-8W | 20-60% |
| `trend_following` | Strong Trend Following | Medium | 4-12W | 15-40% |
| `swing_trading` | Swing Trading Setup | Med-High | 3-10D | 5-15% |

### 🏆 QUALITY (2 Strategies)
| ID | Name | Risk | Time | Best Returns |
|----|------|------|------|--------------|
| `quality_moat` | Quality Moat Stocks | Low-Med | 2-5Y | 15-25% |
| `blue_chip_quality` | Blue Chip Leaders | Low | 2-10Y | 10-18% |

### 💰 DIVIDEND (2 Strategies)
| ID | Name | Risk | Time | Best Returns |
|----|------|------|------|--------------|
| `dividend_growth` | Dividend Growth | Low | 3-10Y | 8-15% + dividend |
| `high_yield` | High Dividend Yield | Medium | 2-5Y | 6-12% + 4%+ dividend |

### 🎯 SPECIALIZED (3 Strategies)
| ID | Name | Risk | Time | Best Returns |
|----|------|------|------|--------------|
| `institutional_favorites` | Institutional Favorites | Medium | 3-12M | 25-50% |
| `earnings_momentum` | Earnings Momentum | High | 1-6M | 15-40% |
| `conservative_growth` | Conservative Growth | Low | 1-5Y | 12-20% |

---

## Strategy Selection by Profile

### 🔰 Beginner / Conservative
**Recommended:**
- Blue Chip Leaders
- Dividend Growth
- Conservative Growth
- Buffett-Style Value

**Allocation:** 70% Quality/Dividend + 30% Conservative Growth

---

### 📊 Intermediate / Balanced
**Recommended:**
- GARP
- Quality Moat
- Trend Following
- Deep Value

**Allocation:** 40% Value + 40% Growth + 20% Momentum

---

### 🚀 Advanced / Aggressive
**Recommended:**
- CANSLIM
- Super Growth
- Breakout Momentum
- Institutional Favorites

**Allocation:** 50% Growth + 30% Momentum + 20% Value

---

### ⚡ Professional / High Risk
**Recommended:**
- Small Cap Momentum
- Swing Trading
- Earnings Momentum
- Contrarian Turnaround

**Allocation:** 40% High Growth + 40% Momentum + 20% Turnarounds

---

## Quick Filters Summary

### Most Aggressive Growth
**Strategy:** `super_growth`
- EPS Growth ≥ 50%
- Revenue Growth ≥ 40%
- ROE ≥ 20%
- Price above all EMAs
- Volume breakouts

### Most Conservative
**Strategy:** `blue_chip_quality`
- ROE ≥ 15%
- Low debt
- Stable growth
- Large cap leaders

### Best Risk/Reward
**Strategy:** `garp`
- Growth + Value combined
- PEG ratio < 1
- Quality fundamentals
- ~70% win rate

### Highest Income
**Strategy:** `high_yield`
- Dividend Yield ≥ 4%
- Quality business
- Sustainable payout

### Fastest Gains
**Strategy:** `swing_trading`
- 3-10 day holds
- 5-15% per trade
- High frequency

---

## Market Condition Guide

### 🟢 Bull Market (Strong Uptrend)
**Use:** Growth + Momentum strategies
- CANSLIM
- Super Growth
- Breakout Momentum
- Trend Following

### 🔴 Bear Market (Downtrend)
**Use:** Value + Dividend strategies
- Deep Value
- Buffett Value
- Dividend Growth
- High Yield

### 🟡 Sideways Market (Range-bound)
**Use:** Quality + Swing strategies
- Quality Moat
- Blue Chip
- Swing Trading
- Dividend strategies

### 🔵 Volatile Market (Uncertain)
**Use:** Conservative + Quality
- Conservative Growth
- Blue Chip
- Dividend Growth
- Buffett Value

---

## Portfolio Examples

### **Aggressive Growth Portfolio**
```
40% - CANSLIM Growth
30% - Super Growth Stocks
20% - Breakout Momentum
10% - Small Cap Momentum
```
**Expected:** 40-80% annually
**Volatility:** Very High
**Drawdown:** -30% to -50%

### **Balanced Growth Portfolio**
```
35% - GARP
25% - Quality Moat
20% - Trend Following
20% - Conservative Growth
```
**Expected:** 18-30% annually
**Volatility:** Medium
**Drawdown:** -15% to -25%

### **Income + Growth Portfolio**
```
40% - Dividend Growth
30% - Blue Chip Quality
20% - Buffett Value
10% - Conservative Growth
```
**Expected:** 10-18% annually + 2-3% dividend
**Volatility:** Low
**Drawdown:** -10% to -20%

### **Defensive Portfolio**
```
50% - Blue Chip Leaders
30% - High Dividend Yield
20% - Buffett Value
```
**Expected:** 8-15% annually + dividend
**Volatility:** Very Low
**Drawdown:** -8% to -15%

---

## How to Use in the App

### 1. Access Presets
```
Dashboard → Quick Actions → Click any strategy
OR
Screener Page → Left sidebar → Click preset
```

### 2. API Access
```bash
# Get all presets
curl http://localhost:3001/api/screener/presets

# Response includes all 17 strategies with:
- id (use for URL parameters)
- name
- category
- description
- strategy (methodology)
- criteria (filters)
```

### 3. URL Parameters
```
# Direct link to any strategy:
http://localhost:3000/screener?preset=canslim
http://localhost:3000/screener?preset=garp
http://localhost:3000/screener?preset=buffett_value
```

### 4. Custom Modifications
After applying a preset, you can:
- Adjust any filter value
- Add additional filters
- Save as custom strategy
- Run immediately

---

## Key Criteria Explained

### Technical Filters
- **RSI:** 0-100, Oversold <30, Overbought >70
- **ADX:** >25 = Strong trend, >40 = Very strong
- **EMA:** Price above = Uptrend, below = Downtrend
- **Volume Breakout:** 2x average = Institutional activity
- **MACD Crossover:** Bullish = Buy signal

### Fundamental Filters
- **P/E Ratio:** Lower = Cheaper (Value: <15, Growth: <30)
- **ROE:** >15% = Good, >20% = Excellent
- **EPS Growth:** >15% = Good, >25% = Strong, >50% = Exceptional
- **Debt/Equity:** <0.5 = Very safe, <1.0 = Safe, >2.0 = Risky
- **Profit Margin:** >10% = Good, >15% = Excellent

---

## Success Tips

### ✅ DO:
- Use multiple strategies for diversification
- Adjust for current market conditions
- Analyze stocks on detail page before buying
- Use stop losses
- Start with conservative strategies
- Paper trade new strategies first

### ❌ DON'T:
- Put all money in one strategy
- Chase past performance
- Ignore risk management
- Skip fundamental analysis
- Overtrade
- Use leverage without experience

---

## Next Steps

1. **Review:** Read `SCREENING_STRATEGIES_GUIDE.md` for detailed explanations
2. **Test:** Try different strategies on the screener
3. **Analyze:** Use Stock Detail page for deep analysis
4. **Paper Trade:** Test strategies with virtual money first
5. **Refine:** Adjust based on your results
6. **Scale:** Gradually increase position sizes

---

**Remember:** These are screening tools, not buy signals. Always do your own analysis!

For detailed strategy guides, see: `SCREENING_STRATEGIES_GUIDE.md`
