import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import { Component, inject, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { LookupComponent } from '../lookup/lookup.component';
import { Field } from '../../models';
import { label } from '../../rules';
import { Session } from '../../../../core/auth/session';
import { HelpTipComponent } from '../../../../shared/ui/help-tip/help-tip.component';
@Component({
  selector: 'tc-logistics-fields',
  imports: [ReactiveFormsModule, LookupComponent, DateFieldComponent, HelpTipComponent],
  templateUrl: './fields.component.html',
  styleUrl: './fields.component.scss',
})
export class FieldsComponent {
  private readonly session = inject(Session);
  readonly form = input.required<FormGroup>();
  readonly fields = input<Field[]>([]);
  readonly yard = input('');
  readonly label = label;
  get timeZone(): string {
    return (
      this.session.context()?.yards.find((yard) => yard.uuid === this.yard())?.timezone ||
      this.session.context()?.company.timezone ||
      'UTC'
    );
  }
}
