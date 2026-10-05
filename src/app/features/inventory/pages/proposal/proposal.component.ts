import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryForm } from '../../page-base';

import { confirm } from '../../../../shared/ui/editor';
import * as M from '../../models';

import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';

@Component({
  selector: 'tc-inventory-proposal',
  imports: [RouterLink, ReactiveFormsModule, PageHeading, Feedback, InventoryNavComponent],
  templateUrl: './proposal.component.html',
  styleUrl: './proposal.component.scss',
})
export class ProposalComponent extends InventoryForm {
  readonly detail = signal<M.ProposalDetail | null>(null);
  readonly selected = signal<string[]>([]);
  readonly form = new FormGroup({
    action: new FormControl('CONFIRMED', { nonNullable: true }),
    reason: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    authorizationReference: new FormControl('', { nonNullable: true }),
    repairAuthorizationReference: new FormControl('', { nonNullable: true }),
  });
  protected override resourceChanged() {
    super.resourceChanged();
    this.detail.set(null);
    this.selected.set([]);
  }
  ngOnInit() {
    this.watch(() => this.load());
  }
  async load() {
    await this.request(
      () => this.api.get<M.ProposalDetail>('/proposals/' + this.id()),
      (d) => this.detail.set(d),
    );
  }
  difference(r: M.ProposalItem) {
    return !r.assetUuid
      ? 'UNKNOWN'
      : !r.expected
        ? 'UNEXPECTED'
        : !r.observed
          ? 'MISSING'
          : 'MATCHED';
  }
  toggle(root: string | null) {
    if (!root) return;
    this.selected.update((v) => (v.includes(root) ? v.filter((x) => x !== root) : [...v, root]));
    this.form.markAsDirty();
  }
  canDecide(p: M.Proposal) {
    return this.access.can(
      p.type === 'ADJUSTMENT' ? 'INVENTORY_ADJUST' : 'MOVEMENT_MANAGE',
      p.sourceYardUuid ?? p.destinationYardUuid,
    );
  }
  async save() {
    this.form.markAllAsTouched();
    const d = this.detail();
    if (!d || this.form.invalid || this.busy()) return;
    const v = this.form.getRawValue();
    if (v.action === 'CONFIRMED' && d.items.some((i) => !i.expected || !i.observed)) {
      this.error.set('Las diferencias exigen corrección o rechazo.');
      return;
    }
    if (
      v.action !== 'REJECTED' &&
      d.proposal.destinationSiteUuid &&
      (!this.access.can('DISPATCH_APPROVE', d.proposal.sourceYardUuid) ||
        !v.authorizationReference.trim())
    ) {
      this.error.set('La salida externa exige DISPATCH_APPROVE y autorización documentada.');
      return;
    }
    if (
      v.action !== 'REJECTED' &&
      d.proposal.destinationSiteUuid &&
      d.proposal.destinationCustodyMode === 'REPAIR' &&
      (!this.access.can('REPAIR_DISPATCH', d.proposal.sourceYardUuid) ||
        !v.repairAuthorizationReference.trim())
    ) {
      this.error.set('La reparación exige REPAIR_DISPATCH y referencia de excepción.');
      return;
    }
    const accepted = d.items
      .filter((i) => i.expected && i.assetUuid && this.selected().includes(i.rootAssetUuid!))
      .map((i) => i.assetUuid!);
    if (v.action === 'CORRECTED' && !accepted.length) {
      this.error.set('Selecciona al menos un conjunto esperado completo.');
      return;
    }
    if (
      !(await confirm(
        this.dialog,
        'Registrar decisión',
        'Confirmar o corregir creará y despachará el movimiento atómicamente.',
      ))
    )
      return;
    await this.submitKeyed<M.Decision>(
      '/proposals/' + this.id() + '/decide',
      {
        action: v.action,
        reason: v.reason,
        acceptedAssetUuids: v.action === 'CORRECTED' ? accepted : [],
        authorizationReference: v.authorizationReference || null,
        repairAuthorizationReference: v.repairAuthorizationReference || null,
        version: d.proposal.version,
      },
      (r) => {
        this.form.markAsPristine();
        this.success.set('Decisión registrada.');
        void this.load();
      },
    );
  }
  async reload() {
    if (
      await confirm(this.dialog, 'Recargar propuesta', 'Se descartará la decisión sin guardar.')
    ) {
      this.form.reset({
        action: 'CONFIRMED',
        reason: '',
        authorizationReference: '',
        repairAuthorizationReference: '',
      });
      this.selected.set([]);
      await this.load();
    }
  }
}
