import {movementInput} from '../../movement-input';
import { Component, signal, input, inject } from '@angular/core';
import { RfidPending } from '../../../rfid/pending';

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
  readonly rfidPassage = input<string | null>(null);
  readonly rfidDirection = input('');
  readonly rfidYard = input('');
  readonly rfidPending = inject(RfidPending);
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
    this.proposal.set(this.route.snapshot.data['proposal'] === true || !!this.rfidPassage());
    this.yard.set(this.rfidYard() || this.route.snapshot.queryParamMap.get('yardUuid') || this.session.selectedYard());
    if (this.rfidPassage() && this.rfidDirection() === 'ENTRY') this.form.controls.destinationYardUuid.setValue(this.rfidYard());
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
      const movement = movementInput(v, this.roots.controls.map(g=>g.getRawValue()));
      if (this.proposal()) {
        const expiresAt = toInstant(v.expiresAt, v.offset);
        if (!expiresAt || Date.parse(expiresAt) <= Date.now())
          throw new Error('La propuesta exige expiración futura.');
        if (this.rfidPassage()) {
          if (this.rfidDirection() === 'EXIT' && this.yard() !== this.rfidYard() || this.rfidDirection() === 'ENTRY' && v.destinationYardUuid !== this.rfidYard())
            throw new Error('La propuesta debe respetar el patio y la dirección del paso.');
          await this.request(
            () => this.rfidPending.post<M.ProposalDetail>('/passages/' + this.rfidPassage() + '/proposal', { movement: { ...movement, requestKey: crypto.randomUUID() }, expiresAt }),
            (r: M.ProposalDetail) => { this.form.markAsPristine(); void this.router.navigate(['/inventario/propuestas', r.proposal.uuid]); },
          );
          return;
        }
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
