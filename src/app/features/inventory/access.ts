import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session, safeReturn } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class InventoryAccess {
  readonly session = inject(Session);
  can(code: string, yard?: string | null) {
    return this.session.can(code) || (!!yard && this.session.can(code, yard));
  }
  any(code: string) {
    return (
      this.session.can(code) ||
      !!this.session.context()?.yards.some((y) => y.permissions.includes(code))
    );
  }
  readonly global = (code: string) => this.session.can(code);
}
export const inventoryGuard: CanActivateFn = async (route, state) => {
  const access = inject(InventoryAccess),
    router = inject(Router),
    session = access.session;
  if (
    route.paramMap.has('section') &&
    !['actual', 'ubicacion', 'custodia', 'disponibilidad'].includes(route.paramMap.get('section')!)
  )
    return router.createUrlTree(['/inventario/equipos']);
  if (!session.valid())
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturn(state.url) } });
  try {
    await session.refresh();
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: safeReturn(state.url), validation: 'retry' },
    });
  }
  return (route.data['global'] ? access.global('INVENTORY_READ') : access.any('INVENTORY_READ'))
    ? true
    : router.createUrlTree(['/sin-acceso']);
};
