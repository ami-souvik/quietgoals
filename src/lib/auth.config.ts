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
      const isLoginPage = nextUrl.pathname.startsWith('/login');

      if (!isLoggedIn && !isLoginPage) {
        return false;
      }

      if (isLoggedIn && isLoginPage) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
};
