import { Component, input, output, signal, effect, untracked } from '@angular/core';

import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { Feedback } from '../../../../shared/ui/page';

import * as M from '../../models';
import { LookupComponent } from '../lookup/lookup.component';

@Component({
  selector: 'tc-inventory-observation-editor',
  imports: [ReactiveFormsModule, Feedback, LookupComponent],
  templateUrl: './observation-editor.component.html',
  styleUrl: './observation-editor.component.scss',
})
export class ObservationEditorComponent {
  readonly yard = input<string | null>(null);
  readonly value = input<M.Observation[]>([]);
  readonly changed = output<M.Observation[]>();
  readonly observations = signal<M.Observation[]>([]);
  readonly form = new FormGroup({
    assetUuid: new FormControl('', { nonNullable: true }),
    identifier: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(250)] }),
  });
  readonly error = signal('');
  constructor() {
    effect(() => {
      const v = this.value();
      untracked(() => this.observations.set(v));
    });
  }
  add() {
    const v = this.form.getRawValue();
    if (!v.assetUuid && !v.identifier.trim()) {
      this.error.set('Selecciona una pieza o indica un identificador desconocido.');
      return;
    }
    const o = { assetUuid: v.assetUuid || null, identifier: v.identifier.trim() || null };
    if (
      this.observations().some((r) =>
        o.assetUuid ? r.assetUuid === o.assetUuid : !r.assetUuid && r.identifier === o.identifier,
      )
    ) {
      this.error.set('La observación ya está en la lista.');
      return;
    }
    this.observations.update((rows) => [...rows, o]);
    this.changed.emit(this.observations());
    this.form.reset();
    this.error.set('');
  }
  remove(index: number) {
    this.observations.update((rows) => rows.filter((_, i) => i !== index));
    this.changed.emit(this.observations());
  }
}
