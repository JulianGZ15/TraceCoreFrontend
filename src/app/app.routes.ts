import { Routes } from '@angular/router';
import { accessGuard } from './core/auth/guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Iniciar sesión · TraceCore',
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [accessGuard],
    loadComponent: () => import('./core/layout/shell').then((m) => m.Shell),
    children: [
      {path:'inventario',loadChildren:()=>import('./features/inventory/inventory.routes').then(m=>m.inventoryRoutes)},
      {
        path: 'terceros',
        canActivate: [accessGuard],
        data: { permission: 'PARTY_READ' },
        loadChildren: () =>
          import('./features/partners/partners.routes').then((m) => m.partnerRoutes),
      },
      { path: 'catalogo', canActivate: [accessGuard], data: { permission: 'EQUIPMENT_READ' }, loadChildren: () => import('./features/equipment/equipment.routes').then(m => m.catalogRoutes) },
      { path: 'equipos', canActivate: [accessGuard], data: { permission: 'EQUIPMENT_READ' }, loadChildren: () => import('./features/equipment/equipment.routes').then(m => m.assetRoutes) },
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · TraceCore',
        canActivate: [accessGuard],
        data: { home: true },
        loadComponent: () => import('./features/home/home').then((m) => m.HomePage),
      },
      {
        path: 'mi-cuenta',
        title: 'Mi cuenta · TraceCore',
        canActivate: [accessGuard],
        loadComponent: () => import('./features/account/account').then((m) => m.AccountPage),
      },
      {
        path: 'organizacion/empresa',
        title: 'Empresa · TraceCore',
        canActivate: [accessGuard],
        data: { permission: 'ORGANIZATION_READ' },
        loadComponent: () =>
          import('./features/organization/detail').then((m) => m.OrganizationDetail),
      },
      {
        path: 'organizacion/patios',
        title: 'Patios · TraceCore',
        canActivate: [accessGuard],
        data: { permission: 'YARD_MANAGE' },
        loadComponent: () => import('./features/organization/yards').then((m) => m.YardsPage),
      },
      {
        path: 'organizacion/patios/:uuid',
        title: 'Patio · TraceCore',
        canActivate: [accessGuard],
        data: { yard: true },
        loadComponent: () =>
          import('./features/organization/detail').then((m) => m.OrganizationDetail),
      },
      {
        path: 'acceso/usuarios',
        title: 'Usuarios · TraceCore',
        canActivate: [accessGuard],
        data: { permission: 'ACCESS_MANAGE' },
        loadComponent: () => import('./features/access/users').then((m) => m.UsersPage),
      },
      {
        path: 'acceso/roles',
        title: 'Roles · TraceCore',
        canActivate: [accessGuard],
        data: { permission: 'ACCESS_MANAGE' },
        loadComponent: () => import('./features/access/roles').then((m) => m.RolesPage),
      },
      {
        path: 'auditoria',
        title: 'Auditoría · TraceCore',
        canActivate: [accessGuard],
        data: { permission: 'AUDIT_READ' },
        loadComponent: () => import('./features/audit/audit').then((m) => m.AuditPage),
      },
      {
        path: 'sin-acceso',
        title: 'Sin acceso · TraceCore',
        canActivate: [accessGuard],
        loadComponent: () => import('./features/home/message').then((m) => m.MessagePage),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada · TraceCore',
    data: { missing: true },
    loadComponent: () => import('./features/home/message').then((m) => m.MessagePage),
  },
];
