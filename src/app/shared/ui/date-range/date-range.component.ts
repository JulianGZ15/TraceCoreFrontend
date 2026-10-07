import { Component, input, output, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Session } from '../../../core/auth/session';

export function toIsoWithZone(localDateTime: string, timeZone: string): string {
  if (!localDateTime) return '';
  if (localDateTime.includes('Z') || /[+-]\d{2}:\d{2}$/.test(localDateTime)) {
    return localDateTime;
  }
  try {
    const d = new Date(localDateTime);
    if (isNaN(d.getTime())) return localDateTime;
    const tz = timeZone || 'America/Mexico_City';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(d);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    const match = tzPart?.match(/GMT([+-]\d{2}:\d{2})/);
    const offset = match ? match[1] : '+00:00';
    const seconds = localDateTime.length === 16 ? ':00' : '';
    return `${localDateTime}${seconds}${offset}`;
  } catch {
    return localDateTime;
  }
}

export function fromIsoToLocal(isoString: string): string {
  if (!isoString) return '';
  const match = isoString.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : isoString;
}

@Component({
  selector: 'tc-date-range',
  imports: [CommonModule, FormsModule],
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
      this.localFrom.set(fromIsoToLocal(this.from()));
    });
    effect(() => {
      this.localTo.set(fromIsoToLocal(this.to()));
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
