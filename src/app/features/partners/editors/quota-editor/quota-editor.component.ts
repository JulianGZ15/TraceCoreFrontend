import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PartnerEditor } from '../../editor-base';
import { QuotaYard } from '../../models';
import { Feedback, Pagination } from '../../../../shared/ui/page';
import { codeValidator } from '../../../../shared/ui/editor-model';
import { toInstant, uuidPattern } from '../../rules';
import { errorMessage } from '../../../../core/http/api';
@Component({
  selector: 'tc-quota-editor',
  imports: [ReactiveFormsModule, Feedback, Pagination],
  templateUrl: './quota-editor.component.html',
  styleUrl: './quota-editor.component.scss',
  host: { '(keydown.escape)': 'escape($event)' },
})
export class QuotaEditorComponent extends PartnerEditor {
  readonly form = inject(FormBuilder).nonNullable.group({
    location: ['YARD'],
    yardUuid: [''],
    regionCode: [''],
    productScope: ['', [Validators.required, codeValidator]],
    quantity: [
      '',
      [Validators.required, Validators.pattern(/^[1-9]\d{0,9}$/), Validators.max(2147483647)],
    ],
    validFrom: [''],
    validTo: ['', Validators.required],
    offset: ['+00:00', Validators.required],
    conditions: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  readonly yards = signal<QuotaYard[]>([]);
  readonly yardOffset = signal(0);
  readonly loadingYards = signal(false);
  readonly yardError = signal('');
  private yardGeneration = 0;
  readonly isSelectedYard = (yard: QuotaYard) => yard.uuid === this.form.controls.yardUuid.value;
  readonly yardLimit = signal(25);
  resizeYards(limit: number) {
    this.yardLimit.set(limit);
    void this.loadYards();
  }
  constructor() {
    super();
    void this.loadYards();
  }
  async loadYards(offset = 0) {
    const generation = ++this.yardGeneration;
    this.loadingYards.set(true);
    this.yardError.set('');
    try {
      const rows = await this.api.yards(offset, this.yardLimit());
      if (generation !== this.yardGeneration) return;
      if (!rows.length && offset > 0) return;
      this.yards.set(rows);
      this.yardOffset.set(offset);
    } catch (e) {
      if (generation === this.yardGeneration) this.yardError.set(errorMessage(e));
    } finally {
      if (generation === this.yardGeneration) this.loadingYards.set(false);
    }
  }
  override async save() {
    const v = this.form.getRawValue(),
      from = toInstant(v.validFrom, v.offset),
      to = toInstant(v.validTo, v.offset);
    if (!to || Date.parse(to) <= (from ? Date.parse(from) : Date.now()))
      throw new Error('La cuota requiere fin posterior al inicio.');
    if (v.location === 'YARD' && !uuidPattern.test(v.yardUuid))
      throw new Error('Selecciona un patio activo.');
    if (v.location === 'REGION' && !/^[A-Za-z][A-Za-z0-9_:-]{0,79}$/.test(v.regionCode.trim()))
      throw new Error('Indica un código de región válido.');
    if (!this.session.can('PARTY_APPROVE'))
      throw new Error('No tienes permiso para aprobar cuotas.');
    return this.api.create(this.data.party, 'distribution-quotas', {
      yardUuid: v.location === 'YARD' ? v.yardUuid : null,
      regionCode: v.location === 'REGION' ? v.regionCode.trim().toUpperCase() : null,
      productScope: v.productScope.trim().toUpperCase(),
      quantity: Number(v.quantity),
      validFrom: from,
      validTo: to,
      conditions: v.conditions.trim(),
    });
  }
  override ngOnDestroy() {
    ++this.yardGeneration;
    super.ngOnDestroy();
  }
}
