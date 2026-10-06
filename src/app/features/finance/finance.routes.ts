import { Routes } from '@angular/router';
import { financeGuard, financeDiscard } from './access';
export const financeRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'facturas' },
  {
    path: 'facturas',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoices/invoices.component').then((m) => m.InvoicesComponent),
  },
  {
    path: 'facturas/nueva',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-new/invoice-new.component').then((m) => m.InvoiceNewComponent),
  },
  {
    path: 'facturas/:uuid/nota',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/note-new/note-new.component').then((m) => m.NoteNewComponent),
  },
  {
    path: 'pagos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/payments/payments.component').then((m) => m.PaymentsComponent),
  },
  {
    path: 'pagos/:uuid',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/payment/payment.component').then((m) => m.PaymentComponent),
  },
  {
    path: 'cargos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/charges/charges.component').then((m) => m.ChargesComponent),
  },
  {
    path: 'notas/:uuid',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () => import('./pages/note/note.component').then((m) => m.NoteComponent),
  },
  {
    path: 'cuentas',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/accounts/accounts.component').then((m) => m.AccountsComponent),
  },
  {
    path: 'cuentas/:uuid',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/account/account.component').then((m) => m.AccountComponent),
  },
  {
    path: 'compromisos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/commitments/commitments.component').then((m) => m.CommitmentsComponent),
  },
  {
    path: 'compromisos/:uuid',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/commitment/commitment.component').then((m) => m.CommitmentComponent),
  },
  {
    path: 'reversos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/reversals/reversals.component').then((m) => m.ReversalsComponent),
  },
  {
    path: 'reversos/:uuid',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/reversal/reversal.component').then((m) => m.ReversalComponent),
  },
  {
    path: 'divisas',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/currencies/currencies.component').then((m) => m.CurrenciesComponent),
  },
  {
    path: 'facturas/:uuid/resumen',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-summary/invoice-summary.component').then(
        (m) => m.InvoiceSummaryComponent,
      ),
  },
  {
    path: 'facturas/:uuid/partidas',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-lines/invoice-lines.component').then((m) => m.InvoiceLinesComponent),
  },
  {
    path: 'facturas/:uuid/cargos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-charges/invoice-charges.component').then(
        (m) => m.InvoiceChargesComponent,
      ),
  },
  {
    path: 'facturas/:uuid/aplicaciones',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-applications/invoice-applications.component').then(
        (m) => m.InvoiceApplicationsComponent,
      ),
  },
  {
    path: 'facturas/:uuid/notas',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-notes/invoice-notes.component').then((m) => m.InvoiceNotesComponent),
  },
  {
    path: 'facturas/:uuid/reversos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/invoice-reversals/invoice-reversals.component').then(
        (m) => m.InvoiceReversalsComponent,
      ),
  },
  {
    path: 'terceros/:uuid/resumen',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-summary/party-summary.component').then((m) => m.PartySummaryComponent),
  },
  {
    path: 'terceros/:uuid/facturas',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-invoices/party-invoices.component').then(
        (m) => m.PartyInvoicesComponent,
      ),
  },
  {
    path: 'terceros/:uuid/pagos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-payments/party-payments.component').then(
        (m) => m.PartyPaymentsComponent,
      ),
  },
  {
    path: 'terceros/:uuid/cargos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-charges/party-charges.component').then((m) => m.PartyChargesComponent),
  },
  {
    path: 'terceros/:uuid/credito',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-credit/party-credit.component').then((m) => m.PartyCreditComponent),
  },
  {
    path: 'terceros/:uuid/compromisos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-commitments/party-commitments.component').then(
        (m) => m.PartyCommitmentsComponent,
      ),
  },
  {
    path: 'terceros/:uuid/reversos',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-reversals/party-reversals.component').then(
        (m) => m.PartyReversalsComponent,
      ),
  },
  {
    path: 'terceros/:uuid/evidencias',
    canActivate: [financeGuard],
    canDeactivate: [financeDiscard],
    loadComponent: () =>
      import('./pages/party-evidence/party-evidence.component').then(
        (m) => m.PartyEvidenceComponent,
      ),
  },
  { path: 'facturas/:uuid', pathMatch: 'full', redirectTo: 'facturas/:uuid/resumen' },
  { path: 'terceros/:uuid', pathMatch: 'full', redirectTo: 'terceros/:uuid/resumen' },
];
