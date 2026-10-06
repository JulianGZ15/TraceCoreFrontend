import { Routes } from '@angular/router';
import { logisticsGuard, logisticsDiscard } from './access';
export const logisticsRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'manifiestos' },
  {
    path: 'manifiestos',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/manifests/manifests.component').then((m) => m.ManifestsComponent),
  },
  {
    path: 'manifiestos/nuevo',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/manifest-new/manifest-new.component').then((m) => m.ManifestNewComponent),
  },
  {
    path: 'manifiestos/:uuid/verificacion',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/verification/verification.component').then((m) => m.VerificationComponent),
  },
  {
    path: 'manifiestos/:uuid/despacho',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/dispatch/dispatch.component').then((m) => m.DispatchComponent),
  },
  {
    path: 'manifiestos/:uuid/recepcion',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/reception/reception.component').then((m) => m.ReceptionComponent),
  },
  {
    path: 'manifiestos/:uuid/general',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/manifest-summary/manifest-summary.component').then(
        (m) => m.ManifestSummaryComponent,
      ),
  },
  {
    path: 'manifiestos/:uuid/carga',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () => import('./pages/load/load.component').then((m) => m.LoadComponent),
  },
  {
    path: 'manifiestos/:uuid/viaje',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () => import('./pages/trip/trip.component').then((m) => m.TripComponent),
  },
  {
    path: 'manifiestos/:uuid/comprobaciones',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () => import('./pages/checks/checks.component').then((m) => m.ChecksComponent),
  },
  {
    path: 'manifiestos/:uuid/entregas',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/receipts/receipts.component').then((m) => m.ReceiptsComponent),
  },
  {
    path: 'manifiestos/:uuid/hitos',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/milestones/milestones.component').then((m) => m.MilestonesComponent),
  },
  {
    path: 'manifiestos/:uuid/evidencias',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/evidence/evidence.component').then((m) => m.EvidenceComponent),
  },
  {
    path: 'comprobaciones/:uuid',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/check-detail/check-detail.component').then((m) => m.CheckDetailComponent),
  },
  {
    path: 'entregas/:uuid',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    loadComponent: () =>
      import('./pages/receipt-detail/receipt-detail.component').then(
        (m) => m.ReceiptDetailComponent,
      ),
  },
  {
    path: 'vehiculos',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/vehicles/vehicles.component').then((m) => m.VehiclesComponent),
  },
  {
    path: 'vehiculos/:uuid',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/vehicle/vehicle.component').then((m) => m.VehicleComponent),
  },
  {
    path: 'choferes',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/drivers/drivers.component').then((m) => m.DriversComponent),
  },
  {
    path: 'choferes/:uuid',
    canActivate: [logisticsGuard],
    canDeactivate: [logisticsDiscard],
    data: { global: true },
    loadComponent: () => import('./pages/driver/driver.component').then((m) => m.DriverComponent),
  },
  { path: 'manifiestos/:uuid', pathMatch: 'full', redirectTo: 'manifiestos/:uuid/general' },
];
