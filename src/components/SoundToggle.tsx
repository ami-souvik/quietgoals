'use client';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="group relative flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
      aria-label={enabled ? 'Mute sound' : 'Enable sound'}
      aria-pressed={enabled}
      title={enabled ? 'Sound: On' : 'Sound: Off'}
    >
      {enabled ? (
        <svg
          className="h-3.5 w-3.5 stroke-[2] text-gold"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9c0-.414.336-.75.75-.75h2.24z"
          />
        </svg>
      ) : (
        <svg
          className="h-3.5 w-3.5 stroke-[2] text-text-muted group-hover:text-text-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.414 0-.75-.336-.75-.75V9c0-.414.336-.75.75-.75h2.24z"
          />
        </svg>
      )}
      <span
        className={`tabular-nums font-mono text-[11px] transition-colors ${
          enabled ? 'text-gold font-medium' : 'text-text-muted group-hover:text-text-secondary'
        }`}
      >
        {enabled ? 'on' : 'off'}
      </span>
    </button>
  );
}
