/**
 * Bot Runtime Module
 *
 * This module provides the runtime components for running Telegram bots.
 * Import from 'telemeister/core/bot' to use polling or webhook modes.
 *
 * @example
 * ```typescript
 * import { startPollingMode, startWebhookMode } from 'telemeister/core/bot';
 * import { databaseAdapter } from './lib/database.js';
 *
 * // Polling mode
 * await startPollingMode({
 *   token: process.env.BOT_TOKEN!,
 *   database: databaseAdapter,
 * });
 *
 * // Webhook mode
 * await startWebhookMode({
 *   token: process.env.BOT_TOKEN!,
 *   database: databaseAdapter,
 *   webhookUrl: process.env.WEBHOOK_URL!,
 *   port: 3000,
 * });
 * ```
 */

// Bot runners
export { startPollingMode, createBot as createPollingBot } from './polling.js';
export {
  startWebhookMode,
  createBot as createWebhookBot,
  setWebhook,
  deleteWebhook,
  getWebhookInfo,
} from './webhook.js';

// Types
export type { PollingConfig } from './polling.js';
export type { WebhookConfig } from './webhook.js';
export type { DatabaseAdapter, UserData, SessionData, SessionResult } from './types.js';

// Session utilities
export { SessionStorageAdapter, getOrCreateSession } from './session.js';
export type {
  SessionData as GrammySessionData,
  SessionResult as GrammySessionResult,
} from './session.js';
