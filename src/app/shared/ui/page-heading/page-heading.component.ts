import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'tc-page-heading',
  imports: [RouterLink],
  templateUrl: './page-heading.component.html',
  styleUrl: './page-heading.component.scss',
})
export class PageHeading {
  readonly section = input('Organización');
  readonly title = input.required<string>();
  readonly description = input('');
}
