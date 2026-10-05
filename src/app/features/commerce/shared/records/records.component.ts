import { Component, input, output, inject } from '@angular/core';
import { Row, Entity } from '../../models';
import { Session } from '../../../../core/auth/session';
import { label, numberText, prettyDate } from '../../rules';
@Component({
  selector: 'tc-commerce-records',
  imports: [],
  templateUrl: './records.component.html',
  styleUrl: './records.component.scss',
})
export class RecordsComponent {
  readonly session = inject(Session);
  readonly rows = input<Row[]>([]);
  readonly columns = input<{ key: string; label: string }[]>([]);
  readonly selected = output<Entity>();
  readonly label = label;
  value(row: Entity, key: string) {
    const v = row[key];
    if (key.endsWith('Exact')) return numberText(v);
    if (v == null) return 'Sin dato';
    if (
      typeof v === 'string' &&
      [
        'orderedAt',
        'receivedAt',
        'validFrom',
        'validTo',
        'plannedFrom',
        'plannedTo',
        'periodFrom',
        'periodTo',
        'actualFrom',
        'actualTo',
      ].includes(key)
    ) {
      try {
        return prettyDate(v, this.session.context()?.company.timezone ?? 'UTC');
      } catch {
        return 'Fecha incompatible';
      }
    }
    return typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number'
      ? label(v)
      : 'Consulta el detalle';
  }
}
