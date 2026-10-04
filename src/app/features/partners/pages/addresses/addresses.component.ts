import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Address } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordEditorComponent } from '../../editors/record-editor/record-editor.component';

import { addressFields } from '../../record-fields';

@Component({
  selector: 'tc-party-addresses',
  imports: [Feedback, Pagination],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss',
})
export class AddressesComponent extends SectionPage<Address> {
  readonly kind = 'addresses' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  async edit(row?: Address) {
    await this.open(RecordEditorComponent, {
      title: row ? 'Editar domicilio' : 'Nuevo domicilio',
      party: this.uuid,
      kind: this.kind,
      row,
      fields: addressFields,
      initial: row ? { ...row } : { country: 'MX', type: 'COMMERCIAL', active: true },
    });
  }
}
