/**
 * Stock Data Transformation Helpers
 * Converts data from different scan sources into unified format
 */

import { UnifiedStockData } from '../components/UnifiedStockModal';

/**
 * Transform Auto Scan result to unified format
 */
export function transformAutoScanToUnified(stock: any): UnifiedStockData {
  // Parse technical data if it's a string
  let technicalData: any = {};
  try {
    technicalData = typeof stock.technical_data === 'string'
      ? JSON.parse(stock.technical_data)
      : (stock.technical_data || {});
  } catch (e) {
    console.error('Error parsing technical_data:', e);
  }

  // Parse evidence chart data
  let chartData: any = null;
  try {
    chartData = stock.evidence_chart_data
      ? (typeof stock.evidence_chart_data === 'string'
         ? JSON.parse(stock.evidence_chart_data)
         : stock.evidence_chart_data)
      : null;
  } catch (e) {
    console.error('Error parsing evidence_chart_data:', e);
  }

  // Parse signals
  let signals: string[] = [];
  try {
    signals = stock.signals
      ? (typeof stock.signals === 'string' ? JSON.parse(stock.signals) : stock.signals)
      : [];
  } catch (e) {
    console.error('Error parsing signals:', e);
  }

  return {
    symbol: stock.symbol,
    exchange: stock.exchange,
    companyName: stock.company_name,
    currentPrice: stock.current_price,
    entryPrice: stock.entry_price,
    stopLoss: stock.stop_loss,
    target: stock.target,
    target1: stock.target,
    riskReward: stock.risk_reward_ratio,
    confidence: stock.confidence_score,
    strategy: stock.strategy,
    source: 'AUTO_SCAN',
    sourceId: stock.id,
    chartData,
    signals,
    indicators: technicalData.indicators || {},
    patterns: technicalData.patterns || [],
    confluenceScore: technicalData.confluenceScore,
    trendDirection: technicalData.trendDirection,
    volume: technicalData.volume,
    setupType: stock.strategy?.includes('Breakout') ? 'BREAKOUT' :
               stock.strategy?.includes('Momentum') ? 'MOMENTUM' : 'CUSTOM',
    timeframe: stock.strategy_type,
  };
}

/**
 * Transform Live Scan signal to unified format
 */
export function transformLiveScanToUnified(signal: any): UnifiedStockData {
  return {
    symbol: signal.symbol,
    exchange: signal.exchange,
    companyName: signal.company_name,
    currentPrice: signal.current_price,
    entryPrice: signal.entryPrice,
    stopLoss: signal.stopLoss,
    target: signal.target,
    target1: signal.target,
    riskReward: signal.riskReward,
    strength: signal.strength,
    signal: signal.signal,
    signalType: signal.type,
    source: 'LIVE_SCAN',
    indicators: signal.indicators || {},
    timeframe: signal.timeframe === '5m' ? 'INTRADAY' : 'SWING',
  };
}

/**
 * Transform Custom Screener result to unified format
 */
export function transformScreenerToUnified(stock: any): UnifiedStockData {
  return {
    symbol: stock.symbol,
    exchange: stock.exchange,
    companyName: stock.companyName,
    currentPrice: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
    volume: stock.volume,
    score: stock.score,
    combinedScore: stock.combinedScore,
    confluenceScore: stock.confluenceScore,
    recommendation: stock.recommendation,
    source: 'SCREENER',
    indicators: stock.indicators || {},
    fundamentals: stock.fundamentals,
    fundamentalScore: stock.fundamentalScore,
    signals: stock.signals || [],
    patterns: stock.patterns || [],
    historicalData: stock.historicalData,
    quality: stock.fundamentalScore?.quality,
    // Calculate entry/stop/target from riskReward if available
    entryPrice: stock.riskReward?.entryPrice || stock.price,
    stopLoss: stock.riskReward?.stopLoss || stock.price * 0.95,
    target: stock.riskReward?.target || stock.price * 1.10,
    target1: stock.riskReward?.target || stock.price * 1.10,
  };
}
