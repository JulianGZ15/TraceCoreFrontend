import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';
import { vi } from 'vitest';
import { Session } from './session';
import { accessGuard } from './guards';
describe('Route authorization', () => {
  const session = { valid: vi.fn(), refresh: vi.fn(), can: vi.fn(), hasAccess: vi.fn() };
  beforeEach(() => {
    vi.resetAllMocks();
    session.valid.mockReturnValue(true);
    session.refresh.mockResolvedValue(undefined);
    session.hasAccess.mockReturnValue(true);
    session.can.mockReturnValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: Session, useValue: session },
        {
          provide: Router,
          useValue: { createUrlTree: (path: string[], options: unknown) => ({ path, options }) },
        },
      ],
    });
  });
  const guard = (data: Record<string, unknown>, uuid?: string) =>
    TestBed.runInInjectionContext(() =>
      accessGuard(
        { data, paramMap: convertToParamMap(uuid ? { uuid } : {}) } as ActivatedRouteSnapshot,
        { url: '/acceso/usuarios' } as RouterStateSnapshot,
      ),
    );
  it('sends anonymous direct access through login with a safe return', async () => {
    session.valid.mockReturnValue(false);
    expect(await guard({})).toMatchObject({
      path: ['/login'],
      options: { queryParams: { returnUrl: '/acceso/usuarios' } },
    });
    expect(session.refresh).not.toHaveBeenCalled();
  });
  it('allows account access without assignments', async () => {
    session.hasAccess.mockReturnValue(false);
    expect(await guard({})).toBe(true);
  });
  it('denies home to a user with no available capabilities', async () => {
    session.hasAccess.mockReturnValue(false);
    expect(await guard({ home: true })).toMatchObject({ path: ['/sin-acceso'] });
  });
  it('requires the specific company capability', async () => {
    expect(await guard({ permission: 'ACCESS_MANAGE' })).toMatchObject({ path: ['/sin-acceso'] });
    session.can.mockImplementation((p) => p === 'ACCESS_MANAGE');
    expect(await guard({ permission: 'ACCESS_MANAGE' })).toBe(true);
  });
  it('checks the UUID of the requested yard', async () => {
    session.can.mockImplementation((p, y) => p === 'YARD_READ' && y === 'yard-a');
    expect(await guard({ yard: true }, 'yard-a')).toBe(true);
    expect(await guard({ yard: true }, 'yard-b')).toMatchObject({ path: ['/sin-acceso'] });
  });
  it('permits an explicit company yard administrator', async () => {
    session.can.mockImplementation((p) => p === 'YARD_MANAGE');
    expect(await guard({ yard: true }, 'yard-a')).toBe(true);
  });
  it('does not show protected content if validation fails', async () => {
    session.refresh.mockRejectedValue(new Error('offline'));
    expect(await guard({})).toMatchObject({
      path: ['/login'],
      options: { queryParams: { validation: 'retry' } },
    });
  });
});
