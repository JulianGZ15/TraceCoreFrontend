import { Component, input, computed } from '@angular/core';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';
import { assetSections, catalogLinks } from '../../models';

@Component({
  selector: 'tc-equipment-section-navigation',
  imports: [PageNav],
  templateUrl: './section-navigation.component.html',
  styleUrl: './section-navigation.component.scss',
})
export class SectionNavigationComponent {
  readonly uuid = input<string>('');
  readonly catalog = input(false);
  readonly sections = assetSections;
  readonly links = catalogLinks;

  readonly items = computed<PageNavItem[]>(() => {
    if (this.catalog()) {
      return this.links.map(([key, label]) => ({
        label,
        route: `/catalogo/${key}`,
      }));
    }
    const id = this.uuid();
    return this.sections.map(([key, label]) => ({
      label,
      route: `/equipos/${id}/${key}`,
    }));
  });
}
