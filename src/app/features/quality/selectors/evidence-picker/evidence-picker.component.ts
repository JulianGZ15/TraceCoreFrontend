import { Component, input, signal } from '@angular/core';
import { FormControl, AbstractControl } from '@angular/forms';
import { EntitySearchComponent, EntityOption } from '../../../../shared/ui/entity-search/entity-search.component';
import { Feedback } from '../../../../shared/ui/page';
import { QualityPage } from '../../page-base';
import * as M from '../../models';
@Component({
  selector: 'tc-quality-evidence',
  imports: [Feedback, EntitySearchComponent],
  templateUrl: './evidence-picker.component.html',
  styleUrl: './evidence-picker.component.scss',
})
export class EvidencePickerComponent extends QualityPage {
  readonly control = input.required<AbstractControl>();
  readonly selectedLabel = signal('');
  readonly searchFn = (query: string) => this.searchEvidence(query);
  get field() {
    return this.control() as FormControl;
  }
  async searchEvidence(search: string): Promise<EntityOption[]> {
    if (!this.access.global('QUALITY_READ')) return [];
    try {
      const rows = await this.get<M.Evidence[]>('/evidence', { search, offset: 0, limit: 25 });
      return rows.map((row) => ({ value: row.uuid, label: row.fileName, meta: row.mediaType }));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo consultar la evidencia.');
      return [];
    }
  }
  select(row: EntityOption | null) {
    this.field.setValue(row?.value ?? '');
    this.field.markAsDirty();
    this.selectedLabel.set(row?.label ?? '');
  }
}
