# Telemeister - LLM Context

This file provides context for LLMs working with this codebase.

## Project Overview

Telemeister is a TypeScript Telegram Bot boilerplate using Grammy, XState, and Prisma. It implements a Finite State Machine (FSM) pattern with type-safe state transitions.

## Architecture Principles

### Source of Truth

**`src/bot.json`** is the single source of truth for the state machine:

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
import type { MenuTransitions } from '../../bot-state-types.js';

// Return type is enforced
.onResponse(async (context, response): MenuTransitions => {
  return 'welcome'; // Only valid transitions allowed
})
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run state:add -- <name>` | Add new state + handler template |
| `npm run state:delete -- <name>` | Delete state (with safety checks) |
| `npm run state:sync` | Regenerate types + diagrams |
| `npm run state:transition:add -- <from> <to>` | Add transition |
| `npm run state:transition:delete -- <from> <to>` | Remove transition |
| `npm run lint` | ESLint check |
| `npm run build` | TypeScript compile |

## File Structure

```
src/
├── bot.json              # STATE MACHINE CONFIG (edit this)
├── bot-state-types.ts    # GENERATED TYPES (do not edit)
├── bot-diagram.md        # GENERATED DIAGRAM (do not edit)
├── bot-diagram.png       # GENERATED IMAGE (do not edit)
├── core/                 # Framework code (rarely edit)
│   ├── index.ts         # Exports
│   ├── types.ts         # Core types
│   ├── builder.ts       # BotBuilder class
│   └── compact-machine.ts
├── handlers/             # STATE HANDLERS (edit these)
│   ├── index.ts         # Imports all handlers
│   └── <state>/         # One folder per state
│       └── index.ts     # Handler implementation
├── bot/                  # Bot modes (rarely edit)
│   ├── polling.ts
│   └── webhook.ts
└── database.ts          # Prisma helpers

scripts/
├── state.ts             # State management CLI
└── templates/
    └── handler.ts.ejs   # Handler template (EJS)
```

## Handler Pattern

All handlers follow this structure:

```typescript
import { appBuilder, type AppContext } from '../../core/index.js';
import type { StateNameTransitions } from '../../bot-state-types.js';

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

## Working with States

### To add a new state:
1. Run `npm run state:add -- <name>`
2. Edit the generated handler in `src/handlers/<name>/index.ts`
3. Add transitions: `npm run state:transition:add -- <name> <target>`

### To modify existing state:
1. Edit handler in `src/handlers/<name>/index.ts`
2. If adding new transition targets, update `src/bot.json` first:
   - `npm run state:transition:add -- <from> <to>`
   - Or edit `bot.json` directly, then `npm run state:sync`

### To delete a state:
1. Remove all transitions involving that state
2. Remove handler folder contents
3. Run `npm run state:delete -- <name>`

## Conventions

### Naming
- States: camelCase (e.g., `collectEmail`, `mainMenu`)
- Handlers: one folder per state, `index.ts` inside
- Types: `<State>Transitions` (e.g., `MenuTransitions`)

### Code Style
- ES modules (`.js` extension in imports)
- No comments unless explicitly requested
- Async handlers return `Promise<State | void>`

### Imports
```typescript
// Core imports (always from core/index.js)
import { appBuilder, type AppContext } from '../../core/index.js';

// Type imports (from bot-state-types.ts)
import type { MenuTransitions } from '../../bot-state-types.js';
```

## Common Tasks

### Add a new conversation flow:
1. Add states: `npm run state:add -- state1`, `npm run state:add -- state2`
2. Add transitions: `npm run state:transition:add -- state1 state2`
3. Implement handlers in `src/handlers/state1/index.ts`, etc.

### Modify existing flow:
1. Edit `src/bot.json` to add/remove transitions
2. Run `npm run state:sync` to regenerate types
3. Update handlers to match new transitions

### Debug type errors:
- Types are generated from `bot.json`
- If handler returns invalid state, check that state is in transition list
- Run `npm run state:sync` to regenerate types

## Database

Prisma with SQLite (dev) / MySQL (prod).

Schema in `prisma/schema.prisma`.

Commands:
- `npm run db:generate` - Generate client
- `npm run db:migrate` - Create migration
- `npm run db:studio` - GUI

## Verification

After making changes:
```bash
npm run lint      # Check code style
npm run build     # Type check
npm run state:sync # Regenerate if bot.json changed
```
