import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { SectionPage } from '../../section-page';
import { Evaluation } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { EvaluationEditorComponent } from '../../editors/evaluation-editor/evaluation-editor.component';

@Component({
  selector: 'tc-party-avl',
  imports: [Feedback, Pagination, ReactiveFormsModule],
  templateUrl: './avl.component.html',
  styleUrl: './avl.component.scss',
})
export class AvlComponent extends SectionPage<Evaluation> {
  readonly kind = 'avl-evaluations' as const;
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
