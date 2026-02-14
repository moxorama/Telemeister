import { appBuilder, type AppContext } from '../../core/index.js';
import type { IdleTransitions } from '../../bot-state-types.js';

/**
 * idle State Handler
 *
 * This file defines the handlers for the "idle" state.
 * The idle state is the default/initial state for users.
 */

appBuilder
  .forState('idle')
  .onEnter(async (_context: AppContext): IdleTransitions => {
    return 'welcome';
  })
  .onResponse(async (context: AppContext, response): IdleTransitions => {
    const trimmed = response.trim();

    if (trimmed === '/start' || trimmed.toLowerCase() === 'start') {
      return 'welcome';
    }

    await context.send("Let's get started!");
    return 'welcome';
  });

console.log('✅ State handler registered: idle');
