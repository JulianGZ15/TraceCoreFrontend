import { Component, inject, input, model, signal } from '@angular/core';
import { PartnersApi } from '../../partners-api';
import { EntityOption, EntitySearchComponent } from '../../../../shared/ui/entity-search/entity-search.component';
import { Feedback } from '../../../../shared/ui/page';
import { errorMessage } from '../../../../core/http/api';
@Component({
  selector: 'tc-evidence-picker',
  imports: [Feedback, EntitySearchComponent],
  templateUrl: './evidence-picker.component.html',
  styleUrl: './evidence-picker.component.scss',
})
export class EvidencePickerComponent {
  readonly party = input.required<string>();
  readonly value = model<string | null>(null);
  private api = inject(PartnersApi);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly selectedLabel = signal('');
  readonly searchFn = (search: string) => this.search(search);
  async search(search: string): Promise<EntityOption[]> {
    this.busy.set(true);
    this.error.set('');
    try {
      const rows = await this.api.list<import('../../models').Evidence>(this.party(), 'evidence', 0, 25, { search });
      return rows.slice(0, 25).map((row) => ({ value: row.uuid, label: row.filename, meta: row.mediaType }));
    } catch (e) {
      this.error.set(errorMessage(e));
      return [];
    } finally {
      this.busy.set(false);
    }
  }
  choose(option: EntityOption | null) {
    this.value.set(option?.value ?? null);
    this.selectedLabel.set(option?.label ?? '');
  }
}
