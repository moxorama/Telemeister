import { StateHandlerRegistry, StateHandlers, PromptHandler, ResponseHandler } from './types';
declare class Registry implements StateHandlerRegistry {
    private handlers;
    registerPrompt(states: string[], handler: PromptHandler): void;
    registerResponse(states: string[], handler: ResponseHandler): void;
    getHandlers(state: string): StateHandlers | undefined;
    clear(): void;
}
export declare const stateHandlerRegistry: Registry;
export {};
//# sourceMappingURL=registry.d.ts.map