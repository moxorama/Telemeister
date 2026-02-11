import { TelegramClient } from 'telegram';
export type StateTransition = string | {
    type: string;
    [key: string]: any;
};
export interface BotContext {
    userId: number;
    send: (message: string) => Promise<void>;
    transition: (toState: StateTransition) => void;
    getData: <T = any>(key: string) => T | undefined;
    setData: <T = any>(key: string, value: T) => void;
    client: TelegramClient;
}
export type PromptHandler = (context: BotContext) => void | Promise<void>;
export type ResponseHandler = (context: BotContext, response: string) => StateTransition | void | Promise<StateTransition | void>;
export interface StateHandlers {
    prompt?: PromptHandler;
    response?: ResponseHandler;
}
export interface StateHandlerRegistry {
    registerPrompt: (states: string[], handler: PromptHandler) => void;
    registerResponse: (states: string[], handler: ResponseHandler) => void;
    getHandlers: (state: string) => StateHandlers | undefined;
}
//# sourceMappingURL=types.d.ts.map