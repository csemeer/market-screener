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
