import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { screenerAPI, ScreenerCriteria } from '../api/client';

export default function Screener() {
  const [criteria, setCriteria] = useState<ScreenerCriteria>({
    markets: ['NSE', 'NYSE'],
    priceRange: {},
    technicalFilters: {}
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const res = await screenerAPI.getPresets();
      setPresets(res.data.presets);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const handleRunScreener = async () => {
    try {
      setLoading(true);
      const res = await screenerAPI.runScreener(criteria);
      setResults(res.data.results);
    } catch (error) {
      console.error('Error running screener:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: any) => {
    setCriteria(preset.criteria);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Stock Screener</h1>
        <p className="text-gray-600">Filter stocks based on your specific criteria</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>

            {/* Presets */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="space-y-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left px-3 py-2 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900">{preset.name}</div>
                    <div className="text-xs text-gray-600">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <hr className="my-4" />

            {/* Markets */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Markets
              </label>
              <div className="space-y-2">
                {['NSE', 'BSE', 'NYSE', 'NASDAQ'].map((market) => (
                  <label key={market} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={criteria.markets.includes(market as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCriteria({
                            ...criteria,
                            markets: [...criteria.markets, market as any]
                          });
                        } else {
                          setCriteria({
                            ...criteria,
                            markets: criteria.markets.filter(m => m !== market)
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{market}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={criteria.priceRange?.min || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    priceRange: { ...criteria.priceRange, min: Number(e.target.value) }
                  })}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={criteria.priceRange?.max || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    priceRange: { ...criteria.priceRange, max: Number(e.target.value) }
                  })}
                  className="input-field"
                />
              </div>
            </div>

            {/* RSI Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RSI Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min (0-100)"
                  value={criteria.technicalFilters?.rsiRange?.min || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    technicalFilters: {
                      ...criteria.technicalFilters,
                      rsiRange: { ...criteria.technicalFilters?.rsiRange, min: Number(e.target.value) }
                    }
                  })}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Max (0-100)"
                  value={criteria.technicalFilters?.rsiRange?.max || ''}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    technicalFilters: {
                      ...criteria.technicalFilters,
                      rsiRange: { ...criteria.technicalFilters?.rsiRange, max: Number(e.target.value) }
                    }
                  })}
                  className="input-field"
                />
              </div>
            </div>

            {/* Volume Breakout */}
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={criteria.technicalFilters?.volumeBreakout || false}
                  onChange={(e) => setCriteria({
                    ...criteria,
                    technicalFilters: {
                      ...criteria.technicalFilters,
                      volumeBreakout: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Volume Breakout (1.5x avg)</span>
              </label>
            </div>

            {/* ADX Minimum */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum ADX (Trend Strength)
              </label>
              <input
                type="number"
                placeholder="e.g., 25"
                value={criteria.technicalFilters?.adxMin || ''}
                onChange={(e) => setCriteria({
                  ...criteria,
                  technicalFilters: {
                    ...criteria.technicalFilters,
                    adxMin: Number(e.target.value)
                  }
                })}
                className="input-field"
              />
            </div>

            <button
              onClick={handleRunScreener}
              disabled={loading || criteria.markets.length === 0}
              className="btn-primary w-full"
            >
              {loading ? 'Scanning...' : 'Run Screener'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Results ({results.length})
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                Scanning stocks...
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No results yet. Configure filters and run the screener.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((stock, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg text-gray-900">{stock.symbol}</span>
                            <span className="badge badge-info">{stock.exchange}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-2xl font-bold text-gray-900">
                              ${stock.price.toFixed(2)}
                            </span>
                            <span className={`flex items-center text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                              {stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Score</div>
                        <div className="text-2xl font-bold text-primary-600">{stock.score}/100</div>
                      </div>
                    </div>

                    {/* Technical Indicators */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {stock.indicators.rsi && (
                        <div className="text-sm">
                          <span className="text-gray-600">RSI:</span>
                          <span className="ml-1 font-medium text-gray-900">{stock.indicators.rsi.toFixed(1)}</span>
                        </div>
                      )}
                      {stock.indicators.macd && (
                        <div className="text-sm">
                          <span className="text-gray-600">MACD:</span>
                          <span className={`ml-1 font-medium ${stock.indicators.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {stock.indicators.macd.histogram > 0 ? 'Bullish' : 'Bearish'}
                          </span>
                        </div>
                      )}
                      {stock.indicators.adx && (
                        <div className="text-sm">
                          <span className="text-gray-600">ADX:</span>
                          <span className="ml-1 font-medium text-gray-900">{stock.indicators.adx.toFixed(1)}</span>
                        </div>
                      )}
                      {stock.indicators.volumeProfile && (
                        <div className="text-sm">
                          <span className="text-gray-600">Volume:</span>
                          <span className="ml-1 font-medium text-gray-900">{stock.indicators.volumeProfile.volumeRatio.toFixed(2)}x</span>
                        </div>
                      )}
                    </div>

                    {/* Signals */}
                    {stock.signals && stock.signals.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {stock.signals.slice(0, 3).map((signal: string, i: number) => (
                          <span key={i} className="badge badge-success text-xs">
                            {signal}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
