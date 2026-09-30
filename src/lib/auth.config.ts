import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicPage =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/design-md');

      if (!isLoggedIn && !isPublicPage) {
        return false;
      }

      if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
};
