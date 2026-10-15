import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { StepperComponent, StepperStep } from '../../../../shared/ui/stepper/stepper.component';
import { Summary } from '../../models';

@Component({
  selector: 'tc-logistics-process-progress',
  imports: [StepperComponent],
  templateUrl: './process-progress.component.html',
  styleUrl: './process-progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessProgressComponent {
  readonly summary = input<Summary | null>(null);
  readonly steps: readonly StepperStep[] = [
    { label: 'Carga' },
    { label: 'Viaje' },
    { label: 'Verificación' },
    { label: 'Despacho' },
    { label: 'Entrega' },
  ];

  readonly progress = computed(() => {
    const summary = this.summary();
    if (!summary) return null;

    const state = summary.manifest.state;
    if (state === 'CANCELLED') {
      const checkExists = typeof summary.manifest['dispatchCheckUuid'] === 'string';
      const completedSteps = checkExists ? 3 : summary.trip ? 2 : 1;
      return { currentStep: completedSteps, terminalStatus: 'Manifiesto cancelado' };
    }

    if (state === 'DRAFT') return { currentStep: summary.trip ? 3 : 2, terminalStatus: '' };
    if (state === 'CHECKED') return { currentStep: 4, terminalStatus: '' };
    if (state === 'IN_TRANSIT' || state === 'PARTIALLY_DELIVERED') {
      return { currentStep: 5, terminalStatus: '' };
    }
    if (state === 'DELIVERED') return { currentStep: this.steps.length + 1, terminalStatus: '' };
    return null;
  });
}
