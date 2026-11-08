/**
 * The API for the browser e2e tests (frontend/e2e, Playwright): a fresh _test database, then the app on port 3100.
 * Built into dist-e2e/, so a running `npm run start:dev` (dist/, port 3000, dev database) is never touched.
 * Run by Playwright's webServer; by hand: `npm run e2e:browser-server`.
 */
import 'dotenv/config';
import { execSync, spawn } from 'node:child_process';
import setup from './global-setup.js';

const PORT = process.env.E2E_API_PORT ?? '3100';

await setup(); // wipes, migrates and seeds TEST_DATABASE_URL (refuses unless it ends in _test)
execSync('npx tsc -p tsconfig.build.json --outDir dist-e2e', { stdio: 'inherit' });

const server = spawn(process.execPath, ['dist-e2e/main.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    PORT,
    FRONTEND_ORIGIN: process.env.E2E_WEB_ORIGIN ?? 'http://localhost:5180',
    LOGIN_RATE_LIMIT: '1000', // the specs sign in far more often than a person
    GLOBAL_RATE_LIMIT: '100000',
    SWAGGER: 'false',
    NODE_ENV: 'test', // cookie without Secure: the tests run over plain http://localhost
  },
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.kill(signal));
server.on('exit', (code) => process.exit(code ?? 0));
