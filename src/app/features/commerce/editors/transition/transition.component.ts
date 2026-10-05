import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommerceEditor } from '../../editor';
import { FieldsComponent } from '../../shared/fields/fields.component';
import { Feedback } from '../../../../shared/ui/page';
import { Entity, Field } from '../../models';
import { exact, instant, fraction } from '../../rules';
@Component({
  selector: 'tc-commerce-transition-editor',
  imports: [ReactiveFormsModule, FieldsComponent, Feedback],
  templateUrl: './transition.component.html',
  styleUrl: './transition.component.scss',
})
export class TransitionComponent extends CommerceEditor {
  setup() {
    const action = this.data.action!;
    this.permission =
      action === 'complete-service' ||
      action === 'confirm-delivery' ||
      action === 'confirm-sale-ownership'
        ? 'COMMERCIAL_FULFILL'
        : action === 'settle-guarantee' || action === 'cancel-policy' || action === 'end-framework'
          ? 'CONTRACT_MANAGE'
          : action === 'cancel-allocation'
            ? 'COMMERCIAL_MANAGE'
            : 'COMMERCIAL_APPROVE';
    this.title = 'Confirmar ' + action;
    const fields: Field[] = action.startsWith('approve-')
      ? []
      : [
          {
            key: 'reference',
            label: 'Referencia o motivo',
            type: 'textarea',
            required: true,
            max: 500,
          },
        ];
    if (action === 'confirm-delivery')
      fields.splice(0, 1, {
        key: 'movementUuid',
        label: 'OUTBOUND completado',
        type: 'lookup',
        resource: 'movement-options',
        params: { type: 'OUTBOUND' },
        required: true,
      });
    if (action === 'settle-guarantee')
      fields.push({
        key: 'state',
        label: 'Resultado',
        type: 'select',
        choices: ['RELEASED', 'CALLED'],
        required: true,
      });
    this.make(fields);
  }
  override allowed() {
    if (!super.allowed()) return false;
    const action = this.data.action!;
    if (action === 'confirm-sale-ownership') return this.session.can('OWNERSHIP_MANAGE');
    if (action === 'cancel-allocation')
      return this.access.can('RESERVATION_MANAGE', this.data.yard);
    if (action === 'approve-framework') return this.session.can('COMMERCIAL_APPROVE');
    if (action === 'end-framework') return this.session.can('CONTRACT_MANAGE');
    return true;
  }
  async submit() {
    const r = this.data.row!,
      a = this.data.action!;
    const paths: Record<string, string> = {
      'approve-order': 'orders',
      'cancel-order': 'orders',
      'close-order': 'orders',
      'approve-framework': 'frameworks',
      'end-framework': 'frameworks',
      'cancel-allocation': 'allocations',
      'complete-service': 'lines',
      'confirm-delivery': 'allocations',
      'confirm-sale-ownership': 'allocations',
      'cancel-policy': 'policies',
      'settle-guarantee': 'guarantees',
    };
    const commands: Record<string, string> = {
      'approve-order': 'approve',
      'cancel-order': 'cancel',
      'close-order': 'close',
      'approve-framework': 'approve',
      'end-framework': 'end',
      'cancel-allocation': 'cancel',
      'cancel-policy': 'cancel',
      'settle-guarantee': 'settle',
    };
    const result = await this.api.post<Entity | Entity[]>(
      '/' + paths[a] + '/' + r.uuid + '/' + (commands[a] ?? a),
      a.startsWith('approve-')
        ? { version: r.version }
        : { ...this.form.getRawValue(), version: r.version },
    );
    return Array.isArray(result) ? result[0] : result;
  }
}
