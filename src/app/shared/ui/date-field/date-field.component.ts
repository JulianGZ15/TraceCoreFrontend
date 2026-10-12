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
import { isoToLocalDateTime, localDateTimeToIso } from './date-time';

export type DateFieldMode = 'date' | 'datetime';
export type DateFieldValueFormat = 'local' | 'iso';

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
  readonly invalid = input(false);
  readonly describedBy = input('');

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
      this.min();
      this.max();
      this.required();
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
    if (this.inputValue() && this.min() && this.inputValue() < this.min()) {
      return { min: { min: this.min(), actual: this.inputValue() } };
    }
    if (this.inputValue() && this.max() && this.inputValue() > this.max()) {
      return { max: { max: this.max(), actual: this.inputValue() } };
    }
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
    this.conversionError.set(false);
    this.validatorChanged();
    try {
      const next =
        this.mode() === 'datetime' && this.valueFormat() === 'iso'
          ? localDateTimeToIso(value, this.timeZone())
          : value;
      this.modelValue.set(next);
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
