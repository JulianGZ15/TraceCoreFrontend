import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { InventoryAccess } from '../../access';

@Component({
  selector: 'tc-inventory-inventory-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './inventory-nav.component.html',
  styleUrl: './inventory-nav.component.scss',
})
export class InventoryNavComponent {
  readonly access = inject(InventoryAccess);
  readonly links = [
    ['patios', 'Patios'],
    ['equipos', 'Situación física'],
    ['movimientos', 'Movimientos'],
    ['reservas', 'Reservas'],
    ['propuestas', 'Propuestas'],
    ['conteos', 'Conteos'],
  ];
}
