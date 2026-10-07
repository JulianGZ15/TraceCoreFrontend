import { Component, input, output, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { EvidenceOption } from '../../models';
import { uuidPattern } from '../../rules';
@Component({
  selector: 'tc-document-evidence-picker',
  imports: [ReactiveFormsModule, Feedback, Pagination],
  templateUrl: './evidence-picker.component.html',
  styleUrl: './evidence-picker.component.scss',
})
export class EvidencePickerComponent implements OnDestroy {
  readonly api = inject(WorkspaceApi);
  readonly document = input.required<string>();
  readonly selected = output<EvidenceOption | null>();
  readonly rows = signal<EvidenceOption[]>([]);
  readonly error = signal('');
  readonly busy = signal(false);
  readonly hasMore = signal(false);
  readonly chosen = signal<EvidenceOption | null>(null);
  readonly form = inject(FormBuilder).nonNullable.group({
    sourceKind: ['QUALITY'],
    contextKind: ['PARTY'],
    contextUuid: [''],
  });
  offset = 0;
  private seq = 0;
  private stop = new Subject<void>();
  apply() {
    this.resetSelection();
    void this.load();
  }
  async load() {
    const f = this.form.getRawValue();
    if (f.sourceKind !== 'QUALITY' && !uuidPattern.test(f.contextUuid)) {
      this.error.set('Indica el UUID del contexto de origen.');
      return;
    }
    const seq = ++this.seq,
      epoch = this.api.session.epoch();
    this.stop.next();
    this.busy.set(true);
    this.error.set('');
    try {
      const result = await this.api.get<Page<EvidenceOption>>(
        '/documents/evidence-options',
        {
          documentUuid: this.document(),
          sourceKind: f.sourceKind,
          contextKind: f.sourceKind === 'QUALITY' ? null : f.contextKind,
          contextUuid: f.sourceKind === 'QUALITY' ? null : f.contextUuid,
          offset: this.offset,
          limit: 25,
        },
        this.stop,
      );
      if (seq === this.seq && epoch === this.api.session.epoch()) {
        this.rows.set(result.items);
        this.hasMore.set(result.hasMore);
      }
    } catch (e) {
      if (seq === this.seq && this.api.session.valid()) this.error.set(errorMessage(e));
    } finally {
      if (seq === this.seq) this.busy.set(false);
    }
  }
  sourceChanged() {
    const s = this.form.controls.sourceKind.value;
    this.form.controls.contextKind.setValue(
      s === 'COMMERCIAL' ? 'ORDER' : s === 'LOGISTICS' ? 'MANIFEST' : 'PARTY',
    );
    this.resetSelection();
  }
  resetSelection() {
    this.seq++;
    this.stop.next();
    this.busy.set(false);
    this.offset = 0;
    this.rows.set([]);
    this.hasMore.set(false);
    this.chosen.set(null);
    this.selected.emit(null);
  }
  choose(row: EvidenceOption) {
    this.chosen.set(row);
    this.selected.emit(row);
  }
  move(offset: number) {
    this.offset = offset;
    void this.load();
  }
  ngOnDestroy() {
    this.seq++;
    this.stop.next();
    this.stop.complete();
  }
}
