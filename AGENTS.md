# Telemeister - LLM Context

This file provides context for LLMs working with this codebase.

## Project Overview

**This is the Telemeister FRAMEWORK repository** - the npm package that provides:
- Core framework code (`src/core/`)
- CLI tooling (`src/cli/`)
- Handler templates (`templates/`)

Users install `telemeister` as an npm dependency in their bot projects.

## Architecture Principles

### Package Structure

```
telemeister/ (this repo)
├── src/
│   ├── cli/                # CLI commands
│   │   ├── cli.ts         # Main CLI dispatcher
│   │   ├── state-manager.ts # State management
│   │   └── create-bot.ts  # Project scaffolding
│   ├── core/              # Framework exports
│   │   ├── index.ts       # Public API exports
│   │   ├── builder.ts     # BotBuilder class
│   │   ├── types.ts       # Core types
│   │   ├── compact-machine.ts
│   │   └── bot/           # Bot runtime (polling/webhook)
│   │       ├── index.ts   # Bot exports
│   │       ├── polling.ts # Polling mode
│   │       ├── webhook.ts # Webhook mode
│   │       ├── session.ts # Session management
│   │       └── types.ts   # Database adapter types
│   ├── templates/         # EJS templates for scaffolding
│   │   ├── handler.ts.ejs        # Generic handler template
│   │   ├── bot.json.ejs          # Default bot.json
│   │   ├── package.json.ejs      # Package.json template
│   │   ├── README.md.ejs         # README template
│   │   ├── tsconfig.json.ejs     # TypeScript config
│   │   ├── index.ts.ejs          # Bot entry point
│   │   ├── gitignore.ejs         # Git ignore rules
│   │   ├── env.example.ejs       # Environment template
│   │   ├── prisma.config.ts.ejs  # Prisma config
│   │   ├── prisma-schema.prisma.ejs # Prisma schema
│   │   ├── database.ts.ejs       # Database adapter implementation
│   │   └── database-example.ts.ejs # Database helper examples
│   └── index.ts           # Package main export
├── bin/
│   └── telemeister.js     # CLI entry point
└── package.json
```

### Template System

All bot scaffolding uses EJS templates in `src/templates/`:

- Static templates (`.ejs` without variables): `gitignore.ejs`, `tsconfig.json.ejs`, `env.example.ejs`, `prisma.config.ts.ejs`, `prisma-schema.prisma.ejs`, `index.ts.ejs`, `database.ts.ejs`
- Dynamic templates: `handler.ts.ejs` (uses `stateName`, `transitionStates`, `pascalCase`), `package.json.ejs` (uses `botName`), `README.md.ejs` (uses `botName`)
- Example templates (not copied to projects): `database-example.ts.ejs`
- `bot.json.ejs`: Default state machine configuration

Templates are loaded via `loadTemplate()` in `create-bot.ts`.

### Published Package

When published, users import from `telemeister/core`:

```typescript
import { appBuilder, type AppContext } from 'telemeister/core';
import type { MenuTransitions } from './bot-state-types.js';
```

Additional exports available at `telemeister/core/bot`:

```typescript
import { startPollingMode, startWebhookMode } from 'telemeister/core/bot';
import type { DatabaseAdapter, UserData } from 'telemeister/core/bot';
```

### Source of Truth (User's bot.json)

In user projects, `bot.json` is the single source of truth:

```json
{
  "stateName": ["targetState1", "targetState2"]
}
```

- Keys are states
- Values are arrays of valid transition targets

**Never edit generated files directly:**
- `src/bot-state-types.ts` - Generated from `bot.json`
- `src/bot-diagram.md` - Generated from `bot.json`
- `src/bot-diagram.png` - Generated from `bot.json`

### Type System

States are strictly typed per-handler:

```typescript
// Each handler imports its specific transition type
import type { MenuTransitions } from './bot-state-types.js';

// Return type is enforced
.onResponse(async (context, response): MenuTransitions => {
  return 'welcome'; // Only valid transitions allowed
})
```

## Commands (This Repo)

When developing Telemeister itself:

| Command | Purpose |
|---------|---------|
| `npm run telemeister:state:add -- <name>` | Test state:add CLI |
| `npm run telemeister:state:delete -- <name>` | Test state:delete CLI |
| `npm run telemeister:state:sync` | Test state:sync CLI |
| `npm run telemeister:state:transition:add -- <from> <to>` | Test transition:add CLI |
| `npm run telemeister:state:transition:delete -- <from> <to>` | Test transition:delete CLI |
| `npm run telemeister:create-bot -- <name>` | Test create-bot scaffolding |
| `npm run build` | Compile TypeScript |
| `npm run lint` | ESLint check |

