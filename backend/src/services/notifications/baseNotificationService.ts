/**
 * Base Notification Service - Abstract base class for all notification channels
 */

export interface NotificationPayload {
  alertId: number;
  symbol: string;
  exchange: string;
  alertType: 'ENTRY_SIGNAL' | 'TARGET_HIT' | 'STOPLOSS_HIT' | 'PRICE_ALERT';
  message: string;
  data?: {
    currentPrice?: number;
    triggerPrice?: number;
    stopLoss?: number;
    target?: number;
    confidence?: string;
    signals?: string[];
    profitPercent?: number;
    lossPercent?: number;
    [key: string]: any;
  };
}

export interface NotificationResult {
  success: boolean;
  recipient: string;
  messageId?: string;
  error?: string;
}

export abstract class BaseNotificationService {
  protected abstract serviceName: string;
  protected abstract isConfigured(): boolean;

  /**
   * Send notification to a recipient
   */
  abstract send(recipient: string, payload: NotificationPayload): Promise<NotificationResult>;

  /**
   * Test configuration with a test message
   */
  async test(recipient: string): Promise<NotificationResult> {
    const testPayload: NotificationPayload = {
      alertId: 0,
      symbol: 'TEST',
      exchange: 'NSE',
      alertType: 'PRICE_ALERT',
      message: `Test notification from ${this.serviceName}. If you receive this, your configuration is working correctly!`,
      data: {
        currentPrice: 100,
      },
    };

    return this.send(recipient, testPayload);
  }

  /**
   * Format message with template
   */
  protected formatMessage(payload: NotificationPayload): string {
    const icon = this.getAlertIcon(payload.alertType);
    let message = `${icon} ${payload.message}`;

    // Add additional data if available
    if (payload.data) {
      if (payload.data.currentPrice) {
        message += `\n💵 Price: ${payload.data.currentPrice}`;
      }
      if (payload.data.signals && payload.data.signals.length > 0) {
        message += `\n📊 Signals: ${payload.data.signals.join(', ')}`;
      }
    }

    return message;
  }

  /**
   * Get icon for alert type
   */
  protected getAlertIcon(alertType: string): string {
    switch (alertType) {
      case 'ENTRY_SIGNAL':
        return '🚀';
      case 'TARGET_HIT':
        return '🎯';
      case 'STOPLOSS_HIT':
        return '⚠️';
      case 'PRICE_ALERT':
        return '📈';
      default:
        return '🔔';
    }
  }

  /**
   * Check if service is ready to send
   */
  isReady(): boolean {
    return this.isConfigured();
  }
}
