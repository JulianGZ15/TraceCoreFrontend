import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { CanDeactivateFn } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Session } from '../../../../core/auth/session';
import { Feedback } from '../../../../shared/ui/page';
import { errorMessage } from '../../../../core/http/api';
import { PartnersApi } from '../../partners-api';
import { DossierStore } from '../../dossier-store';
import { confirm } from '../../../../shared/ui/editor';
@Component({
  selector: 'tc-party-general',
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
})
export class GeneralComponent {
  readonly store = inject(DossierStore);
  readonly session = inject(Session);
  private api = inject(PartnersApi);
  private dialog = inject(Dialog);
  readonly form = inject(FormBuilder).nonNullable.group({
    legalName: ['', [Validators.required, Validators.maxLength(250)]],
    tradeName: ['', Validators.maxLength(150)],
    country: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{2}$/)]],
    active: [true],
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly conflict = signal(false);
  private version = 0;
  constructor() {
    effect(() => {
      const party = this.store.party(),
        can = this.session.can('PARTY_MANAGE');
      if (party && !this.form.dirty) {
        this.form.reset({ ...party, tradeName: party.tradeName ?? '' });
        this.version = party.version;
      }
      if (can) this.form.enable();
      else this.form.disable();
    });
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy() || !this.session.can('PARTY_MANAGE')) return;
    const uuid = this.store.uuid,
      epoch = this.session.epoch(),
      v = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      const party = await this.api.updateParty(
        uuid,
        {
          ...v,
          legalName: v.legalName.trim(),
          tradeName: v.tradeName.trim() || null,
          country: v.country.toUpperCase(),
        },
        this.version,
      );
      if (epoch !== this.session.epoch() || uuid !== this.store.uuid) return;
      this.version = party.version;
      this.store.party.set(party);
      this.form.markAsPristine();
      this.conflict.set(false);
      this.success.set('Información del tercero actualizada.');
    } catch (e) {
      this.error.set(errorMessage(e));
      this.conflict.set(e instanceof HttpErrorResponse && e.status === 409);
    } finally {
      this.busy.set(false);
    }
  }
  async reload() {
    if (
      !(await confirm(
        this.dialog,
        'Recargar datos',
        'Se descartarán los cambios de este formulario.',
      ))
    )
      return;
    this.busy.set(true);
    try {
      const party = await this.api.party(this.store.uuid);
      this.form.markAsPristine();
      this.store.party.set(party);
      this.conflict.set(false);
      this.error.set('');
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async canLeave() {
    return (
      !this.session.valid() ||
      !this.form.dirty ||
      (await confirm(this.dialog, 'Descartar cambios', 'Los cambios sin guardar se perderán.'))
    );
  }
}
export const partyDraftGuard: CanDeactivateFn<GeneralComponent> = (component) =>
  component.canLeave();
