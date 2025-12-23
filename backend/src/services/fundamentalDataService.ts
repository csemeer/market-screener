import axios from 'axios';
import { FundamentalData } from '../types';

/**
 * Service for fetching fundamental data from various sources
 * Primary: Yahoo Finance API (free)
 * Fallback: Mock data for demo
 * Optional: Financial Modeling Prep, Alpha Vantage (with API keys)
 */
class FundamentalDataService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 3600000; // 1 hour (fundamentals change slowly)

  /**
   * Fetch fundamental data from Yahoo Finance
   */
  async getFundamentals(symbol: string, exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): Promise<FundamentalData | null> {
    try {
      const cacheKey = `fundamentals_${symbol}_${exchange}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      // Prepare Yahoo symbol
      let yahooSymbol = symbol;
      if (exchange === 'NSE') yahooSymbol = `${symbol}.NS`;
      if (exchange === 'BSE') yahooSymbol = `${symbol}.BO`;

      // Fetch from Yahoo Finance Statistics/Financials
      const [statsData, keyStatsData] = await Promise.all([
        this.fetchYahooStatistics(yahooSymbol),
        this.fetchYahooKeyStatistics(yahooSymbol)
      ]);

      const fundamentals = this.parseYahooData(statsData, keyStatsData);

      this.setCache(cacheKey, fundamentals);
      return fundamentals;
    } catch (error) {
      console.error(`Error fetching fundamentals for ${symbol}:`, error);

      // Return mock data for demo
      return this.getMockFundamentals(symbol, exchange);
    }
  }

  /**
   * Fetch from Yahoo Finance Statistics API
   */
  private async fetchYahooStatistics(yahooSymbol: string): Promise<any> {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${yahooSymbol}?modules=defaultKeyStatistics,financialData,summaryDetail`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      return response.data.quoteSummary?.result?.[0] || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Fetch key statistics from Yahoo Finance
   */
  private async fetchYahooKeyStatistics(yahooSymbol: string): Promise<any> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;

    try {
      const response = await axios.get(url);
      return response.data.chart?.result?.[0]?.meta || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Parse Yahoo Finance data into our format
   */
  private parseYahooData(statsData: any, keyStatsData: any): FundamentalData {
    const defaultKeyStatistics = statsData.defaultKeyStatistics || {};
    const financialData = statsData.financialData || {};
    const summaryDetail = statsData.summaryDetail || {};

    return {
      // Valuation
      peRatio: summaryDetail.trailingPE?.raw || defaultKeyStatistics.trailingPE?.raw,
      pbRatio: defaultKeyStatistics.priceToBook?.raw,
      psRatio: summaryDetail.priceToSalesTrailing12Months?.raw,
      pegRatio: defaultKeyStatistics.pegRatio?.raw,
      evToEbitda: defaultKeyStatistics.enterpriseToEbitda?.raw,
      priceToFreeCashFlow: defaultKeyStatistics.priceToFreeCashFlow?.raw,

      // Profitability
      grossMargin: financialData.grossMargins?.raw ? financialData.grossMargins.raw * 100 : undefined,
      operatingMargin: financialData.operatingMargins?.raw ? financialData.operatingMargins.raw * 100 : undefined,
      netMargin: financialData.profitMargins?.raw ? financialData.profitMargins.raw * 100 : undefined,
      roe: financialData.returnOnEquity?.raw ? financialData.returnOnEquity.raw * 100 : undefined,
      roa: financialData.returnOnAssets?.raw ? financialData.returnOnAssets.raw * 100 : undefined,

      // Growth
      revenueGrowth: financialData.revenueGrowth?.raw ? financialData.revenueGrowth.raw * 100 : undefined,
      epsGrowth: defaultKeyStatistics.earningsQuarterlyGrowth?.raw ? defaultKeyStatistics.earningsQuarterlyGrowth.raw * 100 : undefined,
      earningsGrowth: financialData.earningsGrowth?.raw ? financialData.earningsGrowth.raw * 100 : undefined,

      // Financial Health
      debtToEquity: financialData.debtToEquity?.raw,
      currentRatio: financialData.currentRatio?.raw,
      quickRatio: financialData.quickRatio?.raw,

      // Per Share
      eps: defaultKeyStatistics.trailingEps?.raw,
      bookValuePerShare: defaultKeyStatistics.bookValue?.raw,
      freeCashFlowPerShare: defaultKeyStatistics.freeCashflow?.raw ?
        defaultKeyStatistics.freeCashflow.raw / (defaultKeyStatistics.sharesOutstanding?.raw || 1) : undefined,

      // Dividend
      dividendYield: summaryDetail.dividendYield?.raw ? summaryDetail.dividendYield.raw * 100 : undefined,
      payoutRatio: summaryDetail.payoutRatio?.raw ? summaryDetail.payoutRatio.raw * 100 : undefined,

      // Other
      beta: defaultKeyStatistics.beta?.raw || summaryDetail.beta?.raw,
      sharesOutstanding: defaultKeyStatistics.sharesOutstanding?.raw,
      floatShares: defaultKeyStatistics.floatShares?.raw,
      institutionalOwnership: defaultKeyStatistics.heldPercentInstitutions?.raw ?
        defaultKeyStatistics.heldPercentInstitutions.raw * 100 : undefined,
    };
  }

  /**
   * Generate mock fundamental data for demo/fallback
   */
  private getMockFundamentals(symbol: string, exchange: 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ'): FundamentalData {
    // Generate realistic but random fundamentals based on exchange
    const isIndian = exchange === 'NSE' || exchange === 'BSE';

    // Base multipliers for different exchanges
    const peBase = isIndian ? 25 : 20;
    const marginBase = isIndian ? 12 : 15;

    return {
      // Valuation - varies by market
      peRatio: Number((peBase + (Math.random() - 0.5) * 20).toFixed(2)),
      pbRatio: Number((2 + Math.random() * 4).toFixed(2)),
      psRatio: Number((1 + Math.random() * 3).toFixed(2)),
      pegRatio: Number((1 + Math.random() * 2).toFixed(2)),
      evToEbitda: Number((8 + Math.random() * 10).toFixed(2)),

      // Profitability
      grossMargin: Number((marginBase + Math.random() * 30).toFixed(2)),
      operatingMargin: Number((8 + Math.random() * 15).toFixed(2)),
      netMargin: Number((5 + Math.random() * 12).toFixed(2)),
      roe: Number((10 + Math.random() * 20).toFixed(2)),
      roa: Number((5 + Math.random() * 15).toFixed(2)),
      roic: Number((8 + Math.random() * 18).toFixed(2)),

      // Growth
      revenueGrowth: Number(((Math.random() - 0.2) * 30).toFixed(2)),
      epsGrowth: Number(((Math.random() - 0.2) * 25).toFixed(2)),
      revenueGrowthQuarterly: Number(((Math.random() - 0.2) * 20).toFixed(2)),
      earningsGrowth: Number(((Math.random() - 0.2) * 28).toFixed(2)),

      // Financial Health
      debtToEquity: Number((Math.random() * 1.5).toFixed(2)),
      currentRatio: Number((1 + Math.random() * 2).toFixed(2)),
      quickRatio: Number((0.5 + Math.random() * 1.5).toFixed(2)),
      interestCoverage: Number((3 + Math.random() * 12).toFixed(2)),

      // Per Share
      eps: Number((5 + Math.random() * 20).toFixed(2)),
      bookValuePerShare: Number((50 + Math.random() * 200).toFixed(2)),
      freeCashFlowPerShare: Number((3 + Math.random() * 15).toFixed(2)),

      // Dividend
      dividendYield: Number((Math.random() * 4).toFixed(2)),
      payoutRatio: Number((20 + Math.random() * 50).toFixed(2)),
      dividendGrowth: Number((Math.random() * 15).toFixed(2)),

      // Other
      beta: Number((0.7 + Math.random() * 0.8).toFixed(2)),
      sharesOutstanding: Math.floor(100000000 + Math.random() * 900000000),
      floatShares: Math.floor(50000000 + Math.random() * 450000000),
      institutionalOwnership: Number((30 + Math.random() * 40).toFixed(2)),
    };
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

export const fundamentalDataService = new FundamentalDataService();
