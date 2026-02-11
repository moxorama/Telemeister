import { TelegramClient } from 'telegram';
import { BotContextImpl } from './context';
interface BotMachineContext {
    userId: number;
    message?: string;
    currentState: string;
    botContext?: BotContextImpl;
    client: TelegramClient;
    nextTransition?: any;
}
export declare const botMachine: import("xstate").StateMachine<BotMachineContext, {
    type: "message";
    userId: number;
    message: string;
} | {
    type: "transition";
    toState: string;
}, {
    [x: string]: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<{
        botContext: BotContextImpl;
    }, {
        state: string;
        userId: number;
        client: TelegramClient;
    }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<{
        nextTransition: any;
        botContext: BotContextImpl;
    }, {
        state: string;
        userId: number;
        message: string;
        client: TelegramClient;
        botContext?: BotContextImpl;
    }, import("xstate").EventObject>> | undefined;
}, {
    src: "executePrompt";
    logic: import("xstate").PromiseActorLogic<{
        botContext: BotContextImpl;
    }, {
        state: string;
        userId: number;
        client: TelegramClient;
    }, import("xstate").EventObject>;
    id: string | undefined;
} | {
    src: "executeResponse";
    logic: import("xstate").PromiseActorLogic<{
        nextTransition: any;
        botContext: BotContextImpl;
    }, {
        state: string;
        userId: number;
        message: string;
        client: TelegramClient;
        botContext?: BotContextImpl;
    }, import("xstate").EventObject>;
    id: string | undefined;
}, never, never, never, "idle" | {
    processing: "handlingResponse" | "transitioning";
}, string, import("xstate").NonReducibleUnknown, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, {
    id: "bot";
    states: {
        readonly idle: {};
        readonly processing: {
            states: {
                readonly handlingResponse: {};
                readonly transitioning: {};
            };
        };
    };
}>;
export {};
//# sourceMappingURL=bot-machine.d.ts.map