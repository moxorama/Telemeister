# Telemeister

A TypeScript Telegram Bot Framework with [Grammy](https://grammy.dev), XState-powered Finite State Machines (FSM), Prisma ORM for persistence, and a type-safe builder pattern for defining conversation flows.

**Goal**: Build bot infrastructure with explicit structure that allows an LLM to build and verify bots from text descriptions, and detect inconsistencies in those descriptions.

## Features

- **NPM Package**: Install as a dependency to any bot project
- **Project Scaffolding**: `npx telemeister create-bot` creates new projects
- **Grammy Bot Framework**: Modern, TypeScript-first Telegram Bot API library
- **XState FSM**: Compact, maintainable state machines using XState's "states as data" pattern
- **Type-Safe State Transitions**: Full TypeScript support with strict transition types
- **State Machine Configuration**: JSON-based state machine definition (`bot.json`)
- **Auto-Generated Types**: TypeScript types generated from state machine config
- **State Diagram Visualization**: Mermaid diagrams (MD + PNG) auto-generated
- **Prisma ORM 7.x**: Modern database toolkit with driver adapters for SQLite and MySQL
- **Single Schema**: One Prisma schema works for both SQLite (dev) and MySQL (production)
- **Builder Pattern**: Fluent API for defining state handlers
- **Dual Mode**: Supports both Polling and Webhook modes
- **CLI Tools**: Built-in commands for managing states, transitions, and webhooks

## Quick Start

### Create a New Bot

```bash
npx telemeister create-bot my-bot
cd my-bot
npm install
```

### Environment Setup

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

### Database Setup

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

### Run the Bot

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
my-bot/
├── bot.json                 # State machine configuration (source of truth, gitignored)
├── src/
│   ├── bot-state-types.ts   # Auto-generated types (DO NOT EDIT)
│   ├── bot-diagram.md       # Auto-generated Mermaid diagram
│   ├── bot-diagram.png      # Auto-generated diagram image
│   ├── handlers/            # Your state handlers
│   │   ├── index.ts        # Handler imports
│   │   ├── idle/           # Idle state handler
│   │   ├── welcome/        # Welcome state handler
│   │   └── menu/           # Menu state handler
│   └── index.ts            # Bot entry point
├── prisma/
│   └── schema.prisma       # Database schema
├── .env                    # Environment variables (gitignored)
└── package.json
```

## State Management

### State Machine Configuration

The `bot.json` file is the source of truth for your state machine:

```json
{
  "idle": ["welcome"],
  "welcome": ["menu"],
  "menu": ["welcome", "idle"]
}
```

Each key is a state, and the array contains valid transition targets.

### CLI Commands

| Command | Description |
|---------|-------------|
| `telemeister state:add <name>` | Add a new state + create handler |
| `telemeister state:delete <name>` | Delete a state (with safety checks) |
| `telemeister state:sync` | Sync types + create missing handlers |
| `telemeister state:transition:add <from> <to>` | Add a transition |
| `telemeister state:transition:delete <from> <to>` | Delete a transition |

Or use npm scripts:
```bash
npm run state:add -- settings
npm run state:sync
```

### Adding a New State

```bash
telemeister state:add collectEmail
```

This command:
- Adds `"collectEmail": []` to `bot.json`
- Creates `src/handlers/collectEmail/index.ts` with a template
- Updates `src/handlers/index.ts` with the import
- Regenerates `src/bot-state-types.ts`
- Regenerates `src/bot-diagram.md` and `src/bot-diagram.png`

### Adding Transitions

```bash
telemeister state:transition:add collectEmail completed
```

This updates `bot.json`, regenerates types and diagrams.

### Deleting States

Safety checks prevent accidental deletion:
- Cannot delete if handler folder is non-empty
- Cannot delete if state has outgoing transitions
- Cannot delete if state has incoming transitions

```bash
# Remove transitions first
telemeister state:transition:delete collectEmail completed

# Then empty the handler folder or move files
rm -rf src/handlers/collectEmail

# Now delete the state
telemeister state:delete collectEmail
```

### Syncing

```bash
telemeister state:sync
```

This regenerates:
- `src/bot-state-types.ts` - TypeScript types from `bot.json`
- `src/bot-diagram.md` - Mermaid diagram
- `src/bot-diagram.png` - PNG image (requires mermaid-cli)
- Creates missing handler folders (never overwrites existing)

## Auto-Generated Types

The `src/bot-state-types.ts` file is auto-generated:

```typescript
// Auto-generated by state:sync - DO NOT EDIT

export type AppStates = 'idle' | 'menu' | 'welcome';

export type StateTransitions = {
  idle: 'welcome' | void;
  menu: 'idle' | 'welcome' | void;
  welcome: 'menu' | void;
};

export type IdleTransitions = Promise<StateTransitions['idle']>;
export type MenuTransitions = Promise<StateTransitions['menu']>;
export type WelcomeTransitions = Promise<StateTransitions['welcome']>;
```

## Handler API

### Strict Transition Types

Handlers use generated types for strict return type checking:

```typescript
import { appBuilder, type AppContext } from 'telemeister/core';
import type { MenuTransitions } from './bot-state-types.js';

appBuilder
  .forState('menu')
  .onEnter(async (context: AppContext): MenuTransitions => {
    await context.send('Welcome to menu!');
    // Can only return 'idle', 'welcome', or void
  })
  .onResponse(async (context: AppContext, response): MenuTransitions => {
    if (response === 'back') return 'welcome'; // ✅ Valid
    if (response === 'exit') return 'idle';    // ✅ Valid
    return 'invalid';  // ❌ Type error - not in transitions
  });
```

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

## State Diagram

Auto-generated visualizations are updated on every state/transition change:

**`src/bot-diagram.md`:**
```markdown
# Bot State Diagram

```mermaid
stateDiagram-v2
    idle --> welcome
    welcome --> menu
    menu --> welcome
    menu --> idle
```
```

**`src/bot-diagram.png`:** PNG image rendered by mermaid-cli.

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

The actual state value is stored in `context.currentState`. The `bot.json` file is the source of truth for valid states and transitions.

## Development

### Developing the Telemeister Framework

This repository contains the Telemeister framework source code.

```bash
# Clone and install
git clone <repo>
cd telemeister
npm install

# Build
npm run build

# Run CLI locally
npm run telemeister:state:add -- settings

# Or use tsx directly
npx tsx src/cli/cli.ts state:add settings
```

### Publishing

```bash
npm run build
npm version patch
npm publish
```

## Technology Stack

- **[Grammy](https://grammy.dev)**: Modern Telegram Bot API framework with excellent TypeScript support
- **[XState](https://stately.ai/docs/xstate)**: State machines for complex conversation flows
- **[Prisma ORM 7.x](https://prisma.io)**: Database toolkit with driver adapters
  - **Driver Adapters**: Required adapters for database connections (`@prisma/adapter-better-sqlite3`, `@prisma/adapter-mariadb`)
  - **ESM-Only**: Native ES module support
  - **Generated Client in Source**: Better IDE support and file watching
- **[EJS](https://ejs.co)**: Template engine for handler generation
- **[Mermaid CLI](https://github.com/mermaid-js/mermaid-cli)**: Diagram generation

## License

MIT
