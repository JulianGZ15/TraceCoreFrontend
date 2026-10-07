import { Component, computed } from '@angular/core';
import { QualityPage } from '../../page-base';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'tc-quality-nav',
  imports: [PageNav],
  templateUrl: './quality-nav.component.html',
  styleUrl: './quality-nav.component.scss',
})
export class QualityNavComponent extends QualityPage {
  readonly items = computed<PageNavItem[]>(() => {
    const hasRead = this.access.global('QUALITY_READ');

    return [
      { label: 'Equipos', route: '/calidad/equipos' },
      { label: 'Inspecciones', route: '/calidad/inspecciones' },
      { label: 'Mantenimiento', route: '/calidad/mantenimiento' },
      { label: 'Estándares', route: '/calidad/estandares', visible: hasRead },
      { label: 'Requisitos', route: '/calidad/requisitos', visible: hasRead },
      { label: 'Políticas', route: '/calidad/politicas', visible: hasRead },
      { label: 'MTR', route: '/calidad/mtrs', visible: hasRead },
      { label: 'Evidencias', route: '/calidad/evidencias', visible: hasRead },
    ];
  });
}
