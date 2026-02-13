/**
 * CLI script to set the webhook URL for the bot
 *
 * Usage:
 *   npx tsx scripts/set-webhook.ts https://example.com/webhook
 *   npm run webhook:set -- https://example.com/webhook
 */

import "dotenv/config";
import { Bot } from "grammy";

async function setWebhook(webhookUrl: string): Promise<void> {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error("❌ Error: BOT_TOKEN environment variable is required");
    console.error("Get your bot token from @BotFather on Telegram");
    process.exit(1);
  }

  if (!webhookUrl) {
    console.error("❌ Error: Webhook URL is required");
    console.error("Usage: npx tsx scripts/set-webhook.ts <webhook-url>");
    process.exit(1);
  }

  const bot = new Bot(botToken);

  try {
    console.log(`🔗 Setting webhook to: ${webhookUrl}`);

    await bot.api.setWebhook(webhookUrl, {
      allowed_updates: ["message"],
    });

    console.log("✅ Webhook set successfully!");
    console.log(`📡 URL: ${webhookUrl}`);
  } catch (error) {
    console.error("❌ Failed to set webhook:", error);
    process.exit(1);
  }
}

// Get webhook URL from command line arguments
const webhookUrl = process.argv[2];
setWebhook(webhookUrl);
