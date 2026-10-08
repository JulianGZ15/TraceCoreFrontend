import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ActivityState, withActivity } from './loading-state';

describe('ActivityState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks busy immediately, but keeps visible false before 150ms', () => {
    const activity = new ActivityState(150);
    expect(activity.busy()).toBe(false);
    expect(activity.visible()).toBe(false);

    activity.setBusy(true);
    expect(activity.busy()).toBe(true);
    expect(activity.visible()).toBe(false);

    vi.advanceTimersByTime(100);
    expect(activity.busy()).toBe(true);
    expect(activity.visible()).toBe(false);

    vi.advanceTimersByTime(50);
    expect(activity.busy()).toBe(true);
    expect(activity.visible()).toBe(true);
  });

  it('turns visible off immediately when busy finishes early', () => {
    const activity = new ActivityState(150);
    activity.setBusy(true);
    vi.advanceTimersByTime(80);
    expect(activity.visible()).toBe(false);

    activity.setBusy(false);
    expect(activity.busy()).toBe(false);
    expect(activity.visible()).toBe(false);

    vi.advanceTimersByTime(200);
    expect(activity.visible()).toBe(false);
  });

  it('turns visible off immediately when an active operation ends after delay', () => {
    const activity = new ActivityState(150);
    activity.setBusy(true);
    vi.advanceTimersByTime(150);
    expect(activity.visible()).toBe(true);

    activity.setBusy(false);
    expect(activity.busy()).toBe(false);
    expect(activity.visible()).toBe(false);
  });

  it('tracks async work with withActivity', async () => {
    const activity = new ActivityState(150);
    let resolved = false;

    const promise = withActivity(activity, async () => {
      await new Promise((r) => setTimeout(r, 300));
      resolved = true;
      return 'done';
    });

    expect(activity.busy()).toBe(true);
    expect(activity.visible()).toBe(false);

    vi.advanceTimersByTime(150);
    expect(activity.visible()).toBe(true);

    vi.advanceTimersByTime(150);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(resolved).toBe(true);
    expect(result).toBe('done');
    expect(activity.busy()).toBe(false);
    expect(activity.visible()).toBe(false);
  });
});
