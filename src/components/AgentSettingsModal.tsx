'use client';

import { useEffect, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  generateAgentToken,
  getAgentTokenStatus,
  revokeAgentToken,
  type AgentTokenStatus,
} from '@/app/actions/agent';

interface AgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentSettingsModal({ isOpen, onClose }: AgentSettingsModalProps) {
  const [status, setStatus] = useState<AgentTokenStatus | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    getAgentTokenStatus()
      .then((res) => {
        if (isMounted) {
          setStatus(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load token status:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    setGeneratedToken(null);
    setCopied(false);
    setError(null);
    onClose();
  };

  const handleToggle = () => {
    setError(null);
    if (status?.hasActiveToken || generatedToken) {
      // Switch OFF -> Revoke
      startTransition(async () => {
        const res = await revokeAgentToken();
        if (res.success) {
          setStatus({ hasActiveToken: false });
          setGeneratedToken(null);
        } else {
          setError(res.error || 'Failed to revoke token');
        }
      });
    } else {
      // Switch ON -> Generate token
      startTransition(async () => {
        const res = await generateAgentToken();
        if (res.success && res.token) {
          setGeneratedToken(res.token);
          setStatus({ hasActiveToken: true, createdAt: res.createdAt });
        } else {
          setError(res.error || 'Failed to generate token');
        }
      });
    }
  };

  const handleCopy = () => {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAccessEnabled = Boolean(status?.hasActiveToken || generatedToken);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Agent Access Settings"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="relative w-full max-w-[440px] rounded-xl border border-border bg-surface p-6 shadow-2xl z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="space-y-0.5">
                <h2 className="text-sm font-semibold tracking-tight text-text-primary">
                  Settings · Agent Access
                </h2>
                <p className="text-[11px] text-text-muted">
                  Allow external AI agents to read and manage your goals via MCP.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                aria-label="Close settings"
                className="flex items-center justify-center h-6 w-6 rounded text-text-muted hover:text-text-primary hover:bg-surface-active transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>

            {/* Toggle Area */}
            <div className="mt-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="agent-access-switch"
                    className="text-xs font-medium text-text-primary cursor-pointer"
                  >
                    Agent access
                  </label>
                  <p className="text-[11px] text-text-muted">
                    {isAccessEnabled
                      ? 'Token authentication is active'
                      : 'Disabled — external agents cannot access goals'}
                  </p>
                </div>

                {/* Switch button */}
                <button
                  id="agent-access-switch"
                  type="button"
                  role="switch"
                  aria-checked={isAccessEnabled}
                  disabled={isPending}
                  onClick={handleToggle}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50 ${
                    isAccessEnabled ? 'bg-gold' : 'bg-surface-active border border-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform ${
                      isAccessEnabled ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-ember-muted/15 border border-ember/30 text-xs text-ember">
                  {error}
                </div>
              )}

              {/* Newly Generated Token View (Shown Once) */}
              {generatedToken && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg border border-gold/40 bg-gold-muted/10 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gold font-medium">
                      Personal API Token
                    </span>
                    <span className="text-[10px] text-text-muted font-mono">
                      Shown once
                    </span>
                  </div>

                  <p className="text-[11px] text-text-secondary leading-relaxed">
                    Save this token now. It is stored securely hashed (SHA-256) and cannot be shown again.
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedToken}
                      className="flex-1 rounded border border-border bg-bg/90 px-2.5 py-1.5 font-mono text-[11px] text-gold select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="shrink-0 flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1.5 text-xs font-mono text-text-primary hover:bg-surface-hover hover:border-gold/50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-gold"
                    >
                      <span>{copied ? 'copied!' : 'copy'}</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Active Token Details & Revoke button */}
              {isAccessEnabled && (
                <div className="rounded-lg border border-border bg-bg/40 p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-mono text-[11px]">
                      MCP Endpoint
                    </span>
                    <code className="text-text-primary font-mono text-[11px] bg-surface px-1.5 py-0.5 rounded border border-border/80">
                      /api/mcp
                    </code>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted font-mono text-[11px]">
                      Rate Limit
                    </span>
                    <span className="text-text-secondary font-mono text-[11px]">
                      60 req / min
                    </span>
                  </div>

                  {status?.lastUsedAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-mono text-[11px]">
                        Last used
                      </span>
                      <span className="text-text-secondary font-mono text-[11px]">
                        {new Date(status.lastUsedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] text-text-muted">
                      Need to invalidate access?
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleToggle}
                      className="text-xs font-mono text-ember hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ember rounded px-1.5 py-0.5 disabled:opacity-50"
                    >
                      Revoke token
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between text-[11px] text-text-muted">
                <span>Want to connect Claude, Cursor, or IDEs?</span>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline font-mono"
                >
                  View documentation →
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
