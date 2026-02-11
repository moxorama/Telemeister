import { PromptHandler, ResponseHandler } from './types';
declare class StateBuilder {
    private states;
    constructor(states: string[]);
    sendPrompt(handler: PromptHandler): StateBuilder;
    handleResponse(handler: ResponseHandler): StateBuilder;
}
declare class BotBuilder {
    forState(states: string | string[]): StateBuilder;
}
export declare const botBuilder: BotBuilder;
export {};
//# sourceMappingURL=builder.d.ts.map