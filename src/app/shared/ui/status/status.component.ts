import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'tc-status',
  templateUrl: './status.component.html',
  styleUrl: './status.component.scss',
})
export class Status {
  readonly active = input.required<boolean>();
}
