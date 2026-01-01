import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ListPlus } from 'lucide-react';

interface StockDataTableProps {
  data: any[];
  onExport?: () => void;
  onAddToWatchlist?: (stock: any) => void;
  onStockClick?: (stock: any) => void;
}

type SortField = 'symbol' | 'price' | 'changePercent' | 'score' | 'combinedScore' | 'confluenceScore' | 'fundamentalScore';
type SortDirection = 'asc' | 'desc' | null;

export default function StockDataTable({ data, onExport, onAddToWatchlist, onStockClick }: StockDataTableProps) {
  const [sortField, setSortField] = useState<SortField>('combinedScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState<number | ''>('');
  const [recommendationFilter, setRecommendationFilter] = useState<string>('all');

  // Filter data
  const filteredData = useMemo(() => {
    return data.filter(stock => {
      // Search filter
      if (searchTerm && !stock.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Score filter
      if (minScore !== '' && (stock.combinedScore || stock.score) < minScore) {
        return false;
      }
      // Recommendation filter
      if (recommendationFilter !== 'all' && stock.recommendation !== recommendationFilter) {
        return false;
      }
      return true;
    });
  }, [data, searchTerm, minScore, recommendationFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'combinedScore') {
        aValue = a.combinedScore || a.score;
        bValue = b.combinedScore || b.score;
      } else if (sortField === 'fundamentalScore') {
        aValue = a.fundamentalScore?.overall || 0;
        bValue = b.fundamentalScore?.overall || 0;
      } else if (sortField === 'confluenceScore') {
        aValue = a.confluenceScore || 0;
        bValue = b.confluenceScore || 0;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    if (sortDirection === 'asc') return <ArrowUp className="w-4 h-4 text-primary-600" />;
    if (sortDirection === 'desc') return <ArrowDown className="w-4 h-4 text-primary-600" />;
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Filters Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search Symbol</label>
            <input
              type="text"
              placeholder="e.g., AAPL"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Score</label>
            <input
              type="number"
              placeholder="e.g., 70"
              value={minScore}
              onChange={(e) => {
                setMinScore(e.target.value === '' ? '' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Recommendation</label>
            <select
              value={recommendationFilter}
              onChange={(e) => {
                setRecommendationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="STRONG_BUY">Strong Buy</option>
              <option value="BUY">Buy</option>
              <option value="HOLD">Hold</option>
              <option value="SELL">Sell</option>
              <option value="STRONG_SELL">Strong Sell</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Items per page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <span>Showing {paginatedData.length} of {filteredData.length} results {filteredData.length !== data.length && `(filtered from ${data.length})`}</span>
          {onExport && (
            <button
              onClick={onExport}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
            >
              Export Filtered Results
            </button>
          )}
        </div>
      </div>

      {/* Data Table - Desktop */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('symbol')}
                    className="flex items-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600"
                  >
                    <span>Symbol</span>
                    <SortIcon field="symbol" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center justify-end space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 ml-auto"
                  >
                    <span>Price</span>
                    <SortIcon field="price" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('changePercent')}
                    className="flex items-center justify-end space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 ml-auto"
                  >
                    <span>Change %</span>
                    <SortIcon field="changePercent" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort('combinedScore')}
                    className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 mx-auto"
                  >
                    <span>Score</span>
                    <SortIcon field="combinedScore" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort('confluenceScore')}
                    className="flex items-center justify-center space-x-1 text-xs font-semibold text-gray-700 uppercase tracking-wider hover:text-primary-600 mx-auto"
                  >
                    <span>Confluence</span>
                    <SortIcon field="confluenceScore" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Quality</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Recommendation</span>
                </th>
                <th className="px-4 py-3 text-left">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Key Metrics</span>
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((stock, idx) => (
                <tr
                  key={idx}
                  onClick={() => onStockClick?.(stock)}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-bold text-gray-900">{stock.symbol}</div>
                      <div className="text-xs text-gray-500">{stock.exchange}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-semibold text-gray-900">${stock.price.toFixed(2)}</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className={`flex items-center justify-end font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-800">
                      {(stock.combinedScore || stock.score)}/100
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {stock.confluenceScore ? (
                      <div className="text-sm font-semibold text-purple-600">
                        {stock.confluenceScore.toFixed(0)}%
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {stock.fundamentalScore ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        ['A+', 'A'].includes(stock.fundamentalScore.quality) ? 'bg-green-100 text-green-800' :
                        ['B+', 'B'].includes(stock.fundamentalScore.quality) ? 'bg-blue-100 text-blue-800' :
                        ['C+', 'C'].includes(stock.fundamentalScore.quality) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stock.fundamentalScore.quality}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {stock.recommendation ? (
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        stock.recommendation === 'STRONG_BUY' ? 'bg-green-600 text-white' :
                        stock.recommendation === 'BUY' ? 'bg-green-500 text-white' :
                        stock.recommendation === 'HOLD' ? 'bg-yellow-500 text-white' :
                        stock.recommendation === 'SELL' ? 'bg-red-500 text-white' :
                        'bg-red-700 text-white'
                      }`}>
                        {stock.recommendation.replace('_', ' ')}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">RSI:</span>
                        <span className="ml-1 font-medium">{stock.indicators.rsi?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">ADX:</span>
                        <span className="ml-1 font-medium">{stock.indicators.adx?.toFixed(1) || 'N/A'}</span>
                      </div>
                      {stock.fundamentals?.peRatio && (
                        <div>
                          <span className="text-gray-500">P/E:</span>
                          <span className="ml-1 font-medium">{stock.fundamentals.peRatio.toFixed(1)}</span>
                        </div>
                      )}
                      {stock.fundamentals?.roe && (
                        <div>
                          <span className="text-gray-500">ROE:</span>
                          <span className="ml-1 font-medium">{stock.fundamentals.roe.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {onAddToWatchlist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToWatchlist(stock);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        <ListPlus className="w-3.5 h-3.5 mr-1" />
                        Add
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedData.map((stock, idx) => (
          <div
            key={idx}
            onClick={() => onStockClick?.(stock)}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-lg text-gray-900">{stock.symbol}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">{stock.exchange}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">${stock.price.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className={`flex items-center text-sm font-medium ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Score and Quality */}
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-200">
              <div className="flex-1">
                <div className="text-xs text-gray-600 mb-1">Score</div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary-100 text-primary-800">
                  {(stock.combinedScore || stock.score)}/100
                </div>
              </div>
              {stock.fundamentalScore && (
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">Quality</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    ['A+', 'A'].includes(stock.fundamentalScore.quality) ? 'bg-green-100 text-green-800' :
                    ['B+', 'B'].includes(stock.fundamentalScore.quality) ? 'bg-blue-100 text-blue-800' :
                    ['C+', 'C'].includes(stock.fundamentalScore.quality) ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stock.fundamentalScore.quality}
                  </span>
                </div>
              )}
              {stock.recommendation && (
                <div className="flex-1">
                  <div className="text-xs text-gray-600 mb-1">Action</div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    stock.recommendation === 'STRONG_BUY' ? 'bg-green-600 text-white' :
                    stock.recommendation === 'BUY' ? 'bg-green-500 text-white' :
                    stock.recommendation === 'HOLD' ? 'bg-yellow-500 text-white' :
                    stock.recommendation === 'SELL' ? 'bg-red-500 text-white' :
                    'bg-red-700 text-white'
                  }`}>
                    {stock.recommendation.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {stock.indicators.rsi && (
                <div>
                  <span className="text-gray-600">RSI:</span>
                  <span className="ml-1 font-medium">{stock.indicators.rsi.toFixed(1)}</span>
                </div>
              )}
              {stock.indicators.adx && (
                <div>
                  <span className="text-gray-600">ADX:</span>
                  <span className="ml-1 font-medium">{stock.indicators.adx.toFixed(1)}</span>
                </div>
              )}
              {stock.confluenceScore && (
                <div>
                  <span className="text-gray-600">Confluence:</span>
                  <span className="ml-1 font-medium text-purple-600">{stock.confluenceScore.toFixed(0)}%</span>
                </div>
              )}
              {stock.fundamentals?.peRatio && (
                <div>
                  <span className="text-gray-600">P/E:</span>
                  <span className="ml-1 font-medium">{stock.fundamentals.peRatio.toFixed(1)}</span>
                </div>
              )}
              {stock.fundamentals?.roe && (
                <div>
                  <span className="text-gray-600">ROE:</span>
                  <span className="ml-1 font-medium">{stock.fundamentals.roe.toFixed(1)}%</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {onAddToWatchlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToWatchlist(stock);
                }}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <ListPlus className="w-4 h-4 mr-2" />
                Add to Watchlist
              </button>
            )}
          </div>
        ))}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {paginatedData.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <p className="text-gray-500">No stocks match your filters</p>
        </div>
      )}
    </div>
  );
}
