import { signal, DestroyRef, inject, Signal, effect } from '@angular/core';

/**
 * Activity state manager that decouples the logical `busy` state from
 * the visual presentation `visible` state with a 150ms delay.
 * - Logical busy state is immediate (locks buttons, prevents duplicate requests).
 * - Visual indicator state becomes true only if busy remains true after 150ms.
 * - When busy turns false, visual indicator state turns false immediately (no artificial minimum).
 */
export class ActivityState {
  private readonly _busy = signal(false);
  private readonly _visible = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly delayMs: number;

  constructor(delayMs = 150) {
    this.delayMs = delayMs;
  }

  readonly busy = this._busy.asReadonly();
  readonly visible = this._visible.asReadonly();

  setBusy(busy: boolean): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this._busy.set(busy);

    if (busy) {
      this.timer = setTimeout(() => {
        if (this._busy()) {
          this._visible.set(true);
        }
        this.timer = null;
      }, this.delayMs);
    } else {
      this._visible.set(false);
    }
  }

  destroy(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._busy.set(false);
    this._visible.set(false);
  }
}

/**
 * Helper to wrap an async action, automatically tracking busy and visible states.
 */
export async function withActivity<T>(
  activity: ActivityState,
  fn: () => Promise<T>,
): Promise<T> {
  activity.setBusy(true);
  try {
    return await fn();
  } finally {
    activity.setBusy(false);
  }
}

/**
 * Hooks a delay to any boolean signal.
 */
export function createDelayedSignal(
  source: Signal<boolean>,
  delayMs = 150,
  destroyRef?: DestroyRef,
): Signal<boolean> {
  const visible = signal(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const ref = destroyRef ?? inject(DestroyRef, { optional: true });

  const stop = effect(() => {
    const isBusy = source();
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    if (isBusy) {
      timer = setTimeout(() => {
        if (source()) {
          visible.set(true);
        }
        timer = null;
      }, delayMs);
    } else {
      visible.set(false);
    }
  });

  ref?.onDestroy(() => {
    stop.destroy();
    if (timer !== null) {
      clearTimeout(timer);
    }
  });

  return visible.asReadonly();
}
