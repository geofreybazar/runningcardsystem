import 'dotenv/config';
import { execSync } from 'node:child_process';
import pg from 'pg';

// Fresh test database on every run (the user approved wiping it): drop the schema, migrate, seed.
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set');
  const dbName = new URL(url).pathname.slice(1);
  // Guard: never wipe anything that isn't clearly a test database.
  if (!dbName.endsWith('_test')) throw new Error(`Refusing to wipe "${dbName}": test database name must end in _test`);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await client.end();

  const env = {
    ...process.env,
    DATABASE_URL: url,
    SUPERADMIN_USERNAME: 'superadmin',
    SUPERADMIN_PASSWORD: 'Initial-pass-1',
    SEED_PLACEHOLDER_TRUCKS: 'true',
  };
  execSync('npx prisma migrate deploy', { env, stdio: 'ignore' });
  execSync('npx prisma db seed', { env, stdio: 'ignore' });
}
