import { Component, input } from '@angular/core';
@Component({
  selector: 'tc-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class Icon {
  readonly name = input.required<string>();
}
