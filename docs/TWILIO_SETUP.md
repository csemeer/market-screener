# Twilio Setup Guide

Twilio provides SMS and WhatsApp notification capabilities for the Market Screener application. This guide will help you set up Twilio for sending trading alerts via SMS and WhatsApp.

## Prerequisites

- A Twilio account (sign up at https://www.twilio.com/try-twilio)
- A verified phone number for receiving test messages
- Credit card for purchasing a phone number (required for production use)

## Step 1: Create a Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Click "Sign up" and fill in your details
3. Verify your email address
4. Verify your phone number (this will be used for testing)

## Step 2: Get Your Account Credentials

Once logged in to the Twilio Console (https://console.twilio.com/):

1. Navigate to the **Dashboard** (default landing page)
2. Find your credentials in the "Account Info" section:
   - **Account SID**: A unique identifier for your account (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token**: Your secret authentication token (click "Show" to reveal)
3. **Important**: Keep your Auth Token secret! Never commit it to version control.

## Step 3: Set Up SMS Notifications

### Get a Twilio Phone Number

1. In the Twilio Console, navigate to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country (e.g., United States, India)
3. Choose a phone number with SMS capabilities
4. Click "Buy" (costs vary by country, typically $1-2/month)
5. Note down your Twilio phone number (e.g., `+14155552671`)

### Test SMS (Free Tier)

On the free trial:
- You can only send SMS to verified phone numbers
- Messages will include a "Sent from your Twilio trial account" prefix
- You get free trial credit (typically $15)

To verify additional numbers:
1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Click "+" to add a new number
3. Enter the phone number in E.164 format (e.g., `+919876543210`)
4. Complete the verification process

## Step 4: Set Up WhatsApp Notifications

Twilio provides two options for WhatsApp:

### Option A: Twilio Sandbox for WhatsApp (Free, For Testing)

Perfect for development and testing:

1. In Twilio Console, go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow the instructions to join the sandbox:
   - Send a WhatsApp message to the Twilio number shown (e.g., `+1 415 523 8886`)
   - Include the join code (e.g., `join <your-code>`)
3. Note the sandbox WhatsApp number (format: `whatsapp:+14155238886`)
4. Your personal WhatsApp number format: `whatsapp:+919876543210`

**Limitations:**
- 3-day session timeout (users must re-join)
- "Sent via Twilio Sandbox" watermark
- Only for testing, not production

### Option B: WhatsApp Business API (Production)

For production use:

1. Apply for a WhatsApp Business Account through Twilio
2. Submit business verification documents
3. Wait for approval (can take several days)
4. Get a dedicated WhatsApp-enabled phone number
5. Set up message templates (required by WhatsApp)

**Note**: This requires business verification and has monthly costs.

## Step 5: Configure Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+14155552671

# WhatsApp Configuration (if using WhatsApp)
# For Sandbox (testing):
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
# For Production:
# TWILIO_WHATSAPP_NUMBER=whatsapp:+14155552671
```

## Step 6: Configure in Market Screener Settings

1. Start your Market Screener application
2. Navigate to **Settings** → **Notifications** tab
3. Enable **SMS Notifications**:
   - Toggle "SMS Alerts" ON
   - Enter your phone number in E.164 format (e.g., `+919876543210`)
4. Enable **WhatsApp Notifications**:
   - Toggle "WhatsApp Alerts" ON
   - Enter your WhatsApp number in format `whatsapp:+919876543210`
5. Click "Save Settings"

## Step 7: Test Your Setup

### Test SMS

1. In Market Screener, go to **Settings** → **Notifications**
2. Click the "Test" button next to SMS configuration
3. You should receive a test SMS within a few seconds
4. Check the Twilio Console → **Monitor** → **Logs** → **Messaging** to see delivery status

### Test WhatsApp

1. Ensure you've joined the Twilio Sandbox (if using sandbox)
2. In Market Screener, click the "Test" button next to WhatsApp configuration
3. You should receive a WhatsApp message from the Twilio number
4. Check Twilio Console logs if you don't receive it

## Pricing

### SMS Pricing (Pay-as-you-go)

Varies by country:
- **United States**: $0.0079 per SMS
- **India**: $0.0095 per SMS (promotional route)
- **United Kingdom**: $0.04 per SMS

Full pricing: https://www.twilio.com/sms/pricing

### WhatsApp Pricing

- **Sandbox**: Free (testing only)
- **Business API**:
  - Business-initiated messages: ~$0.005-0.01 per message
  - User-initiated messages (24-hour window): Free
  - Rates vary by country

Full pricing: https://www.twilio.com/whatsapp/pricing

### Cost Estimates for Trading Alerts

Assuming 50 trades per month with alerts:
- **SMS only**: ~$0.40 - $0.50/month
- **WhatsApp only**: ~$0.25 - $0.50/month
- **Both**: ~$0.65 - $1.00/month

Plus phone number rental: ~$1-2/month

## Troubleshooting

### Messages Not Sending

1. **Check Twilio Console Logs**:
   - Go to **Monitor** → **Logs** → **Errors**
   - Look for error codes and descriptions

2. **Common Issues**:
   - **Error 21211**: Invalid 'To' phone number
     - Solution: Use E.164 format (`+919876543210`)
   - **Error 21408**: Permission to send to number denied
     - Solution: Verify the phone number in Twilio Console
   - **Error 21610**: Message cannot be sent (blocked)
     - Solution: Check if number is on opt-out list

3. **WhatsApp Session Expired**:
   - Sandbox sessions expire after 3 days
   - Solution: Re-send the join code to the Twilio number

### Account Suspended

- Twilio may suspend accounts for unusual activity
- Solution: Contact Twilio support with use case details
- Upgrade from trial to paid account

### Rate Limits

- Free trial: Limited to 1 message/second
- Paid accounts: Higher throughput
- Solution: Implement queuing or upgrade account

## Security Best Practices

1. **Never commit credentials**:
   - Add `.env` to `.gitignore`
   - Use environment variables only

2. **Rotate Auth Token regularly**:
   - Twilio Console → Settings → API credentials → Create new token

3. **Use Twilio Verify for OTP**:
   - For user authentication, use Twilio Verify API
   - Prevents fraud and reduces costs

4. **Monitor usage**:
   - Set up usage alerts in Twilio Console
   - Check for unexpected spikes (potential abuse)

## Advanced Configuration

### Delivery Status Webhooks

Receive delivery confirmations:

1. Create a webhook endpoint in your backend:
```typescript
// In backend/src/routes/webhooks.ts
router.post('/twilio/status', (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;
  console.log(`Message ${MessageSid} status: ${MessageStatus}`);
  res.sendStatus(200);
});
```

2. Configure in Twilio Console:
   - Go to your phone number settings
   - Set "Status Callback URL" to `https://your-app.com/api/webhooks/twilio/status`

### Message Scheduling

For delayed alerts:

```typescript
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

client.messages.create({
  body: 'Your trade alert',
  from: twilioNumber,
  to: recipientNumber,
  scheduleType: 'fixed',
  sendAt: new Date('2024-01-15T09:30:00Z')
});
```

## Resources

- **Twilio Documentation**: https://www.twilio.com/docs
- **SMS API Reference**: https://www.twilio.com/docs/sms/api
- **WhatsApp API**: https://www.twilio.com/docs/whatsapp
- **Error Codes**: https://www.twilio.com/docs/api/errors
- **Support**: https://support.twilio.com

## Next Steps

After setting up Twilio:
1. Configure SendGrid for email notifications ([SENDGRID_SETUP.md](./SENDGRID_SETUP.md))
2. Set up Telegram bot ([TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md))
3. Configure alert preferences in Market Screener settings
4. Test end-to-end notification delivery

---

**Questions or Issues?**
- Check Twilio Console logs first
- Review error codes in documentation
- Contact Twilio support for account-specific issues
