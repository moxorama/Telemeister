/**
 * CLI script to get webhook info for the bot
 *
 * Usage:
 *   npx tsx scripts/webhook-info.ts
 *   npm run webhook:info
 */

import "dotenv/config";
import { Bot } from "grammy";

async function getWebhookInfo(): Promise<void> {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error("❌ Error: BOT_TOKEN environment variable is required");
    console.error("Get your bot token from @BotFather on Telegram");
    process.exit(1);
  }

  const bot = new Bot(botToken);

  try {
    console.log("📡 Getting webhook info...\n");

    const info = await bot.api.getWebhookInfo();

    console.log("Webhook Info:");
    console.log("─".repeat(40));
    console.log(`URL: ${info.url || "(not set)"}`);
    console.log(`Has custom certificate: ${info.has_custom_certificate}`);
    console.log(`Pending update count: ${info.pending_update_count}`);
    if (info.last_error_date) {
      console.log(
        `Last error date: ${new Date(info.last_error_date * 1000).toISOString()}`,
      );
    }
    if (info.last_error_message) {
      console.log(`Last error message: ${info.last_error_message}`);
    }
    if (info.max_connections) {
      console.log(`Max connections: ${info.max_connections}`);
    }
    console.log("─".repeat(40));
  } catch (error) {
    console.error("❌ Failed to get webhook info:", error);
    process.exit(1);
  }
}

getWebhookInfo();
