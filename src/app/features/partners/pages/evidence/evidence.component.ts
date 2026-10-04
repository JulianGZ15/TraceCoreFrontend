import { Component, signal } from '@angular/core';

import { SectionPage } from '../../section-page';
import { Evidence } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { partnerError } from '../../rules';
import { errorMessage } from '../../../../core/http/api';
import { confirm } from '../../../../shared/ui/editor';
import { CanDeactivateFn } from '@angular/router';
@Component({
  selector: 'tc-party-evidence',
  imports: [Feedback, Pagination],
  templateUrl: './evidence.component.html',
  styleUrl: './evidence.component.scss',
})
export class EvidenceComponent extends SectionPage<Evidence> {
  readonly kind = 'evidence' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  readonly file = signal<File | null>(null);
  selected(event: Event) {
    this.file.set((event.target as HTMLInputElement).files?.[0] ?? null);
  }
  async edit() {}
  async upload() {
    if (!this.session.can('PARTY_MANAGE') || !this.file() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.upload(this.uuid, this.file()!);
      this.file.set(null);
      const input = document.getElementById('evidence-file') as HTMLInputElement | null;
      if (input) input.value = '';
      this.success.set('Evidencia cargada.');
      await this.load(0);
    } catch (e) {
      this.error.set(partnerError(e) || errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  async download(row: Evidence) {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.download(this.uuid, row);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  override ngOnDestroy() {
    this.file.set(null);
    super.ngOnDestroy();
  }
  async canLeave() {
    return (
      !this.session.valid() ||
      !this.file() ||
      (await confirm(
        this.dialog,
        'Descartar selección',
        'El archivo seleccionado aún no se ha cargado.',
      ))
    );
  }
}
export const evidenceDraftGuard: CanDeactivateFn<EvidenceComponent> = (component) =>
  component.canLeave();
