import { Component, input, output, inject, signal, effect, OnDestroy } from '@angular/core';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import { Feedback } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { SubjectKind, SubjectOption } from '../../models';
@Component({
  selector: 'tc-document-subject-picker',
  imports: [Feedback, EntitySearchComponent],
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
  readonly value = input('');
  readonly selected = output<SubjectOption | null>();
  readonly chosen = signal<SubjectOption | null>(null);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly hasMore = signal(false);
  readonly searchFn = (search: string) => this.searchSubjects(search);
  private stop = new Subject<void>();
  private seq = 0;
  constructor() {
    effect(() => {
      this.kind();
      this.purpose();
      this.source();
      this.yard();
      this.chosen.set(null);
    });
    this.api.session.ended.pipe(takeUntilDestroyed()).subscribe(() => {
      this.seq++;
      this.stop.next();
      this.chosen.set(null);
    });
  }
  async searchSubjects(search: string): Promise<EntityOption[]> {
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
          search,
          yardUuid: this.source() === 'QUERIES' && this.kind() === 'PARTY' ? null : this.yard(),
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
    if (!row) {
      this.chosen.set(null);
      this.selected.emit(null);
      return;
    }
    const subject: SubjectOption = { uuid: row.value, kind: this.kind(), label: row.label };
    this.chosen.set(subject);
    this.selected.emit(subject);
  }
  ngOnDestroy() {
    this.seq++;
    this.stop.next();
    this.stop.complete();
  }
}
