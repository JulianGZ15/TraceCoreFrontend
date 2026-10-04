import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { Session } from '../auth/session';
import { authInterceptor } from './auth-interceptor';

describe('Bearer and status handling', () => {
  let http: HttpClient, controller: HttpTestingController;
  const session = {
    token: signal('test-token'),
    epoch: signal(1),
    ended: new Subject<void>(),
    logout: vi.fn(),
    invalidateContext: vi.fn(async () => {}),
  };
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Session, useValue: session },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });
  afterEach(() => controller.verify());
  it('sends Bearer only to protected API requests', () => {
    for (const url of [
      '/api/v1/company',
      '/api/v1/auth/login',
      '/assets/logo.svg',
      'https://other.test/api/v1/company',
    ]) {
      http.get(url).subscribe();
      const request = controller.expectOne(url);
      expect(request.request.headers.get('Authorization')).toBe(
        url === '/api/v1/company' ? 'Bearer test-token' : null,
      );
      request.flush({});
    }
  });
  it('logs out on a protected 401', () => {
    http.get('/api/v1/company').subscribe({ error: () => {} });
    controller.expectOne('/api/v1/company').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.logout).toHaveBeenCalledOnce();
  });
  it('keeps the session on a login 401', () => {
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => {} });
    controller
      .expectOne('/api/v1/auth/login')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(session.logout).not.toHaveBeenCalled();
  });
  it('refreshes context once for a denied resource without logging out', () => {
    http.get('/api/v1/company').subscribe({ error: () => {} });
    controller.expectOne('/api/v1/company').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(session.invalidateContext).toHaveBeenCalledOnce();
    expect(session.logout).not.toHaveBeenCalled();
  });
  it('does not recurse when context itself is denied', () => {
    http.get('/api/v1/auth/context').subscribe({ error: () => {} });
    controller
      .expectOne('/api/v1/auth/context')
      .flush({}, { status: 403, statusText: 'Forbidden' });
    expect(session.invalidateContext).not.toHaveBeenCalled();
  });
});
