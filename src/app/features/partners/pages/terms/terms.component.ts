import { Component } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Terms } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { PeriodEditorComponent } from '../../editors/period-editor/period-editor.component';

import { exactAmount } from '../../rules';

@Component({
  selector: 'tc-party-terms',
  imports: [Feedback, Pagination],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
})
export class TermsComponent extends SectionPage<Terms> {
  readonly kind = 'commercial-terms' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  amount(row: Terms) {
    try {
      return exactAmount(row.creditLimitExact) + ' ' + row.currency;
    } catch {
      return 'Backend incompatible: falta importe decimal exacto.';
    }
  }
  async edit() {
    await this.open(PeriodEditorComponent, {
      title: 'Nueva condición comercial',
      party: this.uuid,
      kind: this.kind,
      mode: 'terms',
    });
  }
  async close(row: Terms) {
    await this.open(PeriodEditorComponent, {
      title: 'Cerrar condición comercial',
      party: this.uuid,
      kind: this.kind,
      mode: 'close',
      row,
    });
  }
}
