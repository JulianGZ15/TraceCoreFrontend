import { Validators, ValidatorFn } from '@angular/forms';
export interface Field {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'checkbox' | 'select' | 'datetime';
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  validators?: ValidatorFn[];
  disabled?: boolean;
}
export interface EditorData {
  title: string;
  description?: string;
  fields: Field[];
  initial?: Record<string, unknown>;
  save: (values: Record<string, unknown>) => Promise<unknown>;
  reload?: () => Promise<Record<string, unknown>>;
}
export const newPassword: ValidatorFn = (control) =>
  typeof control.value === 'string' &&
  control.value.length >= 12 &&
  new TextEncoder().encode(control.value).length <= 72
    ? null
    : { password: true };
export const codeValidator = Validators.pattern(/^[A-Za-z][A-Za-z0-9_:-]{0,79}$/);
