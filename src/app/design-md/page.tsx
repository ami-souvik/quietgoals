'use client';

import { useState } from 'react';
import { GoalRow, PriorityIndicator } from '@/components/GoalRow';
import type { Goal } from '@/db/schema';
import { ArchiveCounter } from '@/components/ArchiveCounter';

export default function DesignMdPage() {
  const [priority, setPriority] = useState<'none' | 'low' | 'medium' | 'high'>('none');
  
  const cyclePriority = () => {
    const order = ['none', 'low', 'medium', 'high'] as const;
    const nextIdx = (order.indexOf(priority) + 1) % order.length;
    setPriority(order[nextIdx]);
  };

  const sampleGoal: Goal = {
    id: '1',
    userId: 'test',
    title: 'Sample Goal Title',
    status: 'active',
    priority: priority,
    position: 'a',
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null
  };

  return (
    <main className="min-h-screen bg-bg text-text-primary px-4 py-12 pb-24">
      <div className="max-w-[580px] mx-auto space-y-16">
        <header>
          <h1 className="text-xl font-medium tracking-[-0.02em] mb-2">Design System Preview</h1>
          <p className="text-sm text-text-secondary">Quiet Goals components and tokens</p>
        </header>

        <section className="space-y-6">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">1. Typography</h2>
          <div className="space-y-4">
            <div>
              <div className="text-xl font-medium tracking-[-0.02em]">Heading (20px)</div>
              <div className="text-xs text-text-muted mt-1">Host Grotesk, Medium</div>
            </div>
            <div>
              <div className="text-sm">Body (14px) - Used for goal titles</div>
              <div className="text-xs text-text-muted mt-1">Host Grotesk, Regular</div>
            </div>
            <div>
              <div className="text-xs font-mono tabular-nums text-text-muted">01 02 03</div>
              <div className="text-xs text-text-muted mt-1">Geist Mono, Regular</div>
            </div>
            <div>
              <kbd className="text-[10px] font-mono rounded-sm border border-border bg-surface px-1.5 py-0.5 text-text-muted">Cmd + K</kbd>
              <div className="text-xs text-text-muted mt-1">Hotkeys</div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">2. Components: Priority Indicator</h2>
          <div className="flex gap-4 items-center bg-surface p-4 rounded-lg border border-border">
            <PriorityIndicator priority="none" onClick={() => {}} />
            <PriorityIndicator priority="low" onClick={() => {}} />
            <PriorityIndicator priority="medium" onClick={() => {}} />
            <PriorityIndicator priority="high" onClick={() => {}} />
            <div className="ml-4 text-xs text-text-muted">Static states</div>
          </div>
          <div className="flex gap-4 items-center bg-surface p-4 rounded-lg border border-border">
            <PriorityIndicator priority={priority} onClick={cyclePriority} />
            <div className="ml-4 text-xs text-text-muted">Interactive (click to cycle)</div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">3. Components: Goal Row</h2>
          <div className="space-y-2">
            <div className="text-xs text-text-muted mb-2">Default state</div>
            <GoalRow
              goal={sampleGoal}
              index={0}
              isFocused={false}
              isEditing={false}
              onSelect={() => {}}
              onStartEdit={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
              onCyclePriority={cyclePriority}
              onComplete={() => {}}
              onKill={() => {}}
            />
            
            <div className="text-xs text-text-muted mb-2 mt-4">Focused state</div>
            <GoalRow
              goal={{...sampleGoal, title: 'Focused Goal Row'}}
              index={1}
              isFocused={true}
              isEditing={false}
              onSelect={() => {}}
              onStartEdit={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
              onCyclePriority={cyclePriority}
              onComplete={() => {}}
              onKill={() => {}}
            />

            <div className="text-xs text-text-muted mb-2 mt-4">Editing state</div>
            <GoalRow
              goal={{...sampleGoal, title: 'Editing Goal Row'}}
              index={2}
              isFocused={true}
              isEditing={true}
              onSelect={() => {}}
              onStartEdit={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
              onCyclePriority={cyclePriority}
              onComplete={() => {}}
              onKill={() => {}}
            />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">4. Components: Archive Counter</h2>
          <div className="flex items-center gap-4 bg-surface p-4 rounded-lg border border-border">
            <div className="text-text-muted text-xs font-medium tracking-[0.04em] uppercase flex items-center">
              Active {3} <span className="mx-2 font-normal text-text-muted/50">·</span>
              <ArchiveCounter 
                count={10} 
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider">5. Colors</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-bg border border-border"></div>
              <div className="text-xs text-text-muted">Background</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-surface border border-border"></div>
              <div className="text-xs text-text-muted">Surface</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-surface-hover border border-border"></div>
              <div className="text-xs text-text-muted">Surface Hover</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-surface-active border border-border"></div>
              <div className="text-xs text-text-muted">Surface Active</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gold border border-border"></div>
              <div className="text-xs text-text-muted">Gold</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gold-muted border border-border"></div>
              <div className="text-xs text-text-muted">Gold Muted</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-ember border border-border"></div>
              <div className="text-xs text-text-muted">Ember</div>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-ember-muted border border-border"></div>
              <div className="text-xs text-text-muted">Ember Muted</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
