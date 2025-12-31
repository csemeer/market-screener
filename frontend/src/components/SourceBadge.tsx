/**
 * SourceBadge Component
 * Displays the source of a watchlist stock (AUTO_SCAN, MANUAL, SCREENER)
 * with appropriate icon, color, and tooltip showing metadata
 */

import React from 'react';

export type StockSource = 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';

interface SourceMetadata {
  confidence?: number;
  strategy?: string;
  riskReward?: number;
  scanTime?: string;
  // Screener-specific metadata
  rsi?: number;
  volume?: number;
  marketCap?: number;
  screenerCriteria?: string;
  // Legacy metadata
  originalWatchlistDate?: string;
}

interface SourceBadgeProps {
  source: StockSource;
  sourceMetadata?: string | SourceMetadata; // Can be JSON string or parsed object
  className?: string;
  showTooltip?: boolean;
}

const SourceBadge: React.FC<SourceBadgeProps> = ({
  source,
  sourceMetadata,
  className = '',
  showTooltip = true,
}) => {
  // Parse metadata if it's a string
  const metadata: SourceMetadata = React.useMemo(() => {
    if (!sourceMetadata) return {};
    if (typeof sourceMetadata === 'string') {
      try {
        return JSON.parse(sourceMetadata);
      } catch {
        return {};
      }
    }
    return sourceMetadata;
  }, [sourceMetadata]);

  // Configuration for each source type
  const sourceConfig = {
    AUTO_SCAN: {
      icon: '🤖',
      label: 'Auto-Scan',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      tooltip: metadata.strategy
        ? `Auto-Scan: ${metadata.strategy}${metadata.confidence ? ` (${metadata.confidence}% confidence)` : ''}${metadata.riskReward ? `, R:R ${metadata.riskReward.toFixed(1)}:1` : ''}`
        : 'Automatically generated from EOD/Live scan',
    },
    MANUAL: {
      icon: '✋',
      label: 'Manual',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      tooltip: 'Manually added to watchlist',
    },
    SCREENER: {
      icon: '🔍',
      label: 'Screener',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-300',
      tooltip: metadata.screenerCriteria
        ? `Screener: ${metadata.screenerCriteria}${metadata.rsi ? `, RSI ${metadata.rsi}` : ''}`
        : 'Added from custom screener',
    },
  };

  const config = sourceConfig[source];

  if (!config) {
    // Fallback for unknown source (shouldn't happen with TypeScript)
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${className}`}>
        <span className="mr-1">❓</span>
        Unknown
      </span>
    );
  }

  const badge = (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      title={showTooltip ? config.tooltip : undefined}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );

  // If metadata exists and tooltip is enabled, wrap in a more detailed tooltip
  if (showTooltip && metadata && Object.keys(metadata).length > 0) {
    return (
      <div className="group relative inline-block">
        {badge}
        <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-1 text-sm text-white bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 left-0">
          <div className="font-semibold mb-1">{config.label} Details:</div>
          <div className="space-y-1 text-xs">
            {source === 'AUTO_SCAN' && (
              <>
                {metadata.strategy && (
                  <div>
                    <span className="text-gray-300">Strategy:</span> {metadata.strategy}
                  </div>
                )}
                {metadata.confidence !== undefined && (
                  <div>
                    <span className="text-gray-300">Confidence:</span>{' '}
                    <span className={metadata.confidence >= 80 ? 'text-green-400' : metadata.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {metadata.confidence}%
                    </span>
                  </div>
                )}
                {metadata.riskReward !== undefined && (
                  <div>
                    <span className="text-gray-300">Risk:Reward:</span>{' '}
                    <span className={metadata.riskReward >= 2 ? 'text-green-400' : 'text-yellow-400'}>
                      {metadata.riskReward.toFixed(1)}:1
                    </span>
                  </div>
                )}
                {metadata.scanTime && (
                  <div>
                    <span className="text-gray-300">Scanned:</span> {new Date(metadata.scanTime).toLocaleDateString()}
                  </div>
                )}
              </>
            )}
            {source === 'SCREENER' && (
              <>
                {metadata.screenerCriteria && (
                  <div>
                    <span className="text-gray-300">Criteria:</span> {metadata.screenerCriteria}
                  </div>
                )}
                {metadata.rsi !== undefined && (
                  <div>
                    <span className="text-gray-300">RSI:</span> {metadata.rsi}
                  </div>
                )}
                {metadata.volume !== undefined && (
                  <div>
                    <span className="text-gray-300">Volume:</span> {metadata.volume.toLocaleString()}
                  </div>
                )}
                {metadata.marketCap !== undefined && (
                  <div>
                    <span className="text-gray-300">Market Cap:</span> ₹{(metadata.marketCap / 10000000).toFixed(2)}Cr
                  </div>
                )}
              </>
            )}
            {source === 'MANUAL' && (
              <div className="text-gray-300 italic">
                Manually added by user
              </div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      </div>
    );
  }

  return badge;
};

export default SourceBadge;
