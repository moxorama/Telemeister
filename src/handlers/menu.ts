import { appBuilder, type AppContext } from "../core";

/**
 * menu State Handler
 *
 * This file defines the handlers for the "menu" state.
 */

appBuilder
  .forState("menu")
  .onEnter(async (context: AppContext) => {
    const name = context.getData<string>("name") || "User";
    await context.send(
      `📋 Menu for ${name}:\n\n` +
        "1. Show name\n" +
        "2. Go to welcome\n" +
        "3. Exit\n\n" +
        "Type 1, 2, or 3",
    );
  })
  .onResponse(async (context: AppContext, response) => {
    const choice = response.trim();

    switch (choice) {
      case "1": {
        const name = context.getData<string>("name");
        await context.send(`Your name is: ${name}`);
        // Stay in menu
        return;
      }
      case "2":
        return "welcome";
      case "3":
        await context.send("👋 Goodbye!");
        return "idle";
      default:
        await context.send("Please select 1, 2, or 3.");
      // Stay in menu
    }
  });

console.log("✅ State handler registered: menu");
