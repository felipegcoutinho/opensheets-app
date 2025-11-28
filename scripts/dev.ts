#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const port = process.env.PORT || '3000';

console.log(`Starting Next.js development server on port ${port}...`);

// Executar next dev com a porta especificada
execSync(`npx next dev --turbopack --port ${port}`, {
  stdio: 'inherit',
  env: { ...process.env, PORT: port }
});