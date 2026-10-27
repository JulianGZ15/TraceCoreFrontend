import { OrderComponent } from './order.component';
import { renderOperation } from '../../../../testing/operation-test';
describe('OrderComponent', () => {
  it('renders with route and parent context; write controls remain permission-bound', async () => {
    const fixture = await renderOperation(OrderComponent, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });

  it('keeps the visible order date valid after switching the order type', async () => {
    const fixture = await renderOperation(OrderComponent, {
      context: { yard: 'yard-uuid' },
    });
    const component = fixture.componentInstance;
    const initialValue = component.form.controls['orderedAt'].value;
    expect(component.form.controls['orderedAt'].valid).toBe(true);

    component.form.controls['type'].setValue('OR');
    fixture.detectChanges();

    const dateControl = component.form.controls['orderedAt'];
    const dateInput = fixture.nativeElement.querySelector(
      '#commerce-orderedAt',
    ) as HTMLInputElement;
    expect(dateControl.value).toBe(initialValue);
    expect(dateControl.valid).toBe(true);
    expect(dateInput.value).not.toBe('');
    expect(dateInput.getAttribute('aria-invalid')).not.toBe('true');

    dateInput.value = '2026-10-26T19:02';
    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(dateControl.value).toBe('2026-10-26T19:02:00+00:00');
    expect(dateControl.valid).toBe(true);
  });

  it('keeps a non-convertible date visible and reports its actual validation error', async () => {
    const fixture = await renderOperation(OrderComponent, {
      context: { yard: 'yard-uuid' },
    });
    const component = fixture.componentInstance;
    component.form.controls['type'].setValue('OR');
    fixture.detectChanges();
    component.form.controls['timezone'].setValue('Actual');
    component.form.controls['timezone'].markAsTouched();
    fixture.detectChanges();

    const dateControl = component.form.controls['orderedAt'];
    const dateInput = fixture.nativeElement.querySelector(
      '#commerce-orderedAt',
    ) as HTMLInputElement;
    dateInput.value = '2026-10-26T19:02';
    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    dateControl.markAsTouched();
    fixture.detectChanges();

    expect(dateInput.value).toBe('2026-10-26T19:02');
    expect(dateControl.value).toBe('2026-10-26T19:02');
    expect(dateControl.hasError('required')).toBe(false);
    expect(dateControl.hasError('dateTimeConversion')).toBe(true);
    expect(component.form.controls['timezone'].hasError('timeZone')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('#commerce-orderedAt-error')?.textContent,
    ).toContain('zona horaria');
    expect(
      fixture.nativeElement.querySelector('#commerce-timezone-error')?.textContent,
    ).toContain('IANA válida');
  });
});
