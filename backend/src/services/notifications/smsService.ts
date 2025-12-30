/**
 * SMS Notification Service - Using Twilio
 */

import { Twilio } from 'twilio';
import { BaseNotificationService, NotificationPayload, NotificationResult } from './baseNotificationService';
import { loggerService } from '../loggerService';

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

class SMSService extends BaseNotificationService {
  protected serviceName = 'SMS';
  private client: Twilio | null = null;
  private config: SMSConfig | null = null;

  /**
   * Initialize SMS service with Twilio credentials
   */
  initialize(config: SMSConfig): void {
    this.config = config;

    try {
      this.client = new Twilio(config.accountSid, config.authToken);
      loggerService.info('SMS service initialized with Twilio');
    } catch (error) {
      loggerService.error('Failed to initialize SMS service', { error });
      throw error;
    }
  }

  protected isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Send SMS notification
   */
  async send(recipient: string, payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        recipient,
        error: 'SMS service not configured',
      };
    }

    try {
      const message = this.formatSMSMessage(payload);

      const result = await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: recipient,
      });

      loggerService.info('SMS sent successfully', {
        recipient,
        messageId: result.sid,
        symbol: payload.symbol,
      });

      return {
        success: true,
        recipient,
        messageId: result.sid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggerService.error('Failed to send SMS', { error: errorMessage, recipient });

      return {
        success: false,
        recipient,
        error: errorMessage,
      };
    }
  }

  /**
   * Format SMS message (keep it concise due to character limit)
   */
  private formatSMSMessage(payload: NotificationPayload): string {
    const icon = this.getAlertIcon(payload.alertType);
    let message = `${icon} ${payload.symbol}`;

    switch (payload.alertType) {
      case 'ENTRY_SIGNAL':
        message += ` - ENTRY`;
        if (payload.data?.currentPrice) {
          message += ` @ ₹${payload.data.currentPrice}`;
        }
        if (payload.data?.confidence) {
          message += ` (${payload.data.confidence})`;
        }
        break;
      case 'TARGET_HIT':
        message += ` - TARGET`;
        if (payload.data?.currentPrice) {
          message += ` @ ₹${payload.data.currentPrice}`;
        }
        if (payload.data?.profitPercent) {
          message += ` (+${payload.data.profitPercent}%)`;
        }
        break;
      case 'STOPLOSS_HIT':
        message += ` - STOP LOSS`;
        if (payload.data?.currentPrice) {
          message += ` @ ₹${payload.data.currentPrice}`;
        }
        if (payload.data?.lossPercent) {
          message += ` (${payload.data.lossPercent}%)`;
        }
        break;
      default:
        message += ` - ${payload.message}`;
    }

    return message.substring(0, 160); // SMS character limit
  }
}

export const smsService = new SMSService();
