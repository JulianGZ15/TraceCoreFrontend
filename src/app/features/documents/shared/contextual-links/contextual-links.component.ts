import { Component, input, inject, signal, effect, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { SubjectKind, Linked, Document } from '../../models';
import { DocumentEditorComponent } from '../../editors/document-editor/document-editor.component';
import { linkState } from '../../rules';
import { errorMessage } from '../../../../core/http/api';
@Component({
  selector: 'tc-contextual-links',
  imports: [RouterLink, Feedback, Pagination],
  templateUrl: './contextual-links.component.html',
  styleUrl: './contextual-links.component.scss',
})
export class ContextualLinksComponent implements OnDestroy {
  readonly api = inject(WorkspaceApi);
  readonly dialog = inject(Dialog);
  readonly kind = input.required<SubjectKind>();
  readonly uuid = input.required<string>();
  readonly rows = signal<Linked[]>([]);
  readonly busy = signal(false);
  readonly opened = signal(false);
  readonly hasMore = signal(false);
  readonly error = signal('');
  readonly linkState = linkState;
  offset = 0;
  private stop = new Subject<void>();
  private seq = 0;
  constructor() {
    effect(() => {
      this.kind();
      this.uuid();
      this.seq++;
      this.stop.next();
      this.rows.set([]);
      this.opened.set(false);
      this.offset = 0;
    });
    this.api.session.ended.pipe(takeUntilDestroyed()).subscribe(() => {
      this.seq++;
      this.stop.next();
      this.rows.set([]);
      this.opened.set(false);
    });
  }
  async load() {
    if (!this.api.session.can('DOCUMENT_READ')) return;
    this.opened.set(true);
    const seq = ++this.seq,
      epoch = this.api.session.epoch();
    this.stop.next();
    this.busy.set(true);
    this.error.set('');
    try {
      const p = await this.api.get<Page<Linked>>(
        '/documents/links/directory',
        { subjectKind: this.kind(), subjectUuid: this.uuid(), offset: this.offset, limit: 25 },
        this.stop,
      );
      if (seq === this.seq && epoch === this.api.session.epoch()) {
        this.rows.set(p.items);
        this.hasMore.set(p.hasMore);
      }
    } catch (e) {
      if (seq === this.seq && this.api.session.valid()) this.error.set(errorMessage(e));
    } finally {
      if (seq === this.seq) this.busy.set(false);
    }
  }
  create() {
    this.dialog
      .open<Document>(DocumentEditorComponent, {
        data: { kind: this.kind(), uuid: this.uuid() },
        width: '760px',
        maxWidth: 'calc(100vw - 32px)',
        disableClose: true,
        ariaLabel: 'Nuevo documento contextual',
      })
      .closed.subscribe(() => void this.load());
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
