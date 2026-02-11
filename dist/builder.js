"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.botBuilder = void 0;
const registry_1 = require("./registry");
class StateBuilder {
    states;
    constructor(states) {
        this.states = states;
    }
    sendPrompt(handler) {
        registry_1.stateHandlerRegistry.registerPrompt(this.states, handler);
        return this;
    }
    handleResponse(handler) {
        registry_1.stateHandlerRegistry.registerResponse(this.states, handler);
        return this;
    }
}
class BotBuilder {
    forState(states) {
        const stateArray = Array.isArray(states) ? states : [states];
        return new StateBuilder(stateArray);
    }
}
exports.botBuilder = new BotBuilder();
//# sourceMappingURL=builder.js.map