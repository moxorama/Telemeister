import { appBuilder, type AppContext } from "../core";

/**
 * welcome State Handler
 *
 * This file defines the handlers for the "welcome" state.
 */

appBuilder
  .forState("welcome")
  .onEnter(async (context: AppContext) => {
    // Called when user enters this state
    // Can optionally return a state name to immediately transition

    await context.send("👋 Welcome! What's your name?");

    // Optional: immediately transition to another state
    // return "menu";  // ✅ Type-safe: only AppStates allowed
  })
  .onResponse(async (context: AppContext, response) => {
    // Called when user sends a message in this state
    // Return a state name to transition, or nothing to stay

    const name = response.trim();

    if (name.length < 2) {
      await context.send("Please enter a valid name (at least 2 characters).");
      // Stay in welcome state
      return;
    }

    context.setData("name", name);

    // Type-safe return: only AppStates allowed
    return "menu";
  });

console.log("✅ State handler registered: welcome");
