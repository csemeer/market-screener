/**
 * Email Notification Service - Using Nodemailer with multiple providers support
 */

import nodemailer, { Transporter } from 'nodemailer';
import { BaseNotificationService, NotificationPayload, NotificationResult } from './baseNotificationService';
import { loggerService } from '../loggerService';

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'gmail';
  from: string;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  apiKey?: string; // For SendGrid
}

class EmailService extends BaseNotificationService {
  protected serviceName = 'Email';
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Initialize email service with configuration
   */
  initialize(config: EmailConfig): void {
    this.config = config;

    try {
      if (config.provider === 'sendgrid' && config.apiKey) {
        // SendGrid configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: config.apiKey,
          },
        });
      } else if (config.provider === 'gmail' && config.auth) {
        // Gmail configuration
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: config.auth,
        });
      } else if (config.provider === 'smtp') {
        // Generic SMTP
        this.transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port || 587,
          secure: config.secure || false,
          auth: config.auth,
        });
      }

      loggerService.info(`Email service initialized with provider: ${config.provider}`);
    } catch (error) {
      loggerService.error('Failed to initialize email service', { error });
      throw error;
    }
  }

  protected isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  /**
   * Send email notification
   */
  async send(recipient: string, payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        recipient,
        error: 'Email service not configured',
      };
    }

    try {
      const subject = this.generateSubject(payload);
      const htmlContent = this.generateHtmlContent(payload);
      const textContent = this.formatMessage(payload);

      const info = await this.transporter!.sendMail({
        from: this.config!.from,
        to: recipient,
        subject,
        text: textContent,
        html: htmlContent,
      });

      loggerService.info('Email sent successfully', {
        recipient,
        messageId: info.messageId,
        symbol: payload.symbol,
      });

      return {
        success: true,
        recipient,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      loggerService.error('Failed to send email', { error: errorMessage, recipient });

      return {
        success: false,
        recipient,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate email subject
   */
  private generateSubject(payload: NotificationPayload): string {
    const icon = this.getAlertIcon(payload.alertType);

    switch (payload.alertType) {
      case 'ENTRY_SIGNAL':
        return `${icon} Entry Signal - ${payload.symbol}`;
      case 'TARGET_HIT':
        return `${icon} Target Reached - ${payload.symbol}`;
      case 'STOPLOSS_HIT':
        return `${icon} Stop Loss Hit - ${payload.symbol}`;
      case 'PRICE_ALERT':
        return `${icon} Price Alert - ${payload.symbol}`;
      default:
        return `${icon} Trading Alert - ${payload.symbol}`;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateHtmlContent(payload: NotificationPayload): string {
    const icon = this.getAlertIcon(payload.alertType);
    const { data } = payload;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #2c3e50;
    }
    .alert-type {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
    }
    .alert-ENTRY_SIGNAL {
      background-color: #4CAF50;
      color: white;
    }
    .alert-TARGET_HIT {
      background-color: #2196F3;
      color: white;
    }
    .alert-STOPLOSS_HIT {
      background-color: #f44336;
      color: white;
    }
    .alert-PRICE_ALERT {
      background-color: #FF9800;
      color: white;
    }
    .message {
      font-size: 16px;
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      border-radius: 4px;
    }
    .details {
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-label {
      font-weight: 600;
      color: #666;
    }
    .detail-value {
      color: #333;
      font-weight: 500;
    }
    .signals {
      margin: 20px 0;
      padding: 15px;
      background-color: #e8f5e9;
      border-radius: 4px;
    }
    .signals h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #2c3e50;
    }
    .signals ul {
      margin: 0;
      padding-left: 20px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${icon} ${payload.alertType.replace('_', ' ')}</h1>
      <div class="alert-type alert-${payload.alertType}">${payload.symbol} · ${payload.exchange}</div>
    </div>

    <div class="message">
      ${payload.message}
    </div>

    ${
      data
        ? `
    <div class="details">
      <h3>Details</h3>
      ${data.currentPrice ? `<div class="detail-row"><span class="detail-label">Current Price</span><span class="detail-value">₹${data.currentPrice.toFixed(2)}</span></div>` : ''}
      ${data.triggerPrice ? `<div class="detail-row"><span class="detail-label">Trigger Price</span><span class="detail-value">₹${data.triggerPrice.toFixed(2)}</span></div>` : ''}
      ${data.stopLoss ? `<div class="detail-row"><span class="detail-label">Stop Loss</span><span class="detail-value">₹${data.stopLoss.toFixed(2)}</span></div>` : ''}
      ${data.target ? `<div class="detail-row"><span class="detail-label">Target</span><span class="detail-value">₹${data.target.toFixed(2)}</span></div>` : ''}
      ${data.confidence ? `<div class="detail-row"><span class="detail-label">Confidence</span><span class="detail-value">${data.confidence}</span></div>` : ''}
      ${data.profitPercent ? `<div class="detail-row"><span class="detail-label">Profit</span><span class="detail-value" style="color: #4CAF50;">+${data.profitPercent.toFixed(2)}%</span></div>` : ''}
      ${data.lossPercent ? `<div class="detail-row"><span class="detail-label">Loss</span><span class="detail-value" style="color: #f44336;">${data.lossPercent.toFixed(2)}%</span></div>` : ''}
    </div>
    `
        : ''
    }

    ${
      data?.signals && data.signals.length > 0
        ? `
    <div class="signals">
      <h3>📊 Signals</h3>
      <ul>
        ${data.signals.map(signal => `<li>${signal}</li>`).join('')}
      </ul>
    </div>
    `
        : ''
    }

    <div class="footer">
      <p>This is an automated trading alert from your Stock Market Screener.</p>
      <p>Please verify all information before taking action.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const emailService = new EmailService();
