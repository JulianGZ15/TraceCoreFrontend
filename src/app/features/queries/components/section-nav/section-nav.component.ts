import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PageNav, PageNavItem } from '../../../../shared/ui/page';

@Component({
  selector: 'tc-queries-section-nav',
  imports: [PageNav],
  template: `
    <tc-page-nav
      ariaLabel="Módulos de consultas"
      [items]="items"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionNavComponent {
  readonly items: PageNavItem[] = [
    { label: 'Panel operativo', route: '/consultas/panel' },
    { label: 'Inventario', route: '/consultas/inventario' },
    { label: 'Órdenes', route: '/consultas/ordenes' },
  ];
}
