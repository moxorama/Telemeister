import { BotContext, StateTransition } from './types';
import { TelegramClient } from 'telegram';
export declare class BotContextImpl implements BotContext {
    userId: number;
    client: TelegramClient;
    private data;
    private transitionCallback;
    constructor(userId: number, client: TelegramClient, transitionCallback?: (toState: StateTransition) => void);
    send(message: string): Promise<void>;
    transition(toState: StateTransition): void;
    getData<T = any>(key: string): T | undefined;
    setData<T = any>(key: string, value: T): void;
}
//# sourceMappingURL=context.d.ts.map