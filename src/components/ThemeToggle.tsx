'use client';

import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Determine initial theme
    const saved = localStorage.getItem('quiet_goals_theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      applyTheme(saved);
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      const initial = prefersLight ? 'light' : 'dark';
      setTheme(initial);
      applyTheme(initial);
    }
  }, []);

  const applyTheme = (t: Theme) => {
    document.documentElement.setAttribute('data-theme', t);
    if (t === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    // Update theme-color meta tag if present
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', t === 'light' ? '#f8f7f9' : '#161518');
    }
  };

  const handleToggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem('quiet_goals_theme', next);
      document.cookie = `quiet_goals_theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore storage errors in restricted contexts
    }
  };

  if (!mounted) {
    return (
      <div className="h-7 w-14 rounded-md bg-surface-hover/30 animate-pulse" />
    );
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="group relative flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      title={isLight ? 'Theme: Light (click for Dark)' : 'Theme: Dark (click for Light)'}
    >
      {isLight ? (
        // Sun Icon
        <svg
          className="h-3.5 w-3.5 stroke-[2] text-gold"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        // Moon Icon
        <svg
          className="h-3.5 w-3.5 stroke-[2] text-text-muted group-hover:text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      )}
      <span
        className={`font-mono text-[11px] transition-colors ${
          isLight ? 'text-gold font-medium' : 'text-text-muted group-hover:text-text-secondary'
        }`}
      >
        {isLight ? 'light' : 'dark'}
      </span>
    </button>
  );
}
