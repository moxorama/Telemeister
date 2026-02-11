import type { AppStates } from "./app-states";
import { BotBuilder } from "./builder";

/**
 * Core Types for Telemeister
 *
 * These types are used by both the builder and the bot handlers.
 *
 * To make state returns type-safe, define your states as a union type
 * and extend the BotHandlerContext:
 *
 * @example
 * ```typescript
 * // Define your states
 * type MyStates = 'idle' | 'welcome' | 'menu' | 'collectName';
 *
 * // Create typed context
 * interface MyContext extends BotHandlerContext<MyStates> {}
 *
 * // Use in handlers
 * botBuilder.forState('welcome').onEnter(async (ctx: MyContext) => {
 *   await ctx.send('Welcome!');
 *   return 'menu'; // ✅ Type-safe: only 'idle' | 'welcome' | 'menu' | 'collectName' allowed
 * });
 * ```
 */

/**
 * Typed builder instance for type-safe state returns.
 * Import this in your handlers instead of creating new BotBuilder instances.
 *
 * @example
 * ```typescript
 * import { appBuilder, type AppContext } from "../core";
 *
 * appBuilder
 *   .forState("welcome")
 *   .onEnter(async (context) => {
 *     await context.send("Welcome!");
 *     return "menu"; // ✅ Type-safe: only AppStates allowed
 *   });
 * ```
 */
export const appBuilder = new BotBuilder<AppStates>();

/**
 * Typed context for handlers.
 * Use this type for your handler context parameter.
 *
 * @example
 * ```typescript
 * import { appBuilder, type AppContext } from "../core";
 *
 * appBuilder
 *   .forState("welcome")
 *   .onEnter(async (context: AppContext) => {
 *     // context.currentState is typed as AppStates
 *     // return values are checked against AppStates
 *   });
 * ```
 */
export type AppContext = BotHandlerContext<AppStates>;

/**
 * Default state type - any string. Override with your own union type for type safety.
 */
export type BotState = string;

/**
 * Bot context passed to state handlers
 *
 * @template TState - Union type of all valid states (e.g., 'idle' | 'welcome' | 'menu')
 */
export interface BotHandlerContext<TState extends BotState = BotState> {
  /** Internal user ID from database */
  userId: number;

  /** Telegram user ID */
  telegramId: number;

  /** Telegram chat ID */
  chatId: number;

  /** Current state name */
  currentState: TState;

  /**
   * Send a message to the user
   * @param text - Message text (supports Markdown)
   */
  send: (text: string) => Promise<unknown>;

  /**
   * Store data in the user's state data
   * @param key - Data key
   * @param value - Data value
   */
  setData: <T>(key: string, value: T) => void;

  /**
   * Retrieve data from the user's state data
   * @param key - Data key
   * @returns The stored value or undefined
   */
  getData: <T>(key: string) => T | undefined;

  /**
   * Transition to a new state
   * This will trigger the new state's onEnter handler
   * @param toState - Target state name
   */
  transition: (toState: TState) => Promise<void>;
}

/**
 * Handler for onEnter - called when entering a state
 * Can optionally return a state to immediately transition to
 *
 * @template TState - Union type of all valid states
 */
export type EnterHandler<TState extends BotState = BotState> = (
  context: BotHandlerContext<TState>,
) => Promise<TState | void>;

/**
 * Handler for processing user response in a state
 * @returns The next state name to transition to, or void to stay in current state
 *
 * @template TState - Union type of all valid states
 */
export type ResponseHandler<TState extends BotState = BotState> = (
  context: BotHandlerContext<TState>,
  response: string,
) => Promise<TState | void>;

/**
 * State handler configuration
 *
 * @template TState - Union type of all valid states
 */
export interface StateHandlers<TState extends BotState = BotState> {
  /** Handler called when entering the state - can transition to another state */
  onEnter?: EnterHandler<TState>;

  /** Handler called when user sends a message in this state */
  onResponse?: ResponseHandler<TState>;
}

/**
 * Helper type to extract state names from a handler configuration
 */
export type ExtractStates<T> = T extends StateHandlers<infer S> ? S : never;

/**
 * XState context for the bot machine
 */
export interface BotContext {
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: string;
  stateData: Record<string, unknown>;
}

/**
 * XState events that can be sent to the machine
 */
export type BotEvent =
  | { type: "USER_MESSAGE"; message: string }
  | { type: "TRANSITION"; toState: string }
  | { type: "REENTER" };

/**
 * Input type for creating the machine
 */
export interface BotMachineInput {
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: string;
  stateData: Record<string, unknown>;
}
