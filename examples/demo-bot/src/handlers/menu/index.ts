import { appBuilder, type AppContext } from 'telemeister/core';
import { InlineKeyboard } from 'grammy';
import type { MenuTransitions } from '../../bot-state-types.js';

appBuilder
  .forState('menu')

  .onEnter(async (context: AppContext): MenuTransitions => {
    const keyboard = new InlineKeyboard()
      .text('Take a Poll', 'poll')
      .row()
      .text('Back to Welcome', 'welcome');

    await context.ctx.reply('Menu: Choose an option', { reply_markup: keyboard });
  })

  .onResponse(async (context: AppContext): MenuTransitions => {
    if (context.ctx.callbackQuery?.data) {
      await context.ctx.answerCallbackQuery();
      const data = context.ctx.callbackQuery.data;

      switch (data) {
        case 'poll':
          return 'poll';
        case 'welcome':
          return 'welcome';
        default:
          await context.ctx.reply(`Unknown action: ${data}`);
      }
      return;
    }

    const text = context.ctx.message?.text?.trim();
    if (text) {
      await context.ctx.reply(`You said: ${text}`);
    }
  });

console.log('✅ State handler registered: menu');
