/**
 * Create Bot Project scaffolding
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ejs from 'ejs';
import { stateSync } from './state-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get the package root directory (works for both dist/cli/ and bin/ locations)
function getPackageRoot(): string {
  // __dirname is either dist/cli/ (from tsc) or bin/ (from bundle)
  const currentDir = __dirname;
  // If we're in dist/cli/, go up 2 levels to get package root
  // If we're in bin/, go up 1 level to get package root
  const baseName = path.basename(currentDir);
  if (baseName === 'cli' || baseName === 'dist') {
    return path.join(currentDir, '..', '..');
  }
  return path.join(currentDir, '..');
}

function loadTemplate(templateName: string): string {
  const packageRoot = getPackageRoot();
  const templatePath = path.join(packageRoot, 'dist', 'templates', templateName);
  return fs.readFileSync(templatePath, 'utf-8');
}

function renderTemplate(templateName: string, data: Record<string, unknown> = {}): string {
  const template = loadTemplate(templateName);
  return ejs.render(template, data);
}

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
  fs.mkdirSync(path.join(targetDir, 'src', 'handlers'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'prisma'), { recursive: true });

  // Create files from templates
  fs.writeFileSync(path.join(targetDir, '.gitignore'), loadTemplate('gitignore.ejs'));
  fs.writeFileSync(path.join(targetDir, 'tsconfig.json'), loadTemplate('tsconfig.json.ejs'));
  fs.writeFileSync(path.join(targetDir, '.env.example'), loadTemplate('env.example.ejs'));
  fs.writeFileSync(path.join(targetDir, 'bot.json'), loadTemplate('bot.json.ejs'));
  fs.writeFileSync(path.join(targetDir, 'src', 'index.ts'), loadTemplate('index.ts.ejs'));
  fs.writeFileSync(
    path.join(targetDir, 'prisma', 'schema.prisma'),
    loadTemplate('prisma-schema.prisma.ejs')
  );
  fs.writeFileSync(path.join(targetDir, 'prisma.config.ts'), loadTemplate('prisma.config.ts.ejs'));

  // Create database file
  fs.mkdirSync(path.join(targetDir, 'src', 'lib'), { recursive: true });
  fs.writeFileSync(
    path.join(targetDir, 'src', 'lib', 'database.ts'),
    loadTemplate('database.ts.ejs')
  );

  // Note: Bot runtime files (session.ts, polling.ts, webhook.ts) are now provided by the framework
  // in 'telemeister/core/bot' and don't need to be generated

  fs.writeFileSync(path.join(targetDir, 'README.md'), renderTemplate('README.md.ejs', { botName }));
  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    renderTemplate('package.json.ejs', { botName })
  );

  // Sync handlers and types from bot.json
  process.chdir(targetDir);
  await stateSync();

  // Run automated setup commands
  console.log('\n📦 Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch {
    console.error('❌ Failed to install dependencies. Please run "npm install" manually.\n');
    process.exit(1);
  }

  // Use a temporary SQLite database for initial setup
  const tempDbUrl = 'file:./dev.db';

  console.log('🗄️  Generating Prisma client...');
  try {
    execSync('npm run db:generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: tempDbUrl },
    });
    console.log('✅ Prisma client generated\n');
  } catch {
    console.error(
      '❌ Failed to generate Prisma client. Please run "npm run db:generate" manually.\n'
    );
    process.exit(1);
  }

  console.log('🗄️  Creating initial database migration...');
  try {
    execSync('npx prisma migrate dev --name init', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: tempDbUrl },
    });
    console.log('✅ Database migration created\n');
  } catch {
    console.error(
      '❌ Failed to create database migration. Please run "npm run db:migrate" manually.\n'
    );
    process.exit(1);
  }

  console.log(`✅ Bot "${botName}" created successfully!\n`);
  console.log('Next steps:');
  console.log(`  cd ${botName}`);
  console.log('  cp .env.example .env  # Add your bot token from @BotFather');
  console.log('  npm run dev');
}
