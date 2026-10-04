import { Component, inject, input, model, signal, OnInit, OnDestroy } from '@angular/core';
import { PartnersApi } from '../../partners-api';
import { Evidence } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { errorMessage } from '../../../../core/http/api';
@Component({
  selector: 'tc-evidence-picker',
  imports: [Feedback, Pagination],
  templateUrl: './evidence-picker.component.html',
  styleUrl: './evidence-picker.component.scss',
})
export class EvidencePickerComponent implements OnInit, OnDestroy {
  readonly party = input.required<string>();
  readonly value = model<string | null>(null);
  private api = inject(PartnersApi);
  readonly rows = signal<Evidence[]>([]);
  readonly offset = signal(0);
  readonly limit = signal(25);
  readonly busy = signal(false);
  readonly error = signal('');
  private generation = 0;
  ngOnInit() {
    void this.load();
  }
  hasSelected() {
    return this.rows().some((row) => row.uuid === this.value());
  }
  async load(offset = 0) {
    const generation = ++this.generation;
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.list<Evidence>(this.party(), 'evidence', offset, this.limit());
      if (generation !== this.generation) return;
      if (!rows.length && offset > 0) return;
      this.rows.set(rows);
      this.offset.set(offset);
    } catch (e) {
      if (generation === this.generation) this.error.set(errorMessage(e));
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
  ngOnDestroy() {
    ++this.generation;
    this.rows.set([]);
  }
  choose(event: Event) {
    this.value.set((event.target as HTMLSelectElement).value || null);
  }
  resize(limit: number) {
    this.limit.set(limit);
    void this.load();
  }
}
