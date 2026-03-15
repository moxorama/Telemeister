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

function getPackageRoot(): string {
  const currentDir = __dirname;
  const baseName = path.basename(currentDir);
  if (baseName === 'cli' || baseName === 'dist') {
    return path.join(currentDir, '..', '..');
  }
  return path.join(currentDir, '..');
}

function getPackageVersion(): string {
  const packageRoot = getPackageRoot();
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  return packageJson.version;
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

function getPackageManager(): string {
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    return 'pnpm';
  } catch {
    return 'npm';
  }
}

export async function createBot(botName: string | undefined): Promise<void> {
  if (!botName) {
    console.error('❌ Error: Bot name is required');
    console.error('Usage: telemeister create-bot <bot-name>');
    process.exit(1);
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(botName)) {
    console.error(
      '❌ Error: Bot name must start with a letter and contain only letters, numbers, underscores, and hyphens'
    );
    process.exit(1);
  }

  const pm = getPackageManager();
  const pmInstall = pm === 'pnpm' ? 'pnpm install' : 'npm install';
  const pmRun = pm === 'pnpm' ? 'pnpm run' : 'npm run';

  const targetDir = path.resolve(process.cwd(), botName);

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
    renderTemplate('package.json.ejs', { botName, telemeisterVersion: getPackageVersion() })
  );

  // Sync handlers and types from bot.json
  process.chdir(targetDir);
  await stateSync();

  // Run automated setup commands
  console.log('\n📦 Installing dependencies...');
  try {
    execSync(pmInstall, { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
  } catch {
    console.error(`❌ Failed to install dependencies. Please run "${pmInstall}" manually.\n`);
    process.exit(1);
  }

  const tempDbUrl = 'file:./dev.db';

  console.log('🗄️  Generating Prisma client...');
  try {
    execSync(`${pmRun} db:generate`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: tempDbUrl },
    });
    console.log('✅ Prisma client generated\n');
  } catch {
    console.error(
      `❌ Failed to generate Prisma client. Please run "${pmRun} db:generate" manually.\n`
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
      `❌ Failed to create database migration. Please run "${pmRun} db:migrate" manually.\n`
    );
    process.exit(1);
  }

  console.log(`✅ Bot "${botName}" created successfully!\n`);
  console.log('Next steps:');
  console.log(`  cd ${botName}`);
  console.log('  cp .env.example .env  # Add your bot token from @BotFather');
  console.log(`  ${pmRun} dev`);
}
