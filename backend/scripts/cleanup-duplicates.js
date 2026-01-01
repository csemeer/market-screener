/**
 * Manual cleanup script for duplicate scan results
 * Run this to immediately remove duplicates without waiting for backend restart
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/autoscan.db');
const db = new Database(dbPath);

console.log('🧹 Starting duplicate cleanup...\n');

// Check for duplicates
const duplicatesQuery = db.prepare(`
  SELECT symbol, strategy, COUNT(*) as count
  FROM scan_results
  WHERE status = 'ACTIVE'
  GROUP BY symbol, strategy
  HAVING count > 1
  ORDER BY count DESC
`);

const duplicates = duplicatesQuery.all();

if (duplicates.length === 0) {
  console.log('✅ No duplicates found! Database is clean.');
  db.close();
  process.exit(0);
}

console.log(`Found ${duplicates.length} symbol+strategy combinations with duplicates:\n`);
duplicates.forEach(dup => {
  console.log(`  ${dup.symbol} | ${dup.strategy} | ${dup.count} entries`);
});

console.log('\n🗑️  Removing duplicates (keeping most recent)...\n');

// Step 1: Get IDs of duplicates to delete
const duplicateIdsQuery = db.prepare(`
  SELECT id FROM scan_results
  WHERE id NOT IN (
    SELECT MAX(id)
    FROM scan_results
    WHERE status = 'ACTIVE'
    GROUP BY symbol, strategy
  )
  AND status = 'ACTIVE'
`);

const duplicateIds = duplicateIdsQuery.all().map(row => row.id);

if (duplicateIds.length === 0) {
  console.log('✅ No duplicates to remove');
  db.close();
  process.exit(0);
}

console.log(`Found ${duplicateIds.length} duplicate entries to remove\n`);

// Step 2: Update ALL foreign key references
console.log('Step 1: Clearing foreign key references...');

// 2a. Clear references in custom_watchlist_stocks
const updateWatchlistStmt = db.prepare(`
  UPDATE custom_watchlist_stocks
  SET source_id = NULL, source_metadata = NULL
  WHERE source_id IN (${duplicateIds.map(() => '?').join(',')})
`);

const watchlistResult = updateWatchlistStmt.run(...duplicateIds);
console.log(`  - Updated ${watchlistResult.changes} watchlist entries`);

// 2b. Clear references in alerts table
const updateAlertsStmt = db.prepare(`
  UPDATE alerts
  SET scan_result_id = NULL
  WHERE scan_result_id IN (${duplicateIds.map(() => '?').join(',')})
`);

const alertsResult = updateAlertsStmt.run(...duplicateIds);
console.log(`  - Updated ${alertsResult.changes} alert entries`);

console.log(`  ✅ Total references cleared: ${watchlistResult.changes + alertsResult.changes}\n`);

// Step 3: Now safe to delete duplicates
console.log('Step 2: Deleting duplicate scan results...');
const deleteStmt = db.prepare(`
  DELETE FROM scan_results
  WHERE id IN (${duplicateIds.map(() => '?').join(',')})
`);

const result = deleteStmt.run(...duplicateIds);
const deletedCount = result.changes;

console.log(`✅ Removed ${deletedCount} duplicate entries\n`);

// Verify cleanup
const remainingDuplicates = duplicatesQuery.all();

if (remainingDuplicates.length === 0) {
  console.log('✅ SUCCESS: All duplicates removed!');
} else {
  console.log('⚠️  WARNING: Some duplicates still remain:');
  remainingDuplicates.forEach(dup => {
    console.log(`  ${dup.symbol} | ${dup.strategy} | ${dup.count} entries`);
  });
}

// Show summary
const totalActiveQuery = db.prepare('SELECT COUNT(*) as count FROM scan_results WHERE status = ?');
const totalActive = totalActiveQuery.get('ACTIVE');

console.log(`\n📊 Database Summary:`);
console.log(`  Total active scan results: ${totalActive.count}`);
console.log(`  Duplicate combinations: ${remainingDuplicates.length}`);

db.close();

console.log('\n✨ Cleanup complete!');
