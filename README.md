# Telemeister

A TypeScript Telegram Bot Boilerplate with [Grammy](https://grammy.dev), XState-powered Finite State Machines (FSM), Prisma ORM for persistence, and a type-safe builder pattern for defining conversation flows.

**Goal**: Build bot infrastructure with explicit structure that allows an LLM to build and verify bots from text descriptions, and detect inconsistencies in those descriptions.

## Features

- **Grammy Bot Framework**: Modern, TypeScript-first Telegram Bot API library
- **XState FSM**: Compact, maintainable state machines using XState's "states as data" pattern
- **Type-Safe State Transitions**: Full TypeScript support with typed state returns
- **Prisma ORM 7.x**: Modern database toolkit with driver adapters for SQLite and MySQL
- **Single Schema**: One Prisma schema works for both SQLite (dev) and MySQL (production)
- **Builder Pattern**: Fluent API for defining state handlers
- **Dual Mode**: Supports both Polling and Webhook modes
- **CLI Tools**: Built-in commands for managing states and webhooks

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```env
BOT_TOKEN=your_bot_token    # From @BotFather (https://t.me/BotFather)

# Database Configuration
# For SQLite (development):
DATABASE_URL="file:./dev.db"

# For MySQL (production):
# DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

### 3. Database Setup

**Generate Prisma Client:**
```bash
npm run db:generate
```

**Run Migrations:**
```bash
# Development (SQLite)
npm run db:migrate

# Production (MySQL) - after updating DATABASE_URL
npm run db:deploy
```

### 4. Run the Bot

**Polling mode (development):**
```bash
npm run dev
```

**Webhook mode (production):**
```bash
# Set webhook URL first
npm run webhook:set -- https://your-domain.com/webhook

# Start in webhook mode
BOT_MODE=webhook npm run dev
```

## Project Structure

```
src/
├── core/                    # Core boilerplate code
│   ├── index.ts            # Main exports
│   ├── types.ts            # Core TypeScript types
│   ├── builder.ts          # BotBuilder class
│   ├── app-states.ts       # AppStates union + typed builder
│   └── compact-machine.ts  # XState machine
├── bot/
│   ├── polling.ts          # Polling mode implementation
│   └── webhook.ts          # Webhook mode implementation
├── handlers/               # Your state handlers
│   ├── index.ts           # Handler imports
│   ├── welcome.ts         # Welcome state
│   └── menu.ts            # Menu state
├── database.ts            # Database functions (Prisma)
└── generated/prisma/      # Generated Prisma Client
prisma/
├── schema.prisma          # Database schema (single source of truth)
├── config.ts              # Prisma configuration
└── migrations/            # Migration files
```

## Database Configuration

### Switching Between SQLite and MySQL

**1. Update `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "sqlite"  // Change to "mysql" for production
}
```

**2. Update `.env`:**
```bash
# SQLite (development)
DATABASE_URL="file:./dev.db"

# MySQL (production)
DATABASE_URL="mysql://user:password@localhost:3306/dbname"
```

**3. Regenerate and migrate:**
```bash
npm run db:generate
npm run db:migrate
```

### Database Commands

```bash
npm run db:generate    # Generate Prisma Client after schema changes
npm run db:migrate     # Create and apply migrations (development)
npm run db:deploy      # Apply migrations in production
npm run db:push        # Push schema changes without migration files
npm run db:studio      # Open Prisma Studio (database GUI)
```

## Creating States

### 1. Add a New State

```bash
npm run state:add -- collectName
```

This command:
- Creates `src/handlers/collectName.ts` with a template
- Adds `"collectName"` to the `AppStates` union in `src/core/app-states.ts`
- Updates `src/handlers/index.ts` with the import

### 2. Define Handlers

Edit the generated file:

```typescript
import { appBuilder, type AppContext } from "../core/index.js";

appBuilder
  .forState("collectName")
  .onEnter(async (context: AppContext) => {
    await context.send("What's your name?");
  })
  .onResponse(async (context: AppContext, response) => {
    const name = response.trim();
    
    if (name.length < 2) {
      await context.send("Name must be at least 2 characters.");
      return; // Stay in current state
    }
    
    context.setData("name", name);
    return "menu"; // ✅ Type-safe: only AppStates allowed
  });
```

### 3. Centralized State Types

All states are defined in `src/core/app-states.ts`:

```typescript
export type AppStates =
  | "idle"
  | "welcome"
  | "menu"
  | "collectName"  // Added automatically by npm run state:add
  | "completed";
```

## Handler API

### Context Methods

```typescript
interface BotHandlerContext<TState> {
  // User info
  userId: number;
  telegramId: number;
  chatId: number;
  currentState: TState;

  // Messaging
  send: (text: string) => Promise<unknown>;

  // Data persistence (per-user)
  setData: <T>(key: string, value: T) => void;
  getData: <T>(key: string) => T | undefined;

  // State transition
  transition: (toState: TState) => Promise<void>;
}
```

### Handler Types

```typescript
// Called when entering a state
.onEnter(async (context) => {
  await context.send("Welcome!");
  // Optionally return a state for immediate transition
  return "anotherState";
})

// Called when user sends a message
.onResponse(async (context, response) => {
  // Return state name to transition, or void/undefined to stay
  if (response === "yes") return "confirmed";
  return "cancelled";
})
```

## Type Safety

### Full Type Safety with AppStates

```typescript
import { appBuilder, type AppContext } from "../core/index.js";

appBuilder
  .forState("welcome")
  .onEnter(async (context: AppContext) => {
    // context.currentState is typed as AppStates
    // return values are checked against AppStates
    return "menu";     // ✅ Valid
    return "invalid";  // ❌ Type error
  });
```

### Untyped Option (Quick Prototyping)

```typescript
import { BotBuilder } from "../core/index.js";

const untypedBuilder = new BotBuilder();
untypedBuilder.forState("anyState").onEnter(...); // No type checking
```

## Webhook Commands

```bash
# Set webhook URL
npm run webhook:set -- https://your-domain.com/webhook

# Check webhook info
npm run webhook:info

# Delete webhook (switch back to polling)
npm run webhook:delete
```

## Database Schema

Users are persisted with:
- `telegramId` - Telegram user ID
- `chatId` - Telegram chat ID
- `currentState` - Current FSM state
- `stateData` - JSON data storage for user context (in separate `userInfo` relation)

### Prisma Schema

```prisma
model User {
  id           Int       @id @default(autoincrement())
  telegramId   Int       @unique
  chatId       Int
  currentState String    @default("idle")
  updatedAt    DateTime  @updatedAt
  info         UserInfo?

  @@index([currentState])
}

model UserInfo {
  id        Int    @id @default(autoincrement())
  userId    Int    @unique
  user      User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  stateData String @default("{}")
}
```

## Architecture

### State Persistence Flow

```
User sends message
       ↓
Load user from DB (by telegramId)
       ↓
Execute onResponse for current state
       ↓
Handler returns nextState (or void)
       ↓
Update DB with new state
       ↓
Execute onEnter for new state
       ↓
Send prompt to user
```

### Compact FSM Pattern

Instead of defining every state in XState:

```typescript
// Traditional - verbose
states: {
  idle: { on: { START: 'welcome' } },
  welcome: { on: { NEXT: 'menu' } },
  // ... every state
}

// Telemeister - compact
states: {
  active: {
    on: {
      TRANSITION: {
        actions: assign({ currentState: ({ event }) => event.toState }),
        target: 'active',
        reenter: true, // Triggers onEnter
      }
    }
  }
}
```

The actual state value is stored in `context.currentState`. The builder pattern is the source of truth for valid states.

## Technology Stack

- **[Grammy](https://grammy.dev)**: Modern Telegram Bot API framework with excellent TypeScript support
- **[XState](https://stately.ai/docs/xstate)**: State machines for complex conversation flows
- **[Prisma ORM 7.x](https://prisma.io)**: Database toolkit with driver adapters
  - **Driver Adapters**: Required adapters for database connections (`@prisma/adapter-better-sqlite3`, `@prisma/adapter-mariadb`)
  - **ESM-Only**: Native ES module support
  - **Generated Client in Source**: Better IDE support and file watching

## License

MIT
