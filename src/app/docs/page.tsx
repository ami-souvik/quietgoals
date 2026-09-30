'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AgentDocsPage() {
  const [activeTab, setActiveTab] = useState<'claude' | 'cursor' | 'curl'>('claude');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const claudeConfig = `{
  "mcpServers": {
    "quiet-goals": {
      "url": "https://quietgoals.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer qg_live_YOUR_TOKEN"
      }
    }
  }
}`;

  const cursorConfig = `{
  "mcpServers": {
    "quiet-goals": {
      "url": "https://quietgoals.vercel.app/api/mcp",
      "headers": {
        "Authorization": "Bearer qg_live_YOUR_TOKEN"
      }
    }
  }
}`;

  const curlListExample = `curl -X POST "https://quietgoals.vercel.app/api/mcp" \\
  -H "Authorization: Bearer qg_live_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "list_goals",
      "arguments": { "status": "active" }
    }
  }'`;

  const curlAddExample = `curl -X POST "https://quietgoals.vercel.app/api/mcp" \\
  -H "Authorization: Bearer qg_live_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "add_goal",
      "arguments": {
        "title": "Ship v1 launch announcement",
        "priority": "high"
      }
    }
  }'`;

  return (
    <div className="min-h-screen bg-bg text-text-primary px-4 py-8 sm:py-16 selection:bg-gold/20 selection:text-gold font-sans">
      <div className="mx-auto w-full max-w-[720px] space-y-12">
        {/* Navigation / Header */}
        <header className="space-y-4 border-b border-border/80 pb-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xs font-mono text-text-muted hover:text-gold transition-colors inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded px-1 -ml-1"
            >
              <span>←</span>
              <span>Back to Goals</span>
            </Link>

            <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider bg-surface px-2 py-0.5 rounded border border-border">
              MCP v2024-11-05
            </span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary flex items-center gap-2.5">
              <span>Agent Access & MCP</span>
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Connect external AI agents (Claude Desktop, Cursor, Antigravity, Windsurf) to securely manage your goals via the Model Context Protocol.
            </p>
          </div>
        </header>

        {/* Quick Setup Card */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
              1. Get Your Access Token
            </h2>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4 text-xs leading-relaxed text-text-secondary">
            <ol className="list-decimal list-inside space-y-2 text-text-primary marker:text-text-muted">
              <li>
                Click your profile avatar in the top-right corner of <Link href="/" className="text-gold underline underline-offset-2">Quiet Goals</Link>.
              </li>
              <li>
                Select <span className="font-semibold text-text-primary">Agent Access</span> from the menu.
              </li>
              <li>
                Toggle <span className="font-semibold text-text-primary">Agent access</span> to <span className="text-gold font-medium">ON</span>.
              </li>
              <li>
                Copy your generated token (<code className="font-mono text-gold bg-bg px-1.5 py-0.5 rounded border border-border">qg_live_...</code>).
              </li>
            </ol>
            <p className="text-[11px] text-text-muted border-t border-border/60 pt-3">
              🔒 <strong>Security Guarantee:</strong> Tokens are stored using SHA-256 cryptographic hashing. The raw secret is shown only once and cannot be recovered if lost. You can revoke or regenerate your token anytime.
            </p>
          </div>
        </section>

        {/* Configuration Tabs */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
            2. Configure Your Client
          </h2>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border bg-bg/50 px-3 pt-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('claude')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${activeTab === 'claude'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
              >
                Claude Desktop
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cursor')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${activeTab === 'cursor'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
              >
                Cursor / IDEs
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('curl')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors cursor-pointer ${activeTab === 'curl'
                    ? 'border-gold text-gold'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                  }`}
              >
                cURL / HTTP
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 space-y-4">
              {activeTab === 'claude' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary">
                    Add Quiet Goals to your <code className="text-text-primary font-mono bg-bg px-1.5 py-0.5 rounded border border-border">claude_desktop_config.json</code>:
                  </p>
                  <p className="text-[11px] text-text-muted font-mono">
                    macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
                  </p>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-bg border border-border font-mono text-xs text-text-primary overflow-x-auto">
                      {claudeConfig}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(claudeConfig, 'claude')}
                      className="absolute top-2.5 right-2.5 px-2 py-1 bg-surface border border-border text-[11px] font-mono rounded hover:bg-surface-hover hover:border-gold/50 transition-colors text-text-secondary cursor-pointer"
                    >
                      {copiedSnippet === 'claude' ? 'copied!' : 'copy'}
                    </button>
                  </div>
                  <p className="text-xs text-text-muted">
                    After updating the file, fully restart Claude Desktop. The Quiet Goals tools will appear in your chat interface.
                  </p>
                </div>
              )}

              {activeTab === 'cursor' && (
                <div className="space-y-3">
                  <p className="text-xs text-text-secondary">
                    In your Cursor / Windsurf / Antigravity MCP settings (<code className="text-text-primary font-mono bg-bg px-1.5 py-0.5 rounded border border-border">.cursor/mcp.json</code> or global config):
                  </p>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-bg border border-border font-mono text-xs text-text-primary overflow-x-auto">
                      {cursorConfig}
                    </pre>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(cursorConfig, 'cursor')}
                      className="absolute top-2.5 right-2.5 px-2 py-1 bg-surface border border-border text-[11px] font-mono rounded hover:bg-surface-hover hover:border-gold/50 transition-colors text-text-secondary cursor-pointer"
                    >
                      {copiedSnippet === 'cursor' ? 'copied!' : 'copy'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'curl' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-text-primary">List active goals:</span>
                    <div className="relative">
                      <pre className="p-3.5 rounded-lg bg-bg border border-border font-mono text-xs text-text-primary overflow-x-auto">
                        {curlListExample}
                      </pre>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(curlListExample, 'curl-list')}
                        className="absolute top-2.5 right-2.5 px-2 py-1 bg-surface border border-border text-[11px] font-mono rounded hover:bg-surface-hover hover:border-gold/50 transition-colors text-text-secondary cursor-pointer"
                      >
                        {copiedSnippet === 'curl-list' ? 'copied!' : 'copy'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-medium text-text-primary">Add a new goal:</span>
                    <div className="relative">
                      <pre className="p-3.5 rounded-lg bg-bg border border-border font-mono text-xs text-text-primary overflow-x-auto">
                        {curlAddExample}
                      </pre>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(curlAddExample, 'curl-add')}
                        className="absolute top-2.5 right-2.5 px-2 py-1 bg-surface border border-border text-[11px] font-mono rounded hover:bg-surface-hover hover:border-gold/50 transition-colors text-text-secondary cursor-pointer"
                      >
                        {copiedSnippet === 'curl-add' ? 'copied!' : 'copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tools Catalog */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
            3. Available MCP Tools
          </h2>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="divide-y divide-border/60">
              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-medium text-gold">list_goals</code>
                  <span className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">read</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Retrieves user goals ordered by current list position.
                </p>
                <div className="text-[11px] font-mono text-text-muted pt-1">
                  Args: <span className="text-text-primary">status</span> (&apos;active&apos; | &apos;completed&apos; | &apos;killed&apos; | &apos;all&apos;)
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-medium text-gold">add_goal</code>
                  <span className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">write</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Appends a new goal to the active list using fractional indexing.
                </p>
                <div className="text-[11px] font-mono text-text-muted pt-1">
                  Args: <span className="text-text-primary">title*</span> (string, 1-200 chars), <span className="text-text-primary">priority</span> (&apos;none&apos; | &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;)
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-medium text-gold">update_goal</code>
                  <span className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">write</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Modifies the title or priority of an existing goal by ID.
                </p>
                <div className="text-[11px] font-mono text-text-muted pt-1">
                  Args: <span className="text-text-primary">id*</span> (UUID), <span className="text-text-primary">title</span> (string), <span className="text-text-primary">priority</span> (string)
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-medium text-gold">complete_goal</code>
                  <span className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">write</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Marks an active goal as completed and moves it to the archive.
                </p>
                <div className="text-[11px] font-mono text-text-muted pt-1">
                  Args: <span className="text-text-primary">id*</span> (UUID)
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-medium text-gold">kill_goal</code>
                  <span className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">write</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Abandons an active goal and moves it to the archive.
                </p>
                <div className="text-[11px] font-mono text-text-muted pt-1">
                  Args: <span className="text-text-primary">id*</span> (UUID)
                </div>
              </div>

              <div className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono font-medium text-gold">restore_goal</code>
                  <span className="text-[10px] font-mono text-text-muted bg-bg px-1.5 py-0.5 rounded border border-border">write</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Restores an archived goal back into the active list.
                </p>
                <div className="text-[11px] font-mono text-text-muted pt-1">
                  Args: <span className="text-text-primary">id*</span> (UUID)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Specifications & Endpoint Specs */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider font-mono">
            4. Protocol & Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-text-muted font-mono text-[11px]">Endpoint URL</span>
              <div className="font-mono text-text-primary">/api/mcp</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-text-muted font-mono text-[11px]">Transport</span>
              <div className="font-mono text-text-primary">HTTP JSON-RPC 2.0 / SSE</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-text-muted font-mono text-[11px]">Rate Limit</span>
              <div className="font-mono text-text-primary">60 requests / minute</div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface space-y-1">
              <span className="text-text-muted font-mono text-[11px]">User Isolation</span>
              <div className="font-mono text-text-primary">Strict account boundary</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border/80 flex items-center justify-between text-xs text-text-muted">
          <span>Quiet Goals · Minimal Goals App</span>
          <Link href="/" className="hover:text-gold transition-colors">
            Return to app →
          </Link>
        </footer>
      </div>
    </div>
  );
}
