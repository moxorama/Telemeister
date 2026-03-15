/**
 * Grammy Session Adapter
 *
 * This adapter integrates Grammy's session system with the database,
 * allowing user state to persist across restarts.
 */

import type { StorageAdapter } from 'grammy';
import type { DatabaseAdapter, SessionData, SessionResult } from './types.js';

// Re-export types for convenience
export type { SessionData, SessionResult };

/**
 * Session storage adapter for Grammy using injected database
 */
export class SessionStorageAdapter implements StorageAdapter<SessionData> {
  private database: DatabaseAdapter;

  constructor(database: DatabaseAdapter) {
    this.database = database;
  }

  /**
   * Read session data from database
   * @param key - Telegram user ID (as string)
   */
  async read(key: string): Promise<SessionData | undefined> {
    const user = await this.database.getUserByTelegramId(key);
    if (!user) return undefined;

    const stateData: Record<string, unknown> = user.info?.stateData
      ? JSON.parse(user.info.stateData)
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
    await this.database.updateUserState(key, value.currentState, value.stateData);
  }

  /**
   * Delete session data (resets to idle state)
   * @param key - Telegram user ID (as string)
   */
  async delete(key: string): Promise<void> {
    // Reset to idle state instead of deleting
    await this.database.updateUserState(key, 'idle', {});
  }
}

/**
 * Get or create user session
 * This helper ensures a user exists in the database before processing
 */
export async function getOrCreateSession(
  telegramId: string,
  username: string | undefined,
  chatId: string,
  database: DatabaseAdapter
): Promise<SessionResult> {
  const existing = await database.getUserByTelegramId(telegramId);

  if (existing) {
    const stateData: Record<string, unknown> = existing.info?.stateData
      ? JSON.parse(existing.info.stateData)
      : {};

    // Debug logging
    console.log('[Telemeister Debug] getOrCreateSession:', {
      telegramId,
      usernameFromCtx: username,
      usernameInDb: existing.username,
      willUpdate: username !== undefined && existing.username !== username,
    });

    // Update username if it has changed
    if (username !== undefined && existing.username !== username) {
      console.log('[Telemeister Debug] Updating username from', existing.username, 'to', username);
      await database.createOrUpdateUser({
        telegramId,
        username,
        chatId,
        currentState: existing.currentState,
        stateData,
      });
    }

    return {
      session: {
        currentState: existing.currentState,
        stateData,
        userId: existing.id,
        chatId: existing.chatId,
      },
      isNew: false,
    };
  }

  // Create new user
  const newUser = await database.createOrUpdateUser({
    telegramId,
    username,
    chatId,
    currentState: 'idle',
    stateData: {},
  });

  return {
    session: {
      currentState: 'idle',
      stateData: {},
      userId: newUser.id,
      chatId: newUser.chatId,
    },
    isNew: true,
  };
}
