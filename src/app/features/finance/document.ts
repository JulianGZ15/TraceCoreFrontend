import { Directive, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FinanceApi } from './finance-api';
import { FinanceAccess } from './access';
import { FinancePending } from './pending';
import { Calculation, Field, Currency, InvoiceDetail, Entity } from './models';
import { form, instant, message, exact, numberText, entity, routeFor, optional } from './rules';
import { decimalValidator } from '../equipment/rules';
@Directive()
export abstract class FinanceDocument implements OnInit, OnDestroy {
  readonly api = inject(FinanceApi);
  readonly session = this.api.session;
  readonly access = inject(FinanceAccess);
  readonly pending = inject(FinancePending);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly calculation = signal<Calculation | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly numberText = numberText;
  readonly referenceInvoice = signal<InvoiceDetail | null>(null);
  readonly ended = new Subject<void>();
  uuid = crypto.randomUUID();
  kind: 'INVOICE' | 'CREDIT_NOTE' = 'INVOICE';
  fields: Field[] = [];
  form: FormGroup = form([]);
  parts = new FormArray<FormGroup>([]);
  source = new FormControl('', { nonNullable: true });
  sourceParams: Record<string, string> = {};
  sourceResource = 'charge-options';
  readonly compatible = signal(true);
  private lastPreview = '';
  private seq = 0;
  private frozen: Record<string, unknown> | null = null;
  abstract setup(): void;
  ngOnInit() {
    this.setup();
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      ++this.seq;
      this.form.reset();
      this.parts.clear();
      this.source.reset();
      this.calculation.set(null);
      this.frozen = null;
    });
    this.form.valueChanges.pipe(takeUntil(this.ended)).subscribe(() => {
      ++this.seq;
      this.calculation.set(null);
      this.refreshSource();
    });
    this.parts.valueChanges.pipe(takeUntil(this.ended)).subscribe(() => {
      ++this.seq;
      this.calculation.set(null);
    });
    void this.loadInitial();
  }
  protected async loadInitial() {
    const replacement = this.route.snapshot.queryParamMap.get('replaceUuid');
    try {
      if (this.kind === 'CREDIT_NOTE') {
        const id = this.route.snapshot.paramMap.get('uuid');
        const i = await this.api.get<InvoiceDetail>('/invoices/' + id + '/summary');
        if (!this.session.valid()) return;
        this.referenceInvoice.set(i);
        this.sourceResource = 'invoices/' + id + '/lines';
        this.sourceParams = {};
        if (i.invoice.state !== 'POSTED' || i.reversed)
          throw new Error('La nota requiere factura confirmada y vigente.');
      } else if (replacement) {
        const i = await this.api.get<InvoiceDetail>('/invoices/' + replacement);
        if (!this.session.valid()) return;
        if (i.invoice.state !== 'CANCELLED')
          throw new Error('Solo se recrea un borrador cancelado.');
        this.form.patchValue({
          series: i.invoice.series,
          folio: i.invoice.folio,
          partyUuid: i.invoice.partyUuid,
          direction: i.invoice.direction,
          currency: i.invoice.currency,
          issuedAt: i.invoice.issuedAt,
          dueAt: i.invoice.dueAt,
          reference: i.invoice.reference,
        });
        for (const part of i.charges ?? []) {
          this.append(String(part['chargeUuid']), exact(part['netAmountExact']));
        }
        this.form.markAsDirty();
      }
    } catch (e) {
      this.error.set(message(e));
      this.compatible.set(false);
    }
    this.refreshSource();
  }
  refreshSource() {
    if (this.kind === 'INVOICE') {
      const v = this.form.getRawValue();
      this.sourceParams = {
        partyUuid: v.partyUuid ?? '',
        currency: String(v.currency ?? '').toUpperCase(),
        direction: v.direction ?? '',
      };
    }
  }
  append(sourceUuid = this.source.value, amount = '') {
    if (
      !sourceUuid ||
      this.parts.length >= 500 ||
      this.parts.controls.some((p) => p.get('sourceUuid')?.value === sourceUuid)
    )
      return;
    this.parts.push(
      new FormGroup({
        sourceUuid: new FormControl(sourceUuid, {
          nonNullable: true,
          validators: Validators.required,
        }),
        netAmount: new FormControl(amount, {
          nonNullable: true,
          validators: [Validators.required, decimalValidator(14, 8, true)],
        }),
      }),
    );
    this.parts.markAsDirty();
    this.source.reset();
  }
  remove(index: number) {
    this.parts.removeAt(index);
    this.parts.markAsDirty();
  }
  protected payload() {
    const v = this.form.getRawValue();
    if (this.kind === 'INVOICE')
      return {
        uuid: this.uuid,
        ...v,
        currency: String(v.currency).toUpperCase(),
        issuedAt: instant(v.issuedAt),
        dueAt: instant(v.dueAt),
        parts: this.parts
          .getRawValue()
          .map((p) => ({ chargeUuid: p['sourceUuid'], netAmount: p['netAmount'] })),
      };
    return {
      uuid: this.uuid,
      invoiceUuid: this.referenceInvoice()?.invoice.uuid,
      folio: v.folio,
      reason: v.reason,
      evidenceUuid: optional(v.evidenceUuid),
      parts: this.parts
        .getRawValue()
        .map((p) => ({ invoiceLineUuid: p['sourceUuid'], netAmount: p['netAmount'] })),
    };
  }
  get valid() {
    return this.form.valid && this.parts.valid && this.parts.length > 0 && this.compatible();
  }
  get permission() {
    return this.kind === 'INVOICE' ? 'FINANCE_MANAGE' : 'FINANCE_APPROVE';
  }
  async preview() {
    this.form.markAllAsTouched();
    this.parts.markAllAsTouched();
    if (!this.valid || this.loading() || !this.access.can(this.permission)) return;
    const epoch = this.session.epoch(),
      seq = ++this.seq;
    this.loading.set(true);
    this.error.set('');
    try {
      const payload = this.payload();
      const c = await this.api.post<Calculation>(
        this.kind === 'INVOICE' ? '/invoices/preview' : '/credit-notes/preview',
        payload,
      );
      if (epoch !== this.session.epoch() || seq !== this.seq) return;
      for (const key of ['netAmountExact', 'taxAmountExact', 'totalAmountExact'] as const)
        exact(c[key]);
      for (const p of c.parts) {
        exact(p.netAmountExact);
        exact(p.taxAmountExact);
        exact(p.remainingNetExact);
        exact(p.remainingTaxExact);
      }
      if (!c.calculationFingerprint)
        throw new Error('Contrato incompatible: falta fingerprint de cálculo.');
      this.calculation.set(c);
      this.lastPreview = JSON.stringify(payload);
    } catch (e) {
      if (seq === this.seq) this.error.set(message(e));
      if ((e as { status?: number })?.status === 403) void this.session.refresh();
    } finally {
      this.loading.set(false);
    }
  }
  async save() {
    const c = this.calculation();
    if (!c || !this.valid || this.loading() || !this.access.can(this.permission)) return;
    const payload = this.payload();
    if (this.lastPreview !== JSON.stringify(payload)) {
      this.calculation.set(null);
      return;
    }
    if (
      !window.confirm(
        this.kind === 'INVOICE'
          ? '¿Guardar factura DRAFT? Su confirmación será independiente.'
          : '¿Confirmar esta nota de crédito?',
      )
    )
      return;
    if (
      this.frozen &&
      JSON.stringify(this.frozen) !==
        JSON.stringify({ ...payload, expectedCalculationFingerprint: c.calculationFingerprint })
    ) {
      this.error.set('Consulta la solicitud pendiente antes de cambiar sus datos.');
      return;
    }
    this.frozen = { ...payload, expectedCalculationFingerprint: c.calculationFingerprint };
    const epoch = this.session.epoch();
    this.loading.set(true);
    try {
      const r = await this.pending.create(
        this.kind,
        this.kind === 'INVOICE' ? '/invoices' : '/credit-notes',
        this.frozen!,
      );
      if (epoch !== this.session.epoch()) return;
      this.form.markAsPristine();
      this.parts.markAsPristine();
      await this.router.navigateByUrl(routeFor(this.kind, entity(r).uuid));
    } catch (e) {
      this.error.set(message(e));
      if ((e as { status?: number })?.status === 409) {
        this.calculation.set(null);
        this.frozen = null;
      }
      if ((e as { status?: number })?.status === 403) void this.session.refresh();
    } finally {
      this.loading.set(false);
    }
  }
  dirty() {
    return this.form.dirty || this.parts.dirty;
  }
  ngOnDestroy() {
    ++this.seq;
    this.ended.next();
    this.ended.complete();
    this.form.reset();
    this.parts.clear();
    this.frozen = null;
  }
}
