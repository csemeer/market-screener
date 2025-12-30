/**
 * Notification Service - Orchestrates multi-channel notifications
 * Routes alerts to configured channels based on user preferences
 */

import { databaseService, Alert } from './databaseService';
import { loggerService } from './loggerService';
import { emailService, EmailConfig } from './notifications/emailService';
import { smsService, SMSConfig } from './notifications/smsService';
import { whatsappService, WhatsAppConfig } from './notifications/whatsappService';
import { telegramService, TelegramConfig } from './notifications/telegramService';
import { webhookService } from './notifications/webhookService';
import { NotificationPayload } from './notifications/baseNotificationService';

interface NotificationServiceConfig {
  email?: EmailConfig;
  sms?: SMSConfig;
  whatsapp?: WhatsAppConfig;
  telegram?: TelegramConfig;
}

class NotificationService {
  private initialized: boolean = false;

  /**
   * Map alert type from database format to notification format
   */
  private mapAlertType(alertType: string): 'ENTRY_SIGNAL' | 'TARGET_HIT' | 'STOPLOSS_HIT' | 'PRICE_ALERT' {
    // Map NEW_SIGNAL to ENTRY_SIGNAL for notifications
    if (alertType === 'NEW_SIGNAL') {
      return 'ENTRY_SIGNAL';
    }
    return alertType as 'ENTRY_SIGNAL' | 'TARGET_HIT' | 'STOPLOSS_HIT' | 'PRICE_ALERT';
  }

  /**
   * Initialize notification service with credentials
   */
  async initialize(config: NotificationServiceConfig = {}): Promise<void> {
    loggerService.info('Initializing Notification Service');

    try {
      // Initialize email service
      if (config.email) {
        emailService.initialize(config.email);
      } else if (process.env.SENDGRID_API_KEY) {
        emailService.initialize({
          provider: 'sendgrid',
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@marketscreener.com',
          apiKey: process.env.SENDGRID_API_KEY,
        });
      } else if (process.env.SMTP_HOST) {
        emailService.initialize({
          provider: 'smtp',
          from: process.env.SMTP_FROM || 'noreply@marketscreener.com',
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        });
      }

      // Initialize SMS service
      if (config.sms) {
        smsService.initialize(config.sms);
      } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        smsService.initialize({
          accountSid: process.env.TWILIO_ACCOUNT_SID,
          authToken: process.env.TWILIO_AUTH_TOKEN,
          fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
        });
      }

      // Initialize WhatsApp service
      if (config.whatsapp) {
        whatsappService.initialize(config.whatsapp);
      } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_WHATSAPP_NUMBER) {
        whatsappService.initialize({
          accountSid: process.env.TWILIO_ACCOUNT_SID!,
          authToken: process.env.TWILIO_AUTH_TOKEN!,
          fromNumber: process.env.TWILIO_WHATSAPP_NUMBER,
        });
      }

      // Initialize Telegram service
      if (config.telegram) {
        telegramService.initialize(config.telegram);
      } else if (process.env.TELEGRAM_BOT_TOKEN) {
        telegramService.initialize({
          botToken: process.env.TELEGRAM_BOT_TOKEN,
        });
      }

      this.initialized = true;
      loggerService.success('Notification Service initialized successfully');

      // Log which services are available
      const available: string[] = [];
      if (emailService.isReady()) available.push('Email');
      if (smsService.isReady()) available.push('SMS');
      if (whatsappService.isReady()) available.push('WhatsApp');
      if (telegramService.isReady()) available.push('Telegram');
      available.push('Webhook'); // Always available

