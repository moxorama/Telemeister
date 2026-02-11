import { TelegramClient } from 'telegram';
declare module 'input' {
    function text(prompt: string): Promise<string>;
    function password(prompt: string): Promise<string>;
    function hidden(prompt: string): Promise<string>;
    function confirm(prompt: string): Promise<boolean>;
    function select(prompt: string, choices: string[]): Promise<string>;
}
export declare function createTelegramClient(): Promise<TelegramClient>;
export declare const client: TelegramClient;
//# sourceMappingURL=telegram.d.ts.map