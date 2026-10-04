import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { PartnerEditor, EditContext } from '../../editor-base';
import { Field } from '../../../../shared/ui/editor-model';
import { Feedback } from '../../../../shared/ui/page';
import { EvidencePickerComponent } from '../../components/evidence-picker/evidence-picker.component';
import { PartyData, Resource } from '../../models';
export interface RecordContext extends EditContext {
  fields: Field[];
  initial?: Record<string, unknown>;
  evidence?: boolean;
}
@Component({
  selector: 'tc-party-record-editor',
  imports: [ReactiveFormsModule, Feedback, EvidencePickerComponent],
  templateUrl: './record-editor.component.html',
  styleUrl: './record-editor.component.scss',
  host: { '(keydown.escape)': 'escape($event)' },
})
export class RecordEditorComponent extends PartnerEditor {
  override readonly data = inject<RecordContext>(DIALOG_DATA);
  readonly form = new FormGroup<Record<string, FormControl>>({});
  constructor() {
    super();
    for (const f of this.data.fields)
      this.form.addControl(
        f.key,
        new FormControl(
          this.data.initial?.[f.key] ??
            (f.type === 'checkbox' ? f.key === 'active' : f.key === 'country' ? 'MX' : ''),
          [
            ...(f.required ? [Validators.required] : []),
            ...(f.type === 'email' ? [Validators.email] : []),
            ...(f.validators ?? []),
          ],
        ),
      );
    if (this.data.evidence)
      this.form.addControl(
        'evidenceUuid',
        new FormControl(this.data.initial?.['evidenceUuid'] ?? null),
      );
  }
  override async save() {
    const v = this.form.getRawValue();
    for (const key of Object.keys(v))
      if (typeof v[key] === 'string') v[key] = v[key].trim() || null;
    if (v['country']) v['country'] = String(v['country']).toUpperCase();
    if (this.data.kind === 'contacts') {
      if (!v['email'] && !v['phone'])
        throw new Error('Indica un correo electrónico o un teléfono.');
      if (v['extension'] && !v['phone']) throw new Error('La extensión requiere un teléfono.');
      if (v['primary'] && !v['active'])
        throw new Error('Un contacto inactivo no puede ser principal.');
    }
    if (this.data.kind === 'tax-identities') {
      v['number'] = String(v['number'])
        .toUpperCase()
        .replace(/[\s.-]/g, '');
      if (!/^[A-Z0-9/]{1,100}$/.test(v['number']))
        throw new Error('El número fiscal contiene caracteres no admitidos.');
      v['type'] = String(v['type']).toUpperCase();
    }
    if (
      this.data.kind === 'certifications' &&
      v['expiresOn'] &&
      String(v['expiresOn']) < String(v['issuedOn'])
    )
      throw new Error('El vencimiento no puede preceder a la emisión.');
    if (!this.session.can('PARTY_MANAGE'))
      throw new Error('No tienes permiso para mantener terceros.');
    if (!this.data.kind) return this.api.createParty(v as unknown as PartyData);
    if (this.data.row)
      return this.api.update<Resource>(this.data.party, this.data.kind, this.data.row.uuid, {
        ...v,
        version: this.data.row.version,
      });
    return this.api.create<Resource>(this.data.party, this.data.kind, v);
  }
}
