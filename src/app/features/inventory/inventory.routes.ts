import { Routes } from '@angular/router';
import { inventoryGuard } from './access';
import { inventoryDraftGuard } from './page-base';
export const inventoryRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'patios' },
  {
    path: 'patios',
    canActivate: [inventoryGuard],
    loadComponent: () => import('./pages/yards/yards.component').then((m) => m.YardsComponent),
  },
  {
    path: 'ubicaciones/:uuid',
    canActivate: [inventoryGuard],
    loadComponent: () =>
      import('./pages/location/location.component').then((m) => m.LocationComponent),
  },
  {
    path: 'sitios',
    data: { global: true },
    canActivate: [inventoryGuard],
    loadComponent: () => import('./pages/sites/sites.component').then((m) => m.SitesComponent),
  },
  {
    path: 'sitios/:uuid',
    data: { global: true },
    canActivate: [inventoryGuard],
    loadComponent: () => import('./pages/site/site.component').then((m) => m.SiteComponent),
  },
  {
    path: 'equipos',
    canActivate: [inventoryGuard],
    loadComponent: () => import('./pages/assets/assets.component').then((m) => m.AssetsComponent),
  },
  { path: 'equipos/:uuid', pathMatch: 'full', redirectTo: 'equipos/:uuid/actual' },
  {
    path: 'equipos/:uuid/:section',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () => import('./pages/asset/asset.component').then((m) => m.AssetComponent),
  },
  {
    path: 'movimientos',
    canActivate: [inventoryGuard],
    loadComponent: () =>
      import('./pages/movements/movements.component').then((m) => m.MovementsComponent),
  },
  {
    path: 'movimientos/nuevo',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./pages/movement-plan/movement-plan.component').then((m) => m.MovementPlanComponent),
  },
  {
    path: 'movimientos/:uuid/recepcion',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./pages/receipt/receipt.component').then((m) => m.ReceiptComponent),
  },
  {
    path: 'movimientos/:uuid',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./pages/movement/movement.component').then((m) => m.MovementComponent),
  },
  {
    path: 'reservas',
    canActivate: [inventoryGuard],
    loadComponent: () =>
      import('./pages/reservations/reservations.component').then((m) => m.ReservationsComponent),
  },
  {
    path: 'reservas/:uuid',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./pages/reservation/reservation.component').then((m) => m.ReservationComponent),
  },
  {
    path: 'propuestas',
    canActivate: [inventoryGuard],
    loadComponent: () =>
      import('./pages/proposals/proposals.component').then((m) => m.ProposalsComponent),
  },
  {
    path: 'propuestas/nueva',
    data: { proposal: true },
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./pages/movement-plan/movement-plan.component').then((m) => m.MovementPlanComponent),
  },
  {
    path: 'propuestas/:uuid',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () =>
      import('./pages/proposal/proposal.component').then((m) => m.ProposalComponent),
  },
  {
    path: 'conteos',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () => import('./pages/counts/counts.component').then((m) => m.CountsComponent),
  },
  {
    path: 'conteos/:uuid',
    canActivate: [inventoryGuard],
    canDeactivate: [inventoryDraftGuard],
    runGuardsAndResolvers: 'always',
    loadComponent: () => import('./pages/count/count.component').then((m) => m.CountComponent),
  },
];
