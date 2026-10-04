import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { Api } from '../http/api';
import { Session, isApiUrl, safeReturn } from './session';

describe('Session boundaries', () => {
  const company = { uuid: 'company', name: 'TraceCore', timezone: 'UTC', active: true };
  const context = {
    company,
    companyPermissions: ['YARD_MANAGE'],
    yards: [{ uuid: 'yard-a', permissions: ['YARD_READ'] }],
  };
  let api: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };
  let router: { url: string; navigate: ReturnType<typeof vi.fn> };
  let dialogs: { closeAll: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
    sessionStorage.clear();
    api = {
      get: vi.fn(async (p: string) =>
        p === '/auth/context' ? context : { uuid: 'user', name: 'Ana' },
      ),
      post: vi.fn(),
    };
    router = { url: '/acceso/usuarios', navigate: vi.fn(async () => true) };
    dialogs = { closeAll: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: Api, useValue: api },
        { provide: Router, useValue: router },
        { provide: Dialog, useValue: dialogs },
      ],
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    sessionStorage.clear();
  });
  function restore(expiresAt = '2026-10-03T12:15:00Z') {
    sessionStorage.setItem('tracecore.session', JSON.stringify({ token: 'test-token', expiresAt }));
    return TestBed.inject(Session);
  }
  it('restores a future token but exposes no profile or permissions until validation', async () => {
    const s = restore();
    expect(s.valid()).toBe(true);
    expect(s.context()).toBeNull();
    expect(s.can('YARD_MANAGE')).toBe(false);
    await s.refresh();
    expect(s.can('YARD_MANAGE')).toBe(true);
    expect(s.user()?.uuid).toBe('user');
  });
  it('discards expired or corrupt storage', () => {
    const s = restore('2026-10-03T11:59:59Z');
    expect(s.token()).toBeNull();
    expect(sessionStorage.getItem('tracecore.session')).toBeNull();
  });
  it('does not inherit company capacities into yards', async () => {
    const s = restore();
    await s.refresh();
    expect(s.can('YARD_MANAGE', 'yard-a')).toBe(false);
    expect(s.can('YARD_READ', 'yard-a')).toBe(true);
    expect(s.can('YARD_READ', 'yard-b')).toBe(false);
  });
  it('coalesces concurrent validations', async () => {
    const s = restore();
    await Promise.all([s.refresh(), s.refresh()]);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
  it('expires locally, removes storage and closes protected dialogs', async () => {
    const s = restore('2026-10-03T12:00:01Z');
    await vi.advanceTimersByTimeAsync(1001);
    expect(s.valid()).toBe(false);
    expect(dialogs.closeAll).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/acceso/usuarios' },
    });
  });
  it('rejects a late validation result after the session changes', async () => {
    let complete!: (value: unknown) => void;
    api.get.mockImplementation((p: string) =>
      p === '/auth/context'
        ? new Promise((r) => (complete = r))
        : Promise.resolve({ uuid: 'user' }),
    );
    const s = restore();
    const pending = s.refresh();
    s.logout();
    complete(context);
    await expect(pending).rejects.toThrow('Session changed');
    expect(s.context()).toBeNull();
  });
});

describe('Safe navigation and API targets', () => {
  it('keeps existing internal routes', () => {
    expect(safeReturn('/acceso/usuarios')).toBe('/acceso/usuarios');
  });
  it.each(['//evil.test', 'https://evil.test', '/login', '/unknown', '/\\evil.test', '/inicio\n'])(
    'rejects %s',
    (value) => {
      expect(safeReturn(value)).toBe('/inicio');
    },
  );
  it('requires both origin and route boundaries for Bearer', () => {
    expect(isApiUrl('/api/v1/company', '/api/v1', 'https://trace.test')).toBe(true);
    expect(isApiUrl('https://evil.test/api/v1/company', '/api/v1', 'https://trace.test')).toBe(
      false,
    );
    expect(isApiUrl('/api/v10/company', '/api/v1', 'https://trace.test')).toBe(false);
    expect(isApiUrl('/assets/brand/logo.svg', '/api/v1', 'https://trace.test')).toBe(false);
  });
});
