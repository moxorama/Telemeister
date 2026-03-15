import type { Context } from 'grammy';
import { BotBuilder } from './builder.js';

export const appBuilder = new BotBuilder<string>();

export type AppContext = BotHandlerContext<string>;

export type BotState = string;

export interface BotHandlerContext<TState extends BotState = BotState> {
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: TState;
  ctx: Context;
  setData: <T>(key: string, value: T) => void;
  getData: <T>(key: string) => T | undefined;
  transition: (toState: TState) => Promise<void>;
  reply: (text: string, extra?: Parameters<Context['reply']>[1]) => ReturnType<Context['reply']>;
}

export type EnterHandler<TState extends BotState = BotState> = (
  context: BotHandlerContext<TState>
) => Promise<TState | void>;

export type ResponseHandler<TState extends BotState = BotState> = (
  context: BotHandlerContext<TState>
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
