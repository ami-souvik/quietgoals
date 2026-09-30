import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000', // adjust backend url as needed
  plugins: [
    expoClient({
      scheme: 'quietgoals',
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
