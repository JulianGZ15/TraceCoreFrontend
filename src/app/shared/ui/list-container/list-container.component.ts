import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'tc-list-container',
  templateUrl: './list-container.component.html',
  styleUrl: './list-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListContainer {
  readonly tableLabel = input<string>('Listado de registros');
}
