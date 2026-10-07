import { Component, input, inject, computed } from '@angular/core';
import { Session } from '../../../../core/auth/session';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'tc-logistics-section-nav',
  imports: [PageNav],
  templateUrl: './section-nav.component.html',
  styleUrl: './section-nav.component.scss',
})
export class SectionNavComponent {
  readonly session = inject(Session);
  readonly base = input('');
  readonly sections = input<{ key: string; label: string }[]>([]);

  readonly moduleItems = computed<PageNavItem[]>(() => {
    const hasRead = this.session.can('LOGISTICS_READ');
    return [
      { label: 'Manifiestos', route: '/logistica/manifiestos' },
      { label: 'Vehículos', route: '/logistica/vehiculos', visible: hasRead },
      { label: 'Choferes', route: '/logistica/choferes', visible: hasRead },
    ];
  });

  readonly sectionItems = computed<PageNavItem[]>(() => {
    const b = this.base();
    return this.sections().map((s) => ({
      label: s.label,
      route: `${b}/${s.key}`,
    }));
  });
}
