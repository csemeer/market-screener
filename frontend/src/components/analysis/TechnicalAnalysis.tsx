import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface TechnicalAnalysisProps {
  stockData: any;
}

export default function TechnicalAnalysis({ stockData }: TechnicalAnalysisProps) {
  const { indicators } = stockData;

  // Analyze each indicator
  const analyses = [
    {
      name: 'RSI (Relative Strength Index)',
      value: indicators.rsi?.toFixed(2) || 'N/A',
      signal: getRSISignal(indicators.rsi),
      description: getRSIDescription(indicators.rsi),
      evidence: `RSI at ${indicators.rsi?.toFixed(2)} indicates ${
        indicators.rsi > 70 ? 'overbought conditions - potential reversal' :
        indicators.rsi < 30 ? 'oversold conditions - potential bounce' :
        'neutral momentum'
      }`,
    },
    {
      name: 'MACD (Moving Average Convergence Divergence)',
      value: `${indicators.macd?.toFixed(2) || 'N/A'} / ${indicators.macdSignal?.toFixed(2) || 'N/A'}`,
      signal: getMACDSignal(indicators.macd, indicators.macdSignal),
      description: getMACDDescription(indicators.macd, indicators.macdSignal),
      evidence: `MACD ${indicators.macd > indicators.macdSignal ? 'above' : 'below'} signal line suggests ${
        indicators.macd > indicators.macdSignal ? 'bullish momentum' : 'bearish momentum'
      }`,
    },
    {
      name: 'ADX (Average Directional Index)',
      value: indicators.adx?.toFixed(2) || 'N/A',
      signal: getADXSignal(indicators.adx),
      description: getADXDescription(indicators.adx),
      evidence: `ADX at ${indicators.adx?.toFixed(2)} shows ${
        indicators.adx > 40 ? 'strong trend strength' :
        indicators.adx > 25 ? 'moderate trend strength' :
        'weak or no trend'
      }`,
    },
    {
      name: 'Stochastic %K',
      value: indicators.stochK?.toFixed(2) || 'N/A',
      signal: getStochasticSignal(indicators.stochK),
      description: getStochasticDescription(indicators.stochK),
      evidence: `Stochastic at ${indicators.stochK?.toFixed(2)} indicates ${
        indicators.stochK > 80 ? 'overbought zone' :
        indicators.stochK < 20 ? 'oversold zone' :
        'neutral range'
      }`,
    },
    {
      name: 'Bollinger Bands Position',
      value: indicators.bbPosition || 'N/A',
      signal: getBBSignal(indicators.bbPosition),
      description: getBBDescription(indicators.bbPosition),
      evidence: `Price ${indicators.bbPosition} Bollinger Bands suggests ${
        indicators.bbPosition === 'Above Upper' ? 'potential overbought - reversal possible' :
        indicators.bbPosition === 'Below Lower' ? 'potential oversold - bounce possible' :
        'normal trading range'
      }`,
    },
    {
      name: 'Volume Trend',
      value: indicators.volumeTrend || 'N/A',
      signal: getVolumeSignal(indicators.volumeTrend),
      description: getVolumeDescription(indicators.volumeTrend),
      evidence: `Volume is ${indicators.volumeTrend} indicating ${
        indicators.volumeTrend === 'Increasing' ? 'strong participation and conviction' :
        indicators.volumeTrend === 'Decreasing' ? 'weakening interest' :
        'normal trading activity'
      }`,
    },
  ];

  // Calculate overall technical score
  const bullishSignals = analyses.filter(a => a.signal === 'bullish').length;
  const bearishSignals = analyses.filter(a => a.signal === 'bearish').length;
  const neutralSignals = analyses.filter(a => a.signal === 'neutral').length;

  const overallSignal = bullishSignals > bearishSignals ? 'BULLISH' :
                        bearishSignals > bullishSignals ? 'BEARISH' : 'NEUTRAL';

  // Prepare chart data
  const signalChartData = [
    { name: 'Bullish', value: bullishSignals, color: '#10b981' },
    { name: 'Neutral', value: neutralSignals, color: '#f59e0b' },
    { name: 'Bearish', value: bearishSignals, color: '#ef4444' },
  ];

  // Radar chart data for indicator strength
  const radarData = [
    { indicator: 'Momentum', value: normalizeIndicator(indicators.rsi, 0, 100) },
    { indicator: 'Trend', value: normalizeIndicator(indicators.adx, 0, 100) },
    { indicator: 'Volume', value: 65 }, // Placeholder
    { indicator: 'Volatility', value: 70 }, // Placeholder
    { indicator: 'Support', value: 55 }, // Placeholder
  ];

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className={`border-l-4 p-4 rounded-lg ${
        overallSignal === 'BULLISH' ? 'border-green-500 bg-green-50' :
        overallSignal === 'BEARISH' ? 'border-red-500 bg-red-50' :
        'border-yellow-500 bg-yellow-50'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Technical Analysis Summary</h3>
            <p className="text-sm text-gray-700">
              {bullishSignals} Bullish • {neutralSignals} Neutral • {bearishSignals} Bearish signals
            </p>
          </div>
          <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
            overallSignal === 'BULLISH' ? 'bg-green-600 text-white' :
            overallSignal === 'BEARISH' ? 'bg-red-600 text-white' :
            'bg-yellow-600 text-white'
          }`}>
            Overall: {overallSignal}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signal Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Signal Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={signalChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {signalChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Technical Strength Radar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Technical Strength</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="indicator" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Strength" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Indicators */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Technical Indicators</h3>
        <div className="space-y-3">
          {analyses.map((analysis, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {analysis.signal === 'bullish' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {analysis.signal === 'bearish' && <TrendingDown className="w-5 h-5 text-red-600" />}
                    {analysis.signal === 'neutral' && <AlertCircle className="w-5 h-5 text-yellow-600" />}
                    <h4 className="font-semibold text-gray-900">{analysis.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{analysis.description}</p>
                  <div className="bg-gray-50 border-l-4 border-blue-500 p-2 rounded text-xs text-gray-700">
                    <strong>Evidence:</strong> {analysis.evidence}
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-xs text-gray-600 mb-1">Value</div>
                  <div className="font-bold text-gray-900">{analysis.value}</div>
                  <div className={`mt-1 px-2 py-1 rounded text-xs font-medium ${
                    analysis.signal === 'bullish' ? 'bg-green-100 text-green-800' :
                    analysis.signal === 'bearish' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {analysis.signal.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support & Resistance Levels */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Key Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-xs text-red-700 font-medium mb-1">Resistance 1</div>
            <div className="text-xl font-bold text-red-900">${(stockData.price * 1.05).toFixed(2)}</div>
            <div className="text-xs text-red-600 mt-1">+5.0%</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-blue-700 font-medium mb-1">Current Price</div>
            <div className="text-xl font-bold text-blue-900">${stockData.price.toFixed(2)}</div>
            <div className="text-xs text-blue-600 mt-1">Entry Zone</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-700 font-medium mb-1">Support 1</div>
            <div className="text-xl font-bold text-green-900">${(stockData.price * 0.95).toFixed(2)}</div>
            <div className="text-xs text-green-600 mt-1">-5.0%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for signal analysis
function getRSISignal(rsi: number): 'bullish' | 'bearish' | 'neutral' {
  if (!rsi) return 'neutral';
  if (rsi < 30) return 'bullish'; // Oversold
  if (rsi > 70) return 'bearish'; // Overbought
  return 'neutral';
}

function getRSIDescription(rsi: number): string {
  if (!rsi) return 'RSI data not available';
  if (rsi < 30) return 'Oversold - potential buying opportunity';
  if (rsi > 70) return 'Overbought - potential selling pressure';
  if (rsi > 50) return 'Bullish momentum';
  return 'Bearish momentum';
}

function getMACDSignal(macd: number, signal: number): 'bullish' | 'bearish' | 'neutral' {
  if (!macd || !signal) return 'neutral';
  return macd > signal ? 'bullish' : 'bearish';
}

function getMACDDescription(macd: number, signal: number): string {
  if (!macd || !signal) return 'MACD data not available';
  if (macd > signal && macd > 0) return 'Strong bullish crossover - uptrend confirmed';
  if (macd > signal) return 'Bullish crossover - momentum shifting up';
  if (macd < signal && macd < 0) return 'Strong bearish crossover - downtrend confirmed';
  return 'Bearish crossover - momentum shifting down';
}

function getADXSignal(adx: number): 'bullish' | 'bearish' | 'neutral' {
  if (!adx) return 'neutral';
  if (adx > 40) return 'bullish'; // Strong trend (could be either direction, but strength is bullish signal)
  if (adx < 20) return 'neutral';
  return 'neutral';
}

function getADXDescription(adx: number): string {
  if (!adx) return 'ADX data not available';
  if (adx > 40) return 'Very strong trend - excellent for trend following';
  if (adx > 25) return 'Strong trend - good for trading';
  if (adx > 20) return 'Emerging trend';
  return 'Weak trend - range-bound market';
}

function getStochasticSignal(stochK: number): 'bullish' | 'bearish' | 'neutral' {
  if (!stochK) return 'neutral';
  if (stochK < 20) return 'bullish'; // Oversold
  if (stochK > 80) return 'bearish'; // Overbought
  return 'neutral';
}

function getStochasticDescription(stochK: number): string {
  if (!stochK) return 'Stochastic data not available';
  if (stochK < 20) return 'Oversold zone - potential reversal up';
  if (stochK > 80) return 'Overbought zone - potential reversal down';
  return 'Normal trading range';
}

function getBBSignal(position: string): 'bullish' | 'bearish' | 'neutral' {
  if (position === 'Below Lower') return 'bullish';
  if (position === 'Above Upper') return 'bearish';
  return 'neutral';
}

function getBBDescription(position: string): string {
  if (position === 'Below Lower') return 'Price below lower band - oversold, bounce likely';
  if (position === 'Above Upper') return 'Price above upper band - overbought, pullback likely';
  if (position === 'Near Upper') return 'Approaching resistance - watch for reversal';
  if (position === 'Near Lower') return 'Approaching support - watch for bounce';
  return 'Price in normal range';
}

function getVolumeSignal(trend: string): 'bullish' | 'bearish' | 'neutral' {
  if (trend === 'Increasing') return 'bullish';
  if (trend === 'Decreasing') return 'bearish';
  return 'neutral';
}

function getVolumeDescription(trend: string): string {
  if (trend === 'Increasing') return 'Volume increasing - strong conviction in current move';
  if (trend === 'Decreasing') return 'Volume decreasing - weakening momentum';
  return 'Stable volume - normal trading';
}

function normalizeIndicator(value: number, min: number, max: number): number {
  if (!value) return 50;
  return ((value - min) / (max - min)) * 100;
}