Commands in USER projects (via `telemeister` CLI):
- `telemeister state:add <name>`
- `telemeister state:delete <name>`
- `telemeister state:sync`
- `telemeister state:transition:add <from> <to>`
- `telemeister state:transition:delete <from> <to>`
- `telemeister create-bot <name>`

## File Structure (This Repo)

```
src/
├── cli/                  # CLI IMPLEMENTATION
│   ├── index.ts         # CLI exports
│   ├── cli.ts           # Command dispatcher
│   ├── state-manager.ts # State management logic
│   └── create-bot.ts    # Project scaffolding (uses templates/)
├── core/                # FRAMEWORK CODE
│   ├── index.ts         # Exports for telemeister/core
│   ├── types.ts         # Core types
│   ├── builder.ts       # BotBuilder class
│   ├── compact-machine.ts
│   └── bot/             # Bot runtime (polling/webhook)
│       ├── index.ts     # Bot exports
│       ├── polling.ts   # Polling mode
│       ├── webhook.ts   # Webhook mode
│       ├── session.ts   # Session management
│       └── types.ts     # Database adapter types
├── templates/           # EJS TEMPLATES
│   ├── handler.ts.ejs   # Generic handler template
│   ├── bot.json.ejs     # Default bot.json
│   ├── package.json.ejs # Package.json template
│   ├── README.md.ejs    # README template
│   ├── tsconfig.json.ejs # TypeScript config
│   ├── index.ts.ejs     # Bot entry point
│   ├── gitignore.ejs    # Git ignore rules
│   ├── env.example.ejs  # Environment template
│   ├── prisma.config.ts.ejs # Prisma config
│   ├── prisma-schema.prisma.ejs # Prisma schema
│   ├── database.ts.ejs  # Database adapter implementation
│   └── database-example.ts.ejs # Database helper examples
├── config.ts            # Configuration
└── index.ts             # Package main export
```

## Handler Template System

### Single Template for All Handlers

All handlers are generated from a single template: `src/templates/handler.ts.ejs`

This template is used by:
- `create-bot` command - generates initial handlers from `bot.json`
- `state:add` command - generates handler for new states
- `state:sync` command - creates missing handlers

Template variables:
- `stateName` - The state name (e.g., 'welcome')
- `transitionStates` - Array of valid transition targets
- `pascalCase` - Helper function to convert to PascalCase

### Handler Generation Flow

**When running `create-bot <name>`:**
1. Creates project directory structure
2. Copies static templates (gitignore, tsconfig, etc.)
3. Renders dynamic templates with `botName` variable
4. Writes `bot.json` with default states
5. Calls `stateSync()` to generate handlers from `bot.json`

**When running `state:sync` in a bot project:**
1. Reads `bot.json` as source of truth
2. Generates `src/bot-state-types.ts` with transition types
3. Creates missing handler files using `handler.ts.ejs`
4. Updates `src/handlers/index.ts` with imports
5. Generates Mermaid diagram and PNG visualization

## Handler Pattern (User Projects)

All handlers follow this structure:

```typescript
import { appBuilder, type AppContext } from 'telemeister/core';
import type { StateNameTransitions } from './bot-state-types.js';

appBuilder
  .forState('stateName')
  .onEnter(async (context: AppContext): StateNameTransitions => {
    // Called when entering state
    // Return a state to immediately transition
  })
  .onResponse(async (context: AppContext, response): StateNameTransitions => {
    // Called on user message
    // Return a state to transition, or void to stay
  });

console.log('✅ State handler registered: stateName');
```

## Context API

```typescript
interface BotHandlerContext<TState> {
  userId: number;                              // DB user ID
  telegramId: number;                          // Telegram user ID
  chatId: number;                              // Telegram chat ID
  currentState: TState;                        // Current state name
  send: (text: string) => Promise<unknown>;    // Send message
  setData: <T>(key: string, value: T) => void; // Store data
  getData: <T>(key: string) => T | undefined;  // Retrieve data
  transition: (toState: TState) => Promise<void>; // Manual transition
}
```

## Working with States (CLI)

### In user projects:

**Add a new state:**
1. Run `telemeister state:add <name>`
2. Edit the generated handler in `src/handlers/<name>/index.ts`
3. Add transitions: `telemeister state:transition:add <name> <target>`

**Modify existing state:**
1. Edit handler in `src/handlers/<name>/index.ts`
2. If adding new transition targets, update `bot.json` first:
   - `telemeister state:transition:add <from> <to>`
   - Or edit `bot.json` directly, then `telemeister state:sync`

