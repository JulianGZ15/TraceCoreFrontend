import { Component, input } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { LookupComponent } from '../lookup/lookup.component';
import { Field } from '../../models';
import { label } from '../../rules';
@Component({
  selector: 'tc-commerce-fields',
  imports: [ReactiveFormsModule, LookupComponent],
  templateUrl: './fields.component.html',
  styleUrl: './fields.component.scss',
})
export class FieldsComponent {
  readonly form = input.required<FormGroup>();
  readonly fields = input<Field[]>([]);
  readonly yard = input('');
  readonly label = label;
}
