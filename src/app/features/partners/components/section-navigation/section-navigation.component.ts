import { Component, input, computed } from '@angular/core';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';
import { sections } from '../../models';

@Component({
  selector: 'tc-party-sections',
  imports: [PageNav],
  templateUrl: './section-navigation.component.html',
  styleUrl: './section-navigation.component.scss',
})
export class SectionNavigationComponent {
  readonly uuid = input.required<string>();
  readonly sections = sections;

  readonly items = computed<PageNavItem[]>(() => {
    const id = this.uuid();
    return this.sections.map(([key, label]) => ({
      label,
      route: `/terceros/${id}/${key}`,
    }));
  });
}