      loggerService.info(`Available notification channels: ${available.join(', ')}`);
    } catch (error) {
      loggerService.error('Failed to initialize Notification Service', { error });
      throw error;
    }
  }

  /**
   * Send notification for an alert
   */
  async sendAlertNotification(alert: Alert): Promise<void> {
    if (!this.initialized) {
      loggerService.warn('Notification service not initialized, skipping notification');
      return;
    }

    try {
      // Get user notification settings
      const settings = databaseService.getNotificationSettings('default');

      if (!settings) {
        loggerService.debug('No notification settings found, skipping notification');
        return;
      }

      // Check if this alert type should be sent
      const alertTypes = JSON.parse(settings.alertTypes);
      const mappedAlertType = this.mapAlertType(alert.alertType);
      if (!alertTypes.includes(mappedAlertType)) {
        loggerService.debug(`Alert type ${mappedAlertType} not enabled, skipping`);
        return;
      }

      // Prepare payload
      const payload: NotificationPayload = {
        alertId: alert.id || 0,
        symbol: alert.symbol,
        exchange: alert.exchange,
        alertType: this.mapAlertType(alert.alertType),
        message: alert.message,
        data: {}, // Can be extended with additional data
      };

      // Send to all enabled channels in parallel
      const promises: Promise<void>[] = [];

      if (settings.emailEnabled && settings.emailAddress && emailService.isReady()) {
        promises.push(this.sendEmailNotification(alert.id || 0, settings.emailAddress, payload));
      }

      if (settings.smsEnabled && settings.smsNumber && smsService.isReady()) {
        promises.push(this.sendSMSNotification(alert.id || 0, settings.smsNumber, payload));
      }

      if (settings.whatsappEnabled && settings.whatsappNumber && whatsappService.isReady()) {
        promises.push(this.sendWhatsAppNotification(alert.id || 0, settings.whatsappNumber, payload));
      }

      if (settings.telegramEnabled && settings.telegramChatId && telegramService.isReady()) {
        promises.push(this.sendTelegramNotification(alert.id || 0, settings.telegramChatId, payload));
      }

      if (settings.webhookEnabled && settings.webhookUrl) {
        promises.push(
          this.sendWebhookNotification(alert.id || 0, settings.webhookUrl, payload, settings.webhookSecret)
        );
      }

      // Wait for all notifications to complete
      await Promise.allSettled(promises);

      loggerService.info('Alert notifications sent', {
        alertId: alert.id,
        symbol: alert.symbol,
        channels: promises.length,
      });
    } catch (error) {
      loggerService.error('Error sending alert notification', { error, alert });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    alertId: number,
    recipient: string,
    payload: NotificationPayload
  ): Promise<void> {
    const logId = databaseService.insertNotificationLog({
      alertId,
      channel: 'email',
      recipient,
      status: 'pending',
      attempts: 0,
    });

    try {
      const result = await emailService.send(recipient, payload);

      if (result.success) {
        databaseService.updateNotificationLogStatus(logId, 'sent');
      } else {
        databaseService.updateNotificationLogStatus(logId, 'failed', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      databaseService.updateNotificationLogStatus(logId, 'failed', errorMessage);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    alertId: number,
    recipient: string,
    payload: NotificationPayload
  ): Promise<void> {
    const logId = databaseService.insertNotificationLog({
      alertId,
      channel: 'sms',
      recipient,
      status: 'pending',
      attempts: 0,
    });

    try {
      const result = await smsService.send(recipient, payload);

      if (result.success) {
        databaseService.updateNotificationLogStatus(logId, 'sent');
      } else {
        databaseService.updateNotificationLogStatus(logId, 'failed', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      databaseService.updateNotificationLogStatus(logId, 'failed', errorMessage);
    }
  }

  /**
   * Send WhatsApp notification
   */
  private async sendWhatsAppNotification(
    alertId: number,
    recipient: string,
    payload: NotificationPayload
  ): Promise<void> {
    const logId = databaseService.insertNotificationLog({
      alertId,
      channel: 'whatsapp',
      recipient,
      status: 'pending',
      attempts: 0,
    });

    try {
      const result = await whatsappService.send(recipient, payload);

      if (result.success) {
        databaseService.updateNotificationLogStatus(logId, 'sent');
      } else {
        databaseService.updateNotificationLogStatus(logId, 'failed', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      databaseService.updateNotificationLogStatus(logId, 'failed', errorMessage);
    }
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(
    alertId: number,
    recipient: string,
    payload: NotificationPayload
  ): Promise<void> {
    const logId = databaseService.insertNotificationLog({
      alertId,
      channel: 'telegram',
      recipient,
      status: 'pending',
      attempts: 0,
    });

    try {
      const result = await telegramService.send(recipient, payload);

      if (result.success) {
        databaseService.updateNotificationLogStatus(logId, 'sent');
      } else {
        databaseService.updateNotificationLogStatus(logId, 'failed', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      databaseService.updateNotificationLogStatus(logId, 'failed', errorMessage);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    alertId: number,
    url: string,
    payload: NotificationPayload,
    secret?: string
  ): Promise<void> {
    const logId = databaseService.insertNotificationLog({
      alertId,
      channel: 'webhook',
      recipient: url,
      status: 'pending',
      attempts: 0,
    });

    try {
      const result = await webhookService.send(url, payload, secret);

      if (result.success) {
        databaseService.updateNotificationLogStatus(logId, 'sent');
      } else {
        databaseService.updateNotificationLogStatus(logId, 'failed', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      databaseService.updateNotificationLogStatus(logId, 'failed', errorMessage);
    }
  }

  /**
   * Test notification for a specific channel
   */
  async testNotification(
    channel: 'email' | 'sms' | 'whatsapp' | 'telegram' | 'webhook',
    recipient: string,
    secret?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const testPayload: NotificationPayload = {
        alertId: 0,
        symbol: 'TEST',
        exchange: 'NSE',
        alertType: 'PRICE_ALERT',
        message: 'This is a test notification from Market Screener. If you receive this, your configuration is working!',
        data: {
          currentPrice: 100,
        },
      };

      let result;

      switch (channel) {
        case 'email':
          if (!emailService.isReady()) {
            return { success: false, message: 'Email service not configured' };
          }
          result = await emailService.send(recipient, testPayload);
          break;

        case 'sms':
          if (!smsService.isReady()) {
            return { success: false, message: 'SMS service not configured' };
          }
          result = await smsService.send(recipient, testPayload);
          break;

        case 'whatsapp':
          if (!whatsappService.isReady()) {
            return { success: false, message: 'WhatsApp service not configured' };
          }
          result = await whatsappService.send(recipient, testPayload);
          break;

        case 'telegram':
          if (!telegramService.isReady()) {
            return { success: false, message: 'Telegram service not configured' };
          }
          result = await telegramService.send(recipient, testPayload);
          break;

        case 'webhook':
          result = await webhookService.send(recipient, testPayload, secret);
          break;

        default:
          return { success: false, message: 'Invalid channel' };
      }

      if (result.success) {
        return {
          success: true,
          message: `Test notification sent successfully to ${channel}`,
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to send test notification',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `Error: ${errorMessage}`,
      };
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    availableChannels: string[];
  } {
    const available: string[] = [];

    if (emailService.isReady()) available.push('email');
    if (smsService.isReady()) available.push('sms');
    if (whatsappService.isReady()) available.push('whatsapp');
    if (telegramService.isReady()) available.push('telegram');
    available.push('webhook');

    return {
      initialized: this.initialized,
      availableChannels: available,
    };
  }
}

export const notificationService = new NotificationService();
