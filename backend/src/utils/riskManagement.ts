import { RiskManagement } from '../types';

export class RiskCalculator {
  /**
   * Calculate position size based on risk parameters
   */
  static calculatePositionSize(
    accountSize: number,
    riskPercentage: number,
    entryPrice: number,
    stopLoss: number
  ): RiskManagement {
    const riskAmount = accountSize * (riskPercentage / 100);
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    const positionSize = Math.floor(riskAmount / riskPerShare);
    const potentialLoss = positionSize * riskPerShare;

    return {
      accountSize,
      riskPercentage,
      entryPrice,
      stopLoss,
      positionSize,
      riskAmount,
      potentialLoss: Math.round(potentialLoss * 100) / 100
    };
  }

  /**
   * Calculate stop loss based on ATR
   */
  static calculateATRStopLoss(
    entryPrice: number,
    atr: number,
    multiplier: number = 2,
    direction: 'long' | 'short' = 'long'
  ): number {
    if (direction === 'long') {
      return Math.round((entryPrice - (atr * multiplier)) * 100) / 100;
    } else {
      return Math.round((entryPrice + (atr * multiplier)) * 100) / 100;
    }
  }

  /**
   * Calculate target based on risk/reward ratio
   */
  static calculateTarget(
    entryPrice: number,
    stopLoss: number,
    rewardRiskRatio: number = 2,
    direction: 'long' | 'short' = 'long'
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = risk * rewardRiskRatio;

    if (direction === 'long') {
      return Math.round((entryPrice + reward) * 100) / 100;
    } else {
      return Math.round((entryPrice - reward) * 100) / 100;
    }
  }

  /**
   * Calculate risk/reward ratio
   */
  static calculateRiskRewardRatio(
    entryPrice: number,
    stopLoss: number,
    target: number
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(target - entryPrice);

    if (risk === 0) return 0;

    return Math.round((reward / risk) * 100) / 100;
  }

  /**
   * Calculate Kelly Criterion for position sizing
   */
  static kellyPositionSize(
    winRate: number,
    avgWin: number,
    avgLoss: number
  ): number {
    const b = avgWin / avgLoss;
    const p = winRate / 100;
    const q = 1 - p;

    const kelly = (b * p - q) / b;

    // Cap at 25% for safety
    return Math.max(0, Math.min(0.25, kelly)) * 100;
  }

  /**
   * Calculate portfolio heat (total risk across all positions)
   */
  static calculatePortfolioHeat(
    positions: Array<{ size: number; entryPrice: number; stopLoss: number }>,
    accountSize: number
  ): number {
    const totalRisk = positions.reduce((sum, pos) => {
      return sum + (pos.size * Math.abs(pos.entryPrice - pos.stopLoss));
    }, 0);

    return (totalRisk / accountSize) * 100;
  }

  /**
   * Suggest position sizing based on volatility
   */
  static volatilityBasedPositionSize(
    accountSize: number,
    baseRiskPercentage: number,
    currentVolatility: number,
    avgVolatility: number
  ): number {
    const volatilityRatio = currentVolatility / avgVolatility;
    const adjustedRisk = baseRiskPercentage / volatilityRatio;

    // Cap between 0.5% and 3%
    return Math.max(0.5, Math.min(3, adjustedRisk));
  }
}
