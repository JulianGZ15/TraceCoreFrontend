import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { QueryAccess } from '../queries/access';
const receipts = () => {
  const a = inject(QueryAccess);
  return (
    (a.session.can('SUPPORT_READ') && a.any('QUERY_READ') && a.any('RFID_READ')) ||
    inject(Router).createUrlTree(['/sin-acceso'])
  );
};
const audit = () => inject(QueryAccess).audit() || inject(Router).createUrlTree(['/sin-acceso']);
export const supportRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => (inject(QueryAccess).audit() ? 'auditoria' : 'recibos-rfid'),
  },
  {
    path: 'recibos-rfid',
    canActivate: [receipts],
    loadComponent: () =>
      import('./pages/receipts/receipts.component').then((m) => m.ReceiptsComponent),
  },
  {
    path: 'auditoria',
    canActivate: [audit],
    loadComponent: () => import('./pages/audit/audit.component').then((m) => m.AuditComponent),
  },
];
