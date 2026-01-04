import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import path from 'path';

const router = express.Router();
const dbPath = path.join(__dirname, '../../data/autoscan.db');

/**
 * GET /api/strategies
 * List all strategies with optional filters
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { category, is_active, is_system, search } = req.query;

    let query = 'SELECT * FROM trading_strategies WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (is_active !== undefined) {
      query += ' AND is_active = ?';
      params.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (is_system !== undefined) {
      query += ' AND is_system = ?';
      params.push(is_system === 'true' || is_system === '1' ? 1 : 0);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY is_system DESC, category, name';

    const db = new Database(dbPath);
    const strategies = db.prepare(query).all(...params);

    // Parse JSON fields
    const parsedStrategies = strategies.map((s: any) => ({
      ...s,
      entry_conditions: s.entry_conditions ? JSON.parse(s.entry_conditions) : {},
      exit_conditions: s.exit_conditions ? JSON.parse(s.exit_conditions) : {},
      indicators_config: s.indicators_config ? JSON.parse(s.indicators_config) : {},
      recommended_timeframes: s.recommended_timeframes ? JSON.parse(s.recommended_timeframes) : []
    }));

    db.close();

    res.json({
      success: true,
      count: parsedStrategies.length,
      strategies: parsedStrategies
    });
  } catch (error: any) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/strategies/categories
 * Get strategy categories with counts
 */
