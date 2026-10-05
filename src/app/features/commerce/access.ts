import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session, safeReturn } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class CommerceAccess {
  readonly session = inject(Session);
  can(code: string, yard?: string) {
    return this.session.can(code) || (!!yard && this.session.can(code, yard));
  }
  any(code: string) {
    return (
      this.session.can(code) ||
      !!this.session.context()?.yards.some((y) => y.active && y.permissions.includes(code))
    );
  }
}
export const commerceGuard: CanActivateFn = async (route, state) => {
  const a = inject(CommerceAccess),
    router = inject(Router);
  if (!a.session.valid())
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturn(state.url) } });
  try {
    await a.session.refresh();
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: safeReturn(state.url), validation: 'retry' },
    });
  }
  return (route.data['global'] ? a.session.can('COMMERCIAL_READ') : a.any('COMMERCIAL_READ'))
    ? true
    : router.createUrlTree(['/sin-acceso']);
};
export const commerceDiscard = (component: { dirty?: () => boolean; session?: Session }) =>
  !component.session?.valid() ||
  !component.dirty?.() ||
  window.confirm('¿Descartar los cambios sin guardar?');
