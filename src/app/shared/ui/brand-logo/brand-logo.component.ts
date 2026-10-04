import { Component, input } from '@angular/core';
@Component({
  selector: 'tc-brand-logo',
  templateUrl: './brand-logo.component.html',
  styleUrl: './brand-logo.component.scss',
})
export class BrandLogo {
  readonly variant = input<'login' | 'sidebar' | 'compact'>('sidebar');
  readonly decorative = input(false);
}
