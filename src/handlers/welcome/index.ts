import { appBuilder, type AppContext } from '../../core/index.js';
import type { WelcomeTransitions } from '../../bot-state-types.js';

/**
 * welcome State Handler
 *
 * This file defines the handlers for the "welcome" state.
 */

appBuilder
  .forState('welcome')
  .onEnter(async (context: AppContext): WelcomeTransitions => {
    await context.send("👋 Welcome! What's your name?");
  })
  .onResponse(async (context: AppContext, response): WelcomeTransitions => {
    const name = response.trim();

    if (name.length < 2) {
      await context.send('Please enter a valid name (at least 2 characters).');
      return;
    }

    context.setData('name', name);

    return 'menu';
  });

console.log('✅ State handler registered: welcome');
