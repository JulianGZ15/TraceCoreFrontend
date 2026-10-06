import { Component, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogisticsPage } from '../../page';
import { LogisticsPending } from '../../pending';
import { Entity, Summary, Check, Row, Field } from '../../models';
import { form, message, label } from '../../rules';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { RecordsComponent } from '../../shared/records/records.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
@Component({
  selector: 'tc-logistics-receipt-detail',
  imports: [RouterLink, RecordsComponent, PageHeading, Feedback, Pagination],
  templateUrl: './receipt-detail.component.html',
  styleUrl: './receipt-detail.component.scss',
})
export class ReceiptDetailComponent extends LogisticsPage {
  override mode = 'detail';
  override title = 'Detalle de entrega';
  override columns = [
    { key: 'received', label: 'Recibida' },
    { key: 'condition', label: 'Condición declarada' },
    { key: 'observation', label: 'Observación' },
  ];
  async download() {
    const id = this.selected()?.['evidenceUuid'];
    if (typeof id !== 'string') return;
    try {
      await this.api.download(id, 'evidencia-entrega');
    } catch (e) {
      this.error.set(message(e));
    }
  }
  protected override async afterLoad() {
    const r = await this.api.get<Entity>('/receipts/' + this.id, {}, this.stop);
    this.selected.set(r);
    if (r.manifestUuid) {
      this.summary.set(
        await this.api.get<Summary>('/manifests/' + r.manifestUuid + '/summary', {}, this.stop),
      );
      this.yard = this.summary()!.manifest.yardUuid;
    }
    this.rows.set(
      await this.api.get<Row[]>(
        '/receipts/' + this.id + '/items',
        { offset: this.offset, limit: this.limit },
        this.stop,
      ),
    );
  }
}
