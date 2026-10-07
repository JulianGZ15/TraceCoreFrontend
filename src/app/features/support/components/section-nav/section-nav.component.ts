import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { PageNav, PageNavItem } from '../../../../shared/ui/page';
import { Session } from '../../../../core/auth/session';
import { QueryAccess } from '../../../queries/access';

@Component({
  selector: 'tc-support-section-nav',
  imports: [PageNav],
  template: `
    <tc-page-nav
      ariaLabel="Módulos de soporte"
      [items]="items()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionNavComponent {
  readonly session = inject(Session);
  readonly access = inject(QueryAccess);

  readonly items = computed<PageNavItem[]>(() => {
    const list: PageNavItem[] = [];
    if (this.access.audit()) {
      list.push({ label: 'Auditoría', route: '/soporte/auditoria' });
    }
    if (
      this.session.can('SUPPORT_READ') &&
      this.access.any('RFID_READ') &&
      this.access.any('QUERY_READ')
    ) {
      list.push({ label: 'Recibos RFID', route: '/soporte/recibos-rfid' });
    }
    return list;
  });
}
