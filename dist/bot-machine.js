"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botMachine = void 0;
const xstate_1 = require("xstate");
const registry_1 = require("./registry");
const context_1 = require("./context");
exports.botMachine = (0, xstate_1.setup)({
    types: {
        context: {},
        events: {},
    },
    actors: {
        executePrompt: (0, xstate_1.fromPromise)(async ({ input, }) => {
            const handlers = registry_1.stateHandlerRegistry.getHandlers(input.state);
            const botContext = new context_1.BotContextImpl(input.userId, input.client, (toState) => {
                console.log(`Transition requested to: ${JSON.stringify(toState)}`);
            });
            if (handlers?.prompt) {
                await handlers.prompt(botContext);
            }
            return { botContext };
        }),
        executeResponse: (0, xstate_1.fromPromise)(async ({ input, }) => {
            const handlers = registry_1.stateHandlerRegistry.getHandlers(input.state);
            const botContext = input.botContext ||
                new context_1.BotContextImpl(input.userId, input.client);
            let nextTransition = undefined;
            if (handlers?.response) {
                const result = await handlers.response(botContext, input.message);
                if (result) {
                    nextTransition = result;
                }
            }
            return { nextTransition, botContext };
        }),
    },
}).createMachine({
    id: 'bot',
    initial: 'idle',
    context: {
        userId: 0,
        currentState: 'idle',
        client: undefined,
    },
    states: {
        idle: {
            on: {
                message: {
                    target: 'processing',
                    actions: (0, xstate_1.assign)({
                        userId: ({ event }) => event.userId,
                        message: ({ event }) => event.message,
                    }),
                },
            },
        },
        processing: {
            initial: 'handlingResponse',
            states: {
                handlingResponse: {
                    entry: (0, xstate_1.assign)({
                        currentState: () => 'idle',
                    }),
                    invoke: {
                        src: 'executeResponse',
                        input: ({ context }) => ({
                            state: context.currentState,
                            userId: context.userId,
                            message: context.message,
                            client: context.client,
                            botContext: context.botContext,
                        }),
                        onDone: [
                            {
                                guard: ({ context }) => context.nextTransition !== undefined,
                                target: 'transitioning',
                                actions: (0, xstate_1.assign)({
                                    botContext: ({ event }) => event.output.botContext,
                                }),
                            },
                            {
                                target: '#bot.idle',
                            },
                        ],
                        onError: '#bot.idle',
                    },
                },
                transitioning: {
                    entry: (0, xstate_1.assign)({
                        currentState: ({ context }) => {
                            const transition = context.nextTransition;
                            return typeof transition === 'string' ? transition : 'idle';
                        },
                    }),
                    invoke: {
                        src: 'executePrompt',
                        input: ({ context }) => ({
                            state: context.currentState,
                            userId: context.userId,
                            client: context.client,
                        }),
                        onDone: '#bot.idle',
                        onError: '#bot.idle',
                    },
                },
            },
        },
    },
});
//# sourceMappingURL=bot-machine.js.map