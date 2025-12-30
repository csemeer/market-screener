/**
 * Telegram Notification Service - Using Telegram Bot API
 */

import axios from 'axios';
import { BaseNotificationService, NotificationPayload, NotificationResult } from './baseNotificationService';
import { loggerService } from '../loggerService';

export interface TelegramConfig {
  botToken: string;
}

class TelegramService extends BaseNotificationService {
  protected serviceName = 'Telegram';
  private config: TelegramConfig | null = null;
  private apiUrl: string = '';

  /**
   * Initialize Telegram service with bot token
   */
  initialize(config: TelegramConfig): void {
    this.config = config;
    this.apiUrl = `https://api.telegram.org/bot${config.botToken}`;
    loggerService.info('Telegram service initialized');
  }

  protected isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Send Telegram notification
   */
  async send(recipient: string, payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        recipient,
        error: 'Telegram service not configured',
      };
    }

    try {
      const message = this.formatTelegramMessage(payload);

      const response = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: recipient,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });

      loggerService.info('Telegram message sent successfully', {
        recipient,
        messageId: response.data.result.message_id,
        symbol: payload.symbol,
      });

      return {
        success: true,
        recipient,
        messageId: String(response.data.result.message_id),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggerService.error('Failed to send Telegram message', { error: errorMessage, recipient });

      return {
        success: false,
        recipient,
        error: errorMessage,
      };
    }
  }

  /**
   * Format Telegram message with HTML formatting
   */
  private formatTelegramMessage(payload: NotificationPayload): string {
    const icon = this.getAlertIcon(payload.alertType);
    let message = `<b>${icon} ${payload.alertType.replace('_', ' ')}</b>\n\n`;
    message += `<b>Symbol:</b> ${payload.symbol} (${payload.exchange})\n`;
    message += `<b>Message:</b> ${payload.message}\n`;

    if (payload.data) {
      message += '\n<b>Details:</b>\n';
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
        message += `• Profit: <b>+${payload.data.profitPercent.toFixed(2)}%</b>\n`;
      }
      if (payload.data.lossPercent) {
        message += `• Loss: <b>${payload.data.lossPercent.toFixed(2)}%</b>\n`;
      }

      if (payload.data.signals && payload.data.signals.length > 0) {
        message += '\n<b>Signals:</b>\n';
        payload.data.signals.forEach(signal => {
          message += `• ${signal}\n`;
        });
      }
    }

    message += '\n<i>Automated alert from Stock Market Screener</i>';
    return message;
  }

  /**
   * Get bot information
   */
  async getBotInfo(): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Telegram service not configured');
    }

    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      loggerService.error('Failed to get bot info', { error });
      throw error;
    }
  }
}

export const telegramService = new TelegramService();
