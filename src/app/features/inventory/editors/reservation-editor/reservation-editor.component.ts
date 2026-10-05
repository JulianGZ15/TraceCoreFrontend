import { Component, inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Feedback } from '../../../../shared/ui/page';
import { InventoryForm, toInstant } from '../../page-base';

import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';

@Component({
  selector: 'tc-inventory-reservation-editor',
  imports: [ReactiveFormsModule, Feedback, LookupComponent],
  templateUrl: './reservation-editor.component.html',
  styleUrl: './reservation-editor.component.scss',
})
export class ReservationEditorComponent extends InventoryForm {
  readonly data = inject<{ yardUuid: string; assetUuid?: string }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  async close() {
    if (!this.busy() && (await this.canLeave())) this.ref.close();
  }
  pick(key: string, value: string) {
    this.form.get(key)?.setValue(value);
    this.form.markAsDirty();
  }
  readonly form = new FormGroup({
    rootAssetUuid: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    beneficiaryUuid: new FormControl('', { nonNullable: true }),
    validFrom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    validTo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    expiresAt: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    offset: new FormControl('+00:00', { nonNullable: true, validators: [Validators.required] }),
    requestReference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  constructor() {
    super();
    this.form.controls.rootAssetUuid.setValue(this.data.assetUuid ?? '');
  }
  async reload() {
    this.error.set(
      'Conservamos el borrador. Consulta las reservas vigentes antes de volver a confirmar.',
    );
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    try {
      const v = this.form.getRawValue(),
        from = toInstant(v.validFrom, v.offset)!,
        to = toInstant(v.validTo, v.offset)!,
        expires = toInstant(v.expiresAt, v.offset)!;
      if (
        Date.parse(from) < Date.now() ||
        Date.parse(to) <= Date.parse(from) ||
        Date.parse(expires) <= Date.now() ||
        Date.parse(expires) > Date.parse(to)
      )
        throw new Error('Revisa inicio, fin y expiración futura del apartado.');
      await this.submitKeyed<M.Reservation[]>(
        '/reservations',
        {
          rootAssetUuid: v.rootAssetUuid,
          beneficiaryUuid: v.beneficiaryUuid || null,
          validFrom: from,
          validTo: to,
          expiresAt: expires,
          requestReference: v.requestReference,
        },
        (r) => this.ref.close(r),
      );
    } catch (e) {
      this.error.set(String(e));
    }
  }
}
