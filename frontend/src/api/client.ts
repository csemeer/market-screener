import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ScreenerCriteria {
  markets: ('NSE' | 'BSE' | 'NYSE' | 'NASDAQ')[];
  indexes?: string[]; // Optional: filter by specific market indexes
  priceRange?: {
    min?: number;
    max?: number;
  };
  volumeMin?: number;
  technicalFilters?: {
    rsiRange?: { min?: number; max?: number };
    macdCrossover?: 'bullish' | 'bearish' | 'any';
    priceAboveEMA?: number[];
    priceBelowEMA?: number[];
    adxMin?: number;
    volumeBreakout?: boolean;
  };
  fundamentalFilters?: {
    peRatioMax?: number;
    pbRatioMax?: number;
    roeMin?: number;
    debtToEquityMax?: number;
    revenueGrowthMin?: number;
    epsGrowthMin?: number;
    dividendYieldMin?: number;
    profitMarginMin?: number;
    category?: ('VALUE' | 'GROWTH' | 'QUALITY' | 'DIVIDEND')[];
  };
}

export const screenerAPI = {
  runScreener: (criteria: ScreenerCriteria) =>
    api.post('/screener/run', criteria),

  scanIntraday: (markets: string[]) =>
    api.post('/screener/intraday', { markets }),

  scanSwing: (markets: string[]) =>
    api.post('/screener/swing', { markets }),

  calculateRisk: (data: {
    accountSize: number;
    riskPercentage: number;
    entryPrice: number;
    stopLoss: number;
  }) => api.post('/screener/risk-calculator', data),

  getPresets: () => api.get('/screener/presets'),
};

export const stockAPI = {
  getQuote: (exchange: string, symbol: string) =>
    api.get(`/stocks/quote/${exchange}/${symbol}`),

  getHistorical: (exchange: string, symbol: string, interval = '1d', range = '3mo') =>
    api.get(`/stocks/historical/${exchange}/${symbol}?interval=${interval}&range=${range}`),

  getAnalysis: (exchange: string, symbol: string) =>
    api.get(`/stocks/analysis/${exchange}/${symbol}`),

  getDetail: (exchange: string, symbol: string) =>
    api.get(`/stocks/detail/${exchange}/${symbol}`),

  getStockList: (exchange: string) =>
    api.get(`/stocks/list/${exchange}`),
};

export const csvAPI = {
  uploadCSV: (file: File, criteria?: ScreenerCriteria) => {
    const formData = new FormData();
    formData.append('file', file);
    if (criteria) {
      formData.append('criteria', JSON.stringify(criteria));
    }
    return api.post('/csv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  exportCSV: (results: any[]) =>
    api.post('/csv/export', { results }, {
      responseType: 'blob',
    }),

  downloadTemplate: () =>
    api.get('/csv/template', {
      responseType: 'blob',
    }),
};

export const indexAPI = {
  getAllIndexes: () =>
    api.get('/indexes'),

  getIndexesByExchange: (exchange: string) =>
    api.get(`/indexes/exchange/${exchange}`),

  getIndexById: (indexId: string) =>
    api.get(`/indexes/${indexId}`),

  getIndexConstituents: (indexId: string) =>
    api.get(`/indexes/${indexId}/constituents`),

  getIndexesByCategory: (category: string) =>
    api.get(`/indexes/category/${category}`),

  searchIndexes: (query: string) =>
    api.get(`/indexes/search?q=${encodeURIComponent(query)}`),

  getStatistics: () =>
    api.get('/indexes/stats'),
};

export const dashboardAPI = {
  // Get latest scan results grouped by strategy
  getScanResults: (hours: number = 24, type?: 'INTRADAY' | 'SWING') =>
    api.get('/dashboard/scan-results', {
      params: { hours, type },
    }),

  // Get scan results for a specific strategy
  getStrategyResults: (strategy: string, limit: number = 50) =>
    api.get(`/dashboard/scan-results/${strategy}`, {
      params: { limit },
    }),

  // Get all active signals
  getActiveSignals: () =>
    api.get('/dashboard/active-signals'),

  // Get recent alerts
  getAlerts: (hours: number = 24, unreadOnly: boolean = false) =>
    api.get('/dashboard/alerts', {
      params: { hours, unreadOnly },
    }),

  // Mark alert as read
  markAlertAsRead: (id: number) =>
    api.post(`/dashboard/alerts/${id}/mark-read`),

  // Get performance statistics
  getPerformance: (days: number = 30) =>
    api.get('/dashboard/performance', {
      params: { days },
    }),

  // Get all available strategies
  getStrategies: () =>
    api.get('/dashboard/strategies'),

  // Get auto-scan service status
  getStatus: () =>
    api.get('/dashboard/status'),

  // Trigger manual scan
  triggerScan: () =>
    api.post('/dashboard/scan-now'),

  // Update scan result
  updateScanResult: (id: number, data: {
    status: string;
    outcome?: string;
    exitPrice?: number;
    profitLoss?: number;
    notes?: string;
  }) => api.put(`/dashboard/scan-results/${id}`, data),

  // Cleanup old results
  cleanupOldResults: (days: number = 90) =>
    api.delete('/dashboard/cleanup', {
      params: { days },
    }),
};

export const eodAPI = {
  // Trigger EOD scan
  triggerScan: (config?: {
    exchanges?: string[];
    minScore?: number;
    maxStocks?: number;
    lookbackDays?: number;
  }) => api.post('/eod/scan', config),

  // Trigger EOD scan synchronously
  triggerScanSync: (config?: {
    exchanges?: string[];
    minScore?: number;
    maxStocks?: number;
    lookbackDays?: number;
  }) => api.get('/eod/scan/sync', { params: config }),

  // Get latest watchlist
  getLatestWatchlist: () =>
    api.get('/eod/watchlist'),

  // Get watchlist by date
  getWatchlistByDate: (date: string) =>
    api.get(`/eod/watchlist/${date}`),

  // Get today's watchlist
  getTodayWatchlist: () =>
    api.get('/eod/watchlist/today'),

  // Get stocks by status
  getStocksByStatus: (status: string) =>
    api.get(`/eod/stocks/${status}`),

  // Update stock status
  updateStockStatus: (id: number, data: {
    status: string;
    triggerPrice?: number;
    triggerTime?: string;
  }) => api.put(`/eod/stocks/${id}/status`, data),

  // Get EOD scanner status
  getStatus: () =>
    api.get('/eod/status'),

  // Get trades
  getTrades: (status?: 'OPEN' | 'CLOSED', limit?: number) =>
    api.get('/eod/trades', {
      params: { status, limit },
    }),

  // Get open positions
  getPositions: () =>
    api.get('/eod/positions'),

  // Get performance statistics
  getPerformance: (days: number = 30) =>
    api.get('/eod/performance', {
      params: { days },
    }),

  // Live monitoring control
  getMonitoringStatus: () =>
    api.get('/eod/monitoring/status'),

  startMonitoring: () =>
    api.post('/eod/monitoring/start'),

  stopMonitoring: () =>
    api.post('/eod/monitoring/stop'),

  updateMonitoringConfig: (config: any) =>
    api.put('/eod/monitoring/config', config),

  testMonitoring: (symbol: string, exchange: string) =>
    api.post(`/eod/monitoring/test/${symbol}`, { exchange }),
};
