import { Feedback } from './feedback.component';
import { render } from '../../../testing/component-test';
describe('Feedback', () => {
  it('renders its external template with isolated dependencies', async () => {
    const fixture = await render(Feedback, {});
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.childNodes.length).toBeGreaterThan(0);
  });

  it('emits a safe reload action when an action label is provided', async () => {
    const fixture = await render(Feedback, { message: 'No se pudo cargar.', actionLabel: 'Volver a cargar' });
    let emitted = false;
    fixture.componentInstance.action.subscribe(() => (emitted = true));

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Volver a cargar');
    button.click();

    expect(emitted).toBe(true);
  });
});
