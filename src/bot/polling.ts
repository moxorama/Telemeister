/**
 * Grammy-based Polling Mode Implementation
 *
 * Uses Grammy Bot API library with database-backed sessions.
 */

import { Bot, session, type Context } from "grammy";
import type { AppStates } from "../core/app-states.js";
import { appBuilder } from "../core/index.js";
import {
  PrismaSessionAdapter,
  getOrCreateSession,
  type SessionData,
} from "./session.js";
import type { BotHandlerContext } from "../core/types.js";

// Extend Grammy context with our custom properties
interface BotContext extends Context {
  session: SessionData;
}

/**
 * Create and configure the Grammy bot
 */
export function createBot(botToken: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(botToken);

  // Install session middleware with Prisma adapter
  bot.use(
    session({
      initial: (): SessionData => ({
        currentState: "idle",
        stateData: {},
      }),
      storage: new PrismaSessionAdapter(),
      getSessionKey: (ctx) => ctx.from?.id.toString(),
    }),
  );

  // Ensure user exists in database on each update
  bot.use(async (ctx, next) => {
    if (!ctx.from || !ctx.chat) {
      return next();
    }

    const telegramId = ctx.from.id;
    const chatId = ctx.chat.id;

    // Get or create user session
    const userSession = await getOrCreateSession(telegramId, chatId);
    ctx.session = userSession;

    return next();
  });

  // Handle text messages
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    // Create handler context compatible with existing handlers
    const handlerContext = createHandlerContext(ctx, session);

    // Execute onResponse handler for current state
    const nextState = await appBuilder.executeOnResponse(
      session.currentState as AppStates,
      handlerContext,
      text,
    );

    // Handle state transition
    if (nextState && nextState !== session.currentState) {
      await transitionToState(
        ctx,
        session,
        nextState as AppStates,
        handlerContext,
      );
    } else {
      // Save any state data changes
      session.stateData =
        handlerContext.getData<Record<string, unknown>>("__all") ||
        session.stateData;
    }
  });

  // Handle /start command
  bot.command("start", async (ctx) => {
    const session = ctx.session;

    // Create handler context
    const handlerContext = createHandlerContext(ctx, session);

    // Transition to welcome state
    await transitionToState(ctx, session, "welcome", handlerContext);
  });

  return bot;
}

/**
 * Start the bot in polling mode
 */
export async function startPollingMode(botToken: string): Promise<void> {
  const bot = createBot(botToken);

  console.log("🤖 Bot started in polling mode");

  // Start polling
  await bot.start({
    onStart: () => {
      console.log("✅ Bot is running and polling for updates...");
    },
  });
}

/**
 * Create a handler context compatible with existing handlers
 */
function createHandlerContext(
  ctx: BotContext,
  session: SessionData,
): BotHandlerContext<AppStates> {
  // Local state data copy for modifications
  const localStateData = { ...session.stateData };

  return {
    userId: session.userId || 0,
    telegramId: ctx.from?.id || 0,
    chatId: ctx.chat?.id || 0,
    currentState: session.currentState as AppStates,

    send: async (text: string) => {
      await ctx.reply(text, { parse_mode: "Markdown" });
    },

    setData: <T>(key: string, value: T) => {
      localStateData[key] = value;
    },

    getData: <T>(key: string): T | undefined => {
      if (key === "__all") {
        return localStateData as T;
      }
      return localStateData[key] as T | undefined;
    },

    transition: async (toState: AppStates) => {
      await transitionToState(
        ctx,
        session,
        toState,
        createHandlerContext(ctx, session),
      );
    },
  };
}

/**
 * Transition to a new state and execute onEnter handler
 */
async function transitionToState(
  ctx: BotContext,
  session: SessionData,
  toState: AppStates,
  handlerContext: BotHandlerContext<AppStates>,
): Promise<void> {
  // Update session state
  session.currentState = toState;

  // Execute onEnter handler for new state
  const enterNextState = await appBuilder.executeOnEnter(
    toState,
    handlerContext,
  );

  // Save state data changes
  session.stateData =
    handlerContext.getData<Record<string, unknown>>("__all") ||
    session.stateData;

  // Handle chained transition from onEnter
  if (enterNextState && enterNextState !== toState) {
    // Create fresh context for the next state
    const nextContext = createHandlerContext(ctx, session);
    const nextState = enterNextState as AppStates;
    nextContext.currentState = nextState;
    await transitionToState(ctx, session, nextState, nextContext);
  }
}
