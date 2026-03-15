import { appBuilder, type AppContext } from 'telemeister/core';
import type { WelcomeTransitions } from '../../bot-state-types.js';

/**
 * welcome State Handler
 *
 * This file defines the handlers for the "welcome" state.
 */

appBuilder
  .forState('welcome')

  .onEnter(async (context: AppContext): WelcomeTransitions => {
    // Called when user enters this state
    // Can optionally return a state name to immediately transition

    // Access Grammy context via context.ctx
    // See Grammy docs: https://grammy.dev/guide/context
    await context.reply('Hello from welcome state!');

    // === INLINE KEYBOARD EXAMPLE ===
    // import { InlineKeyboard } from 'grammy';
    // const keyboard = new InlineKeyboard()
    //   .text('Button 1', 'btn1')
    //   .text('Button 2', 'btn2');
    // await context.reply('Choose:', { reply_markup: keyboard });

    // === POLL EXAMPLE ===
    // await context.ctx.replyWithPoll(
    //   'Question?',
    //   ['Option A', 'Option B', 'Option C'],
    //   { is_anonymous: false }
    // );

    // Database helpers (see src/lib/database.ts):
    // import { getUserByTelegramId, createOrUpdateUser } from '../../lib/database.js';
    // const user = await getUserByTelegramId(String(context.telegramId));

    // Available transitions: menu
    // return "menu";
  })

  .onResponse(async (context: AppContext): WelcomeTransitions => {
    // Called when user sends any update in this state (message, callback, poll, etc.)
    // Return a state name to transition, or nothing to stay

    // Handle different update types via Grammy context (context.ctx):
    // - context.ctx.message?.text - text messages
    // - context.ctx.callbackQuery?.data - inline button callbacks
    // - context.ctx.message?.photo - photo messages
    // - context.ctx.pollAnswer - poll responses
    // See Grammy docs: https://grammy.dev/guide/context

    // === INLINE KEYBOARD CALLBACK EXAMPLE ===
    // if (context.ctx.callbackQuery?.data) {
    //   await context.ctx.answerCallbackQuery();
    //   const data = context.ctx.callbackQuery.data;
    //   switch (data) {
    //     case 'btn1':
    //       await context.reply('You clicked Button 1!');
    //       break;
    //     case 'btn2':
    //       return 'otherState'; // Transition to another state
    //   }
    //   return;
    // }

    // === POLL ANSWER EXAMPLE ===
    // if (context.ctx.pollAnswer) {
    //   const optionIds = context.ctx.pollAnswer.option_ids;
    //   const options = ['Option A', 'Option B', 'Option C'];
    //   const selected = optionIds.map(id => options[id]).join(', ');
    //   await context.reply(`You voted for: ${selected}`);
    //   return;
    // }

    // === COMMAND HANDLING EXAMPLE ===
    // const text = context.ctx.message?.text?.trim();
    // if (text?.startsWith('/')) {
    //   const command = text.split(' ')[0].toLowerCase();
    //   switch (command) {
    //     case '/start':
    //       await context.reply('Welcome!');
    //       return 'welcome';
    //     case '/menu':
    //       return 'menu';
    //     default:
    //       await context.reply(`Unknown command: ${command}`);
    //   }
    //   return;
    // }

    const text = context.ctx.message?.text?.trim();
    if (text) {
      await context.reply(`You said: ${text}`);
    }

    // Available transitions: menu

    // Database helpers (see src/lib/database.ts):
    // import { updateUserState } from '../../lib/database.js';
    // await updateUserState(String(context.telegramId), 'nextState', { lastMessage: text });
  });

console.log('✅ State handler registered: welcome');
