import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import {movementInput} from '../../movement-input';
import { Component, signal, input, inject } from '@angular/core';
import { RfidPending } from '../../../rfid/pending';

import { AbstractControl, FormControl, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';

import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { InventoryForm, toInstant } from '../../page-base';

import { decimalValidator } from '../../../equipment/rules';

import * as M from '../../models';
import { LookupComponent } from '../../components/lookup/lookup.component';
import { YardPickerComponent } from '../../components/yard-picker/yard-picker.component';
import { InventoryNavComponent } from '../../components/inventory-nav/inventory-nav.component';
import { ObservationEditorComponent } from '../../components/observation-editor/observation-editor.component';

import { Spinner } from '../../../../shared/ui/page';
import { StepperComponent, StepperStep } from '../../../../shared/ui/stepper/stepper.component';
import { attemptFormValidation, presentValidationFeedback } from '../../../../shared/ui/form-validation';

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
    Spinner, DateFieldComponent, StepperComponent],
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
  readonly internalLocationFlow = signal(false);
  readonly sourceYardError = signal(false);
  readonly destinationYardError = signal(false);
  readonly step = signal(1);
  readonly direction = signal<'forward' | 'backward'>('forward');
  readonly steps: readonly StepperStep[] = [
    { label: 'Contexto' },
    { label: 'Raíces' },
    { label: 'Destino' },
    { label: 'Revisión' },
  ];

  goStep(n: number) {
    if (n > this.step()) {
      if (!this.validateStep(this.step())) return;
      n = Math.min(n, this.step() + 1);
    }
    if (n > this.step()) this.direction.set('forward');
    else if (n < this.step()) this.direction.set('backward');
    this.step.set(n);
    setTimeout(() => {
      document.querySelector<HTMLElement>('.wizard-step-heading')?.focus();
    }, 0);
  }

  private validateStep(step: number): boolean {
    if (step === 1) {
      if (this.yard()) {
        this.sourceYardError.set(false);
        return true;
      }
      this.sourceYardError.set(true);
      presentValidationFeedback(document.querySelector<HTMLElement>('form')!);
      return false;
    }
    if (step === 2) {
      const controls = this.roots.controls.map((root) => root.get('assetUuid')!);
      return controls.length > 0 && attemptFormValidation(this.form, controls, document.querySelector('form'));
    }
    if (step === 3) {
      const controls: AbstractControl[] = [this.form.controls.reason, this.form.controls.sourceReference];
      if (this.form.controls.type.value === 'OUTBOUND') {
        controls.push(this.form.controls.destinationSiteUuid, this.form.controls.destinationCustodianUuid);
      } else if (this.form.controls.type.value !== 'ADJUSTMENT') {
        controls.push(this.form.controls.destinationYardUuid);
        controls.push(...this.roots.controls.map((root) => root.get('destinationLocationUuid')!));
      }
      if (this.proposal()) controls.push(this.form.controls.expiresAt);
      this.destinationYardError.set(
        this.form.controls.type.value !== 'OUTBOUND' &&
          this.form.controls.type.value !== 'ADJUSTMENT' &&
          this.form.controls.destinationYardUuid.invalid,
      );
      return attemptFormValidation(this.form, controls, document.querySelector('form'));
    }
    return true;
  }

  prevStep() {
    this.direction.set('backward');
    this.step.update(this.previousStep);
    setTimeout(() => {
      document.querySelector<HTMLElement>('.wizard-step-heading')?.focus();
    }, 0);
  }
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
    const query = this.route.snapshot.queryParamMap;
    this.internalLocationFlow.set(query.get('internal') === 'true');
    const initialType = query.get('type');
    if (initialType === 'INBOUND' || initialType === 'TRANSFER') this.form.controls.type.setValue(initialType);
    if (this.internalLocationFlow() && !query.get('sourceReference')) this.form.controls.sourceReference.setValue('Ubicación interna');
    if (query.get('destinationYardUuid')) this.form.controls.destinationYardUuid.setValue(query.get('destinationYardUuid')!);
    if (this.rfidPassage() && this.rfidDirection() === 'ENTRY') this.form.controls.destinationYardUuid.setValue(this.rfidYard());
    const selectedAssets = (query.get('assetUuids') ?? '').split(',').filter(Boolean);
    if (selectedAssets.length) {
      for (const assetUuid of selectedAssets.slice(0, 100)) {
        this.addRoot();
        const root = this.roots.at(this.roots.length - 1);
        root.get('assetUuid')?.setValue(assetUuid);
        root.get('destinationLocationUuid')?.setValue(query.get('destinationLocationUuid') ?? '');
      }
    } else {
      this.addRoot();
      this.roots.at(0).get('destinationLocationUuid')?.setValue(query.get('destinationLocationUuid') ?? '');
    }
    this.syncConditionalValidators();
    this.form.markAsPristine();
  }
  addRoot() {
    if (this.roots.length >= 100) return;
    this.roots.push(
      new FormGroup({
        assetUuid: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        destinationLocationUuid: new FormControl('', {
          nonNullable: true,
          validators: this.requiresRootDestination() ? [Validators.required] : [],
        }),
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
    this.sourceYardError.set(false);
    for (const g of this.roots.controls) {
      g.get('assetUuid')?.reset('');
      g.get('reservationUuid')?.reset('');
    }
    this.form.markAsDirty();
  }
  destinationChanged(y: string) {
    this.form.controls.destinationYardUuid.setValue(y);
    this.destinationYardError.set(false);
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
    this.syncConditionalValidators();
    this.form.markAsDirty();
  }

  private requiresRootDestination(): boolean {
    return this.form.controls.type.value !== 'OUTBOUND' && this.form.controls.type.value !== 'ADJUSTMENT';
  }

  private syncConditionalValidators(): void {
    const outbound = this.form.controls.type.value === 'OUTBOUND';
    for (const [control, required] of [
      [this.form.controls.destinationSiteUuid, outbound],
      [this.form.controls.destinationCustodianUuid, outbound],
    ] as const) {
      control.setValidators(required ? [Validators.required] : []);
      control.updateValueAndValidity({ emitEvent: false });
    }
    const destinationRequired = this.requiresRootDestination();
    const yardRequired = !outbound && this.form.controls.type.value !== 'ADJUSTMENT';
    this.form.controls.destinationYardUuid.setValidators(yardRequired ? [Validators.required] : []);
    this.form.controls.destinationYardUuid.updateValueAndValidity({ emitEvent: false });
    for (const root of this.roots.controls) {
      const destination = root.get('destinationLocationUuid')!;
      destination.setValidators(destinationRequired ? [Validators.required] : []);
      destination.updateValueAndValidity({ emitEvent: false });
    }
    this.form.controls.expiresAt.setValidators(this.proposal() ? [Validators.required] : []);
    this.form.controls.expiresAt.updateValueAndValidity({ emitEvent: false });
  }
  sourceFilters() {
    if (this.form.controls.type.value === 'INBOUND') return { unlocatedForYard: this.yard(), rootsOnly: true };
    return {
      yardUuid: this.form.controls.type.value === 'RETURN' ? null : this.yard(),
      rootsOnly: true,
      placementState:
        this.form.controls.type.value === 'RETURN' ? 'EXTERNAL_SITE' : 'YARD',
    };
  }
  async save() {
    if (this.step() < 4) {
      this.goStep(this.step() + 1);
      return;
    }
    if (!attemptFormValidation(this.form) || this.busy()) return;
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
      } else {
        const internal = this.internalLocationFlow() && v.destinationYardUuid === this.yard() && (v.type === 'INBOUND' || v.type === 'TRANSFER');
        const internalCrossYard = this.internalLocationFlow() && v.type === 'TRANSFER' && v.destinationYardUuid && v.destinationYardUuid !== this.yard();
        await this.submitKeyed<M.MovementDetail>(internal ? '/movements/internal' : internalCrossYard ? '/movements/internal/prepare' : '/movements', movement, (r) => {
          this.form.markAsPristine();
          void this.router.navigate(['/inventario/movimientos', r.movement.uuid]);
        });
      }
    } catch (e) {
      this.error.set(String(e));
    }
  }
}
