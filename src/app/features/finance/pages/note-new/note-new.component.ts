import { Skeleton } from '../../../../shared/ui/skeleton/skeleton.component';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { Component } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceDocument } from '../../document';
import { form } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
@Component({
  selector: 'tc-finance-note-new',
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
  templateUrl: './note-new.component.html',
  styleUrl: './note-new.component.scss',
})
export class NoteNewComponent extends FinanceDocument {
  override kind: 'INVOICE' | 'CREDIT_NOTE' = 'CREDIT_NOTE';
  private readonly supplierFolio = { key: 'folio', label: 'Folio externo de la nota recibida', required: true, max: 80 };
  private readonly noteFields = [
    { key: 'reason', label: 'Motivo', required: true, type: 'textarea' as const, max: 500 },
    { key: 'evidenceUuid', label: 'UUID de evidencia del mismo tercero (opcional)' },
  ];
  setup() {
    this.fields = this.noteFields;
    this.form = form([...this.noteFields, { ...this.supplierFolio, required: false }]);
  }
  protected override afterReferenceLoaded(invoice: import('../../models').InvoiceDetail) {
    const external = invoice.invoice.direction === 'PAYABLE';
    this.fields = external ? [this.supplierFolio, ...this.noteFields] : this.noteFields;
    const control = this.form.get('folio')!;
    control.setValidators(external ? [Validators.required, Validators.maxLength(80)] : []);
    if (!external) control.setValue('');
    control.updateValueAndValidity({ emitEvent: false });
  }
}
