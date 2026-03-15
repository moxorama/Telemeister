/**
 * Grammy-based Polling Mode Implementation
 *
 * Uses Grammy Bot API library with database-backed sessions.
 */

import { Bot, session, type Context } from 'grammy';
import { appBuilder, type BotHandlerContext } from 'telemeister/core';
import { SessionStorageAdapter, getOrCreateSession, type SessionData } from './session.js';
import type { DatabaseAdapter } from './types.js';

// Extend Grammy context with our custom properties
interface BotContext extends Context {
  session: SessionData;
}

export interface PollingConfig {
  token: string;
  database: DatabaseAdapter;
}

function extractUserId(ctx: Context): number | undefined {
  return ctx.from?.id ?? ctx.pollAnswer?.user?.id;
}

/**
 * Create and configure the Grammy bot
 */
export function createBot(config: PollingConfig): Bot<BotContext> {
  const { token, database } = config;
  const bot = new Bot<BotContext>(token);

  // Install session middleware with storage adapter
  bot.use(
    session({
      initial: (): SessionData => ({
        currentState: 'idle',
        stateData: {},
      }),
      storage: new SessionStorageAdapter(database),
      getSessionKey: (ctx) => extractUserId(ctx)?.toString(),
    })
  );

  // Ensure user exists in database on each update
  bot.use(async (ctx, next) => {
    const telegramId = extractUserId(ctx);
    if (!telegramId) {
      return next();
    }

    const telegramIdStr = telegramId.toString();
    const chatId = ctx.chat?.id.toString() ?? ctx.session?.chatId;
    const username = ctx.from?.username;

    if (!chatId) {
      return next();
    }

    // Get or create user session
    const { session: userSession, isNew } = await getOrCreateSession(
      telegramIdStr,
      username,
      chatId,
      database
    );
    ctx.session = userSession;

    // Call onEnter for initial state if this is a new session
    if (isNew) {
      const handlerContext = createHandlerContext(ctx, userSession, database);
      const nextState = await appBuilder.executeOnEnter(userSession.currentState, handlerContext);

      // Handle transition from onEnter
      if (nextState && nextState !== userSession.currentState) {
        await transitionToState(ctx, userSession, nextState, handlerContext, database);
      } else {
        // Save any state data changes
        userSession.stateData =
          handlerContext.getData<Record<string, unknown>>('__all') || userSession.stateData;
      }
    }

    return next();
  });

  // Handle all updates (messages, callbacks, polls, etc.)
  bot.use(async (ctx) => {
    if (!ctx.session) return;

    const session = ctx.session;

    // Create handler context compatible with existing handlers
    const handlerContext = createHandlerContext(ctx, session, database);

    // Check for commands first
    const text = ctx.message?.text?.trim();
    let nextState: string | void = undefined;

    if (text && text.startsWith('/')) {
      const command = text.split(' ')[0].slice(1).toLowerCase(); // Remove leading slash
      nextState = await appBuilder.executeCommand(command, session.currentState, handlerContext);
    }

    // If no command handled or command returned void, execute onResponse handler
    if (nextState === undefined) {
      nextState = await appBuilder.executeOnResponse(session.currentState, handlerContext);
    }

    // Handle state transition (call onEnter even for same state)
    if (nextState) {
      await transitionToState(ctx, session, nextState, handlerContext, database);
    } else {
      // Save any state data changes
      session.stateData =
        handlerContext.getData<Record<string, unknown>>('__all') || session.stateData;
    }
  });

  return bot;
}

/**
 * Start the bot in polling mode
 */
export async function startPollingMode(config: PollingConfig): Promise<void> {
  const bot = createBot(config);

  console.log('🤖 Bot started in polling mode');

  // Start polling
  await bot.start({
    onStart: () => {
      console.log('✅ Bot is running and polling for updates...');
    },
  });
}

/**
 * Create a handler context compatible with existing handlers
 */
function createHandlerContext(
  ctx: BotContext,
  session: SessionData,
  database: DatabaseAdapter
): BotHandlerContext<string> {
  const localStateData = { ...session.stateData };
  const chatId = ctx.chat?.id ?? (session.chatId ? parseInt(session.chatId, 10) : 0);

  return {
    userId: session.userId || 0,
    telegramId: extractUserId(ctx) || 0,
    chatId,
    currentState: session.currentState,
    ctx: ctx,

    setData: <T>(key: string, value: T) => {
      localStateData[key] = value;
    },

    getData: <T>(key: string): T | undefined => {
      if (key === '__all') {
        return localStateData as T;
      }
      return localStateData[key] as T | undefined;
    },

    transition: async (toState: string) => {
      await transitionToState(
        ctx,
        session,
        toState,
        createHandlerContext(ctx, session, database),
        database
      );
    },

    reply: (text, extra) => {
      return ctx.api.sendMessage(chatId, text, extra);
    },
  };
}

/**
 * Transition to a new state and execute onEnter handler
 */
async function transitionToState(
  ctx: BotContext,
  session: SessionData,
  toState: string,
  handlerContext: BotHandlerContext<string>,
  database: DatabaseAdapter
): Promise<void> {
  // Update session state
  session.currentState = toState;

  // Execute onEnter handler for new state
  const enterNextState = await appBuilder.executeOnEnter(toState, handlerContext);

  // Save state data changes
  session.stateData = handlerContext.getData<Record<string, unknown>>('__all') || session.stateData;

  // Handle chained transition from onEnter
  if (enterNextState && enterNextState !== toState) {
    // Create fresh context for the next state
    const nextContext = createHandlerContext(ctx, session, database);
    const nextState = enterNextState;
    nextContext.currentState = nextState;
    await transitionToState(ctx, session, nextState, nextContext, database);
  }
}
