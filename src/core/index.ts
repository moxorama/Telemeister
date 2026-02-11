/**
 * Core module for Telemeister
 *
 * This module exports the centralized state types and typed builder.
 * Import from here in your handlers for type safety.
 */

export { BotBuilder, botBuilder } from "./builder";

export type { AppStates } from "./app-states";

export { appBuilder } from "./types";
export type { AppContext } from "./types";

// Re-export core types for convenience
export type {
  BotHandlerContext,
  BotState,
  EnterHandler,
  ResponseHandler,
  StateHandlers,
} from "./types";
