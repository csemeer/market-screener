# SendGrid Setup Guide

SendGrid is a cloud-based email delivery service that provides reliable email notifications for your Market Screener trading alerts. This guide will walk you through setting up SendGrid for production-grade email delivery.

## Prerequisites

- A SendGrid account (free tier available)
- A domain name (optional but recommended for production)
- Basic understanding of DNS records (for domain verification)

## Step 1: Create a SendGrid Account

1. Go to https://signup.sendgrid.com/
2. Fill in your details:
   - Email address
   - Password
   - Company name (can be personal name)
3. Click "Create Account"
4. Verify your email address by clicking the link sent to your inbox

## Step 2: Complete Account Setup

After email verification:

1. **Tell us about yourself**:
   - Role: Select appropriate role (e.g., "Developer", "Solo Entrepreneur")
   - Company size: Select your company size
   - Use case: "Transactional" (for trading alerts)

2. **Complete profile**:
   - Fill in additional details as requested
   - This helps SendGrid prevent spam and improve deliverability

## Step 3: Create an API Key

API keys authenticate your application with SendGrid.

1. Log in to https://app.sendgrid.com/
2. Navigate to **Settings** → **API Keys** (left sidebar)
3. Click "Create API Key" (top right)
4. Configure the API key:
   - **Name**: `market-screener-production` (or `development` for testing)
   - **API Key Permissions**: Select "Restricted Access"
   - Under "Mail Send", toggle **ON** "Mail Send" permission
   - (Optional) Enable "Mail Settings" for tracking settings
5. Click "Create & View"
6. **IMPORTANT**: Copy the API key immediately - it won't be shown again!
   - Format: `SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`
   - Store it securely

## Step 4: Verify a Sender Identity

SendGrid requires sender verification to prevent spam. You have two options:

### Option A: Single Sender Verification (Quick Start)

Best for testing and small-scale use:

1. Navigate to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click "Create New Sender"
3. Fill in the form:
   - **From Name**: "Market Screener Alerts" (or your name)
   - **From Email Address**: Your email (e.g., `alerts@yourdomain.com` or `yourname@gmail.com`)
   - **Reply To**: Same as from email or support email
   - **Company Address**: Your address
   - **Nickname**: Internal reference (e.g., "Trading Alerts")
4. Click "Create"
5. Check your email for verification link
6. Click the verification link

**Limitations**:
- Can only send from verified addresses
- Lower deliverability than domain authentication
- Gmail/Outlook may show "via sendgrid.net"

### Option B: Domain Authentication (Recommended for Production)

Best for professional use and higher deliverability:

1. Navigate to **Settings** → **Sender Authentication** → **Authenticate Your Domain**
2. Click "Get Started"
3. Select your DNS provider (e.g., Cloudflare, GoDaddy, Route 53)
4. Enter your domain (e.g., `yourdomain.com`)
5. **Branding options**:
   - **Use automated security**: Check this (recommended)
   - **Custom return path**: Optional, improves deliverability
   - **Domain links**: Leave default unless you have specific needs
6. Click "Next"

SendGrid will provide DNS records to add:

**Example DNS Records**:
```
Type: CNAME
Host: s1._domainkey.yourdomain.com
Value: s1.domainkey.u12345.wl123.sendgrid.net

Type: CNAME
Host: s2._domainkey.yourdomain.com
Value: s2.domainkey.u12345.wl123.sendgrid.net

Type: CNAME
Host: em1234.yourdomain.com
Value: u12345.wl123.sendgrid.net
```

7. Add these records to your DNS provider
8. Return to SendGrid and click "Verify"
9. Verification may take up to 48 hours (usually much faster)

## Step 5: Configure Environment Variables

Add these to your `.env` file in the backend directory:

### For Production (SendGrid)

