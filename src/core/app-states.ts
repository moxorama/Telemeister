/**
 * Centralized Application State Types for Telemeister
 *
 * Define all your bot states here as a union type.
 * This provides type safety across all handlers.
 *
 * When you add a new state:
 * 1. Add it to the AppStates union below (or run `npm run state:add -- <state-name>`)
 * 2. Import these types in your handler
 */

/**
 * All application states as a union type.
 * Add new states here to get type safety across handlers.
 */
export type AppStates =
  | "idle"
  | "welcome"
  | "menu"
  | "collectName"
  | "collectEmail"
  | "completed";
