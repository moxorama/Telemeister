/**
 * Core module for Telemeister
 *
 * This module exports the centralized state types and typed builder.
 * Import from here in your handlers for type safety.
 */

export { BotBuilder, botBuilder } from "./builder.js";

export type { AppStates } from "./app-states.js";

export { appBuilder } from "./types.js";
export type { AppContext } from "./types.js";

// Re-export core types for convenience
export type {
  BotHandlerContext,
  BotState,
  EnterHandler,
  ResponseHandler,
  StateHandlers,
} from "./types.js";
