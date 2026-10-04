import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, takeUntil, throwError } from 'rxjs';
import { API_BASE } from './api';
import { Session, isApiUrl } from '../auth/session';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(Session),
    base = inject(API_BASE);
  const ours = isApiUrl(request.url, base, window.location.origin);
  const path = new URL(request.url, window.location.origin).pathname;
  const login =
    path === new URL(base, window.location.origin).pathname.replace(/\/$/, '') + '/auth/login';
  const epoch = session.epoch();
  const authenticated = ours && !login && !!session.token();
  if (authenticated)
    request = request.clone({ setHeaders: { Authorization: 'Bearer ' + session.token() } });
  const response = next(request).pipe(
    catchError((error) => {
      if (authenticated && epoch === session.epoch() && error instanceof HttpErrorResponse) {
        if (error.status === 401)
          session.logout('Tu sesión finalizó. Inicia sesión de nuevo.', true);
        if (error.status === 403 && !path.endsWith('/auth/context') && !path.endsWith('/auth/me'))
          void session.invalidateContext().catch(() => {});
      }
      return throwError(() => error);
    }),
  );
  return authenticated ? response.pipe(takeUntil(session.ended)) : response;
};
