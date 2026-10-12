import {
  Component,
  forwardRef,
  effect,
  input,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

export type DateFieldMode = 'date' | 'datetime';
export type DateFieldValueFormat = 'local' | 'iso';

function partsFor(value: string, timeZone: string): Record<string, string> {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Fecha y hora inválidas.');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
}

export function isoToLocalDateTime(value: string, timeZone: string): string {
  if (!value) return '';
  const parts = partsFor(value, timeZone);
  return `${parts['year']}-${parts['month']}-${parts['day']}T${parts['hour']}:${parts['minute']}`;
}

function localDateTimeToIso(value: string, timeZone: string): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) throw new RangeError('Indica una fecha y hora válidas.');
  const expected = match.slice(1).map(Number);
  const [year, month, day, hour, minute] = expected;
  const wallTimeAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const utcParts = (stamp: number) => {
    const d = new Date(stamp);
    return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()];
  };
  if (utcParts(wallTimeAsUtc).some((part, index) => part !== expected[index])) {
    throw new RangeError('La fecha y hora no existen.');
  }

  // Resolve a local wall time using the selected IANA zone without relying on
  // the browser machine's time zone. A repeated time resolves to its earlier occurrence.
  let candidate = wallTimeAsUtc;
  for (let attempt = 0; attempt < 4; attempt++) {
    const actual = partsFor(new Date(candidate).toISOString(), timeZone);
    const actualParts = [
      Number(actual['year']),
      Number(actual['month']),
      Number(actual['day']),
      Number(actual['hour']),
      Number(actual['minute']),
    ];
    const actualAsUtc = Date.UTC(
      actualParts[0], actualParts[1] - 1, actualParts[2], actualParts[3], actualParts[4],
    );
    const correction = wallTimeAsUtc - actualAsUtc;
    if (!correction) return new Date(candidate).toISOString();
    candidate += correction;
  }
  const resolved = partsFor(new Date(candidate).toISOString(), timeZone);
  if (
    `${resolved['year']}-${resolved['month']}-${resolved['day']}T${resolved['hour']}:${resolved['minute']}` !== value
  ) {
    throw new RangeError('La hora seleccionada no existe en la zona horaria indicada.');
  }
  return new Date(candidate).toISOString();
}

@Component({
  selector: 'tc-date-field',
  standalone: true,
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
  ],
})
export class DateFieldComponent implements ControlValueAccessor, Validator {
  readonly id = input.required<string>();
  readonly label = input('');
  readonly mode = input<DateFieldMode>('date');
  readonly valueFormat = input<DateFieldValueFormat>('local');
  readonly timeZone = input('');
  readonly min = input('');
  readonly max = input('');
  readonly required = input(false);
  readonly readonly = input(false);

  readonly inputValue = signal('');
  readonly disabled = signal(false);
  readonly conversionError = signal(false);

  private readonly modelValue = signal('');
  private propagateChange: (value: string) => void = () => {};
  private propagateTouched: () => void = () => {};
  private validatorChanged: () => void = () => {};

  constructor() {
    effect(() => {
      const raw = this.modelValue();
      if (this.mode() !== 'datetime' || this.valueFormat() !== 'iso' || !raw) {
        this.inputValue.set(raw);
        this.conversionError.set(false);
      } else {
        try {
          this.inputValue.set(isoToLocalDateTime(raw, this.timeZone()));
          this.conversionError.set(false);
        } catch {
          this.inputValue.set('');
          this.conversionError.set(true);
        }
      }
      this.validatorChanged();
    });
  }

  writeValue(value: unknown): void {
    this.modelValue.set(value == null ? '' : String(value));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChanged = fn;
  }

  validate(_: AbstractControl): ValidationErrors | null {
    if (this.conversionError()) return { dateTimeConversion: true };
    if (this.required() && !this.inputValue()) return { required: true };
    if (
      this.mode() === 'datetime' &&
      this.valueFormat() === 'iso' &&
      this.inputValue() &&
      !this.timeZone()
    ) {
      return { dateTimeZoneRequired: true };
    }
    if (this.mode() === 'datetime' && this.inputValue()) {
      try {
        if (this.valueFormat() === 'iso') localDateTimeToIso(this.inputValue(), this.timeZone());
      } catch {
        return { dateTimeInvalid: true };
      }
    }
    return null;
  }

  onInput(value: string): void {
    this.inputValue.set(value);
    this.modelValue.set('');
    this.conversionError.set(false);
    this.validatorChanged();
    try {
      const next =
        this.mode() === 'datetime' && this.valueFormat() === 'iso'
          ? localDateTimeToIso(value, this.timeZone())
          : value;
      this.propagateChange(next);
    } catch {
      this.conversionError.set(true);
      this.propagateChange('');
      this.validatorChanged();
    }
  }

  onBlur(): void {
    this.propagateTouched();
  }
}
