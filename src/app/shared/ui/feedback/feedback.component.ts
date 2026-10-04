import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'tc-feedback',
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss',
})
export class Feedback {
  readonly message = input('');
  readonly kind = input<'danger' | 'success' | 'info'>('danger');
}
