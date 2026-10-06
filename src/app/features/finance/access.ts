import { Injectable, inject } from '@angular/core';
import { CanActivateFn, CanDeactivateFn, Router } from '@angular/router';
import { Session } from '../../core/auth/session';
@Injectable({ providedIn: 'root' })
export class FinanceAccess {
  readonly session = inject(Session);
  can(code: string) {
    return this.session.can(code);
  }
  read() {
    return this.can('FINANCE_READ');
  }
}
export const financeGuard: CanActivateFn = () =>
  inject(FinanceAccess).read() || inject(Router).createUrlTree(['/sin-acceso']);
export const financeDiscard: CanDeactivateFn<{ dirty?: () => boolean }> = (c) =>
  !inject(Session).valid() || !c.dirty?.() || window.confirm('¿Descartar los cambios sin guardar?');
