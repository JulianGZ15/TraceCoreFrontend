import { Component, computed, inject } from '@angular/core';
import { InventoryAccess } from '../../access';
import { PageNav, PageNavItem } from '../../../../shared/ui/page-nav/page-nav.component';

@Component({
  selector: 'tc-inventory-inventory-nav',
  imports: [PageNav],
  templateUrl: './inventory-nav.component.html',
  styleUrl: './inventory-nav.component.scss',
})
export class InventoryNavComponent {
  readonly access = inject(InventoryAccess);

  readonly items = computed<PageNavItem[]>(() => {
    const hasGlobal = this.access.global('INVENTORY_READ');
    return [
      { label: 'Patios', route: '/inventario/patios' },
      { label: 'Situación física', route: '/inventario/equipos' },
      { label: 'Movimientos', route: '/inventario/movimientos' },
      { label: 'Reservas', route: '/inventario/reservas' },
      { label: 'Propuestas', route: '/inventario/propuestas' },
      { label: 'Conteos', route: '/inventario/conteos' },
      { label: 'Sitios externos', route: '/inventario/sitios', visible: hasGlobal },
    ];
  });
}
