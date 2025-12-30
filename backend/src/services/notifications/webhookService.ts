/**
 * Webhook Notification Service - HTTP POST to custom endpoints
 */

import axios from 'axios';
import crypto from 'crypto';
import { BaseNotificationService, NotificationPayload, NotificationResult } from './baseNotificationService';
import { loggerService } from '../loggerService';

class WebhookService extends BaseNotificationService {
  protected serviceName = 'Webhook';

  protected isConfigured(): boolean {
    return true; // Webhooks don't need global configuration
  }

  /**
   * Send webhook notification
   * @param recipient - Webhook URL
   * @param payload - Notification payload
   * @param secret - Optional secret for signing the payload
   */
  async send(
    recipient: string,
    payload: NotificationPayload,
    secret?: string
  ): Promise<NotificationResult> {
    try {
      const webhookPayload = this.prepareWebhookPayload(payload);
      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'Market-Screener-Webhook/1.0',
      };

      // Add signature if secret is provided
      if (secret) {
        const signature = this.generateSignature(webhookPayload, secret);
        headers['X-Webhook-Signature'] = signature;
        headers['X-Webhook-Signature-Algorithm'] = 'sha256';
      }

      const response = await axios.post(recipient, webhookPayload, {
        headers,
        timeout: 10000, // 10 second timeout
      });

      loggerService.info('Webhook sent successfully', {
        url: recipient,
        status: response.status,
        symbol: payload.symbol,
      });

      return {
        success: true,
        recipient,
        messageId: String(response.status),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggerService.error('Failed to send webhook', { error: errorMessage, url: recipient });

      return {
        success: false,
        recipient,
        error: errorMessage,
      };
    }
  }

  /**
   * Prepare webhook payload
   */
  private prepareWebhookPayload(payload: NotificationPayload): any {
    return {
      event: 'trading_alert',
      timestamp: new Date().toISOString(),
      alert: {
        id: payload.alertId,
        type: payload.alertType,
        symbol: payload.symbol,
        exchange: payload.exchange,
        message: payload.message,
        data: payload.data || {},
      },
    };
  }

  /**
   * Generate HMAC signature for payload
   */
  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

export const webhookService = new WebhookService();
