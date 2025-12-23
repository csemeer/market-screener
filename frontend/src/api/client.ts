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