**Delete a state:**
1. Remove all transitions involving that state
2. Remove handler folder contents
3. Run `telemeister state:delete <name>`

**Create a new bot:**
1. Run `telemeister create-bot <name>` in any directory
2. Internally, it:
   - Creates directory structure
   - Copies static templates (.gitignore, tsconfig.json, etc.)
   - Writes bot.json with default states
   - Calls `state:sync` to generate handlers and types from bot.json

### Bot Generation Details

The `create-bot` command is orchestrated in `create-bot.ts` but delegates handler generation to `state-manager.ts`. This ensures consistency between creating a new bot and syncing an existing one.

Template categories:
- **Static**: Copied as-is (gitignore, tsconfig.json, env.example, prisma.config.ts, prisma-schema.prisma, index.ts, database.ts.ejs)
- **Dynamic**: Rendered with EJS (README.md with botName, package.json with botName, handlers with stateName/transitions)
- **Examples**: Not copied to projects (database-example.ts.ejs)

## Conventions

### Naming
- States: camelCase (e.g., `collectEmail`, `mainMenu`)
- Handlers: one folder per state, `index.ts` inside
- Types: `<State>Transitions` (e.g., `MenuTransitions`)

### Code Style
- ES modules (`.js` extension in imports)
- No comments unless explicitly requested
- Async handlers return `Promise<State | void>`

### Imports (User Projects)
```typescript
// Core imports (from telemeister package)
import { appBuilder, type AppContext } from 'telemeister/core';

// Type imports (from generated file)
import type { MenuTransitions } from './bot-state-types.js';
```

### CLI Paths
The CLI works from `process.cwd()` - the user's project directory, not the telemeister package directory.

```typescript
// In src/cli/state-manager.ts
const cwd = process.cwd();
const botJsonPath = path.join(cwd, 'bot.json');
const handlersDir = path.join(cwd, 'src', 'handlers');
```

## Common Tasks

### Add a new conversation flow to user bot:
1. Add states: `telemeister state:add state1`, `telemeister state:add state2`
2. Add transitions: `telemeister state:transition:add state1 state2`
3. Implement handlers in `src/handlers/state1/index.ts`, etc.

### Modify existing flow:
1. Edit `bot.json` to add/remove transitions
2. Run `telemeister state:sync` to regenerate types
3. Update handlers to match new transitions

### Debug type errors:
- Types are generated from `bot.json`
- If handler returns invalid state, check that state is in transition list
- Run `telemeister state:sync` to regenerate types

## Database

Prisma with SQLite (dev) / MySQL (prod).

Schema in `prisma/schema.prisma`.

Commands:
- `npm run db:generate` - Generate client
- `npm run db:migrate` - Create migration
- `npm run db:studio` - GUI

## Development Workflow

### Testing CLI locally:

```bash
# Build first
npm run build

# Test create-bot
npm run telemeister:create-bot -- test-bot
cd test-bot

# Test state commands
npm run telemeister:state:add -- settings
```

### Linking Framework for Local Testing:

When generating a bot for testing with the local (unpublished) framework, link the dependency instead of using npm registry:

```bash
# After creating the bot
cd test-bot

# Link to local telemeister framework
npm install /path/to/telemeister

# Or with relative path
npm install ../../Personal/Telemeister
```

**Important:** The bot reads from `telemeister/dist/`, so always rebuild the framework after changes:
```bash
cd /path/to/telemeister
npm run build
```

To restore the published npm version later:
```bash
npm uninstall telemeister
npm install telemeister
```

### Publishing:

```bash
# Build
npm run build

# Update version
npm version patch

# Publish
npm publish
```

## Verification

After making changes to Telemeister:
```bash
npm run lint      # Check code style
npm run build     # Type check
npm test          # If tests exist
```

## Important Notes

1. **This repo is the FRAMEWORK** - users install it as a dependency
2. **CLI uses process.cwd()** - always works from user's project directory
3. **bot.json is in user's project** - not in this framework repo
4. **Templates are shipped** - located at `src/templates/` and copied to `dist/templates/` on build
5. **Core exports** - `telemeister/core` points to `dist/core/index.js`
6. **Bot runtime exports** - `telemeister/core/bot` points to `dist/core/bot/index.js`
7. **Single handler template** - All handlers use `handler.ts.ejs`, no separate templates needed
8. **Database adapter** - User implements `DatabaseAdapter` interface from `telemeister/core/bot` in their `src/lib/database.ts`
