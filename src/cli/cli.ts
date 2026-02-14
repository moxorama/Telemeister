#!/usr/bin/env node

/**
 * Telemeister CLI
 *
 * Available commands:
 *   create-bot <name>                    - Create a new bot project
 *   state:add <name>                     - Add a new state + create handler
 *   state:delete <name>                  - Delete a state (with safety checks)
 *   state:sync                           - Sync types and create missing handlers
 *   state:transition:add <from> <to>     - Add a transition
 *   state:transition:delete <from> <to>  - Delete a transition
 */

import {
  stateAdd,
  stateDelete,
  stateSync,
  transitionAdd,
  transitionDelete,
} from './state-manager.js';
import { createBot } from './create-bot.js';

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

export async function runCLI(): Promise<void> {
  switch (command) {
    case 'create-bot':
      await createBot(arg1);
      break;
    case 'state:add':
      await stateAdd(arg1);
      break;
    case 'state:delete':
      await stateDelete(arg1);
      break;
    case 'state:sync':
      await stateSync();
      break;
    case 'state:transition:add':
      await transitionAdd(arg1, arg2);
      break;
    case 'state:transition:delete':
      await transitionDelete(arg1, arg2);
      break;
    default:
      console.error('❌ Unknown command:', command);
      console.error('');
      console.error('Available commands:');
      console.error('  create-bot <name>                    - Create a new bot project');
      console.error('  state:add <name>                     - Add a new state + create handler');
      console.error('  state:delete <name>                  - Delete a state (with safety checks)');
      console.error(
        '  state:sync                           - Sync types and create missing handlers'
      );
      console.error('  state:transition:add <from> <to>     - Add a transition');
      console.error('  state:transition:delete <from> <to>  - Delete a transition');
      process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}
