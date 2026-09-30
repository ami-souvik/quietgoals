import { config } from 'dotenv';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/db/schema';

// Load .env.local and .env if not already loaded (e.g. In script/CLI contexts)
if (!process.env.TURSO_DATABASE_URL) {
  config({ path: '.env.local' });
  config();
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('TURSO_DATABASE_URL environment variable is missing.');
}

if (!url.startsWith('file:') && !authToken) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is missing for remote Turso connection.');
}

export const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });
