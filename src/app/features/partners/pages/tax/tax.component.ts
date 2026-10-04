import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Tax } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordEditorComponent } from '../../editors/record-editor/record-editor.component';

import { taxFields } from '../../record-fields';
import { reviews } from '../../rules';

@Component({
  selector: 'tc-party-tax',
  imports: [Feedback, Pagination],
  templateUrl: './tax.component.html',
  styleUrl: './tax.component.scss',
})
export class TaxComponent extends SectionPage<Tax> {
  readonly kind = 'tax-identities' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  readonly decisions = reviews;
  async edit(row?: Tax) {
    await this.open(RecordEditorComponent, {
      title: row ? 'Editar identificación' : 'Nueva identificación fiscal',
      party: this.uuid,
      kind: this.kind,
      row,
      fields: taxFields,
      evidence: true,
      initial: row ? { ...row } : { country: 'MX' },
    });
  }
}
