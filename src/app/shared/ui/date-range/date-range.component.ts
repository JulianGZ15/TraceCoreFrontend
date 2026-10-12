import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Session } from '../../../core/auth/session';
import { DateFieldComponent } from '../date-field/date-field.component';
import { isoToLocalDateTime, localDateTimeToIso } from '../date-field/date-time';

export function toIsoWithZone(localDateTime: string, timeZone: string): string {
  try {
    return localDateTime ? localDateTimeToIso(localDateTime, timeZone || 'America/Mexico_City') : '';
  } catch {
    return localDateTime;
  }
}

export function fromIsoToLocal(isoString: string, timeZone = 'America/Mexico_City'): string {
  if (!isoString) return '';
  try {
    return isoToLocalDateTime(isoString, timeZone);
  } catch {
    return isoString;
  }
}

@Component({
  selector: 'tc-date-range',
  imports: [CommonModule, FormsModule, DateFieldComponent],
  templateUrl: './date-range.component.html',
  styleUrl: './date-range.component.scss',
})
export class DateRangeComponent {
  private session = inject(Session);

  readonly from = input<string>('');
  readonly to = input<string>('');
  readonly fromLabel = input<string>('Desde');
  readonly toLabel = input<string>('Hasta (exclusivo)');
  readonly timeZone = input<string>('');

  readonly rangeChange = output<{ from: string; to: string }>();

  readonly localFrom = signal<string>('');
  readonly localTo = signal<string>('');
  readonly error = signal<string>('');

  get activeTimeZone(): string {
    return (
      this.timeZone() ||
      this.session.context()?.company?.timezone ||
      'America/Mexico_City'
    );
  }

  constructor() {
    effect(() => {
      this.localFrom.set(fromIsoToLocal(this.from(), this.activeTimeZone));
    });
    effect(() => {
      this.localTo.set(fromIsoToLocal(this.to(), this.activeTimeZone));
    });
  }

  onFromChange(val: string): void {
    this.localFrom.set(val);
    this.emitRange();
  }

  onToChange(val: string): void {
    this.localTo.set(val);
    this.emitRange();
  }

  private emitRange(): void {
    const fromVal = this.localFrom();
    const toVal = this.localTo();

    if (fromVal && toVal && fromVal > toVal) {
      this.error.set('La fecha inicial no puede ser posterior a la fecha final.');
      return;
    }

    this.error.set('');
    const tz = this.activeTimeZone;
    this.rangeChange.emit({
      from: fromVal ? toIsoWithZone(fromVal, tz) : '',
      to: toVal ? toIsoWithZone(toVal, tz) : '',
    });
  }
}
