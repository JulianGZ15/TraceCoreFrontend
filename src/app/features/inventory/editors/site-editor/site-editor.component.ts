import { Component, inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Feedback } from '../../../../shared/ui/page';
import { InventoryForm, scaled, exact } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';

@Component({
  selector: 'tc-inventory-site-editor',
  imports: [ReactiveFormsModule, Feedback, LookupComponent],
  templateUrl: './site-editor.component.html',
  styleUrl: './site-editor.component.scss',
})
export class SiteEditorComponent extends InventoryForm {
  readonly data = inject<{ row?: M.Site }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  async close() {
    if (!this.busy() && (await this.canLeave())) this.ref.close();
  }
  pick(key: string, value: string) {
    this.form.get(key)?.setValue(value);
    this.form.markAsDirty();
  }
  version = 0;
  incompatible = false;
  readonly form = new FormGroup(
    {
      code: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      type: new FormControl('WELL', { nonNullable: true }),
      parentUuid: new FormControl('', { nonNullable: true }),
      operatorUuid: new FormControl('', { nonNullable: true }),
      address: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(500)],
      }),
      latitude: new FormControl('', { nonNullable: true }),
      longitude: new FormControl('', { nonNullable: true }),
      active: new FormControl(true, { nonNullable: true }),
    },
    {
      validators: (g) => {
        const a = g.get('latitude')?.value,
          b = g.get('longitude')?.value;
        if (!a && !b) return null;
        try {
          return a &&
            b &&
            scaled(a) >= scaled('-90') &&
            scaled(a) <= scaled('90') &&
            scaled(b) >= scaled('-180') &&
            scaled(b) <= scaled('180')
            ? null
            : { coordinates: true };
        } catch {
          return { coordinates: true };
        }
      },
    },
  );
  constructor() {
    super();
    if (this.data.row) this.read(this.data.row);
  }
  read(r: M.Site) {
    this.incompatible = false;
    try {
      this.form.reset({
        ...r,
        parentUuid: r.parentUuid ?? '',
        operatorUuid: r.operatorUuid ?? '',
        latitude: r.latitude == null ? '' : exact(r.latitudeExact),
        longitude: r.longitude == null ? '' : exact(r.longitudeExact),
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
      (await confirm(this.dialog, 'Recargar sitio', 'Se descartarán los cambios.'))
    )
      await this.request(
        () => this.api.get<M.Site>('/sites/' + this.data.row!.uuid),
        (r) => this.read(r),
      );
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy() || this.incompatible) return;
    const v = this.form.getRawValue();
    const body = {
      ...v,
      parentUuid: this.data.row ? this.data.row.parentUuid : v.parentUuid || null,
      operatorUuid: v.operatorUuid || null,
      latitude: v.latitude || null,
      longitude: v.longitude || null,
      version: this.version,
    };
    await this.request(
      () =>
        this.data.row
          ? this.api.put('/sites/' + this.data.row.uuid, body)
          : this.api.post('/sites', body),
      (r) => {
        this.form.markAsPristine();
        this.ref.close(r);
      },
    );
  }
}
