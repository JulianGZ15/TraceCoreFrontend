import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Session, safeReturn } from './session';

export const accessGuard: CanActivateFn = async (route, state) => {
  const session = inject(Session),
    router = inject(Router);
  if (!session.valid())
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: safeReturn(state.url) } });
  try {
    await session.refresh();
  } catch {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: safeReturn(state.url), validation: 'retry' },
    });
  }
  const permission = route.data['permission'] as string | undefined;
  if (permission && !session.can(permission)) return router.createUrlTree(['/sin-acceso']);
  if (
    route.data['yard'] &&
    !session.can('YARD_MANAGE') &&
    !session.can('YARD_READ', route.paramMap.get('uuid') ?? '')
  )
    return router.createUrlTree(['/sin-acceso']);
  if (route.data['home'] && !session.hasAccess()) return router.createUrlTree(['/sin-acceso']);
  return true;
};
