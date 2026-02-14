#!/usr/bin/env node

/**
 * Telemeister CLI Entry Point
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, '..', 'dist', 'cli', 'cli.js');

import(cliPath).catch((err) => {
  console.error('Failed to load CLI:', err.message);
  process.exit(1);
});
