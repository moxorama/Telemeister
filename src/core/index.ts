/**
 * Core module for Telemeister
 *
 * This module exports the centralized state types and typed builder.
 * Import from here in your handlers for type safety.
 */

export { BotBuilder, botBuilder } from './builder.js';

// Note: AppStates and StateTransitions should be imported from your generated bot-state-types.ts
// Example: import type { AppStates, StateTransitions } from './bot-state-types.js';

export { appBuilder } from './types.js';
export type { AppContext } from './types.js';

export type {
  BotHandlerContext,
  BotState,
  EnterHandler,
  ResponseHandler,
  StateHandlers,
} from './types.js';

// Re-export bot runtime for convenience
// Full exports available at 'telemeister/core/bot'
export {
  startPollingMode,
  startWebhookMode,
  setWebhook,
  deleteWebhook,
  getWebhookInfo,
} from './bot/index.js';
