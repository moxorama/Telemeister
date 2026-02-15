/**
 * Database Adapter Interface
 *
 * Framework requires these methods to manage user sessions and state.
 * User implements this interface in their database.ts file.
 */

/**
 * User data returned from database
 */
export interface UserData {
  id: number;
  telegramId: string;
  chatId: string;
  currentState: string;
  info?: {
    stateData?: string;
  } | null;
}

/**
 * Database adapter interface for framework
 */
export interface DatabaseAdapter {
  /**
   * Get user by Telegram ID
   * @param telegramId - Telegram user ID
   * @returns User data or null if not found
   */
  getUserByTelegramId(telegramId: string): Promise<UserData | null>;

  /**
   * Create or update a user
   * @param data - User data to create or update
   * @returns Created/updated user data
   */
  createOrUpdateUser(data: {
    telegramId: string;
    chatId: string;
    currentState?: string;
    stateData?: Record<string, unknown>;
  }): Promise<UserData>;

  /**
   * Update user state and optional state data
   * @param telegramId - Telegram user ID
   * @param currentState - New state
   * @param stateData - Optional state data to save
   */
  updateUserState(
    telegramId: string,
    currentState: string,
    stateData?: Record<string, unknown>
  ): Promise<void>;
}

/**
 * Session data structure
 */
export interface SessionData {
  currentState: string;
  stateData: Record<string, unknown>;
  userId?: number;
  chatId?: string;
}

/**
 * Result from getOrCreateSession
 */
export interface SessionResult {
  session: SessionData;
  isNew: boolean;
}
