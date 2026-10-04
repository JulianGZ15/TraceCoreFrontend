import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { sections } from '../../models';
@Component({
  selector: 'tc-party-sections',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './section-navigation.component.html',
  styleUrl: './section-navigation.component.scss',
})
export class SectionNavigationComponent {
  readonly uuid = input.required<string>();
  readonly sections = sections;
}
