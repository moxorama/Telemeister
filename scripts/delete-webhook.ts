/**
 * CLI script to delete the webhook for the bot
 * This will stop the bot from receiving updates via webhook
 * and allow switching back to polling mode.
 *
 * Usage:
 *   npx tsx scripts/delete-webhook.ts
 *   npm run webhook:delete
 */

import "dotenv/config";
import { Bot } from "grammy";

async function deleteWebhook(): Promise<void> {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error("❌ Error: BOT_TOKEN environment variable is required");
    console.error("Get your bot token from @BotFather on Telegram");
    process.exit(1);
  }

  const bot = new Bot(botToken);

  try {
    console.log("🗑️  Deleting webhook...");

    await bot.api.deleteWebhook({ drop_pending_updates: true });

    console.log("✅ Webhook deleted successfully!");
    console.log("💡 You can now use polling mode");
  } catch (error) {
    console.error("❌ Failed to delete webhook:", error);
    process.exit(1);
  }
}

deleteWebhook();
