import { Component, input, output, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { WorkspaceApi, Page } from '../../../../core/http/workspace-api';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import { Feedback } from '../../../../shared/ui/page';
import { workspaceError as errorMessage } from '../../../../core/http/workspace-api';
import { EvidenceOption, SubjectKind, SubjectOption } from '../../models';
import { uuidPattern } from '../../rules';
@Component({ selector: 'tc-document-evidence-picker', imports: [ReactiveFormsModule, Feedback, EntitySearchComponent], templateUrl: './evidence-picker.component.html', styleUrl: './evidence-picker.component.scss' })
export class EvidencePickerComponent implements OnDestroy {
  readonly api = inject(WorkspaceApi); readonly document = input.required<string>(); readonly selected = output<EvidenceOption | null>();
  readonly error = signal(''); readonly busy = signal(false); readonly chosen = signal<EvidenceOption | null>(null);
  readonly contextUuid = signal(''); readonly contextLabel = signal(''); readonly contextBusy = signal(false);
  readonly evidenceSearch = (search: string) => this.searchEvidence(search); readonly contextSearch = (search: string) => this.searchContext(search);
  readonly form = inject(FormBuilder).nonNullable.group({ sourceKind: ['QUALITY'], contextKind: ['PARTY'] });
  private evidenceByUuid = new Map<string, EvidenceOption>();
  private seq = 0; private contextSeq = 0; private stop = new Subject<void>();
  async searchEvidence(search: string): Promise<EntityOption[]> {
    const f = this.form.getRawValue();
    if (f.sourceKind !== 'QUALITY' && !uuidPattern.test(this.contextUuid())) { this.error.set('Selecciona un contexto de origen.'); return []; }
    const seq = ++this.seq, epoch = this.api.session.epoch(); this.stop.next(); this.busy.set(true); this.error.set('');
    try {
      const result = await this.api.get<Page<EvidenceOption>>('/documents/evidence-options', {
        documentUuid: this.document(), sourceKind: f.sourceKind, contextKind: f.sourceKind === 'QUALITY' ? null : f.contextKind,
        contextUuid: f.sourceKind === 'QUALITY' ? null : this.contextUuid(), search, offset: 0, limit: 25,
      }, this.stop);
      if (seq !== this.seq || epoch !== this.api.session.epoch()) return [];
      const items = result.items.slice(0, 25);
      this.evidenceByUuid = new Map(items.map(row => [row.uuid, row]));
      return items.map(row => ({ value: row.uuid, label: row.filename, meta: `${row.mediaType} · ${row.size} bytes` }));
    } catch (e) { if (seq === this.seq && this.api.session.valid()) this.error.set(errorMessage(e)); return []; }
    finally { if (seq === this.seq) this.busy.set(false); }
  }
  async searchContext(search: string): Promise<EntityOption[]> {
    const kind = this.form.controls.contextKind.value as SubjectKind, seq = ++this.contextSeq, epoch = this.api.session.epoch();
    this.contextBusy.set(true); this.error.set('');
    try {
      if (kind === 'MANIFEST') {
        const page = await this.api.get<Page<{ uuid: string; label: string }>>('/queries/filter-options', { query: 'ORDERS', kind, search, offset: 0, limit: 25 }, this.stop);
        return seq === this.contextSeq && epoch === this.api.session.epoch() ? page.items.slice(0, 25).map(x => ({ value: x.uuid, label: x.label })) : [];
      }
      const page = await this.api.get<Page<SubjectOption>>('/documents/subject-options', { kind, purpose: 'READ', search, offset: 0, limit: 25 }, this.stop);
      return seq === this.contextSeq && epoch === this.api.session.epoch() ? page.items.slice(0, 25).map(x => ({ value: x.uuid, label: x.label })) : [];
    } catch (e) { if (seq === this.contextSeq && this.api.session.valid()) this.error.set(errorMessage(e)); return []; }
    finally { if (seq === this.contextSeq) this.contextBusy.set(false); }
  }
  chooseContext(row: EntityOption | null) { this.contextUuid.set(row?.value ?? ''); this.contextLabel.set(row?.label ?? ''); this.resetSelection(); }
  choose(row: EntityOption | null) {
    const option = row ? this.evidenceByUuid.get(row.value) ?? null : null;
    this.chosen.set(option); this.selected.emit(option);
  }
  sourceChanged() {
    const source = this.form.controls.sourceKind.value;
    this.form.controls.contextKind.setValue(source === 'COMMERCIAL' ? 'ORDER' : source === 'LOGISTICS' ? 'MANIFEST' : 'PARTY');
    this.contextUuid.set(''); this.contextLabel.set(''); this.resetSelection();
  }
  resetSelection() { this.seq++; this.stop.next(); this.busy.set(false); this.chosen.set(null); this.selected.emit(null); }
  ngOnDestroy() { this.seq++; this.contextSeq++; this.stop.next(); this.stop.complete(); }
}
