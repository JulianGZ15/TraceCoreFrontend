import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-counts',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    LookupComponent,
    YardPickerComponent,
    InventoryNavComponent,
  ],
  templateUrl: './counts.component.html',
  styleUrl: './counts.component.scss',
})
export class CountsComponent extends InventoryForm {
  readonly rows = signal<M.Count[]>([]);
  readonly opening = signal(false);
  readonly form = new FormGroup({
    locationUuid: new FormControl('', { nonNullable: true }),
    sourceReference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.api.get<M.Count[]>('/counts', this.params()),
      (r) => this.rows.set(r),
    );
  }
  pick(v: string) {
    this.form.controls.locationUuid.setValue(v);
    this.form.markAsDirty();
  }
  override changeYard(y: string) {
    if (this.form.dirty) {
      void this.canLeave().then((ok) => {
        if (ok) {
          this.form.reset();
          super.changeYard(y);
        }
      });
    } else {
      this.form.reset();
      super.changeYard(y);
    }
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    if (!this.yard()) {
      this.error.set('Selecciona el patio.');
      return;
    }
    await this.submitKeyed<M.Count>(
      '/counts',
      {
        yardUuid: this.yard(),
        locationUuid: this.form.controls.locationUuid.value || null,
        method: 'MANUAL',
        sourceReference: this.form.controls.sourceReference.value,
      },
      (r) => {
        this.form.markAsPristine();
        void this.router.navigate(['/inventario/conteos', r.uuid]);
      },
    );
  }
}
