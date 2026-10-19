import { RegistrationComponent } from './registration.component';
import { render } from '../../../../testing/component-test';
describe('RegistrationComponent', () => {
  it('does not advance until required fields for the current stage are valid', async () => {
    const fixture = await render(RegistrationComponent, {});
    const component = fixture.componentInstance;

    component.next();
    expect(component.step()).toBe(0);
    component.form.controls.categoryUuid.setValue('category-1');
    component.form.controls.modelUuid.setValue('model-1');
    component.form.controls.sheetUuid.setValue('sheet-1');
    component.sheet.set({ state: 'APPROVED' } as never);
    component.next();
    expect(component.step()).toBe(1);

    component.form.controls.internalCode.setValue('EQ-1');
    component.form.controls.origin.setValue('Compra');
    component.next();
    expect(component.step()).toBe(2);
    fixture.destroy();
  });

  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(RegistrationComponent, {});
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tc-stepper li.stepper-item')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('tc-stepper li[aria-current="step"]')).toBeTruthy();
    fixture.destroy();
  });
});
