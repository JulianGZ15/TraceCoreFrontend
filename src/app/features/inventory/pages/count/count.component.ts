import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-count',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    LookupComponent,
    InventoryNavComponent,
  ],
  templateUrl: './count.component.html',
  styleUrl: './count.component.scss',
})
export class CountComponent extends InventoryForm {
  readonly row = signal<M.Count | null>(null);
  readonly rows = signal<M.CountItem[]>([]);
  readonly selected = signal<M.CountItem | null>(null);
  readonly observeForm = new FormGroup({
    assetUuid: new FormControl('', { nonNullable: true }),
    identifier: new FormControl('', { nonNullable: true }),
    locationUuid: new FormControl('', { nonNullable: true }),
    sourceReference: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly resolveForm = new FormGroup({
    resolution: new FormControl('ACCEPTED_VARIANCE', { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    adjustmentMovementUuid: new FormControl('', { nonNullable: true }),
  });
  readonly endForm = new FormGroup({
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly form = new FormGroup({
    observation: this.observeForm,
    resolution: this.resolveForm,
    closure: this.endForm,
  });
  protected override resourceChanged() {
    super.resourceChanged();
    this.row.set(null);
    this.rows.set([]);
    this.selected.set(null);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      async () => ({
        c: await this.api.get<M.Count>('/counts/' + this.id()),
        items: await this.api.get<M.CountItem[]>('/counts/' + this.id() + '/items', {
          offset: this.offset(),
          limit: this.limit(),
        }),
      }),
      (v) => {
        this.row.set(v.c);
        this.rows.set(v.items);
      },
    );
  }
  pick(g: FormGroup, k: string, v: string) {
    g.get(k)?.setValue(v);
    this.form.markAsDirty();
  }
  async select(r: M.CountItem) {
    if (
      this.resolveForm.dirty &&
      !(await confirm(this.dialog, 'Descartar resolución', 'Se perderá el motivo sin guardar.'))
    )
      return;
    this.selected.set(r);
    this.resolveForm.reset({
      resolution: 'ACCEPTED_VARIANCE',
      reason: '',
      adjustmentMovementUuid: '',
    });
  }
  async observe() {
    this.observeForm.markAllAsTouched();
    const v = this.observeForm.getRawValue();
    if (this.observeForm.invalid || this.busy()) return;
    if (!!v.assetUuid === !!v.identifier.trim()) {
      this.error.set('Indica una pieza o un identificador desconocido, de forma excluyente.');
      return;
    }
    const ok = await this.request(
      () =>
        this.api.post('/counts/' + this.id() + '/observe', {
          assetUuid: v.assetUuid || null,
          identifier: v.identifier.trim() || null,
          locationUuid: v.locationUuid || null,
          sourceReference: v.sourceReference,
        }),
      () => {
        this.observeForm.reset();
        this.success.set('Observación registrada.');
      },
    );
    if (ok) await this.load();
  }
  async resolve() {
    const r = this.selected();
    this.resolveForm.markAllAsTouched();
    if (!r || this.resolveForm.invalid || this.busy()) return;
    const v = this.resolveForm.getRawValue();
    if (v.resolution === 'ADJUSTMENT' && !v.adjustmentMovementUuid) {
      this.error.set('Vincula un ajuste completado para esta pieza.');
      return;
    }
    const ok = await this.request(
      () =>
        this.api.post('/counts/' + this.id() + '/items/' + r.uuid + '/resolve', {
          ...v,
          adjustmentMovementUuid: v.resolution === 'ADJUSTMENT' ? v.adjustmentMovementUuid : null,
          version: r.version,
        }),
      () => {
        this.resolveForm.reset();
        this.selected.set(null);
        this.success.set('Diferencia resuelta. La resolución no ejecuta movimientos.');
      },
    );
    if (ok) await this.load();
  }
  async finish(action: string) {
    this.endForm.markAllAsTouched();
    if (this.endForm.invalid) return;
    const c = this.row()!;
    await this.action(
      '/counts/' + c.uuid + '/' + action,
      { reason: this.endForm.controls.reason.value, version: c.version },
      () => this.load(),
      action === 'close' ? 'Cerrar conteo' : 'Cancelar conteo',
    );
    if (!this.error()) this.form.markAsPristine();
  }
  async reload() {
    if (await confirm(this.dialog, 'Recargar conteo', 'Se descartarán las capturas sin guardar.')) {
      this.form.reset();
      this.selected.set(null);
      await this.load();
    }
  }
}
