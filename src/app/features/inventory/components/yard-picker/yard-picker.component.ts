import { Component, inject, input, output } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { InventoryAccess } from '../../access';

@Component({
  selector: 'tc-inventory-yard-picker',
  imports: [FormsModule],
  templateUrl: './yard-picker.component.html',
  styleUrl: './yard-picker.component.scss',
})
export class YardPickerComponent {
  readonly access = inject(InventoryAccess);
  readonly value = input('');
  readonly allowGlobal = input(true);
  readonly picked = output<string>();
}
