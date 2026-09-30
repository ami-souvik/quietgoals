'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { AgentSettingsModal } from '@/components/AgentSettingsModal';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface AccountMenuProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AccountMenu({ user }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-border bg-surface text-[11px] font-medium text-text-secondary hover:border-border-subtle hover:bg-surface-hover hover:text-text-primary transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
        aria-label="Account menu"
        aria-expanded={isOpen}
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={28}
            height={28}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="leading-none text-text-primary">{initial}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-surface p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-2 border-b border-border/60">
            <p className="truncate text-xs font-medium text-text-primary">
              {displayName}
            </p>
            {user?.email && (
              <p className="truncate text-[11px] text-text-muted mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          <div className="py-1 border-b border-border/40">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setIsSettingsOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
            >
              <span>Agent access</span>
              <span className="text-[10px] font-mono text-text-muted">settings</span>
            </button>
          </div>

          <div className="mt-1">
            <button
              onClick={async () => {
                await signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push('/login');
                    }
                  }
                });
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-text-secondary hover:bg-surface-hover hover:text-ember transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember"
            >
              <span>Sign out</span>
              <svg
                className="h-3.5 w-3.5 stroke-[1.8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Agent Access Settings Modal */}
      <AgentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
