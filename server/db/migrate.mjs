import fs from 'node:fs/promises';
import pg from 'pg';
import { readEnv } from '../lib/env.mjs';

const { Client } = pg;
const env = readEnv();

if (!env.databaseUrl) {
  console.error('DATABASE_URL is required to run migrations.');
  process.exit(1);
}

const client = new Client({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

try {
  const schema = await fs.readFile('server/db/schema.sql', 'utf8');
  await client.connect();
  await client.query(schema);
  console.log('Database migration completed.');
} finally {
  await client.end();
}
