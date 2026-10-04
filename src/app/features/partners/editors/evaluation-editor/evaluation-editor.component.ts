import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PartnerEditor } from '../../editor-base';
import { codeValidator } from '../../../../shared/ui/editor-model';
import { Feedback } from '../../../../shared/ui/page';
import { toInstant, scorePattern } from '../../rules';
@Component({
  selector: 'tc-evaluation-editor',
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './evaluation-editor.component.html',
  styleUrl: './evaluation-editor.component.scss',
  host: { '(keydown.escape)': 'escape($event)' },
})
export class EvaluationEditorComponent extends PartnerEditor {
  readonly form = inject(FormBuilder).nonNullable.group({
    scope: ['', [Validators.required, codeValidator]],
    score: ['', [Validators.required, Validators.pattern(scorePattern)]],
    classification: ['', [Validators.required, codeValidator]],
    decision: ['APPROVED', Validators.required],
    findings: ['', [Validators.required, Validators.maxLength(2000)]],
    nextReviewAt: ['', Validators.required],
    offset: ['+00:00', Validators.required],
  });
  override async save() {
    const v = this.form.getRawValue(),
      next = toInstant(v.nextReviewAt, v.offset);
    if (!next || Date.parse(next) <= Date.now())
      throw new Error('La próxima revisión debe ser posterior a la evaluación.');
    if (!this.session.can('AVL_MANAGE')) throw new Error('No tienes permiso para evaluar AVL.');
    return this.api.create(this.data.party, 'avl-evaluations', {
      scope: v.scope.trim().toUpperCase(),
      score: v.score,
      classification: v.classification.trim().toUpperCase(),
      decision: v.decision,
      findings: v.findings.trim(),
      nextReviewAt: next,
    });
  }
}
