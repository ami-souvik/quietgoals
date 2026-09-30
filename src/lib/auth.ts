import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/lib/db';
import * as schema from '@/db/schema';
import { nextCookies } from 'better-auth/next-js';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { expo } from '@better-auth/expo';

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

export const hasGoogleConfigured = !!(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema,
  }),
  plugins: [nextCookies(), expo()],
  socialProviders: {
    ...(hasGoogleConfigured
      ? {
          google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
          },
        }
      : {}),
  },
  // Add a simple email/password for local dev testing if needed
  emailAndPassword: {
    enabled: true,
  },
});

export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user;
}
