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

// Custom Watchlist API - Phase 4: Unified Watchlist
export const watchlistAPI = {
  // Analyze stock and get intelligent entry/stop/target recommendations
  analyzeStock: (symbol: string, exchange: string) =>
    api.get(`/watchlist/analyze/${symbol}/${exchange}`),

  // Watchlist Management
  getWatchlists: (userId: string = 'default') =>
    api.get('/watchlist', { params: { userId } }),

  getWatchlistById: (id: number) =>
    api.get(`/watchlist/${id}`),

  createWatchlist: (data: {
    userId?: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }) => api.post('/watchlist', data),

  updateWatchlist: (id: number, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
  }) => api.put(`/watchlist/${id}`, data),

  deleteWatchlist: (id: number) =>
    api.delete(`/watchlist/${id}`),

  // Watchlist Stocks Management
  getWatchlistStocks: (id: number, filters?: {
    source?: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';
    status?: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED';
  }) => api.get(`/watchlist/${id}/stocks`, { params: filters }),

  addStockToWatchlist: (id: number, stockData: {
    symbol: string;
    exchange: string;
    companyName?: string;
    source?: 'MANUAL' | 'SCREENER';
    sourceId?: number;
    sourceMetadata?: string;
    setupType?: 'BREAKOUT' | 'BREAKDOWN' | 'PULLBACK' | 'REVERSAL' | 'CONSOLIDATION' | 'CUSTOM';
    timeframe?: 'INTRADAY' | 'SWING' | 'POSITIONAL';
    entryPrice: number;
    entryTrigger?: number;
    stopLoss: number;
    target1: number;
    target2?: number;
    target3?: number;
    trailingStopPercent?: number;
    positionSizePercent?: number;
    notes?: string;
    status?: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED';
  }) => api.post(`/watchlist/${id}/stocks`, stockData),

  addStockFromScan: (watchlistId: number, scanResultId: number) =>
    api.post(`/watchlist/${watchlistId}/stocks/from-scan/${scanResultId}`),

  addStocksFromScreener: (watchlistId: number, stocks: any[]) =>
    api.post(`/watchlist/${watchlistId}/stocks/from-screener`, { stocks }),

  updateWatchlistStock: (watchlistId: number, stockId: number, data: {
    companyName?: string;
    setupType?: string;
    timeframe?: string;
    entryPrice?: number;
    entryTrigger?: number;
    stopLoss?: number;
    target1?: number;
    target2?: number;
    target3?: number;
    trailingStopPercent?: number;
    positionSizePercent?: number;
    notes?: string;
    status?: string;
  }) => api.put(`/watchlist/${watchlistId}/stocks/${stockId}`, data),

  deleteWatchlistStock: (watchlistId: number, stockId: number) =>
    api.delete(`/watchlist/${watchlistId}/stocks/${stockId}`),

  updateStockStatus: (watchlistId: number, stockId: number, data: {
    status: 'PENDING' | 'TRIGGERED' | 'CANCELLED' | 'EXPIRED';
    triggerPrice?: number;
    triggerTime?: string;
  }) => api.patch(`/watchlist/${watchlistId}/stocks/${stockId}/status`, data),

  // Bulk Operations
  getActiveStocks: (userId: string = 'default') =>
    api.get('/watchlist/active/stocks', { params: { userId } }),
};

// Settings API - Notifications, Brokers, Trading Parameters
export const settingsAPI = {
  // Notification Settings
  getNotificationSettings: (userId: string = 'default') =>
    api.get('/settings/notifications', { params: { userId } }),

  updateNotificationSettings: (settings: {
    userId?: string;
    emailEnabled?: boolean;
    emailAddress?: string;
    smsEnabled?: boolean;
    smsPhone?: string;
    whatsappEnabled?: boolean;
    whatsappPhone?: string;
    telegramEnabled?: boolean;
    telegramChatId?: string;
    webhookEnabled?: boolean;
    webhookUrl?: string;
  }) => api.put('/settings/notifications', settings),

  testNotificationChannel: (channel: 'email' | 'sms' | 'whatsapp' | 'telegram' | 'webhook', userId: string = 'default') =>
    api.post('/settings/notifications/test', { channel, userId }),

  getNotificationStatus: () =>
    api.get('/settings/notifications/status'),

  // Notification Credentials (Service API Keys)
  getNotificationCredentials: (service: string) =>
    api.get('/settings/notifications/credentials', { params: { service } }),

  setNotificationCredentials: (credentials: {
    service: 'sendgrid' | 'smtp' | 'twilio' | 'telegram';
    credentials: {
      apiKey?: string;
      from?: string;
      accountSid?: string;
      authToken?: string;
      botToken?: string;
      [key: string]: any;
    };
  }) => api.post('/settings/notifications/credentials', credentials),

  // Broker Accounts
  getBrokerAccounts: (userId: string = 'default') =>
    api.get('/settings/brokers', { params: { userId } }),

  addBrokerAccount: (data: {
    userId?: string;
    broker: 'upstox' | 'zerodha' | 'ibkr';
    accountId: string;
    credentials: {
      apiKey?: string;
      apiSecret?: string;
      accessToken?: string;
      [key: string]: any;
    };
  }) => api.post('/settings/brokers', data),

  updateBrokerAccount: (id: number, data: {
    accountId?: string;
    credentials?: any;
    isActive?: boolean;
  }) => api.put(`/settings/brokers/${id}`, data),

  deleteBrokerAccount: (id: number) =>
    api.delete(`/settings/brokers/${id}`),

  testBrokerConnection: (id: number) =>
    api.post(`/settings/brokers/${id}/test`),

  // Trading Parameters
  getTradingParameters: (userId: string = 'default') =>
    api.get('/settings/trading-params', { params: { userId } }),

  updateTradingParameters: (params: {
    userId?: string;
    maxPositions?: number;
    maxRiskPerTrade?: number;
    maxPortfolioHeat?: number;
    defaultPositionSize?: number;
    autoExecuteSignals?: boolean;
    brokerAccountId?: number;
  }) => api.put('/settings/trading-params', params),
};

// Auto-Scalper API - Auto-trading with real-time execution
export const scalperAPI = {
  // Configuration Management
  getAllConfigs: () =>
    api.get('/scalper/configs'),

  getConfig: (id: number) =>
    api.get(`/scalper/${id}`),

  createConfig: (config: {
    name: string;
    broker: 'zerodha' | 'upstox' | 'ibkr';
    accountId: string;
    autoTrade?: boolean;
    stockSelection?: {
      method: 'MANUAL' | 'AUTO_SCREENER';
      symbols?: string[];
      maxStocks?: number;
    };
    strategy?: {
      name: string;
      timeframe?: '1m' | '3m' | '5m';
      indicators?: any;
      entryConditions?: any;
      exitConditions?: any;
    };
    riskManagement?: {
      maxPositionSize?: number;
      maxPositionsOpen?: number;
      maxDailyLoss?: number;
      maxDailyTrades?: number;
    };
    tradingHours?: {
      startTime?: string;
      endTime?: string;
      avoidFirstMinutes?: number;
      avoidLastMinutes?: number;
    };
  }) => api.post('/scalper/create', config),

  deleteConfig: (id: number) =>
    api.delete(`/scalper/${id}`),

  // Control Operations
  startScalper: (id: number) =>
    api.post(`/scalper/${id}/start`),

  stopScalper: (id: number) =>
    api.post(`/scalper/${id}/stop`),

  emergencyStopAll: () =>
    api.post('/scalper/emergency-stop'),

  // Monitoring
  getStatus: (id: number) =>
    api.get(`/scalper/${id}/status`),

  getPositions: (id: number) =>
    api.get(`/scalper/${id}/positions`),

  getTrades: (id: number, status?: 'OPEN' | 'CLOSED') =>
    api.get(`/scalper/${id}/trades`, { params: { status } }),

  // Stock Management
  addStock: (id: number, data: { symbol: string; exchange: string }) =>
    api.post(`/scalper/${id}/add-stock`, data),

  removeStock: (id: number, stockId: number) =>
    api.delete(`/scalper/${id}/stocks/${stockId}`),

  getStocks: (id: number) =>
    api.get(`/scalper/${id}/stocks`),
};

// Backtest API - Historical simulation and performance analysis
export const backtestAPI = {
  // Run Backtests
  runBacktest: (data: {
    scalperId: number;
    startDate: string; // ISO format
    endDate: string; // ISO format
    initialCapital?: number;
    backtestType?: 'PERIOD' | 'INTRADAY' | 'CUSTOM';
  }) => api.post('/backtest/run', data),

  quickTest: (scalperId: number) =>
    api.post('/backtest/quick-test', { scalperId }),

  // Get Results
  getAllRuns: (params?: {
    scalperId?: number;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    limit?: number;
  }) => api.get('/backtest/runs', { params }),

  getRunDetails: (id: number) =>
    api.get(`/backtest/runs/${id}`),

  getRunTrades: (id: number, params?: {
    status?: 'OPEN' | 'CLOSED';
    symbol?: string;
    limit?: number;
  }) => api.get(`/backtest/runs/${id}/trades`, { params }),

  getEquityCurve: (id: number) =>
    api.get(`/backtest/runs/${id}/equity-curve`),

  getMetrics: (id: number) =>
    api.get(`/backtest/runs/${id}/metrics`),

  getDailyReturns: (id: number) =>
    api.get(`/backtest/runs/${id}/daily-returns`),

  // Summary & Analysis
  getScalperSummary: (scalperId: number) =>
    api.get(`/backtest/scalpers/${scalperId}/summary`),

  // Management
  deleteRun: (id: number) =>
    api.delete(`/backtest/runs/${id}`),
};
