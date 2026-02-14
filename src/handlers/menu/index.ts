import { appBuilder, type AppContext } from '../../core/index.js';
import type { MenuTransitions } from '../../bot-state-types.js';

/**
 * menu State Handler
 *
 * This file defines the handlers for the "menu" state.
 */

appBuilder
  .forState('menu')
  .onEnter(async (context: AppContext): MenuTransitions => {
    const name = context.getData<string>('name') || 'User';
    await context.send(
      `📋 Menu for ${name}:\n\n` +
        '1. Show name\n' +
        '2. Go to welcome\n' +
        '3. Exit\n\n' +
        'Type 1, 2, or 3'
    );
  })
  .onResponse(async (context: AppContext, response): MenuTransitions => {
    const choice = response.trim();

    switch (choice) {
      case '1': {
        const name = context.getData<string>('name');
        await context.send(`Your name is: ${name}`);
        return;
      }
      case '2':
        return 'welcome';
      case '3':
        await context.send('👋 Goodbye!');
        return 'idle';
      default:
        await context.send('Please select 1, 2, or 3.');
    }
  });

console.log('✅ State handler registered: menu');
