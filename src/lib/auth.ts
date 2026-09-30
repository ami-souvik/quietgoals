import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { authConfig } from './auth.config';

const googleClientId = process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;

const githubClientId = process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_ID;
const githubClientSecret = process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_SECRET;

export const hasGoogleConfigured = !!(googleClientId && googleClientSecret);
export const hasGitHubConfigured = !!(githubClientId && githubClientSecret);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...(hasGoogleConfigured
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(hasGitHubConfigured
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
    // Fallback provider for local dev if OAuth keys are not configured yet
    Credentials({
      id: 'mock-oauth',
      name: 'Local Dev Sign-In',
      credentials: {
        provider: { label: 'Provider', type: 'text' },
      },
      async authorize(credentials) {
        const provider = (credentials?.provider as string) || 'github';
        if (provider === 'google') {
          return {
            id: 'google_dev_user',
            name: 'Google User',
            email: 'dev.google@quietgoals.local',
            image: null,
          };
        }
        return {
          id: 'github_dev_user',
          name: 'GitHub User',
          email: 'dev.github@quietgoals.local',
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (user && user.email) {
        try {
          const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          if (existing) {
            token.userId = existing.id;
            await db
              .update(users)
              .set({
                name: user.name ?? existing.name,
                image: user.image ?? existing.image,
              })
              .where(eq(users.id, existing.id));
          } else {
            const provider = account?.provider ?? (user.id?.includes('google') ? 'google' : 'github');
            const newUserId =
              account?.providerAccountId
                ? `${provider}_${account.providerAccountId}`
                : user.id || crypto.randomUUID();

            await db.insert(users).values({
              id: newUserId,
              email: user.email,
              name: user.name ?? null,
              image: user.image ?? null,
            });

            token.userId = newUserId;
          }
        } catch (error) {
          console.error('Error upserting user in jwt callback:', error);
          if (user.id) token.userId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  return session.user;
}
