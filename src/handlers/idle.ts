import { appBuilder, type AppContext } from "../core/index.js";

/**
 * idle State Handler
 *
 * This file defines the handlers for the "idle" state.
 * The idle state is the default/initial state for users.
 */

appBuilder
  .forState("idle")
  .onEnter(async (context: AppContext) => {
    // Called when user enters idle state
    // This is typically the starting state for new users

    await context.send(
      "👋 Hello! I'm your Telegram bot.\n\n" +
        "Send any message to get started, or type /start to begin.",
    );
  })
  .onResponse(async (context: AppContext, response) => {
    // Called when user sends a message while in idle state
    // Transition to welcome state to start the conversation flow

    const trimmed = response.trim();

    if (trimmed === "/start" || trimmed.toLowerCase() === "start") {
      return "welcome";
    }

    // Any message transitions to welcome state
    await context.send("Let's get started!");
    return "welcome";
  });

console.log("✅ State handler registered: idle");
