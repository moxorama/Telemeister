#!/usr/bin/env node

/**
 * Telemeister CLI Entry Point
 * Uses bundled CLI with all dependencies included
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cliPath = join(__dirname, 'telemeister-cli.js');

import(cliPath).catch((err) => {
  console.error('Failed to load CLI:', err.message);
  process.exit(1);
});
