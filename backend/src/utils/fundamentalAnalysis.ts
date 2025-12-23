import { FundamentalData, FundamentalScore } from '../types';

/**
 * Fundamental Analysis Scoring System
 * Analyzes company fundamentals and assigns scores for different aspects
 */
export class FundamentalAnalysis {
  /**
   * Calculate comprehensive fundamental score
   */
  static calculateFundamentalScore(fundamentals: FundamentalData): FundamentalScore {
    const valuationScore = this.scoreValuation(fundamentals);
    const profitabilityScore = this.scoreProfitability(fundamentals);
    const growthScore = this.scoreGrowth(fundamentals);
    const healthScore = this.scoreFinancialHealth(fundamentals);

    // Weighted overall score
    const overall = (
      valuationScore * 0.25 +
      profitabilityScore * 0.30 +
      growthScore * 0.25 +
      healthScore * 0.20
    );

    const quality = this.getQualityGrade(overall);
    const category = this.categorizeStock(fundamentals);

    return {
      overall: Math.round(overall),
      valuation: valuationScore,
      profitability: profitabilityScore,
      growth: growthScore,
      financialHealth: healthScore,
      quality,
      category
    };
  }

  /**
   * Score Valuation Metrics (0-100)
   * Lower ratios = Higher scores (undervalued)
   */
  private static scoreValuation(f: FundamentalData): number {
    let score = 0;
    let count = 0;

    // P/E Ratio (lower is better, typical range: 10-30)
    if (f.peRatio !== undefined) {
      count++;
      if (f.peRatio < 0) score += 0; // Negative earnings
      else if (f.peRatio < 10) score += 100; // Very undervalued
      else if (f.peRatio < 15) score += 85; // Undervalued
      else if (f.peRatio < 20) score += 70; // Fair value
      else if (f.peRatio < 25) score += 50; // Slightly overvalued
      else if (f.peRatio < 30) score += 30; // Overvalued
      else score += 10; // Very overvalued
    }

    // P/B Ratio (lower is better, typical range: 1-5)
    if (f.pbRatio !== undefined) {
      count++;
      if (f.pbRatio < 1) score += 100; // Trading below book value
      else if (f.pbRatio < 2) score += 80;
      else if (f.pbRatio < 3) score += 60;
      else if (f.pbRatio < 5) score += 40;
      else score += 20;
    }

    // PEG Ratio (lower is better, < 1 is undervalued)
    if (f.pegRatio !== undefined) {
      count++;
      if (f.pegRatio < 0) score += 0; // Negative growth
      else if (f.pegRatio < 0.5) score += 100;
      else if (f.pegRatio < 1) score += 85;
      else if (f.pegRatio < 1.5) score += 65;
      else if (f.pegRatio < 2) score += 45;
      else score += 25;
    }

    // P/S Ratio (lower is better, typical range: 1-5)
    if (f.psRatio !== undefined) {
      count++;
      if (f.psRatio < 1) score += 100;
      else if (f.psRatio < 2) score += 80;
      else if (f.psRatio < 3) score += 60;
      else if (f.psRatio < 5) score += 40;
      else score += 20;
    }

    // EV/EBITDA (lower is better, typical range: 8-15)
    if (f.evToEbitda !== undefined) {
      count++;
      if (f.evToEbitda < 8) score += 100;
      else if (f.evToEbitda < 12) score += 75;
      else if (f.evToEbitda < 15) score += 55;
      else if (f.evToEbitda < 20) score += 35;
      else score += 15;
    }

    return count > 0 ? Math.round(score / count) : 50;
  }

