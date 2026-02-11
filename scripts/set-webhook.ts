/**
 * CLI script to set the webhook URL for the bot
 *
 * Usage:
 *   npx tsx scripts/set-webhook.ts https://example.com/webhook
 *   npm run webhook:set -- https://example.com/webhook
 */

import 'dotenv/config';

async function setWebhook(webhookUrl: string): Promise<void> {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('❌ Error: BOT_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!webhookUrl) {
    console.error('❌ Error: Webhook URL is required');
    console.error('Usage: npx tsx scripts/set-webhook.ts <webhook-url>');
    process.exit(1);
  }

  try {
    console.log(`🔗 Setting webhook to: ${webhookUrl}`);

    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
      }),
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📡 URL: ${webhookUrl}`);
    } else {
      console.error('❌ Failed to set webhook:', result.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error);
    process.exit(1);
  }
}

// Get webhook URL from command line arguments
const webhookUrl = process.argv[2];
setWebhook(webhookUrl);
