import { Skeleton } from '../../../../shared/ui/skeleton/skeleton.component';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceDocument } from '../../document';
import { Field } from '../../models';
import { form } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
@Component({
  selector: 'tc-finance-invoice-new',
  imports: [
    Skeleton,
    DataTable,
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
    const supplierFields: Field[] = [
      { key: 'series', label: 'Serie externa', required: true, max: 40 },
      { key: 'folio', label: 'Folio externo del proveedor', required: true, max: 80 },
    ];
    const commonFields: Field[] = [
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
    this.fields = commonFields;
    this.form = form([...commonFields, ...supplierFields.map((field) => ({ ...field, required: false }))], {
      partyUuid: this.route.snapshot.queryParamMap.get('partyUuid') ?? '',
      currency: this.route.snapshot.queryParamMap.get('currency') ?? 'MXN',
      direction: 'RECEIVABLE',
      issuedAt: new Date().toISOString(),
      dueAt: new Date().toISOString(),
    });
    const updateDirection = (direction: string) => {
      const manual = direction === 'PAYABLE';
      this.fields = manual ? [...supplierFields, ...commonFields] : commonFields;
      for (const key of ['series', 'folio']) {
        const control = this.form.get(key)!;
        control.setValidators(manual ? [Validators.required, Validators.maxLength(key === 'series' ? 40 : 80)] : []);
        if (!manual) control.setValue('');
        control.updateValueAndValidity({ emitEvent: false });
      }
    };
    updateDirection('RECEIVABLE');
    this.form.get('direction')!.valueChanges.subscribe((value) => updateDirection(String(value)));
  }
}
