/**
 * WhatsApp Notification Service - Using Twilio WhatsApp API
 */

import { Twilio } from 'twilio';
import { BaseNotificationService, NotificationPayload, NotificationResult } from './baseNotificationService';
import { loggerService } from '../loggerService';

export interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // Format: whatsapp:+14155238886
}

class WhatsAppService extends BaseNotificationService {
  protected serviceName = 'WhatsApp';
  private client: Twilio | null = null;
  private config: WhatsAppConfig | null = null;

  /**
   * Initialize WhatsApp service with Twilio credentials
   */
  initialize(config: WhatsAppConfig): void {
    this.config = config;

    try {
      this.client = new Twilio(config.accountSid, config.authToken);
      loggerService.info('WhatsApp service initialized with Twilio');
    } catch (error) {
      loggerService.error('Failed to initialize WhatsApp service', { error });
      throw error;
    }
  }

  protected isConfigured(): boolean {
    return this.client !== null && this.config !== null;
  }

  /**
   * Send WhatsApp notification
   */
  async send(recipient: string, payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        recipient,
        error: 'WhatsApp service not configured',
      };
    }

    try {
      const message = this.formatWhatsAppMessage(payload);

      // Ensure recipient is in WhatsApp format
      const whatsappRecipient = recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`;

      const result = await this.client!.messages.create({
        body: message,
        from: this.config!.fromNumber,
        to: whatsappRecipient,
      });

      loggerService.info('WhatsApp message sent successfully', {
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
      loggerService.error('Failed to send WhatsApp message', { error: errorMessage, recipient });

      return {
        success: false,
        recipient,
        error: errorMessage,
      };
    }
  }

  /**
   * Format WhatsApp message with rich formatting
   */
  private formatWhatsAppMessage(payload: NotificationPayload): string {
    const icon = this.getAlertIcon(payload.alertType);
    let message = `*${icon} ${payload.alertType.replace('_', ' ')}*\n\n`;
    message += `*Symbol:* ${payload.symbol} (${payload.exchange})\n`;
    message += `*Message:* ${payload.message}\n`;

    if (payload.data) {
      message += '\n*Details:*\n';
      if (payload.data.currentPrice) {
        message += `• Current Price: ₹${payload.data.currentPrice.toFixed(2)}\n`;
      }
      if (payload.data.triggerPrice) {
        message += `• Trigger Price: ₹${payload.data.triggerPrice.toFixed(2)}\n`;
      }
      if (payload.data.stopLoss) {
        message += `• Stop Loss: ₹${payload.data.stopLoss.toFixed(2)}\n`;
      }
      if (payload.data.target) {
        message += `• Target: ₹${payload.data.target.toFixed(2)}\n`;
      }
      if (payload.data.confidence) {
        message += `• Confidence: ${payload.data.confidence}\n`;
      }
      if (payload.data.profitPercent) {
        message += `• Profit: +${payload.data.profitPercent.toFixed(2)}%\n`;
      }
      if (payload.data.lossPercent) {
        message += `• Loss: ${payload.data.lossPercent.toFixed(2)}%\n`;
      }

      if (payload.data.signals && payload.data.signals.length > 0) {
        message += '\n*Signals:*\n';
        payload.data.signals.forEach(signal => {
          message += `• ${signal}\n`;
        });
      }
    }

    message += '\n_Automated alert from Stock Market Screener_';
    return message;
  }
}

export const whatsappService = new WhatsAppService();
