import "dotenv/config";
import { config, validateConfig } from "./config";
import { startPollingMode } from "./bot/polling";
import { startWebhookMode } from "./bot/webhook";

// Import state handlers (registers all handlers with the builder)
import "./handlers";

/**
 * Main entry point for the Telemeister bot
 *
 * Usage:
 *   BOT_MODE=polling npm run dev
 *   BOT_MODE=webhook WEBHOOK_URL=https://example.com/webhook npm run dev
 */
async function main(): Promise<void> {
  // Validate configuration
  validateConfig();

  console.log(`🚀 Starting Telemeister in ${config.botMode} mode...`);

  if (config.botMode === "webhook") {
    await startWebhookMode(config.webhookUrl, config.port);
  } else {
    await startPollingMode();
  }
}

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

// Start the bot
main().catch((error) => {
  console.error("Failed to start bot:", error);
  process.exit(1);
});
