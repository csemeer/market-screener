# Unified Watchlist Architecture - AlphaStream v1.1+

**Document Version**: 2.0
**Created**: 2025-12-31
**Last Updated**: 2025-12-31
**Status**: ✅ IMPLEMENTED (Phase 4A-4D Complete, Phase 4E Testing)
**Related**: See commits 7393610, 26a9626, fe920d4

---

## Executive Summary

AlphaStream currently has **two separate watchlist systems** that cause user confusion and code duplication:

1. **`watchlist` table** - Auto-generated from EOD scans (deprecated pattern)
2. **`custom_watchlist` + `custom_watchlist_stocks` tables** - User-managed watchlists

This document proposes a **unified watchlist architecture** that consolidates both systems while preserving all functionality and adding source tracking for better transparency.

---

## Problem Statement

### Current Issues

| Problem | Impact | Severity |
|---------|--------|----------|
| Two separate watchlist tables with overlapping data | Code duplication, maintenance burden | 🔴 High |
| Users confused about difference between EOD and custom watchlists | Poor UX, duplicate entries | 🔴 High |
| No source tracking (where did this stock come from?) | Lost context, harder debugging | 🟡 Medium |
| Separate APIs and services for each system | More code to maintain | 🟡 Medium |
| Cannot mix auto-scan and manual stocks in one list | Inflexible organization | 🟡 Medium |

### User Confusion Example

**User**: "I added AAPL manually, but it's also in EOD watchlist. Do I need both?"
**Current Answer**: "They're separate systems. EOD is auto-generated, custom is yours."
**User Reaction**: "That's confusing. Can't I just have one watchlist?"

---

## Proposed Solution: Unified Watchlist System

### Core Concept

**One watchlist system to rule them all** - with source tracking to show where each stock came from.

