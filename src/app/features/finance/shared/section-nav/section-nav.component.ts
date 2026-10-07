import { Component, input, inject, computed } from '@angular/core';
import { Session } from '../../../../core/auth/session';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'tc-finance-section-nav',
  imports: [PageNav],
  templateUrl: './section-nav.component.html',
  styleUrl: './section-nav.component.scss',
})
export class SectionNavComponent {
  readonly currency = input('');
  readonly session = inject(Session);
  readonly base = input('');
  readonly sections = input<{ key: string; label: string }[]>([]);

  readonly moduleItems = computed<PageNavItem[]>(() => {
    const qp = this.currency() ? { currency: this.currency() } : undefined;
    return [
      { label: 'Facturas', route: '/finanzas/facturas', queryParams: qp },
      { label: 'Pagos', route: '/finanzas/pagos', queryParams: qp },
      { label: 'Cargos', route: '/finanzas/cargos', queryParams: qp },
      { label: 'Crédito', route: '/finanzas/cuentas', queryParams: qp },
      { label: 'Compromisos', route: '/finanzas/compromisos', queryParams: qp },
      { label: 'Reversos', route: '/finanzas/reversos', queryParams: qp },
      { label: 'Divisas', route: '/finanzas/divisas', queryParams: qp },
    ];
  });

  readonly sectionItems = computed<PageNavItem[]>(() => {
    const b = this.base();
    const qp = this.currency() ? { currency: this.currency() } : undefined;
    return this.sections().map((s) => ({
      label: s.label,
      route: `${b}/${s.key}`,
      queryParams: qp,
    }));
  });
}

