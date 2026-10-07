import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Session } from '../../core/auth/session';
const read = () =>
  inject(Session).can('DOCUMENT_READ') || inject(Router).createUrlTree(['/sin-acceso']);
export const documentRoutes: Routes = [
  {
    path: '',
    canActivate: [read],
    loadComponent: () =>
      import('./pages/library/library.component').then((m) => m.LibraryComponent),
  },
  {
    path: ':uuid/versiones/:versionUuid',
    canActivate: [read],
    loadComponent: () =>
      import('./pages/version/version.component').then((m) => m.VersionComponent),
  },
  { path: ':uuid', pathMatch: 'full', redirectTo: ':uuid/resumen' },
  {
    path: ':uuid/:seccion',
    canActivate: [read],
    loadComponent: () =>
      import('./pages/dossier/dossier.component').then((m) => m.DossierComponent),
  },
];
