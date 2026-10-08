import { Component, input } from '@angular/core';

@Component({
  selector: 'tc-progress-bar',
  imports: [],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
})
export class ProgressBar {
  readonly active = input<boolean>(false);
}
export { ProgressBar as ProgressBarComponent };
