import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });
config();

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error('TURSO_DATABASE_URL is missing in drizzle.config.ts');
}

const isLocal = url.startsWith('file:');

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: isLocal ? 'sqlite' : 'turso',
  dbCredentials: isLocal
    ? { url }
    : {
        url,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
});
