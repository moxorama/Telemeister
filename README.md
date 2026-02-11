# Telemeister

A TypeScript Telegram Bot Boilerplate with XState-powered Finite State Machines (FSM), Prisma ORM for persistence, and a type-safe builder pattern for defining conversation flows.

## Features

- **XState FSM**: Compact, maintainable state machines using XState's "states as data" pattern
- **Type-Safe State Transitions**: Full TypeScript support with typed state returns
- **Prisma ORM**: Database-agnostic persistence with SQLite (easily switchable to PostgreSQL/MySQL)
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
API_ID=your_api_id          # From https://my.telegram.org/apps
API_HASH=your_api_hash      # From https://my.telegram.org/apps
BOT_TOKEN=your_bot_token    # From @BotFather

# Database (Prisma)
DATABASE_URL="file:./prisma/dev.db"  # SQLite (default)
# DATABASE_URL="postgresql://user:password@localhost:5432/telemeister"  # PostgreSQL
# DATABASE_URL="mysql://user:password@localhost:3306/telemeister"      # MySQL
```

### 3. Database Setup

```bash
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database (SQLite)
```

For production with migrations:
```bash
npm run db:generate -- init   # Create initial migration
npm run db:migrate            # Deploy migrations
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
└── database/              # Database layer
    └── index.ts           # Prisma client and queries
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
import { appBuilder, type AppContext } from "../core";

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
import { appBuilder, type AppContext } from "../core";

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
import { BotBuilder } from "../core";

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
- `stateData` - JSON data storage for user context (in separate `user_info` table)

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

## License

MIT
