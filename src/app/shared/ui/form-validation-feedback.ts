import { DOCUMENT } from '@angular/common';
import { Injectable, OnDestroy, inject } from '@angular/core';
import { clearFormValidationFeedback, presentValidationFeedback } from './form-validation';

@Injectable({ providedIn: 'root' })
export class FormValidationFeedback implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly onSubmit = (event: Event) => {
    const form = event.target;
    const FormElement = this.document.defaultView?.HTMLFormElement;
    if (!FormElement || !(form instanceof FormElement)) return;
    if (!form.classList.contains('ng-invalid')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    presentValidationFeedback(form);
    this.markVisibleControlsTouched(form);
  };
  private readonly onInput = (event: Event) => {
    const target = event.target;
    const Element = this.document.defaultView?.HTMLElement;
    if (!Element || !(target instanceof Element)) return;
    const form = target.closest<HTMLFormElement>('form');
    if (!form) return;

    window.setTimeout(() => {
      const control = target.closest<HTMLElement>('[aria-invalid="true"]');
      if (control?.classList.contains('ng-valid')) {
        control.removeAttribute('aria-invalid');
        control.closest('.field')?.querySelector('.tc-validation-error')?.remove();
      }
      if (form.classList.contains('ng-valid')) clearFormValidationFeedback(form);
      else this.updateSummary(form);
    });
  };

  constructor() {
    this.document.addEventListener('submit', this.onSubmit, true);
    this.document.addEventListener('input', this.onInput, true);
    this.document.addEventListener('change', this.onInput, true);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('submit', this.onSubmit, true);
    this.document.removeEventListener('input', this.onInput, true);
    this.document.removeEventListener('change', this.onInput, true);
  }

  private markVisibleControlsTouched(form: HTMLFormElement): void {
    form.querySelectorAll<HTMLElement>(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, [formControlName].ng-invalid, [formcontrol].ng-invalid, [role="combobox"].ng-invalid',
    ).forEach((control) => {
      const target = control.matches('input, select, textarea')
        ? control
        : control.querySelector<HTMLElement>('input, select, textarea, [role="combobox"]') ?? control;
      const BlurEvent = this.document.defaultView?.FocusEvent;
      if (BlurEvent) target.dispatchEvent(new BlurEvent('blur', { bubbles: false }));
    });
  }

  private updateSummary(form: HTMLFormElement): void {
    const summary = form.querySelector<HTMLElement>('.tc-validation-summary');
    if (!summary) return;
    const count = form.querySelectorAll(
      'input.ng-invalid, select.ng-invalid, textarea.ng-invalid, [formControlName].ng-invalid, [formcontrol].ng-invalid, [role="combobox"].ng-invalid',
    ).length;
    summary.textContent = count
      ? `Hay ${count} ${count === 1 ? 'campo' : 'campos'} por corregir. Revisa la información marcada.`
      : 'Revisa los campos obligatorios y su formato.';
  }
}
