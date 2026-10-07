import { Component, input, output, inject, signal, effect, OnDestroy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { SubjectKind, SubjectOption } from '../../models';
@Component({
  selector: 'tc-document-subject-picker',
  imports: [ReactiveFormsModule, Feedback, Pagination],
  templateUrl: './subject-picker.component.html',
  styleUrl: './subject-picker.component.scss',
})
export class SubjectPickerComponent implements OnDestroy {
  readonly api = inject(WorkspaceApi);
  readonly kind = input.required<SubjectKind>();
  readonly purpose = input<'READ' | 'MANAGE'>('READ');
  readonly source = input<'DOCUMENTS' | 'QUERIES'>('DOCUMENTS');
  readonly yard = input('');
  readonly label = input('Seleccionar propietario');
  readonly selected = output<SubjectOption>();
  readonly chosen = signal<SubjectOption | null>(null);
  readonly search = new FormControl('', { nonNullable: true });
  readonly rows = signal<SubjectOption[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly hasMore = signal(false);
  offset = 0;
  private stop = new Subject<void>();
  private seq = 0;
  constructor() {
    effect(() => {
      this.kind();
      this.purpose();
      this.source();
      this.yard();
      this.offset = 0;
      this.chosen.set(null);
      void this.load();
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
      const path =
        this.source() === 'DOCUMENTS'
          ? '/documents/subject-options'
          : this.kind() === 'ASSET'
            ? '/queries/equipment-options'
            : '/queries/party-options';
      const r = await this.api.get<Page<SubjectOption>>(
        path,
        {
          kind: this.kind(),
          purpose: this.purpose(),
          search: this.search.value,
          yardUuid: this.source() === 'QUERIES' && this.kind() === 'PARTY' ? null : this.yard(),
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
  choose(row: SubjectOption) {
    this.chosen.set(row);
    this.selected.emit(row);
  }
  ngOnDestroy() {
    this.seq++;
    this.stop.next();
    this.stop.complete();
  }
}
