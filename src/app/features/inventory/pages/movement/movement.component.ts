import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-movement',
  imports: [RouterLink, ReactiveFormsModule, PageHeading, Feedback, InventoryNavComponent],
  templateUrl: './movement.component.html',
  styleUrl: './movement.component.scss',
})
export class MovementComponent extends InventoryForm {
  readonly detail = signal<M.MovementDetail | null>(null);
  readonly form = new FormGroup({
    authorizationReference: new FormControl('', { nonNullable: true }),
    repairAuthorizationReference: new FormControl('', { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true }),
  });
  protected override resourceChanged() {
    super.resourceChanged();
    this.detail.set(null);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.api.get<M.MovementDetail>('/movements/' + this.id()),
      (r) => this.detail.set(r),
    );
  }
  canMaintain(m: M.Movement) {
    return this.access.can(
      m.type === 'ADJUSTMENT' ? 'INVENTORY_ADJUST' : 'MOVEMENT_MANAGE',
      m.sourceYardUuid ?? m.destinationYardUuid,
    );
  }
  canWrite(m: M.Movement) {
    return (
      this.access.can(
        m.type === 'ADJUSTMENT' ? 'INVENTORY_ADJUST' : 'MOVEMENT_MANAGE',
        m.sourceYardUuid ?? m.destinationYardUuid,
      ) &&
      (!m.destinationSiteUuid || this.access.can('DISPATCH_APPROVE', m.sourceYardUuid)) &&
      (!m.destinationSiteUuid ||
        m.destinationCustodyMode !== 'REPAIR' ||
        this.access.can('REPAIR_DISPATCH', m.sourceYardUuid))
    );
  }
  async dispatch() {
    const m = this.detail()?.movement;
    if (
      this.detail()?.logisticsManaged !== false ||
      !m ||
      !(await confirm(
        this.dialog,
        'Confirmar salida',
        'Se revalidarán reservas, composición, capacidad y restricciones operativas.',
      ))
    )
      return;
    const v = this.form.getRawValue();
    if (m.destinationSiteUuid && !v.authorizationReference.trim()) {
      this.error.set('Indica la autorización documentada de salida externa.');
      return;
    }
    if (
      m.destinationSiteUuid &&
      m.destinationCustodyMode === 'REPAIR' &&
      !v.repairAuthorizationReference.trim()
    ) {
      this.error.set('Indica la excepción de reparación.');
      return;
    }
    await this.submitKeyed<M.MovementDetail>(
      '/movements/' + m.uuid + '/dispatch',
      {
        authorizationReference: v.authorizationReference || null,
        repairAuthorizationReference: v.repairAuthorizationReference || null,
        version: m.version,
      },
      (r) => {
        this.detail.set(r);
        this.success.set('Salida confirmada.');
      },
    );
  }
  async cancel() {
    if (this.detail()?.logisticsManaged !== false) return;
    const m = this.detail()!.movement;
    if (!this.form.controls.reason.value.trim()) {
      this.error.set('Indica el motivo de cancelación.');
      return;
    }
    await this.action(
      '/movements/' + m.uuid + '/cancel',
      { reason: this.form.controls.reason.value, version: m.version },
      () => this.load(),
      'Cancelar borrador',
    );
    if (!this.error()) this.form.markAsPristine();
  }
  async reload() {
    if (
      await confirm(
        this.dialog,
        'Recargar movimiento',
        'Se descartarán las referencias sin guardar.',
      )
    ) {
      this.form.reset();
      await this.load();
    }
  }
}