  /**
   * Score Profitability Metrics (0-100)
   * Higher margins and returns = Higher scores
   */
  private static scoreProfitability(f: FundamentalData): number {
    let score = 0;
    let count = 0;

    // ROE (Return on Equity) - Higher is better
    if (f.roe !== undefined) {
      count++;
      if (f.roe < 0) score += 0; // Negative ROE
      else if (f.roe > 25) score += 100; // Excellent
      else if (f.roe > 20) score += 90; // Very good
      else if (f.roe > 15) score += 75; // Good
      else if (f.roe > 10) score += 55; // Average
      else if (f.roe > 5) score += 35; // Below average
      else score += 15; // Poor
    }

    // ROA (Return on Assets) - Higher is better
    if (f.roa !== undefined) {
      count++;
      if (f.roa < 0) score += 0;
      else if (f.roa > 15) score += 100;
      else if (f.roa > 10) score += 85;
      else if (f.roa > 7) score += 70;
      else if (f.roa > 5) score += 50;
      else score += 30;
    }

    // ROIC (Return on Invested Capital) - Higher is better
    if (f.roic !== undefined) {
      count++;
      if (f.roic < 0) score += 0;
      else if (f.roic > 20) score += 100;
      else if (f.roic > 15) score += 85;
      else if (f.roic > 10) score += 65;
      else if (f.roic > 7) score += 45;
      else score += 25;
    }

    // Net Profit Margin - Higher is better
    if (f.netMargin !== undefined) {
      count++;
      if (f.netMargin < 0) score += 0; // Loss-making
      else if (f.netMargin > 20) score += 100; // Excellent margins
      else if (f.netMargin > 15) score += 85;
      else if (f.netMargin > 10) score += 70;
      else if (f.netMargin > 5) score += 50;
      else score += 30;
    }

    // Operating Margin - Higher is better
    if (f.operatingMargin !== undefined) {
      count++;
      if (f.operatingMargin < 0) score += 0;
      else if (f.operatingMargin > 25) score += 100;
      else if (f.operatingMargin > 20) score += 85;
      else if (f.operatingMargin > 15) score += 70;
      else if (f.operatingMargin > 10) score += 50;
      else score += 30;
    }

    // Gross Margin - Higher is better
    if (f.grossMargin !== undefined) {
      count++;
      if (f.grossMargin < 0) score += 0;
      else if (f.grossMargin > 60) score += 100;
      else if (f.grossMargin > 50) score += 85;
      else if (f.grossMargin > 40) score += 70;
      else if (f.grossMargin > 30) score += 50;
      else score += 30;
    }

    return count > 0 ? Math.round(score / count) : 50;
  }

  /**
   * Score Growth Metrics (0-100)
   * Higher growth = Higher scores
   */
  private static scoreGrowth(f: FundamentalData): number {
    let score = 0;
    let count = 0;

    // Revenue Growth - Higher is better
    if (f.revenueGrowth !== undefined) {
      count++;
      if (f.revenueGrowth < -10) score += 0; // Declining
      else if (f.revenueGrowth < 0) score += 20; // Slight decline
      else if (f.revenueGrowth < 5) score += 40; // Slow growth
      else if (f.revenueGrowth < 10) score += 60; // Moderate
      else if (f.revenueGrowth < 20) score += 80; // Good
      else if (f.revenueGrowth < 30) score += 90; // Excellent
      else score += 100; // Exceptional
    }

    // EPS Growth - Higher is better
    if (f.epsGrowth !== undefined) {
      count++;
      if (f.epsGrowth < -10) score += 0;
      else if (f.epsGrowth < 0) score += 20;
      else if (f.epsGrowth < 5) score += 40;
      else if (f.epsGrowth < 10) score += 60;
      else if (f.epsGrowth < 20) score += 80;
      else if (f.epsGrowth < 30) score += 90;
      else score += 100;
    }

    // Earnings Growth - Higher is better
    if (f.earningsGrowth !== undefined) {
      count++;
      if (f.earningsGrowth < -10) score += 0;
      else if (f.earningsGrowth < 0) score += 20;
      else if (f.earningsGrowth < 10) score += 50;
      else if (f.earningsGrowth < 20) score += 75;
      else if (f.earningsGrowth < 30) score += 90;
      else score += 100;
    }

    return count > 0 ? Math.round(score / count) : 50;
  }

