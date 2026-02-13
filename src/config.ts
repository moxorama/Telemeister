/**
 * Configuration and environment variables
 *
 * This file centralizes all environment variable access
 * and provides validation.
 */

function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || "";
}

function getEnvVarInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid integer`);
  }
  return parsed;
}

export const config = {
  // Telegram Bot API credentials (from @BotFather)
  botToken: getEnvVar("BOT_TOKEN"),

  // Bot mode: 'polling' or 'webhook'
  botMode: (process.env.BOT_MODE || "polling") as "polling" | "webhook",

  // Webhook configuration
  webhookUrl: process.env.WEBHOOK_URL || "",
  port: getEnvVarInt("PORT", 3000),

  // Database configuration
  db: {
    host: process.env.DB_HOST || "localhost",
    port: getEnvVarInt("DB_PORT", 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "telemeister",
  },
};

/**
 * Validate configuration
 */
export function validateConfig(): void {
  if (!config.botToken) {
    throw new Error(
      "BOT_TOKEN is required. Get it from @BotFather on Telegram.",
    );
  }

  if (config.botMode === "webhook" && !config.webhookUrl) {
    throw new Error("WEBHOOK_URL is required when BOT_MODE=webhook");
  }
}
