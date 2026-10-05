import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session, safeReturn } from '../../core/auth/session';
export const qualityCodes = [
  'QUALITY_READ',
  'QUALITY_MANAGE',
  'QUALITY_APPROVE',
  'INSPECTION_MANAGE',
  'MAINTENANCE_MANAGE',
  'QUALITY_RELEASE',
  'REPAIR_DISPATCH',
];
@Injectable({ providedIn: 'root' })
export class QualityAccess {
  readonly session = inject(Session);
  can(code: string, yard?: string | null) {
    return this.session.can(code) || (!!yard && this.session.can(code, yard));
  }
  global(code: string) {
    return this.session.can(code);
  }
  any(code: string) {
    return (
      this.session.can(code) ||
      !!this.session.context()?.yards.some((y) => y.active && y.permissions.includes(code))
    );
  }
}
export const qualityGuard: CanActivateFn = async (route, state) => {
  const access = inject(QualityAccess),
    router = inject(Router),
    session = access.session;
  if (!session.valid())
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturn(state.url) } });
  try {
    await session.refresh();
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { validation: 'retry', returnUrl: safeReturn(state.url) },
    });
  }
  return (route.data['global'] ? access.global('QUALITY_READ') : access.any('QUALITY_READ'))
    ? true
    : router.createUrlTree(['/sin-acceso']);
};
