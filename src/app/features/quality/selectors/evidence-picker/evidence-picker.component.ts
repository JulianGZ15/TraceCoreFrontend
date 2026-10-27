import { Component, input, output, signal } from '@angular/core';
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
  readonly allowUpload = input(false);
  readonly uploadingChange = output<boolean>();
  readonly selectedLabel = signal('');
  readonly file = signal<File | null>(null);
  readonly searchFn = (query: string) => this.searchEvidence(query);
  private fileInput?: HTMLInputElement;
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

  selectFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fileInput = input;
    const file = input.files?.[0] ?? null;
    this.error.set('');
    if (file && (file.size === 0 || file.size > 10 * 1024 * 1024)) {
      this.error.set('El archivo debe contener datos y pesar como máximo 10 MiB.');
      this.file.set(null);
      input.value = '';
      return;
    }
    if (file && !['application/pdf', 'image/png', 'image/jpeg', ''].includes(file.type)) {
      this.error.set('Selecciona un archivo PDF, PNG o JPEG.');
      this.file.set(null);
      input.value = '';
      return;
    }
    this.file.set(file);
    if (file) this.field.markAsDirty();
  }

  async uploadSelected() {
    const file = this.file();
    if (!file || !this.allowUpload() || !this.access.global('QUALITY_MANAGE') || this.busy()) return;
    this.uploadingChange.emit(true);
    try {
      await this.mutate(
        () => this.api.upload(file),
        (evidence) => {
          this.field.setValue(evidence.uuid);
          this.field.markAsDirty();
          this.selectedLabel.set(evidence.fileName);
          this.file.set(null);
          if (this.fileInput) this.fileInput.value = '';
        },
      );
    } finally {
      this.uploadingChange.emit(false);
    }
  }
}
