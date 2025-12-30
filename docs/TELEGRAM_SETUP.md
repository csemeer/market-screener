# Telegram Bot Setup Guide

Telegram bots provide instant push notifications for trading alerts directly to your Telegram account. This guide will help you create and configure a Telegram bot for Market Screener.

## Prerequisites

- A Telegram account (install from https://telegram.org/)
- Access to Telegram on mobile or desktop
- Basic understanding of bot interactions

## Why Use Telegram for Trading Alerts?

### Advantages
- **100% Free**: No API costs, unlimited messages
- **Instant Delivery**: Push notifications with low latency
- **Rich Formatting**: Support for markdown, buttons, and inline keyboards
- **Cross-Platform**: Works on iOS, Android, Web, Desktop
- **Reliable**: High uptime and delivery rate
- **Private**: End-to-end encryption available for user chats
- **No Phone Number Required**: Use username only

### Ideal For
- High-frequency trading alerts
- Real-time price notifications
- Position updates and alerts
- Daily market summaries

## Step 1: Create a Telegram Bot

### Using BotFather

BotFather is the official Telegram bot for creating and managing bots.

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** by clicking "Start" or sending `/start`
3. **Create a new bot** by sending the command:
   ```
   /newbot
   ```
4. **Choose a name** for your bot (displayed to users):
   ```
   Market Screener Alerts
   ```
5. **Choose a username** (must end in 'bot'):
   ```
   market_screener_alerts_bot
   ```
   or
   ```
   yourname_trading_bot
   ```

   **Note**: Username must be unique. Try variations if taken.

6. **Save the bot token** - BotFather will respond with:
   ```
   Done! Congratulations on your new bot. You will find it at
   t.me/market_screener_alerts_bot

   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890

   Keep your token secure and store it safely.
   ```

   **IMPORTANT**: Save this token immediately. You won't see it again!

## Step 2: Customize Your Bot

While chatting with BotFather, you can customize your bot:

### Set Description (shown in bot profile)
```
/setdescription
```
Then select your bot and enter:
```
Real-time stock market alerts and trading notifications for Market Screener Pro.
Receive instant alerts for entry signals, targets, and stop losses.
```

### Set About Text (shown in chat)
```
/setabouttext
```
Then select your bot and enter:
```
Get instant trading alerts directly in Telegram. Stay updated on breakouts, targets,
and stop losses without constantly checking your screen.
```

### Set Bot Picture
```
/setuserpic
```
Then select your bot and upload an image (square, at least 512x512px).

### Set Commands (help menu)
```
/setcommands
```
Then select your bot and enter:
```
start - Initialize the bot and get your Chat ID
help - Show available commands
status - Check alert settings
alerts - View recent alerts
subscribe - Enable all alerts
unsubscribe - Disable alerts
```

## Step 3: Get Your Chat ID

Your Chat ID is a unique identifier needed to send you messages.

### Method 1: Using Your Bot (Recommended)

1. **Find your bot** in Telegram search using the username you created
2. **Start a conversation** by clicking "Start" or sending any message
3. **Get your Chat ID** from the bot's response (if configured)

### Method 2: Using IDBot

1. Search for `@myidbot` in Telegram
2. Send `/start`
3. Send `/getid`
4. Note the number returned (e.g., `123456789`)

### Method 3: Using Telegram API

1. Send a message to your bot
2. Open this URL in your browser (replace TOKEN):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Look for `"chat":{"id":123456789}` in the response
4. The number is your Chat ID

**Example Chat ID**: `123456789` or `-987654321` (groups have negative IDs)

## Step 4: Configure Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_DEFAULT_CHAT_ID=123456789
```

**Note**: You can configure different Chat IDs per user in the application settings.

## Step 5: Configure in Market Screener Settings

1. Start your Market Screener application
2. Navigate to **Settings** → **Notifications** tab
3. Enable **Telegram Notifications**:
   - Toggle "Telegram Alerts" ON
   - Enter your Chat ID (obtained in Step 3)
   - Verify the bot token is configured in environment variables
4. Select alert types:
   - Entry Signals
   - Target Hit
   - Stop Loss Hit
   - Price Alerts
5. Click "Save Settings"

## Step 6: Test Your Setup

### UI Test

1. In Market Screener, go to **Settings** → **Notifications**
2. Click the "Test" button next to Telegram configuration
3. You should receive a test message in Telegram within seconds

### Manual Test (Backend)

Test directly using Node.js:

```bash
cd backend
node -e "
const axios = require('axios');
const token = 'YOUR_BOT_TOKEN';
const chatId = 'YOUR_CHAT_ID';
axios.post('https://api.telegram.org/bot' + token + '/sendMessage', {
  chat_id: chatId,
  text: 'Test message from Market Screener',
  parse_mode: 'Markdown'
}).then(() => console.log('Message sent!'))
  .catch(e => console.error(e.response.data));
"
```

### cURL Test

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<CHAT_ID>",
    "text": "Test from cURL",
    "parse_mode": "Markdown"
  }'
```

## Alert Message Formats

Market Screener sends formatted messages using Telegram Markdown:

### Entry Signal
```
🎯 *ENTRY SIGNAL*

Symbol: RELIANCE (NSE)
Setup: BREAKOUT
Timeframe: INTRADAY

📊 Levels:
Entry: ₹2500.00
Trigger: ₹2510.00
Stop Loss: ₹2450.00
Target 1: ₹2600.00

✅ Confidence: HIGH
Volume: 2.5M
```

### Target Hit
```
✅ *TARGET HIT*

Symbol: INFY (NSE)
Target: Target 1 @ ₹1520.00

Entry: ₹1480.00
Profit: ₹40.00 (+2.7%)

🎉 Congratulations!
```

### Stop Loss Hit
```
⚠️ *STOP LOSS HIT*

Symbol: TCS (NSE)
Stop Loss: ₹3480.00

Entry: ₹3520.00
Loss: ₹40.00 (-1.1%)

⚡ Position exited
```

## Advanced Features

### Rich Formatting

Telegram supports Markdown and HTML:

**Bold text**: `*bold*` or `<b>bold</b>`
**Italic text**: `_italic_` or `<i>italic</i>`
**Code**: `` `code` `` or `<code>code</code>`
**Links**: `[text](URL)` or `<a href="URL">text</a>`

### Inline Keyboards (Buttons)

Add interactive buttons to messages:

```typescript
import axios from 'axios';

await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
  chat_id: chatId,
  text: 'RELIANCE triggered at ₹2510.00',
  reply_markup: {
    inline_keyboard: [
      [
        { text: '✅ Enter Trade', callback_data: 'enter_RELIANCE' },
        { text: '❌ Skip', callback_data: 'skip_RELIANCE' }
      ],
      [
        { text: '📊 View Chart', url: 'https://tradingview.com/...' }
      ]
    ]
  }
});
```

### Sending Photos/Charts

Send chart images with alerts:

```typescript
await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
  chat_id: chatId,
  photo: 'https://your-server.com/charts/RELIANCE.png',
  caption: '📊 RELIANCE Daily Chart\nBreakout above ₹2500'
});
```

### Telegram Groups

Send alerts to a group instead of individual:

1. Create a Telegram group
2. Add your bot to the group
3. Make the bot an admin (optional, for more features)
4. Get the group Chat ID (negative number)
5. Use group Chat ID in settings

**Benefits**:
- Share alerts with team
- Discuss trades in real-time
- Multiple traders get same alerts

## Bot Commands Implementation

You can implement bot commands to interact with Market Screener:

```typescript
// In your backend
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `Welcome to Market Screener Alerts! 🎯\n\nYour Chat ID: ${chatId}\n\nUse this ID in the app settings to receive alerts.`
  );
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;
  // Fetch user's alert settings
  const settings = await getUserSettings(chatId);
  bot.sendMessage(
    chatId,
    `Alert Status:\n✅ Entry Signals: ${settings.entrySignals ? 'ON' : 'OFF'}\n✅ Targets: ${settings.targets ? 'ON' : 'OFF'}`
  );
});

bot.onText(/\/alerts/, async (msg) => {
  const chatId = msg.chat.id;
  // Fetch recent alerts
  const alerts = await getRecentAlerts(chatId, 10);
  bot.sendMessage(chatId, formatAlertsList(alerts));
});
```

## Pricing

**Cost: 100% FREE**
- Unlimited messages
- No API costs
- No rate limits (within reasonable use)
- Free for personal and commercial use

**Fair Use Policy**:
- Don't spam (max ~30 messages/second per bot)
- Don't use for mass marketing
- Respect Telegram's terms of service

## Rate Limits

Telegram has soft rate limits:
- **Group messages**: ~20 messages/minute
- **Individual messages**: ~30 messages/second
- **Same recipient**: 1 message/second recommended

For trading alerts, these limits are more than sufficient.

## Troubleshooting

### Bot Not Responding

1. **Check token**: Ensure bot token is correct
2. **Bot active**: Ensure bot is not deleted
3. **Permissions**: Check bot has necessary permissions in groups

### Messages Not Delivering

1. **Check Chat ID**: Verify Chat ID is correct
2. **User blocked bot**: User must start a conversation first
3. **API errors**: Check error response from Telegram API

Common errors:
- **400 Bad Request**: Invalid parameters or Chat ID
- **403 Forbidden**: Bot blocked by user or kicked from group
- **429 Too Many Requests**: Rate limit exceeded

### Getting Chat ID

If Chat ID is not working:
1. Delete and recreate the conversation
2. Send a fresh message to the bot
3. Use `getUpdates` API endpoint to fetch Chat ID
4. Ensure using the correct Chat ID format (no quotes in config)

### Bot Commands Not Working

1. **Set commands** using BotFather `/setcommands`
2. **Restart** Telegram app
3. **Check implementation** in backend code

## Security Best Practices

1. **Never expose bot token**:
   - Don't commit to Git
   - Don't share in public channels
   - Use environment variables only

2. **Revoke compromised tokens**:
   - Use BotFather `/revoke` command
   - Generate new token with `/newtoken`
   - Update environment variables

3. **Validate Chat IDs**:
   - Verify user owns the Chat ID before enabling
   - Implement verification code system

4. **Rate limiting**:
   - Implement queuing for high-volume alerts
   - Batch similar alerts together

## Verification System (Advanced)

Implement a verification system to ensure users own their Chat ID:

```typescript
// Generate verification code
const verificationCode = Math.random().toString(36).substring(7).toUpperCase();

// Store in database
await saveVerificationCode(userId, verificationCode);

// Instruct user
console.log(`Send this code to your bot: ${verificationCode}`);

// Bot command to verify
bot.on('message', async (msg) => {
  const code = msg.text;
  const chatId = msg.chat.id;

  const user = await findUserByVerificationCode(code);
  if (user) {
    await updateUserChatId(user.id, chatId);
    bot.sendMessage(chatId, '✅ Verified! You will now receive alerts.');
  }
});
```

## Resources

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **BotFather**: https://t.me/botfather
- **Bot Best Practices**: https://core.telegram.org/bots/tutorial
- **Telegram Support**: https://telegram.org/support

## Libraries and Tools

### Node.js Libraries

**node-telegram-bot-api** (Recommended):
```bash
npm install node-telegram-bot-api
npm install --save-dev @types/node-telegram-bot-api
```

**Telegraf** (Modern alternative):
```bash
npm install telegraf
```

### Testing Tools

- **Webhook Tester**: https://core.telegram.org/bots/webhooks
- **Bot API Tester**: https://api.telegram.org/bot<TOKEN>/getMe

## Next Steps

After setting up Telegram:
1. Configure Twilio for SMS/WhatsApp ([TWILIO_SETUP.md](./TWILIO_SETUP.md))
2. Configure SendGrid for email ([SENDGRID_SETUP.md](./SENDGRID_SETUP.md))
3. Test all notification channels together
4. Customize message formats and timing
5. Set up bot commands for interactive features
6. Consider implementing group alerts for teams

---

**Questions or Issues?**
- Check Telegram Bot API documentation
- Use BotFather for bot management
- Test with `getUpdates` API endpoint
- Ensure Chat ID format is correct (no quotes, just numbers)
- Verify bot token is active and not revoked
