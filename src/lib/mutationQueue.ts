'use client';

export interface QueuedMutation {
  id: string;
  run: () => Promise<{ success: boolean; error?: string; noop?: boolean }>;
  description: string;
  attempts: number;
}

type QueueListener = (queueSize: number, isOnline: boolean) => void;

class MutationQueue {
  private queue: QueuedMutation[] = [];
  private listeners: Set<QueueListener> = new Set();
  private isProcessing = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notify();
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notify();
      });
    }
  }

  public subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.queue.length, this.isOnline);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.queue.length, this.isOnline);
    }
  }

  public async enqueue(
    description: string,
    action: () => Promise<{ success: boolean; error?: string; noop?: boolean }>
  ): Promise<boolean> {
    const mutationId = crypto.randomUUID();

    // If online, attempt execution immediately
    if (this.isOnline) {
      try {
        const result = await action();
        if (result.success) {
          return true;
        }
      } catch (err) {
        console.warn(`Mutation "${description}" failed, queueing for retry:`, err);
      }
    }

    // Queue mutation for retry with backoff
    this.queue.push({
      id: mutationId,
      run: action,
      description,
      attempts: 0,
    });
    this.notify();

    if (this.isOnline) {
      this.processQueue();
    }

    return false;
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.isOnline) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.isOnline) {
      const current = this.queue[0];
      const backoffMs = Math.min(1000 * Math.pow(2, current.attempts), 10000);

      if (current.attempts > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }

      if (!this.isOnline) break;

      try {
        const res = await current.run();
        if (res.success) {
          this.queue.shift();
          this.notify();
        } else {
          current.attempts += 1;
          if (current.attempts >= 10) {
            console.error(
              `Mutation "${current.description}" dropped after 10 attempts.`
            );
            this.queue.shift();
            this.notify();
          }
        }
      } catch (err) {
        console.warn(`Retry failed for "${current.description}":`, err);
        current.attempts += 1;
        if (current.attempts >= 10) {
          console.error(
            `Mutation "${current.description}" dropped after 10 failed attempts.`
          );
          this.queue.shift();
          this.notify();
        } else if (current.attempts >= 5) {
          // Give network breathing room
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    this.isProcessing = false;
  }

  public getStatus() {
    return {
      size: this.queue.length,
      isOnline: this.isOnline,
    };
  }
}

export const mutationQueue = new MutationQueue();
