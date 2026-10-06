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
  selector: 'tc-logistics-check-detail',
  imports: [RouterLink, RecordsComponent, PageHeading, Feedback, Pagination],
  templateUrl: './check-detail.component.html',
  styleUrl: './check-detail.component.scss',
})
export class CheckDetailComponent extends LogisticsPage {
  override mode = 'detail';
  override title = 'Conciliación de carga';
  override columns = [{ key: 'status', label: 'Resultado' }];
  protected override async afterLoad() {
    const r = await this.api.get<Entity>('/checks/' + this.id, {}, this.stop);
    this.selected.set(r);
    if (r.manifestUuid) {
      this.summary.set(
        await this.api.get<Summary>('/manifests/' + r.manifestUuid + '/summary', {}, this.stop),
      );
      this.yard = this.summary()!.manifest.yardUuid;
    }
    this.rows.set(
      await this.api.get<Row[]>(
        '/manifests/' + r.manifestUuid + '/checks/' + this.id + '/items',
        { offset: this.offset, limit: this.limit, status: this.filters['status'] },
        this.stop,
      ),
    );
  }
}
