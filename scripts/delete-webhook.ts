/**
 * CLI script to delete the webhook for the bot
 * This will stop the bot from receiving updates via webhook
 * and allow switching back to polling mode.
 *
 * Usage:
 *   npx tsx scripts/delete-webhook.ts
 *   npm run webhook:delete
 */

import 'dotenv/config';

async function deleteWebhook(): Promise<void> {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('❌ Error: BOT_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    console.log('🗑️  Deleting webhook...');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
      method: 'POST',
    });

    const result = await response.json();

    if (result.ok) {
      console.log('✅ Webhook deleted successfully!');
      console.log('💡 You can now use polling mode');
    } else {
      console.error('❌ Failed to delete webhook:', result.description);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error deleting webhook:', error);
    process.exit(1);
  }
}

deleteWebhook();
