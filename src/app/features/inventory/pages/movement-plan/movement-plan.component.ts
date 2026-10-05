import { Component, signal } from '@angular/core';

import { FormControl, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryForm, toInstant } from '../../page-base';

import { decimalValidator } from '../../../equipment/rules';

import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { ObservationEditorComponent } from '../../components/observation-editor/observation-editor.component';

@Component({
  selector: 'tc-inventory-movement-plan',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    LookupComponent,
    YardPickerComponent,
    InventoryNavComponent,
    ObservationEditorComponent,
  ],
  templateUrl: './movement-plan.component.html',
  styleUrl: './movement-plan.component.scss',
})
export class MovementPlanComponent extends InventoryForm {
  readonly previousStep = (n: number) => n - 1;
  readonly proposal = signal(false);
  readonly step = signal(1);
  observations: M.Observation[] = [];
  readonly roots = new FormArray<FormGroup>([]);
  readonly form = new FormGroup({
    type: new FormControl<M.MovementType>('TRANSFER', { nonNullable: true }),
    destinationYardUuid: new FormControl('', { nonNullable: true }),
    destinationSiteUuid: new FormControl('', { nonNullable: true }),
    transitCustodianUuid: new FormControl('', { nonNullable: true }),
    destinationCustodianUuid: new FormControl('', { nonNullable: true }),
    destinationCustodyMode: new FormControl('STORAGE', { nonNullable: true }),
    reason: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(1000)],
    }),
    sourceReference: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    ownerAuthorizationReference: new FormControl('', { nonNullable: true }),
    expiresAt: new FormControl('', { nonNullable: true }),
    offset: new FormControl('+00:00', { nonNullable: true }),
    roots: this.roots,
  });
  ngOnInit() {
    this.proposal.set(this.route.snapshot.data['proposal'] === true);
    this.yard.set(this.route.snapshot.queryParamMap.get('yardUuid') ?? this.session.selectedYard());
    this.addRoot();
    this.form.markAsPristine();
  }
  addRoot() {
    if (this.roots.length >= 100) return;
    this.roots.push(
      new FormGroup({
        assetUuid: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        destinationLocationUuid: new FormControl('', { nonNullable: true }),
        grossWeightKg: new FormControl('', { nonNullable: true, validators: [decimalValidator()] }),
        weightReference: new FormControl('', { nonNullable: true }),
        reservationUuid: new FormControl('', { nonNullable: true }),
      }),
    );
    this.form.markAsDirty();
  }
  pick(g: FormGroup, key: string, v: string) {
    g.get(key)?.setValue(v);
    g.markAsDirty();
    this.form.markAsDirty();
  }
  sourceChanged(y: string) {
    this.yard.set(y);
    for (const g of this.roots.controls) {
      g.get('assetUuid')?.reset('');
      g.get('reservationUuid')?.reset('');
    }
    this.form.markAsDirty();
  }
  destinationChanged(y: string) {
    this.form.controls.destinationYardUuid.setValue(y);
    for (const g of this.roots.controls) g.get('destinationLocationUuid')?.reset('');
    this.form.markAsDirty();
  }
  typeChanged() {
    this.form.controls.destinationSiteUuid.reset('');
    this.form.controls.destinationCustodianUuid.reset('');
    for (const g of this.roots.controls) {
      g.get('assetUuid')?.reset('');
      g.get('reservationUuid')?.reset('');
      g.get('destinationLocationUuid')?.reset('');
    }
    this.form.markAsDirty();
  }
  sourceFilters() {
    return {
      yardUuid: this.form.controls.type.value === 'RETURN' ? null : this.yard(),
      rootsOnly: true,
      placementState:
        this.form.controls.type.value === 'INBOUND'
          ? 'UNLOCATED'
          : this.form.controls.type.value === 'RETURN'
            ? 'EXTERNAL_SITE'
            : 'YARD',
    };
  }
  async save() {
    if (this.step() < 4) {
      this.step.update((n) => n + 1);
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    try {
      const v = this.form.getRawValue();
      if (
        !this.access.can(
          this.proposal()
            ? 'INVENTORY_OBSERVE'
            : v.type === 'ADJUSTMENT'
              ? 'INVENTORY_ADJUST'
              : 'MOVEMENT_MANAGE',
          this.yard(),
        ) &&
        v.type !== 'INBOUND'
      )
        throw new Error('Falta capacidad en el origen.');
      if (
        v.type === 'RETURN' &&
        !this.access.global(this.proposal() ? 'INVENTORY_OBSERVE' : 'MOVEMENT_MANAGE')
      )
        throw new Error('El retorno desde sitio externo requiere capacidad COMPANY.');
      const permission = this.proposal()
        ? 'INVENTORY_OBSERVE'
        : v.type === 'ADJUSTMENT'
          ? 'INVENTORY_ADJUST'
          : 'MOVEMENT_MANAGE';
      if (
        v.type !== 'OUTBOUND' &&
        v.destinationYardUuid &&
        !this.access.can(permission, v.destinationYardUuid)
      )
        throw new Error('Falta capacidad en el destino.');
      const ids = new Set<string>();
      const roots: M.RootInput[] = this.roots.controls.map((g) => {
        const r = g.getRawValue();
        if (ids.has(r['assetUuid'])) throw new Error('No repitas una raíz.');
        ids.add(r['assetUuid']);
        if (r['grossWeightKg'] && !r['weightReference'].trim())
          throw new Error('El peso medido exige referencia.');
        if (v.type !== 'OUTBOUND' && v.type !== 'ADJUSTMENT' && !r['destinationLocationUuid'])
          throw new Error('Selecciona ubicación para cada raíz.');
        return {
          assetUuid: r['assetUuid'],
          destinationLocationUuid:
            v.type === 'OUTBOUND' ? null : r['destinationLocationUuid'] || null,
          destinationSiteUuid: v.type === 'OUTBOUND' ? v.destinationSiteUuid || null : null,
          grossWeightKg: r['grossWeightKg'] || null,
          weightReference: r['weightReference'] || null,
          reservationUuid: r['reservationUuid'] || null,
        };
      });
      if (v.type === 'OUTBOUND' && (!v.destinationSiteUuid || !v.destinationCustodianUuid))
        throw new Error('Selecciona sitio y custodio externos.');
      const movement = {
        type: v.type,
        roots,
        reason: v.reason,
        sourceReference: v.sourceReference,
        transitCustodianUuid: v.transitCustodianUuid || null,
        destinationCustodianUuid: v.type === 'OUTBOUND' ? v.destinationCustodianUuid || null : null,
        destinationCustodyMode: v.destinationCustodyMode,
        ownerAuthorizationReference: v.ownerAuthorizationReference || null,
      };
      if (this.proposal()) {
        const expiresAt = toInstant(v.expiresAt, v.offset);
        if (!expiresAt || Date.parse(expiresAt) <= Date.now())
          throw new Error('La propuesta exige expiración futura.');
        await this.submitKeyed<M.ProposalDetail>(
          '/proposals',
          { movement, observations: this.observations, externalEventUuid: null, expiresAt },
          (r) => {
            this.form.markAsPristine();
            void this.router.navigate(['/inventario/propuestas', r.proposal.uuid]);
          },
        );
      } else
        await this.submitKeyed<M.MovementDetail>('/movements', movement, (r) => {
          this.form.markAsPristine();
          void this.router.navigate(['/inventario/movimientos', r.movement.uuid]);
        });
    } catch (e) {
      this.error.set(String(e));
    }
  }
}
