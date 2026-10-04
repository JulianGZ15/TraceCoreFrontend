import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Quota } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { QuotaEditorComponent } from '../../editors/quota-editor/quota-editor.component';

@Component({
  selector: 'tc-party-quotas',
  imports: [Feedback, Pagination],
  templateUrl: './quotas.component.html',
  styleUrl: './quotas.component.scss',
})
export class QuotasComponent extends SectionPage<Quota> {
  readonly kind = 'distribution-quotas' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  async edit() {
    await this.open(QuotaEditorComponent, {
      title: 'Nueva cuota de distribución',
      party: this.uuid,
      kind: this.kind,
    });
  }
}
