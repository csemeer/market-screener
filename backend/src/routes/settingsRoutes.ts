/**
 * Settings Routes - API endpoints for user settings and configuration
 */

import express from 'express';
import { databaseService } from '../services/databaseService';
import { notificationService } from '../services/notificationService';
import { loggerService } from '../services/loggerService';

const router = express.Router();

// ==================== NOTIFICATION SETTINGS ====================

/**
 * GET /api/settings/notifications
 * Get user notification settings
 */
router.get('/notifications', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const settings = databaseService.getNotificationSettings(userId);

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        userId,
        emailEnabled: false,
        smsEnabled: false,
        whatsappEnabled: false,
        telegramEnabled: false,
        webhookEnabled: false,
        alertTypes: ['ENTRY_SIGNAL', 'TARGET_HIT', 'STOPLOSS_HIT'],
      });
    }

    // Parse alert types from JSON string
    const alertTypes = JSON.parse(settings.alertTypes);

    res.json({
      ...settings,
      alertTypes,
    });
  } catch (error) {
    loggerService.error('Error fetching notification settings', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch notification settings',
    });
  }
});

/**
 * PUT /api/settings/notifications
 * Update user notification settings
 */
router.put('/notifications', (req, res) => {
  try {
    const userId = (req.body.userId as string) || 'default';
    const settings = req.body;

    // Convert alertTypes array to JSON string
    if (Array.isArray(settings.alertTypes)) {
      settings.alertTypes = JSON.stringify(settings.alertTypes);
    }

    const id = databaseService.upsertNotificationSettings({
      userId,
      ...settings,
    });

    loggerService.info('Notification settings updated', { userId, id });

    // Get updated settings
    const updated = databaseService.getNotificationSettings(userId);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: updated,
    });
  } catch (error) {
    loggerService.error('Error updating notification settings', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update notification settings',
    });
  }
});

/**
 * POST /api/settings/notifications/test
 * Test notification delivery for a specific channel
 */
router.post('/notifications/test', async (req, res) => {
  try {
    const { channel, recipient, secret } = req.body;

    if (!channel || !recipient) {
      return res.status(400).json({
        error: 'Missing required fields: channel and recipient',
      });
    }

    const validChannels = ['email', 'sms', 'whatsapp', 'telegram', 'webhook'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
      });
    }

    loggerService.info('Testing notification', { channel, recipient });

    const result = await notificationService.testNotification(
      channel as 'email' | 'sms' | 'whatsapp' | 'telegram' | 'webhook',
      recipient,
      secret
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    loggerService.error('Error testing notification', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to test notification',
    });
  }
});

/**
 * GET /api/settings/notifications/status
 * Get notification service status
 */
router.get('/notifications/status', (req, res) => {
  try {
    const status = notificationService.getStatus();
    res.json(status);
  } catch (error) {
    loggerService.error('Error fetching notification status', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch notification status',
    });
  }
});

// ==================== BROKER ACCOUNTS ====================

/**
 * GET /api/settings/brokers
 * Get all broker accounts for a user
 */
router.get('/brokers', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const accounts = databaseService.getBrokerAccounts(userId);

    // Return accounts with sanitized credentials (partial info only)
    const sanitized = accounts.map(acc => {
      const credentials = acc.credentials ? JSON.parse(acc.credentials) : {};

      return {
        id: acc.id,
        name: acc.name || `${acc.broker} Account`,
        userId: acc.userId,
        broker: acc.broker,
        accountId: acc.accountId,
        status: acc.status || 'disconnected',
        isActive: acc.isActive,
        autoTradeEnabled: acc.autoTradeEnabled,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        credentials: {
          apiKey: credentials.apiKey || null,
          // Don't send apiSecret or accessToken
        },
      };
    });

    res.json({ success: true, accounts: sanitized });
  } catch (error) {
    loggerService.error('Error fetching broker accounts', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch broker accounts',
    });
  }
});

/**
 * POST /api/settings/brokers
 * Add a new broker account
 */
