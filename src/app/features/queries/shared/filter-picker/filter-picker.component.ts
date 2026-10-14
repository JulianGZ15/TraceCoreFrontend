import { Component, input, output, inject, signal, effect, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import { Feedback } from '../../../../shared/ui/page';
import { errorMessage } from '../../../../core/http/api';
export interface FilterOption {
  uuid: string;
  label: string;
}
@Component({
  selector: 'tc-query-filter-picker',
  imports: [Feedback, EntitySearchComponent],
  templateUrl: './filter-picker.component.html',
  styleUrl: './filter-picker.component.scss',
})
export class FilterPickerComponent implements OnDestroy {
  readonly api = inject(WorkspaceApi);
  readonly query = input.required<'INVENTORY' | 'ORDERS'>();
  readonly kind = input.required<string>();
  readonly yard = input('');
  readonly label = input.required<string>();
  readonly value = input('');
  readonly selected = output<FilterOption | null>();
  readonly chosen = signal<FilterOption | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly searchFn = (search: string) => this.loadOptions(search);
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
    });
    this.api.session.ended.pipe(takeUntilDestroyed()).subscribe(() => {
      this.seq++;
      this.stop.next();
      this.chosen.set(null);
    });
  }
  async loadOptions(search: string): Promise<EntityOption[]> {
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
          search,
          offset: 0,
          limit: 25,
        },
        this.stop,
      );
      if (seq === this.seq && epoch === this.api.session.epoch()) {
        return r.items.map((row) => ({ value: row.uuid, label: row.label }));
      }
      return [];
    } catch (e) {
      if (seq === this.seq && this.api.session.valid()) this.error.set(errorMessage(e));
      return [];
    } finally {
      if (seq === this.seq) this.busy.set(false);
    }
  }
  choose(row: EntityOption | null) {
    const option = row ? { uuid: row.value, label: row.label } : null;
    this.chosen.set(option);
    this.selected.emit(option);
  }
  ngOnDestroy() {
    this.seq++;
    this.stop.next();
    this.stop.complete();
  }
}
