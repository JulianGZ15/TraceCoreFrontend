import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session, safeReturn } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class LogisticsAccess {
  readonly session = inject(Session);
  can(code: string, yard?: string) {
    return this.session.can(code) || (!!yard && this.session.can(code, yard));
  }
  manage(m: import('./models').Manifest) {
    return (
      this.can('LOGISTICS_MANAGE', m.yardUuid) &&
      (!m.sourceYardUuid || this.can('LOGISTICS_MANAGE', m.sourceYardUuid)) &&
      (!m.destinationYardUuid || this.can('LOGISTICS_MANAGE', m.destinationYardUuid))
    );
  }
  receive(m: import('./models').Manifest) {
    return (
      this.can('LOGISTICS_RECEIVE', m.destinationYardUuid ?? m.yardUuid) &&
      this.can('MOVEMENT_MANAGE', m.destinationYardUuid ?? undefined)
    );
  }
  any(code: string) {
    return (
      this.session.can(code) ||
      !!this.session.context()?.yards.some((y) => y.active && y.permissions.includes(code))
    );
  }
}
export const logisticsGuard: CanActivateFn = async (route, state) => {
  const a = inject(LogisticsAccess),
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
  return (route.data['global'] ? a.session.can('LOGISTICS_READ') : a.any('LOGISTICS_READ'))
    ? true
    : router.createUrlTree(['/sin-acceso']);
};
export const logisticsDiscard = (component: { dirty?: () => boolean; session?: Session }) =>
  !component.session?.valid() ||
  !component.dirty?.() ||
  window.confirm('¿Descartar los cambios sin guardar?');
