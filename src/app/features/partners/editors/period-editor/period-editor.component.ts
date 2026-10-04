import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { PartnerEditor, EditContext } from '../../editor-base';
import { Terms, partyRoles } from '../../models';
import { toInstant, decimalPattern, label } from '../../rules';
import { codeValidator } from '../../../../shared/ui/editor-model';
import { Feedback } from '../../../../shared/ui/page';
export interface PeriodContext extends EditContext {
  mode: 'role' | 'authorization' | 'terms' | 'close';
  row?: Terms;
}
@Component({
  selector: 'tc-period-editor',
  imports: [ReactiveFormsModule, Feedback],
  templateUrl: './period-editor.component.html',
  styleUrl: './period-editor.component.scss',
  host: { '(keydown.escape)': 'escape($event)' },
})
export class PeriodEditorComponent extends PartnerEditor {
  override readonly data = inject<PeriodContext>(DIALOG_DATA);
  readonly roles = partyRoles;
  readonly label = label;
  readonly form = inject(FormBuilder).nonNullable.group({
    role: ['SUPPLIER'],
    operation: ['OC'],
    validFrom: [''],
    validTo: [''],
    offset: ['+00:00', Validators.pattern(/^[+-](?:0\d|1[0-4]):[0-5]\d$/)],
    currency: ['MXN'],
    paymentMethod: [''],
    paymentCondition: [''],
    creditDays: ['0'],
    creditLimit: ['0'],
  });
  constructor() {
    super();
    const c = this.form.controls;
    if (this.data.mode === 'terms') {
      c.currency.addValidators([Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)]);
      c.paymentMethod.addValidators([Validators.required, codeValidator]);
      c.paymentCondition.addValidators([Validators.required, codeValidator]);
      c.creditDays.addValidators([
        Validators.required,
        Validators.pattern(/^\d{1,4}$/),
        Validators.min(0),
        Validators.max(3650),
      ]);
      c.creditLimit.addValidators([Validators.required, Validators.pattern(decimalPattern)]);
    }
    if (this.data.mode === 'close') c.validTo.addValidators(Validators.required);
    for (const control of Object.values(c)) control.updateValueAndValidity();
  }
  override async save() {
    const v = this.form.getRawValue(),
      from = toInstant(v.validFrom, v.offset),
      to = toInstant(v.validTo, v.offset);
    const start = this.data.mode === 'close' ? this.data.row!.validFrom : from;
    if (to && Date.parse(to) <= (start ? Date.parse(start) : Date.now()))
      throw new Error('El fin debe ser posterior al inicio; el límite final es exclusivo.');
    const mode = this.data.mode,
      permission = mode === 'role' ? 'PARTY_MANAGE' : 'PARTY_APPROVE';
    if (!this.session.can(permission)) throw new Error('No tienes permiso para esta operación.');
    if (mode === 'close')
      return this.api.action(this.data.party, 'commercial-terms', this.data.row!.uuid, 'close', {
        validTo: to,
        version: this.data.row!.version,
      });
    const period = { validFrom: from, validTo: to };
    if (mode === 'role')
      return this.api.create(this.data.party, 'roles', { ...period, role: v.role });
    if (mode === 'authorization')
      return this.api.create(this.data.party, 'operation-authorizations', {
        ...period,
        operation: v.operation,
      });
    return this.api.create(this.data.party, 'commercial-terms', {
      ...period,
      currency: v.currency.toUpperCase(),
      paymentMethod: v.paymentMethod.trim().toUpperCase(),
      paymentCondition: v.paymentCondition.trim().toUpperCase(),
      creditDays: Number(v.creditDays),
      creditLimit: v.creditLimit,
    });
  }
}
