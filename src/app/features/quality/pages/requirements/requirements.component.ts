import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PageHeading, ListContainer, Feedback, Pagination, SearchToolbar } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import { QualityNavComponent } from '../../shared/quality-nav/quality-nav.component';
import { PendingRequestsComponent } from '../../shared/pending-requests/pending-requests.component';
import { OptionPickerComponent } from '../../selectors/option-picker/option-picker.component';
import * as M from '../../models';
import { RequirementComponent } from '../../editors/requirement/requirement.component';

@Component({
  selector: 'tc-quality-requirements',
  imports: [
    ReactiveFormsModule,
    PageHeading,
    ListContainer,
    Feedback,
    Pagination,
    QualityNavComponent,
    PendingRequestsComponent,
    OptionPickerComponent,
    SearchToolbar,
  ],
  templateUrl: './requirements.component.html',
  styleUrl: './requirements.component.scss',
})
export class RequirementsComponent extends QualityPage {
  readonly rows = signal<M.Requirement[]>([]);
  readonly sheet = new FormControl('');

  ngOnInit() {
    this.watch(() => {
      this.sheet.setValue(this.route.snapshot.queryParamMap.get('sheetUuid') ?? '');
      return this.load();
    });
  }

  async load() {
    if (!this.sheet.value) {
      this.rows.set([]);
      return;
    }
    await this.request(
      () =>
        this.get<M.Requirement[]>('/requirements', {
          sheetUuid: this.sheet.value,
          offset: this.offset(),
          limit: this.limit(),
        }),
      (r) => this.rows.set(r),
    );
  }

  async create() {
    if (await this.editor(RequirementComponent, {}, 'Nuevo requisito')) await this.load();
  }

  async transition(path: string, version: number) {
    await this.mutate(
      () => this.api.post(path, { version }),
      () => this.load(),
    );
  }
}
