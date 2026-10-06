import { Directive, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FinanceApi } from './finance-api';
import { FinancePending } from './pending';
import { FinanceAccess } from './access';
import { EditorData, Entity, Field, Operation } from './models';
import { form, message, entity } from './rules';
@Directive()
export abstract class FinanceEditor implements OnInit, OnDestroy {
  readonly api = inject(FinanceApi);
  readonly session = this.api.session;
  readonly access = inject(FinanceAccess);
  readonly pending = inject(FinancePending);
  readonly ref = inject(DialogRef<Entity>, { optional: true });
  data: EditorData = inject(DIALOG_DATA, { optional: true }) ?? {};
  title = 'Operación financiera';
  hint = '';
  permission = 'FINANCE_MANAGE';
  fields: Field[] = [];
  form: FormGroup = form([]);
  uuid = crypto.randomUUID();
  resource = '';
  readonly error = signal('');
  readonly busy = signal(false);
  readonly reconcile = signal(false);
  readonly compatible = signal(true);
  protected ended = new Subject<void>();
  ngOnInit() {
    try {
      this.setup();
    } catch (e) {
      this.compatible.set(false);
      this.error.set(message(e));
    }
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => {
      this.form.reset();
      this.ref?.close();
    });
  }
  protected abstract setup(): void;
  protected abstract submit(): Promise<unknown>;
  async save() {
    this.form.markAllAsTouched();
    if (
      this.busy() ||
      this.reconcile() ||
      !this.compatible() ||
      this.form.invalid ||
      !this.access.can(this.permission) ||
      !window.confirm('¿Confirmar esta operación financiera?')
    )
      return;
    const epoch = this.session.epoch();
    this.busy.set(true);
    this.error.set('');
    try {
      const r = await this.submit();
      if (epoch !== this.session.epoch() || !this.session.valid()) return;
      this.form.markAsPristine();
      this.ref?.close(entity(r));
    } catch (e) {
      this.error.set(message(e));
      if (!(e instanceof Error) || 'status' in e) {
        const status = (e as { status?: number })?.status;
        if (status === 409 || !status || status >= 500) this.reconcile.set(true);
        if (status === 403) void this.session.refresh();
      }
    } finally {
      this.busy.set(false);
    }
  }
  async refresh() {
    if (
      this.busy() ||
      !window.confirm('¿Consultar el estado actual y conservar el borrador para revisarlo?')
    )
      return;
    const draft = this.form.getRawValue();
    const epoch = this.session.epoch();
    this.busy.set(true);
    try {
      if (this.data.row && this.resource) {
        this.data = {
          ...this.data,
          row: entity(await this.api.get('/' + this.resource + '/' + this.data.row.uuid)),
        };
      } else if (this.pending.own().some((p) => p.key === this.uuid)) {
        throw new Error('Consulta la solicitud pendiente desde la página antes de repetir.');
      }
      if (epoch !== this.session.epoch()) return;
      this.compatible.set(true);
      this.setup();
      this.form.patchValue(draft);
      this.form.markAsDirty();
      this.reconcile.set(false);
      this.error.set('Datos consultados. Revisa el borrador y confirma de nuevo.');
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
  protected create(operation: Operation, path: string, payload: Record<string, unknown>) {
    return this.pending.create(operation, path, payload);
  }
  protected bind(fields: Field[], values: Record<string, unknown> = {}) {
    this.fields = fields;
    this.form = form(fields, values);
  }
  ngOnDestroy() {
    this.ended.next();
    this.ended.complete();
  }
}