  /**
   * Score Financial Health (0-100)
   * Lower debt, higher liquidity = Higher scores
   */
  private static scoreFinancialHealth(f: FundamentalData): number {
    let score = 0;
    let count = 0;

    // Debt-to-Equity - Lower is better
    if (f.debtToEquity !== undefined) {
      count++;
      if (f.debtToEquity < 0.3) score += 100; // Very low debt
      else if (f.debtToEquity < 0.5) score += 85; // Low debt
      else if (f.debtToEquity < 1.0) score += 65; // Moderate debt
      else if (f.debtToEquity < 1.5) score += 45; // High debt
      else if (f.debtToEquity < 2.0) score += 25; // Very high debt
      else score += 10; // Excessive debt
    }

    // Current Ratio - Higher is better (> 1 is good)
    if (f.currentRatio !== undefined) {
      count++;
      if (f.currentRatio < 1) score += 30; // Poor liquidity
      else if (f.currentRatio < 1.5) score += 60;
      else if (f.currentRatio < 2) score += 80;
      else if (f.currentRatio < 3) score += 90;
      else score += 100; // Excellent liquidity
    }

    // Quick Ratio - Higher is better (> 1 is good)
    if (f.quickRatio !== undefined) {
      count++;
      if (f.quickRatio < 0.5) score += 20;
      else if (f.quickRatio < 1) score += 50;
      else if (f.quickRatio < 1.5) score += 75;
      else if (f.quickRatio < 2) score += 90;
      else score += 100;
    }

    // Interest Coverage - Higher is better
    if (f.interestCoverage !== undefined) {
      count++;
      if (f.interestCoverage < 1) score += 0; // Can't cover interest
      else if (f.interestCoverage < 2) score += 30;
      else if (f.interestCoverage < 5) score += 60;
      else if (f.interestCoverage < 10) score += 85;
      else score += 100; // Excellent coverage
    }

    return count > 0 ? Math.round(score / count) : 50;
  }

  /**
   * Convert score to letter grade
   */
  private static getQualityGrade(score: number): 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 45) return 'D';
    return 'F';
  }

  /**
   * Categorize stock based on fundamentals
   */
  private static categorizeStock(f: FundamentalData): 'VALUE' | 'GROWTH' | 'QUALITY' | 'DIVIDEND' | 'SPECULATIVE' {
    // Dividend stock
    if (f.dividendYield && f.dividendYield > 3 && f.payoutRatio && f.payoutRatio < 80) {
      return 'DIVIDEND';
    }

    // Growth stock
    if ((f.revenueGrowth && f.revenueGrowth > 15) || (f.epsGrowth && f.epsGrowth > 15)) {
      return 'GROWTH';
    }

    // Value stock
    if ((f.peRatio && f.peRatio < 15) && (f.pbRatio && f.pbRatio < 2)) {
      return 'VALUE';
    }

    // Quality stock
    if ((f.roe && f.roe > 15) && (f.debtToEquity && f.debtToEquity < 0.5) && (f.netMargin && f.netMargin > 10)) {
      return 'QUALITY';
    }

    // Default: Speculative
    return 'SPECULATIVE';
  }

  /**
   * Calculate combined Technical + Fundamental score
   * Technical: 60%, Fundamental: 40%
   */
  static calculateCombinedScore(technicalScore: number, fundamentalScore: number): number {
    return Math.round(technicalScore * 0.6 + fundamentalScore * 0.4);
  }

  /**
   * Generate recommendation based on combined analysis
   */
  static getRecommendation(
    combinedScore: number,
    technicalConfluence: number,
    fundamentalQuality: string
  ): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    // Strong Buy: High scores + High quality
    if (combinedScore >= 80 && technicalConfluence >= 70 && ['A+', 'A', 'B+'].includes(fundamentalQuality)) {
      return 'STRONG_BUY';
    }

    // Buy: Good scores
    if (combinedScore >= 70 && technicalConfluence >= 60) {
      return 'BUY';
    }

    // Sell: Poor scores
    if (combinedScore < 40 || fundamentalQuality === 'F') {
      return 'SELL';
    }

    // Strong Sell: Very poor
    if (combinedScore < 30 && (fundamentalQuality === 'F' || fundamentalQuality === 'D')) {
      return 'STRONG_SELL';
    }

    // Default: Hold
    return 'HOLD';
  }
}
