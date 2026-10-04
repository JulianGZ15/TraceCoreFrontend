import { Routes } from '@angular/router';
import { accessGuard } from '../../core/auth/guards';
import { partyDraftGuard } from './pages/general/general.component';
import { evidenceDraftGuard } from './pages/evidence/evidence.component';
export const partnerRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Terceros y AVL · TraceCore',
    canActivate: [accessGuard],
    data: { permission: 'PARTY_READ' },
    loadComponent: () =>
      import('./pages/directory/directory.component').then((m) => m.DirectoryComponent),
  },
  {
    path: ':uuid',
    canActivate: [accessGuard],
    canActivateChild: [accessGuard],
    data: { permission: 'PARTY_READ' },
    loadComponent: () =>
      import('./pages/dossier/dossier.component').then((m) => m.DossierComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'general' },
      {
        path: 'general',
        data: { permission: 'PARTY_READ' },
        canDeactivate: [partyDraftGuard],
        loadComponent: () =>
          import('./pages/general/general.component').then((m) => m.GeneralComponent),
      },
      {
        path: 'roles',
        data: { permission: 'PARTY_READ' },
        loadComponent: () => import('./pages/roles/roles.component').then((m) => m.RolesComponent),
      },
      {
        path: 'contactos',
        data: { permission: 'PARTY_READ' },
        loadComponent: () =>
          import('./pages/contacts/contacts.component').then((m) => m.ContactsComponent),
      },
      {
        path: 'domicilios',
        data: { permission: 'PARTY_READ' },
        loadComponent: () =>
          import('./pages/addresses/addresses.component').then((m) => m.AddressesComponent),
      },
      {
        path: 'fiscal',
        data: { permission: 'PARTY_READ' },
        loadComponent: () => import('./pages/tax/tax.component').then((m) => m.TaxComponent),
      },
      {
        path: 'certificaciones',
        data: { permission: 'PARTY_READ' },
        loadComponent: () =>
          import('./pages/certificates/certificates.component').then(
            (m) => m.CertificatesComponent,
          ),
      },
      {
        path: 'evidencias',
        canDeactivate: [evidenceDraftGuard],
        data: { permission: 'PARTY_READ' },
        loadComponent: () =>
          import('./pages/evidence/evidence.component').then((m) => m.EvidenceComponent),
      },
      {
        path: 'condiciones',
        data: { permission: 'PARTY_READ' },
        loadComponent: () => import('./pages/terms/terms.component').then((m) => m.TermsComponent),
      },
      {
        path: 'autorizaciones',
        data: { permission: 'PARTY_READ' },
        loadComponent: () =>
          import('./pages/authorizations/authorizations.component').then(
            (m) => m.AuthorizationsComponent,
          ),
      },
      {
        path: 'avl',
        data: { permission: 'PARTY_READ' },
        loadComponent: () => import('./pages/avl/avl.component').then((m) => m.AvlComponent),
      },
      {
        path: 'cuotas',
        data: { permission: 'PARTY_READ' },
        loadComponent: () =>
          import('./pages/quotas/quotas.component').then((m) => m.QuotasComponent),
      },
    ],
  },
];
