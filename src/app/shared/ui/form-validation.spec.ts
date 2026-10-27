import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { attemptFormValidation, clearFormValidationFeedback } from './form-validation';
import { FormValidationFeedback } from './form-validation-feedback';

describe('attemptFormValidation', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marks empty required controls and reports them beside the field', () => {
    const form = new FormGroup({ name: new FormControl('', Validators.required) });
    document.body.innerHTML = `
      <form>
        <div class="field">
          <label for="name">Nombre *</label>
          <input id="name" formControlName="name" class="ng-invalid ng-untouched">
        </div>
        <button id="save" type="submit">Guardar</button>
      </form>`;
    document.querySelector<HTMLButtonElement>('#save')?.focus();

    expect(attemptFormValidation(form)).toBe(false);
    expect(form.touched).toBe(true);
    expect(document.querySelector('#name')?.getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('.tc-validation-summary')?.textContent).toContain(
      '1 dato pendiente',
    );
    expect(document.querySelector('.tc-validation-error')?.textContent).toBe(
      'Este campo es obligatorio.',
    );
    expect(document.querySelector('#name')?.getAttribute('aria-describedby')).toContain(
      document.querySelector('.tc-validation-error')?.id,
    );
    expect(document.activeElement?.id).toBe('name');
  });

  it('keeps existing format errors visible without calling them required', () => {
    const form = new FormGroup({ code: new FormControl('x', Validators.minLength(3)) });
    document.body.innerHTML = `
      <form>
        <div class="field"><label for="code">Código *</label>
          <input id="code" formControlName="code" required value="x" class="ng-invalid">
        </div>
        <button id="save">Guardar</button>
      </form>`;
    document.querySelector<HTMLButtonElement>('#save')?.focus();

    expect(attemptFormValidation(form)).toBe(false);
    expect(document.querySelector('.tc-validation-error')?.textContent).toBe('Revisa este valor.');
  });

  it('allows a valid form and marks its controls touched', () => {
    const form = new FormGroup({ name: new FormControl('Ada', Validators.required) });

    expect(attemptFormValidation(form)).toBe(true);
    expect(form.touched).toBe(true);
  });

  it('removes only the generated description when a field becomes valid', () => {
    const form = new FormGroup({ name: new FormControl('', Validators.required) });
    document.body.innerHTML = `
      <form>
        <div class="field"><label for="name-cleanup">Nombre *</label>
          <input id="name-cleanup" aria-describedby="help-text" formControlName="name" class="ng-invalid">
        </div>
      </form>`;
    const input = document.querySelector<HTMLInputElement>('#name-cleanup')!;
    attemptFormValidation(form, [form], input.closest('form'));
    input.classList.remove('ng-invalid');
    input.classList.add('ng-valid');
    input.value = 'Traza';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const errorId = input.dataset['tcValidationErrorId'];
    expect(errorId).toBeTruthy();
    clearFormValidationFeedback(input.closest('form')!);
    expect(input.getAttribute('aria-describedby')).toBe('help-text');
    expect(input.dataset['tcValidationErrorId']).toBeUndefined();
  });

  it('stops invalid reactive form submits before their submit handlers run', () => {
    TestBed.configureTestingModule({ providers: [FormValidationFeedback] });
    TestBed.inject(FormValidationFeedback);
    document.body.innerHTML = `
      <form class="ng-invalid">
        <div class="field"><label for="submit-name">Nombre *</label>
          <input id="submit-name" class="ng-invalid">
        </div>
        <button type="submit">Guardar</button>
      </form>`;
    let handlerRan = false;
    const form = document.querySelector('form')!;
    form.addEventListener('submit', () => (handlerRan = true));
    const event = new Event('submit', { bubbles: true, cancelable: true });

    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(handlerRan).toBe(false);
    expect(form.querySelector('.tc-validation-summary')).toBeTruthy();
    TestBed.resetTestingModule();
  });
});
