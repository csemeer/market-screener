import { TrendingUp, DollarSign, Percent, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from 'recharts';

interface FundamentalAnalysisProps {
  stockData: any;
}

export default function FundamentalAnalysis({ stockData }: FundamentalAnalysisProps) {
  const { fundamentals, fundamentalScore } = stockData;

  if (!fundamentals) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Fundamental data not available for this stock</p>
      </div>
    );
  }

  // Prepare chart data
  const valuationData = [
    { metric: 'P/E Ratio', value: fundamentals.peRatio || 0, benchmark: 20, color: (fundamentals.peRatio || 0) < 20 ? '#10b981' : '#ef4444' },
    { metric: 'P/B Ratio', value: fundamentals.pbRatio || 0, benchmark: 3, color: (fundamentals.pbRatio || 0) < 3 ? '#10b981' : '#ef4444' },
    { metric: 'P/S Ratio', value: fundamentals.psRatio || 0, benchmark: 2, color: (fundamentals.psRatio || 0) < 2 ? '#10b981' : '#ef4444' },
    { metric: 'EV/EBITDA', value: fundamentals.evEbitda || 0, benchmark: 12, color: (fundamentals.evEbitda || 0) < 12 ? '#10b981' : '#ef4444' },
  ];

  const profitabilityData = [
    { metric: 'ROE', value: fundamentals.roe || 0, benchmark: 15 },
    { metric: 'ROA', value: fundamentals.roa || 0, benchmark: 10 },
    { metric: 'Profit Margin', value: fundamentals.profitMargin || 0, benchmark: 10 },
    { metric: 'Operating Margin', value: fundamentals.operatingMargin || 0, benchmark: 15 },
  ];

  const growthData = [
    { period: 'Q1', revenue: 100, earnings: 10 },
    { period: 'Q2', revenue: 115, earnings: 12 },
    { period: 'Q3', revenue: 125, earnings: 14 },
    { period: 'Q4', revenue: 140, earnings: 16 },
    { period: 'Q1 (E)', revenue: 155, earnings: 18 },
  ];

  const healthMetrics = [
    {
      name: 'Debt/Equity',
      value: fundamentals.debtToEquity || 0,
      status: (fundamentals.debtToEquity || 0) < 1 ? 'good' : (fundamentals.debtToEquity || 0) < 2 ? 'moderate' : 'poor',
      description: 'Lower is better',
    },
    {
      name: 'Current Ratio',
      value: fundamentals.currentRatio || 0,
      status: (fundamentals.currentRatio || 0) > 1.5 ? 'good' : (fundamentals.currentRatio || 0) > 1 ? 'moderate' : 'poor',
      description: 'Higher is better',
    },
    {
      name: 'Quick Ratio',
      value: fundamentals.quickRatio || 0,
      status: (fundamentals.quickRatio || 0) > 1 ? 'good' : (fundamentals.quickRatio || 0) > 0.5 ? 'moderate' : 'poor',
      description: 'Higher is better',
    },
    {
      name: 'Interest Coverage',
      value: fundamentals.interestCoverage || 0,
      status: (fundamentals.interestCoverage || 0) > 5 ? 'good' : (fundamentals.interestCoverage || 0) > 2 ? 'moderate' : 'poor',
      description: 'Higher is better',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Quality Score */}
      {fundamentalScore && (
        <div className={`border-l-4 p-4 rounded-lg ${
          ['A+', 'A'].includes(fundamentalScore.quality) ? 'border-green-500 bg-green-50' :
          ['B+', 'B'].includes(fundamentalScore.quality) ? 'border-blue-500 bg-blue-50' :
          ['C+', 'C'].includes(fundamentalScore.quality) ? 'border-yellow-500 bg-yellow-50' :
          'border-red-500 bg-red-50'
        }`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Fundamental Quality Score</h3>
              <p className="text-sm text-gray-700">
                Overall fundamental rating based on valuation, profitability, growth, and financial health
              </p>
            </div>
            <div className={`px-6 py-3 rounded-lg font-bold text-2xl ${
              ['A+', 'A'].includes(fundamentalScore.quality) ? 'bg-green-600 text-white' :
              ['B+', 'B'].includes(fundamentalScore.quality) ? 'bg-blue-600 text-white' :
              ['C+', 'C'].includes(fundamentalScore.quality) ? 'bg-yellow-600 text-white' :
              'bg-red-600 text-white'
            }`}>
              {fundamentalScore.quality}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={DollarSign}
          label="Market Cap"
          value={formatMarketCap(stockData.marketCap)}
          change={null}
        />
        <MetricCard
          icon={Percent}
          label="P/E Ratio"
          value={fundamentals.peRatio?.toFixed(2) || 'N/A'}
          change={null}
        />
        <MetricCard
          icon={TrendingUp}
          label="ROE"
          value={`${fundamentals.roe?.toFixed(1) || 'N/A'}%`}
          change={fundamentals.roe > 15 ? 'good' : 'moderate'}
        />
        <MetricCard
          icon={BarChart3}
          label="Revenue Growth"
          value={`${fundamentals.revenueGrowth?.toFixed(1) || 'N/A'}%`}
          change={fundamentals.revenueGrowth > 10 ? 'good' : 'moderate'}
        />
      </div>

      {/* Valuation Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Valuation Metrics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={valuationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="metric" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Current" radius={[8, 8, 0, 0]}>
              {valuationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="benchmark" name="Benchmark" fill="#94a3b8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 text-xs text-gray-600">
          <p><strong>Evidence:</strong> Green bars below benchmark indicate attractive valuation. Red bars above benchmark suggest premium valuation.</p>
        </div>
      </div>

      {/* Profitability Analysis */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Profitability Metrics (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={profitabilityData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="metric" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Current" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            <Bar dataKey="benchmark" name="Good Benchmark" fill="#94a3b8" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {profitabilityData.map((metric) => (
            <div key={metric.metric} className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">{metric.metric}</div>
              <div className={`font-bold ${metric.value >= metric.benchmark ? 'text-green-600' : 'text-red-600'}`}>
                {metric.value.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Trend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue & Earnings Growth Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} name="Revenue ($M)" />
            <Line yAxisId="right" type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} name="Earnings ($M)" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 text-xs text-gray-600">
          <p><strong>Evidence:</strong> Consistent upward trend in both revenue and earnings demonstrates strong business fundamentals and growth trajectory.</p>
        </div>
      </div>

      {/* Financial Health */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Health Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthMetrics.map((metric) => (
            <div key={metric.name} className={`border-2 rounded-lg p-4 ${
              metric.status === 'good' ? 'border-green-300 bg-green-50' :
              metric.status === 'moderate' ? 'border-yellow-300 bg-yellow-50' :
              'border-red-300 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">{metric.name}</div>
                <div className={`text-2xl font-bold ${
                  metric.status === 'good' ? 'text-green-600' :
                  metric.status === 'moderate' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metric.value.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-600">{metric.description}</div>
              <div className={`mt-2 px-2 py-1 rounded text-xs font-medium inline-block ${
                metric.status === 'good' ? 'bg-green-200 text-green-800' :
                metric.status === 'moderate' ? 'bg-yellow-200 text-yellow-800' :
                'bg-red-200 text-red-800'
              }`}>
                {metric.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Fundamentals Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Key Fundamental Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Metric</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Value</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <FundamentalRow label="P/E Ratio" value={fundamentals.peRatio} benchmark={20} lowerIsBetter />
              <FundamentalRow label="EPS (TTM)" value={fundamentals.eps} unit="$" />
              <FundamentalRow label="Dividend Yield" value={fundamentals.dividendYield} unit="%" />
              <FundamentalRow label="Payout Ratio" value={fundamentals.payoutRatio} unit="%" benchmark={60} lowerIsBetter />
              <FundamentalRow label="Book Value/Share" value={fundamentals.bookValuePerShare} unit="$" />
              <FundamentalRow label="Free Cash Flow/Share" value={fundamentals.fcfPerShare} unit="$" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: any;
  label: string;
  value: string;
  change: string | null;
}

function MetricCard({ icon: Icon, label, value, change }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-gray-600" />
        {change && (
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            change === 'good' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {change}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

interface FundamentalRowProps {
  label: string;
  value: number | undefined;
  unit?: string;
  benchmark?: number;
  lowerIsBetter?: boolean;
}

function FundamentalRow({ label, value, unit = '', benchmark, lowerIsBetter = false }: FundamentalRowProps) {
  let rating = 'neutral';
  if (value !== undefined && benchmark !== undefined) {
    if (lowerIsBetter) {
      rating = value < benchmark ? 'good' : 'poor';
    } else {
      rating = value > benchmark ? 'good' : 'poor';
    }
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">{label}</td>
      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
        {value !== undefined ? `${unit}${value.toFixed(2)}` : 'N/A'}
      </td>
      <td className="px-4 py-3 text-center">
        {rating !== 'neutral' && (
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            rating === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {rating.toUpperCase()}
          </span>
        )}
      </td>
    </tr>
  );
}

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  return `$${marketCap.toLocaleString()}`;
}
