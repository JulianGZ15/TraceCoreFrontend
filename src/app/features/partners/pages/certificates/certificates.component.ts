import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Certificate } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordEditorComponent } from '../../editors/record-editor/record-editor.component';

import { certificateFields } from '../../record-fields';
import { certificateState, reviews } from '../../rules';

@Component({
  selector: 'tc-party-certificates',
  imports: [Feedback, Pagination],
  templateUrl: './certificates.component.html',
  styleUrl: './certificates.component.scss',
})
export class CertificatesComponent extends SectionPage<Certificate> {
  readonly kind = 'certifications' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  readonly decisions = reviews;
  current(row: Certificate) {
    return certificateState(row, this.today());
  }
  async edit(row?: Certificate) {
    await this.open(RecordEditorComponent, {
      title: row ? 'Editar certificación' : 'Nueva certificación',
      party: this.uuid,
      kind: this.kind,
      row,
      fields: certificateFields,
      evidence: true,
      initial: row ? { ...row } : {},
    });
  }
}
