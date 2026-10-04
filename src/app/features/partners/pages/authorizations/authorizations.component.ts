import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { SectionPage } from '../../section-page';
import { Authorization } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';

import { PeriodEditorComponent } from '../../editors/period-editor/period-editor.component';

import { errorMessage } from '../../../../core/http/api';
@Component({
  selector: 'tc-party-authorizations',
  imports: [Feedback, Pagination, ReactiveFormsModule],
  templateUrl: './authorizations.component.html',
  styleUrl: './authorizations.component.scss',
})
export class AuthorizationsComponent extends SectionPage<Authorization> {
  readonly kind = 'operation-authorizations' as const;
  endTime(value: string) {
    return Date.parse(value);
  }
  readonly eligibilityForm = inject(FormBuilder).nonNullable.group({
    operation: ['OC'],
    scope: [''],
  });
  readonly eligibility = signal<import('../../models').Eligibility | null>(null);
  readonly checking = signal(false);
  private assessment = 0;
  private watching = this.eligibilityForm.valueChanges.subscribe(() => {
    ++this.assessment;
    this.eligibility.set(null);
    this.checking.set(false);
  });
  async edit() {
    await this.open(PeriodEditorComponent, {
      title: 'Nueva autorización',
      party: this.uuid,
      kind: this.kind,
      mode: 'authorization',
    });
  }
  async assess() {
    const v = this.eligibilityForm.getRawValue();
    if (v.operation === 'OC' && !/^[A-Za-z][A-Za-z0-9_:-]{0,79}$/.test(v.scope.trim())) {
      this.error.set('Indica el alcance AVL exacto para OC.');
      return;
    }
    const generation = ++this.assessment,
      epoch = this.session.epoch();
    this.checking.set(true);
    this.error.set('');
    this.eligibility.set(null);
    try {
      const result = await this.api.eligibility(
        this.uuid,
        v.operation as import('../../models').Operation,
        v.scope.trim(),
      );
      if (generation === this.assessment && epoch === this.session.epoch())
        this.eligibility.set(result);
    } catch (e) {
      if (generation === this.assessment) this.error.set(errorMessage(e));
    } finally {
      if (generation === this.assessment) this.checking.set(false);
    }
  }
  override async load(offset = this.offset()) {
    ++this.assessment;
    this.eligibility.set(null);
    await super.load(offset);
  }
  override ngOnDestroy() {
    ++this.assessment;
    this.watching.unsubscribe();
    super.ngOnDestroy();
  }
}
