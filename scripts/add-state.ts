/**
 * CLI script to add a new state with handler template
 *
 * Usage:
 *   npx tsx scripts/add-state.ts <state-name>
 *   npm run state:add -- <state-name>
 *
 * Example:
 *   npm run state:add -- welcome
 *   npm run state:add -- collectEmail
 */

import * as fs from "fs";
import * as path from "path";

const STATE_NAME = process.argv[2];

if (!STATE_NAME) {
  console.error("❌ Error: State name is required");
  console.error("Usage: npm run state:add -- <state-name>");
  process.exit(1);
}

// Validate state name (camelCase or kebab-case)
if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(STATE_NAME)) {
  console.error(
    "❌ Error: State name must start with a letter and contain only letters, numbers, underscores, and hyphens",
  );
  process.exit(1);
}

const HANDLERS_DIR = path.join(process.cwd(), "src", "handlers");
const STATES_INDEX_FILE = path.join(
  process.cwd(),
  "src",
  "core",
  "app-states.ts",
);
const INDEX_FILE = path.join(HANDLERS_DIR, "index.ts");
const STATE_FILE = path.join(HANDLERS_DIR, `${STATE_NAME}.ts`);

// Ensure handlers directory exists
if (!fs.existsSync(HANDLERS_DIR)) {
  fs.mkdirSync(HANDLERS_DIR, { recursive: true });
}

// Check if state file already exists
if (fs.existsSync(STATE_FILE)) {
  console.error(`❌ Error: State handler already exists: ${STATE_FILE}`);
  process.exit(1);
}

// Generate handler template - imports from centralized states
const template = `import { appBuilder, type AppContext } from "../core";

/**
 * ${STATE_NAME} State Handler
 *
 * This file defines the handlers for the "${STATE_NAME}" state.
 */

appBuilder
  .forState("${STATE_NAME}")
  .onEnter(async (context: AppContext) => {
    // Called when user enters this state
    // Can optionally return a state name to immediately transition

    await context.send("👋 Welcome to ${STATE_NAME} state!");

    // Optional: immediately transition to another state
    // Type-safe: only states defined in src/states/index.ts are allowed
    // return "menu";
  })
  .onResponse(async (context: AppContext, response) => {
    // Called when user sends a message in this state
    // Return a state name to transition, or nothing to stay

    const text = response.trim();

    // Example: handle different responses
    if (text.toLowerCase() === "next") {
      return "menu"; // ✅ Type-safe state return
    }

    if (text.toLowerCase() === "back") {
      return "idle"; // ✅ Type-safe state return
    }

    // Stay in current state
    await context.send('I didn\\'t understand. Try "next" or "back".');
  });

console.log("✅ State handler registered: ${STATE_NAME}");
`;

// Write state file
fs.writeFileSync(STATE_FILE, template);
console.log(`📝 Created: src/handlers/${STATE_NAME}.ts`);

// Update states/index.ts to add new state to AppStates union
if (fs.existsSync(STATES_INDEX_FILE)) {
  let statesContent = fs.readFileSync(STATES_INDEX_FILE, "utf-8");

  // Add new state to AppStates union (before the last quote of the last state)
  const statePattern = /export type AppStates =[\s\S]*?;/;
  const match = statesContent.match(statePattern);

  if (match && !statesContent.includes(`"${STATE_NAME}"`)) {
    // Find the last state in the union and add new one before the semicolon
    const updatedUnion = match[0].replace(/;$/, `\n  | "${STATE_NAME}";`);
    statesContent = statesContent.replace(statePattern, updatedUnion);
    fs.writeFileSync(STATES_INDEX_FILE, statesContent);
    console.log(
      `📝 Added "${STATE_NAME}" to AppStates in src/core/app-states.ts`,
    );
  }
}

// Update handlers/index.ts
let indexContent = "";
if (fs.existsSync(INDEX_FILE)) {
  indexContent = fs.readFileSync(INDEX_FILE, "utf-8");
}

// Add import if not already present
const importLine = `import "./${STATE_NAME}";`;
if (!indexContent.includes(importLine)) {
  // Remove the comment block ending if present, add import, then add comment back
  const commentEnd = "// Add your custom handlers below:";
  if (indexContent.includes(commentEnd)) {
    indexContent = indexContent.replace(
      commentEnd,
      `${commentEnd}\n${importLine}`,
    );
  } else {
    indexContent += `\n${importLine}`;
  }

  fs.writeFileSync(INDEX_FILE, indexContent);
  console.log(`📝 Updated: src/handlers/index.ts`);
}

console.log(`\n✅ State "${STATE_NAME}" added successfully!`);
console.log(`\nNext steps:`);
console.log(
  `  1. Edit src/handlers/${STATE_NAME}.ts to customize the handlers`,
);
console.log(`  2. State "${STATE_NAME}" is already added to AppStates`);
console.log(
  `  3. All handlers now have type safety with the updated AppStates union`,
);
