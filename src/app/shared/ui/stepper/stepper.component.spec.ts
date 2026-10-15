import { StepperComponent, StepperStep } from './stepper.component';
import { render } from '../../../testing/component-test';

describe('StepperComponent', () => {
  const steps: StepperStep[] = [
    { label: 'Contexto' },
    { label: 'Referencias' },
    { label: 'Revisión' },
  ];

  it('shows completed, current and pending steps with accessible state', async () => {
    const fixture = await render(StepperComponent, {
      steps,
      currentStep: 2,
      mode: 'progress',
      ariaLabel: 'Avance del manifiesto',
    });
    fixture.detectChanges();

    const list = fixture.nativeElement.querySelector('ol');
    const items = fixture.nativeElement.querySelectorAll('li.stepper-item');
    expect(list?.getAttribute('aria-label')).toBe('Avance del manifiesto');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Completado');
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[1].textContent).toContain('Paso actual');
    expect(items[2].textContent).toContain('Pendiente');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('emits the selected step only in navigable mode', async () => {
    const fixture = await render(StepperComponent, {
      steps,
      currentStep: 1,
      mode: 'navigable',
    });
    fixture.detectChanges();

    const emitted: number[] = [];
    fixture.componentInstance.stepSelected.subscribe((step) => emitted.push(step));
    const buttons = fixture.nativeElement.querySelectorAll('button.stepper-control');
    buttons[0].click();
    buttons[2].click();

    expect(emitted).toEqual([3]);
    expect(buttons[0].getAttribute('aria-current')).toBe('step');
  });

  it('shows a terminal state without marking later steps complete', async () => {
    const fixture = await render(StepperComponent, {
      steps,
      currentStep: 1,
      mode: 'progress',
      terminalStatus: 'Manifiesto cancelado',
    });
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li.stepper-item');
    expect(items[0].textContent).toContain('Completado');
    expect(items[1].textContent).toContain('Pendiente');
    expect(fixture.nativeElement.querySelector('[aria-current="step"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Manifiesto cancelado',
    );
  });
});
