import { Component, input, inject, computed } from '@angular/core';
import { Session } from '../../../../core/auth/session';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'tc-commerce-section-nav',
  imports: [PageNav],
  templateUrl: './section-nav.component.html',
  styleUrl: './section-nav.component.scss',
})
export class SectionNavComponent {
  readonly session = inject(Session);
  readonly base = input('');
  readonly sections = input<{ key: string; label: string }[]>([]);

  readonly moduleItems = computed<PageNavItem[]>(() => [
    { label: 'Órdenes', route: '/comercial/ordenes' },
    { label: 'Rentas', route: '/comercial/rentas' },
    { label: 'Recepciones', route: '/comercial/recepciones' },
    {
      label: 'Contratos marco',
      route: '/comercial/marcos',
      visible: this.session.can('COMMERCIAL_READ'),
    },
  ]);

  readonly sectionItems = computed<PageNavItem[]>(() => {
    const b = this.base();
    return this.sections().map((s) => ({
      label: s.label,
      route: `${b}/${s.key}`,
    }));
  });
}
