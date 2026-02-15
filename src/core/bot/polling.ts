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
      getSessionKey: (ctx) => ctx.from?.id.toString(),
    })
  );

  // Ensure user exists in database on each update
  bot.use(async (ctx, next) => {
    if (!ctx.from || !ctx.chat) {
      return next();
    }

    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat.id.toString();

    // Get or create user session
    const { session: userSession, isNew } = await getOrCreateSession(telegramId, chatId, database);
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

  // Handle text messages
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    // Create handler context compatible with existing handlers
    const handlerContext = createHandlerContext(ctx, session, database);

    // Execute onResponse handler for current state
    const nextState = await appBuilder.executeOnResponse(
      session.currentState,
      handlerContext,
      text
    );

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
  // Local state data copy for modifications
  const localStateData = { ...session.stateData };

  return {
    userId: session.userId || 0,
    telegramId: ctx.from?.id || 0,
    chatId: ctx.chat?.id || 0,
    currentState: session.currentState,

    send: async (text: string) => {
      await ctx.reply(text, { parse_mode: 'Markdown' });
    },

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
