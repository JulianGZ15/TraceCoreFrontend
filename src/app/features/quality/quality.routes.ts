import { Routes } from '@angular/router';
import { qualityGuard } from './access';
import { qualityDirtyGuard } from './page-base';
export const qualityRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'equipos' },
  {
    path: 'equipos',
    canActivate: [qualityGuard],
    loadComponent: () => import('./pages/assets/assets.component').then((m) => m.AssetsComponent),
  },
  { path: 'equipos/:uuid', pathMatch: 'full', redirectTo: 'equipos/:uuid/resumen' },
  {
    path: 'equipos/:uuid/:section',
    canActivate: [qualityGuard],
    loadComponent: () => import('./pages/asset/asset.component').then((m) => m.AssetComponent),
  },
  {
    path: 'estandares',
    canActivate: [qualityGuard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/standards/standards.component').then((m) => m.StandardsComponent),
  },
  {
    path: 'requisitos',
    canActivate: [qualityGuard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/requirements/requirements.component').then((m) => m.RequirementsComponent),
  },
  {
    path: 'mtrs',
    canActivate: [qualityGuard],
    data: { global: true },
    loadComponent: () => import('./pages/mtrs/mtrs.component').then((m) => m.MtrsComponent),
  },
  {
    path: 'politicas',
    canActivate: [qualityGuard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/policies/policies.component').then((m) => m.PoliciesComponent),
  },
  {
    path: 'evidencias',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/evidence/evidence.component').then((m) => m.EvidenceComponent),
  },
  {
    path: 'mtrs/:uuid',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    data: { global: true },
    loadComponent: () => import('./pages/mtr/mtr.component').then((m) => m.MtrComponent),
  },
  {
    path: 'politicas/nueva',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    data: { global: true, resource: 'politicas' },
    loadComponent: () => import('./pages/policy/policy.component').then((m) => m.PolicyComponent),
  },
  {
    path: 'politicas/:uuid',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    data: { global: true, resource: 'politicas' },
    loadComponent: () => import('./pages/policy/policy.component').then((m) => m.PolicyComponent),
  },
  {
    path: 'inspecciones',
    canActivate: [qualityGuard],
    loadComponent: () =>
      import('./pages/inspections/inspections.component').then((m) => m.InspectionsComponent),
  },
  {
    path: 'inspecciones/nueva',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    data: { resource: 'inspecciones' },
    loadComponent: () =>
      import('./pages/inspection/inspection.component').then((m) => m.InspectionComponent),
  },
  {
    path: 'inspecciones/:uuid/resultados',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    loadComponent: () =>
      import('./pages/results/results.component').then((m) => m.ResultsComponent),
  },
  {
    path: 'inspecciones/:uuid',
    canActivate: [qualityGuard],
    loadComponent: () =>
      import('./pages/inspection/inspection.component').then((m) => m.InspectionComponent),
  },
  {
    path: 'mantenimiento',
    canActivate: [qualityGuard],
    loadComponent: () =>
      import('./pages/maintenance/maintenance.component').then((m) => m.MaintenanceComponent),
  },
  {
    path: 'mantenimiento/nuevo',
    canActivate: [qualityGuard],
    canDeactivate: [qualityDirtyGuard],
    data: { resource: 'mantenimiento' },
    loadComponent: () =>
      import('./pages/work-order/work-order.component').then((m) => m.WorkOrderComponent),
  },
  {
    path: 'mantenimiento/:uuid',
    canActivate: [qualityGuard],
    loadComponent: () =>
      import('./pages/work-order/work-order.component').then((m) => m.WorkOrderComponent),
  },
  { path: '**', redirectTo: 'equipos' },
];
