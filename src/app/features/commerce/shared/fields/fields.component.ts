import { DateFieldComponent } from '../../../../shared/ui/date-field/date-field.component';
import { Component, inject, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { LookupComponent } from '../lookup/lookup.component';
import { Field } from '../../models';
import { label } from '../../rules';
import { Session } from '../../../../core/auth/session';
import { HelpTipComponent } from '../../../../shared/ui/help-tip/help-tip.component';
import { TIME_ZONE_OPTIONS } from '../../../../shared/time-zones';

@Component({
  selector: 'tc-commerce-fields',
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
  readonly timeZones = TIME_ZONE_OPTIONS;
  private readonly paramsCache = new Map<string, { party: string; value: Record<string, string> }>();
  private readonly emptyParams: Record<string, string> = {};
  lookupParams(field: Field): Record<string, string> {
    if (!field.relatedPartyKey) return field.params ?? this.emptyParams;
    const party = String(this.form().get(field.relatedPartyKey)?.value ?? '');
    const cached = this.paramsCache.get(field.key);
    if (cached?.party === party) return cached.value;
    const value = { ...(field.params ?? {}), partyUuid: party };
    this.paramsCache.set(field.key, { party, value });
    return value;
  }
  get timeZone(): string {
    return (
      String(this.form().get('timezone')?.value ?? '') ||
      this.session.context()?.yards.find((yard) => yard.uuid === this.yard())?.timezone ||
      this.session.context()?.company.timezone ||
      'UTC'
    );
  }
}
