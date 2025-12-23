import { Router } from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { screenerService } from '../services/screenerService';

const router = Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * POST /api/csv/upload
 * Upload CSV file with stock symbols and run analysis
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Parse CSV file
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Validate and transform records
    const symbols: Array<{symbol: string; exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'}> = [];

    for (const record of records) {
      const symbol = record.symbol || record.Symbol || record.SYMBOL;
      const exchange = (record.exchange || record.Exchange || record.EXCHANGE || 'NSE').toUpperCase();

      if (!symbol) {
        continue; // Skip rows without symbol
      }

      if (!['NSE', 'BSE', 'NYSE', 'NASDAQ'].includes(exchange)) {
        return res.status(400).json({
          error: `Invalid exchange "${exchange}" for symbol "${symbol}". Must be NSE, BSE, NYSE, or NASDAQ`
        });
      }

      symbols.push({
        symbol: symbol.toUpperCase().trim(),
        exchange: exchange as 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'
      });
    }

    if (symbols.length === 0) {
      return res.status(400).json({
        error: 'No valid symbols found in CSV. Make sure you have "symbol" and "exchange" columns'
      });
    }

    if (symbols.length > 100) {
      return res.status(400).json({
        error: `Too many symbols (${symbols.length}). Maximum 100 allowed per upload`
      });
    }

    // Parse criteria from request body if provided
    const criteria = req.body.criteria ? JSON.parse(req.body.criteria) : undefined;

    // Run analysis
    const results = await screenerService.runCustomStockList(symbols, criteria);

    res.json({
      results,
      count: results.length,
      uploadedCount: symbols.length,
      timestamp: new Date()
    });
  } catch (error: any) {
    console.error('Error processing CSV upload:', error);
    res.status(500).json({
      error: error.message || 'Failed to process CSV file'
    });
  }
});

/**
 * POST /api/csv/export
 * Export screening results to CSV
 */
router.post('/export', async (req, res) => {
  try {
    const { results } = req.body;

    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    // Transform results to CSV format
    const csvData = results.map((result: any) => ({
      // Basic Info
      'Symbol': result.symbol,
      'Name': result.name,
      'Exchange': result.exchange,
      'Price': result.price,
      'Change %': result.changePercent.toFixed(2),
      'Volume': result.volume,

      // Technical Scores
      'Technical Score': result.score,
      'Confluence %': result.confluenceScore || 'N/A',

      // Fundamental Scores
      'Fundamental Score': result.fundamentalScore?.overall || 'N/A',
      'Quality Grade': result.fundamentalScore?.quality || 'N/A',
      'Category': result.fundamentalScore?.category || 'N/A',

      // Combined Analysis
      'Combined Score': result.combinedScore || result.score,
      'Recommendation': result.recommendation || 'HOLD',

      // Technical Indicators
      'RSI': result.indicators?.rsi?.toFixed(2) || 'N/A',
      'MACD': result.indicators?.macd?.histogram?.toFixed(2) || 'N/A',
      'ADX': result.indicators?.adx?.toFixed(2) || 'N/A',
      'Volume Ratio': result.indicators?.volumeProfile?.volumeRatio?.toFixed(2) || 'N/A',

      // Fundamentals
      'P/E Ratio': result.fundamentals?.peRatio?.toFixed(2) || 'N/A',
      'P/B Ratio': result.fundamentals?.pbRatio?.toFixed(2) || 'N/A',
      'ROE %': result.fundamentals?.roe?.toFixed(2) || 'N/A',
      'Debt/Equity': result.fundamentals?.debtToEquity?.toFixed(2) || 'N/A',
      'Revenue Growth %': result.fundamentals?.revenueGrowth?.toFixed(2) || 'N/A',
      'EPS Growth %': result.fundamentals?.epsGrowth?.toFixed(2) || 'N/A',
      'Net Margin %': result.fundamentals?.netMargin?.toFixed(2) || 'N/A',
      'Dividend Yield %': result.fundamentals?.dividendYield?.toFixed(2) || 'N/A',

      // Risk/Reward
      'Entry': result.riskReward?.entryPrice?.toFixed(2) || result.price,
      'Stop Loss': result.riskReward?.stopLoss?.toFixed(2) || 'N/A',
      'Target': result.riskReward?.target?.toFixed(2) || 'N/A',
      'R:R Ratio': result.riskReward?.ratio?.toFixed(2) || 'N/A',

      // Patterns
      'Patterns': result.patterns?.join(', ') || 'None',
      'Signals': result.signals?.slice(0, 3).join('; ') || 'None'
    }));

    // Generate CSV
    const csv = stringify(csvData, {
      header: true,
      columns: Object.keys(csvData[0] || {})
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=screening-results-${Date.now()}.csv`);
    res.send(csv);
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({
      error: error.message || 'Failed to export CSV'
    });
  }
});

/**
 * GET /api/csv/template
 * Download CSV template for stock upload
 */
router.get('/template', (req, res) => {
  const template = [
    { symbol: 'RELIANCE', exchange: 'NSE' },
    { symbol: 'TCS', exchange: 'NSE' },
    { symbol: 'AAPL', exchange: 'NASDAQ' },
    { symbol: 'MSFT', exchange: 'NASDAQ' }
  ];

  const csv = stringify(template, {
    header: true,
    columns: ['symbol', 'exchange']
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=stock-upload-template.csv');
  res.send(csv);
});

export { router as csvRoutes };
