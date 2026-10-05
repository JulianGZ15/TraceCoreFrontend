import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session, safeReturn } from '../../core/auth/session';
export const rfidCodes=['RFID_READ','RFID_SCAN','RFID_TAG_MANAGE','RFID_DEVICE_MANAGE'];
@Injectable({ providedIn: 'root' })
export class RfidAccess {
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
export const rfidGuard: CanActivateFn = async (route, state) => {
  const access = inject(RfidAccess),
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
  const required = route.data['admin'] ? 'RFID_DEVICE_MANAGE' : 'RFID_READ';
  return (route.data['global'] ? access.global(required) : access.any(required))
    ? true
    : router.createUrlTree(['/sin-acceso']);
};
