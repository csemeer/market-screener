import axios from 'axios';
import { StockData, OHLCV } from '../types';
import { indexService } from './indexService';

/**
 * Service for fetching market data from various sources
 * Supports both Indian (NSE/BSE) and US (NYSE/NASDAQ) markets
 */
class MarketDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute

  initialize() {
    console.log('📈 Market Data Service initialized');
    console.log(`   NSE stocks: ${this.getStocksByExchange('NSE').length}`);
    console.log(`   NYSE stocks: ${this.getStocksByExchange('NYSE').length}`);
    console.log(`   NASDAQ stocks: ${this.getStocksByExchange('NASDAQ').length}`);
  }

  /**
   * Get list of stocks by exchange
   * Now uses the index service to get all unique stocks from all indexes
   */
  getStocksByExchange(exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): string[] {
    return indexService.getAllStocksByExchange(exchange);
  }

  /**
   * Get list of stocks by index
   */
  getStocksByIndex(indexId: string): string[] {
    return indexService.getIndexConstituents(indexId);
  }

  /**
   * Fetch real-time quote (using Yahoo Finance API as fallback)
   */
  async getQuote(symbol: string, exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): Promise<StockData | null> {
    try {
      const cacheKey = `quote_${symbol}_${exchange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // For Indian stocks, append .NS for NSE or .BO for BSE
      let yahooSymbol = symbol;
      if (exchange === 'NSE') yahooSymbol = `${symbol}.NS`;
      if (exchange === 'BSE') yahooSymbol = `${symbol}.BO`;

      // Using Yahoo Finance API (free alternative)
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
      const response = await axios.get(url);

      const result = response.data.chart.result[0];
      const quote = result.meta;
      const currentPrice = quote.regularMarketPrice;
      const previousClose = quote.chartPreviousClose;

      const stockData: StockData = {
        symbol,
        name: symbol, // In production, maintain a symbol-to-name mapping
        exchange,
        price: currentPrice,
        change: currentPrice - previousClose,
        changePercent: ((currentPrice - previousClose) / previousClose) * 100,
        volume: result.indicators.quote[0].volume.slice(-1)[0] || 0,
        marketCap: quote.marketCap,
        timestamp: new Date()
      };

      this.setCache(cacheKey, stockData);
      return stockData;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);

      // Return mock data for demo purposes
      return this.getMockQuote(symbol, exchange);
    }
  }

  /**
   * Fetch historical OHLCV data
   */
  async getHistoricalData(
    symbol: string,
    exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ',
    interval: '1d' | '1h' | '15m' | '5m' = '1d',
    range: string = '3mo'
  ): Promise<OHLCV[]> {
    try {
      const cacheKey = `history_${symbol}_${exchange}_${interval}_${range}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let yahooSymbol = symbol;
      if (exchange === 'NSE') yahooSymbol = `${symbol}.NS`;
      if (exchange === 'BSE') yahooSymbol = `${symbol}.BO`;

      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
      const response = await axios.get(url);

      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];

      const ohlcv: OHLCV[] = timestamps.map((ts: number, i: number) => ({
        timestamp: new Date(ts * 1000),
        open: quotes.open[i],
        high: quotes.high[i],
        low: quotes.low[i],
        close: quotes.close[i],
        volume: quotes.volume[i]
      })).filter((d: OHLCV) => d.close !== null);

      this.setCache(cacheKey, ohlcv);
      return ohlcv;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);

      // Return mock data for demo
      return this.getMockHistoricalData(symbol, interval);
    }
  }

  /**
   * Batch fetch quotes for multiple symbols
   */
  async getBatchQuotes(symbols: string[], exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): Promise<StockData[]> {
    const promises = symbols.map(symbol => this.getQuote(symbol, exchange));
    const results = await Promise.allSettled(promises);

    return results
      .filter((r): r is PromiseFulfilledResult<StockData | null> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value!);
  }

  /**
   * Generate mock quote data for demo
   */
  private getMockQuote(symbol: string, exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): StockData {
    const basePrice = exchange === 'NSE' || exchange === 'BSE' ?
      Math.random() * 2000 + 100 :
      Math.random() * 300 + 50;

    const change = (Math.random() - 0.5) * basePrice * 0.05;

    return {
      symbol,
      name: symbol,
      exchange,
      price: Math.round(basePrice * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / basePrice) * 10000) / 100,
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.random() * 1000000000000,
      timestamp: new Date()
    };
  }

  /**
   * Generate mock historical data for demo
   */
  private getMockHistoricalData(symbol: string, interval: string): OHLCV[] {
    const data: OHLCV[] = [];
    const periods = interval === '5m' ? 78 : interval === '15m' ? 26 : interval === '1h' ? 100 : 90;
    let basePrice = Math.random() * 200 + 50;

    for (let i = 0; i < periods; i++) {
      const change = (Math.random() - 0.5) * basePrice * 0.03;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);

      data.push({
        timestamp: new Date(Date.now() - (periods - i) * (interval === '1d' ? 86400000 : interval === '1h' ? 3600000 : interval === '15m' ? 900000 : 300000)),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 1000000)
      });

      basePrice = close;
    }

    return data;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export const marketDataService = new MarketDataService();
