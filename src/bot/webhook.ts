import express, { Request, Response } from "express";
import { TelegramClient, sessions, Api } from "telegram";
const { StringSession } = sessions;
import { createActor } from "xstate";
import { compactMachine } from "../core/compact-machine.js";
import { botBuilder } from "../core/index.js";
import {
  getUserByTelegramId,
  createOrUpdateUser,
  updateUserState,
} from "../database.js";
import type { BotHandlerContext } from "../core/types.js";

/**
 * Telegram Update type (simplified)
 */
interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot?: boolean;
    };
    chat?: {
      id: number;
    };
    text?: string;
  };
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

/**
 * Start the bot in webhook mode
 * This mode uses an HTTP server to receive updates from Telegram
 *
 * @param webhookUrl - Public URL where Telegram will send updates
 * @param port - Port to listen on
 */
export async function startWebhookMode(
  webhookUrl: string,
  port: number,
): Promise<void> {
  const apiId = parseInt(process.env.API_ID || "0");
  const apiHash = process.env.API_HASH || "";
  const botToken = process.env.BOT_TOKEN || "";
  const sessionString = process.env.SESSION_STRING || "";

  if (!apiId || !apiHash || !botToken) {
    throw new Error(
      "Missing required environment variables: API_ID, API_HASH, BOT_TOKEN",
    );
  }

  // Create Telegram client
  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5 },
  );

  await client.connect();

  // Set webhook using raw API
  await setWebhook(client, botToken, webhookUrl);

  // Create Express app
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", mode: "webhook" });
  });

  // Webhook endpoint
  app.post("/webhook", async (req: Request, res: Response) => {
    const update: TelegramUpdate = req.body;

    // Respond immediately to Telegram
    res.sendStatus(200);

    // Process update asynchronously
    try {
      await processUpdate(client, update);
    } catch (error) {
      console.error("Error processing update:", error);
    }
  });

  // Start server
  app.listen(port, () => {
    console.log(`🤖 Bot started in webhook mode`);
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`🖥️  Server listening on port ${port}`);
  });
}

/**
 * Set webhook using Telegram Bot API
 */
async function setWebhook(
  client: TelegramClient,
  botToken: string,
  webhookUrl: string,
): Promise<void> {
  try {
    // Use the raw Bot API to set webhook
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message"],
        }),
      },
    );

    const result = (await response.json()) as TelegramApiResponse;
    if (result.ok) {
      console.log("✅ Webhook set successfully");
    } else {
      console.error("❌ Failed to set webhook:", result.description);
      throw new Error(`Failed to set webhook: ${result.description}`);
    }
  } catch (error) {
    console.error("Error setting webhook:", error);
    throw error;
  }
}

/**
 * Delete webhook (stop receiving updates)
 */
export async function deleteWebhook(botToken: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/deleteWebhook`,
      {
        method: "POST",
      },
    );

    const result = (await response.json()) as TelegramApiResponse;
    if (result.ok) {
      console.log("✅ Webhook deleted successfully");
    } else {
      console.error("❌ Failed to delete webhook:", result.description);
    }
  } catch (error) {
    console.error("Error deleting webhook:", error);
    throw error;
  }
}

/**
 * Get webhook info
 */
export async function getWebhookInfo(botToken: string): Promise<unknown> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`,
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error getting webhook info:", error);
    throw error;
  }
}

/**
 * Process a single Telegram update
 */
async function processUpdate(
  client: TelegramClient,
  update: TelegramUpdate,
): Promise<void> {
  const message = update.message;
  if (!message || !message.text) return;

  // Skip messages from bots
  if (message.from?.is_bot) return;

  const telegramId = message.from?.id || 0;
  const chatId = message.chat?.id || 0;
  const text = message.text;

  if (!telegramId || !chatId) {
    console.warn("Missing telegramId or chatId");
    return;
  }

  // Get or create user from database
  let user = await getUserByTelegramId(telegramId);
  if (!user) {
    user = await createOrUpdateUser({
      telegramId,
      chatId,
      currentState: "idle",
      stateData: {},
    });
    console.log(`[Bot] New user created: ${telegramId}`);
  }

  // Parse state data from user info
  const userStateData: Record<string, unknown> = user.info?.stateData
    ? JSON.parse(user.info.stateData as string)
    : {};

  // Create XState actor for this user
  const actor = createActor(compactMachine, {
    input: {
      userId: user.id,
      telegramId: user.telegramId,
      chatId: user.chatId,
      currentState: user.currentState,
      stateData: userStateData,
    },
  });

  actor.start();

  // Track state data changes
  const stateData = { ...userStateData };

  // Create bot context for handlers
  const context: BotHandlerContext = {
    userId: user.id,
    telegramId: user.telegramId,
    chatId: user.chatId,
    currentState: user.currentState,
    send: async (msg: string) => {
      await sendMessage(client, process.env.BOT_TOKEN || "", chatId, msg);
    },
    setData: <T>(key: string, value: T) => {
      stateData[key] = value;
    },
    getData: <T>(key: string): T | undefined => stateData[key] as T,
    transition: async (toState: string) => {
      actor.send({ type: "TRANSITION", toState });
    },
  };

  // Execute onResponse handler for current state
  const responseNextState = await botBuilder.executeOnResponse(
    user.currentState,
    context,
    text,
  );

  // If handler returned a state, transition to it
  if (responseNextState && responseNextState !== user.currentState) {
    await updateUserState(telegramId, responseNextState, stateData);
    context.currentState = responseNextState;

    // Execute onEnter for the new state
    const enterNextState = await botBuilder.executeOnEnter(
      responseNextState,
      context,
    );

    // If onEnter returned a state, transition again
    if (enterNextState && enterNextState !== responseNextState) {
      await updateUserState(telegramId, enterNextState, stateData);
      context.currentState = enterNextState;
      await botBuilder.executeOnEnter(enterNextState, context);
    }
  } else {
    // Just update state data if no transition
    if (JSON.stringify(stateData) !== JSON.stringify(userStateData)) {
      await updateUserState(telegramId, user.currentState, stateData);
    }
  }

  // Stop the actor
  actor.stop();
}

/**
 * Send a message using Telegram Bot API
 */
async function sendMessage(
  client: TelegramClient,
  botToken: string,
  chatId: number,
  text: string,
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
        }),
      },
    );

    const result = (await response.json()) as TelegramApiResponse;
    if (!result.ok) {
      console.error("Failed to send message:", result.description);
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
