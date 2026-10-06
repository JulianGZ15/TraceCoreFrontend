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
  selector: 'tc-finance-note-new',
  imports: [
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
  setup() {
    this.fields = [
      { key: 'folio', label: 'Folio de nota', required: true, max: 80 },
      { key: 'reason', label: 'Motivo', required: true, type: 'textarea', max: 500 },
      { key: 'evidenceUuid', label: 'UUID de evidencia del mismo tercero (opcional)' },
    ];
    this.form = form(this.fields);
  }
}
