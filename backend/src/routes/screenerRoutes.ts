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
 */
router.get('/presets', (req, res) => {
  const presets = [
    {
      id: 'momentum',
      name: 'Momentum Stocks',
      description: 'High momentum stocks with strong volume',
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          rsiRange: { min: 50, max: 70 },
          volumeBreakout: true,
          adxMin: 25
        }
      }
    },
    {
      id: 'value',
      name: 'Value Opportunities',
      description: 'Undervalued stocks with strong fundamentals',
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          peRatioMax: 20,
          pbRatioMax: 3,
          roeMin: 12,
          debtToEquityMax: 1.0
        }
      }
    },
    {
      id: 'growth',
      name: 'Quality Growth',
      description: 'High growth stocks with quality metrics',
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          roeMin: 15,
          revenueGrowthMin: 15,
          epsGrowthMin: 15,
          profitMarginMin: 10
        }
      }
    },
    {
      id: 'quality',
      name: 'Low Risk Quality',
      description: 'High quality stocks with strong balance sheets',
      criteria: {
        markets: ['NSE', 'NYSE'],
        fundamentalFilters: {
          roeMin: 15,
          debtToEquityMax: 0.5,
          profitMarginMin: 12
        },
        technicalFilters: {
          priceAboveEMA: [200]
        }
      }
    },
    {
      id: 'oversold',
      name: 'Oversold Bounce',
      description: 'Oversold stocks near support levels',
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          rsiRange: { min: 20, max: 35 },
          priceAboveEMA: [200]
        }
      }
    },
    {
      id: 'breakout',
      name: 'Breakout Candidates',
      description: 'Stocks near resistance with volume buildup',
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          volumeBreakout: true,
          adxMin: 20,
          macdCrossover: 'bullish'
        }
      }
    },
    {
      id: 'uptrend',
      name: 'Strong Uptrend',
      description: 'Stocks in confirmed uptrend',
      criteria: {
        markets: ['NSE', 'NYSE'],
        technicalFilters: {
          priceAboveEMA: [20, 50, 200],
          adxMin: 25,
          rsiRange: { min: 45, max: 65 }
        }
      }
    }
  ];

  res.json({ presets });
});

export { router as screenerRoutes };
