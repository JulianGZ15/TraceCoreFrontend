import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReadPage } from '../../../../shared/ui/read-page';
import { PageHeading, Feedback, Pagination } from '../../../../shared/ui/page';
import { RecordValuesComponent } from '../../../../shared/ui/record-values/record-values.component';
import { Page } from '../../../../core/http/workspace-api';
import { QueryAccess } from '../../../queries/access';
import { validateFilters } from '../../../queries/filters';
@Component({
  selector: 'tc-support-audit',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeading,
    Feedback,
    Pagination,
    RecordValuesComponent,
  ],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.scss',
})
export class AuditComponent extends ReadPage {
  readonly access = inject(QueryAccess);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly selected = signal<Record<string, unknown> | null>(null);
  readonly hasMore = signal(false);
  readonly form = inject(FormBuilder).nonNullable.group({
    resourceType: '',
    resourceUuid: '',
    actorUuid: '',
    correlationUuid: '',
    from: '',
    to: '',
  });
  override async load() {
    const q = this.route.snapshot.queryParamMap;
    const values = { ...this.form.getRawValue() };
    for (const key of Object.keys(values))
      values[key as keyof typeof values] =
        q.get(key) ?? (key === 'yardUuid' ? this.session.selectedYard() : '');
    this.form.patchValue(values);
    this.selected.set(null);
    await this.read(
      () => {
        validateFilters(values);
        return this.api.get<Page<Record<string, unknown>>>(
          '/queries/support/audit',
          { ...values, offset: this.offset, limit: this.limit },
          this.stop,
        );
      },
      (r) => {
        this.rows.set(r.items);
        this.hasMore.set(r.hasMore);
      },
    );
  }
  override clear() {
    this.rows.set([]);
    this.selected.set(null);
  }
  apply() {
    try {
      validateFilters(this.form.getRawValue());
      void this.change({ ...this.form.getRawValue(), offset: 0 });
    } catch (e) {
      this.error.set((e as Error).message);
    }
  }
}
