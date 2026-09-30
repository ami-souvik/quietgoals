'use client';

import { signIn } from '@/lib/auth-client';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | null>(null);

  const handleSignIn = async (provider: 'google') => {
    setLoading(provider);
    await signIn.social({
      provider,
      callbackURL: '/',
    });
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col items-center justify-center px-4 selection:bg-gold/20 selection:text-gold">
      <div className="w-full max-w-[340px] space-y-8 text-center">
        {/* Minimal Wordmark & Copy */}
        <div className="space-y-2">
          <h1 className="text-xl font-medium tracking-tight text-text-primary">
            Quiet Goals
          </h1>
          <p className="text-xs text-text-secondary">
            A single-list, keyboard-first goals app.
          </p>
        </div>

        {/* Two Sign-in Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleSignIn('google')}
            disabled={loading !== null}
            className="group flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 text-xs font-medium text-text-primary hover:bg-surface-hover hover:border-border-subtle active:bg-surface-active transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