router.get('/categories', (req: Request, res: Response) => {
  try {
    const db = new Database(dbPath);

    const categories = db.prepare(`
      SELECT
        category,
        COUNT(*) as count,
        AVG(avg_win_rate) as avg_win_rate,
        AVG(avg_return_percent) as avg_return_percent
      FROM trading_strategies
      WHERE is_active = 1
      GROUP BY category
      ORDER BY category
    `).all();

    db.close();

    res.json({
      success: true,
      categories
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/strategies/:id
 * Get strategy details by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const db = new Database(dbPath);
    const strategy = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(id);

    if (!strategy) {
      db.close();
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Parse JSON fields
    const parsedStrategy: any = {
      ...strategy,
      entry_conditions: JSON.parse((strategy as any).entry_conditions),
      exit_conditions: JSON.parse((strategy as any).exit_conditions),
      indicators_config: JSON.parse((strategy as any).indicators_config),
      recommended_timeframes: (strategy as any).recommended_timeframes
        ? JSON.parse((strategy as any).recommended_timeframes)
        : []
    };

    // Get usage count (how many scalpers use this strategy)
    const usageCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM scalper_configs
      WHERE strategy_id = ?
    `).get(id) as { count: number };

    parsedStrategy.usage_count = usageCount.count;

    db.close();

    res.json({
      success: true,
      strategy: parsedStrategy
    });
  } catch (error: any) {
    console.error('Error fetching strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/strategies
 * Create new strategy
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      category,
      entry_conditions,
      exit_conditions,
      indicators_config,
      recommended_timeframes,
      recommended_stop_loss_percent,
      recommended_target_percent,
      min_capital_required,
      created_by
    } = req.body;

    // Validation
    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and category are required'
      });
    }

    if (!entry_conditions || !exit_conditions || !indicators_config) {
      return res.status(400).json({
        success: false,
        error: 'Entry conditions, exit conditions, and indicators config are required'
      });
    }

    const validCategories = ['MEAN_REVERSION', 'TREND_FOLLOWING', 'VOLUME_BREAKOUT', 'MOMENTUM', 'CUSTOM'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Category must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate risk/reward ratio
    if (exit_conditions.stopLossPercent >= exit_conditions.targetPercent) {
      return res.status(400).json({
        success: false,
        error: 'Target must be greater than stop loss for positive risk/reward ratio'
      });
    }

    const db = new Database(dbPath);

    // Check for duplicate name
    const existing = db.prepare('SELECT id FROM trading_strategies WHERE name = ?').get(name);
    if (existing) {
      db.close();
      return res.status(400).json({
        success: false,
        error: 'Strategy with this name already exists'
      });
    }

    // Insert strategy
    const result = db.prepare(`
      INSERT INTO trading_strategies (
        name, description, category,
        entry_conditions, exit_conditions, indicators_config,
        is_system, is_active, created_by,
        recommended_timeframes, recommended_stop_loss_percent,
        recommended_target_percent, min_capital_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description,
      category,
      JSON.stringify(entry_conditions),
      JSON.stringify(exit_conditions),
      JSON.stringify(indicators_config),
      0, // is_system = false for user-created strategies
      1, // is_active = true
      created_by || 'user',
      recommended_timeframes ? JSON.stringify(recommended_timeframes) : JSON.stringify(['5m', '15m']),
      recommended_stop_loss_percent || exit_conditions.stopLossPercent,
      recommended_target_percent || exit_conditions.targetPercent,
      min_capital_required || 25000
    );

    const newStrategy = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(result.lastInsertRowid);

    db.close();

    const parsedNewStrategy = newStrategy ? {
      ...(newStrategy as any),
      entry_conditions: JSON.parse((newStrategy as any).entry_conditions),
      exit_conditions: JSON.parse((newStrategy as any).exit_conditions),
      indicators_config: JSON.parse((newStrategy as any).indicators_config),
      recommended_timeframes: JSON.parse((newStrategy as any).recommended_timeframes)
    } : null;

    res.status(201).json({
      success: true,
      message: 'Strategy created successfully',
      strategy: parsedNewStrategy
    });
  } catch (error: any) {
    console.error('Error creating strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/strategies/:id
 * Update strategy
 */
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      entry_conditions,
      exit_conditions,
      indicators_config,
      is_active,
      recommended_timeframes,
      recommended_stop_loss_percent,
      recommended_target_percent,
      min_capital_required
    } = req.body;

    const db = new Database(dbPath);

    // Check if strategy exists
    const existing: any = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(id);
    if (!existing) {
      db.close();
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Can't edit system strategies
    if (existing.is_system && req.body.entry_conditions) {
      db.close();
      return res.status(403).json({
        success: false,
        error: 'Cannot modify system strategies. Clone it to create a custom variant.'
      });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (entry_conditions) {
      updates.push('entry_conditions = ?');
      params.push(JSON.stringify(entry_conditions));
      updates.push('version = version + 1');
    }
    if (exit_conditions) {
      updates.push('exit_conditions = ?');
      params.push(JSON.stringify(exit_conditions));
      if (!entry_conditions) updates.push('version = version + 1');
    }
    if (indicators_config) {
      updates.push('indicators_config = ?');
      params.push(JSON.stringify(indicators_config));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (recommended_timeframes) {
      updates.push('recommended_timeframes = ?');
      params.push(JSON.stringify(recommended_timeframes));
    }
    if (recommended_stop_loss_percent) {
      updates.push('recommended_stop_loss_percent = ?');
      params.push(recommended_stop_loss_percent);
    }
    if (recommended_target_percent) {
      updates.push('recommended_target_percent = ?');
      params.push(recommended_target_percent);
    }
    if (min_capital_required) {
      updates.push('min_capital_required = ?');
      params.push(min_capital_required);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 0) {
      db.close();
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    params.push(id);

    db.prepare(`
      UPDATE trading_strategies
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    const updated = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(id);

    db.close();

    const parsedUpdated = updated ? {
      ...(updated as any),
      entry_conditions: JSON.parse((updated as any).entry_conditions),
      exit_conditions: JSON.parse((updated as any).exit_conditions),
      indicators_config: JSON.parse((updated as any).indicators_config),
      recommended_timeframes: (updated as any).recommended_timeframes
        ? JSON.parse((updated as any).recommended_timeframes)
        : []
    } : null;

    res.json({
      success: true,
      message: 'Strategy updated successfully',
      strategy: parsedUpdated
    });
  } catch (error: any) {
    console.error('Error updating strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/strategies/:id
 * Delete strategy
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const db = new Database(dbPath);

    // Check if strategy exists
    const existing: any = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(id);
    if (!existing) {
      db.close();
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Can't delete system strategies
    if (existing.is_system) {
      db.close();
      return res.status(403).json({
        success: false,
        error: 'Cannot delete system strategies'
      });
    }

    // Check if strategy is in use
    const usageCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM scalper_configs
      WHERE strategy_id = ?
    `).get(id) as { count: number };

    if (usageCount.count > 0) {
      db.close();
      return res.status(400).json({
        success: false,
        error: `Cannot delete strategy: ${usageCount.count} scalper(s) are using it`
      });
    }

    db.prepare('DELETE FROM trading_strategies WHERE id = ?').run(id);

    db.close();

    res.json({
      success: true,
      message: 'Strategy deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/strategies/:id/clone
 * Clone strategy to create custom variant
 */
router.post('/:id/clone', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { new_name, created_by } = req.body;

    if (!new_name) {
      return res.status(400).json({
        success: false,
        error: 'new_name is required'
      });
    }

    const db = new Database(dbPath);

    // Check if source strategy exists
    const source: any = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(id);
    if (!source) {
      db.close();
      return res.status(404).json({
        success: false,
        error: 'Source strategy not found'
      });
    }

    // Check if new name already exists
    const existing = db.prepare('SELECT id FROM trading_strategies WHERE name = ?').get(new_name);
    if (existing) {
      db.close();
      return res.status(400).json({
        success: false,
        error: 'Strategy with this name already exists'
      });
    }

    // Clone strategy
    const result = db.prepare(`
      INSERT INTO trading_strategies (
        name, description, category,
        entry_conditions, exit_conditions, indicators_config,
        is_system, is_active, created_by,
        recommended_timeframes, recommended_stop_loss_percent,
        recommended_target_percent, min_capital_required
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      new_name,
      source.description + ' (Cloned)',
      source.category,
      source.entry_conditions,
      source.exit_conditions,
      source.indicators_config,
      0, // is_system = false
      1, // is_active = true
      created_by || 'user',
      source.recommended_timeframes,
      source.recommended_stop_loss_percent,
      source.recommended_target_percent,
      source.min_capital_required
    );

    const cloned = db.prepare('SELECT * FROM trading_strategies WHERE id = ?').get(result.lastInsertRowid);

    db.close();

    const parsedCloned = cloned ? {
      ...(cloned as any),
      entry_conditions: JSON.parse((cloned as any).entry_conditions),
      exit_conditions: JSON.parse((cloned as any).exit_conditions),
      indicators_config: JSON.parse((cloned as any).indicators_config),
      recommended_timeframes: (cloned as any).recommended_timeframes
        ? JSON.parse((cloned as any).recommended_timeframes)
        : []
    } : null;

    res.status(201).json({
      success: true,
      message: 'Strategy cloned successfully',
      strategy: parsedCloned
    });
  } catch (error: any) {
    console.error('Error cloning strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/strategies/:id/performance
 * Update strategy performance metrics (called after backtest)
 */
router.put('/:id/performance', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { win_rate, return_percent } = req.body;

    if (win_rate === undefined || return_percent === undefined) {
      return res.status(400).json({
        success: false,
        error: 'win_rate and return_percent are required'
      });
    }

    const db = new Database(dbPath);

    // Get current stats
    const current: any = db.prepare('SELECT avg_win_rate, avg_return_percent, total_uses FROM trading_strategies WHERE id = ?').get(id);

    if (!current) {
      db.close();
      return res.status(404).json({
        success: false,
        error: 'Strategy not found'
      });
    }

    // Calculate running average
    const total_uses = (current.total_uses || 0) + 1;
    const new_avg_win_rate = current.avg_win_rate
      ? ((current.avg_win_rate * current.total_uses) + win_rate) / total_uses
      : win_rate;
    const new_avg_return = current.avg_return_percent
      ? ((current.avg_return_percent * current.total_uses) + return_percent) / total_uses
      : return_percent;

    db.prepare(`
      UPDATE trading_strategies
      SET total_uses = ?,
          avg_win_rate = ?,
          avg_return_percent = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(total_uses, new_avg_win_rate, new_avg_return, id);

    db.close();

    res.json({
      success: true,
      message: 'Performance metrics updated',
      metrics: {
        total_uses,
        avg_win_rate: new_avg_win_rate,
        avg_return_percent: new_avg_return
      }
    });
  } catch (error: any) {
    console.error('Error updating performance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
