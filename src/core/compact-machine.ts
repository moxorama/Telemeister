import { setup, createMachine, assign } from "xstate";
import type { BotContext, BotEvent, BotMachineInput } from "./types";

/**
 * Compact XState Machine for Telemeister
 *
 * Uses the "states as data" pattern - a single state node handles
 * all bot states. The actual state value is stored in context.currentState.
 *
 * Benefits:
 * - No need to modify machine when adding new states
 * - Compact, maintainable code
 * - Builder pattern is the source of truth for valid states
 * - Re-entry triggers onEnter handler for new states
 */

export const compactMachine = setup({
  types: {
    context: {} as BotContext,
    events: {} as BotEvent,
    input: {} as BotMachineInput,
  },
  actions: {
    /**
     * Update the current state in context
     */
    updateState: assign({
      currentState: ({ event }) =>
        event.type === "TRANSITION" ? event.toState : "",
    }),

    /**
     * Persist state to database
     * This is called as an action, but actual DB calls happen
     * in the bot handlers to keep the machine pure.
     */
    persistState: ({ context }) => {
      // The actual persistence is handled by the bot layer
      // This action serves as a hook for inspection/logging
      console.log(`[XState] State changed to: ${context.currentState}`);
    },
  },
}).createMachine({
  id: "telemeister-bot",
  initial: "active",
  context: ({ input }) => ({
    userId: input.userId,
    telegramId: input.telegramId,
    chatId: input.chatId,
    currentState: input.currentState,
    stateData: input.stateData,
  }),
  states: {
    active: {
      entry: ["persistState"],
      on: {
        TRANSITION: {
          actions: ["updateState", "persistState"],
          // Self-transition with reentry to trigger onEnter
          target: "active",
          reenter: true,
        },
        REENTER: {
          // Re-enter current state (e.g., to re-trigger onEnter)
          target: "active",
          reenter: true,
        },
      },
    },
  },
});

/**
 * Create a new machine instance with the given initial state
 */
export function createBotMachine(input: BotMachineInput) {
  return setup({
    types: {
      context: {} as BotContext,
      events: {} as BotEvent,
      input: {} as BotMachineInput,
    },
    actions: {
      updateState: assign({
        currentState: ({ event }) =>
          event.type === "TRANSITION" ? event.toState : "",
      }),
      persistState: ({ context }) => {
        console.log(`[XState] State changed to: ${context.currentState}`);
      },
    },
  }).createMachine({
    id: "telemeister-bot",
    initial: "active",
    context: ({ input }) => ({
      userId: input.userId,
      telegramId: input.telegramId,
      chatId: input.chatId,
      currentState: input.currentState,
      stateData: input.stateData,
    }),
    states: {
      active: {
        entry: ["persistState"],
        on: {
          TRANSITION: {
            actions: ["updateState", "persistState"],
            target: "active",
            reenter: true,
          },
          REENTER: {
            target: "active",
            reenter: true,
          },
        },
      },
    },
  });
}
