/**
 * Grammy Session Adapter for Prisma Database
 *
 * This adapter integrates Grammy's session system with the Prisma database,
 * allowing user state to persist across restarts.
 */

import type { StorageAdapter } from 'grammy';
import { getUserByTelegramId, createOrUpdateUser, updateUserState } from '../database.js';

/**
 * Session data stored per user
 */
export interface SessionData {
  /** Current FSM state */
  currentState: string;
  /** User-specific data storage */
  stateData: Record<string, unknown>;
  /** Internal user ID from database */
  userId?: number;
  /** Telegram chat ID */
  chatId?: string;
}

/**
 * Prisma-backed session storage adapter for Grammy
 *
 * This adapter loads/saves session data from/to the database,
 * keyed by Telegram user ID.
 */
export class PrismaSessionAdapter implements StorageAdapter<SessionData> {
  /**
   * Read session data from database
   * @param key - Telegram user ID (as string)
   */
  async read(key: string): Promise<SessionData | undefined> {
    const user = await getUserByTelegramId(key);
    if (!user) return undefined;

    const stateData: Record<string, unknown> = user.info?.stateData
      ? JSON.parse(user.info.stateData as string)
      : {};

    return {
      currentState: user.currentState,
      stateData,
      userId: user.id,
      chatId: user.chatId,
    };
  }

  /**
   * Write session data to database
   * @param key - Telegram user ID (as string)
   * @param value - Session data to save
   */
  async write(key: string, value: SessionData): Promise<void> {
    await updateUserState(key, value.currentState, value.stateData);
  }

  /**
   * Delete session data (not typically used in bots)
   * @param key - Telegram user ID (as string)
   */
  async delete(key: string): Promise<void> {
    // Sessions are not deleted - user records persist
    // This could be implemented if needed for GDPR compliance

    // Reset to idle state instead of deleting
    await updateUserState(key, 'idle', {});
  }
}

/**
 * Get or create user session
 * This helper ensures a user exists in the database before processing
 */
export async function getOrCreateSession(telegramId: string, chatId: string): Promise<SessionData> {
  const existing = await getUserByTelegramId(telegramId);

  if (existing) {
    const stateData: Record<string, unknown> = existing.info?.stateData
      ? JSON.parse(existing.info.stateData as string)
      : {};

    return {
      currentState: existing.currentState,
      stateData,
      userId: existing.id,
      chatId: existing.chatId,
    };
  }

  // Create new user
  const newUser = await createOrUpdateUser({
    telegramId,
    chatId,
    currentState: 'idle',
    stateData: {},
  });

  return {
    currentState: 'idle',
    stateData: {},
    userId: newUser.id,
    chatId: newUser.chatId,
  };
}
