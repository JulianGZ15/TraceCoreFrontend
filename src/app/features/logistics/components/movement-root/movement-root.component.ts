import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, input, output, inject, signal, DestroyRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { LookupComponent as InventoryLookup } from '../../../inventory/components/lookup/lookup.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { LogisticsPending } from '../../pending';
import { LogisticsAccess } from '../../access';
import { MovementDetail, Entity } from '../../models';
import { form, message } from '../../rules';
import { movementInput } from '../../../inventory/movement-input';
@Component({
  selector: 'tc-logistics-movement-root',
  imports: [ReactiveFormsModule, InventoryLookup, LookupComponent, FieldsComponent, Feedback],
  templateUrl: './movement-root.component.html',
  styleUrl: './movement-root.component.scss',
})
export class MovementRootComponent {
  constructor() {
    const destroy = inject(DestroyRef);
    this.pending.api.session.ended.pipe(takeUntilDestroyed(destroy)).subscribe(() => {
      this.form.reset();
      this.error.set('');
      this.busy.set(false);
    });
  }
  readonly context = input.required<Record<string, string>>();
  readonly saved = output<MovementDetail>();
  readonly pending = inject(LogisticsPending);
  readonly access = inject(LogisticsAccess);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly fields = [
    { key: 'grossWeightKg', label: 'Peso total de raíz kg', type: 'decimal' as const },
    { key: 'weightReference', label: 'Referencia del peso', max: 500 },
  ];
  readonly form = form([
    { key: 'assetUuid', label: 'Raíz', required: true },
    { key: 'destinationLocationUuid', label: 'Ubicación' },
    { key: 'reservationUuid', label: 'Reserva' },
    ...this.fields,
  ]);
  sourceFilters() {
    const c = this.context();
    return {
      yardUuid: c['type'] === 'RETURN' ? null : c['yardUuid'],
      rootsOnly: true,
      placementState: c['type'] === 'RETURN' ? 'EXTERNAL_SITE' : 'YARD',
    };
  }
  pick(key: string, v: string) {
    this.form.get(key)?.setValue(v);
    this.form.markAsDirty();
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.busy() || this.form.invalid) return;
    const c = this.context();
    try {
      if (!this.access.can('MOVEMENT_MANAGE', c['type'] === 'RETURN' ? undefined : c['yardUuid']))
        throw new Error('Falta MOVEMENT_MANAGE en origen.');
      if (c['destinationYardUuid'] && !this.access.can('MOVEMENT_MANAGE', c['destinationYardUuid']))
        throw new Error('Falta MOVEMENT_MANAGE en destino.');
      this.busy.set(true);
      const body = movementInput(c, [this.form.getRawValue()]);
      const r = await this.pending.create<MovementDetail>('MOVEMENT', '/movements', {
        ...body,
        requestKey: crypto.randomUUID(),
      });
      this.saved.emit(r);
      this.form.reset({
        assetUuid: '',
        destinationLocationUuid: '',
        reservationUuid: '',
        grossWeightKg: '',
        weightReference: '',
      });
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.busy.set(false);
    }
  }
  dirty() {
    return this.form.dirty;
  }
}
