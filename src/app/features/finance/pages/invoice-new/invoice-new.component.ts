import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceDocument } from '../../document';
import { form } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
@Component({
  selector: 'tc-finance-invoice-new',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    FieldsComponent,
    LookupComponent,
    PendingRequestsComponent,
    PageHeading,
    Feedback,
  ],
  templateUrl: './invoice-new.component.html',
  styleUrl: './invoice-new.component.scss',
})
export class InvoiceNewComponent extends FinanceDocument {
  setup() {
    this.fields = [
      { key: 'series', label: 'Serie', required: true, max: 40 },
      { key: 'folio', label: 'Folio', required: true, max: 80 },
      {
        key: 'partyUuid',
        label: 'Tercero',
        required: true,
        type: 'lookup',
        resource: 'party-options',
        params: { activeOnly: 'true' },
      },
      {
        key: 'direction',
        label: 'Dirección',
        required: true,
        type: 'select',
        choices: ['RECEIVABLE', 'PAYABLE'],
      },
      { key: 'currency', label: 'Divisa', required: true, max: 3 },
      { key: 'issuedAt', label: 'Emisión con offset UTC', required: true, type: 'instant' },
      { key: 'dueAt', label: 'Vencimiento con offset UTC', required: true, type: 'instant' },
      { key: 'reference', label: 'Referencia', required: true, max: 500 },
    ];
    this.form = form(this.fields, {
      partyUuid: this.route.snapshot.queryParamMap.get('partyUuid') ?? '',
      currency: this.route.snapshot.queryParamMap.get('currency') ?? 'MXN',
      direction: 'RECEIVABLE',
      issuedAt: new Date().toISOString(),
      dueAt: new Date().toISOString(),
    });
  }
}
