import { TelegramClient, sessions } from "telegram";
const { StringSession } = sessions;
import type { NewMessageEvent } from "telegram/events/NewMessage.js";
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
 * Start the bot in polling mode
 * This mode continuously polls Telegram for new messages
 */
export async function startPollingMode(): Promise<TelegramClient> {
  const apiId = parseInt(process.env.API_ID || "0");
  const apiHash = process.env.API_HASH || "";
  const botToken = process.env.BOT_TOKEN || "";
  const sessionString = process.env.SESSION_STRING || "";

  if (!apiId || !apiHash || !botToken) {
    throw new Error(
      "Missing required environment variables: API_ID, API_HASH, BOT_TOKEN",
    );
  }

  const client = new TelegramClient(
    new StringSession(sessionString),
    apiId,
    apiHash,
    { connectionRetries: 5 },
  );

  await client.start({
    botAuthToken: botToken,
  });

  console.log("🤖 Bot started in polling mode");

  // Handle incoming messages
  client.addEventHandler(async (event: NewMessageEvent) => {
    const message = event.message;
    if (!message || !message.text) return;

    // Skip messages from bots (optional)
    if ((message.sender as any)?.bot) return;

    const chatId = message.chatId?.toJSNumber() || 0;
    const telegramId = message.senderId?.toJSNumber() || 0;
    const text = message.text;

    if (!telegramId || !chatId) {
      console.warn("Missing telegramId or chatId");
      return;
    }

    try {
      await handleUserMessage(client, telegramId, chatId, text);
    } catch (error) {
      console.error("Error handling message:", error);
      // Send error message to user
      try {
        await client.sendMessage(chatId, {
          message: "❌ An error occurred. Please try again.",
        });
      } catch {
        // Ignore send errors
      }
    }
  });

  return client;
}

/**
 * Handle a user message - load user, execute handler, transition state
 */
async function handleUserMessage(
  client: TelegramClient,
  telegramId: number,
  chatId: number,
  text: string,
): Promise<void> {
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
    send: (msg: string) => client.sendMessage(chatId, { message: msg }),
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
