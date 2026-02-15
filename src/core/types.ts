import { BotBuilder } from './builder.js';

// Generic appBuilder - users should cast to their specific state type
export const appBuilder = new BotBuilder<string>();

// Generic AppContext - users should use their own state-specific types
export type AppContext = BotHandlerContext<string>;

export type BotState = string;

export interface BotHandlerContext<TState extends BotState = BotState> {
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: TState;
  send: (text: string) => Promise<unknown>;
  setData: <T>(key: string, value: T) => void;
  getData: <T>(key: string) => T | undefined;
  transition: (toState: TState) => Promise<void>;
}

export type EnterHandler<TState extends BotState = BotState> = (
  context: BotHandlerContext<TState>
) => Promise<TState | void>;

export type ResponseHandler<TState extends BotState = BotState> = (
  context: BotHandlerContext<TState>,
  response: string
) => Promise<TState | void>;

export interface StateHandlers<TState extends BotState = BotState> {
  onEnter?: EnterHandler<TState>;
  onResponse?: ResponseHandler<TState>;
}

export type ExtractStates<T> = T extends StateHandlers<infer S> ? S : never;

export interface BotContext {
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: string;
  stateData: Record<string, unknown>;
}

export type BotEvent =
  | { type: 'USER_MESSAGE'; message: string }
  | { type: 'TRANSITION'; toState: string }
  | { type: 'REENTER' };

export interface BotMachineInput {
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: string;
  stateData: Record<string, unknown>;
}
