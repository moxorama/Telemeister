import { appBuilder, type AppContext } from 'telemeister/core';
import { InlineKeyboard } from 'grammy';
import type { PollTransitions } from '../../bot-state-types.js';

const POLL_OPTIONS = ['TypeScript', 'JavaScript', 'Python', 'Rust'];

appBuilder
  .forState('poll')

  .onEnter(async (context: AppContext): PollTransitions => {
    await context.ctx.replyWithPoll('What is your favorite programming language?', POLL_OPTIONS, {
      is_anonymous: false,
      allows_multiple_answers: true,
    });

    const keyboard = new InlineKeyboard().text('Back to Menu', 'back');
    await context.reply('Vote above, or click below to return:', { reply_markup: keyboard });
  })

  .onResponse(async (context: AppContext): PollTransitions => {
    if (context.ctx.pollAnswer) {
      const optionIds = context.ctx.pollAnswer.option_ids;
      const selected = optionIds.map((id: number) => POLL_OPTIONS[id]).join(', ');
      await context.reply(`You voted for: ${selected}`);
      return;
    }

    if (context.ctx.callbackQuery?.data === 'back') {
      await context.ctx.answerCallbackQuery();
      return 'menu';
    }
  });

console.log('✅ State handler registered: poll');