```bash
# Email Configuration - SendGrid
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=alerts@yourdomain.com
EMAIL_FROM_NAME=Market Screener Alerts
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

### Alternative: Gmail SMTP (Development Only)

For testing without SendGrid:

```bash
# Email Configuration - Gmail SMTP
EMAIL_PROVIDER=gmail
EMAIL_FROM=yourname@gmail.com
EMAIL_FROM_NAME=Market Screener Alerts
GMAIL_USER=yourname@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
```

**Note**: For Gmail, you need to create an App Password:
1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Generate an App Password for "Mail"
4. Use that password (not your regular Gmail password)

## Step 6: Configure in Market Screener Settings

1. Start your Market Screener application
2. Navigate to **Settings** → **Notifications** tab
3. Enable **Email Notifications**:
   - Toggle "Email Alerts" ON
   - Enter your email address for receiving alerts
   - (Optional) Add CC recipients separated by commas
4. Select alert types you want to receive:
   - Entry Signals
   - Target Hit
   - Stop Loss Hit
   - Price Alerts
5. Click "Save Settings"

## Step 7: Test Your Setup

### Backend Test

You can test email sending directly from the backend:

```bash
cd backend
node -e "
const sendgrid = require('@sendgrid/mail');
sendgrid.setApiKey('YOUR_API_KEY');
sendgrid.send({
  to: 'your-email@example.com',
  from: 'alerts@yourdomain.com',
  subject: 'Test Email',
  text: 'This is a test email from Market Screener',
  html: '<strong>This is a test email from Market Screener</strong>'
}).then(() => console.log('Email sent!')).catch(e => console.error(e));
"
```

### UI Test

1. In Market Screener, go to **Settings** → **Notifications**
2. Click the "Test" button next to Email configuration
3. Check your inbox for the test email
4. Check spam folder if not received

### Verify in SendGrid Dashboard

1. Go to **Activity** → **Activity Feed**
2. You should see your test email with status "Delivered"
3. Click on it for detailed delivery information

## Pricing

### Free Tier
- **100 emails per day** (3,000 per month)
- Perfect for testing and light use
- No credit card required
- Full API access

### Paid Plans

**Essentials** ($19.95/month):
- 50,000 emails per month
- 1,000 emails per day
- 3 days email activity history

**Pro** ($89.95/month):
- 100,000 emails per month
- Unlimited daily sending
- 7 days email activity history
- Dedicated IP available

**Premier** (Custom pricing):
- 1M+ emails per month
- Advanced features
- Account management
- Consulting services

### Cost Estimate for Trading Alerts

Assuming 50 trades per month with email alerts:
- **Free tier**: $0 (well within 100 emails/day limit)
- Most users won't need paid plans for trading alerts

## Email Templates

The Market Screener includes pre-built HTML email templates for:

### Entry Signal Alert
```html
Subject: 🎯 Entry Signal: RELIANCE @ ₹2510.50
Body: Professional HTML template with:
- Stock symbol and exchange
- Current price and trigger level
- Setup type (Breakout, Reversal, etc.)
- Entry, stop loss, and target levels
- Chart or additional data
```

### Target Hit Alert
```html
Subject: ✅ Target Hit: INFY Target 1 @ ₹1520.00
Body: Congratulatory message with profit details
```

### Stop Loss Hit Alert
```html
Subject: ⚠️ Stop Loss Hit: TCS @ ₹3480.00
Body: Warning template with loss details
```

## Improving Deliverability

### 1. Domain Authentication
- Always use domain authentication for production
- Significantly improves inbox placement
- Prevents emails going to spam

### 2. Warm Up Your Sending
If you're a new SendGrid user:
- Start with low volume (5-10 emails/day)
- Gradually increase over 2-4 weeks
- Helps establish sender reputation

### 3. Avoid Spam Triggers
- Don't use ALL CAPS in subject lines
- Avoid excessive punctuation (!!!)
- Don't use spam trigger words: "FREE", "GUARANTEED", etc.
- Keep HTML clean and simple

### 4. Enable Click and Open Tracking

In SendGrid:
1. Navigate to **Settings** → **Tracking**
2. Enable:
   - **Click Tracking**: Track link clicks
   - **Open Tracking**: Track email opens
   - **Subscription Tracking**: Unsubscribe management
3. This data helps improve future email campaigns

### 5. Handle Bounces and Complaints

Monitor:
1. **Activity Feed**: Check for bounces
2. **Suppressions**: Review blocked addresses
3. **Stats**: Track open rates and engagement

Remove invalid addresses to maintain sender reputation.

## Advanced Features

### Email Templates in SendGrid

Create reusable templates:

1. Navigate to **Email API** → **Dynamic Templates**
2. Click "Create Template"
3. Add template versions with Handlebars syntax
4. Use in code:

```typescript
import sendgrid from '@sendgrid/mail';

