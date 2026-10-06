import { Directive, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LogisticsApi } from './logistics-api';
import { LogisticsAccess } from './access';
import { LogisticsPending } from './pending';
import { EditorContext, Entity, Field } from './models';
import { form, message } from './rules';
@Directive()
export abstract class LogisticsEditor implements OnInit, OnDestroy {
  readonly api = inject(LogisticsApi);
  readonly session = this.api.session;
  readonly access = inject(LogisticsAccess);
  readonly pending = inject(LogisticsPending);
  readonly ref = inject(DialogRef, { optional: true });
  private injected = inject<EditorContext>(DIALOG_DATA, { optional: true });
  readonly context = input<EditorContext>();
  readonly saved = output<Entity>();
  readonly error = signal('');
  readonly busy = signal(false);
  fields: Field[] = [];
  form: ReturnType<typeof form> = form([]);
  data: EditorContext = { yard: '' };
  title = '';
  permission = '';
  resourceKind = '';
  readonly reconcile = signal(false);
  private ended = new Subject<void>();
  ngOnDestroy() {
    this.ended.next();
    this.ended.complete();
  }
  readonly compatible = signal(true);
  ngOnInit() {
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      this.form.reset();
      this.error.set('');
      this.busy.set(false);
      this.ref?.close();
    });
    this.data = this.context() ?? this.injected ?? { yard: this.session.selectedYard() };
    try {
      this.setup();
    } catch (e) {
      this.compatible.set(false);
      this.error.set(message(e));
    }
  }
  abstract setup(): void;
  abstract submit(): Promise<Entity>;
  protected make(fields: Field[], values: Record<string, unknown> = {}) {
    this.fields = fields;
    this.form = form(fields, values);
    for (const f of fields) if (f.readonly) this.form.get(f.key)?.disable();
  }
  allowed() {
    return this.access.can(this.permission, this.data.yard);
  }
  dirty() {
    return this.form.dirty;
  }
  async save() {
    this.form.markAllAsTouched();
    if (
      this.reconcile() ||
      !this.compatible() ||
      this.form.invalid ||
      !this.allowed() ||
      this.busy()
    )
      return;
    const epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.submit();
      if (epoch !== this.session.epoch() || !this.session.valid()) return;
      this.form.markAsPristine();
      this.saved.emit(result);
      this.ref?.close(result);
    } catch (e) {
      this.error.set(message(e));
      if (
        !e ||
        typeof e !== 'object' ||
        !('status' in e) ||
        e.status === 0 ||
        e.status === 409 ||
        (typeof e.status === 'number' && e.status >= 500)
      )
        this.reconcile.set(true);
      if (e && typeof e === 'object' && 'status' in e && e.status === 403)
        void this.session.refresh();
    } finally {
      this.busy.set(false);
    }
  }
  async refresh() {
    if (
      this.busy() ||
      !window.confirm(
        'Consultar la versión actual y conservar los campos capturados? Revisa las diferencias antes de guardar otra vez.',
      )
    )
      return;
    const epoch = this.session.epoch(),
      draft = this.form.getRawValue();
    this.busy.set(true);
    try {
      let summary = this.data.summary,
        row = this.data.row;
      if (summary)
        summary = await this.api.get<import('./models').Summary>(
          '/manifests/' + summary.manifest.uuid + '/summary',
        );
      if (this.resourceKind === 'trip' && summary) row = summary.trip ?? undefined;
      if (!row && ['vehicles', 'drivers'].includes(this.resourceKind)) {
        const uuid = (this as unknown as { uuid?: string }).uuid;
        if (uuid) row = await this.api.get<Entity>('/' + this.resourceKind + '/' + uuid);
      }
      if (row && this.resourceKind)
        row = await this.api.get<Entity>(
          this.resourceKind === 'trip'
            ? '/manifests/' + summary?.manifest.uuid + '/trip'
            : '/' + this.resourceKind + '/' + row.uuid,
        );
      if (epoch !== this.session.epoch() || !this.session.valid()) return;
      this.data = { ...this.data, summary, row };
      this.compatible.set(true);
      this.reconcile.set(false);
      this.setup();
      for (const f of this.fields)
        if (!f.readonly && draft[f.key] !== undefined)
          this.form.get(f.key)?.setValue(draft[f.key], { emitEvent: false });
      this.form.markAsDirty();
      this.error.set(
        'Datos actuales consultados. El borrador se conserva; revisa y confirma de nuevo.',
      );
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
  cancel() {
    if (!this.form.dirty || window.confirm('¿Descartar los cambios sin guardar?'))
      this.ref?.close();
  }
  protected create(operation: string, path: string, payload: Record<string, unknown>) {
    return this.pending.create<Entity>(operation, path, payload);
  }
}
