"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
exports.createTelegramClient = createTelegramClient;
const telegram_1 = require("telegram");
const index_js_1 = require("telegram/sessions/index.js");
const input_1 = __importDefault(require("input")); // Use the input library for getting user input
const apiId = parseInt(process.env.API_ID || '0');
const apiHash = process.env.API_HASH || '';
const stringSession = new index_js_1.StringSession(process.env.SESSION_STRING || '');
async function createTelegramClient() {
    console.log('Loading interactive example...');
    const client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });
    await client.start({
        phoneNumber: async () => await input_1.default.text('Please enter your number: '),
        password: async () => await input_1.default.text('Please enter your password: '),
        phoneCode: async () => await input_1.default.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });
    console.log('You should now be connected.');
    console.log(client.session.save());
    return client;
}
exports.client = new telegram_1.TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
});
//# sourceMappingURL=telegram.js.map