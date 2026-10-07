import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { SubjectPickerComponent } from '../../../documents/shared/subject-picker/subject-picker.component';
import { QueryAccess } from '../../access';
import { Dashboard } from '../../models';
@Component({
  selector: 'tc-query-dashboard',
  imports: [RouterLink, PageHeading, Feedback, RecordValuesComponent, SubjectPickerComponent],
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
