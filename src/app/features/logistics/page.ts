import { Directive, inject, signal, OnInit, OnDestroy, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { LogisticsApi } from './logistics-api';
import { LogisticsAccess } from './access';
import { LogisticsEditor } from './editor';
import { Entity, Row, Summary } from './models';
import { label, message, prettyDate, numberText } from './rules';
export const sections = [
  { key: 'general', label: 'Resumen' },
  { key: 'carga', label: 'Carga' },
  { key: 'viaje', label: 'Viaje' },
  { key: 'comprobaciones', label: 'Comprobaciones' },
  { key: 'entregas', label: 'Entregas' },
  { key: 'hitos', label: 'Hitos' },
  { key: 'evidencias', label: 'Evidencias' },
];
@Directive()
export abstract class LogisticsPage implements OnInit, OnDestroy {
  readonly api = inject(LogisticsApi);
  readonly session = this.api.session;
  readonly access = inject(LogisticsAccess);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly dialog = inject(Dialog);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly rows = signal<Row[]>([]);
  readonly summary = signal<Summary | null>(null);
  readonly selected = signal<Entity | null>(null);
  readonly label = label;
  readonly numberText = numberText;
  readonly sections = sections;
  title = 'Logística y despacho';
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
      this.selected.set(null);
      this.dialog.closeAll();
    });
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(takeUntil(this.ended))
      .subscribe(() => void this.reload());
  }
  get yards() {
    return (
      this.session
        .context()
        ?.yards.filter((y) => y.active && this.access.can('LOGISTICS_READ', y.uuid)) ?? []
    );
  }
  get navBase() {
    return this.mode === 'manifest' ? '/logistica/manifiestos/' + this.id : '/logistica';
  }
  get zone() {
    if (this.mode === 'master' || (this.mode === 'detail' && !this.selected()?.manifestUuid))
      return this.session.context()?.company.timezone ?? 'UTC';
    return (
      this.session.context()?.yards.find((y) => y.uuid === this.yard)?.timezone ??
      this.session.context()?.company.timezone ??
      'UTC'
    );
  }
  date(v: unknown) {
    try {
      return typeof v === 'string' ? prettyDate(v, this.zone) : 'Sin dato';
    } catch {
      return 'Fecha incompatible';
    }
  }
  can(code: string) {
    return this.access.can(code, this.yard);
  }
  manage() {
    const m = this.summary()?.manifest;
    return m ? this.access.manage(m) : this.can('LOGISTICS_MANAGE');
  }
  async edit(type: Type<LogisticsEditor>, row?: Entity) {
    this.dialog
      .open<Entity>(type, {
        data: { yard: this.yard, summary: this.summary() ?? undefined, row },
        disableClose: true,
        panelClass: 'logistics-dialog',
        ariaLabel: 'Operación logística',
      })
      .closed.pipe(takeUntil(this.ended))
      .subscribe((r) => {
        if (r) void this.reload();
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
    this.stop.next();
    const seq = ++this.seq,
      epoch = this.session.epoch();
    const previous = this.id;
    this.id = this.route.snapshot.paramMap.get('uuid') ?? '';
    if (previous !== this.id) {
      this.selected.set(null);
      this.summary.set(null);
      this.rows.set([]);
      this.resourceChanged();
    }
    const q = this.route.snapshot.queryParamMap;
    this.offset = Math.max(0, parseInt(q.get('offset') ?? '0', 10) || 0);
    this.limit = Math.min(100, Math.max(1, parseInt(q.get('limit') ?? '25', 10) || 25));
    this.yard = q.get('yardUuid') ?? this.session.selectedYard() ?? '';
    if (!this.yards.some((y) => y.uuid === this.yard)) this.yard = this.yards[0]?.uuid ?? '';
    if (
      this.mode === 'directory' &&
      this.collection &&
      this.yard &&
      q.get('yardUuid') !== this.yard
    ) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { yardUuid: this.yard },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }
    this.filters = {};
    for (const k of ['state', 'type', 'search', 'carrierUuid', 'status'])
      this.filters[k] = q.get(k) ?? '';
    this.loading.set(true);
    this.error.set('');
    try {
      let summary: Summary | null = null,
        rows: Row[] = [];
      if (this.mode === 'manifest') {
        summary = await this.api.get<Summary>('/manifests/' + this.id + '/summary', {}, this.stop);
        this.yard = summary.manifest.yardUuid;
        if (this.collection)
          rows = await this.api.get<Row[]>(
            '/manifests/' + this.id + '/' + this.collection,
            { offset: this.offset, limit: this.limit },
            this.stop,
          );
      } else if (this.mode === 'directory' && this.collection && this.yard)
        rows = await this.api.get<Row[]>(
          '/' + this.collection,
          { ...this.filters, yardUuid: this.yard, offset: this.offset, limit: this.limit },
          this.stop,
        );
      if (seq !== this.seq || epoch !== this.session.epoch()) return;
      this.summary.set(summary);
      this.rows.set(rows);
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
  protected resourceChanged() {}
  protected async afterLoad() {}
  ngOnDestroy() {
    ++this.seq;
    this.stop.next();
    this.stop.complete();
    this.ended.next();
    this.ended.complete();
  }
}
