import { Router } from 'express';
import { screenerService } from '../services/screenerService';
import { RiskCalculator } from '../utils/riskManagement';
import { ScreenerCriteria } from '../types';

const router = Router();

/**
 * POST /api/screener/run
 * Run custom screener with criteria
 */
router.post('/run', async (req, res) => {
  try {
    const criteria: ScreenerCriteria = req.body;

    if (!criteria.markets || criteria.markets.length === 0) {
      return res.status(400).json({ error: 'At least one market must be specified' });
    }

    const results = await screenerService.runScreener(criteria);

    res.json({
      results,
      count: results.length,
      criteria,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error running screener:', error);
    res.status(500).json({ error: 'Failed to run screener' });
  }
});

/**
 * POST /api/screener/intraday
 * Scan for intraday opportunities
 */
router.post('/intraday', async (req, res) => {
  try {
    const { markets = ['NSE', 'NYSE'] } = req.body;

    const signals = await screenerService.scanIntraday(markets);

    res.json({
      signals,
      count: signals.length,
      markets,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error scanning intraday:', error);
    res.status(500).json({ error: 'Failed to scan intraday opportunities' });
  }
});

/**
 * POST /api/screener/swing
 * Scan for swing trade opportunities
 */
router.post('/swing', async (req, res) => {
  try {
    const { markets = ['NSE', 'NYSE'] } = req.body;

    const signals = await screenerService.scanSwingTrade(markets);

    res.json({
      signals,
      count: signals.length,
      markets,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error scanning swing trades:', error);
    res.status(500).json({ error: 'Failed to scan swing trade opportunities' });
  }
});

/**
 * POST /api/screener/risk-calculator
 * Calculate position sizing and risk
 */
router.post('/risk-calculator', (req, res) => {
  try {
    const { accountSize, riskPercentage, entryPrice, stopLoss } = req.body;

    if (!accountSize || !riskPercentage || !entryPrice || !stopLoss) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = RiskCalculator.calculatePositionSize(
      accountSize,
      riskPercentage,
      entryPrice,
      stopLoss
    );

    const target = RiskCalculator.calculateTarget(entryPrice, stopLoss, 2);
    const riskRewardRatio = RiskCalculator.calculateRiskRewardRatio(
      entryPrice,
      stopLoss,
      target
    );

    res.json({
      ...result,
      target,
      riskRewardRatio,
      recommendation: riskRewardRatio >= 2 ? 'Good R:R ratio' : 'Consider adjusting target'
    });
  } catch (error) {
    console.error('Error calculating risk:', error);
    res.status(500).json({ error: 'Failed to calculate risk' });
  }
});

/**
 * GET /api/screener/presets
 * Get preset screener configurations
 * Professional-grade strategies combining technical & fundamental analysis
 */
router.get('/presets', (req, res) => {
  const presets = [
    // ========== GROWTH STRATEGIES ==========
    {
      id: 'canslim',
      name: 'CANSLIM® Growth',
      category: 'Growth',
      description: "William O'Neil's proven strategy - Strong earnings, sales, new highs with institutional support",
      strategy: "C(urrent Earnings) + A(nnual Earnings) + N(ew Products/Highs) + S(upply/Demand) + L(eader) + I(nstitutional) + M(arket)",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          epsGrowthMin: 25,        // Quarterly EPS growth 25%+
          revenueGrowthMin: 25,    // Sales growth 25%+
          roeMin: 17,              // Strong profitability
          profitMarginMin: 15,     // High margins
        },
        technicalFilters: {
          priceAboveEMA: [50, 200], // Above major MAs
          rsiRange: { min: 50, max: 80 }, // Strong but not overbought
          volumeBreakout: true,     // High volume
          adxMin: 25               // Strong trend
        }
      }
    },
    {
      id: 'garp',
      name: 'GARP (Growth at Reasonable Price)',
      category: 'Growth',
      description: "Peter Lynch strategy - Quality growth companies at fair valuations (PEG < 1)",
      strategy: "High growth + Reasonable P/E + Strong fundamentals",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          peRatioMax: 30,          // Not overvalued
          epsGrowthMin: 15,        // Good growth
          revenueGrowthMin: 15,    // Sales growth
          roeMin: 15,              // Quality business
          debtToEquityMax: 1.0,    // Manageable debt
          profitMarginMin: 10
        },
        technicalFilters: {
          priceAboveEMA: [200],    // Long-term uptrend
          rsiRange: { min: 40, max: 70 }
        }
      }
    },
    {
      id: 'super_growth',
      name: 'Super Growth Stocks',
      category: 'Growth',
      description: "High-momentum stocks with explosive growth - aggressive growth portfolio",
      strategy: "Triple-digit growth + Strong momentum + Institutional buying",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          epsGrowthMin: 50,        // Exceptional growth
          revenueGrowthMin: 40,    // Strong sales
          roeMin: 20,              // Excellent returns
          profitMarginMin: 20      // High margins
        },
        technicalFilters: {
          priceAboveEMA: [20, 50, 200],
          rsiRange: { min: 55, max: 80 },
          volumeBreakout: true,
          adxMin: 30,              // Very strong trend
          macdCrossover: 'bullish'
        }
      }
    },
    {
      id: 'small_cap_growth',
      name: 'Small Cap Momentum',
      category: 'Growth',
      description: "High-growth small caps with institutional interest - higher risk/reward",
      strategy: "Small cap + High growth + Improving fundamentals + Technical breakout",
      criteria: {
        markets: ['NSE', 'NYSE'],
        priceRange: { min: 5, max: 50 }, // Small cap price range
        fundamentalFilters: {
          epsGrowthMin: 30,
          revenueGrowthMin: 25,
          roeMin: 15,
          profitMarginMin: 12
        },
        technicalFilters: {
          volumeBreakout: true,
          rsiRange: { min: 50, max: 75 },
          adxMin: 25,
          macdCrossover: 'bullish'
        }
      }
    },

    // ========== VALUE STRATEGIES ==========
    {
      id: 'deep_value',
      name: 'Deep Value Investing',
      category: 'Value',
      description: "Benjamin Graham approach - Significantly undervalued with margin of safety",
      strategy: "Low P/E + Low P/B + High ROE + Strong balance sheet",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          peRatioMax: 15,          // Undervalued
          pbRatioMax: 1.5,         // Trading below book
          roeMin: 12,              // Still profitable
          debtToEquityMax: 0.75,   // Low debt
          profitMarginMin: 8
        },
        technicalFilters: {
          rsiRange: { min: 25, max: 50 }, // Oversold to neutral
          priceAboveEMA: [200]     // Long-term uptrend
        }
      }
    },
    {
      id: 'contrarian_value',
      name: 'Contrarian Turnaround',
      category: 'Value',
      description: "Oversold quality stocks with improving technicals - turnaround plays",
      strategy: "Quality fundamentals + Temporary weakness + Technical reversal",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          peRatioMax: 20,
          roeMin: 10,              // Still profitable
          debtToEquityMax: 1.5,
          profitMarginMin: 5
        },
        technicalFilters: {
          rsiRange: { min: 20, max: 40 }, // Oversold
          macdCrossover: 'bullish', // Starting to turn
          priceAboveEMA: [200]      // Above long-term support
        }
      }
    },
    {
      id: 'buffett_value',
      name: 'Buffett-Style Value',
      category: 'Value',
      description: "Warren Buffett moat stocks - Economic moats with predictable earnings",
      strategy: "Wide moat + Strong ROE + Low debt + Consistent earnings",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          peRatioMax: 25,
          roeMin: 18,              // Excellent returns
          debtToEquityMax: 0.5,    // Very low debt
          profitMarginMin: 15,     // Strong margins
          dividendYieldMin: 1      // Shareholder-friendly
        },
        technicalFilters: {
          priceAboveEMA: [200],    // Long-term uptrend
          rsiRange: { min: 35, max: 65 }
        }
      }
    },

    // ========== MOMENTUM STRATEGIES ==========
    {
      id: 'breakout_momentum',
      name: 'Breakout with Volume',
      category: 'Momentum',
      description: "Technical breakouts with explosive volume - professional momentum trading",
      strategy: "New highs + Volume surge + Strong momentum + Trend confirmation",
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          volumeBreakout: true,    // 2x average volume
          rsiRange: { min: 55, max: 75 },
          adxMin: 30,              // Very strong trend
          macdCrossover: 'bullish',
          priceAboveEMA: [20, 50, 200]
        },
        fundamentalFilters: {
          epsGrowthMin: 15,        // Growth confirmation
          roeMin: 12
        }
      }
    },
    {
      id: 'trend_following',
      name: 'Strong Trend Following',
      category: 'Momentum',
      description: "Established uptrends with momentum - ride the trend",
      strategy: "All EMAs aligned + Strong ADX + Consistent momentum",
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          priceAboveEMA: [20, 50, 200], // All MAs aligned
          adxMin: 25,
          rsiRange: { min: 45, max: 70 },
          macdCrossover: 'bullish'
        }
      }
    },
    {
      id: 'swing_trading',
      name: 'Swing Trading Setup',
      category: 'Momentum',
      description: "Short-term momentum plays - 3-10 day holds",
      strategy: "Pullback to support + Volume + Oversold RSI + Bullish reversal",
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          rsiRange: { min: 30, max: 45 }, // Pullback
          priceAboveEMA: [50, 200],       // Still in uptrend
          macdCrossover: 'bullish',       // Starting to turn
          volumeBreakout: true
        },
        fundamentalFilters: {
          epsGrowthMin: 10,        // Positive growth
          roeMin: 10
        }
      }
    },

    // ========== QUALITY STRATEGIES ==========
    {
      id: 'quality_moat',
      name: 'Quality Moat Stocks',
      category: 'Quality',
      description: "Highest quality companies with competitive advantages",
      strategy: "ROE > 20% + Low debt + High margins + Consistent growth",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          roeMin: 20,              // Excellent returns
          debtToEquityMax: 0.5,    // Very low debt
          profitMarginMin: 15,     // Strong margins
          epsGrowthMin: 10,        // Consistent growth
          revenueGrowthMin: 10
        },
        technicalFilters: {
          priceAboveEMA: [200],    // Long-term uptrend
          rsiRange: { min: 40, max: 70 }
        }
      }
    },
    {
      id: 'blue_chip_quality',
      name: 'Blue Chip Leaders',
      category: 'Quality',
      description: "Large-cap quality leaders - defensive portfolio",
      strategy: "Market leaders + Strong financials + Low volatility",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          roeMin: 15,
          debtToEquityMax: 1.0,
          profitMarginMin: 12,
          epsGrowthMin: 8         // Steady growth
        },
        technicalFilters: {
          priceAboveEMA: [200],
          rsiRange: { min: 40, max: 65 }, // Stable
          adxMin: 20
        }
      }
    },

    // ========== DIVIDEND STRATEGIES ==========
    {
      id: 'dividend_growth',
      name: 'Dividend Growth',
      category: 'Dividend',
      description: "Growing dividends with quality fundamentals - income investors",
      strategy: "Dividend yield + Dividend growth + Payout ratio + Quality",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          dividendYieldMin: 2,     // Good yield
          roeMin: 12,
          debtToEquityMax: 1.0,
          profitMarginMin: 10,
          epsGrowthMin: 5         // Growing earnings
        },
        technicalFilters: {
          priceAboveEMA: [200],   // Uptrend
          rsiRange: { min: 35, max: 65 }
        }
      }
    },
    {
      id: 'high_yield',
      name: 'High Dividend Yield',
      category: 'Dividend',
      description: "High-yield dividend stocks with safety - income focus",
      strategy: "Yield > 4% + Sustainable payout + Quality business",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          dividendYieldMin: 4,     // High yield
          roeMin: 10,
          debtToEquityMax: 1.5,
          profitMarginMin: 8
        },
        technicalFilters: {
          priceAboveEMA: [200],
          rsiRange: { min: 30, max: 60 }
        }
      }
    },

    // ========== SPECIALIZED STRATEGIES ==========
    {
      id: 'institutional_favorites',
      name: 'Institutional Favorites',
      category: 'Specialized',
      description: "High institutional ownership with strong momentum",
      strategy: "Institutional buying + Quality + Momentum",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          roeMin: 15,
          epsGrowthMin: 15,
          profitMarginMin: 12
        },
        technicalFilters: {
          volumeBreakout: true,    // Institutional accumulation
          priceAboveEMA: [20, 50, 200],
          rsiRange: { min: 50, max: 75 },
          adxMin: 25
        }
      }
    },
    {
      id: 'earnings_momentum',
      name: 'Earnings Momentum',
      category: 'Specialized',
      description: "Accelerating earnings with upward revisions",
      strategy: "Earnings surprise + Estimate revisions + Price momentum",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          epsGrowthMin: 25,        // Strong earnings
          revenueGrowthMin: 20,
          roeMin: 15,
          profitMarginMin: 12
        },
        technicalFilters: {
          rsiRange: { min: 55, max: 80 },
          volumeBreakout: true,
          priceAboveEMA: [20, 50],
          macdCrossover: 'bullish'
        }
      }
    },
    {
      id: 'conservative_growth',
      name: 'Conservative Growth',
      category: 'Specialized',
      description: "Low-risk growth - steady appreciation with safety",
      strategy: "Moderate growth + Low debt + Stable earnings + Uptrend",
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          epsGrowthMin: 12,
          roeMin: 15,
          debtToEquityMax: 0.5,    // Very safe
          profitMarginMin: 12
        },
        technicalFilters: {
          priceAboveEMA: [50, 200],
          rsiRange: { min: 45, max: 65 }, // Stable momentum
          adxMin: 20
        }
      }
    }
  ];

  // Add metadata
  const response = {
    presets,
    categories: ['Growth', 'Value', 'Momentum', 'Quality', 'Dividend', 'Specialized'],
    count: presets.length,
    timestamp: new Date()
  };

  res.json(response);
});

export { router as screenerRoutes };
