/**
 * Database Entry Point
 *
 * Uses Prisma ORM 7.x with driver adapters for database operations.
 *
 * Switch between SQLite and MySQL by changing DATABASE_URL in .env:
 * - SQLite: DATABASE_URL="file:./dev.db"
 * - MySQL: DATABASE_URL="mysql://user:password@localhost:3306/dbname"
 *
 * Note: When switching providers, update the provider in prisma/schema.prisma:
 * - SQLite: provider = "sqlite"
 * - MySQL: provider = "mysql"
 */

import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, User, UserInfo } from "./generated/prisma/client.js";

// Determine database provider from URL
const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const isMysql = databaseUrl.startsWith("mysql:");

// Create adapter based on database type
// For now, SQLite is fully supported. MySQL adapter requires additional setup.
const adapter = isMysql
  ? (() => {
      throw new Error(
        "MySQL adapter not yet configured. Please configure @prisma/adapter-mariadb in src/database.ts",
      );
    })()
  : new PrismaBetterSqlite3({
      url: databaseUrl,
    });

// Prisma client instance with adapter
const prisma = new PrismaClient({ adapter });

// Re-export types from Prisma
export type { User, UserInfo };

// Type for user with included info relation
export type UserWithInfo = User & {
  info: UserInfo | null;
};

/**
 * Get user by Telegram ID with joined user info
 */
export async function getUserByTelegramId(
  telegramId: number,
): Promise<UserWithInfo | null> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { info: true },
  });

  return user;
}

/**
 * Create or update a user
 */
export async function createOrUpdateUser(data: {
  telegramId: number;
  chatId: number;
  currentState?: string;
  stateData?: Record<string, unknown>;
}): Promise<UserWithInfo> {
  const existingUser = await getUserByTelegramId(data.telegramId);

  if (existingUser) {
    // Update existing user
    const updatedUser = await prisma.user.update({
      where: { telegramId: data.telegramId },
      data: {
        chatId: data.chatId,
        ...(data.currentState && { currentState: data.currentState }),
      },
      include: { info: true },
    });

    // Update or create user info if stateData provided
    if (data.stateData) {
      await prisma.userInfo.upsert({
        where: { userId: updatedUser.id },
        create: {
          userId: updatedUser.id,
          stateData: JSON.stringify(data.stateData),
        },
        update: {
          stateData: JSON.stringify(data.stateData),
        },
      });

      // Return updated user with info
      return (await getUserByTelegramId(data.telegramId))!;
    }

    return updatedUser;
  } else {
    // Create new user with info
    const newUser = await prisma.user.create({
      data: {
        telegramId: data.telegramId,
        chatId: data.chatId,
        currentState: data.currentState || "idle",
        info: {
          create: {
            stateData: JSON.stringify(data.stateData || {}),
          },
        },
      },
      include: { info: true },
    });

    return newUser;
  }
}

/**
 * Update user state and optional state data
 */
export async function updateUserState(
  telegramId: number,
  currentState: string,
  stateData?: Record<string, unknown>,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  });
  if (!user) {
    throw new Error(`User with telegramId ${telegramId} not found`);
  }

  // Update user state
  await prisma.user.update({
    where: { telegramId },
    data: { currentState },
  });

  // Update state data if provided
  if (stateData) {
    await prisma.userInfo.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stateData: JSON.stringify(stateData),
      },
      update: {
        stateData: JSON.stringify(stateData),
      },
    });
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
}

export { prisma };
