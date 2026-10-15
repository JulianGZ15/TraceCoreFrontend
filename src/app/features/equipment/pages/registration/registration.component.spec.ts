import { RegistrationComponent } from './registration.component';
import { render } from '../../../../testing/component-test';
describe('RegistrationComponent', () => {
  it('renderiza su plantilla con dependencias aisladas', async () => {
    const fixture = await render(RegistrationComponent, {});
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('tc-stepper li.stepper-item')).toHaveLength(4);
    expect(fixture.nativeElement.querySelector('tc-stepper li[aria-current="step"]')).toBeTruthy();
    fixture.destroy();
  });
});
