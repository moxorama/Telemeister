"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("./prisma");
const bot_machine_1 = require("./bot-machine");
const xstate_1 = require("xstate");
const telegram_1 = require("./telegram");
const builder_1 = require("./builder");
// Define handlers using the builder pattern
builder_1.botBuilder
    .forState(['idle', 'start'])
    .sendPrompt(async (context) => {
    await context.send('👋 Welcome to Telemeister!\n\nSend me a message and I will echo it back.');
})
    .handleResponse(async (context, response) => {
    console.log(`User ${context.userId} sent: ${response}`);
    await context.send(`📨 You said: "${response}"\n\nSend another message or type /exit to quit.`);
    if (response === '/exit') {
        await context.send('👋 Goodbye!');
        return 'idle';
    }
    return 'idle';
});
async function bootstrap() {
    console.log('🚀 Bootstrapping Telemeister...\n');
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Prisma connected');
        const telegramClient = await (0, telegram_1.createTelegramClient)();
        console.log('✅ Telegram client connected');
        const botActor = (0, xstate_1.createActor)(bot_machine_1.botMachine, {
            input: {
                userId: 0,
                client: telegramClient,
            },
        });
        botActor.start();
        console.log('✅ XState machine started');
        console.log('\n🎉 Bootstrap complete! Bot is running.\n');
        telegramClient.addEventHandler(async (event) => {
            if (event.className === 'Message') {
                const sender = event.sender;
                if (sender && sender.id) {
                    const userId = sender.id.toJSNumber();
                    const message = event.message || '';
                    console.log(`📥 Received message from ${userId}: ${message}`);
                    // Update actor context with current user
                    botActor.send({ type: 'message', userId, message });
                }
            }
        });
        process.on('SIGINT', async () => {
            console.log('\n👋 Shutting down...');
            botActor.stop();
            await prisma_1.prisma.$disconnect();
            await telegramClient.disconnect();
            process.exit(0);
        });
    }
    catch (error) {
        console.error('❌ Bootstrap failed:', error);
        await prisma_1.prisma.$disconnect();
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map