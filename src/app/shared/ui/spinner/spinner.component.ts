import { Component, input } from '@angular/core';

@Component({
  selector: 'tc-spinner',
  imports: [],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
})
export class Spinner {
  readonly size = input<'sm' | 'md' | 'inline'>('sm');
  readonly message = input<string>('');
  readonly light = input<boolean>(false);
}
export { Spinner as SpinnerComponent };
