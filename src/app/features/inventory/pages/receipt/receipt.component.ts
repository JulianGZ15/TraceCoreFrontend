import { Component, signal } from '@angular/core';

import { FormControl, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';

import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-receipt',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    LookupComponent,
    InventoryNavComponent,
  ],
  templateUrl: './receipt.component.html',
  styleUrl: './receipt.component.scss',
})
export class ReceiptComponent extends InventoryForm {
  readonly detail = signal<M.MovementDetail | null>(null);
  readonly destinations = new FormArray<FormGroup>([]);
  readonly receptions = new FormArray<FormGroup>([]);
  readonly form = new FormGroup({ destinations: this.destinations, conditions: this.receptions });
  readonly pageIndex = signal(0);
  readonly pageRows = () => this.receptions.controls.slice(this.pageIndex(), this.pageIndex() + 25);
  protected override resourceChanged() {
    super.resourceChanged();
    this.detail.set(null);
    this.destinations.clear();
    this.receptions.clear();
    this.pageIndex.set(0);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.api.get<M.MovementDetail>('/movements/' + this.id()),
      (d) => {
        this.detail.set(d);
        if (!this.form.dirty) {
          this.destinations.clear();
          this.receptions.clear();
          for (const r of d.items) {
            if (r.assetUuid === r.rootAssetUuid)
              this.destinations.push(
                new FormGroup({
                  rootAssetUuid: new FormControl(r.assetUuid, { nonNullable: true }),
                  locationUuid: new FormControl('', { nonNullable: true }),
                }),
              );
            this.receptions.push(
              new FormGroup({
                assetUuid: new FormControl(r.assetUuid, { nonNullable: true }),
                condition: new FormControl('', { nonNullable: true }),
                reason: new FormControl('', { nonNullable: true }),
              }),
            );
          }
        }
        if (d.movement.state !== 'IN_TRANSIT') this.error.set('El movimiento no está en tránsito.');
      },
    );
  }
  pick(g: FormGroup, v: string) {
    g.get('locationUuid')?.setValue(v);
    this.form.markAsDirty();
  }
  async save() {
    const d = this.detail();
    if (
      !d ||
      d.logisticsManaged !== false ||
      d.movement.state !== 'IN_TRANSIT' ||
      !(await confirm(
        this.dialog,
        'Recibir movimiento',
        'Se recibirán todas las piezas; el servidor validará la capacidad.',
      ))
    )
      return;
    const conditions = this.receptions.controls
      .map((g) => g.getRawValue())
      .filter((v) => v['condition']);
    if (conditions.some((v) => !v['reason'].trim())) {
      this.error.set('Toda condición declarada exige motivo.');
      return;
    }
    await this.submitKeyed<M.MovementDetail>(
      '/movements/' + this.id() + '/receive',
      {
        destinations: this.destinations.controls
          .map((g) => g.getRawValue())
          .filter((v) => v['locationUuid']),
        conditions,
        version: d.movement.version,
      },
      (r) => {
        this.form.markAsPristine();
        void this.router.navigate(['/inventario/movimientos', r.movement.uuid]);
      },
    );
  }
  async reload() {
    if (
      await confirm(this.dialog, 'Recargar recepción', 'Se descartarán las capturas sin guardar.')
    ) {
      this.form.markAsPristine();
      await this.load();
    }
  }
}