sendgrid.send({
  to: 'trader@example.com',
  from: 'alerts@yourdomain.com',
  templateId: 'd-xxxxxxxxxxxxxx',
  dynamicTemplateData: {
    symbol: 'RELIANCE',
    price: 2510.50,
    setupType: 'BREAKOUT'
  }
});
```

### Scheduled Sending

Delay email delivery:

```typescript
import sendgrid from '@sendgrid/mail';

sendgrid.send({
  to: 'trader@example.com',
  from: 'alerts@yourdomain.com',
  subject: 'Daily Market Summary',
  text: 'Your daily trading summary...',
  sendAt: Math.floor(Date.now() / 1000) + 3600 // Send in 1 hour
});
```

### Batch Sending

Send to multiple recipients efficiently:

```typescript
const emails = recipients.map(email => ({
  to: email,
  from: 'alerts@yourdomain.com',
  subject: 'Market Alert',
  text: 'Your personalized alert...'
}));

sendgrid.send(emails);
```

## Troubleshooting

### Emails Not Delivering

1. **Check Activity Feed**:
   - Go to **Activity** → **Activity Feed**
   - Look for your email and check status
   - Common statuses: Delivered, Bounced, Dropped, Deferred

2. **Common Issues**:
   - **401 Unauthorized**: Invalid or expired API key
   - **403 Forbidden**: Sender not verified
   - **Bounced**: Invalid recipient email
   - **Dropped**: Email flagged as spam

### Emails Going to Spam

1. **Use Domain Authentication**: Critical for inbox placement
2. **Check Spam Score**: Use tools like https://www.mail-tester.com/
3. **Avoid Spam Words**: Review email content
4. **Enable DMARC**: Add DMARC DNS record to your domain
5. **Warm Up**: Gradually increase sending volume

### API Key Not Working

1. **Verify permissions**: Ensure "Mail Send" is enabled
2. **Check for typos**: API keys are case-sensitive
3. **Regenerate**: Create a new API key if needed
4. **Environment variables**: Ensure .env file is loaded correctly

## Security Best Practices

1. **Never commit API keys**:
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use restricted API keys**:
   - Create separate keys for dev/prod
   - Grant minimum required permissions
   - Rotate keys periodically

3. **Rotate keys after compromise**:
   - Immediately delete compromised keys
   - Create new keys
   - Update environment variables

4. **Monitor for unusual activity**:
   - Set up email alerts for high volume
   - Review Activity Feed regularly
   - Check for unauthorized sending

## Resources

- **SendGrid Documentation**: https://docs.sendgrid.com/
- **API Reference**: https://docs.sendgrid.com/api-reference/mail-send/mail-send
- **Deliverability Guide**: https://sendgrid.com/resource/deliverability-guide/
- **Status Codes**: https://docs.sendgrid.com/api-reference/how-to-use-the-sendgrid-v3-api/responses
- **Support**: https://support.sendgrid.com/

## Next Steps

After setting up SendGrid:
1. Configure Twilio for SMS/WhatsApp ([TWILIO_SETUP.md](./TWILIO_SETUP.md))
2. Set up Telegram bot ([TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md))
3. Test all notification channels together
4. Monitor email deliverability in SendGrid dashboard
5. Fine-tune alert preferences based on trading needs

---

**Questions or Issues?**
- Check SendGrid Activity Feed for delivery status
- Review error codes in API responses
- Contact SendGrid support for account-specific issues
- Ensure DNS records are properly configured for domain authentication
