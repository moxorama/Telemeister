"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateHandlerRegistry = void 0;
class Registry {
    handlers = new Map();
    registerPrompt(states, handler) {
        states.forEach((state) => {
            const existing = this.handlers.get(state) || {};
            this.handlers.set(state, { ...existing, prompt: handler });
        });
    }
    registerResponse(states, handler) {
        states.forEach((state) => {
            const existing = this.handlers.get(state) || {};
            this.handlers.set(state, { ...existing, response: handler });
        });
    }
    getHandlers(state) {
        return this.handlers.get(state);
    }
    clear() {
        this.handlers.clear();
    }
}
exports.stateHandlerRegistry = new Registry();
//# sourceMappingURL=registry.js.map