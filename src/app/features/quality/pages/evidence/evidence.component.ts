import { Component, signal, inject, input, effect, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormArray,
  FormGroup,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { PageHeading, ListContainer, Feedback, Pagination } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { TransitionComponent } from '../../editors/transition/transition.component';
import { EvidencePickerComponent } from '../../selectors/evidence-picker/evidence-picker.component';
import { OptionPickerComponent } from '../../selectors/option-picker/option-picker.component';
import { signedValidator, optionalExact, toInstant } from '../../rules';
import * as M from '../../models';
@Component({
  selector: 'tc-quality-evidence',
  imports: [
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
  ],
  templateUrl: './evidence.component.html',
  styleUrl: './evidence.component.scss',
})
export class EvidenceComponent extends QualityPage {
  readonly rows = signal<M.Evidence[]>([]);
  readonly file = signal<File | null>(null);
  private selectedInput?: HTMLInputElement;
  ngOnInit() {
    this.watch(() => this.load());
  }
  protected override clear() {
    this.file.set(null);
    if (this.selectedInput) this.selectedInput.value = '';
  }
  async load() {
    await this.request(
      () => this.get<M.Evidence[]>('/evidence', { offset: this.offset(), limit: this.limit() }),
      (r) => this.rows.set(r),
    );
  }
  select(event: Event) {
    this.selectedInput = event.target as HTMLInputElement;
    const f = this.selectedInput.files?.[0] ?? null;
    this.error.set('');
    if (f && f.size > 10485760) {
      this.error.set('El archivo supera 10 MiB.');
      this.file.set(null);
      return;
    }
    if (f && !['application/pdf', 'image/png', 'image/jpeg', ''].includes(f.type)) {
      this.error.set('Selecciona PDF, PNG o JPEG. El servidor verificará el contenido.');
      this.file.set(null);
      return;
    }
    this.file.set(f);
  }
  async upload() {
    const f = this.file();
    if (!f) return;
    await this.mutate(
      () => this.api.upload(f),
      async () => {
        this.file.set(null);
        await this.load();
      },
    );
  }
  async download(row: M.Evidence) {
    await this.mutate(
      () => this.api.download(row.uuid, row.fileName),
      () => {},
    );
  }
}
