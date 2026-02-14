/**
 * Create Bot Project scaffolding
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_BOT_JSON = {
  idle: ['welcome'],
  welcome: ['menu'],
  menu: ['welcome'],
};

const GITIGNORE_CONTENT = `# Dependencies
node_modules/

# Environment variables
.env
.env.local
.env.*.local

# Build output
dist/

# Bot configuration (generated)
bot.json
src/bot-state-types.ts
src/bot-diagram.md
src/bot-diagram.png

# Prisma
prisma/*.db
prisma/*.db-journal

# Logs
*.log

# OS
.DS_Store
Thumbs.db
`;

const TS_CONFIG_CONTENT = `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;

const INDEX_TS_CONTENT = `/**
 * Bot entry point
 */

import { botBuilder } from 'telemeister/core';
import './handlers/index.js';

const bot = botBuilder.build();

// Start bot
bot.start();
`;

const HANDLERS_INDEX_CONTENT = `/**
 * State Handlers Index
 *
 * Import all your state handler files here.
 */

import './idle/index.js';
import './welcome/index.js';
import './menu/index.js';
`;

const IDLE_HANDLER_CONTENT = `import { appBuilder, type AppContext } from 'telemeister/core';
import type { IdleTransitions } from '../bot-state-types.js';

appBuilder
  .forState('idle')
  .onEnter(async (context: AppContext): IdleTransitions => {
    // Bot is idle, ready for user interaction
    // This state is typically the entry point
    return 'welcome';
  })
  .onResponse(async (context: AppContext, response): IdleTransitions => {
    // Handle user messages when in idle state
    const text = response.trim();
    await context.send('Welcome! Type anything to start.');
  });

console.log('✅ State handler registered: idle');
`;

const WELCOME_HANDLER_CONTENT = `import { appBuilder, type AppContext } from 'telemeister/core';
import type { WelcomeTransitions } from '../bot-state-types.js';

appBuilder
  .forState('welcome')
  .onEnter(async (context: AppContext): WelcomeTransitions => {
    await context.send('Hello! Welcome to the bot!');
    return 'menu';
  })
  .onResponse(async (context: AppContext, response): WelcomeTransitions => {
    const text = response.trim();
    await context.send('Welcome! Choose an option:');
  });

console.log('✅ State handler registered: welcome');
`;

const MENU_HANDLER_CONTENT = `import { appBuilder, type AppContext } from 'telemeister/core';
import type { MenuTransitions } from '../bot-state-types.js';

appBuilder
  .forState('menu')
  .onEnter(async (context: AppContext): MenuTransitions => {
    await context.send('Main Menu\\n\\n1. Start over\\n2. Exit');
  })
  .onResponse(async (context: AppContext, response): MenuTransitions => {
    const text = response.trim();
    
    if (text === '1') {
      return 'welcome';
    }
    
    await context.send('Menu option selected: ' + text);
  });

console.log('✅ State handler registered: menu');
`;

const ENV_CONTENT = `# Telegram Bot Configuration
BOT_TOKEN=your_bot_token_here

# Database (SQLite for development)
DATABASE_URL=file:./prisma/dev.db
`;

const PRISMA_SCHEMA_CONTENT = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id          Int      @id @default(autoincrement())
  telegramId  BigInt   @unique
  chatId      BigInt
  currentState String  @default("idle")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
`;

const README_CONTENT = (botName: string) => `# ${botName}

Telegram bot built with Telemeister.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env and add your bot token
   \`\`\`

3. Set up the database:
   \`\`\`bash
   npm run db:generate
   npm run db:migrate
   \`\`\`

4. Run the bot:
   \`\`\`bash
   npm run dev
   \`\`\`

## State Management

- \`npm run state:add <name\u003e\` - Add a new state
- \`npm run state:delete <name\u003e\` - Delete a state
- \`npm run state:sync\` - Sync types and handlers
- \`npm run state:transition:add <from> <to>\` - Add transition
- \`npm run state:transition:delete <from> <to>\` - Delete transition

## Project Structure

- \`bot.json\` - State machine configuration (do not commit)
- \`src/handlers/\` - State handler implementations
- \`src/bot-state-types.ts\` - Generated types (do not edit)
`;

export async function createBot(botName: string | undefined): Promise<void> {
  if (!botName) {
    console.error('❌ Error: Bot name is required');
    console.error('Usage: telemeister create-bot <bot-name>');
    process.exit(1);
  }

  // Validate bot name (similar to state name validation)
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(botName)) {
    console.error(
      '❌ Error: Bot name must start with a letter and contain only letters, numbers, underscores, and hyphens'
    );
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), botName);

  // Check if directory already exists
  if (fs.existsSync(targetDir)) {
    console.error(`❌ Error: Directory "${botName}" already exists`);
    process.exit(1);
  }

  console.log(`🚀 Creating new bot: ${botName}\n`);

  // Create directory structure
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src', 'handlers', 'idle'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src', 'handlers', 'welcome'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src', 'handlers', 'menu'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'prisma'), { recursive: true });

  // Create files
  fs.writeFileSync(path.join(targetDir, '.gitignore'), GITIGNORE_CONTENT);
  fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), TS_CONFIG_CONTENT);
  fs.writeFileSync(path.join(targetDir, '.env.example'), ENV_CONTENT);
  fs.writeFileSync(
    path.join(targetDir, 'bot.json'),
    JSON.stringify(DEFAULT_BOT_JSON, null, 2) + '\n'
  );
  fs.writeFileSync(path.join(targetDir, 'src', 'index.ts'), INDEX_TS_CONTENT);
  fs.writeFileSync(path.join(targetDir, 'src', 'handlers', 'index.ts'), HANDLERS_INDEX_CONTENT);
  fs.writeFileSync(
    path.join(targetDir, 'src', 'handlers', 'idle', 'index.ts'),
    IDLE_HANDLER_CONTENT
  );
  fs.writeFileSync(
    path.join(targetDir, 'src', 'handlers', 'welcome', 'index.ts'),
    WELCOME_HANDLER_CONTENT
  );
  fs.writeFileSync(
    path.join(targetDir, 'src', 'handlers', 'menu', 'index.ts'),
    MENU_HANDLER_CONTENT
  );
  fs.writeFileSync(path.join(targetDir, 'prisma', 'schema.prisma'), PRISMA_SCHEMA_CONTENT);
  fs.writeFileSync(path.join(targetDir, 'README.md'), README_CONTENT(botName));

  // Create package.json with telemeister dependency
  const packageJson = {
    name: botName,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'tsx src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
      'db:generate': 'prisma generate',
      'db:migrate': 'prisma migrate dev',
      'db:studio': 'prisma studio',
      'state:add': 'telemeister state:add',
      'state:delete': 'telemeister state:delete',
      'state:sync': 'telemeister state:sync',
      'state:transition:add': 'telemeister state:transition:add',
      'state:transition:delete': 'telemeister state:transition:delete',
    },
    dependencies: {
      telemeister: '^0.1.3',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      prisma: '^5.0.0',
      tsx: '^4.0.0',
      typescript: '^5.0.0',
    },
  };

  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  );

  console.log(`✅ Bot "${botName}" created successfully!\n`);
  console.log('Next steps:');
  console.log(`  cd ${botName}`);
  console.log('  npm install');
  console.log('  cp .env.example .env  # Add your bot token');
  console.log('  npm run db:generate');
  console.log('  npm run db:migrate');
  console.log('  npm run dev');
}