router.post('/brokers', (req, res) => {
  try {
    const { userId = 'default', broker, accountId, credentials, isActive = true, autoTradeEnabled = false } = req.body;

    if (!broker || !accountId || !credentials) {
      return res.status(400).json({
        error: 'Missing required fields: broker, accountId, credentials',
      });
    }

    const validBrokers = ['upstox', 'zerodha', 'ibkr'];
    if (!validBrokers.includes(broker)) {
      return res.status(400).json({
        error: `Invalid broker. Must be one of: ${validBrokers.join(', ')}`,
      });
    }

    // TODO: Encrypt credentials before storing
    const encryptedCredentials = JSON.stringify(credentials);

    const id = databaseService.insertBrokerAccount({
      userId,
      broker,
      accountId,
      credentials: encryptedCredentials,
      isActive,
      autoTradeEnabled,
    });

    loggerService.info('Broker account added', { userId, broker, accountId, id });

    res.json({
      success: true,
      message: 'Broker account added successfully',
      id,
    });
  } catch (error) {
    loggerService.error('Error adding broker account', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add broker account',
    });
  }
});

/**
 * PUT /api/settings/brokers/:id
 * Update a broker account
 */
router.put('/brokers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    // Encrypt credentials if provided
    if (updates.credentials) {
      updates.credentials = JSON.stringify(updates.credentials);
    }

    databaseService.updateBrokerAccount(id, updates);

    loggerService.info('Broker account updated', { id, updates });

    res.json({
      success: true,
      message: 'Broker account updated successfully',
    });
  } catch (error) {
    loggerService.error('Error updating broker account', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update broker account',
    });
  }
});

/**
 * DELETE /api/settings/brokers/:id
 * Delete a broker account
 */
router.delete('/brokers/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);

    databaseService.deleteBrokerAccount(id);

    loggerService.info('Broker account deleted', { id });

    res.json({
      success: true,
      message: 'Broker account deleted successfully',
    });
  } catch (error) {
    loggerService.error('Error deleting broker account', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete broker account',
    });
  }
});

/**
 * GET /api/settings/brokers/:id/test
 * Test broker connection
 */
router.get('/brokers/:id/test', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const account = databaseService.getBrokerAccountById(id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Broker account not found',
      });
    }

    // Use broker factory to test connection
    const { testBrokerConnection } = await import('../services/brokerFactory');

    loggerService.info('Testing broker connection', { id, broker: account.broker });

    // Paper broker doesn't need testing
    if (account.broker === 'paper') {
      return res.json({
        success: true,
        message: 'Paper trading mode - no connection test needed',
      });
    }

    const result = await testBrokerConnection(
      account.broker as 'zerodha' | 'upstox' | 'ibkr',
      id.toString()
    );

    res.json(result);
  } catch (error) {
    loggerService.error('Error testing broker connection', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test broker connection',
    });
  }
});

// ==================== TRADING PARAMETERS ====================

/**
 * GET /api/settings/trading
 * Get trading parameters
 */
router.get('/trading', (req, res) => {
  try {
    // TODO: Implement trading parameters storage
    // For now, return default values
    res.json({
      defaultPositionSize: 1, // percent of capital
      maxRiskPerTrade: 2, // percent
      maxOpenPositions: 5,
      autoExecuteEntries: false,
      orderType: 'LIMIT',
      slippagePercent: 0.5,
    });
  } catch (error) {
    loggerService.error('Error fetching trading parameters', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch trading parameters',
    });
  }
});

/**
 * PUT /api/settings/trading
 * Update trading parameters
 */
router.put('/trading', (req, res) => {
  try {
    // TODO: Implement trading parameters storage
    const params = req.body;

    loggerService.info('Trading parameters updated', { params });

    res.json({
      success: true,
      message: 'Trading parameters updated successfully',
      params,
    });
  } catch (error) {
    loggerService.error('Error updating trading parameters', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update trading parameters',
    });
  }
});

// ==================== WEBHOOKS ====================

/**
 * GET /api/settings/webhooks
 * Get webhook configurations
 */
router.get('/webhooks', (req, res) => {
  try {
    const userId = (req.query.userId as string) || 'default';
    const settings = databaseService.getNotificationSettings(userId);

    if (!settings || !settings.webhookEnabled) {
      return res.json([]);
    }

    res.json([
      {
        id: 1,
        url: settings.webhookUrl,
        secret: settings.webhookSecret ? '***' : null,
        enabled: settings.webhookEnabled,
        events: JSON.parse(settings.alertTypes),
      },
    ]);
  } catch (error) {
    loggerService.error('Error fetching webhooks', { error });
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch webhooks',
    });
  }
});

export default router;
