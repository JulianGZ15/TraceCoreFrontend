import { Directive, inject, signal, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Dialog, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { PartnersApi } from './partners-api';
import { Session } from '../../core/auth/session';
import { errorMessage } from '../../core/http/api';
import { confirm } from '../../shared/ui/editor';
import { partnerError } from './rules';
import { Kind, Resource } from './models';
export interface EditContext {
  title: string;
  party: string;
  kind?: Kind;
  row?: Resource;
}
@Directive()
export abstract class PartnerEditor implements OnDestroy {
  readonly data = inject<EditContext>(DIALOG_DATA);
  readonly api = inject(PartnersApi);
  readonly ref = inject(DialogRef);
  readonly session = inject(Session);
  readonly dialog = inject(Dialog);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly conflict = signal(false);
  abstract readonly form: FormGroup;
  private alive = true;
  private epoch = this.session.epoch();
  abstract save(): Promise<unknown>;
  async submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.conflict.set(false);
    try {
      const result = await this.save();
      if (this.alive && this.epoch === this.session.epoch()) this.ref.close(result);
    } catch (e) {
      if (this.alive) {
        this.error.set(partnerError(e) || errorMessage(e));
        this.conflict.set(e instanceof HttpErrorResponse && e.status === 409);
      }
    } finally {
      if (this.alive) this.busy.set(false);
    }
  }
  async reload() {
    if (
      !this.data.row ||
      !this.data.kind ||
      this.busy() ||
      !(await confirm(
        this.dialog,
        'Recargar datos',
        'Se descartarán los cambios de este formulario.',
      ))
    )
      return;
    this.busy.set(true);
    try {
      const row = await this.api.find<Resource>(
        this.data.party,
        this.data.kind,
        this.data.row.uuid,
      );
      this.data.row = row;
      this.reset(row);
      this.form.markAsPristine();
      this.error.set('');
      this.conflict.set(false);
    } catch (e) {
      this.error.set(partnerError(e) || errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  reset(row: Resource) {
    this.form.reset(row);
  }
  escape(event: Event) {
    event.stopPropagation();
    void this.close();
  }
  async close() {
    if (this.busy()) return;
    if (
      !this.form.dirty ||
      (await confirm(this.dialog, 'Descartar cambios', 'Los cambios sin guardar se perderán.'))
    )
      this.ref.close();
  }
  ngOnDestroy() {
    this.alive = false;
    this.form.reset();
  }
}
