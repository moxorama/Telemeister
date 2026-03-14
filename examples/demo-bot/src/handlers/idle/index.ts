import { appBuilder, type AppContext } from 'telemeister/core';
import type { Context } from 'grammy';
import type { IdleTransitions } from '../../bot-state-types.js';

/**
 * idle State Handler
 *
 * This file defines the handlers for the "idle" state.
 */

appBuilder
  .forState('idle')

  .onEnter(async (context: AppContext): IdleTransitions => {
    // Called when user enters this state
    // Can optionally return a state name to immediately transition

    // Access Grammy context via context.ctx
    // See Grammy docs: https://grammy.dev/guide/context
    await context.ctx.reply('Hello from idle state!');

    // === INLINE KEYBOARD EXAMPLE ===
    // import { InlineKeyboard } from 'grammy';
    // const keyboard = new InlineKeyboard()
    //   .text('Button 1', 'btn1')
    //   .text('Button 2', 'btn2');
    // await context.ctx.reply('Choose:', { reply_markup: keyboard });

    // === POLL EXAMPLE ===
    // await context.ctx.replyWithPoll(
    //   'Question?',
    //   ['Option A', 'Option B', 'Option C'],
    //   { is_anonymous: false }
    // );

    // Database helpers (see src/lib/database.ts):
    // import { getUserByTelegramId, createOrUpdateUser } from '../../lib/database.js';
    // const user = await getUserByTelegramId(String(context.telegramId));

    // Available transitions: welcome
    // return "welcome";
  })

  .onResponse(async (context: AppContext, ctx: Context): IdleTransitions => {
    // Called when user sends any update in this state (message, callback, poll, etc.)
    // Return a state name to transition, or nothing to stay

    // Handle different update types via Grammy context:
    // - ctx.message?.text - text messages
    // - ctx.callbackQuery?.data - inline button callbacks
    // - ctx.message?.photo - photo messages
    // - ctx.pollAnswer - poll responses
    // See Grammy docs: https://grammy.dev/guide/context

    // === INLINE KEYBOARD CALLBACK EXAMPLE ===
    // if (ctx.callbackQuery?.data) {
    //   await ctx.answerCallbackQuery();
    //   const data = ctx.callbackQuery.data;
    //   switch (data) {
    //     case 'btn1':
    //       await ctx.reply('You clicked Button 1!');
    //       break;
    //     case 'btn2':
    //       return 'otherState'; // Transition to another state
    //   }
    //   return;
    // }

    // === POLL ANSWER EXAMPLE ===
    // if (ctx.pollAnswer) {
    //   const optionIds = ctx.pollAnswer.option_ids;
    //   const options = ['Option A', 'Option B', 'Option C'];
    //   const selected = optionIds.map(id => options[id]).join(', ');
    //   await ctx.reply(`You voted for: ${selected}`);
    //   return;
    // }

    // === COMMAND HANDLING EXAMPLE ===
    // const text = ctx.message?.text?.trim();
    // if (text?.startsWith('/')) {
    //   const command = text.split(' ')[0].toLowerCase();
    //   switch (command) {
    //     case '/start':
    //       await ctx.reply('Welcome!');
    //       return 'welcome';
    //     case '/menu':
    //       return 'menu';
    //     default:
    //       await ctx.reply(`Unknown command: ${command}`);
    //   }
    //   return;
    // }

    const text = ctx.message?.text?.trim();
    if (text) {
      await ctx.reply(`You said: ${text}`);
    }

    // Available transitions: welcome

    // Database helpers (see src/lib/database.ts):
    // import { updateUserState } from '../../lib/database.js';
    // await updateUserState(String(context.telegramId), 'nextState', { lastMessage: text });
  });

console.log('✅ State handler registered: idle');
