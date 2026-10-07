import { Component, input, output, inject, signal, effect, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { errorMessage } from '../../../../core/http/api';
export interface FilterOption {
  uuid: string;
  label: string;
}
@Component({
  selector: 'tc-query-filter-picker',
  imports: [ReactiveFormsModule, Feedback, Pagination],
  templateUrl: './filter-picker.component.html',
  styleUrl: './filter-picker.component.scss',
})
export class FilterPickerComponent implements OnDestroy {
  readonly api = inject(WorkspaceApi);
  readonly query = input.required<'INVENTORY' | 'ORDERS'>();
  readonly kind = input.required<string>();
  readonly yard = input('');
  readonly label = input.required<string>();
  readonly selected = output<FilterOption>();
  readonly chosen = signal<FilterOption | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly rows = signal<FilterOption[]>([]);
  readonly hasMore = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  private stop = new Subject<void>();
  private seq = 0;
  offset = 0;
  constructor() {
    effect(() => {
      this.query();
      this.kind();
      this.yard();
      this.offset = 0;
      this.chosen.set(null);
      this.rows.set([]);
    });
    this.api.session.ended.pipe(takeUntilDestroyed()).subscribe(() => {
      this.seq++;
      this.stop.next();
      this.rows.set([]);
      this.chosen.set(null);
    });
  }
  async load() {
    const seq = ++this.seq,
      epoch = this.api.session.epoch();
    this.stop.next();
    this.busy.set(true);
    this.error.set('');
    try {
      const r = await this.api.get<Page<FilterOption>>(
        '/queries/filter-options',
        {
          query: this.query(),
          kind: this.kind(),
          yardUuid: this.yard(),
          search: this.search.value,
          offset: this.offset,
          limit: 25,
        },
        this.stop,
      );
      if (seq === this.seq && epoch === this.api.session.epoch()) {
        this.rows.set(r.items);
        this.hasMore.set(r.hasMore);
      }
    } catch (e) {
      if (seq === this.seq && this.api.session.valid()) this.error.set(errorMessage(e));
    } finally {
      if (seq === this.seq) this.busy.set(false);
    }
  }
  apply() {
    this.offset = 0;
    void this.load();
  }
  move(offset: number) {
    this.offset = offset;
    void this.load();
  }
  choose(row: FilterOption) {
    this.chosen.set(row);
    this.selected.emit(row);
  }
  ngOnDestroy() {
    this.seq++;
    this.stop.next();
    this.stop.complete();
  }
}
