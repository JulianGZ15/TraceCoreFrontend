import { takeUntil } from 'rxjs';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { LogisticsPage } from '../../page';
import { Entity, Row, Summary } from '../../models';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordsComponent } from '../../shared/records/records.component';
import { SectionNavComponent } from '../../shared/section-nav/section-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { LookupComponent } from '../../shared/lookup/lookup.component';
import { message } from '../../rules';
@Component({
  selector: 'tc-logistics-evidence',
  imports: [
    PageHeading,
    Feedback,
    Pagination,
    RecordsComponent,
    SectionNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './evidence.component.html',
  styleUrl: './evidence.component.scss',
})
export class EvidenceComponent extends LogisticsPage {
  protected override resourceChanged() {
    this.file = null;
  }
  override title = 'Evidencias del manifiesto';
  override mode = 'manifest';
  override collection = 'evidence';
  override columns = [
    { key: 'mediaType', label: 'Tipo detectado' },
    { key: 'size', label: 'Bytes' },
    { key: 'sha256', label: 'SHA-256' },
  ];
  open(row: Entity) {
    this.selected.set(row);
  }
  file: File | null = null;
  dirty() {
    return !!this.file;
  }
  pickFile(e: Event) {
    this.file = (e.target as HTMLInputElement).files?.[0] ?? null;
  }
  async upload() {
    if (!this.file || this.loading()) return;
    this.loading.set(true);
    try {
      await this.api.upload(this.file, this.id);
      this.file = null;
      await this.reload();
    } catch (e) {
      this.error.set(message(e));
    } finally {
      this.loading.set(false);
    }
  }
  async download(r: Entity) {
    try {
      await this.api.download(r.uuid, r.filename ?? 'evidencia');
    } catch (e) {
      this.error.set(message(e));
    }
  }
  override ngOnInit() {
    super.ngOnInit();
    this.session.ended.pipe(takeUntil(this.ended)).subscribe(() => (this.file = null));
  }
  override ngOnDestroy() {
    this.file = null;
    super.ngOnDestroy();
  }
}
