import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type TableLayout = 'content' | 'fill';
export type TableAppearance = 'panel' | 'embedded';

@Component({
  selector: 'tc-data-table',
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.tc-table-fill]': "layout() === 'fill'",
    '[class.tc-table-panel]': "appearance() === 'panel'",
    '[style.--tc-table-min-width]': 'minTableWidth()',
  },
})
export class DataTable {
  readonly label = input.required<string>();
  readonly busy = input(false);
  readonly layout = input<TableLayout>('content');
  readonly appearance = input<TableAppearance>('panel');
  readonly minTableWidth = input<string | null>(null);
}
