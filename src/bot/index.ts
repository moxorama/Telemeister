/**
 * Bot module exports
 *
 * Provides polling and webhook modes for running the bot.
 */

export { startPollingMode, createBot } from './polling.js';
export { startWebhookMode } from './webhook.js';
export { PrismaSessionAdapter, getOrCreateSession } from './session.js';
export type { SessionData } from './session.js';
