import { Component, inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Feedback } from '../../../../shared/ui/page';
import { InventoryForm, exact } from '../../page-base';

import { decimalValidator } from '../../../equipment/rules';
import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';

@Component({
  selector: 'tc-inventory-location-editor',
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './location-editor.component.html',
  styleUrl: './location-editor.component.scss',
})
export class LocationEditorComponent extends InventoryForm {
  readonly data = inject<{ yardUuid: string; parentUuid: string | null; row?: M.Location }>(
    DIALOG_DATA,
  );
  readonly ref = inject(DialogRef);
  async close() {
    if (!this.busy() && (await this.canLeave())) this.ref.close();
  }
  pick(key: string, value: string) {
    this.form.get(key)?.setValue(value);
    this.form.markAsDirty();
  }
  readonly types = M.locationTypes;
  readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    type: new FormControl('BAY', { nonNullable: true }),
    active: new FormControl(true, { nonNullable: true }),
    exclusive: new FormControl(false, { nonNullable: true }),
    maxPositions: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^[1-9]\d{0,8}$/)],
    }),
    maxWeightKg: new FormControl('', {
      nonNullable: true,
      validators: [decimalValidator(12, 6, true)],
    }),
  });
  version = 0;
  incompatible = false;
  constructor() {
    super();
    if (this.data.row) this.read(this.data.row);
  }
  read(r: M.Location) {
    this.incompatible = false;
    try {
      this.form.reset({
        ...r,
        maxPositions: r.maxPositions?.toString() ?? '',
        maxWeightKg: r.maxWeightKg == null ? '' : exact(r.maxWeightKgExact),
      });
      this.version = r.version;
    } catch (e) {
      this.incompatible = true;
      this.error.set(String(e));
    }
  }
  async reload() {
    if (
      this.data.row &&
      (await confirm(this.dialog, 'Recargar ubicación', 'Se descartarán los cambios.'))
    )
      await this.request(
        () => this.api.get<M.Location>('/locations/' + this.data.row!.uuid),
        (r) => this.read(r),
      );
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy() || this.incompatible) return;
    const v = this.form.getRawValue();
    const body = {
      ...v,
      yardUuid: this.data.yardUuid,
      parentUuid: this.data.parentUuid,
      maxPositions: v.exclusive ? 1 : v.maxPositions ? parseInt(v.maxPositions, 10) : null,
      maxWeightKg: v.maxWeightKg || null,
      version: this.version,
    };
    const ok = await this.request(
      () =>
        this.data.row
          ? this.api.put('/locations/' + this.data.row.uuid, body)
          : this.api.post('/locations', body),
      (r) => {
        this.form.markAsPristine();
        this.ref.close(r);
      },
    );
  }
}
