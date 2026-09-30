import { authClient } from './auth-client';

const getBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
};

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const baseUrl = getBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  let cookie: string | undefined;
  try {
    cookie = await authClient.getCookie();
  } catch (err) {
    console.warn('[API] Could not get session cookie:', err);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cookie ? { cookie } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  return fetch(url, {
    ...options,
    headers,
  });
}
