"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotContextImpl = void 0;
class BotContextImpl {
    userId;
    client;
    data = new Map();
    transitionCallback = null;
    constructor(userId, client, transitionCallback) {
        this.userId = userId;
        this.client = client;
        this.transitionCallback = transitionCallback || null;
    }
    async send(message) {
        await this.client.sendMessage(this.userId.toString(), {
            message,
        });
    }
    transition(toState) {
        if (this.transitionCallback) {
            this.transitionCallback(toState);
        }
    }
    getData(key) {
        return this.data.get(key);
    }
    setData(key, value) {
        this.data.set(key, value);
    }
}
exports.BotContextImpl = BotContextImpl;
//# sourceMappingURL=context.js.map