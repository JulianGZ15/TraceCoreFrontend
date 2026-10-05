import { Component, inject } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Feedback } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';

@Component({
  selector: 'tc-inventory-custody-editor',
  imports: [ReactiveFormsModule, Feedback, LookupComponent],
  templateUrl: './custody-editor.component.html',
  styleUrl: './custody-editor.component.scss',
})
export class CustodyEditorComponent extends InventoryForm {
  readonly data = inject<{ profile: M.Profile; yardUuid: string | null }>(DIALOG_DATA);
  readonly ref = inject(DialogRef);
  async close() {
    if (!this.busy() && (await this.canLeave())) this.ref.close();
  }
  pick(key: string, value: string) {
    this.form.get(key)?.setValue(value);
    this.form.markAsDirty();
  }
  readonly form = new FormGroup({
    holder: new FormControl('COMPANY', { nonNullable: true }),
    partyUuid: new FormControl('', { nonNullable: true }),
    mode: new FormControl('STORAGE', { nonNullable: true }),
    agreementReference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  current = this.data.profile.custody;
  async reload() {
    if (await confirm(this.dialog, 'Recargar custodia', 'Se descartarán los cambios.'))
      await this.request(
        () => this.api.get<M.Profile>('/assets/' + this.data.profile.asset.uuid),
        (p) => {
          this.current = p.custody;
          this.form.reset({
            holder: 'COMPANY',
            partyUuid: '',
            mode: 'STORAGE',
            agreementReference: '',
            reason: '',
          });
        },
      );
  }
  async save() {
    this.form.markAllAsTouched();
    const v = this.form.getRawValue();
    if (this.form.invalid || this.busy()) return;
    if (v.holder === 'PARTY' && !v.partyUuid) {
      this.error.set('Selecciona el custodio tercero.');
      return;
    }
    await this.request(
      () =>
        this.api.post('/assets/' + this.data.profile.asset.uuid + '/custody', {
          companyUuid: v.holder === 'COMPANY' ? this.session.context()!.company.uuid : null,
          partyUuid: v.holder === 'PARTY' ? v.partyUuid : null,
          yardUuid: v.holder === 'COMPANY' ? this.data.yardUuid : null,
          mode: v.mode,
          agreementReference: v.agreementReference,
          reason: v.reason,
          currentCustodyUuid: this.current?.uuid ?? null,
          version: this.current?.version ?? 0,
        }),
      (r) => {
        this.form.markAsPristine();
        this.ref.close(r);
      },
    );
  }
}
