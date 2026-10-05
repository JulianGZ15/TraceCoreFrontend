import { Routes } from '@angular/router';
import { commerceGuard, commerceDiscard } from './access';
export const commerceRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'ordenes' },
  {
    path: 'ordenes',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
  },
  {
    path: 'ordenes/nueva',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-create/order-create.component').then((m) => m.OrderCreateComponent),
  },
  {
    path: 'marcos',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/frameworks/frameworks.component').then((m) => m.FrameworksComponent),
  },
  {
    path: 'marcos/nuevo',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/framework/framework.component').then((m) => m.FrameworkComponent),
  },
  {
    path: 'marcos/:uuid',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    data: { global: true },
    loadComponent: () =>
      import('./pages/framework/framework.component').then((m) => m.FrameworkComponent),
  },
  {
    path: 'rentas',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rentals/rentals.component').then((m) => m.RentalsComponent),
  },
  {
    path: 'recepciones',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/receipts/receipts.component').then((m) => m.ReceiptsComponent),
  },
  {
    path: 'recepciones/nueva',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/receipt-create/receipt-create.component').then(
        (m) => m.ReceiptCreateComponent,
      ),
  },
  {
    path: 'recepciones/:uuid',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/receipt/receipt.component').then((m) => m.ReceiptComponent),
  },
  {
    path: 'devoluciones/:uuid',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/return-detail/return-detail.component').then((m) => m.ReturnDetailComponent),
  },
  {
    path: 'cortes/:uuid',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/billing/billing.component').then((m) => m.BillingComponent),
  },
  {
    path: 'asignaciones/:uuid/corte',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/billing-preview/billing-preview.component').then(
        (m) => m.BillingPreviewComponent,
      ),
  },
  {
    path: 'rentas/:uuid/devoluciones/nueva',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/return-create/return-create.component').then((m) => m.ReturnCreateComponent),
  },
  {
    path: 'ordenes/:uuid/general',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-summary/order-summary.component').then((m) => m.OrderSummaryComponent),
  },
  {
    path: 'ordenes/:uuid/partidas',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-lines/order-lines.component').then((m) => m.OrderLinesComponent),
  },
  {
    path: 'ordenes/:uuid/asignaciones',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-allocations/order-allocations.component').then(
        (m) => m.OrderAllocationsComponent,
      ),
  },
  {
    path: 'ordenes/:uuid/recepciones',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-receipts/order-receipts.component').then(
        (m) => m.OrderReceiptsComponent,
      ),
  },
  {
    path: 'ordenes/:uuid/polizas',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-policies/order-policies.component').then(
        (m) => m.OrderPoliciesComponent,
      ),
  },
  {
    path: 'ordenes/:uuid/evidencias',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-evidence/order-evidence.component').then(
        (m) => m.OrderEvidenceComponent,
      ),
  },
  {
    path: 'ordenes/:uuid/credito',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/order-credit/order-credit.component').then((m) => m.OrderCreditComponent),
  },
  {
    path: 'rentas/:uuid/general',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-summary/rental-summary.component').then(
        (m) => m.RentalSummaryComponent,
      ),
  },
  {
    path: 'rentas/:uuid/tarifas',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-rates/rental-rates.component').then((m) => m.RentalRatesComponent),
  },
  {
    path: 'rentas/:uuid/asignaciones',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-assignments/rental-assignments.component').then(
        (m) => m.RentalAssignmentsComponent,
      ),
  },
  {
    path: 'rentas/:uuid/periodos',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-periods/rental-periods.component').then(
        (m) => m.RentalPeriodsComponent,
      ),
  },
  {
    path: 'rentas/:uuid/cortes',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-billings/rental-billings.component').then(
        (m) => m.RentalBillingsComponent,
      ),
  },
  {
    path: 'rentas/:uuid/devoluciones',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-returns/rental-returns.component').then(
        (m) => m.RentalReturnsComponent,
      ),
  },
  {
    path: 'rentas/:uuid/garantias',
    canActivate: [commerceGuard],
    canDeactivate: [commerceDiscard],
    loadComponent: () =>
      import('./pages/rental-guarantees/rental-guarantees.component').then(
        (m) => m.RentalGuaranteesComponent,
      ),
  },
  { path: 'ordenes/:uuid', pathMatch: 'full', redirectTo: 'ordenes/:uuid/general' },
  { path: 'rentas/:uuid', pathMatch: 'full', redirectTo: 'rentas/:uuid/general' },
  { path: '**', redirectTo: 'ordenes' },
];
