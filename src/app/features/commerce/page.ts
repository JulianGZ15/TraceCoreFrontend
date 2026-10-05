import { Directive, inject, signal, OnInit, OnDestroy, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { CommerceApi } from './commerce-api';
import { CommerceAccess } from './access';
import { CommerceEditor } from './editor';
import { Entity, Row, Summary, EditorContext } from './models';
import { message, label, numberText, prettyDate } from './rules';
export const orderSections = [
  { key: 'general', label: 'Resumen' },
  { key: 'partidas', label: 'Partidas' },
  { key: 'asignaciones', label: 'Asignaciones' },
  { key: 'recepciones', label: 'Recepciones' },
  { key: 'polizas', label: 'Pólizas' },
  { key: 'evidencias', label: 'Evidencias' },
  { key: 'credito', label: 'Crédito' },
];
export const rentalSections = [
  { key: 'general', label: 'Resumen' },
  { key: 'tarifas', label: 'Tarifas' },
  { key: 'asignaciones', label: 'Asignaciones' },
  { key: 'periodos', label: 'Periodos' },
  { key: 'cortes', label: 'Cortes' },
  { key: 'devoluciones', label: 'Devoluciones' },
  { key: 'garantias', label: 'Garantías' },
];
@Directive()
export abstract class CommercePage implements OnInit, OnDestroy {
  readonly api = inject(CommerceApi);
  readonly session = this.api.session;
  readonly access = inject(CommerceAccess);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly dialog = inject(Dialog);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly rows = signal<Row[]>([]);
  readonly selected = signal<Entity | null>(null);
  readonly summary = signal<Summary | null>(null);
  readonly rental = signal<Entity | null>(null);
  readonly label = label;
  readonly numberText = numberText;
  title = 'Comercial';
  description = '';
  mode = 'directory';
  collection = '';
  columns: { key: string; label: string }[] = [];
  id = '';
  yard = '';
  offset = 0;
  limit = 25;
  filters: Record<string, string> = {};
  private seq = 0;
  protected stop = new Subject<void>();
  protected ended = new Subject<void>();
  ngOnInit() {
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      ++this.seq;
      this.stop.next();
      this.rows.set([]);
      this.summary.set(null);
      this.rental.set(null);
      this.selected.set(null);
    });
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.ended))
      .subscribe(() => void this.reload());
  }
  get navBase() {
    return this.mode === 'order'
      ? '/comercial/ordenes/' + this.id
      : this.mode === 'rental'
        ? '/comercial/rentas/' + this.id
        : '/comercial';
  }
  get sections() {
    return this.mode === 'order' ? orderSections : this.mode === 'rental' ? rentalSections : [];
  }
  get yards() {
    return (
      this.session
        .context()
        ?.yards.filter((y) => y.active && this.access.can('COMMERCIAL_READ', y.uuid)) ?? []
    );
  }
  get zone() {
    return String(this.rental()?.['timezone'] ?? this.session.context()?.company.timezone ?? 'UTC');
  }
  date(value: unknown, zone = this.zone) {
    try {
      return typeof value === 'string' ? prettyDate(value, zone) : 'Sin dato';
    } catch {
      return 'Fecha incompatible';
    }
  }
  can(p: string) {
    return this.access.can(p, this.yard);
  }
  context(row?: Entity, action?: string): EditorContext {
    return {
      yard: this.yard,
      summary: this.summary() ?? undefined,
      rental: this.rental() ?? this.summary()?.rental ?? undefined,
      row,
      action,
    };
  }
  async edit(type: Type<CommerceEditor>, row?: Entity, action?: string) {
    const ref = this.dialog.open<Entity>(type, {
      data: this.context(row, action),
      disableClose: true,
      ariaLabel: 'Operación comercial',
      panelClass: 'commerce-dialog',
    });
    ref.closed.pipe(takeUntil(this.ended)).subscribe((v) => {
      if (v) void this.reload();
    });
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
  async reload() {
    const draft = this as unknown as { dirty?: () => boolean };
    if (
      draft.dirty?.() &&
      !window.confirm('Recargar datos? Revisa o guarda el borrador antes de descartarlo.')
    )
      return;
    this.stop.next();
    const seq = ++this.seq,
      epoch = this.session.epoch();
    this.id = this.route.snapshot.paramMap.get('uuid') ?? '';
    const q = this.route.snapshot.queryParamMap;
    this.offset = Math.max(0, parseInt(q.get('offset') ?? '0', 10) || 0);
    this.limit = Math.max(1, Math.min(100, parseInt(q.get('limit') ?? '25', 10) || 25));
    this.yard = q.get('yardUuid') ?? this.session.selectedYard() ?? '';
    if (!this.yards.some((y) => y.uuid === this.yard)) this.yard = this.yards[0]?.uuid ?? '';
    if (
      this.mode === 'directory' &&
      this.collection &&
      this.collection !== 'frameworks' &&
      this.yard &&
      q.get('yardUuid') !== this.yard
    ) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { yardUuid: this.yard, offset: 0 },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    this.filters = {};
    for (const k of [
      'type',
      'state',
      'partyUuid',
      'search',
      'distributorUuid',
      'endCustomerUuid',
      'originPartyUuid',
      'orderUuid',
    ])
      this.filters[k] = q.get(k) ?? '';
    this.loading.set(true);
    this.error.set('');
    this.rows.set([]);
    this.selected.set(null);
    try {
      let rows: Row[] | Entity[] = [];
      let summary: Summary | null = null,
        rental: Entity | null = null;
      if (this.mode === 'order') {
        summary = await this.api.get<Summary>('/orders/' + this.id + '/summary', {}, this.stop);
        this.yard = summary.order.yardUuid;
        if (this.collection === 'receipts')
          rows = await this.api.get<Row[]>(
            '/receipts',
            { yardUuid: this.yard, orderUuid: this.id, offset: this.offset, limit: this.limit },
            this.stop,
          );
        else if (this.collection === 'evidence')
          rows = await this.api.get<Row[]>(
            '/evidence',
            { orderUuid: this.id, offset: this.offset, limit: this.limit },
            this.stop,
          );
        else if (this.collection)
          rows = await this.api.get<Row[]>(
            '/orders/' + this.id + '/' + this.collection,
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
      } else if (this.mode === 'rental') {
        rental = await this.api.get<Entity>('/rentals/' + this.id, {}, this.stop);
        summary = await this.api.get<Summary>(
          '/orders/' + rental.orderUuid + '/summary',
          {},
          this.stop,
        );
        this.yard = summary.order.yardUuid;
        if (this.collection)
          rows = await this.api.get<Row[]>(
            '/rentals/' + this.id + '/' + this.collection,
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
      } else if (this.collection === 'frameworks')
        rows = await this.api.get<Entity[]>(
          '/frameworks',
          { offset: this.offset, limit: this.limit },
          this.stop,
        );
      else if (this.collection && this.yard)
        rows = await this.api.get<Row[]>(
          '/' + this.collection,
          { ...this.filters, yardUuid: this.yard, offset: this.offset, limit: this.limit },
          this.stop,
        );
      if (seq !== this.seq || epoch !== this.session.epoch()) return;
      this.summary.set(summary);
      this.rental.set(rental);
      this.rows.set(
        rows.map((v) => ('record' in v ? (v as Row) : { record: v as Entity, label: '' })),
      );
      await this.afterLoad();
    } catch (e) {
      if (seq === this.seq) {
        this.error.set(message(e));
        if (e && typeof e === 'object' && 'status' in e && e.status === 403)
          void this.session.refresh();
      }
    } finally {
      if (seq === this.seq) this.loading.set(false);
    }
  }
  protected async afterLoad() {}
  ngOnDestroy() {
    ++this.seq;
    this.stop.next();
    this.stop.complete();
    this.ended.next();
    this.ended.complete();
  }
}
