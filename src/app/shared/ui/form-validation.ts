import { AbstractControl } from '@angular/forms';

const VALIDATION_CLASS = 'tc-validation-attempted';
const ERROR_CLASS = 'tc-validation-error';
const SHAKE_CLASS = 'tc-invalid-shake';

/**
 * Marks a form (or a subset of its controls) as attempted and provides a
 * consistent, accessible visual response when validation fails.
 */
export function attemptFormValidation(
  form: AbstractControl,
  controls: readonly AbstractControl[] = [form],
  hostOverride?: HTMLElement | null,
): boolean {
  for (const control of controls) control.markAllAsTouched();
  if (controls.every((control) => control.valid)) {
    clearValidationFeedback(hostOverride ?? findValidationHost());
    return true;
  }

  const host = hostOverride ?? findValidationHost();
  if (host) showValidationFeedback(host);
  return false;
}

export function presentValidationFeedback(host: HTMLElement): void {
  showValidationFeedback(host);
}

export function clearFormValidationFeedback(host: HTMLElement): void {
  clearValidationFeedback(host);
}

function findValidationHost(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  return active.closest<HTMLElement>('form, [formGroup]') ?? active.closest<HTMLElement>('[role="dialog"]');
}

function showValidationFeedback(host: HTMLElement): void {
  host.dataset['tcValidationAttempted'] = 'true';
  host.classList.add(VALIDATION_CLASS);
  const invalid = Array.from(
    host.querySelectorAll<HTMLElement>(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, [formControlName].ng-invalid, [formcontrol].ng-invalid, [role="combobox"].ng-invalid, [aria-invalid="true"]',
    ),
  ).filter(isVisibleControl);

  const message = getOrCreateSummary(host);
  message.textContent = invalid.length
    ? `Hay ${invalid.length} ${invalid.length === 1 ? 'campo' : 'campos'} por corregir. Revisa la información marcada.`
    : 'Revisa los campos obligatorios y su formato.';

  for (const control of invalid) {
    control.setAttribute('aria-invalid', 'true');
    attachFieldMessage(control);
  }

  host.classList.remove(SHAKE_CLASS);
  void host.offsetWidth;
  host.classList.add(SHAKE_CLASS);
  window.setTimeout(() => host.classList.remove(SHAKE_CLASS), 460);

  const first = invalid[0];
  if (first) {
    const focusTarget = first.matches('input, select, textarea, button, [tabindex]')
      ? first
      : first.querySelector<HTMLElement>('input, select, textarea, button[role="combobox"], [tabindex]');
    focusTarget?.focus({ preventScroll: true });
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const scrollToFirstInvalid = () =>
      focusTarget?.scrollIntoView?.({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    if (window.requestAnimationFrame && !reducedMotion) window.requestAnimationFrame(scrollToFirstInvalid);
    else scrollToFirstInvalid();
  }
}

function clearValidationFeedback(host: HTMLElement | null): void {
  if (!host) return;
  host.classList.remove(VALIDATION_CLASS, SHAKE_CLASS);
  delete host.dataset['tcValidationAttempted'];
  host.querySelectorAll<HTMLElement>(`[${ERROR_CLASS}]`).forEach((node) => node.remove());
  host.querySelectorAll<HTMLElement>('[aria-invalid="true"]').forEach((control) => {
    control.removeAttribute('aria-invalid');
  });
}

function getOrCreateSummary(host: HTMLElement): HTMLElement {
  let summary = host.querySelector<HTMLElement>('.tc-validation-summary');
  if (!summary) {
    summary = document.createElement('p');
    summary.className = 'tc-validation-summary field-error';
    summary.setAttribute('role', 'alert');
    summary.setAttribute('aria-live', 'assertive');
    host.prepend(summary);
  }
  return summary;
}

function attachFieldMessage(control: HTMLElement): void {
  const field = control.closest<HTMLElement>('.field');
  if (!field || field.querySelector(`.${ERROR_CLASS}, [role="alert"]`)) return;
  const error = document.createElement('small');
  error.className = `field-error ${ERROR_CLASS}`;
  error.setAttribute('role', 'alert');
  error.textContent = isRequired(control) ? 'Este campo es obligatorio.' : 'Revisa este valor.';
  field.append(error);
}

function isRequired(control: HTMLElement): boolean {
  if (control.hasAttribute('required') || control.getAttribute('aria-required') === 'true') return true;
  const label = control.id
    ? Array.from(document.querySelectorAll<HTMLLabelElement>('label[for]')).find(
        (candidate) => candidate.htmlFor === control.id,
      )
    : control.closest('label');
  return !!label?.textContent?.includes('*');
}

function isVisibleControl(control: HTMLElement): boolean {
  if (control.hasAttribute('disabled') || control.closest('[hidden], [aria-hidden="true"]')) return false;
  return true;
}
