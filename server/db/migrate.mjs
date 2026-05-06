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
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const migrationFiles = (await fs.readdir('server/db/migrations')).filter((file) => file.endsWith('.sql')).sort();

  for (const file of migrationFiles) {
    const applied = await client.query('SELECT id FROM schema_migrations WHERE id = $1', [file]);
    if (applied.rowCount) {
      console.log(`Skipping migration ${file}.`);
      continue;
    }

    const sql = await fs.readFile(`server/db/migrations/${file}`, 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`Applied migration ${file}.`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }

  console.log('Database migrations completed.');
} finally {
  await client.end();
}
