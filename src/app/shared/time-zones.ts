import { AbstractControl, ValidatorFn } from '@angular/forms';

const fallbackTimeZones = [
  'Africa/Cairo',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Madrid',
  'Pacific/Auckland',
];

const availableTimeZones =
  typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : fallbackTimeZones;

export interface TimeZoneOption {
  value: string;
  label: string;
}

export const TIME_ZONE_OPTIONS: TimeZoneOption[] = [...new Set(['UTC', ...availableTimeZones])]
  .sort((left, right) => left.localeCompare(right))
  .map((zone) => ({ value: zone, label: zone }));

const availableTimeZoneSet = new Set(TIME_ZONE_OPTIONS.map((option) => option.value));

export const timeZoneValidator: ValidatorFn = (control: AbstractControl) => {
  const value = control.value;
  return !value || availableTimeZoneSet.has(String(value)) ? null : { timeZone: true };
};
