import { Component, computed, inject } from '@angular/core';
import { RfidAccess } from '../../access';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'tc-rfid-nav',
  imports: [PageNav],
  templateUrl: './rfid-nav.component.html',
  styleUrl: './rfid-nav.component.scss',
})
export class RfidNavComponent {
  readonly access = inject(RfidAccess);

  readonly items = computed<PageNavItem[]>(() => {
    const hasRead = this.access.global('RFID_READ');
    const hasManage = this.access.global('RFID_DEVICE_MANAGE') && hasRead;

    return [
      { label: 'Equipos', route: '/rfid/equipos' },
      { label: 'Sesiones', route: '/rfid/sesiones' },
      { label: 'Comandos', route: '/rfid/comandos' },
      { label: 'Pasos de portón', route: '/rfid/pasos' },
      { label: 'Portones', route: '/rfid/portones' },
      { label: 'Modelos de chip', route: '/rfid/modelos-tags', visible: hasRead },
      { label: 'Chips', route: '/rfid/tags', visible: hasRead },
      { label: 'Lectores', route: '/rfid/lectores', visible: hasManage },
      { label: 'Instalaciones', route: '/rfid/dispositivos', visible: hasManage },
      { label: 'Antenas', route: '/rfid/antenas', visible: hasManage },
      { label: 'Entregas', route: '/rfid/entregas', visible: hasManage },
    ];
  });
}
