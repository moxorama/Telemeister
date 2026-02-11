import { PrismaClient } from "@prisma/client";
import type { User, UserInfo } from "@prisma/client";

/**
 * Database connection using Prisma ORM.
 *
 * Prisma provides a database-agnostic layer that works with
 * SQLite, PostgreSQL, MySQL, and other databases.
 * Simply change the DATABASE_URL to switch databases.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Get user by Telegram ID (with info)
 */
export async function getUserByTelegramId(
  telegramId: number,
): Promise<(User & { info: UserInfo | null }) | null> {
  return prisma.user.findUnique({
    where: { telegramId },
    include: { info: true },
  });
}

/**
 * Create or update user
 */
export async function createOrUpdateUser(data: {
  telegramId: number;
  chatId: number;
  currentState?: string;
  stateData?: Record<string, unknown>;
}): Promise<User & { info: UserInfo | null }> {
  const existingUser = await prisma.user.findUnique({
    where: { telegramId: data.telegramId },
    include: { info: true },
  });

  if (existingUser) {
    // Update existing user
    const updated = await prisma.user.update({
      where: { telegramId: data.telegramId },
      data: {
        chatId: data.chatId,
        ...(data.currentState && { currentState: data.currentState }),
        ...(data.stateData && {
          info: {
            upsert: {
              create: { stateData: JSON.stringify(data.stateData) },
              update: { stateData: JSON.stringify(data.stateData) },
            },
          },
        }),
      },
      include: { info: true },
    });
    return updated;
  } else {
    // Create new user with info
    const created = await prisma.user.create({
      data: {
        telegramId: data.telegramId,
        chatId: data.chatId,
        currentState: data.currentState || "idle",
        info: {
          create: { stateData: JSON.stringify(data.stateData || {}) },
        },
      },
      include: { info: true },
    });
    return created;
  }
}

/**
 * Update user state
 */
export async function updateUserState(
  telegramId: number,
  currentState: string,
  stateData?: Record<string, unknown>,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { info: true },
  });

  if (!user) {
    throw new Error(`User with telegramId ${telegramId} not found`);
  }

  await prisma.user.update({
    where: { telegramId },
    data: {
      currentState,
      ...(stateData && {
        info: {
          upsert: {
            create: { stateData: JSON.stringify(stateData) },
            update: { stateData: JSON.stringify(stateData) },
          },
        },
      }),
    },
  });
}

export type { User, UserInfo };