```
┌─────────────────────────────────────────────────────┐
│             UNIFIED WATCHLIST SYSTEM                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  User creates watchlist: "Tech Stocks"             │
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │ Stock: AAPL  │ Source: 🤖 Auto-Scan       │    │
│  │ Stock: MSFT  │ Source: ✋ Manual          │    │
│  │ Stock: GOOGL │ Source: 🔍 Screener       │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
│  All stocks in ONE list, clear origin badges       │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### New Unified Schema

```sql
-- Enhanced custom_watchlist table (becomes THE watchlist table)
CREATE TABLE IF NOT EXISTS custom_watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL DEFAULT 'default_user',
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced custom_watchlist_stocks with source tracking
CREATE TABLE IF NOT EXISTS custom_watchlist_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  watchlist_id INTEGER NOT NULL,

  -- Stock identification
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL,
  company_name TEXT,

  -- Source tracking (NEW!)
  source TEXT NOT NULL DEFAULT 'MANUAL',  -- 'AUTO_SCAN' | 'MANUAL' | 'SCREENER'
  source_id INTEGER,  -- Foreign key to scan_results.id if AUTO_SCAN
  source_metadata TEXT,  -- JSON: { confidence: 85, strategy: "Momentum Breakout" }

  -- Trading parameters
  setup_type TEXT,  -- 'BREAKOUT', 'BREAKDOWN', 'PULLBACK', etc.
  timeframe TEXT,  -- 'INTRADAY', 'SWING', 'POSITIONAL'
  entry_price REAL NOT NULL,
  entry_trigger REAL,
  stop_loss REAL NOT NULL,
  target_1 REAL NOT NULL,
  target_2 REAL,
  target_3 REAL,
  trailing_stop_percent REAL DEFAULT 1.0,
  position_size_percent REAL DEFAULT 1.0,

  -- Status tracking
  status TEXT DEFAULT 'PENDING',  -- 'PENDING', 'ACTIVE', 'TRIGGERED', 'CANCELLED', 'COMPLETED'
  trigger_condition TEXT,
  triggered_at DATETIME,

  -- Metadata
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (watchlist_id) REFERENCES custom_watchlist(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES scan_results(id) ON DELETE SET NULL,
  UNIQUE(watchlist_id, symbol, exchange)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_source ON custom_watchlist_stocks(source);
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_status ON custom_watchlist_stocks(status);
CREATE INDEX IF NOT EXISTS idx_watchlist_stocks_source_id ON custom_watchlist_stocks(source_id);
```

### Migration Strategy

```sql
-- Phase 1: Add new columns to existing table (backward compatible)
ALTER TABLE custom_watchlist_stocks ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE custom_watchlist_stocks ADD COLUMN source_id INTEGER;
ALTER TABLE custom_watchlist_stocks ADD COLUMN source_metadata TEXT;

-- Phase 2: Migrate existing EOD watchlist data
INSERT INTO custom_watchlist (name, description, is_active)
VALUES ('Auto-Scan Signals (Legacy)', 'Automatically generated from EOD scans', TRUE);

SET @auto_watchlist_id = last_insert_rowid();

INSERT INTO custom_watchlist_stocks (
  watchlist_id, symbol, exchange, company_name,
  source, source_id, source_metadata,
  entry_price, stop_loss, target_1, setup_type, timeframe, status
)
SELECT
  @auto_watchlist_id,
  symbol, exchange, company_name,
  'AUTO_SCAN' as source,
  id as source_id,
  json_object(
    'confidence', confidence_score,
    'strategy', strategy,
    'riskReward', risk_reward_ratio
  ) as source_metadata,
  entry_price, stop_loss, target, setup_type, strategy_type, status
FROM watchlist
WHERE status IN ('PENDING', 'ACTIVE');

-- Phase 3: Deprecate old watchlist table (keep for now, delete in v1.2)
-- DROP TABLE watchlist; -- Don't drop yet, keep as backup
```

---

## API Changes

### Unified API Endpoints

```typescript
// NEW: Unified watchlist API
GET    /api/watchlist                      // Get all watchlists for user
POST   /api/watchlist                      // Create new watchlist
GET    /api/watchlist/:id                  // Get specific watchlist with stocks
PUT    /api/watchlist/:id                  // Update watchlist metadata
DELETE /api/watchlist/:id                  // Delete watchlist

// Stock management
GET    /api/watchlist/:id/stocks           // Get stocks in watchlist
POST   /api/watchlist/:id/stocks           // Add stock (manual or from scan)
PUT    /api/watchlist/:id/stocks/:stockId  // Update stock parameters
DELETE /api/watchlist/:id/stocks/:stockId  // Remove stock

// NEW: Source-specific additions
POST   /api/watchlist/:id/stocks/from-scan/:scanId  // Add stock from auto-scan result
POST   /api/watchlist/:id/stocks/from-screener      // Add stocks from screener results

// DEPRECATED (redirect to unified API)
GET    /api/eod/watchlist      → GET /api/watchlist (filter source=AUTO_SCAN)
POST   /api/eod/add-to-watch   → POST /api/watchlist/:id/stocks/from-scan/:scanId
```

---

## Frontend UI Changes

### Unified Watchlist Page

```typescript
// /watchlist page shows all watchlists

<WatchlistPage>
  <WatchlistSidebar>
    {watchlists.map(wl => (
      <WatchlistItem key={wl.id}>
        {wl.name}
        <Badge>{wl.stockCount} stocks</Badge>
      </WatchlistItem>
    ))}
    <Button onClick={createWatchlist}>+ New Watchlist</Button>
  </WatchlistSidebar>

  <WatchlistContent>
    <WatchlistHeader>
      <h2>{selectedWatchlist.name}</h2>
      <Button onClick={addStock}>+ Add Stock</Button>
    </WatchlistHeader>

    <StockTable>
      {stocks.map(stock => (
        <StockRow key={stock.id}>
          <SourceBadge source={stock.source}>
            {stock.source === 'AUTO_SCAN' && '🤖 Auto-Scan'}
            {stock.source === 'MANUAL' && '✋ Manual'}
            {stock.source === 'SCREENER' && '🔍 Screener'}
          </SourceBadge>
          <Symbol>{stock.symbol}</Symbol>
          <Entry>{stock.entryPrice}</Entry>
          <Target>{stock.target1}</Target>
          <StopLoss>{stock.stopLoss}</StopLoss>
          <Actions>
            <Button onClick={() => viewDetails(stock)}>View</Button>
            <Button onClick={() => removeStock(stock)}>Remove</Button>
          </Actions>
        </StockRow>
      ))}
    </StockTable>
  </WatchlistContent>
</WatchlistPage>
```

### Source Badge Component

```typescript
interface SourceBadgeProps {
  source: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';
  metadata?: any;
}

function SourceBadge({ source, metadata }: SourceBadgeProps) {
  const config = {
    AUTO_SCAN: {
      icon: '🤖',
      color: 'bg-blue-100 text-blue-800',
      label: 'Auto-Scan',
      tooltip: metadata?.strategy ? `From ${metadata.strategy} (Confidence: ${metadata.confidence}%)` : 'Auto-generated'
    },
    MANUAL: {
      icon: '✋',
      color: 'bg-green-100 text-green-800',
      label: 'Manual',
      tooltip: 'Added manually'
    },
    SCREENER: {
      icon: '🔍',
      color: 'bg-purple-100 text-purple-800',
      label: 'Screener',
      tooltip: 'From custom screener'
    }
  }[source];

  return (
    <Tooltip content={config.tooltip}>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    </Tooltip>
  );
}
```

---

## Service Layer Changes

### DatabaseService Updates

```typescript
class DatabaseService {
  // NEW: Unified watchlist methods
  getWatchlistsForUser(userId: string): Watchlist[] {
    return this.db.prepare(`
      SELECT w.*,
             COUNT(s.id) as stock_count,
             SUM(CASE WHEN s.source = 'AUTO_SCAN' THEN 1 ELSE 0 END) as auto_scan_count,
             SUM(CASE WHEN s.source = 'MANUAL' THEN 1 ELSE 0 END) as manual_count
      FROM custom_watchlist w
      LEFT JOIN custom_watchlist_stocks s ON w.id = s.watchlist_id
      WHERE w.user_id = ?
      GROUP BY w.id
      ORDER BY w.updated_at DESC
    `).all(userId);
  }

  getWatchlistStocks(watchlistId: number, filters?: {
    source?: 'AUTO_SCAN' | 'MANUAL' | 'SCREENER';
    status?: string;
  }): WatchlistStock[] {
    let query = `
      SELECT s.*,
             sr.confidence_score,
             sr.strategy,
             sr.evidence_chart_data
      FROM custom_watchlist_stocks s
      LEFT JOIN scan_results sr ON s.source_id = sr.id AND s.source = 'AUTO_SCAN'
      WHERE s.watchlist_id = ?
    `;

    const params: any[] = [watchlistId];

    if (filters?.source) {
      query += ` AND s.source = ?`;
      params.push(filters.source);
    }

    if (filters?.status) {
      query += ` AND s.status = ?`;
      params.push(filters.status);
    }

    query += ` ORDER BY s.created_at DESC`;

    return this.db.prepare(query).all(...params);
  }

  addStockFromAutoScan(watchlistId: number, scanResultId: number): number {
    const scan = this.db.prepare(`
      SELECT * FROM scan_results WHERE id = ?
    `).get(scanResultId);

    if (!scan) throw new Error('Scan result not found');

    return this.db.prepare(`
      INSERT INTO custom_watchlist_stocks (
        watchlist_id, symbol, exchange, company_name,
        source, source_id, source_metadata,
        entry_price, stop_loss, target_1, setup_type, timeframe
      ) VALUES (?, ?, ?, ?, 'AUTO_SCAN', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      watchlistId,
      scan.symbol,
      scan.exchange,
      scan.company_name,
      scanResultId,
      JSON.stringify({
        confidence: scan.confidence_score,
        strategy: scan.strategy,
        riskReward: scan.risk_reward_ratio
      }),
      scan.entry_price,
      scan.stop_loss,
      scan.target,
      scan.setup_type,
      scan.strategy_type
    ).lastInsertRowid as number;
  }

  // DEPRECATED: Keep for backward compatibility
  getWatchlistStocksLegacy(): WatchlistStock[] {
    loggerService.warn('Using deprecated getWatchlistStocksLegacy(). Migrate to getWatchlistStocks()');

    // Return stocks from default "Auto-Scan" watchlist
    const autoWatchlist = this.db.prepare(`
      SELECT id FROM custom_watchlist
      WHERE name = 'Auto-Scan Signals (Legacy)'
      LIMIT 1
    `).get();

    if (!autoWatchlist) return [];

    return this.getWatchlistStocks(autoWatchlist.id, { source: 'AUTO_SCAN' });
  }
}
```

---

## LiveMonitoringService Updates

```typescript
class LiveMonitoringService {
  async monitorWatchlists() {
    // NEW: Monitor all active watchlists (regardless of source)
    const activeStocks = databaseService.db.prepare(`
      SELECT s.*, w.name as watchlist_name
      FROM custom_watchlist_stocks s
      JOIN custom_watchlist w ON s.watchlist_id = w.id
      WHERE s.status IN ('PENDING', 'ACTIVE')
        AND w.is_active = 1
    `).all();

    for (const stock of activeStocks) {
      const currentPrice = await this.getCurrentPrice(stock.symbol, stock.exchange);

      // Check entry trigger
      if (stock.status === 'PENDING' && this.shouldTriggerEntry(stock, currentPrice)) {
        this.handleEntryTriggered(stock, currentPrice);
      }

      // Check targets/stop-loss for active positions
      if (stock.status === 'ACTIVE') {
        if (currentPrice >= stock.target_1) {
          this.handleTargetHit(stock, currentPrice, 1);
        } else if (currentPrice <= stock.stop_loss) {
          this.handleStopLossHit(stock, currentPrice);
        }
      }
    }
  }

  private handleEntryTriggered(stock: WatchlistStock, currentPrice: number) {
    // Update stock status
    databaseService.db.prepare(`
      UPDATE custom_watchlist_stocks
      SET status = 'ACTIVE', triggered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(stock.id);

    // Send notification
    const alert = databaseService.insertAlert({
      timestamp: new Date(),
      symbol: stock.symbol,
      exchange: stock.exchange,
      strategy: stock.source === 'AUTO_SCAN' ? 'Auto-Scan' : stock.setup_type,
      alertType: 'ENTRY_SIGNAL',
      message: `${stock.symbol} triggered entry at ${currentPrice}. Source: ${stock.source}`,
      priority: 'HIGH',
      read: false
    });

    notificationService.sendAlertNotification(alert);
  }
}
```

---

## Benefits of Unified System

### For Users

✅ **Single Source of Truth** - One place to manage all stocks
✅ **Clear Origin** - Know where each stock came from (auto-scan vs manual)
✅ **Flexible Organization** - Mix auto and manual stocks in same list
✅ **Better Context** - See confidence scores and strategies for auto-scanned stocks
✅ **Reduced Confusion** - No more "which watchlist should I use?"

### For Developers

✅ **Less Code Duplication** - Single API, single service layer
✅ **Easier Maintenance** - Update one system, not two
✅ **Better Extensibility** - Easy to add new sources (e.g., "COMMUNITY", "AI_RECOMMENDED")
✅ **Cleaner Architecture** - Separation of concerns
✅ **Audit Trail** - Source tracking enables better analytics

---

## Implementation Phases

### Phase 4A: Database Migration ✅ COMPLETE (Commit: 7393610)
- [x] Add new columns to `custom_watchlist_stocks`
- [x] Create migration script (idempotent, runs on database initialization)
- [x] Migrate existing EOD watchlist data to "Auto-Scan Signals (Legacy)" watchlist
- [x] Add database indexes (source, source_id)
- [x] Test backward compatibility

### Phase 4B: Service Layer ✅ COMPLETE (Commit: 7393610)
- [x] Update `DatabaseService` with unified methods (`getWatchlistsWithCounts`, `getCustomWatchlistStocksFiltered`, `addStockFromAutoScan`)
- [x] Update `LiveMonitoringService` to use unified table
- [x] Keep deprecated methods for backward compatibility
- [x] Add comprehensive logging for migration tracking

### Phase 4C: API Layer ✅ COMPLETE (Commit: 26a9626)
- [x] Create unified API endpoints (GET /api/watchlist with source counts, GET /api/watchlist/:id/stocks with filters)
- [x] Add new endpoints: POST /api/watchlist/:id/stocks/from-scan/:scanId, POST /api/watchlist/:id/stocks/from-screener
- [x] Redirect old endpoints to new ones (GET /api/eod/watchlist now uses unified system)
- [x] Update API with query parameter filtering (source, status)
- [x] Maintain 100% backward compatibility

### Phase 4D: Frontend ✅ COMPLETE (Commit: fe920d4)
- [x] Create SourceBadge component with icon, color, and tooltip
- [x] Update CustomWatchlist page with source badges (🤖 Auto-Scan, ✋ Manual, 🔍 Screener)
- [x] Add source filter dropdown with counts
- [x] Update fetchStocks to support source filtering
- [x] Add source metadata tooltips (confidence, strategy, R:R for auto-scan)
- [x] Enhanced interfaces with source tracking fields

### Phase 4E: Testing & Documentation 🔄 IN PROGRESS
- [x] Backend build verification (TypeScript compilation clean)
- [x] Frontend build verification (production build successful)
- [x] End-to-end architecture review
- [ ] Update user documentation (USER_GUIDE_V1.1.md)
- [ ] Final testing and validation
- [ ] Final commit and push

---

## Rollback Plan

If migration fails:

1. **Database Rollback**:
   ```sql
   -- Remove new columns
   ALTER TABLE custom_watchlist_stocks DROP COLUMN source;
   ALTER TABLE custom_watchlist_stocks DROP COLUMN source_id;
   ALTER TABLE custom_watchlist_stocks DROP COLUMN source_metadata;

   -- Old watchlist table still intact (not dropped in Phase 2)
   ```

2. **Code Rollback**:
   - Git revert to pre-migration commit
   - Restore deprecated API endpoints
   - Services automatically fall back to legacy methods

3. **Data Safety**:
   - Original `watchlist` table kept until v1.3
   - All changes logged for audit
   - Database backup before migration

---

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| User confusion tickets | 90% reduction | Support ticket analysis |
| Code maintainability | 40% less code | Lines of code count |
| API response time | <100ms | Performance monitoring |
| User adoption | 80% using unified system | Analytics tracking |
| Data integrity | 100% accuracy | Automated validation tests |

---

## Future Enhancements (v1.3+)

1. **Smart Watchlists** - Auto-categorization based on sector, market cap, etc.
2. **Social Features** - Share watchlists with other users (source: 'SHARED')
3. **AI Recommendations** - ML-powered stock suggestions (source: 'AI_RECOMMENDED')
4. **Portfolio Tracking** - Link watchlists to actual positions
5. **Performance Analytics** - Track historical performance by source

---

## Conclusion

The unified watchlist architecture represents a significant improvement in both user experience and code quality. By consolidating two separate systems into one with clear source tracking, we eliminate confusion while maintaining all existing functionality and creating a foundation for future enhancements.

**Next Steps**: Begin Phase 3A database migration after Phase 3 cleanup is complete and approved.

---

**Document Maintained By**: AlphaStream Development Team
**Last Updated**: 2025-12-31
**Feedback**: Create issue in project repository
