/**
 * Grammy-based Webhook Mode Implementation
 *
 * Uses Grammy Bot API library with Express for webhook handling.
 */

import express, { Request, Response } from 'express';
import { Bot, session, webhookCallback, type Context } from 'grammy';
import type { AppStates } from '../core/app-states.js';
import { appBuilder } from '../core/index.js';
import { PrismaSessionAdapter, getOrCreateSession, type SessionData } from './session.js';
import type { BotHandlerContext } from '../core/types.js';

// Extend Grammy context with our custom properties
interface BotContext extends Context {
  session: SessionData;
}

/**
 * Create and configure the Grammy bot (shared with polling)
 */
export function createBot(botToken: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(botToken);

  // Install session middleware with Prisma adapter
  bot.use(
    session({
      initial: (): SessionData => ({
        currentState: 'idle',
        stateData: {},
      }),
      storage: new PrismaSessionAdapter(),
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
    const userSession = await getOrCreateSession(telegramId, chatId);
    ctx.session = userSession;

    return next();
  });

  // Handle text messages
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const session = ctx.session;

    // Create handler context compatible with existing handlers
    const handlerContext = createHandlerContext(ctx, session);

    // Execute onResponse handler for current state
    const nextState = await appBuilder.executeOnResponse(
      session.currentState as AppStates,
      handlerContext,
      text
    );

    // Handle state transition
    if (nextState && nextState !== session.currentState) {
      await transitionToState(ctx, session, nextState as AppStates, handlerContext);
    } else {
      // Save any state data changes
      session.stateData =
        handlerContext.getData<Record<string, unknown>>('__all') || session.stateData;
    }
  });

  // Handle /start command
  bot.command('start', async (ctx) => {
    const session = ctx.session;

    // Create handler context
    const handlerContext = createHandlerContext(ctx, session);

    // Transition to welcome state
    await transitionToState(ctx, session, 'welcome', handlerContext);
  });

  return bot;
}

/**
 * Start the bot in webhook mode
 *
 * @param botToken - Telegram bot token
 * @param webhookUrl - Public URL where Telegram will send updates
 * @param port - Port to listen on
 */
export async function startWebhookMode(
  botToken: string,
  webhookUrl: string,
  port: number
): Promise<void> {
  const bot = createBot(botToken);

  // Create Express app
  const app = express();

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      mode: 'webhook',
      timestamp: new Date().toISOString(),
    });
  });

  // Set up webhook endpoint using Grammy's webhookCallback
  // This handles the Telegram update parsing automatically
  app.use('/webhook', webhookCallback(bot, 'express'));

  // Start server
  app.listen(port, async () => {
    console.log(`🤖 Bot started in webhook mode`);
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`🖥️  Server listening on port ${port}`);

    // Set webhook with Telegram
    try {
      await bot.api.setWebhook(webhookUrl, {
        allowed_updates: ['message'],
      });
      console.log('✅ Webhook set successfully with Telegram');
    } catch (error) {
      console.error('❌ Failed to set webhook:', error);
      throw error;
    }
  });
}

/**
 * Set webhook URL manually (for scripts)
 */
export async function setWebhook(botToken: string, webhookUrl: string): Promise<void> {
  const bot = new Bot(botToken);

  try {
    await bot.api.setWebhook(webhookUrl, {
      allowed_updates: ['message'],
    });
    console.log('✅ Webhook set successfully');
  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
    throw error;
  } finally {
    // Don't start the bot, just set the webhook
    await bot.api.deleteWebhook({ drop_pending_updates: true });
  }
}

/**
 * Delete webhook (stop receiving updates)
 */
export async function deleteWebhook(botToken: string): Promise<void> {
  const bot = new Bot(botToken);

  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    console.log('✅ Webhook deleted successfully');
  } catch (error) {
    console.error('❌ Failed to delete webhook:', error);
    throw error;
  }
}

/**
 * Get webhook info
 */
export async function getWebhookInfo(botToken: string): Promise<unknown> {
  const bot = new Bot(botToken);

  try {
    const info = await bot.api.getWebhookInfo();
    return info;
  } catch (error) {
    console.error('Error getting webhook info:', error);
    throw error;
  }
}

/**
 * Create a handler context compatible with existing handlers
 */
function createHandlerContext(ctx: BotContext, session: SessionData): BotHandlerContext<AppStates> {
  // Local state data copy for modifications
  const localStateData = { ...session.stateData };

  return {
    userId: session.userId || 0,
    telegramId: ctx.from?.id || 0,
    chatId: ctx.chat?.id || 0,
    currentState: session.currentState as AppStates,

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

    transition: async (toState: AppStates) => {
      await transitionToState(ctx, session, toState, createHandlerContext(ctx, session));
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
  handlerContext: BotHandlerContext<AppStates>
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
    const nextContext = createHandlerContext(ctx, session);
    const nextState = enterNextState as AppStates;
    nextContext.currentState = nextState;
    await transitionToState(ctx, session, nextState, nextContext);
  }
}
