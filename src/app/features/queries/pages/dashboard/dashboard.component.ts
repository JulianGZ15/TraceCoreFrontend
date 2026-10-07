import { Component, inject, signal } from '@angular/core';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback, SearchToolbar } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { SubjectPickerComponent } from '../../../documents/shared/subject-picker/subject-picker.component';
import { QueryAccess } from '../../access';
import { Dashboard } from '../../models';
import { SectionNavComponent } from '../../components/section-nav/section-nav.component';

@Component({
  selector: 'tc-query-dashboard',
  imports: [
    PageHeading,
    Feedback,
    RecordValuesComponent,
    SubjectPickerComponent,
    SearchToolbar,
    SectionNavComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent extends ReadPage {
  readonly access = inject(QueryAccess);
  readonly data = signal<Dashboard | null>(null);
  yard = '';

  override async load() {
    this.yard = this.route.snapshot.queryParamMap.get('yardUuid') ?? this.session.selectedYard();
    this.data.set(null);
    if (!this.access.dashboard(this.yard)) {
      this.stop.next();
      return;
    }
    await this.read(
      () => this.api.get<Dashboard>('/queries/dashboard', { yardUuid: this.yard }, this.stop),
      (r) => this.data.set(r),
    );
  }

  override clear() {
    this.data.set(null);
  }

  choose(yard: string) {
    void this.change({ yardUuid: yard });
  }

  open(kind: string, uuid: string) {
    void this.router.navigate(['/consultas', kind, uuid]);
  }
}
