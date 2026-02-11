/**
 * CLI script to get webhook info for the bot
 *
 * Usage:
 *   npx tsx scripts/webhook-info.ts
 *   npm run webhook:info
 */

import 'dotenv/config';

async function getWebhookInfo(): Promise<void> {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('❌ Error: BOT_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log('📡 Getting webhook info...\n');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const result = await response.json();

    if (result.ok) {
      const info = result.result;
      console.log('Webhook Info:');
      console.log('─'.repeat(40));
      console.log(`URL: ${info.url || '(not set)'}`);
      console.log(`Has custom certificate: ${info.has_custom_certificate}`);
      console.log(`Pending update count: ${info.pending_update_count}`);
      if (info.last_error_date) {
        console.log(`Last error date: ${new Date(info.last_error_date * 1000).toISOString()}`);
      }
      if (info.last_error_message) {
        console.log(`Last error message: ${info.last_error_message}`);
      }
      if (info.max_connections) {
        console.log(`Max connections: ${info.max_connections}`);
      }
      console.log('─'.repeat(40));
    } else {
      console.error('❌ Failed to get webhook info:', result.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error getting webhook info:', error);
    process.exit(1);
  }
}

getWebhookInfo();
