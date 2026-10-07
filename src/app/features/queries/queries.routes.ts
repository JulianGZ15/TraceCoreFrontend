import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { QueryAccess } from './access';
const read = () =>
  inject(QueryAccess).any('QUERY_READ') || inject(Router).createUrlTree(['/sin-acceso']);
export const queryRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'panel' },
  {
    path: 'panel',
    canActivate: [read],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'inventario',
    canActivate: [read],
    loadComponent: () =>
      import('./pages/inventory/inventory.component').then((m) => m.InventoryComponent),
  },
  {
    path: 'ordenes',
    canActivate: [read],
    loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
  },
  ...(['equipos', 'terceros'] as const).flatMap((kind) => [
    { path: kind + '/:uuid', pathMatch: 'full' as const, redirectTo: kind + '/:uuid/resumen' },
    {
      path: kind + '/:uuid/:seccion',
      canActivate: [read],
      data: { entity: kind === 'equipos' ? 'equipment' : 'party' },
      loadComponent: () =>
        import('./pages/dossier/dossier.component').then((m) => m.DossierComponent),
    },
  ]),
];
