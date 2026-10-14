import { Skeleton } from '../../../../shared/ui/skeleton/skeleton.component';
import { DataTable } from '../../../../shared/ui/data-table/data-table.component';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { SectionPage } from '../../section-page';
import { Address, Evaluation } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { EvaluationEditorComponent } from '../../editors/evaluation-editor/evaluation-editor.component';

@Component({
  selector: 'tc-party-avl',
  imports: [Skeleton, DataTable, Feedback, Pagination, ReactiveFormsModule],
  templateUrl: './avl.component.html',
  styleUrl: './avl.component.scss',
})
export class AvlComponent extends SectionPage<Evaluation> {
  readonly kind = 'avl-evaluations' as const;
  readonly deliverySites = signal<Address[]>([]);
  readonly deliverySitesError = signal('');
  override ngOnInit() {
    super.ngOnInit();
    void this.loadDeliverySites();
  }
  async loadDeliverySites() {
    const uuid = this.uuid;
    const epoch = this.session.epoch();
    try {
      const rows: Address[] = [];
      const limit = 100;
      for (let offset = 0; ; offset += limit) {
        if (uuid !== this.uuid || epoch !== this.session.epoch()) return;
        const page = await this.api.deliverySites(uuid, offset, limit);
        rows.push(...page);
        if (page.length < limit) break;
      }
      if (uuid === this.uuid && epoch === this.session.epoch()) this.deliverySites.set(rows);
    } catch {
      if (uuid === this.uuid && epoch === this.session.epoch()) this.deliverySitesError.set('No se pudieron consultar los sitios del proveedor.');
    }
  }
  endTime(value: string) {
    return Date.parse(value);
  }
  readonly scopeForm = inject(FormBuilder).nonNullable.group({ scope: [''] });
  private scope = '';
  override filters(): Record<string, string | number> {
    return this.scope ? { scope: this.scope } : {};
  }
  applyScope() {
    const value = this.scopeForm.controls.scope.value.trim().toUpperCase();
    if (value && !/^[A-Z][A-Z0-9_:-]{0,79}$/.test(value)) {
      this.error.set('Indica un código de alcance válido.');
      return;
    }
    this.scope = value;
    this.rows.set([]);
    void this.load(0);
  }
  async edit() {
    await this.open(EvaluationEditorComponent, {
      title: 'Nueva evaluación AVL',
      party: this.uuid,
      kind: this.kind,
    });
  }
}
