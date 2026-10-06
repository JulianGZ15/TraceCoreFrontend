import { Directive, inject, signal, OnInit, OnDestroy, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { FinanceApi } from './finance-api';
import { FinanceAccess } from './access';
import { FinanceEditor } from './editor';
import {
  Entity,
  Row,
  Currency,
  InvoiceDetail,
  PaymentDetail,
  PartySummary,
  Check,
  EditorData,
} from './models';
import { label, numberText, message, prettyDate } from './rules';
import { PaymentComponent } from './editors/payment/payment.component';
import { ChargeComponent } from './editors/charge/charge.component';
import { AllocationComponent } from './editors/allocation/allocation.component';
import { AccountComponent } from './editors/account/account.component';
import { LimitComponent } from './editors/limit/limit.component';
import { AccountActionComponent } from './editors/account-action/account-action.component';
import { CommitmentActionComponent } from './editors/commitment-action/commitment-action.component';
import { ReversalComponent } from './editors/reversal/reversal.component';
import { CurrencyComponent } from './editors/currency/currency.component';
import { CancelComponent } from './editors/cancel/cancel.component';
import { InvoicePostComponent } from './editors/invoice-post/invoice-post.component';
export const invoiceSections = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'partidas', label: 'Partidas' },
  { key: 'cargos', label: 'Cargos' },
  { key: 'aplicaciones', label: 'Aplicaciones' },
  { key: 'notas', label: 'Notas de crédito' },
  { key: 'reversos', label: 'Reversos' },
];
export const partySections = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'facturas', label: 'Facturas' },
  { key: 'pagos', label: 'Pagos' },
  { key: 'cargos', label: 'Cargos' },
  { key: 'credito', label: 'Cuenta' },
  { key: 'compromisos', label: 'Compromisos' },
  { key: 'reversos', label: 'Reversos' },
  { key: 'evidencias', label: 'Evidencias' },
];
@Directive()
export abstract class FinancePage implements OnInit, OnDestroy {
  readonly api = inject(FinanceApi);
  readonly session = this.api.session;
  readonly access = inject(FinanceAccess);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly dialog = inject(Dialog);
  readonly rows = signal<Row[]>([]);
  readonly error = signal('');
  readonly loading = signal(false);
  readonly selected = signal<Entity | null>(null);
  readonly invoice = signal<InvoiceDetail | null>(null);
  readonly payment = signal<PaymentDetail | null>(null);
  readonly party = signal<PartySummary | null>(null);
  readonly current = signal<Entity | null>(null);
  readonly currencies = signal<Currency[]>([]);
  readonly check = signal<Check | null>(null);
  readonly label = label;
  readonly numberText = numberText;
  note() {
    return this.current()?.['note'] as Entity | undefined;
  }
  title = 'Finanzas';
  mode = 'directory';
  collection = '';
  resource = '';
  columns: { key: string; label: string }[] = [];
  id = '';
  offset = 0;
  limit = 25;
  currency = 'MXN';
  filters: Record<string, string> = {};
  selectedParty = '';
  file: File | null = null;
  protected stop = new Subject<void>();
  protected ended = new Subject<void>();
  private seq = 0;
  get navBase() {
    return this.mode === 'invoice'
      ? '/finanzas/facturas/' + this.id
      : this.mode === 'party'
        ? '/finanzas/terceros/' + this.id
        : '/finanzas';
  }
  get sections() {
    return this.mode === 'invoice' ? invoiceSections : this.mode === 'party' ? partySections : [];
  }
  get zone() {
    return this.session.context()?.company.timezone ?? 'UTC';
  }
  can(code: string) {
    return this.access.can(code);
  }
  date(v: unknown) {
    try {
      return typeof v === 'string' ? prettyDate(v, this.zone) : 'Sin dato';
    } catch {
      return 'Fecha incompatible';
    }
  }
  ngOnInit() {
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      ++this.seq;
      this.stop.next();
      this.rows.set([]);
      this.invoice.set(null);
      this.party.set(null);
      this.payment.set(null);
      this.current.set(null);
      this.selected.set(null);
      this.check.set(null);
      this.currencies.set([]);
      this.file = null;
      this.dialog.closeAll();
    });
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.ended))
      .subscribe(() => void this.reload());
  }
  async reload() {
    this.stop.next();
    const seq = ++this.seq,
      epoch = this.session.epoch();
    const nextId = this.route.snapshot.paramMap.get('uuid') ?? '';
    if (nextId !== this.id) {
      this.invoice.set(null);
      this.payment.set(null);
      this.party.set(null);
      this.current.set(null);
    }
    this.id = nextId;
    const q = this.route.snapshot.queryParamMap;
    this.offset = Math.max(0, parseInt(q.get('offset') ?? '0', 10) || 0);
    this.limit = Math.min(100, Math.max(1, parseInt(q.get('limit') ?? '25', 10) || 25));
    this.currency = q.get('currency') ?? 'MXN';
    this.filters = {};
    for (const key of [
      'partyUuid',
      'currency',
      'direction',
      'state',
      'kind',
      'search',
      'orderUuid',
      'released',
      'from',
      'to',
    ])
      this.filters[key] = q.get(key) ?? '';
    this.selected.set(null);
    this.rows.set([]);
    this.check.set(null);
    this.loading.set(true);
    this.error.set('');
    try {
      let rows: Row[] = [],
        invoice: InvoiceDetail | null = null,
        payment: PaymentDetail | null = null,
        party: PartySummary | null = null,
        current: Entity | null = null;
      if (this.mode === 'invoice') {
        invoice = await this.api.get('/invoices/' + this.id + '/summary', {}, this.stop);
        if (this.collection)
          rows = await this.api.get(
            '/invoices/' + this.id + '/' + this.collection,
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
        else if (this.resource === 'reversals')
          rows = await this.api.get(
            '/reversals/directory',
            { invoiceUuid: this.id, offset: this.offset, limit: this.limit },
            this.stop,
          );
      } else if (this.mode === 'party') {
        party = await this.api.get(
          '/parties/' + this.id + '/summary',
          { currency: this.currency },
          this.stop,
        );
        if (this.collection)
          rows = await this.api.get(
            '/' + this.collection,
            {
              ...this.filters,
              partyUuid: this.id,
              currency: this.collection === 'evidence' ? undefined : this.currency,
              offset: this.offset,
              limit: this.limit,
            },
            this.stop,
          );
      } else if (this.mode === 'payment') {
        payment = await this.api.get('/payments/' + this.id + '/summary', {}, this.stop);
        rows = await this.api.get(
          '/payments/' + this.id + '/applications',
          { offset: this.offset, limit: this.limit },
          this.stop,
        );
      } else if (this.mode === 'detail') {
        current = await this.api.get('/' + this.resource + '/' + this.id, {}, this.stop);
        if (this.collection)
          rows = await this.api.get(
            '/' + this.resource + '/' + this.id + '/' + this.collection,
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
      } else if (this.resource === 'currencies') {
        const codes = await this.api.get<Currency[]>('/currencies', {}, this.stop);
        rows = codes.map((c) => ({ record: c, label: c.name }));
      } else if (this.collection)
        rows = await this.api.get(
          '/' + this.collection,
          { ...this.filters, offset: this.offset, limit: this.limit },
          this.stop,
        );
      if (seq !== this.seq || epoch !== this.session.epoch()) return;
      this.invoice.set(invoice);
      this.payment.set(payment);
      this.party.set(party);
      this.current.set(current);
      this.rows.set(rows);
      if (!this.currencies().length) {
        const currencies = await this.api.get<Currency[]>('/currencies', {}, this.stop);
        if (seq === this.seq && epoch === this.session.epoch()) this.currencies.set(currencies);
      }
    } catch (e) {
      if (seq === this.seq) {
        this.error.set(message(e));
        if ((e as { status?: number })?.status === 403) void this.session.refresh();
      }
    } finally {
      if (seq === this.seq) this.loading.set(false);
    }
  }
  update(key: string, value: string) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value || null, offset: 0 },
      queryParamsHandling: 'merge',
    });
  }
  move(offset: number) {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { offset },
      queryParamsHandling: 'merge',
    });
  }
  openParty() {
    if (this.selectedParty)
      void this.router.navigate(['/finanzas/terceros', this.selectedParty], {
        queryParams: { currency: this.currency },
      });
  }
  open(row: Entity) {
    const c = this.collection.split('/')[0];
    const segment =
      c === 'invoices'
        ? 'facturas'
        : c === 'payments'
          ? 'pagos'
          : c === 'accounts'
            ? 'cuentas'
            : c === 'credit-accounts'
              ? 'cuentas'
              : c === 'commitments' || c === 'credit-reservations'
                ? 'compromisos'
                : c === 'reversals'
                  ? 'reversos'
                  : this.collection === 'notes'
                    ? 'notas'
                    : '';
    if (segment) void this.router.navigate(['/finanzas', segment, row.uuid]);
    else this.selected.set(row);
  }
  async edit(type: Type<FinanceEditor>, data: EditorData = {}) {
    this.dialog
      .open<Entity>(type, {
        data: {
          partyUuid: this.party()?.party.uuid,
          currency: this.party()?.currency ?? this.filters['currency'] ?? 'MXN',
          ...data,
        },
        disableClose: true,
        panelClass: 'finance-dialog',
        ariaLabel: 'Operación financiera',
      })
      .closed.pipe(takeUntil(this.ended))
      .subscribe((r) => {
        if (r) void this.reload();
      });
  }
  action(action: string, row?: Entity) {
    const types: Record<string, Type<FinanceEditor>> = {
      payment: PaymentComponent,
      charge: ChargeComponent,
      allocation: AllocationComponent,
      account: AccountComponent,
      limit: LimitComponent,
      activate: AccountActionComponent,
      block: AccountActionComponent,
      commitment: CommitmentActionComponent,
      settle: CommitmentActionComponent,
      reversal: ReversalComponent,
      currency: CurrencyComponent,
      cancel: CancelComponent,
      post: InvoicePostComponent,
    };
    const context =
      this.invoice()?.invoice ??
      this.payment()?.payment ??
      this.party()?.account ??
      this.current() ??
      undefined;
    void this.edit(types[action], {
      row: row ?? context,
      context,
      action:
        action === 'activate'
          ? 'activate'
          : action === 'block'
            ? 'block'
            : action === 'settle'
              ? 'settle'
              : undefined,
      resource:
        this.mode === 'invoice' ? 'invoices' : this.mode === 'payment' ? 'payments' : this.resource,
      partyUuid: String(context?.['partyUuid'] ?? this.party()?.party.uuid ?? ''),
      currency: String(context?.['currency'] ?? this.party()?.currency ?? 'MXN'),
    });
  }
  async evaluate(kind: string) {
    const row = this.current() ?? this.party()?.account;
    if (!row) return;
    const seq = this.seq,
      epoch = this.session.epoch();
    this.loading.set(true);
    try {
      const check = await this.api.get<Check>(
        '/' +
          (kind === 'activation' ? 'credit-accounts' : 'credit-reservations') +
          '/' +
          row.uuid +
          '/' +
          kind +
          '-check',
        {},
        this.stop,
      );
      if (seq === this.seq && epoch === this.session.epoch()) this.check.set(check);
    } catch (e) {
      if (seq === this.seq && epoch === this.session.epoch()) this.error.set(message(e));
    } finally {
      if (seq === this.seq && epoch === this.session.epoch()) this.loading.set(false);
    }
  }
  async upload() {
    if (!this.file || !this.id || !this.can('FINANCE_MANAGE')) return;
    const file = this.file,
      epoch = this.session.epoch();
    this.loading.set(true);
    try {
      await this.api.upload(file, this.id);
      if (epoch !== this.session.epoch()) return;
      this.file = null;
      await this.reload();
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.loading.set(false);
    }
  }
  download(row: Entity) {
    void this.api
      .download(row.uuid, String(row['filename'] ?? 'evidencia'))
      .catch((e) => this.error.set(message(e)));
  }
  dirty() {
    return !!this.file;
  }
  ngOnDestroy() {
    ++this.seq;
    this.stop.next();
    this.stop.complete();
    this.ended.next();
    this.ended.complete();
    this.file = null;
  }
}
