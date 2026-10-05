import { Directive, inject, input, output, signal, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { CommerceApi } from './commerce-api';
import { CommerceAccess } from './access';
import { CommercePending } from './pending';
import { EditorContext, Entity, Field } from './models';
import { form, message } from './rules';
@Directive()
export abstract class CommerceEditor implements OnInit {
  readonly api = inject(CommerceApi);
  readonly session = this.api.session;
  readonly access = inject(CommerceAccess);
  readonly pending = inject(CommercePending);
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
  readonly compatible = signal(true);
  ngOnInit() {
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
    if (!this.compatible() || this.form.invalid || !this.allowed() || this.busy()) return;
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
          '/orders/' + summary.order.uuid + '/summary',
        );
      let kind = this.resourceKind;
      if (!kind && this.data.action) {
        const action = this.data.action;
        kind = action.includes('framework')
          ? 'frameworks'
          : action.includes('allocation') ||
              action.includes('delivery') ||
              action.includes('ownership')
            ? 'allocations'
            : action.includes('service')
              ? 'lines'
              : action.includes('policy')
                ? 'policies'
                : action.includes('guarantee')
                  ? 'guarantees'
                  : 'orders';
      }
      if (row && kind) {
        row =
          kind === 'orders'
            ? (summary?.order ?? row)
            : await this.api.get<Entity>('/' + kind + '/' + row.uuid);
      }
      if (epoch !== this.session.epoch() || !this.session.valid()) return;
      this.data = { ...this.data, summary, row, rental: summary?.rental ?? this.data.rental };
      this.compatible.set(true);
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
